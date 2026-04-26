import { NextResponse } from "next/server";

/**
 * GET /api/enter
 * Sets the sl_entered cookie so the middleware stops showing the premium landing page
 * and starts serving the blog homepage instead.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next") ?? "/";

  // Only allow relative URLs to prevent open-redirect
  const destination = next.startsWith("/") ? next : "/";

  const response = NextResponse.redirect(new URL(destination, request.url));
  response.cookies.set("sl_entered", "1", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
    httpOnly: false, // needs to be readable by client if needed
  });
  return response;
}
