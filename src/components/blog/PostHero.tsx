import Image from "next/image";
import Link from "next/link";
import { Calendar, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { formatDate, formatRelativeDate } from "@/lib/utils";

interface PostHeroProps {
  post: {
    title: string;
    excerpt?: string | null;
    coverImage?: string | null;
    publishedAt?: Date | null;
    views: number;
    author: { name: string | null; image: string | null };
    category?: { name: string; slug: string } | null;
    tags?: { tag: { name: string; slug: string } }[];
  };
  dateFormat?: string;
}

export function PostHero({ post, dateFormat }: PostHeroProps) {
  return (
    <header>
      {/* Breadcrumb */}
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {post.category && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/news">{post.category.name}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}
          <BreadcrumbItem>
            <BreadcrumbPage className="line-clamp-1">{post.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Category badge */}
      {post.category && (
        <Link href="/news">
          <Badge className="bg-brand text-brand-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
            {post.category.name}
          </Badge>
        </Link>
      )}

      {/* Title */}
      <h1 className="text-foreground text-2xl leading-tight font-black sm:text-3xl lg:text-4xl">
        {post.title}
      </h1>

      {/* Excerpt */}
      {post.excerpt && (
        <p className="text-muted-foreground mt-3 text-lg leading-relaxed">{post.excerpt}</p>
      )}

      {/* Meta row */}
      <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-4 text-sm">
        {post.author.name && (
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={post.author.image ?? undefined} />
              <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-foreground font-medium">{post.author.name}</span>
          </div>
        )}

        {post.publishedAt && (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <time dateTime={post.publishedAt.toISOString()}>
              {formatDate(post.publishedAt, dateFormat)}
            </time>
            <span className="text-muted-foreground/60">
              ({formatRelativeDate(post.publishedAt)})
            </span>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5" />
          <span>{post.views.toLocaleString()} views</span>
        </div>
      </div>

      {/* Cover image */}
      {post.coverImage && (
        <div className="bg-muted relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-xl">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.map(({ tag }) => (
            <Link key={tag.slug} href={`/tag/${tag.slug}`}>
              <Badge variant="secondary" className="hover:bg-muted text-xs">
                #{tag.name}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
