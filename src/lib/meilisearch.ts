import { MeiliSearch } from "meilisearch";

const isConfigured = !!process.env.MEILISEARCH_HOST && !!process.env.MEILISEARCH_ADMIN_KEY;

export const searchClient = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST ?? "http://localhost:7700",
  apiKey: process.env.MEILISEARCH_ADMIN_KEY ?? "",
});

export const INDEXES = {
  POSTS: "posts",
  MUSIC: "music",
  ARTISTS: "artists",
} as const;

export async function setupSearchIndexes() {
  if (!isConfigured) return;
  await searchClient.createIndex(INDEXES.POSTS, { primaryKey: "id" });
  await searchClient.createIndex(INDEXES.MUSIC, { primaryKey: "id" });
  await searchClient.createIndex(INDEXES.ARTISTS, { primaryKey: "id" });

  await Promise.all([
    searchClient.index(INDEXES.POSTS).updateSettings({
      searchableAttributes: ["title", "excerpt", "categoryName", "authorName"],
      filterableAttributes: ["type", "status", "categorySlug"],
      sortableAttributes: ["publishedAt", "views"],
    }),
    searchClient.index(INDEXES.MUSIC).updateSettings({
      searchableAttributes: ["title", "artistName", "albumTitle", "genre"],
      filterableAttributes: ["genre", "year", "artistSlug"],
      sortableAttributes: ["downloadCount", "year"],
    }),
    searchClient.index(INDEXES.ARTISTS).updateSettings({
      searchableAttributes: ["name", "genre", "bio"],
      filterableAttributes: ["genre"],
    }),
  ]);
}

/** Index or update a single post in Meilisearch (fire-and-forget safe) */
export function indexPost(post: {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  type: string;
  status: string;
  publishedAt?: Date | null;
  views?: number;
  coverImage?: string | null;
  category?: { name: string; slug: string } | null;
  author?: { name: string | null } | null;
}): void {
  if (!isConfigured) return;
  searchClient
    .index(INDEXES.POSTS)
    .addDocuments([
      {
        id: post.id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt ?? "",
        type: post.type,
        status: post.status,
        publishedAt: post.publishedAt?.getTime() ?? null,
        views: post.views ?? 0,
        coverImage: post.coverImage ?? null,
        categoryName: post.category?.name ?? null,
        categorySlug: post.category?.slug ?? null,
        authorName: post.author?.name ?? null,
      },
    ])
    .catch(() => {});
}

/** Index or update a music track in Meilisearch */
export function indexMusic(music: {
  id: string;
  slug: string;
  title: string;
  genre?: string | null;
  year?: number | null;
  coverArt?: string | null;
  downloadCount?: number;
  artist?: { name: string; slug: string } | null;
  album?: { title: string; slug: string } | null;
}): void {
  if (!isConfigured) return;
  searchClient
    .index(INDEXES.MUSIC)
    .addDocuments([
      {
        id: music.id,
        slug: music.slug,
        title: music.title,
        genre: music.genre ?? null,
        year: music.year ?? null,
        coverArt: music.coverArt ?? null,
        downloadCount: music.downloadCount ?? 0,
        artistName: music.artist?.name ?? null,
        artistSlug: music.artist?.slug ?? null,
        albumTitle: music.album?.title ?? null,
        albumSlug: music.album?.slug ?? null,
      },
    ])
    .catch(() => {});
}

/** Index or update an artist in Meilisearch */
export function indexArtist(artist: {
  id: string;
  slug: string;
  name: string;
  genre?: string | null;
  photo?: string | null;
  bio?: string | null;
}): void {
  if (!isConfigured) return;
  searchClient
    .index(INDEXES.ARTISTS)
    .addDocuments([
      {
        id: artist.id,
        slug: artist.slug,
        name: artist.name,
        genre: artist.genre ?? null,
        photo: artist.photo ?? null,
        bio: artist.bio ? artist.bio.slice(0, 300) : null,
      },
    ])
    .catch(() => {});
}

/** Remove a document from an index */
export function removeFromIndex(index: string, id: string): void {
  if (!isConfigured) return;
  searchClient
    .index(index)
    .deleteDocument(id)
    .catch(() => {});
}
