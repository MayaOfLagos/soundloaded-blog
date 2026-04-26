import { NextResponse } from "next/server";

/**
 * GET /api/exit
 * Clears the sl_entered cookie so the next visit to / shows the premium landing page again.
 */
export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set("sl_entered", "", {
    path: "/",
    maxAge: 0,
  });
  return response;
}
