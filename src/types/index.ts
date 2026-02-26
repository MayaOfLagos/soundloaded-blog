export type PostStatus = "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";
export type PostType = "NEWS" | "MUSIC" | "GIST" | "ALBUM" | "VIDEO" | "LYRICS";
export type UserRole = "READER" | "CONTRIBUTOR" | "EDITOR" | "ADMIN" | "SUPER_ADMIN";
export type AlbumType = "ALBUM" | "EP" | "MIXTAPE" | "COMPILATION";
export type CommentStatus = "PENDING" | "APPROVED" | "REJECTED" | "SPAM";

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PostCard {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImage?: string | null;
  type: PostType;
  publishedAt?: Date | null;
  views: number;
  author: { name?: string | null; image?: string | null };
  category?: { name: string; slug: string; color?: string | null } | null;
  tags: { tag: { name: string; slug: string } }[];
  music?: {
    downloadCount: number;
    artistId: string;
    artist: { name: string; slug: string };
  } | null;
}

export interface MusicCard {
  id: string;
  title: string;
  slug: string;
  coverArt?: string | null;
  downloadCount: number;
  format: string;
  duration?: number | null;
  genre?: string | null;
  artist: { name: string; slug: string; photo?: string | null };
  album?: { title: string; slug: string } | null;
  post: { publishedAt?: Date | null };
}

export interface ArtistCard {
  id: string;
  name: string;
  slug: string;
  photo?: string | null;
  genre?: string | null;
  country?: string | null;
  _count?: { music: number };
}
