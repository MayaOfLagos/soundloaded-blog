/**
 * WordPress → Soundloaded Import
 * ───────────────────────────────
 * Reads parsed JSON from scripts/wp-data/ and imports into Prisma.
 * Uploads original media files to Cloudflare R2.
 *
 * Usage:
 *   npx tsx scripts/wp-import.ts --uploads /path/to/wp-content/uploads
 *
 * Options:
 *   --uploads <path>    Path to wp-content/uploads directory
 *   --dry-run           Preview without writing to DB or R2
 *   --skip-media        Skip media upload (posts only)
 *   --batch <n>         Batch size for Prisma creates (default: 50)
 *   --offset <n>        Skip first N posts (for resuming)
 *   --limit <n>         Only import N posts (for testing)
 */

import { readFile, stat } from "fs/promises";
import { createReadStream, existsSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { lookup } from "mime-types";
import crypto from "crypto";

// ── Load .env ───────────────────────────────────────────────────────
import "dotenv/config";

const db = new PrismaClient();
const DATA_DIR = path.join(__dirname, "wp-data");

// ── R2 client ───────────────────────────────────────────────────────
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const MEDIA_BUCKET = process.env.R2_MEDIA_BUCKET ?? "soundloadedblog-media";
const MUSIC_BUCKET = process.env.R2_MUSIC_BUCKET ?? "soundloadedblog-music";
const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL ?? "";
// MUSIC_CDN_URL used when uploading audio to R2
// const MUSIC_CDN_URL = process.env.NEXT_PUBLIC_MUSIC_CDN_URL ?? "";

// ── WP Category → Our System mapping ───────────────────────────────
const CATEGORY_MAP: Record<string, string> = {
  "download-mp3": "music",
  "main-video": "video",
  "naija-gist": "gist",
  "naija-news": "news",
  entertainment: "news",
  trending: "news",
  information: "news",
  television: "video",
  uncategorized: "news",
};

// Category display names
const CATEGORY_NAMES: Record<string, string> = {
  music: "Music",
  video: "Video",
  gist: "Gist",
  news: "News",
};

// WP category slug → our PostType enum
const CATEGORY_TO_POST_TYPE: Record<string, string> = {
  music: "MUSIC",
  video: "VIDEO",
  gist: "GIST",
  news: "NEWS",
};

// ── Types ───────────────────────────────────────────────────────────

interface WpPost {
  id: number;
  authorId: number;
  date: string;
  dateGmt: string;
  content: string;
  title: string;
  excerpt: string;
  status: string;
  slug: string;
  postParent: number;
  guid: string;
  postType: string;
  mimeType: string;
}

interface ParsedArgs {
  uploadsPath: string;
  dryRun: boolean;
  skipMedia: boolean;
  batchSize: number;
  offset: number;
  limit: number;
}

// ── CLI args ────────────────────────────────────────────────────────

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2);
  const result: ParsedArgs = {
    uploadsPath: "",
    dryRun: false,
    skipMedia: false,
    batchSize: 50,
    offset: 0,
    limit: Infinity,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--uploads":
        result.uploadsPath = args[++i];
        break;
      case "--dry-run":
        result.dryRun = true;
        break;
      case "--skip-media":
        result.skipMedia = true;
        break;
      case "--batch":
        result.batchSize = parseInt(args[++i]);
        break;
      case "--offset":
        result.offset = parseInt(args[++i]);
        break;
      case "--limit":
        result.limit = parseInt(args[++i]);
        break;
    }
  }

  return result;
}

// ── Helpers ─────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 190);
}

/** Upload a local file to R2 and return the R2 key */
async function uploadToR2(
  localPath: string,
  bucket: string,
  prefix: string,
  dryRun: boolean
): Promise<{ r2Key: string; fileSize: number } | null> {
  if (!existsSync(localPath)) return null;

  const fileStat = await stat(localPath);
  if (fileStat.size === 0) return null;

  const ext = path.extname(localPath).toLowerCase();
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const r2Key = `${prefix}/${id}${ext}`;
  const contentType = lookup(localPath) || "application/octet-stream";

  if (dryRun) {
    return { r2Key, fileSize: fileStat.size };
  }

  const stream = createReadStream(localPath);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  const body = Buffer.concat(chunks);

  await r2.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: r2Key,
      Body: body,
      ContentType: contentType,
    })
  );

  return { r2Key, fileSize: fileStat.size };
}

/** Resolve WP upload path to local filesystem path */
function resolveUploadPath(uploadsDir: string, wpPath: string): string {
  // wpPath is like "2019/03/image.jpg" (relative to wp-content/uploads)
  return path.join(uploadsDir, wpPath);
}

/** Strip HTML tags and extract plain text for excerpt generation */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Generate excerpt from HTML content (first 200 chars of plain text) */
function generateExcerpt(html: string, maxLength = 200): string | null {
  const plain = stripHtml(html);
  if (!plain) return null;
  if (plain.length <= maxLength) return plain;
  return plain.slice(0, maxLength).replace(/\s+\S*$/, "") + "...";
}

/** Convert WP HTML content to a TipTap-compatible JSON structure */
function htmlToTipTapBody(html: string): object {
  // Store the raw HTML as a TipTap doc with an HTML node
  // The frontend can render this with dangerouslySetInnerHTML or a custom renderer
  if (!html || html.trim() === "") {
    return {
      type: "doc",
      content: [{ type: "paragraph", content: [] }],
    };
  }

  // Split HTML into paragraphs and create TipTap nodes
  // For the import, we store the raw HTML in a custom htmlBlock node
  return {
    type: "doc",
    content: [
      {
        type: "htmlBlock",
        attrs: { html },
      },
    ],
  };
}

/** Parse WP date string to Date object */
function parseWpDate(dateStr: string): Date | null {
  if (!dateStr || dateStr === "0000-00-00 00:00:00") return null;
  const d = new Date(dateStr.replace(" ", "T") + "Z");
  return isNaN(d.getTime()) ? null : d;
}

// ── Main import ─────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();

  if (!args.uploadsPath) {
    console.error("Usage: npx tsx scripts/wp-import.ts --uploads /path/to/wp-content/uploads");
    process.exit(1);
  }

  if (args.dryRun) console.log("🔍 DRY RUN — no writes to DB or R2\n");
  if (args.skipMedia) console.log("⏭️  Skipping media uploads\n");

  // ── Load parsed data ─────────────────────────────────────────────
  console.log("Loading parsed WordPress data...");

  const posts: WpPost[] = JSON.parse(await readFile(path.join(DATA_DIR, "posts.json"), "utf8"));
  const postTerms: Record<string, { categories: string[]; tags: string[] }> = JSON.parse(
    await readFile(path.join(DATA_DIR, "post_terms.json"), "utf8")
  );
  const postThumbnails: Record<string, string> = JSON.parse(
    await readFile(path.join(DATA_DIR, "post_thumbnails.json"), "utf8")
  );
  const attachedFiles: Record<string, string> = JSON.parse(
    await readFile(path.join(DATA_DIR, "attached_files.json"), "utf8")
  );
  const terms: { termId: number; name: string; slug: string }[] = JSON.parse(
    await readFile(path.join(DATA_DIR, "terms.json"), "utf8")
  );
  const termTaxonomy: {
    termTaxonomyId: number;
    termId: number;
    taxonomy: string;
    count: number;
  }[] = JSON.parse(await readFile(path.join(DATA_DIR, "term_taxonomy.json"), "utf8"));

  console.log(`  ${posts.length.toLocaleString()} posts loaded`);
  console.log(`  ${Object.keys(postTerms).length.toLocaleString()} post-term mappings`);
  console.log(`  ${Object.keys(postThumbnails).length.toLocaleString()} thumbnails`);

  // ── Phase 1: Create categories ────────────────────────────────────
  console.log("\n── Phase 1: Categories ──");

  const categoryIds = new Map<string, string>(); // slug → prisma id

  for (const [slug, name] of Object.entries(CATEGORY_NAMES)) {
    if (args.dryRun) {
      console.log(`  [DRY] Would create category: ${name} (${slug})`);
      categoryIds.set(slug, `dry-${slug}`);
      continue;
    }

    const existing = await db.category.findUnique({ where: { slug } });
    if (existing) {
      console.log(`  Category exists: ${name} (${slug})`);
      categoryIds.set(slug, existing.id);
    } else {
      const cat = await db.category.create({
        data: { name, slug },
      });
      console.log(`  Created category: ${name} (${slug})`);
      categoryIds.set(slug, cat.id);
    }
  }

  // ── Phase 2: Extract and create artists ───────────────────────────
  console.log("\n── Phase 2: Artists ──");

  // Find tags that appear frequently (likely artist names)
  // Tags with 50+ posts are probably artist names
  const termById = new Map(terms.map((t) => [t.termId, t]));
  const tagCounts = new Map<number, number>();
  for (const tt of termTaxonomy) {
    if (tt.taxonomy === "post_tag") {
      tagCounts.set(tt.termId, tt.count);
    }
  }

  // Artist candidates: tags with 50+ posts
  const ARTIST_MIN_POSTS = 50;
  const artistCandidates = Array.from(tagCounts.entries())
    .filter(([, count]) => count >= ARTIST_MIN_POSTS)
    .map(([termId, count]) => {
      const term = termById.get(termId);
      return term ? { name: term.name, slug: term.slug, count } : null;
    })
    .filter(Boolean) as { name: string; slug: string; count: number }[];

  // Filter out non-artist tags (generic terms)
  const SKIP_TAGS = new Set([
    // Generic site/content terms
    "soundloaded",
    "news",
    "music",
    "video",
    "download",
    "mp3",
    "naija",
    "nigeria",
    "entertainment",
    "gist",
    "trending",
    "latest",
    "free",
    "new",
    "hot",
    "top",
    "best",
    "lyrics",
    "album",
    "ep",
    "mixtape",
    "audio",
    "song",
    "track",
    "ft",
    "featuring",
    "remix",
    "cover",
    "songs",
    "videos",
    "hit",
    "hits",
    "tunes",
    "release",
    "exclusive",
    "playlist",
    "single",
    // Years
    "2019",
    "2020",
    "2021",
    "2022",
    "2023",
    "2024",
    // Generic descriptors (not artist names)
    "music-video",
    "official",
    "official-music-video",
    "official-video",
    "new-music",
    "new-song",
    "comedy",
    "choreography",
    "african",
    "afro",
    "afro-beats",
    "afro-beat",
    "afrobeats",
    "afrobeat",
    "afropop",
    "afro-pop",
    "afro-fusion",
    "afro-music",
    "amapiano",
    "reggae",
    "dancehall",
    "hip-hop",
    "hiphop",
    "rnb",
    "r-b",
    "pop",
    "pop-music",
    "rap",
    "soul",
    "highlife",
    "nigerian",
    "ghana",
    "nigerian-music",
    "ghana-music",
    "african-music",
    "nigeria-music",
    "south-african-music",
    // Non-artist descriptors
    "dj",
    "freestyle",
    "live",
    "performance",
    "interview",
    "funny",
    "reaction",
    "reactions",
    "reaction-video",
    "music-reaction",
    "reacting-to-afrobeats",
    "review",
    "tutorial",
    "concert",
    "acoustic",
    "instrumental",
    "producer",
    "director",
    "billboard",
    "vevo",
    "youtube",
    "tiktok",
    "viral",
    "nollywood",
    "nollywood-love",
    "breaking-news",
    "lifestyle",
    "london",
    "lagos",
    "kenya",
    "uk",
    "jamaica",
    "peru",
    "africa",
    "world",
    "love",
    "boy",
    "the",
    "of",
    "hip",
    "hop",
    "beat",
    "records",
    "genre",
    "fun",
    "tv",
    // Compound non-artist tags
    "banks-reactions",
    "afrobeats-2022",
    "wizkid-news",
    "davido-news",
    "burnaboy-news",
    "nigerian-artists",
    "nigerian-entertainment",
    "naija-music",
    "naija-hip-pop",
    "naija-club-hits",
    "free-naija-videos",
    "free-naija-music",
    "best-selling-music-videos",
    "best-nigerian-videos",
    "best-nigerian-music-videos",
    "latest-naija-music-2011",
    "top-10",
    "nyc",
    "#nyc",
    "#mix",
    "#inshot",
    "attention",
    "calm-down",
    "emiliana",
    "essence",
    "ameno-amapiano",
    "no-wahala",
    "sip",
    "baddest-boy",
    "ome-ope",
    "love-nwantiti",
    "dem-mama",
    "do-me",
    "rush",
    "machala",
    "artist",
    "cubreacts",
    "adamslink-media",
    "goldmynetv",
    "goldmyne",
    "videowheels",
    "naijamusic",
    "africagentltd",
    "mentamusic",
    "menta-music",
    "movie",
    "(musical",
    'movie"',
    "christmas",
    "yoruba",
    // "X songs" / "X videos" / "X latest song" pattern tags — not real artists
    "fireboy-songs",
    "davido-timeless",
    "ayra-starr-songs",
    "khaid-songs",
    "joeboy-songs",
    "johnny-drille-songs",
    "rexxie-songs",
    "bnxn-songs",
    "buju-latest-song",
    "timaya-songs",
    "mr-p-songs",
    "rudeboy-songs",
    "p-square-songs",
    "sugarboy-songs",
    "iyanya-songs",
    "blaqbonez-songs",
    "machala-song",
    "simi-videos",
    "tiwa-savage-songs",
    "tems-videos",
    "portable-songs",
    "boy-spyce-songs",
    "magixx-songs",
    "rema-videos",
    "seyi-vibez-songs",
    "zinoleesky-latest-song",
    "odumodublvck-songs",
    "zlatan-ibile",
    "mavins-songs",
    "korra-obidi",
    "davido-songs",
    "2face-videos",
    "rema-calm-down",
    "fireboy-dml-peru",
    "fireboy-dml-peru-ed-sheeran",
    "fireboy-dml-ed-sheeran",
    "davido-timeless-album",
    "wizkid-essence",
    "ayra-starr-rush",
    "burnaboy",
    "khaid-songs",
    "joeboy-songs",
    "starboy",
    "aj-tracey",
    "khaligraph-jones",
    "square-records",
    "iroko-music",
    // More non-artist generic terms
    "afrobeat-music",
    "afrobeat-playlist",
    "favorite",
    "greatest",
    "joyboy",
    "ye",
    "sony",
    "soso",
    "mi",
    "burna",
    "#inshot",
    "#mix",
    "(musical",
    "mavin",
    "mavin-records",
    "mavins",
    "wasiu-ayinde-2018",
    "azonto",
    "r-amp-b",
    "r&amp;b",
    // Keep empty/whitespace
    "",
    " ",
  ]);

  // Also filter out tags that start with special characters or look like nonsense
  const isValidArtistName = (name: string) => {
    if (name.startsWith("#") || name.startsWith("(")) return false;
    if (name.length < 2) return false;
    if (/^\d+$/.test(name)) return false; // pure numbers
    return true;
  };

  const artists = artistCandidates.filter(
    (a) =>
      !SKIP_TAGS.has(a.slug.toLowerCase()) &&
      !SKIP_TAGS.has(a.name.toLowerCase()) &&
      isValidArtistName(a.name)
  );

  console.log(`  Found ${artists.length} potential artists (tags with ${ARTIST_MIN_POSTS}+ posts)`);

  const artistIds = new Map<string, string>(); // slug → prisma id

  for (const artist of artists) {
    if (args.dryRun) {
      console.log(`  [DRY] Would create artist: ${artist.name} (${artist.count} posts)`);
      artistIds.set(artist.slug, `dry-${artist.slug}`);
      continue;
    }

    const existing = await db.artist.findUnique({
      where: { slug: artist.slug },
    });
    if (existing) {
      artistIds.set(artist.slug, existing.id);
    } else {
      const created = await db.artist.create({
        data: {
          name: artist.name,
          slug: artist.slug,
          country: "Nigeria",
        },
      });
      artistIds.set(artist.slug, created.id);
    }
  }
  // Create/find a fallback "Various Artists" for tracks without a matched artist
  let fallbackArtistId: string;
  if (args.dryRun) {
    fallbackArtistId = "dry-various";
  } else {
    const va = await db.artist.findUnique({ where: { slug: "various-artists" } });
    if (va) {
      fallbackArtistId = va.id;
    } else {
      const created = await db.artist.create({
        data: { name: "Various Artists", slug: "various-artists", country: "Nigeria" },
      });
      fallbackArtistId = created.id;
    }
  }

  console.log(`  Created/found ${artistIds.size} artists (+ "Various Artists" fallback)`);

  // ── Phase 3: Get or create admin user for authorship ──────────────
  console.log("\n── Phase 3: Author ──");

  let authorId: string;
  if (args.dryRun) {
    authorId = "dry-author";
    console.log("  [DRY] Would use first admin user as author");
  } else {
    const admin = await db.user.findFirst({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      select: { id: true, name: true },
    });
    if (!admin) {
      console.error("  No admin user found! Create one first, then re-run the import.");
      process.exit(1);
    }
    authorId = admin.id;
    console.log(`  Using author: ${admin.name} (${admin.id})`);
  }

  // ── Phase 4: Import posts ────────────────────────────────────────
  console.log("\n── Phase 4: Import Posts ──");

  // Filter to only "post" type (articles) — music handled separately
  const articlePosts = posts
    .filter((p) => p.postType === "post" && p.status === "publish")
    .sort((a, b) => a.id - b.id);

  const postsToImport = articlePosts.slice(args.offset, args.offset + args.limit);

  console.log(
    `  Importing ${postsToImport.length.toLocaleString()} articles (of ${articlePosts.length.toLocaleString()} total)`
  );

  let imported = 0;
  let skipped = 0;
  let mediaUploaded = 0;
  let errors = 0;

  for (let i = 0; i < postsToImport.length; i += args.batchSize) {
    const batch = postsToImport.slice(i, i + args.batchSize);

    for (const wpPost of batch) {
      try {
        // Determine category
        const wpTerms = postTerms[wpPost.id.toString()];
        const wpCatSlug = wpTerms?.categories?.[0] ?? "uncategorized";
        const ourCatSlug = CATEGORY_MAP[wpCatSlug] ?? "news";
        const categoryId = categoryIds.get(ourCatSlug);
        const postType = CATEGORY_TO_POST_TYPE[ourCatSlug] ?? "NEWS";

        // Skip posts with empty title
        if (!wpPost.title || wpPost.title.trim() === "") {
          skipped++;
          continue;
        }

        // Generate slug — ensure uniqueness
        let slug = wpPost.slug || slugify(wpPost.title);
        if (!slug) slug = `post-${wpPost.id}`;

        // Check for slug collision
        if (!args.dryRun) {
          const existingSlug = await db.post.findUnique({
            where: { slug },
            select: { id: true },
          });
          if (existingSlug) {
            slug = `${slug}-${wpPost.id}`;
          }
        }

        // Upload featured image
        let coverImage: string | null = null;
        const thumbnailPath = postThumbnails[wpPost.id.toString()];
        if (thumbnailPath && !args.skipMedia) {
          const localPath = resolveUploadPath(args.uploadsPath, thumbnailPath);
          const result = await uploadToR2(localPath, MEDIA_BUCKET, "wp-images", args.dryRun);
          if (result) {
            coverImage = `${CDN_URL}/${result.r2Key}`;
            mediaUploaded++;
          }
        }

        // Parse publish date
        const publishedAt = parseWpDate(wpPost.dateGmt) ?? parseWpDate(wpPost.date) ?? new Date();

        // Create post
        if (!args.dryRun) {
          await db.post.create({
            data: {
              title: wpPost.title,
              slug,
              excerpt: wpPost.excerpt || generateExcerpt(wpPost.content),
              body: htmlToTipTapBody(wpPost.content),
              coverImage,
              status: "PUBLISHED",
              type: postType as
                | "NEWS"
                | "MUSIC"
                | "GIST"
                | "VIDEO"
                | "LYRICS"
                | "ALBUM"
                | "COMMUNITY",
              publishedAt,
              authorId,
              categoryId: categoryId ?? undefined,
            },
          });
        }

        imported++;

        if (imported % 100 === 0) {
          console.log(
            `  ... ${imported.toLocaleString()} / ${postsToImport.length.toLocaleString()} imported (${mediaUploaded} media, ${skipped} skipped, ${errors} errors)`
          );
        }
      } catch (err) {
        errors++;
        if (errors <= 10) {
          console.error(
            `  Error importing post ${wpPost.id} "${wpPost.title.slice(0, 50)}":`,
            (err as Error).message
          );
        }
      }
    }
  }

  console.log(
    `\n  Articles done: ${imported} imported, ${skipped} skipped, ${errors} errors, ${mediaUploaded} media uploaded`
  );

  // ── Phase 5: Import music tracks ──────────────────────────────────
  console.log("\n── Phase 5: Import Music Tracks ──");

  const musicPosts = posts.filter(
    (p) => ["track", "music", "audio", "download"].includes(p.postType) && p.status === "publish"
  );

  // Also include "post" type posts that are in the Music category
  const musicCategoryArticles = posts.filter((p) => {
    if (p.postType !== "post" || p.status !== "publish") return false;
    const wpTerms = postTerms[p.id.toString()];
    const wpCatSlug = wpTerms?.categories?.[0];
    return wpCatSlug === "download-mp3";
  });

  const allMusicPosts = [...musicPosts, ...musicCategoryArticles];
  console.log(`  Found ${allMusicPosts.length.toLocaleString()} music-related posts`);

  // For music posts, try to find the associated audio file
  // Audio attachments are child posts (post_parent = music post ID) with audio mime type
  const audioAttachments = posts.filter(
    (p) => p.postType === "attachment" && p.mimeType.startsWith("audio/")
  );

  // Map: parent post ID → audio attachment
  const audioByParent = new Map<number, WpPost>();
  for (const att of audioAttachments) {
    if (att.postParent > 0) {
      audioByParent.set(att.postParent, att);
    }
  }

  // Also build a map of attachment ID → file path
  const attachmentFiles = new Map<number, string>();
  for (const att of posts.filter((p) => p.postType === "attachment")) {
    const filePath = attachedFiles[att.id.toString()];
    if (filePath) {
      attachmentFiles.set(att.id, filePath);
    }
  }

  console.log(
    `  Found ${audioAttachments.length} audio attachments, ${audioByParent.size} linked to parent posts`
  );

  // Get music category ID
  const musicCategoryId = categoryIds.get("music");

  let musicImported = 0;
  let musicSkipped = 0;
  let musicErrors = 0;
  let audioUploaded = 0;

  for (const wpPost of allMusicPosts) {
    try {
      if (!wpPost.title || wpPost.title.trim() === "") {
        musicSkipped++;
        continue;
      }

      // Find audio file
      const audioAtt = audioByParent.get(wpPost.id);
      let audioFilePath: string | null = null;
      if (audioAtt) {
        const attFile = attachedFiles[audioAtt.id.toString()];
        if (attFile) {
          audioFilePath = resolveUploadPath(args.uploadsPath, attFile);
        }
      }

      // Also check if the post content contains a direct link to an audio file
      if (!audioFilePath && wpPost.content) {
        const audioMatch = wpPost.content.match(/href="[^"]*\/wp-content\/uploads\/([^"]*\.mp3)"/i);
        if (audioMatch) {
          audioFilePath = resolveUploadPath(args.uploadsPath, audioMatch[1]);
        }
      }

      // Generate slug
      let slug = wpPost.slug || slugify(wpPost.title);
      if (!slug) slug = `track-${wpPost.id}`;

      if (!args.dryRun) {
        // Check both Post slug and Music slug for collisions
        const [existingPostSlug, existingMusicSlug] = await Promise.all([
          db.post.findUnique({ where: { slug: `music-${slug}` }, select: { id: true } }),
          db.music.findUnique({ where: { slug }, select: { id: true } }),
        ]);
        if (existingPostSlug || existingMusicSlug) {
          slug = `${slug}-${wpPost.id}`;
        }
      }

      // Upload cover image
      let coverImage: string | null = null;
      const thumbnailPath = postThumbnails[wpPost.id.toString()];
      if (thumbnailPath && !args.skipMedia) {
        const localPath = resolveUploadPath(args.uploadsPath, thumbnailPath);
        const result = await uploadToR2(localPath, MEDIA_BUCKET, "wp-covers", args.dryRun);
        if (result) {
          coverImage = `${CDN_URL}/${result.r2Key}`;
        }
      }

      // Upload audio file
      let r2Key: string | null = null;
      let audioFileSize = 0;
      let audioFilename = "";

      if (audioFilePath && !args.skipMedia && existsSync(audioFilePath)) {
        const result = await uploadToR2(audioFilePath, MUSIC_BUCKET, "wp-music", args.dryRun);
        if (result) {
          r2Key = result.r2Key;
          audioFileSize = result.fileSize;
          audioFilename = path.basename(audioFilePath);
          audioUploaded++;
        }
      }

      // Find artist from tags
      const wpTerms = postTerms[wpPost.id.toString()];
      let artistId: string | null = null;
      if (wpTerms?.tags) {
        for (const tagSlug of wpTerms.tags) {
          if (artistIds.has(tagSlug)) {
            artistId = artistIds.get(tagSlug)!;
            break;
          }
        }
      }

      const publishedAt = parseWpDate(wpPost.dateGmt) ?? parseWpDate(wpPost.date) ?? new Date();

      if (!args.dryRun) {
        // Create companion Post + Music atomically
        await db.$transaction(async (tx) => {
          const post = await tx.post.create({
            data: {
              title: wpPost.title,
              slug: `music-${slug}`,
              body: htmlToTipTapBody(wpPost.content),
              coverImage,
              type: "MUSIC",
              status: "PUBLISHED",
              publishedAt,
              authorId,
              categoryId: musicCategoryId ?? undefined,
              enableDownload: true,
            },
          });

          if (r2Key) {
            await tx.music.create({
              data: {
                title: wpPost.title,
                slug,
                r2Key,
                filename: audioFilename,
                fileSize: BigInt(audioFileSize),
                format: "mp3",
                coverArt: coverImage,
                artistId: artistId ?? fallbackArtistId,
                postId: post.id,
                enableDownload: true,
                year: publishedAt.getFullYear(),
              },
            });
          }
        });
      }

      musicImported++;

      if (musicImported % 100 === 0) {
        console.log(
          `  ... ${musicImported.toLocaleString()} / ${allMusicPosts.length.toLocaleString()} music posts processed`
        );
      }
    } catch (err) {
      musicErrors++;
      if (musicErrors <= 10) {
        console.error(
          `  Error importing music ${wpPost.id} "${wpPost.title.slice(0, 50)}":`,
          (err as Error).message
        );
      }
    }
  }

  console.log(
    `\n  Music done: ${musicImported} imported, ${musicSkipped} skipped, ${musicErrors} errors, ${audioUploaded} audio files uploaded`
  );

  // ── Summary ───────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════");
  console.log("  IMPORT COMPLETE");
  console.log("═══════════════════════════════════");
  console.log(`  Categories:     ${categoryIds.size}`);
  console.log(`  Artists:        ${artistIds.size}`);
  console.log(`  Articles:       ${imported}`);
  console.log(`  Music tracks:   ${musicImported}`);
  console.log(`  Media uploaded: ${mediaUploaded + audioUploaded}`);
  console.log(`  Total errors:   ${errors + musicErrors}`);
  if (args.dryRun) {
    console.log("\n  This was a DRY RUN — nothing was written.");
  }

  await db.$disconnect();
}

main().catch(async (err) => {
  console.error("Fatal error:", err);
  await db.$disconnect();
  process.exit(1);
});
