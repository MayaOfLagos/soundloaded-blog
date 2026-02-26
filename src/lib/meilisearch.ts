import { MeiliSearch } from "meilisearch";

export const searchClient = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST ?? "http://localhost:7700",
  apiKey: process.env.MEILISEARCH_ADMIN_KEY,
});

export const INDEXES = {
  POSTS: "posts",
  MUSIC: "music",
  ARTISTS: "artists",
} as const;

export async function setupSearchIndexes() {
  await searchClient.createIndex(INDEXES.POSTS, { primaryKey: "id" });
  await searchClient.createIndex(INDEXES.MUSIC, { primaryKey: "id" });
  await searchClient.createIndex(INDEXES.ARTISTS, { primaryKey: "id" });

  await searchClient
    .index(INDEXES.POSTS)
    .updateSearchableAttributes(["title", "excerpt", "category", "tags"]);

  await searchClient
    .index(INDEXES.MUSIC)
    .updateSearchableAttributes(["title", "artistName", "albumTitle", "genre"]);

  await searchClient
    .index(INDEXES.ARTISTS)
    .updateSearchableAttributes(["name", "genre", "country"]);
}
