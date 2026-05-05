import { getSettings } from "@/lib/settings";
import { PostCard, type PostCardData } from "./PostCard";

interface RelatedPostsProps {
  posts: PostCardData[];
}

export async function RelatedPosts({ posts }: RelatedPostsProps) {
  const settings = await getSettings();
  const fallbackSrc = settings.postFallbackOgImage ?? settings.defaultOgImage;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} fallbackSrc={fallbackSrc} />
      ))}
    </div>
  );
}
