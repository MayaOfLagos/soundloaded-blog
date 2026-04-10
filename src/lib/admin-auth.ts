import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";

// ── Role definitions ──────────────────────────────────────────────────
export const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;
export const EDITOR_ROLES = ["EDITOR", "ADMIN", "SUPER_ADMIN"] as const;
export const SUPER_ADMIN_ROLES = ["SUPER_ADMIN"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];
export type EditorRole = (typeof EDITOR_ROLES)[number];

// ── Session helpers ───────────────────────────────────────────────────

/** Extract the role string from a session user object */
function getUserRole(session: Session | null): string {
  return ((session?.user as Record<string, unknown> | undefined)?.role as string) ?? "";
}

/** Extract the user ID from a session user object */
function getUserId(session: Session | null): string | null {
  return ((session?.user as Record<string, unknown> | undefined)?.id as string) ?? null;
}

// ── Auth guard: ADMIN or SUPER_ADMIN ──────────────────────────────────
/**
 * Require ADMIN or SUPER_ADMIN role.
 * Returns the session on success, or null if unauthorized.
 *
 * Usage in API routes:
 * ```ts
 * const session = await requireAdmin();
 * if (!session) return unauthorizedResponse();
 * ```
 */
export async function requireAdmin() {
  const session = await auth();
  const role = getUserRole(session);
  if (!session || !ADMIN_ROLES.includes(role as AdminRole)) return null;
  return session;
}

// ── Auth guard: EDITOR, ADMIN, or SUPER_ADMIN ─────────────────────────
/**
 * Require at least EDITOR role.
 * Returns the session on success, or null if unauthorized.
 */
export async function requireEditor() {
  const session = await auth();
  const role = getUserRole(session);
  if (!session || !EDITOR_ROLES.includes(role as EditorRole)) return null;
  return session;
}

// ── Auth guard: SUPER_ADMIN only ──────────────────────────────────────
/**
 * Require SUPER_ADMIN role.
 * Returns the session on success, or null if unauthorized.
 */
export async function requireSuperAdmin() {
  const session = await auth();
  const role = getUserRole(session);
  if (!session || role !== "SUPER_ADMIN") return null;
  return session;
}

// ── Convenience: get current session role ─────────────────────────────
export async function getSessionRole(): Promise<{
  session: Session;
  role: string;
  userId: string | null;
} | null> {
  const session = await auth();
  if (!session?.user) return null;
  return {
    session,
    role: getUserRole(session),
    userId: getUserId(session),
  };
}

// ── Standard error responses ──────────────────────────────────────────
export function unauthorizedResponse(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

// ── Role-check utilities (non-async, for use after session is fetched) ─
export function isAdmin(role: string): boolean {
  return ADMIN_ROLES.includes(role as AdminRole);
}

export function isEditor(role: string): boolean {
  return EDITOR_ROLES.includes(role as EditorRole);
}

export function isSuperAdmin(role: string): boolean {
  return role === "SUPER_ADMIN";
}
