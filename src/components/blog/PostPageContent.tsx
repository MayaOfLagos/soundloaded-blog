import { redirect } from "next/navigation";
import { getPostUrl } from "@/lib/urls";
import { getRelatedPostsByType } from "@/lib/api/posts";
import type { PublicSettings } from "@/lib/settings";
import { NewsPostDetail } from "@/components/blog/detail/NewsPostDetail";
import { MusicPostDetail } from "@/components/blog/detail/MusicPostDetail";
import { GistPostDetail } from "@/components/blog/detail/GistPostDetail";
import { AlbumPostDetail } from "@/components/blog/detail/AlbumPostDetail";
import { VideoPostDetail } from "@/components/blog/detail/VideoPostDetail";
import { LyricsPostDetail } from "@/components/blog/detail/LyricsPostDetail";
import type { DetailPageProps } from "@/components/blog/detail/types";

interface PostPageContentProps {
  post: DetailPageProps["post"];
  settings: PublicSettings;
  currentPath: string;
}

export async function PostPageContent({ post, settings, currentPath }: PostPageContentProps) {
  const canonicalPath = getPostUrl(post, settings.permalinkStructure);

  if (currentPath !== canonicalPath) {
    redirect(canonicalPath);
  }

  // Gist/News pages need more related posts (3 grid + remaining list)
  const relatedLimit =
    post.type === "GIST" || post.type === "NEWS" || post.type === "VIDEO" ? 11 : 4;
  const related = await getRelatedPostsByType(
    post.id,
    post.type,
    post.category?.slug,
    relatedLimit,
    settings.permalinkStructure,
    post.tags?.map(({ tag }) => tag.slug) ?? []
  );

  const articleUrl = `${settings.siteUrl}${canonicalPath}`;

  const props: DetailPageProps = { post, settings, related, articleUrl };

  switch (post.type) {
    case "MUSIC":
      return <MusicPostDetail {...props} />;
    case "ALBUM":
      return <AlbumPostDetail {...props} />;
    case "VIDEO":
      return <VideoPostDetail {...props} />;
    case "GIST":
      return <GistPostDetail {...props} />;
    case "LYRICS":
      return <LyricsPostDetail {...props} />;
    case "NEWS":
    default:
      return <NewsPostDetail {...props} />;
  }
}
