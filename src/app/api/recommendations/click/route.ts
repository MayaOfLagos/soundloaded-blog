import { NextRequest, NextResponse } from "next/server";
import {
  RecommendationEntityType,
  RecommendationEventName,
  RecommendationSurface,
} from "@prisma/client";
import { auth } from "@/lib/auth";
import { getCreatorEntityContext, mergeCreatorEventMetadata } from "@/lib/creator-growth-events";
import { writeInteractionEvent } from "@/lib/recommendation";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const entityType = parseEnum(RecommendationEntityType, body.entityType);
  const surface = parseEnum(RecommendationSurface, body.surface);
  const entityId = readString(body.entityId);

  if (!entityType || !surface || !entityId) {
    return NextResponse.json({ error: "Missing recommendation click fields" }, { status: 400 });
  }

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
  const eventName =
    surface === RecommendationSurface.SEARCH_RESULTS
      ? RecommendationEventName.SEARCH_RESULT_CLICK
      : RecommendationEventName.RECOMMENDATION_CLICK;
  const entityContext = await getCreatorEntityContext(entityType, entityId);

  await writeInteractionEvent({
    eventName,
    entityType,
    entityId,
    userId,
    surface,
    position: readNumber(body.position),
    recommendationRequestId: readString(body.recommendationRequestId),
    candidateSource: readString(body.candidateSource),
    reasonKey: readString(body.reasonKey),
    queryText: readString(body.queryText)?.slice(0, 200).toLowerCase(),
    referrerEntityType: parseEnum(RecommendationEntityType, body.referrerEntityType),
    referrerEntityId: readString(body.referrerEntityId),
    artistId: entityContext.artistId,
    albumId: entityContext.albumId,
    genre: entityContext.genre,
    metadata: mergeCreatorEventMetadata(entityContext.metadata, {
      source: "client_click",
      href: readString(body.href),
    }),
  });

  return NextResponse.json({ ok: true });
}

function parseEnum<T extends Record<string, string>>(
  enumObject: T,
  value: unknown
): T[keyof T] | null {
  return typeof value === "string" && Object.values(enumObject).includes(value)
    ? (value as T[keyof T])
    : null;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
}
