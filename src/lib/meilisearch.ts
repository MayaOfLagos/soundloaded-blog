import { MeiliSearch } from "meilisearch";
import { db } from "@/lib/db";

export const INDEXES = {
  POSTS: "posts",
  PAGES: "pages",
  MUSIC: "music",
  ARTISTS: "artists",
} as const;

type SearchIndexKey = keyof typeof INDEXES;
export type SearchIndexUid = (typeof INDEXES)[SearchIndexKey];

let searchClient: MeiliSearch | null = null;
let lastSearchReindexAt: Date | null = null;

export function isSearchConfigured() {
  return Boolean(process.env.MEILISEARCH_HOST && process.env.MEILISEARCH_ADMIN_KEY);
}

export function getSearchClient() {
  if (!searchClient) {
    searchClient = new MeiliSearch({
      host: process.env.MEILISEARCH_HOST ?? "http://localhost:7700",
      apiKey: process.env.MEILISEARCH_ADMIN_KEY ?? "",
    });
  }

  return searchClient;
}

async function ensureIndex(uid: SearchIndexUid) {
  const client = getSearchClient();

  try {
    await client.getIndex(uid);
  } catch {
    await client.createIndex(uid, { primaryKey: "id" });
  }
}

export async function setupSearchIndexes() {
  if (!isSearchConfigured()) return;

  await Promise.all(Object.values(INDEXES).map((index) => ensureIndex(index)));

  const client = getSearchClient();
  await Promise.all([
    client.index(INDEXES.POSTS).updateSettings({
      searchableAttributes: ["title", "excerpt", "categoryName", "authorName"],
      filterableAttributes: ["type", "status", "categorySlug"],
      sortableAttributes: ["publishedAt", "views"],
    }),
    client.index(INDEXES.PAGES).updateSettings({
      searchableAttributes: ["title", "excerpt", "template", "metaTitle", "metaDescription"],
      filterableAttributes: ["status", "template", "showInHeader", "showInFooter"],
      sortableAttributes: ["publishedAt", "views", "sortOrder"],
    }),
    client.index(INDEXES.MUSIC).updateSettings({
      searchableAttributes: ["title", "artistName", "albumTitle", "genre"],
      filterableAttributes: ["genre", "year", "artistSlug"],
      sortableAttributes: ["downloadCount", "year"],
    }),
    client.index(INDEXES.ARTISTS).updateSettings({
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
  if (!isSearchConfigured()) return;
  getSearchClient()
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

/** Index or update a managed page in Meilisearch */
export function indexPage(page: {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  status: string;
  template: string;
  publishedAt?: Date | null;
  views?: number;
  coverImage?: string | null;
  showInHeader?: boolean;
  showInFooter?: boolean;
  sortOrder?: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
}): void {
  if (!isSearchConfigured()) return;
  getSearchClient()
    .index(INDEXES.PAGES)
    .addDocuments([
      {
        id: page.id,
        slug: page.slug,
        title: page.title,
        excerpt: page.excerpt ?? "",
        status: page.status,
        template: page.template,
        publishedAt: page.publishedAt?.getTime() ?? null,
        views: page.views ?? 0,
        coverImage: page.coverImage ?? null,
        showInHeader: page.showInHeader ?? false,
        showInFooter: page.showInFooter ?? false,
        sortOrder: page.sortOrder ?? 0,
        metaTitle: page.metaTitle ?? null,
        metaDescription: page.metaDescription ?? null,
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
  if (!isSearchConfigured()) return;
  getSearchClient()
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
  verified?: boolean;
  songCount?: number;
}): void {
  if (!isSearchConfigured()) return;
  getSearchClient()
    .index(INDEXES.ARTISTS)
    .addDocuments([
      {
        id: artist.id,
        slug: artist.slug,
        name: artist.name,
        genre: artist.genre ?? null,
        photo: artist.photo ?? null,
        bio: artist.bio ? artist.bio.slice(0, 300) : null,
        verified: artist.verified ?? false,
        songCount: artist.songCount ?? 0,
      },
    ])
    .catch(() => {});
}

/** Search all indexes in parallel. Returns typed results for posts, pages, music, artists. */
export async function searchAll(
  query: string,
  limits?: { posts?: number; pages?: number; music?: number; artists?: number }
) {
  if (!isSearchConfigured()) {
    throw new Error("Meilisearch is not configured");
  }

  const postLimit = limits?.posts ?? 10;
  const pageLimit = limits?.pages ?? 5;
  const musicLimit = limits?.music ?? 8;
  const artistLimit = limits?.artists ?? 6;

  const response = await getSearchClient().multiSearch({
    queries: [
      {
        indexUid: INDEXES.POSTS,
        q: query,
        limit: postLimit,
        filter: "status = PUBLISHED",
        attributesToRetrieve: [
          "id",
          "slug",
          "title",
          "excerpt",
          "coverImage",
          "categoryName",
          "categorySlug",
          "publishedAt",
          "type",
        ],
      },
      {
        indexUid: INDEXES.PAGES,
        q: query,
        limit: pageLimit,
        filter: "status = PUBLISHED",
        attributesToRetrieve: [
          "id",
          "slug",
          "title",
          "excerpt",
          "coverImage",
          "template",
          "publishedAt",
        ],
      },
      {
        indexUid: INDEXES.MUSIC,
        q: query,
        limit: musicLimit,
        attributesToRetrieve: ["id", "slug", "title", "artistName", "coverArt", "genre"],
      },
      {
        indexUid: INDEXES.ARTISTS,
        q: query,
        limit: artistLimit,
        attributesToRetrieve: ["id", "slug", "name", "photo", "genre", "verified", "songCount"],
      },
    ],
  });

  return {
    posts: response.results[0]?.hits ?? [],
    pages: response.results[1]?.hits ?? [],
    music: response.results[2]?.hits ?? [],
    artists: response.results[3]?.hits ?? [],
  };
}

/** Remove a document from an index */
export function removeFromIndex(index: string, id: string): void {
  if (!isSearchConfigured()) return;
  getSearchClient()
    .index(index)
    .deleteDocument(id)
    .catch(() => {});
}

export async function getSearchHealth() {
  const indexUids = Object.values(INDEXES);

  if (!isSearchConfigured()) {
    return {
      configured: false,
      reachable: false,
      lastReindexAt: lastSearchReindexAt?.toISOString() ?? null,
      indexes: indexUids.map((uid) => ({ uid, exists: false, documentCount: null })),
      error: "MEILISEARCH_HOST and MEILISEARCH_ADMIN_KEY are not configured.",
    };
  }

  try {
    const client = getSearchClient();
    await client.health();

    const indexes = await Promise.all(
      indexUids.map(async (uid) => {
        try {
          const stats = await client.index(uid).getStats();
          return { uid, exists: true, documentCount: stats.numberOfDocuments ?? null };
        } catch {
          return { uid, exists: false, documentCount: null };
        }
      })
    );

    return {
      configured: true,
      reachable: true,
      lastReindexAt: lastSearchReindexAt?.toISOString() ?? null,
      indexes,
      error: null,
    };
  } catch (error) {
    return {
      configured: true,
      reachable: false,
      lastReindexAt: lastSearchReindexAt?.toISOString() ?? null,
      indexes: indexUids.map((uid) => ({ uid, exists: false, documentCount: null })),
      error: error instanceof Error ? error.message : "Meilisearch is unreachable.",
    };
  }
}

export async function reindexSearchDocuments(indexes: SearchIndexUid[] = Object.values(INDEXES)) {
  if (!isSearchConfigured()) {
    throw new Error("Meilisearch is not configured");
  }

  await setupSearchIndexes();
  const client = getSearchClient();
  const requested = new Set(indexes);
  const counts: Record<SearchIndexUid, number> = {
    [INDEXES.POSTS]: 0,
    [INDEXES.PAGES]: 0,
    [INDEXES.MUSIC]: 0,
    [INDEXES.ARTISTS]: 0,
  };

  if (requested.has(INDEXES.POSTS)) {
    const posts = await db.post.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        type: true,
        status: true,
        publishedAt: true,
        views: true,
        coverImage: true,
        category: { select: { name: true, slug: true } },
        author: { select: { name: true } },
      },
    });

    counts[INDEXES.POSTS] = posts.length;
    await client.index(INDEXES.POSTS).deleteAllDocuments();
    if (posts.length) {
      await client.index(INDEXES.POSTS).addDocuments(
        posts.map((post) => ({
          id: post.id,
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt ?? "",
          type: post.type,
          status: post.status,
          publishedAt: post.publishedAt?.getTime() ?? null,
          views: post.views,
          coverImage: post.coverImage ?? null,
          categoryName: post.category?.name ?? null,
          categorySlug: post.category?.slug ?? null,
          authorName: post.author?.name ?? null,
        }))
      );
    }
  }

  if (requested.has(INDEXES.PAGES)) {
    const pages = await db.page.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        status: true,
        template: true,
        publishedAt: true,
        views: true,
        coverImage: true,
        showInHeader: true,
        showInFooter: true,
        sortOrder: true,
        metaTitle: true,
        metaDescription: true,
      },
    });

    counts[INDEXES.PAGES] = pages.length;
    await client.index(INDEXES.PAGES).deleteAllDocuments();
    if (pages.length) {
      await client.index(INDEXES.PAGES).addDocuments(
        pages.map((page) => ({
          id: page.id,
          slug: page.slug,
          title: page.title,
          excerpt: page.excerpt ?? "",
          status: page.status,
          template: page.template,
          publishedAt: page.publishedAt?.getTime() ?? null,
          views: page.views,
          coverImage: page.coverImage ?? null,
          showInHeader: page.showInHeader,
          showInFooter: page.showInFooter,
          sortOrder: page.sortOrder,
          metaTitle: page.metaTitle ?? null,
          metaDescription: page.metaDescription ?? null,
        }))
      );
    }
  }

  if (requested.has(INDEXES.MUSIC)) {
    const music = await db.music.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        genre: true,
        year: true,
        coverArt: true,
        downloadCount: true,
        artist: { select: { name: true, slug: true } },
        album: { select: { title: true, slug: true } },
      },
    });

    counts[INDEXES.MUSIC] = music.length;
    await client.index(INDEXES.MUSIC).deleteAllDocuments();
    if (music.length) {
      await client.index(INDEXES.MUSIC).addDocuments(
        music.map((track) => ({
          id: track.id,
          slug: track.slug,
          title: track.title,
          genre: track.genre ?? null,
          year: track.year ?? null,
          coverArt: track.coverArt ?? null,
          downloadCount: track.downloadCount,
          artistName: track.artist?.name ?? null,
          artistSlug: track.artist?.slug ?? null,
          albumTitle: track.album?.title ?? null,
          albumSlug: track.album?.slug ?? null,
        }))
      );
    }
  }

  if (requested.has(INDEXES.ARTISTS)) {
    const artists = await db.artist.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        genre: true,
        photo: true,
        bio: true,
        verified: true,
        _count: { select: { music: true } },
      },
    });

    counts[INDEXES.ARTISTS] = artists.length;
    await client.index(INDEXES.ARTISTS).deleteAllDocuments();
    if (artists.length) {
      await client.index(INDEXES.ARTISTS).addDocuments(
        artists.map((artist) => ({
          id: artist.id,
          slug: artist.slug,
          name: artist.name,
          genre: artist.genre ?? null,
          photo: artist.photo ?? null,
          bio: artist.bio ? artist.bio.slice(0, 300) : null,
          verified: artist.verified,
          songCount: artist._count.music,
        }))
      );
    }
  }

  lastSearchReindexAt = new Date();

  return {
    lastReindexAt: lastSearchReindexAt.toISOString(),
    counts,
  };
}
