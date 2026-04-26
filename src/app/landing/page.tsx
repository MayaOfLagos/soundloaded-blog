import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { PremiumLanding } from "@/components/landing/PremiumLanding";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: `${s.siteName} — ${s.tagline}`,
    description: s.metaDescription,
    alternates: { canonical: "/" },
    // Never index this internal route directly; / is the canonical URL
    robots: { index: false, follow: false },
  };
}

/**
 * Internal-only landing page.
 * Reachable only via the middleware rewrite when the sl_entered cookie is absent.
 * Direct navigation to /landing returns the page normally here (middleware doesn't block it),
 * but the only way a user sees this is through the / route rewrite.
 */
export default async function LandingPage() {
  return <PremiumLanding />;
}
