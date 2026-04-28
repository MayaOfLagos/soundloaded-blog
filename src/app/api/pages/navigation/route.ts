import { NextResponse } from "next/server";
import { getNavigationPages, getPageUrl } from "@/lib/pages";

export async function GET() {
  const navigation = await getNavigationPages();

  return NextResponse.json(
    {
      header: navigation.header.map((page) => ({
        id: page.id,
        title: page.title,
        href: getPageUrl(page),
      })),
      footer: navigation.footer.map((page) => ({
        id: page.id,
        title: page.title,
        href: getPageUrl(page),
        systemKey: page.systemKey,
      })),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
