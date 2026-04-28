import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

export const PAGE_TEMPLATES = [
  { value: "DEFAULT", label: "Default" },
  { value: "LEGAL", label: "Legal" },
  { value: "CONTACT", label: "Contact" },
  { value: "FULL_WIDTH", label: "Full Width" },
] as const;

export type PageTemplate = (typeof PAGE_TEMPLATES)[number]["value"];

export const DEFAULT_PAGE_BODY = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

const RESERVED_ROOT_SLUGS = new Set([
  "admin",
  "api",
  "albums",
  "apply",
  "artists",
  "author",
  "billing",
  "bookmarks",
  "comments",
  "dashboard",
  "downloads",
  "explore",
  "favorites",
  "feed",
  "forgot-password",
  "gist",
  "landing",
  "library",
  "login",
  "lyrics",
  "maintenance",
  "music",
  "news",
  "notifications",
  "offline",
  "playlists",
  "profile",
  "register",
  "reset-password",
  "search",
  "settings",
  "videos",
]);

export const SYSTEM_PAGE_SEEDS = [
  {
    systemKey: "about",
    title: "About Soundloaded",
    slug: "about",
    excerpt: "Learn more about Soundloaded and the culture we serve.",
    template: "DEFAULT" as PageTemplate,
    showInFooter: true,
    sortOrder: 10,
    body: pageBody([
      "Soundloaded is built for music lovers, artists, and culture watchers who want the latest sounds, stories, and discoveries in one place.",
      "Use this page to tell visitors who you are, what Soundloaded stands for, and how the platform helps artists and listeners connect.",
    ]),
  },
  {
    systemKey: "contact",
    title: "Contact",
    slug: "contact",
    excerpt: "Reach the Soundloaded team for support, submissions, partnerships, and press.",
    template: "CONTACT" as PageTemplate,
    showInFooter: true,
    sortOrder: 20,
    body: pageBody([
      "Need help, want to submit music, or have a business enquiry? Add your preferred contact channels here.",
    ]),
  },
  {
    systemKey: "privacy",
    title: "Privacy Policy",
    slug: "privacy",
    excerpt: "How Soundloaded handles privacy, data, and user information.",
    template: "LEGAL" as PageTemplate,
    showInFooter: true,
    sortOrder: 30,
    body: pageBody([
      "This privacy policy explains what information Soundloaded collects, how it is used, and the choices visitors have.",
      "Replace this draft with your reviewed privacy policy before publishing.",
    ]),
  },
  {
    systemKey: "terms",
    title: "Terms of Service",
    slug: "terms",
    excerpt: "The terms that govern use of Soundloaded.",
    template: "LEGAL" as PageTemplate,
    showInFooter: true,
    sortOrder: 40,
    body: pageBody([
      "These terms explain the rules for using Soundloaded, including content access, account behavior, and platform responsibilities.",
      "Replace this draft with your reviewed terms before publishing.",
    ]),
  },
  {
    systemKey: "dmca",
    title: "DMCA / Copyright",
    slug: "dmca",
    excerpt: "Copyright takedown and rights-holder contact information.",
    template: "LEGAL" as PageTemplate,
    showInFooter: true,
    sortOrder: 50,
    body: pageBody([
      "Use this page to explain how rights holders can contact Soundloaded about copyright issues or takedown requests.",
    ]),
  },
] as const;

export type PublicPage = Awaited<ReturnType<typeof getPublishedPageBySlug>>;

export function normalizePageSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^a-z0-9/-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/\/{2,}/g, "/")
    .replace(/(^-|-$)/g, "")
    .split("/")
    .map((segment) => segment.replace(/(^-|-$)/g, ""))
    .filter(Boolean)
    .join("/");
}

export function isValidPageSlug(slug: string) {
  return /^[a-z0-9]+(?:[/-][a-z0-9]+)*$/.test(slug);
}

export function getPageUrl(slugOrPage: string | { slug: string }) {
  const slug = typeof slugOrPage === "string" ? slugOrPage : slugOrPage.slug;
  return `/${normalizePageSlug(slug)}`;
}

export function isReservedPageSlug(slug: string) {
  const normalized = normalizePageSlug(slug);
  const [root] = normalized.split("/");
  return RESERVED_ROOT_SLUGS.has(root);
}

export async function getPublishedPageBySlug(slug: string) {
  const normalized = normalizePageSlug(slug);
  if (!normalized) return null;

  return db.page.findFirst({
    where: {
      slug: normalized,
      status: "PUBLISHED",
      OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
    },
    include: {
      author: { select: { id: true, name: true, email: true, image: true } },
    },
  });
}

export const getNavigationPages = unstable_cache(
  async () => {
    const pages = await db.page.findMany({
      where: {
        status: "PUBLISHED",
        OR: [{ showInHeader: true }, { showInFooter: true }],
      },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        showInHeader: true,
        showInFooter: true,
        systemKey: true,
        sortOrder: true,
      },
    });

    return {
      header: pages.filter((page) => page.showInHeader),
      footer: pages.filter((page) => page.showInFooter),
    };
  },
  ["navigation-pages"],
  { revalidate: 300, tags: ["navigation-pages"] }
);

function pageBody(paragraphs: string[]) {
  return {
    type: "doc",
    content: paragraphs.map((text) => ({
      type: "paragraph",
      content: [{ type: "text", text }],
    })),
  };
}
