/**
 * WordPress SQL Dump Parser
 * ─────────────────────────
 * Streams the Softaculous MySQL dump and extracts relevant tables
 * into JSON files under scripts/wp-data/ for the import phase.
 *
 * Usage:  npx tsx scripts/wp-parse.ts /path/to/softsql.sql
 */

import { createReadStream } from "fs";
import { writeFile, mkdir } from "fs/promises";
import { createInterface } from "readline";
import path from "path";

const WP_PREFIX = "vpn8899_";
const OUT_DIR = path.join(__dirname, "wp-data");

// Tables we care about
const TABLES_OF_INTEREST = [
  `${WP_PREFIX}posts`,
  `${WP_PREFIX}postmeta`,
  `${WP_PREFIX}terms`,
  `${WP_PREFIX}term_taxonomy`,
  `${WP_PREFIX}term_relationships`,
];

// ── MySQL value parser ──────────────────────────────────────────────
// Parses a single row like: (1, 'hello', NULL, 'it\\'s ok')
function parseRow(line: string): (string | null)[] {
  const values: (string | null)[] = [];
  let i = 0;

  // Skip leading '('
  while (i < line.length && line[i] !== "(") i++;
  i++; // skip '('

  while (i < line.length) {
    // Skip whitespace
    while (i < line.length && line[i] === " ") i++;

    if (line[i] === ")" || i >= line.length) break;

    if (line[i] === "'") {
      // String value
      i++; // skip opening quote
      let val = "";
      while (i < line.length) {
        if (line[i] === "\\") {
          // Escaped character
          i++;
          if (i < line.length) {
            switch (line[i]) {
              case "n":
                val += "\n";
                break;
              case "r":
                val += "\r";
                break;
              case "t":
                val += "\t";
                break;
              case "0":
                val += "\0";
                break;
              case "\\":
                val += "\\";
                break;
              case "'":
                val += "'";
                break;
              case '"':
                val += '"';
                break;
              default:
                val += line[i];
            }
            i++;
          }
        } else if (line[i] === "'") {
          i++; // skip closing quote
          break;
        } else {
          val += line[i];
          i++;
        }
      }
      values.push(val);
    } else if (
      line[i] === "N" &&
      line[i + 1] === "U" &&
      line[i + 2] === "L" &&
      line[i + 3] === "L"
    ) {
      values.push(null);
      i += 4;
    } else {
      // Numeric value
      let val = "";
      while (i < line.length && line[i] !== "," && line[i] !== ")") {
        val += line[i];
        i++;
      }
      values.push(val.trim());
    }

    // Skip comma separator
    while (i < line.length && (line[i] === "," || line[i] === " ")) {
      if (line[i] === ",") {
        i++;
        break;
      }
      i++;
    }
  }

  return values;
}

// ── Table schemas (column indices) ──────────────────────────────────

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

interface WpPostMeta {
  postId: number;
  metaKey: string;
  metaValue: string | null;
}

interface WpTerm {
  termId: number;
  name: string;
  slug: string;
}

interface WpTermTaxonomy {
  termTaxonomyId: number;
  termId: number;
  taxonomy: string;
  description: string;
  parent: number;
  count: number;
}

interface WpTermRelationship {
  objectId: number;
  termTaxonomyId: number;
}

function rowToPost(cols: (string | null)[]): WpPost | null {
  if (cols.length < 23) return null;
  return {
    id: parseInt(cols[0]!),
    authorId: parseInt(cols[1]!),
    date: cols[2]!,
    dateGmt: cols[3]!,
    content: cols[4] ?? "",
    title: cols[5] ?? "",
    excerpt: cols[6] ?? "",
    status: cols[7] ?? "",
    slug: cols[11] ?? "",
    postParent: parseInt(cols[17] ?? "0"),
    guid: cols[18] ?? "",
    postType: cols[20] ?? "",
    mimeType: cols[21] ?? "",
  };
}

function rowToPostMeta(cols: (string | null)[]): WpPostMeta | null {
  if (cols.length < 4) return null;
  return {
    postId: parseInt(cols[1]!),
    metaKey: cols[2] ?? "",
    metaValue: cols[3],
  };
}

function rowToTerm(cols: (string | null)[]): WpTerm | null {
  if (cols.length < 3) return null;
  return {
    termId: parseInt(cols[0]!),
    name: cols[1] ?? "",
    slug: cols[2] ?? "",
  };
}

function rowToTermTaxonomy(cols: (string | null)[]): WpTermTaxonomy | null {
  if (cols.length < 6) return null;
  return {
    termTaxonomyId: parseInt(cols[0]!),
    termId: parseInt(cols[1]!),
    taxonomy: cols[2] ?? "",
    description: cols[3] ?? "",
    parent: parseInt(cols[4] ?? "0"),
    count: parseInt(cols[5] ?? "0"),
  };
}

function rowToTermRelationship(cols: (string | null)[]): WpTermRelationship | null {
  if (cols.length < 2) return null;
  return {
    objectId: parseInt(cols[0]!),
    termTaxonomyId: parseInt(cols[1]!),
  };
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const sqlPath = process.argv[2];
  if (!sqlPath) {
    console.error("Usage: npx tsx scripts/wp-parse.ts /path/to/softsql.sql");
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });

  const posts: WpPost[] = [];
  const postMeta: WpPostMeta[] = [];
  const terms: WpTerm[] = [];
  const termTaxonomy: WpTermTaxonomy[] = [];
  const termRelationships: WpTermRelationship[] = [];

  let currentTable = "";
  let lineCount = 0;
  let rowCount = 0;

  const rl = createInterface({
    input: createReadStream(sqlPath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  console.log("Parsing SQL dump...");
  const startTime = Date.now();

  for await (const line of rl) {
    lineCount++;

    if (lineCount % 500_000 === 0) {
      console.log(
        `  ... ${lineCount.toLocaleString()} lines (${posts.length.toLocaleString()} posts, ${postMeta.length.toLocaleString()} meta, ${termRelationships.length.toLocaleString()} rels)`
      );
    }

    // Detect INSERT INTO statements
    if (line.startsWith("INSERT INTO")) {
      const match = line.match(/INSERT INTO `([^`]+)`/);
      if (match) {
        currentTable = match[1];
        if (!TABLES_OF_INTEREST.includes(currentTable)) {
          currentTable = "";
        }
      }
      // If the VALUES are on the same line (unlikely for multi-row), parse them
      if (currentTable && line.includes("VALUES") && line.includes("(")) {
        const valuesStart = line.indexOf("VALUES") + 6;
        const remainder = line.substring(valuesStart).trim();
        if (remainder.startsWith("(")) {
          // There might be inline rows — but typically they're on next lines
          // Handle the case where rows are on the same line as INSERT
        }
      }
      continue;
    }

    // Parse data rows for tables of interest
    if (currentTable && line.startsWith("(")) {
      // Each line can contain one row: (val, val, ...),  or  (val, val, ...);
      const trimmed = line.replace(/,\s*$/, "").replace(/;\s*$/, "");
      const cols = parseRow(trimmed);
      rowCount++;

      switch (currentTable) {
        case `${WP_PREFIX}posts`: {
          const p = rowToPost(cols);
          if (p) posts.push(p);
          break;
        }
        case `${WP_PREFIX}postmeta`: {
          const m = rowToPostMeta(cols);
          // Only keep meta keys we need
          if (
            m &&
            [
              "_thumbnail_id",
              "_wp_attached_file",
              "_wp_attachment_image_alt",
              "_yoast_wpseo_metadesc",
              "_yoast_wpseo_title",
              "_yoast_wpseo_focuskw",
            ].includes(m.metaKey)
          ) {
            postMeta.push(m);
          }
          break;
        }
        case `${WP_PREFIX}terms`: {
          const t = rowToTerm(cols);
          if (t) terms.push(t);
          break;
        }
        case `${WP_PREFIX}term_taxonomy`: {
          const tt = rowToTermTaxonomy(cols);
          if (tt) termTaxonomy.push(tt);
          break;
        }
        case `${WP_PREFIX}term_relationships`: {
          const tr = rowToTermRelationship(cols);
          if (tr) termRelationships.push(tr);
          break;
        }
      }
    }

    // End of INSERT block
    if (currentTable && line.startsWith("--")) {
      currentTable = "";
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nParsed ${lineCount.toLocaleString()} lines in ${elapsed}s`);
  console.log(`  Posts:              ${posts.length.toLocaleString()}`);
  console.log(`  PostMeta:           ${postMeta.length.toLocaleString()}`);
  console.log(`  Terms:              ${terms.length.toLocaleString()}`);
  console.log(`  TermTaxonomy:       ${termTaxonomy.length.toLocaleString()}`);
  console.log(`  TermRelationships:  ${termRelationships.length.toLocaleString()}`);

  // ── Filter to only what we need ───────────────────────────────────

  // Published posts only (post, attachment, track, music, audio, download)
  const relevantTypes = new Set(["post", "attachment", "track", "music", "audio", "download"]);
  const relevantStatuses = new Set(["publish", "inherit"]);

  const filteredPosts = posts.filter(
    (p) => relevantTypes.has(p.postType) && relevantStatuses.has(p.status)
  );

  console.log(
    `\nFiltered posts (published + relevant types): ${filteredPosts.length.toLocaleString()}`
  );

  // Break down by type
  const typeCounts = new Map<string, number>();
  for (const p of filteredPosts) {
    typeCounts.set(p.postType, (typeCounts.get(p.postType) ?? 0) + 1);
  }
  for (const [type, count] of typeCounts) {
    console.log(`  ${type}: ${count.toLocaleString()}`);
  }

  // Category terms only
  const categoryTaxIds = new Set(
    termTaxonomy.filter((tt) => tt.taxonomy === "category").map((tt) => tt.termTaxonomyId)
  );
  const tagTaxIds = new Set(
    termTaxonomy.filter((tt) => tt.taxonomy === "post_tag").map((tt) => tt.termTaxonomyId)
  );

  console.log(`  Categories: ${categoryTaxIds.size}`);
  console.log(`  Tags: ${tagTaxIds.size}`);

  // ── Write JSON files ──────────────────────────────────────────────

  console.log("\nWriting JSON files...");

  await writeFile(path.join(OUT_DIR, "posts.json"), JSON.stringify(filteredPosts, null, 0));
  console.log(`  posts.json (${filteredPosts.length} records)`);

  await writeFile(path.join(OUT_DIR, "postmeta.json"), JSON.stringify(postMeta, null, 0));
  console.log(`  postmeta.json (${postMeta.length} records)`);

  await writeFile(path.join(OUT_DIR, "terms.json"), JSON.stringify(terms, null, 0));
  console.log(`  terms.json (${terms.length} records)`);

  await writeFile(path.join(OUT_DIR, "term_taxonomy.json"), JSON.stringify(termTaxonomy, null, 0));
  console.log(`  term_taxonomy.json (${termTaxonomy.length} records)`);

  await writeFile(
    path.join(OUT_DIR, "term_relationships.json"),
    JSON.stringify(termRelationships, null, 0)
  );
  console.log(`  term_relationships.json (${termRelationships.length} records)`);

  // ── Build convenience lookup maps ─────────────────────────────────

  // Map: term_taxonomy_id → { termId, taxonomy }
  const ttMap = new Map(
    termTaxonomy.map((tt) => [tt.termTaxonomyId, { termId: tt.termId, taxonomy: tt.taxonomy }])
  );

  // Map: term_id → { name, slug }
  const termMap = new Map(terms.map((t) => [t.termId, { name: t.name, slug: t.slug }]));

  // For each post, resolve its category and tags
  const postTerms = new Map<number, { categories: string[]; tags: string[] }>();
  for (const tr of termRelationships) {
    const tt = ttMap.get(tr.termTaxonomyId);
    if (!tt) continue;
    const term = termMap.get(tt.termId);
    if (!term) continue;

    if (!postTerms.has(tr.objectId)) {
      postTerms.set(tr.objectId, { categories: [], tags: [] });
    }
    const entry = postTerms.get(tr.objectId)!;
    if (tt.taxonomy === "category") {
      entry.categories.push(term.slug);
    } else if (tt.taxonomy === "post_tag") {
      entry.tags.push(term.slug);
    }
  }

  await writeFile(
    path.join(OUT_DIR, "post_terms.json"),
    JSON.stringify(Object.fromEntries(postTerms), null, 0)
  );
  console.log(`  post_terms.json (${postTerms.size} entries)`);

  // ── Build thumbnail map ───────────────────────────────────────────
  // _thumbnail_id links post → attachment post ID
  // _wp_attached_file links attachment post → file path

  const thumbnailIds = new Map<number, number>(); // post_id → attachment_id
  const attachedFiles = new Map<number, string>(); // post_id → file path
  const imageAlts = new Map<number, string>(); // post_id → alt text

  for (const m of postMeta) {
    switch (m.metaKey) {
      case "_thumbnail_id":
        if (m.metaValue) thumbnailIds.set(m.postId, parseInt(m.metaValue));
        break;
      case "_wp_attached_file":
        if (m.metaValue) attachedFiles.set(m.postId, m.metaValue);
        break;
      case "_wp_attachment_image_alt":
        if (m.metaValue) imageAlts.set(m.postId, m.metaValue);
        break;
    }
  }

  // Resolve: post_id → thumbnail file path
  const postThumbnails = new Map<number, string>();
  for (const [postId, attachId] of thumbnailIds) {
    const filePath = attachedFiles.get(attachId);
    if (filePath) {
      postThumbnails.set(postId, filePath);
    }
  }

  await writeFile(
    path.join(OUT_DIR, "post_thumbnails.json"),
    JSON.stringify(Object.fromEntries(postThumbnails), null, 0)
  );
  console.log(`  post_thumbnails.json (${postThumbnails.size} entries)`);

  // ── Attachment file map ───────────────────────────────────────────
  await writeFile(
    path.join(OUT_DIR, "attached_files.json"),
    JSON.stringify(Object.fromEntries(attachedFiles), null, 0)
  );
  console.log(`  attached_files.json (${attachedFiles.size} entries)`);

  // ── Summary stats ─────────────────────────────────────────────────
  const stats = {
    totalLines: lineCount,
    totalRows: rowCount,
    parseDuration: elapsed,
    posts: {
      total: filteredPosts.length,
      byType: Object.fromEntries(typeCounts),
    },
    postMeta: postMeta.length,
    terms: terms.length,
    categories: categoryTaxIds.size,
    tags: tagTaxIds.size,
    thumbnails: postThumbnails.size,
    attachedFiles: attachedFiles.size,
  };

  await writeFile(path.join(OUT_DIR, "stats.json"), JSON.stringify(stats, null, 2));
  console.log(`  stats.json`);

  console.log("\nDone! JSON files written to scripts/wp-data/");
  console.log("Next step: npx tsx scripts/wp-import.ts");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
