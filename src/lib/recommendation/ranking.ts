export type RecommendationReasonKey =
  | "FOLLOWED_CREATOR"
  | "MATCHES_RECENT_INTERESTS"
  | "TRENDING_COMMUNITY"
  | "FRESH_BREAKOUT"
  | "HOT_NOW"
  | "TOP_PERFORMER"
  | "SAME_CATEGORY"
  | "SAME_TAG_CLUSTER"
  | "SAME_CONTENT_TYPE"
  | "RECENT_IN_TOPIC"
  | "MORE_FROM_THIS_ARTIST"
  | "FROM_THE_SAME_ALBUM"
  | "OFTEN_IN_THE_SAME_PLAYLISTS"
  | "SIMILAR_GENRE"
  | "LISTENER_FAVORITE";

export interface RankablePost {
  id: string;
  createdAt: Date;
  views: number;
  type?: string;
  author: { id: string };
  category?: { slug: string } | null;
  commentCount?: number;
  reactionCount?: number;
  bookmarkCount?: number;
  favoriteCount?: number;
}

export type RankedPost<T extends RankablePost> = T & {
  _score?: number;
  _reasonKey?: RecommendationReasonKey;
  _candidateSource?: string;
};

export interface RankPostOptions {
  followingIds?: Set<string>;
  decayPower?: number;
  followBoost?: number;
  viewWeight?: number;
  randomSeed?: string | number;
  randomSpread?: number;
  candidateSource?: string;
  authorAffinity?: ReadonlyMap<string, number>;
  categoryAffinity?: ReadonlyMap<string, number>;
  postTypeAffinity?: ReadonlyMap<string, number>;
  affinityWeight?: number;
  now?: number;
}

export interface DiversityOptions<T extends RankablePost> {
  maxConsecutiveAuthors?: number;
  maxConsecutiveCategories?: number;
  getAuthorId?: (item: RankedPost<T>) => string | null;
  getCategoryKey?: (item: RankedPost<T>) => string | null;
}

export interface RankableRelatedPost extends RankablePost {
  type: string;
  tagSlugs?: string[];
}

export interface RankRelatedPostOptions {
  type: string;
  categorySlug?: string | null;
  tagSlugs?: string[];
  candidateSource?: string;
  now?: number;
}

export interface RankableMusicTrack {
  id: string;
  createdAt: Date;
  artistId: string;
  albumId?: string | null;
  genre?: string | null;
  downloadCount: number;
  streamCount: number;
  favoriteCount?: number;
  bookmarkCount?: number;
  playlistOverlapCount?: number;
}

export type RankedMusicTrack<T extends RankableMusicTrack> = T & {
  _score?: number;
  _reasonKey?: RecommendationReasonKey;
  _candidateSource?: string;
};

export interface RankMusicTrackOptions {
  artistId?: string | null;
  albumId?: string | null;
  genre?: string | null;
  candidateSource?: string;
  now?: number;
}

export interface MusicDiversityOptions<T extends RankableMusicTrack> {
  maxConsecutiveArtists?: number;
  maxConsecutiveAlbums?: number;
  getArtistId?: (item: RankedMusicTrack<T>) => string | null;
  getAlbumId?: (item: RankedMusicTrack<T>) => string | null;
}

export function simpleRecommendationHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function rankPosts<T extends RankablePost>(
  posts: T[],
  {
    followingIds = new Set(),
    decayPower = 1.2,
    followBoost = 0,
    viewWeight = 0.25,
    randomSeed,
    randomSpread = 0,
    candidateSource = "engagement",
    authorAffinity,
    categoryAffinity,
    postTypeAffinity,
    affinityWeight = 8,
    now = Date.now(),
  }: RankPostOptions = {}
): RankedPost<T>[] {
  return posts
    .map((post) => {
      const hoursAge = Math.max(0, (now - new Date(post.createdAt).getTime()) / 3600000);
      const engagement =
        (post.reactionCount ?? 0) * 3 +
        (post.commentCount ?? 0) * 5 +
        (post.bookmarkCount ?? 0) * 4 +
        (post.favoriteCount ?? 0) * 4 +
        post.views * viewWeight;
      const socialBoost = followingIds.has(post.author.id) ? followBoost : 0;
      const affinityBoost =
        ((authorAffinity?.get(post.author.id) ?? 0) +
          (post.category?.slug ? (categoryAffinity?.get(post.category.slug) ?? 0) * 0.75 : 0) +
          (post.type ? (postTypeAffinity?.get(post.type) ?? 0) * 0.35 : 0)) *
        affinityWeight;
      const decayFactor = 1 / Math.pow(hoursAge + 2, decayPower);
      const randomFactor = getStableRandomFactor(post.id, randomSeed, randomSpread);
      const score = (engagement + socialBoost + affinityBoost) * decayFactor * randomFactor;

      return {
        ...post,
        _score: score,
        _reasonKey: pickReasonKey({
          isFollowed: socialBoost > 0,
          hasAffinity: affinityBoost > 0,
          engagement,
          hoursAge,
        }),
        _candidateSource:
          socialBoost > 0
            ? "followed_creator"
            : affinityBoost > 0
              ? "recent_interest_affinity"
              : candidateSource,
      };
    })
    .sort((a, b) => (b._score ?? 0) - (a._score ?? 0));
}

export function diversifyRankedPosts<T extends RankablePost>(
  posts: RankedPost<T>[],
  {
    maxConsecutiveAuthors = 3,
    maxConsecutiveCategories,
    getAuthorId = (item) => item.author.id,
    getCategoryKey = (item) => item.category?.slug ?? null,
  }: DiversityOptions<T> = {}
): RankedPost<T>[] {
  const result: RankedPost<T>[] = [];
  const deferred: RankedPost<T>[] = [];
  let lastAuthorId: string | null = null;
  let authorRun = 0;
  let lastCategoryKey: string | null = null;
  let categoryRun = 0;

  for (const post of posts) {
    const authorId = getAuthorId(post);
    const categoryKey = getCategoryKey(post);
    const wouldExceedAuthor =
      Boolean(authorId) && authorId === lastAuthorId && authorRun >= maxConsecutiveAuthors;
    const wouldExceedCategory =
      maxConsecutiveCategories !== undefined &&
      Boolean(categoryKey) &&
      categoryKey === lastCategoryKey &&
      categoryRun >= maxConsecutiveCategories;

    if (wouldExceedAuthor || wouldExceedCategory) {
      deferred.push(post);
      continue;
    }

    result.push(post);

    if (authorId === lastAuthorId) {
      authorRun++;
    } else {
      lastAuthorId = authorId;
      authorRun = 1;
    }

    if (categoryKey === lastCategoryKey) {
      categoryRun++;
    } else {
      lastCategoryKey = categoryKey;
      categoryRun = 1;
    }
  }

  return [...result, ...deferred];
}

export function rankRelatedPosts<T extends RankableRelatedPost>(
  posts: T[],
  {
    type,
    categorySlug,
    tagSlugs = [],
    candidateSource = "related_post",
    now = Date.now(),
  }: RankRelatedPostOptions
): RankedPost<T>[] {
  const contextTags = new Set(tagSlugs.filter(Boolean));
  const isTimeSensitive = type === "NEWS" || type === "GIST" || type === "VIDEO";

  return posts
    .map((post) => {
      const hoursAge = Math.max(0, (now - new Date(post.createdAt).getTime()) / 3600000);
      const tagOverlap = countOverlap(post.tagSlugs ?? [], contextTags);
      const sameType = post.type === type;
      const sameCategory = Boolean(categorySlug && post.category?.slug === categorySlug);
      const engagement =
        (post.reactionCount ?? 0) * 3 +
        (post.commentCount ?? 0) * 4 +
        (post.bookmarkCount ?? 0) * 4 +
        (post.favoriteCount ?? 0) * 4 +
        post.views * 0.2;
      const freshnessDecay = isTimeSensitive
        ? 1 / Math.pow(hoursAge + 4, 0.75)
        : 1 / Math.pow(hoursAge + 24, 0.45);
      const contextualBoost = (sameType ? 80 : 0) + (sameCategory ? 45 : 0) + tagOverlap * 30;
      const score = contextualBoost + engagement * (0.75 + freshnessDecay);

      return {
        ...post,
        _score: score,
        _reasonKey: pickRelatedPostReasonKey({
          sameCategory,
          tagOverlap,
          sameType,
          hoursAge,
          isTimeSensitive,
        }),
        _candidateSource: pickRelatedPostCandidateSource({
          candidateSource,
          sameCategory,
          tagOverlap,
        }),
      };
    })
    .sort((a, b) => (b._score ?? 0) - (a._score ?? 0));
}

export function rankMusicTracks<T extends RankableMusicTrack>(
  tracks: T[],
  {
    artistId,
    albumId,
    genre,
    candidateSource = "related_music",
    now = Date.now(),
  }: RankMusicTrackOptions = {}
): RankedMusicTrack<T>[] {
  const normalizedGenre = normalizeKey(genre);

  return tracks
    .map((track) => {
      const hoursAge = Math.max(0, (now - new Date(track.createdAt).getTime()) / 3600000);
      const sameArtist = Boolean(artistId && track.artistId === artistId);
      const sameAlbum = Boolean(albumId && track.albumId === albumId);
      const sameGenre = Boolean(normalizedGenre && normalizeKey(track.genre) === normalizedGenre);
      const playlistOverlap = track.playlistOverlapCount ?? 0;
      const engagement =
        track.downloadCount * 0.9 +
        track.streamCount * 0.45 +
        (track.favoriteCount ?? 0) * 5 +
        (track.bookmarkCount ?? 0) * 4 +
        playlistOverlap * 18;
      const freshnessFactor = 1 / Math.pow(hoursAge + 24, 0.35);
      const contextualBoost =
        (sameAlbum ? 120 : 0) +
        (sameArtist ? 90 : 0) +
        (playlistOverlap > 0 ? 70 + playlistOverlap * 18 : 0) +
        (sameGenre ? 42 : 0);
      const score = contextualBoost + engagement * (0.8 + freshnessFactor);

      return {
        ...track,
        _score: score,
        _reasonKey: pickMusicReasonKey({
          sameAlbum,
          sameArtist,
          sameGenre,
          playlistOverlap,
          favoriteCount: track.favoriteCount ?? 0,
        }),
        _candidateSource: pickMusicCandidateSource({
          candidateSource,
          sameAlbum,
          sameArtist,
          sameGenre,
          playlistOverlap,
        }),
      };
    })
    .sort((a, b) => (b._score ?? 0) - (a._score ?? 0));
}

export function diversifyRankedMusicTracks<T extends RankableMusicTrack>(
  tracks: RankedMusicTrack<T>[],
  {
    maxConsecutiveArtists = 3,
    maxConsecutiveAlbums = 2,
    getArtistId = (item) => item.artistId,
    getAlbumId = (item) => item.albumId ?? null,
  }: MusicDiversityOptions<T> = {}
): RankedMusicTrack<T>[] {
  const result: RankedMusicTrack<T>[] = [];
  const deferred: RankedMusicTrack<T>[] = [];
  let lastArtistId: string | null = null;
  let artistRun = 0;
  let lastAlbumId: string | null = null;
  let albumRun = 0;

  for (const track of tracks) {
    const trackArtistId = getArtistId(track);
    const trackAlbumId = getAlbumId(track);
    const wouldExceedArtist =
      Boolean(trackArtistId) &&
      trackArtistId === lastArtistId &&
      artistRun >= maxConsecutiveArtists;
    const wouldExceedAlbum =
      Boolean(trackAlbumId) && trackAlbumId === lastAlbumId && albumRun >= maxConsecutiveAlbums;

    if (wouldExceedArtist || wouldExceedAlbum) {
      deferred.push(track);
      continue;
    }

    result.push(track);

    if (trackArtistId === lastArtistId) {
      artistRun++;
    } else {
      lastArtistId = trackArtistId;
      artistRun = 1;
    }

    if (trackAlbumId === lastAlbumId) {
      albumRun++;
    } else {
      lastAlbumId = trackAlbumId;
      albumRun = 1;
    }
  }

  return [...result, ...deferred];
}

function getStableRandomFactor(id: string, seed: string | number | undefined, spread: number) {
  if (!seed || spread <= 0) return 1;
  const boundedSpread = Math.min(Math.max(spread, 0), 0.5);
  const bucket = simpleRecommendationHash(`${id}:${seed}`) % 1000;
  const normalized = bucket / 999;
  return 1 - boundedSpread + normalized * boundedSpread * 2;
}

function pickReasonKey({
  isFollowed,
  hasAffinity,
  engagement,
  hoursAge,
}: {
  isFollowed: boolean;
  hasAffinity: boolean;
  engagement: number;
  hoursAge: number;
}): RecommendationReasonKey {
  if (isFollowed) return "FOLLOWED_CREATOR";
  if (hasAffinity) return "MATCHES_RECENT_INTERESTS";
  if (hoursAge <= 24 && engagement > 0) return "FRESH_BREAKOUT";
  if (engagement > 0) return "TRENDING_COMMUNITY";
  return "HOT_NOW";
}

function countOverlap(values: string[], context: Set<string>) {
  if (context.size === 0 || values.length === 0) return 0;
  return values.reduce((count, value) => count + (context.has(value) ? 1 : 0), 0);
}

function normalizeKey(value: string | null | undefined) {
  return value?.trim().toLowerCase() || null;
}

function pickRelatedPostReasonKey({
  sameCategory,
  tagOverlap,
  sameType,
  hoursAge,
  isTimeSensitive,
}: {
  sameCategory: boolean;
  tagOverlap: number;
  sameType: boolean;
  hoursAge: number;
  isTimeSensitive: boolean;
}): RecommendationReasonKey {
  if (tagOverlap > 0) return "SAME_TAG_CLUSTER";
  if (sameCategory) return "SAME_CATEGORY";
  if (isTimeSensitive && hoursAge <= 72) return "RECENT_IN_TOPIC";
  if (sameType) return "SAME_CONTENT_TYPE";
  return "TRENDING_COMMUNITY";
}

function pickRelatedPostCandidateSource({
  candidateSource,
  sameCategory,
  tagOverlap,
}: {
  candidateSource: string;
  sameCategory: boolean;
  tagOverlap: number;
}) {
  if (tagOverlap > 0) return "tag_overlap";
  if (sameCategory) return "same_category";
  return candidateSource;
}

function pickMusicReasonKey({
  sameAlbum,
  sameArtist,
  sameGenre,
  playlistOverlap,
  favoriteCount,
}: {
  sameAlbum: boolean;
  sameArtist: boolean;
  sameGenre: boolean;
  playlistOverlap: number;
  favoriteCount: number;
}): RecommendationReasonKey {
  if (sameAlbum) return "FROM_THE_SAME_ALBUM";
  if (sameArtist) return "MORE_FROM_THIS_ARTIST";
  if (playlistOverlap > 0) return "OFTEN_IN_THE_SAME_PLAYLISTS";
  if (sameGenre) return "SIMILAR_GENRE";
  if (favoriteCount > 0) return "LISTENER_FAVORITE";
  return "HOT_NOW";
}

function pickMusicCandidateSource({
  candidateSource,
  sameAlbum,
  sameArtist,
  sameGenre,
  playlistOverlap,
}: {
  candidateSource: string;
  sameAlbum: boolean;
  sameArtist: boolean;
  sameGenre: boolean;
  playlistOverlap: number;
}) {
  if (sameAlbum) return "same_album";
  if (sameArtist) return "same_artist";
  if (playlistOverlap > 0) return "playlist_overlap";
  if (sameGenre) return "same_genre";
  return candidateSource;
}
