/**
 * JSON-LD structured data factory functions for SEO.
 * All functions return plain objects ready for JSON.stringify.
 */

export function buildCollectionPageSchema(
  name: string,
  description: string,
  path: string,
  siteUrl: string,
  siteName: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: `${siteUrl}${path}`,
    isPartOf: { "@type": "WebSite", name: siteName, url: siteUrl },
  };
}

export function buildWebSiteSchema(siteName: string, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildOrganizationSchema(
  siteName: string,
  siteUrl: string,
  logoUrl?: string | null
) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    ...(logoUrl ? { logo: logoUrl } : {}),
  };
}

export function buildNewsArticleSchema(
  post: {
    title: string;
    excerpt?: string | null;
    coverImage?: string | null;
    publishedAt?: Date | null;
    updatedAt: Date;
    slug: string;
    author: { name: string | null };
    category?: { name: string } | null;
  },
  siteUrl: string,
  siteName: string,
  articleUrl?: string
) {
  const url = articleUrl || `${siteUrl}/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    ...(post.excerpt ? { description: post.excerpt } : {}),
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(post.publishedAt ? { datePublished: post.publishedAt.toISOString() } : {}),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: post.author.name ?? siteName,
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/icons/icon-192.png`,
      },
    },
    ...(post.coverImage ? { image: post.coverImage } : {}),
    ...(post.category ? { articleSection: post.category.name } : {}),
  };
}

export function buildMusicRecordingSchema(
  track: {
    title: string;
    slug: string;
    genre?: string | null;
    year?: number | null;
    duration?: number | null;
    coverArt?: string | null;
    artist: { name: string; slug: string };
    album?: { title: string; slug: string } | null;
  },
  siteUrl: string
) {
  const url = `${siteUrl}/music/${track.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    name: track.title,
    url,
    byArtist: {
      "@type": "MusicGroup",
      name: track.artist.name,
      url: `${siteUrl}/artists/${track.artist.slug}`,
    },
    ...(track.genre ? { genre: track.genre } : {}),
    ...(track.year ? { dateCreated: String(track.year) } : {}),
    ...(track.duration
      ? {
          duration: `PT${Math.floor(track.duration / 60)}M${track.duration % 60}S`,
        }
      : {}),
    ...(track.coverArt ? { thumbnailUrl: track.coverArt } : {}),
    ...(track.album
      ? {
          inAlbum: {
            "@type": "MusicAlbum",
            name: track.album.title,
            url: `${siteUrl}/albums/${track.album.slug}`,
          },
        }
      : {}),
  };
}

export function buildMusicAlbumSchema(
  album: {
    title: string;
    slug: string;
    genre?: string | null;
    releaseDate?: Date | null;
    coverArt?: string | null;
    artist: { name: string; slug: string };
    tracks: Array<{
      title: string;
      slug: string;
      trackNumber?: number | null;
    }>;
  },
  siteUrl: string
) {
  const url = `${siteUrl}/albums/${album.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "MusicAlbum",
    name: album.title,
    url,
    byArtist: {
      "@type": "MusicGroup",
      name: album.artist.name,
      url: `${siteUrl}/artists/${album.artist.slug}`,
    },
    ...(album.genre ? { genre: album.genre } : {}),
    ...(album.releaseDate ? { datePublished: album.releaseDate.toISOString().slice(0, 10) } : {}),
    ...(album.coverArt ? { thumbnailUrl: album.coverArt } : {}),
    track: album.tracks.map((t) => ({
      "@type": "MusicRecording",
      name: t.title,
      url: `${siteUrl}/music/${t.slug}`,
      ...(t.trackNumber ? { position: t.trackNumber } : {}),
    })),
  };
}

export function buildMusicGroupSchema(
  artist: {
    name: string;
    slug: string;
    bio?: string | null;
    photo?: string | null;
    genre?: string | null;
    country?: string | null;
  },
  siteUrl: string
) {
  const url = `${siteUrl}/artists/${artist.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: artist.name,
    url,
    ...(artist.bio ? { description: artist.bio } : {}),
    ...(artist.photo ? { image: artist.photo } : {}),
    ...(artist.genre ? { genre: artist.genre } : {}),
    ...(artist.country ? { foundingLocation: { "@type": "Place", name: artist.country } } : {}),
  };
}

export function buildBreadcrumbSchema(
  items: Array<{ name: string; url: string }>,
  siteUrl: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${siteUrl}${item.url}`,
    })),
  };
}
