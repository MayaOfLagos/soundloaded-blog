# Permalink Settings Implementation Plan

## Overview

Add WordPress-style configurable permalink settings so admins can define custom URL structures like `/%category%/%postname%/`.

## Current State

- All posts live at flat `/{slug}` via `src/app/[slug]/page.tsx`
- 17 places generate post URLs inline using `/${post.slug}`
- No permalink settings in DB, no URL generation utility exists
- Categories have slugs in DB but no frontend route

## Architecture

### Core Idea

Since Next.js App Router is file-based, we can't dynamically change route patterns. Instead:

1. Replace `src/app/[slug]/page.tsx` with a **catch-all** `src/app/[...segments]/page.tsx`
2. The catch-all receives path segments and resolves the post using the configured permalink pattern
3. A centralized `getPostUrl(post, settings)` utility generates URLs everywhere
4. Old `/{slug}` URLs redirect to the new format (SEO-safe 301)

### Permalink Format Tags

- `%category%` → post's category **slug** (falls back to "uncategorized")
- `%postname%` → post slug
- `%year%` → 4-digit year from publishedAt
- `%monthnum%` → 2-digit month
- `%day%` → 2-digit day
- `%post_id%` → post ID
- `%author%` → author name slugified

### Example Formats

- `/%category%/%postname%` → `/music-mp3/olamide-buggle`
- `/%year%/%monthnum%/%postname%` → `/2026/03/olamide-buggle`
- `/%postname%` → `/olamide-buggle` (current behavior)

## Implementation Steps

### Step 1: Prisma Schema — Add permalink fields

Add to `SiteSettings`:

- `permalinkStructure` String `@default("/%postname%")` — the pattern
- `categoryBase` String `@default("category")` — prefix for category archive pages

Run migration.

### Step 2: Settings lib + API

- Add `permalinkStructure` and `categoryBase` to `PublicSettings` interface + defaults + builder
- Add Zod validation in admin settings API
- Add to admin settings page schema

### Step 3: Create `getPostUrl()` utility

In `src/lib/urls.ts`:

```ts
export function getPostUrl(post, permalinkStructure): string;
```

- Takes a post object (needs: slug, category.slug, publishedAt, id, author.name)
- Parses the permalink template, replaces tags
- Returns the URL path (e.g., `/music-mp3/olamide-buggle`)

Also create `parsePermalinkSegments(segments, permalinkStructure)` that does the reverse — extracts the postname slug from URL segments.

### Step 4: Replace `[slug]` route with `[...segments]` catch-all

- Rename/replace `src/app/[slug]/page.tsx` → `src/app/[...segments]/page.tsx`
- The catch-all receives `params.segments` as `string[]`
- Uses `parsePermalinkSegments()` to extract the post slug
- Falls back to trying the last segment as a plain slug (backwards compat)
- If post found but URL doesn't match current permalink format → 301 redirect

### Step 5: Update all 17 URL generation points

Replace all inline `/${post.slug}` with `getPostUrl(post, settings.permalinkStructure)`:

- Components: PostCard, HeroSlider, TrendingSidebar, FeedViewToggle, SearchDialog
- Pages: [slug] page itself (canonical, breadcrumb, article URL)
- Feeds: feed.xml, feed/[type]
- Sitemaps: server-sitemap.xml, news-sitemap.xml
- Structured data: structured-data.ts
- Admin: posts/page, posts/[id], comments/page, analytics/page

### Step 6: Create category archive route

- Create `src/app/[...segments]/page.tsx` handles this too, OR
- Better: proxy.ts detects category-base paths and rewrites
- Actually simplest: the catch-all `[...segments]` first checks if path matches `/{categoryBase}/{categorySlug}` → render category listing page
- If not a category page, try to resolve as post permalink

### Step 7: Admin UI — Permalink Settings tab

Add a new "Permalinks" tab in admin settings:

- Custom Structure input with helper tag buttons (`%category%`, `%postname%`, etc.)
- Live preview showing example URL
- Category Base input
- Explanation text

### Step 8: Handle edge cases

- Posts without category → use "uncategorized" for `%category%`
- Posts without publishedAt → use current date (only for preview)
- Permalink format change → old URLs still resolve via slug fallback + 301 redirect
- Conflicting paths (e.g., `/music` is both a static page and could be a category) → static routes take priority in Next.js, catch-all only catches unmatched paths

## Files to Create/Modify

- `prisma/schema.prisma` — add 2 fields
- `src/lib/settings.ts` — add to PublicSettings
- `src/lib/urls.ts` — NEW: getPostUrl + parsePermalinkSegments
- `src/app/[...segments]/page.tsx` — NEW: catch-all route (replaces [slug])
- `src/app/[slug]/page.tsx` — DELETE (replaced by catch-all)
- `src/app/api/admin/settings/route.ts` — Zod schema
- `src/app/admin/settings/page.tsx` — Zod schema + new tab
- `src/app/admin/settings/_components/PermalinkSettings.tsx` — NEW
- All 17 URL generation points (components, feeds, sitemaps, admin pages)
