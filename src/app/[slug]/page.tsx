import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPostBySlug, getRelatedPosts } from "@/lib/api/posts";
import { PostHero } from "@/components/blog/PostHero";
import { PostBody } from "@/components/blog/PostBody";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { ShareButtons } from "@/components/blog/ShareButtons";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) return { title: "Post Not Found" };

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.coverImage ? [{ url: post.coverImage }] : [],
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      authors: post.author.name ? [post.author.name] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt ?? undefined,
    },
    alternates: { canonical: `/${slug}` },
  };
}

export const revalidate = 3600;

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  const related = await getRelatedPosts(post.id, post.category?.slug);

  const articleUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://soundloadedblog.ng"}/${slug}`;

  return (
    <article className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <PostHero post={post} />

      <div className="prose prose-zinc dark:prose-invert mt-8 max-w-none">
        <PostBody body={post.body} />
      </div>

      <div className="border-border mt-8 border-t pt-6">
        <ShareButtons url={articleUrl} title={post.title} />
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold">Related Posts</h2>
          <RelatedPosts posts={related} />
        </section>
      )}
    </article>
  );
}
