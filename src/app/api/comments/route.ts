import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { notifyComment, notifyCommentReply } from "@/lib/services/notifications";
import {
  RecommendationEntityType,
  RecommendationEventName,
  RecommendationSurface,
} from "@prisma/client";
import { trackInteractionEvent } from "@/lib/recommendation";

// Rate limit: 5 comments per hour per IP
const commentRatelimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(5, "1 h"),
        prefix: "soundloadedblog:comment",
      })
    : null;

// ── GET: Fetch approved comments for a post ──────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  const page = parseInt(searchParams.get("page") ?? "1");

  if (!postId) {
    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  }

  // Get current user for like status
  const session = await auth();
  const currentUserId = (session?.user as { id?: string } | undefined)?.id;

  const settings = await getSettings();
  const limit = settings.commentsPerPage;
  const orderDir = settings.commentOrder === "newest" ? ("desc" as const) : ("asc" as const);

  const likeSelect = {
    likes: {
      select: { type: true, userId: true },
    },
  };

  const [comments, total] = await Promise.all([
    db.comment.findMany({
      where: { postId, status: "APPROVED", parentId: null },
      orderBy: { createdAt: orderDir },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        body: true,
        createdAt: true,
        guestName: true,
        guestWebsite: true,
        author: { select: { id: true, name: true, image: true } },
        ...likeSelect,
        replies: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            body: true,
            createdAt: true,
            guestName: true,
            guestWebsite: true,
            author: { select: { id: true, name: true, image: true } },
            ...likeSelect,
          },
        },
      },
    }),
    db.comment.count({
      where: { postId, status: "APPROVED", parentId: null },
    }),
  ]);

  // Map comments to include like/dislike counts and user's like status
  const mapLikes = (
    comment: (typeof comments)[number] | (typeof comments)[number]["replies"][number]
  ) => {
    const likes = "likes" in comment ? (comment.likes as { type: string; userId: string }[]) : [];
    const likeCount = likes.filter((l) => l.type === "LIKE").length;
    const dislikeCount = likes.filter((l) => l.type === "DISLIKE").length;
    const userLike = currentUserId
      ? (likes.find((l) => l.userId === currentUserId)?.type ?? null)
      : null;

    const { likes: _likes, ...rest } = comment as (typeof comments)[number] & { likes: unknown };
    return { ...rest, likeCount, dislikeCount, userLike };
  };

  const enrichedComments = comments.map((c) => ({
    ...mapLikes(c),
    replies: c.replies.map((r) => mapLikes(r)),
  }));

  return NextResponse.json({ comments: enrichedComments, total, commentsPerPage: limit });
}

// ── POST: Submit a comment (auth or guest) ───────────────────────────
const commentSchema = z.object({
  postId: z.string().min(1),
  body: z.string().min(1, "Comment cannot be empty").max(2000).trim(),
  parentId: z.string().optional(),
  guestName: z.string().min(2).max(80).optional(),
  guestEmail: z.string().email().optional(),
  guestWebsite: z.string().url().optional().or(z.literal("")),
});

/** Check if text contains any blocklist/moderation words (one per line) */
function containsKeyword(text: string, keywords: string): boolean {
  if (!keywords.trim()) return false;
  const lower = text.toLowerCase();
  return keywords
    .split("\n")
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean)
    .some((kw) => lower.includes(kw));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = commentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 422 });
    }

    const data = parsed.data;

    // Check settings — use full DB record for admin-only fields
    const settings = await getSettings();
    const fullSettings = await db.siteSettings.findUnique({ where: { id: "default" } });

    if (!settings.enableComments) {
      return NextResponse.json({ error: "Comments are closed." }, { status: 403 });
    }

    // Rate limiting by IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (commentRatelimit) {
      const { success } = await commentRatelimit.limit(ip);
      if (!success) {
        return NextResponse.json(
          { error: "You're commenting too fast. Try again later." },
          { status: 429 }
        );
      }
    }

    // Check auth
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;
    const userRole = (session?.user as { role?: string } | undefined)?.role;

    // Require login if setting is enabled
    if (settings.requireLoginToComment && !userId) {
      return NextResponse.json({ error: "You must be logged in to comment." }, { status: 401 });
    }

    // Guest requires name + email
    if (!userId && (!data.guestName || !data.guestEmail)) {
      return NextResponse.json(
        { error: "Name and email are required for guest comments." },
        { status: 422 }
      );
    }

    // Verify post exists, is published, and comments are still open
    const post = await db.post.findUnique({
      where: { id: data.postId },
      select: { id: true, status: true, publishedAt: true, authorId: true },
    });
    if (!post || post.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    // Auto-close comments after X days
    if (settings.closeCommentsAfterDays > 0 && post.publishedAt) {
      const closedAt = new Date(post.publishedAt);
      closedAt.setDate(closedAt.getDate() + settings.closeCommentsAfterDays);
      if (new Date() > closedAt) {
        return NextResponse.json({ error: "Comments are closed on this post." }, { status: 403 });
      }
    }

    // Verify parent comment belongs to same post
    let parentCommentAuthorId: string | null = null;
    if (data.parentId) {
      const parent = await db.comment.findUnique({
        where: { id: data.parentId },
        select: { postId: true, authorId: true },
      });
      if (!parent || parent.postId !== data.postId) {
        return NextResponse.json({ error: "Invalid parent comment." }, { status: 400 });
      }
      parentCommentAuthorId = parent.authorId;
    }

    // Check blocklist (reject immediately)
    const blocklistWords = fullSettings?.commentBlocklist ?? "";
    const blocklistCheck = [data.body, data.guestName, data.guestEmail, ip]
      .filter(Boolean)
      .join(" ");
    if (containsKeyword(blocklistCheck, blocklistWords)) {
      return NextResponse.json({ error: "Your comment has been rejected." }, { status: 403 });
    }

    // Determine initial status
    let status: "PENDING" | "APPROVED" = "PENDING";
    if (settings.autoApproveComments) {
      status = "APPROVED";
    } else if (
      userId &&
      userRole &&
      ["CONTRIBUTOR", "EDITOR", "ADMIN", "SUPER_ADMIN"].includes(userRole)
    ) {
      status = "APPROVED";
    }

    // Require previously approved comment (only for non-staff)
    const requirePrevApproved = fullSettings?.commentPreviouslyApproved ?? false;
    if (
      status === "APPROVED" &&
      requirePrevApproved &&
      !(userRole && ["CONTRIBUTOR", "EDITOR", "ADMIN", "SUPER_ADMIN"].includes(userRole))
    ) {
      const identifier = userId
        ? { authorId: userId }
        : data.guestEmail
          ? { guestEmail: data.guestEmail }
          : null;

      if (identifier) {
        const priorApproved = await db.comment.count({
          where: { ...identifier, status: "APPROVED" },
        });
        if (priorApproved === 0) {
          status = "PENDING";
        }
      } else {
        status = "PENDING";
      }
    }

    // Hold if comment contains too many links
    const maxLinks = fullSettings?.commentMaxLinks ?? 2;
    if (status === "APPROVED" && maxLinks > 0) {
      const linkCount = (data.body.match(/https?:\/\//gi) || []).length;
      if (linkCount >= maxLinks) {
        status = "PENDING";
      }
    }

    // Check moderation keywords (force to PENDING even if auto-approve is on)
    const moderationWords = fullSettings?.commentModerationKeywords ?? "";
    if (status === "APPROVED" && containsKeyword(data.body, moderationWords)) {
      status = "PENDING";
    }

    const comment = await db.comment.create({
      data: {
        body: data.body,
        postId: data.postId,
        parentId: data.parentId || null,
        authorId: userId || null,
        guestName: userId ? null : data.guestName,
        guestEmail: userId ? null : data.guestEmail,
        guestWebsite: userId ? null : data.guestWebsite || null,
        status,
      },
      select: {
        id: true,
        body: true,
        status: true,
        createdAt: true,
        guestName: true,
        author: { select: { name: true, image: true } },
      },
    });
    if (comment.status === "APPROVED") {
      trackInteractionEvent({
        eventName: RecommendationEventName.POST_COMMENT_CREATE,
        entityType: RecommendationEntityType.POST,
        entityId: data.postId,
        userId,
        surface: RecommendationSurface.POST_DETAIL,
        weightHint: 6,
        metadata: { parentId: data.parentId ?? null },
      });
    }

    // In-app notifications (fire-and-forget)
    if (userId && comment.status === "APPROVED" && session?.user) {
      const actorName = (session.user as { name?: string }).name ?? "Someone";

      // Notify post owner about the comment
      if (post.authorId) {
        notifyComment(userId, actorName, post.authorId, data.postId).catch(() => {});
      }

      // Notify parent comment author about the reply
      if (parentCommentAuthorId) {
        notifyCommentReply(userId, actorName, parentCommentAuthorId, data.postId).catch(() => {});
      }
    }

    // Send email notifications (fire-and-forget)
    const emailOnNew = fullSettings?.emailOnNewComment ?? true;
    const emailOnMod = fullSettings?.emailOnModeration ?? true;
    const adminEmail = fullSettings?.contactEmail || fullSettings?.emailFromAddress;

    if (adminEmail) {
      const shouldNotify =
        (comment.status === "APPROVED" && emailOnNew) ||
        (comment.status === "PENDING" && emailOnMod);

      if (shouldNotify) {
        sendCommentNotification({
          to: adminEmail,
          commentBody: data.body,
          authorName: comment.author?.name ?? comment.guestName ?? "Guest",
          postId: data.postId,
          isPending: comment.status === "PENDING",
          siteUrl: settings.siteUrl,
        }).catch(() => {});
      }
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to post comment." }, { status: 500 });
  }
}

async function sendCommentNotification({
  to,
  commentBody,
  authorName,
  postId: _postId,
  isPending,
  siteUrl,
}: {
  to: string;
  commentBody: string;
  authorName: string;
  postId: string;
  isPending: boolean;
  siteUrl: string;
}) {
  try {
    const { resend, FROM_EMAIL } = await import("@/lib/resend");
    const subject = isPending
      ? `[Moderation] New comment awaiting review`
      : `New comment on your post`;

    const moderateUrl = `${siteUrl}/admin/comments`;
    const truncatedBody =
      commentBody.length > 200 ? commentBody.slice(0, 200) + "..." : commentBody;

    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 500px;">
          <h2 style="margin: 0 0 16px;">${isPending ? "Comment Held for Review" : "New Comment Posted"}</h2>
          <p><strong>${authorName}</strong> wrote:</p>
          <blockquote style="border-left: 3px solid #e11d48; padding-left: 12px; color: #555; margin: 12px 0;">
            ${truncatedBody}
          </blockquote>
          ${isPending ? `<p><a href="${moderateUrl}" style="color: #e11d48;">Review in Admin &rarr;</a></p>` : ""}
        </div>
      `,
    });
  } catch {
    // Email failures should never block comment creation
  }
}
