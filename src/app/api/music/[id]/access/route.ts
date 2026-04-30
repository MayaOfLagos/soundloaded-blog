import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getMusicAccess,
  serializeMusicAccessResult,
  type MusicAccessIntent,
} from "@/lib/music-access";

const ACCESS_INTENTS = new Set<MusicAccessIntent>(["stream", "download", "waveform", "metadata"]);

function parseIntent(value: string | null): MusicAccessIntent {
  if (value && ACCESS_INTENTS.has(value as MusicAccessIntent)) {
    return value as MusicAccessIntent;
  }

  return "stream";
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const intent = parseIntent(req.nextUrl.searchParams.get("intent"));

  const access = await getMusicAccess({ musicId: id, userId, intent });

  return NextResponse.json(serializeMusicAccessResult(access), {
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}
