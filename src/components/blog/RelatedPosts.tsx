import { PostCard, type PostCardData } from "./PostCard";

interface RelatedPostsProps {
  posts: PostCardData[];
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
