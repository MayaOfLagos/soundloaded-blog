-- CreateEnum
CREATE TYPE "RecommendationEntityType" AS ENUM ('POST', 'MUSIC', 'ARTIST', 'PLAYLIST', 'USER', 'STORY', 'SEARCH_QUERY');

-- CreateEnum
CREATE TYPE "RecommendationSurface" AS ENUM ('FEED_FORYOU', 'FEED_FOLLOWING', 'FEED_DISCOVER', 'EXPLORE_LATEST', 'EXPLORE_TOP', 'EXPLORE_TRENDING', 'EXPLORE_HOT', 'POST_DETAIL', 'MUSIC_DETAIL', 'ARTIST_DETAIL', 'PLAYLIST_DETAIL', 'SEARCH_RESULTS', 'SEARCH_TRENDING', 'FOLLOW_SUGGESTIONS', 'LIBRARY_PLAYLIST', 'STORIES_VIEWER');

-- CreateEnum
CREATE TYPE "RecommendationEventName" AS ENUM ('POST_IMPRESSION', 'POST_VIEW', 'POST_REACTION_ADD', 'POST_REACTION_REMOVE', 'POST_COMMENT_CREATE', 'POST_BOOKMARK_ADD', 'POST_FAVORITE_ADD', 'POST_DOWNLOAD', 'POST_HIDE', 'MUSIC_IMPRESSION', 'MUSIC_PLAY_QUALIFIED', 'MUSIC_DOWNLOAD', 'MUSIC_BOOKMARK_ADD', 'MUSIC_FAVORITE_ADD', 'MUSIC_PLAYLIST_ADD', 'MUSIC_DETAIL_OPEN', 'ARTIST_FOLLOW', 'ARTIST_UNFOLLOW', 'ARTIST_DETAIL_OPEN', 'PLAYLIST_OPEN', 'PLAYLIST_TRACK_ADD', 'PLAYLIST_REORDER', 'USER_FOLLOW', 'USER_UNFOLLOW', 'STORY_VIEW', 'SEARCH_QUERY', 'SEARCH_NO_RESULT', 'SEARCH_RESULT_CLICK', 'RECOMMENDATION_IMPRESSION', 'RECOMMENDATION_CLICK', 'RECOMMENDATION_DISMISS');

-- CreateEnum
CREATE TYPE "AffinityDimensionType" AS ENUM ('CATEGORY', 'TAG', 'ARTIST', 'GENRE', 'AUTHOR', 'POST_TYPE');

-- CreateTable
CREATE TABLE "InteractionEvent" (
    "id" TEXT NOT NULL,
    "eventName" "RecommendationEventName" NOT NULL,
    "entityType" "RecommendationEntityType" NOT NULL,
    "entityId" TEXT,
    "userId" TEXT,
    "anonymousId" TEXT,
    "sessionId" TEXT,
    "surface" "RecommendationSurface" NOT NULL,
    "placement" TEXT,
    "position" INTEGER,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recommendationRequestId" TEXT,
    "candidateSource" TEXT,
    "reasonKey" TEXT,
    "referrerEntityType" "RecommendationEntityType",
    "referrerEntityId" TEXT,
    "queryText" TEXT,
    "artistId" TEXT,
    "albumId" TEXT,
    "categoryId" TEXT,
    "tagSlug" TEXT,
    "genre" TEXT,
    "weightHint" DOUBLE PRECISION,
    "metadata" JSONB,
    "dedupeKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InteractionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationImpression" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT,
    "anonymousId" TEXT,
    "sessionId" TEXT,
    "surface" "RecommendationSurface" NOT NULL,
    "strategy" TEXT NOT NULL,
    "entityType" "RecommendationEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "candidateSource" TEXT,
    "reasonKey" TEXT,
    "score" DOUBLE PRECISION,
    "servedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "RecommendationImpression_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAffinitySnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dimensionType" "AffinityDimensionType" NOT NULL,
    "dimensionKey" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "eventCount" INTEGER NOT NULL DEFAULT 0,
    "windowDays" INTEGER NOT NULL,
    "lastEventAt" TIMESTAMP(3),
    "metadata" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAffinitySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InteractionEvent_dedupeKey_key" ON "InteractionEvent"("dedupeKey");

-- CreateIndex
CREATE INDEX "InteractionEvent_userId_occurredAt_idx" ON "InteractionEvent"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "InteractionEvent_anonymousId_occurredAt_idx" ON "InteractionEvent"("anonymousId", "occurredAt");

-- CreateIndex
CREATE INDEX "InteractionEvent_entityType_entityId_occurredAt_idx" ON "InteractionEvent"("entityType", "entityId", "occurredAt");

-- CreateIndex
CREATE INDEX "InteractionEvent_eventName_occurredAt_idx" ON "InteractionEvent"("eventName", "occurredAt");

-- CreateIndex
CREATE INDEX "InteractionEvent_surface_occurredAt_idx" ON "InteractionEvent"("surface", "occurredAt");

-- CreateIndex
CREATE INDEX "InteractionEvent_recommendationRequestId_idx" ON "InteractionEvent"("recommendationRequestId");

-- CreateIndex
CREATE INDEX "RecommendationImpression_requestId_position_idx" ON "RecommendationImpression"("requestId", "position");

-- CreateIndex
CREATE INDEX "RecommendationImpression_userId_surface_servedAt_idx" ON "RecommendationImpression"("userId", "surface", "servedAt");

-- CreateIndex
CREATE INDEX "RecommendationImpression_anonymousId_surface_servedAt_idx" ON "RecommendationImpression"("anonymousId", "surface", "servedAt");

-- CreateIndex
CREATE INDEX "RecommendationImpression_entityType_entityId_servedAt_idx" ON "RecommendationImpression"("entityType", "entityId", "servedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserAffinitySnapshot_userId_dimensionType_dimensionKey_windowDays_key" ON "UserAffinitySnapshot"("userId", "dimensionType", "dimensionKey", "windowDays");

-- CreateIndex
CREATE INDEX "UserAffinitySnapshot_userId_dimensionType_score_idx" ON "UserAffinitySnapshot"("userId", "dimensionType", "score");

-- CreateIndex
CREATE INDEX "Download_userId_createdAt_idx" ON "Download"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SearchQuery_userId_createdAt_idx" ON "SearchQuery"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SearchQuery_query_createdAt_idx" ON "SearchQuery"("query", "createdAt");

-- CreateIndex
CREATE INDEX "Bookmark_postId_createdAt_idx" ON "Bookmark"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "Bookmark_musicId_createdAt_idx" ON "Bookmark"("musicId", "createdAt");

-- CreateIndex
CREATE INDEX "Favorite_postId_createdAt_idx" ON "Favorite"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "Favorite_musicId_createdAt_idx" ON "Favorite"("musicId", "createdAt");

-- CreateIndex
CREATE INDEX "Reaction_postId_createdAt_idx" ON "Reaction"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "Follow_followingId_createdAt_idx" ON "Follow"("followingId", "createdAt");

-- CreateIndex
CREATE INDEX "ArtistFollow_artistId_createdAt_idx" ON "ArtistFollow"("artistId", "createdAt");

-- CreateIndex
CREATE INDEX "PostView_postId_viewedAt_idx" ON "PostView"("postId", "viewedAt");

-- CreateIndex
CREATE INDEX "PlaylistTrack_musicId_addedAt_idx" ON "PlaylistTrack"("musicId", "addedAt");

-- AddForeignKey
ALTER TABLE "InteractionEvent" ADD CONSTRAINT "InteractionEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationImpression" ADD CONSTRAINT "RecommendationImpression_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAffinitySnapshot" ADD CONSTRAINT "UserAffinitySnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
