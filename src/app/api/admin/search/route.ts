import { NextRequest, NextResponse } from "next/server";
import { getSearchDemandSnapshot } from "@/lib/admin-search";
import {
  getSearchHealth,
  INDEXES,
  reindexSearchDocuments,
  type SearchIndexUid,
} from "@/lib/meilisearch";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const VALID_INDEXES = new Set<string>(Object.values(INDEXES));

function parseIndexes(value: unknown): SearchIndexUid[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const indexes = value.filter(
    (item): item is SearchIndexUid => typeof item === "string" && VALID_INDEXES.has(item)
  );

  return indexes.length > 0 ? Array.from(new Set(indexes)) : undefined;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const [health, demand] = await Promise.all([getSearchHealth(), getSearchDemandSnapshot()]);
  return NextResponse.json({ health, demand });
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const body = await request.json().catch(() => ({}));
    const indexes = parseIndexes((body as { indexes?: unknown }).indexes);
    const result = await reindexSearchDocuments(indexes);

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Search reindex failed",
      },
      { status: 500 }
    );
  }
}
