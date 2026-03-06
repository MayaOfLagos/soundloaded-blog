/**
 * Permalink URL generation and resolution.
 *
 * Supported tags:
 *   %postname%   → post slug
 *   %category%   → category slug (falls back to "uncategorized")
 *   %year%       → 4-digit year from publishedAt
 *   %monthnum%   → 2-digit month
 *   %day%        → 2-digit day
 *   %post_id%    → post ID
 *   %author%     → author name slugified
 */

interface PostForUrl {
  slug: string;
  id: string;
  publishedAt?: Date | string | null;
  category?: { slug: string } | null;
  author?: { name: string | null } | null;
}

/**
 * Build the URL path for a post given the permalink structure.
 * Always returns a path starting with "/".
 */
export function getPostUrl(post: PostForUrl, permalinkStructure = "/%postname%"): string {
  const pubDate = post.publishedAt ? new Date(post.publishedAt) : new Date();

  const categorySlug = post.category?.slug || "uncategorized";
  const authorSlug = slugify(post.author?.name || "author");

  let url = permalinkStructure
    .replace(/%postname%/g, post.slug)
    .replace(/%category%/g, categorySlug)
    .replace(/%year%/g, String(pubDate.getFullYear()))
    .replace(/%monthnum%/g, String(pubDate.getMonth() + 1).padStart(2, "0"))
    .replace(/%day%/g, String(pubDate.getDate()).padStart(2, "0"))
    .replace(/%post_id%/g, post.id)
    .replace(/%author%/g, authorSlug);

  // Ensure starts with /
  if (!url.startsWith("/")) url = "/" + url;
  // Remove trailing slash (except root)
  if (url.length > 1 && url.endsWith("/")) url = url.slice(0, -1);

  return url;
}

/**
 * Given URL path segments and a permalink structure,
 * extract the post slug (postname) to use for DB lookup.
 *
 * Returns null if the segments don't match the pattern.
 */
export function resolveSlugFromSegments(
  segments: string[],
  permalinkStructure = "/%postname%"
): string | null {
  // Split the permalink structure into parts (remove leading /)
  const patternParts = permalinkStructure.replace(/^\//, "").split("/").filter(Boolean);

  // Quick mismatch on segment count
  if (segments.length !== patternParts.length) return null;

  // Find which part is %postname%
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i] === "%postname%") {
      return segments[i];
    }
  }

  // If structure uses %post_id%, extract that
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i] === "%post_id%") {
      return segments[i]; // Will be used as ID lookup
    }
  }

  return null;
}

/**
 * Check if a permalink structure uses %post_id% for resolution
 * (meaning we should look up by ID, not slug)
 */
export function usesPostId(permalinkStructure: string): boolean {
  return permalinkStructure.includes("%post_id%") && !permalinkStructure.includes("%postname%");
}

/**
 * Validate a permalink structure has at least %postname% or %post_id%
 */
export function isValidPermalinkStructure(structure: string): boolean {
  return structure.includes("%postname%") || structure.includes("%post_id%");
}

/**
 * Get all supported permalink tags
 */
export const PERMALINK_TAGS = [
  { tag: "%category%", description: "Category slug" },
  { tag: "%postname%", description: "Post slug" },
  { tag: "%year%", description: "Year (4 digits)" },
  { tag: "%monthnum%", description: "Month (2 digits)" },
  { tag: "%day%", description: "Day (2 digits)" },
  { tag: "%post_id%", description: "Post ID" },
  { tag: "%author%", description: "Author name (slugified)" },
] as const;

function slugify(str: string): string {
  return (
    str
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim() || "unknown"
  );
}
