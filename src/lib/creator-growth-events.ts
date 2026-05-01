import {
  Prisma,
  RecommendationEntityType,
  RecommendationEventName,
  RecommendationSurface,
} from "@prisma/client";

import { db } from "@/lib/db";
import { trackInteractionEvent, writeInteractionEvent } from "@/lib/recommendation";
import type { TrackInteractionEventInput } from "@/lib/recommendation";

export type CreatorEventContext = {
  surface: RecommendationSurface;
  placement?: string | null;
  position?: number | null;
  recommendationRequestId?: string | null;
  candidateSource?: string | null;
  reasonKey?: string | null;
  referrerEntityType?: RecommendationEntityType | null;
  referrerEntityId?: string | null;
  queryText?: string | null;
  shareChannel?: string | null;
  href?: string | null;
};

type MusicActionInput = {
  eventName: RecommendationEventName;
  musicId: string;
  userId?: string | null;
  anonymousId?: string | null;
  sessionId?: string | null;
  context: CreatorEventContext;
  weightHint?: number | null;
  metadata?: Prisma.InputJsonObject;
};

type ArtistActionInput = {
  eventName: RecommendationEventName;
  artistId: string;
  userId?: string | null;
  anonymousId?: string | null;
  sessionId?: string | null;
  context: CreatorEventContext;
  weightHint?: number | null;
  metadata?: Prisma.InputJsonObject;
};

type CreatorEntityContext = {
  artistId?: string | null;
  albumId?: string | null;
  genre?: string | null;
  metadata?: Prisma.InputJsonObject;
};

const MUSIC_EVENT_SELECT = {
  id: true,
  artistId: true,
  albumId: true,
  genre: true,
  isExclusive: true,
  accessModel: true,
  streamAccess: true,
  creatorPrice: true,
  price: true,
} satisfies Prisma.MusicSelect;

type MusicEventPayload = Prisma.MusicGetPayload<{ select: typeof MUSIC_EVENT_SELECT }>;

export function readCreatorEventContext(
  payload: unknown,
  fallbackSurface: RecommendationSurface
): CreatorEventContext {
  const source = getObjectValue(payload, "source");

  return {
    surface:
      readEnumValue(RecommendationSurface, readPayloadValue(payload, source, "surface")) ??
      fallbackSurface,
    placement: readString(readPayloadValue(payload, source, "placement")),
    position: readNumber(readPayloadValue(payload, source, "position")),
    recommendationRequestId: readString(
      readPayloadValue(payload, source, "recommendationRequestId")
    ),
    candidateSource: readString(readPayloadValue(payload, source, "candidateSource")),
    reasonKey: readString(readPayloadValue(payload, source, "reasonKey")),
    referrerEntityType: readEnumValue(
      RecommendationEntityType,
      readPayloadValue(payload, source, "referrerEntityType")
    ),
    referrerEntityId: readString(readPayloadValue(payload, source, "referrerEntityId")),
    queryText: readString(readPayloadValue(payload, source, "queryText")),
    shareChannel: readString(readPayloadValue(payload, source, "shareChannel")),
    href: readString(readPayloadValue(payload, source, "href")),
  };
}

export function readCreatorEntityType(value: unknown) {
  return readEnumValue(RecommendationEntityType, value);
}

export function sourceContextToInteractionFields(context: CreatorEventContext) {
  return {
    surface: context.surface,
    placement: context.placement,
    position: context.position,
    recommendationRequestId: context.recommendationRequestId,
    candidateSource: context.candidateSource,
    reasonKey: context.reasonKey,
    referrerEntityType: context.referrerEntityType,
    referrerEntityId: context.referrerEntityId,
    queryText: context.queryText?.slice(0, 200).toLowerCase() ?? null,
  } satisfies Pick<
    TrackInteractionEventInput,
    | "surface"
    | "placement"
    | "position"
    | "recommendationRequestId"
    | "candidateSource"
    | "reasonKey"
    | "referrerEntityType"
    | "referrerEntityId"
    | "queryText"
  >;
}

export function mergeCreatorEventMetadata(
  ...items: Array<Prisma.InputJsonObject | null | undefined>
): Prisma.InputJsonObject {
  const merged: Record<string, Prisma.InputJsonValue | null> = {};

  for (const item of items) {
    if (!item) continue;
    for (const [key, value] of Object.entries(item)) {
      if (value !== undefined) {
        merged[key] = value;
      }
    }
  }

  return merged as Prisma.InputJsonObject;
}

export function trackMusicActionEvent(input: MusicActionInput) {
  writeMusicActionEvent(input).catch(() => {});
}

export async function writeMusicActionEvent(input: MusicActionInput) {
  const music = await getMusicEventPayload(input.musicId);
  const entityContext = music ? buildMusicEntityContext(music) : {};

  return writeInteractionEvent({
    eventName: input.eventName,
    entityType: RecommendationEntityType.MUSIC,
    entityId: input.musicId,
    userId: input.userId,
    anonymousId: input.anonymousId,
    sessionId: input.sessionId,
    ...sourceContextToInteractionFields(input.context),
    artistId: entityContext.artistId,
    albumId: entityContext.albumId,
    genre: entityContext.genre,
    weightHint: input.weightHint,
    metadata: mergeCreatorEventMetadata(entityContext.metadata, input.metadata),
  });
}

export function trackArtistActionEvent(input: ArtistActionInput) {
  writeArtistActionEvent(input).catch(() => {});
}

export async function writeArtistActionEvent(input: ArtistActionInput) {
  return writeInteractionEvent({
    eventName: input.eventName,
    entityType: RecommendationEntityType.ARTIST,
    entityId: input.artistId,
    userId: input.userId,
    anonymousId: input.anonymousId,
    sessionId: input.sessionId,
    ...sourceContextToInteractionFields(input.context),
    artistId: input.artistId,
    weightHint: input.weightHint,
    metadata: input.metadata,
  });
}

export async function getCreatorEntityContext(
  entityType: RecommendationEntityType,
  entityId: string
): Promise<CreatorEntityContext> {
  if (entityType === RecommendationEntityType.MUSIC) {
    const music = await getMusicEventPayload(entityId);
    return music ? buildMusicEntityContext(music) : {};
  }

  if (entityType === RecommendationEntityType.ARTIST) {
    return { artistId: entityId };
  }

  return {};
}

export async function writePostShareEvent({
  postId,
  userId,
  context,
  metadata,
}: {
  postId: string;
  userId?: string | null;
  context: CreatorEventContext;
  metadata?: Prisma.InputJsonObject;
}) {
  return writeInteractionEvent({
    eventName: RecommendationEventName.POST_VIEW,
    entityType: RecommendationEntityType.POST,
    entityId: postId,
    userId,
    ...sourceContextToInteractionFields(context),
    weightHint: 2,
    metadata,
  });
}

export function trackPostInteractionEvent(input: TrackInteractionEventInput) {
  trackInteractionEvent(input);
}

async function getMusicEventPayload(musicId: string) {
  return db.music.findUnique({
    where: { id: musicId },
    select: MUSIC_EVENT_SELECT,
  });
}

function buildMusicEntityContext(music: MusicEventPayload): CreatorEntityContext {
  return {
    artistId: music.artistId,
    albumId: music.albumId,
    genre: music.genre,
    metadata: {
      accessModel: music.accessModel,
      streamAccess: music.streamAccess,
      isExclusive: music.isExclusive,
      creatorPrice: music.creatorPrice,
      price: music.price,
    },
  };
}

function getObjectValue(payload: unknown, key: string): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object") return null;
  const value = (payload as Record<string, unknown>)[key];
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readPayloadValue(payload: unknown, source: Record<string, unknown> | null, key: string) {
  if (payload && typeof payload === "object" && key in payload) {
    return (payload as Record<string, unknown>)[key];
  }

  return source?.[key];
}

function readEnumValue<T extends Record<string, string>>(
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
