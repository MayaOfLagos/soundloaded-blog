import Image from "next/image";
import Link from "next/link";
import { Mail, Send } from "lucide-react";
import { PostBody } from "@/components/blog/PostBody";
import type { PublicSettings } from "@/lib/settings";
import type { getPublishedPageBySlug } from "@/lib/pages";
import { cn, formatDate } from "@/lib/utils";

type Page = NonNullable<Awaited<ReturnType<typeof getPublishedPageBySlug>>>;

interface PublicPageContentProps {
  page: Page;
  settings: PublicSettings;
}

export function PublicPageContent({ page, settings }: PublicPageContentProps) {
  const template = page.template.toUpperCase();
  const isFullWidth = template === "FULL_WIDTH";
  const isLegal = template === "LEGAL";
  const isContact = template === "CONTACT";

  return (
    <main
      className={cn("mx-auto px-4 py-8 sm:px-6 sm:py-12", isFullWidth ? "max-w-6xl" : "max-w-3xl")}
    >
      <article>
        <header className={cn("mb-8", isLegal && "border-border border-b pb-6")}>
          <p className="text-brand mb-3 text-xs font-bold tracking-[0.2em] uppercase">
            {isLegal ? "Legal" : isContact ? "Contact" : "Soundloaded"}
          </p>
          <h1 className="text-foreground text-4xl leading-tight font-black tracking-tight sm:text-5xl">
            {page.title}
          </h1>
          {page.excerpt && (
            <p className="text-muted-foreground mt-4 text-lg leading-relaxed">{page.excerpt}</p>
          )}
          {isLegal && page.updatedAt && (
            <p className="text-muted-foreground mt-4 text-sm">
              Last updated {formatDate(page.updatedAt)}
            </p>
          )}
        </header>

        {page.coverImage && (
          <div className="bg-muted relative mb-8 aspect-[16/7] overflow-hidden rounded-xl">
            <Image src={page.coverImage} alt={page.title} fill className="object-cover" priority />
          </div>
        )}

        <div className={cn(isFullWidth && "grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]")}>
          <div className="min-w-0">
            <PostBody body={page.body} />
          </div>

          {isFullWidth && (
            <aside className="border-border bg-card h-fit rounded-xl border p-5">
              <p className="text-foreground text-sm font-semibold">Page info</p>
              <p className="text-muted-foreground mt-2 text-sm">
                Published by {page.author?.name ?? settings.siteName}.
              </p>
            </aside>
          )}
        </div>

        {isContact && (
          <section className="border-border bg-card mt-10 rounded-xl border p-5 sm:p-6">
            <h2 className="text-foreground text-lg font-bold">Reach Soundloaded</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {settings.contactEmail && (
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="border-border hover:border-brand/50 hover:bg-brand/5 flex items-center gap-3 rounded-lg border p-4 transition-colors"
                >
                  <Mail className="text-brand h-5 w-5" />
                  <span className="text-sm font-medium">{settings.contactEmail}</span>
                </a>
              )}
              {settings.telegram && (
                <Link
                  href={
                    settings.telegram.startsWith("http")
                      ? settings.telegram
                      : `https://t.me/${settings.telegram.replace(/^@/, "")}`
                  }
                  target="_blank"
                  className="border-border hover:border-brand/50 hover:bg-brand/5 flex items-center gap-3 rounded-lg border p-4 transition-colors"
                >
                  <Send className="text-brand h-5 w-5" />
                  <span className="text-sm font-medium">Telegram</span>
                </Link>
              )}
            </div>
          </section>
        )}
      </article>
    </main>
  );
}
