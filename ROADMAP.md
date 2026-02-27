# Soundloaded Blog Platform — Full Build Roadmap

> Nigeria's Premier Music News, Free Downloads & Entertainment Blog
> Built by MayaOfLagos · CEO & Founder, Soundloaded Nigeria

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [What We Are Building](#2-what-we-are-building)
3. [Core Principles](#3-core-principles)
4. [Full Tech Stack](#4-full-tech-stack)
5. [Architecture Overview](#5-architecture-overview)
6. [Project Structure](#6-project-structure)
7. [Phase Roadmap](#7-phase-roadmap)
8. [Complete Installation Guide](#8-complete-installation-guide)
9. [Cloudflare R2 CDN Setup](#9-cloudflare-r2-cdn-setup)
10. [Docker Configuration](#10-docker-configuration)
11. [Git Workflow & Branching Strategy](#11-git-workflow--branching-strategy)
12. [Vercel Deployment Guide](#12-vercel-deployment-guide)
13. [Environment Variables Reference](#13-environment-variables-reference)
14. [Database Schema Overview](#14-database-schema-overview)
15. [API Endpoints Overview](#15-api-endpoints-overview)
16. [UI Component Strategy](#16-ui-component-strategy)

---

## 1. Project Overview

**Soundloaded Blog** is a high-performance, mobile-first music entertainment blog platform built for African audiences — starting from Nigeria. It replaces the legacy WordPress setup with a fully custom, modern web application stack designed for speed, scalability, and a world-class user experience on every device and network condition.

| Property               | Value                                                                   |
| ---------------------- | ----------------------------------------------------------------------- |
| **Platform**           | Web (PWA — Progressive Web App)                                         |
| **Primary Audience**   | Mobile users across Nigeria & Africa                                    |
| **Content Types**      | Music News, Free Music Downloads, Gist, Artist Profiles, Albums, Lyrics |
| **Hosting**            | Vercel (Frontend + API) · Neon (Database) · Cloudflare R2 (Media CDN)   |
| **Version Control**    | Git (GitHub)                                                            |
| **Containerization**   | Docker (local development environment)                                  |
| **Target Performance** | Lighthouse Score 90+ · First Contentful Paint < 1.5s                    |

---

## 2. What We Are Building

### 2.1 The Public Blog (Frontend)

A beautifully crafted, blazing fast mobile-first blog that feels like a native app. Users can:

- Read **music news articles** with rich media (images, embedded videos, audio snippets)
- **Download free music** — singles, albums, EPs with download counters and artist metadata
- Browse **Gist / Entertainment** content — celebrity news, industry talk, trending stories
- **Search** across all content instantly (typo-tolerant, sub-100ms results)
- **Listen to previews** directly inside the feed via a persistent floating mini-player
- Browse by **genre, artist, label, year, or tag**
- Read and react to articles — likes, comments, shares
- **Subscribe** to newsletter for new music alerts
- **Install the blog as an app** on their phone (PWA — Add to Home Screen)
- Read articles **offline** after first visit (Service Worker caching)
- Receive **push notifications** for new music drops

### 2.2 The Admin Dashboard (Backend Panel)

A custom-built admin panel using shadcn/ui components, accessible at `/admin`, that allows the Soundloaded editorial team to:

- **Create, edit, publish, and schedule** blog posts with a rich text editor
- **Upload music files** to Cloudflare R2 CDN directly from the dashboard
- Manage **artist profiles** — bio, photo, social links, discography
- Track **download analytics** — which songs are downloaded most, by region, by time
- Manage **categories, tags, and genres**
- Moderate **user comments**
- View **traffic analytics** — page views, most read articles, popular downloads
- Manage **newsletter subscribers** and send bulk emails
- Control **featured content** — homepage banners, top picks, trending
- Manage **user accounts** (admin roles, editor roles, contributor roles)

### 2.3 The Content Engine (Payload CMS)

Payload CMS v3 powers the structured content layer — tightly integrated into Next.js. It provides:

- **Type-safe collections** for Posts, Music, Artists, Albums, Categories, Tags, Users
- **Rich text editing** with Lexical editor (supports embeds, audio, video, images)
- **Draft/Publish workflow** — editors save drafts, admins approve and publish
- **Scheduled publishing** — set a post to go live at midnight automatically
- **Media management** — automatic image resizing, WebP conversion, CDN upload
- **Webhooks** — trigger Vercel revalidation when content is updated
- **Localization-ready** — for future multi-language support (Yoruba, Igbo, Pidgin)

### 2.4 The Music Download System

The heart of the platform — a managed music delivery system:

- Each track has metadata: title, artist, album, genre, BPM, release date, label
- Music files stored on **Cloudflare R2** (zero egress cost)
- **Signed URLs** for protected downloads (prevents direct hotlinking)
- **Download rate limiting** per IP (prevent abuse)
- **Download counter** per track, real-time
- **Download history** for registered users
- **Album downloads** — zip multiple tracks on the fly

### 2.5 The Persistent Audio Player

A Spotify-like mini music player that:

- Lives at the bottom of the screen (mobile) / left sidebar (desktop)
- **Keeps playing as you navigate** (SPA architecture — no page reloads interrupt audio)
- Shows: track title, artist, album art, progress bar, volume
- Prev / Next track navigation
- Full-screen player view on mobile
- Playlist/queue management

---

## 3. Core Principles

### Mobile-First, Always

Every component, layout, and interaction is designed for 360px screens first. Desktop is an enhancement, not the baseline. Given that 85%+ of Nigerian internet users are on mobile, this is non-negotiable.

### Performance Over Features

We ship only what adds value. No bloated libraries, no unused polyfills, no render-blocking scripts. Every millisecond matters on slower African network connections.

### Offline-Capable

Service Worker + background sync ensures users can read cached articles and queue downloads even on spotty connections.

### SEO from Day One

Every page has proper meta tags, Open Graph images, JSON-LD structured data, sitemaps, and canonical URLs. The blog ranks or it doesn't exist.

### Type-Safe Throughout

TypeScript everywhere — frontend, backend, CMS, database queries. Bugs caught at compile time, not at 3am in production.

### Developer Experience

Clean project structure, consistent conventions, pre-commit hooks, formatted code, documented APIs. The team can move fast without breaking things.

---

## 4. Full Tech Stack

### Frontend

| Layer               | Technology                         | Purpose                                |
| ------------------- | ---------------------------------- | -------------------------------------- |
| Framework           | **Next.js 15** (App Router)        | SSR, SSG, ISR, React Server Components |
| Language            | **TypeScript**                     | Type safety across the codebase        |
| Styling             | **Tailwind CSS v4**                | Mobile-first utility-first CSS         |
| UI Components       | **shadcn/ui**                      | Admin + frontend base components       |
| UI Polish           | **uselayouts.com** (shadcn-based)  | Premium layout & frontend polish       |
| Animations          | **Framer Motion**                  | Page transitions, micro-interactions   |
| Icons               | **Lucide React** + **React Icons** | Consistent icon system                 |
| Themes              | **next-themes**                    | Dark/Light mode                        |
| Toast Notifications | **react-hot-toast**                | System-wide toast (NO shadcn toast)    |
| State Management    | **Zustand**                        | Global state (player, auth, cart)      |
| Data Fetching       | **TanStack Query v5**              | Server state, caching, background sync |
| HTTP Client         | **Axios**                          | API calls with interceptors            |
| Forms               | **React Hook Form** + **Zod**      | Forms + validation                     |
| Audio Player        | **Howler.js**                      | Cross-browser audio playback           |
| Rich Text           | **@payloadcms/richtext-lexical**   | Article body renderer                  |
| Date Formatting     | **date-fns**                       | Human-readable dates                   |
| SEO                 | **next-sitemap**                   | Auto sitemap + robots.txt              |
| Analytics           | **@vercel/analytics** + **Umami**  | Privacy-first analytics                |
| PWA                 | **Serwist** (@serwist/next)        | Service Worker, offline, push          |

### Backend / CMS

| Layer        | Technology                        | Purpose                           |
| ------------ | --------------------------------- | --------------------------------- |
| CMS          | **Payload CMS v3**                | Headless CMS, built into Next.js  |
| Auth         | **Auth.js v5** (NextAuth)         | Authentication — JWT + sessions   |
| API          | **Next.js Route Handlers**        | REST API endpoints                |
| Validation   | **Zod**                           | Schema validation on server       |
| Password     | **bcryptjs**                      | Hashing passwords                 |
| Email        | **Resend**                        | Transactional emails, newsletters |
| Search       | **Meilisearch**                   | Full-text search for all content  |
| File Storage | **Cloudflare R2** (S3-compatible) | Music, images, media CDN          |
| File SDK     | **@aws-sdk/client-s3**            | R2 upload/download (S3 API)       |
| Slugs        | **slugify**                       | URL-safe slugs from titles        |
| Images       | **Sharp**                         | Server-side image processing      |

### Database

| Layer        | Technology                         | Purpose                       |
| ------------ | ---------------------------------- | ----------------------------- |
| Primary DB   | **PostgreSQL** (Neon — serverless) | All structured content data   |
| ORM          | **Prisma**                         | Type-safe database queries    |
| Caching      | **Redis** (Upstash — serverless)   | Hot data cache, rate limiting |
| Search Index | **Meilisearch**                    | Full-text search index        |

### Infrastructure

| Service          | Provider                    | Purpose                            |
| ---------------- | --------------------------- | ---------------------------------- |
| Frontend Hosting | **Vercel**                  | Next.js deployment, edge network   |
| Database         | **Neon**                    | Serverless PostgreSQL              |
| Media CDN        | **Cloudflare R2 + CDN**     | Music files, images, zero egress   |
| Cache            | **Upstash Redis**           | Serverless Redis                   |
| Search           | **Meilisearch Cloud**       | Search engine                      |
| Email            | **Resend**                  | Email delivery                     |
| Error Tracking   | **Sentry**                  | Frontend + server error monitoring |
| Containerization | **Docker**                  | Local development environment      |
| Version Control  | **Git + GitHub**            | Source code management             |
| CI/CD            | **Vercel + GitHub Actions** | Auto deploy on push                |

---

## 5. Architecture Overview

```
                    ┌─────────────────────────────────────┐
                    │      Cloudflare (DNS + CDN Layer)    │
                    │  cdn.soundloaded.ng / soundloaded.ng │
                    └──────┬──────────────┬───────────────┘
                           │              │
              ┌────────────▼──┐    ┌──────▼──────────────┐
              │  Next.js 15   │    │   Cloudflare R2      │
              │   on Vercel   │    │   (Music + Images)   │
              │               │    │   cdn.soundloaded.ng  │
              │  ┌─────────┐  │    └─────────────────────-┘
              │  │ Payload │  │
              │  │ CMS v3  │  │
              │  │ /admin  │  │
              │  └────┬────┘  │
              │       │       │
              │  Route Handlers (API)
              │       │       │
              └───────┼───────┘
                      │
         ┌────────────┼────────────────┐
         │            │                │
┌────────▼───┐  ┌─────▼────┐  ┌───────▼──────┐
│ PostgreSQL │  │  Redis   │  │  Meilisearch │
│  (Neon)   │  │ (Upstash) │  │   (Search)   │
└────────────┘  └──────────┘  └──────────────┘

         PWA Layer (Serwist Service Worker)
┌──────────────────────────────────────────────┐
│  Cache Strategy: Stale-While-Revalidate      │
│  Offline: Cached articles readable offline   │
│  Push: New music drop notifications          │
│  Background Sync: Download queue             │
└──────────────────────────────────────────────┘
```

### Request Flow

```
User visits soundloaded.ng/music/burna-boy-new-song
  → Cloudflare DNS resolves → routes to Vercel Edge
  → Next.js checks: is this page cached? (ISR)
    → YES: serve from cache instantly (< 50ms)
    → NO: fetch from Neon PostgreSQL → render → cache → serve
  → Service Worker intercepts: update cache in background
  → TanStack Query: hydrates client-side, keeps data fresh
  → Music file request → Cloudflare R2 via signed URL
```

---

## 6. Project Structure

```
soundloaded-blog/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # Lint, type-check, test on PR
│   │   └── deploy.yml                # Deploy to Vercel on merge to main
│   └── PULL_REQUEST_TEMPLATE.md
│
├── .husky/                           # Git hooks
│   ├── pre-commit                    # Run lint-staged
│   └── commit-msg                   # Enforce conventional commits
│
├── docker/
│   ├── Dockerfile                    # Production multi-stage build
│   ├── Dockerfile.dev                # Development image
│   └── docker-compose.yml           # Local dev: PG + Redis + Meilisearch
│
├── prisma/
│   ├── schema.prisma                 # Database schema
│   ├── migrations/                   # DB migration history
│   └── seed.ts                       # Seed data for development
│
├── public/
│   ├── icons/                        # PWA icons (all sizes)
│   ├── screenshots/                  # PWA install screenshots
│   ├── og/                           # Open Graph fallback images
│   ├── manifest.json                 # PWA manifest
│   ├── robots.txt                    # SEO robots file
│   └── sw.js                         # Service worker (generated by Serwist)
│
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (frontend)/               # Public-facing blog routes
│   │   │   ├── layout.tsx            # Root layout with nav + player + footer
│   │   │   ├── page.tsx              # Homepage
│   │   │   ├── music/
│   │   │   │   ├── page.tsx          # All music listing
│   │   │   │   └── [slug]/page.tsx   # Single music post
│   │   │   ├── news/
│   │   │   │   ├── page.tsx          # All news listing
│   │   │   │   └── [slug]/page.tsx   # Single news article
│   │   │   ├── gist/
│   │   │   │   ├── page.tsx          # All gist/entertainment
│   │   │   │   └── [slug]/page.tsx   # Single gist post
│   │   │   ├── artist/
│   │   │   │   ├── page.tsx          # Artist directory
│   │   │   │   └── [slug]/page.tsx   # Artist profile page
│   │   │   ├── album/
│   │   │   │   └── [slug]/page.tsx   # Album page with tracklist
│   │   │   ├── category/
│   │   │   │   └── [slug]/page.tsx   # Category archive
│   │   │   ├── tag/
│   │   │   │   └── [slug]/page.tsx   # Tag archive
│   │   │   ├── search/
│   │   │   │   └── page.tsx          # Search results page
│   │   │   └── download/
│   │   │       └── [id]/route.ts     # Secure download handler (signed URL)
│   │   │
│   │   ├── (admin)/                  # Admin dashboard routes
│   │   │   ├── layout.tsx            # Admin layout (sidebar + header)
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx          # Dashboard overview
│   │   │   │   ├── posts/            # Manage posts
│   │   │   │   ├── music/            # Manage music uploads
│   │   │   │   ├── artists/          # Manage artists
│   │   │   │   ├── albums/           # Manage albums
│   │   │   │   ├── analytics/        # Traffic + download stats
│   │   │   │   ├── comments/         # Comment moderation
│   │   │   │   ├── subscribers/      # Newsletter management
│   │   │   │   ├── settings/         # Site settings
│   │   │   │   └── users/            # User management
│   │   │
│   │   ├── (auth)/                   # Auth routes
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   │
│   │   ├── api/                      # API Route Handlers
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── posts/route.ts
│   │   │   ├── music/route.ts
│   │   │   ├── music/[id]/download/route.ts
│   │   │   ├── artists/route.ts
│   │   │   ├── search/route.ts
│   │   │   ├── upload/route.ts        # R2 presigned URL generator
│   │   │   ├── comments/route.ts
│   │   │   ├── newsletter/route.ts
│   │   │   └── webhooks/
│   │   │       └── payload/route.ts  # Payload CMS webhook → ISR revalidate
│   │   │
│   │   └── (payload)/                # Payload CMS admin UI
│   │       └── admin/[[...segments]]/page.tsx
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui base components
│   │   ├── layouts/                  # uselayouts.com components
│   │   ├── blog/                     # Blog-specific components
│   │   │   ├── PostCard.tsx          # Article card (grid/list variants)
│   │   │   ├── PostHero.tsx          # Article hero section
│   │   │   ├── PostBody.tsx          # Rich text renderer
│   │   │   ├── RelatedPosts.tsx      # Related articles sidebar
│   │   │   └── ShareButtons.tsx      # Social share buttons
│   │   ├── music/                    # Music-specific components
│   │   │   ├── MusicCard.tsx         # Music post card with play button
│   │   │   ├── DownloadButton.tsx    # Download CTA with counter
│   │   │   ├── TrackList.tsx         # Album tracklist
│   │   │   └── ArtistCard.tsx        # Artist mini card
│   │   ├── player/                   # Persistent audio player
│   │   │   ├── MiniPlayer.tsx        # Bottom bar player (mobile)
│   │   │   ├── FullPlayer.tsx        # Full-screen player
│   │   │   ├── PlayerQueue.tsx       # Queue management
│   │   │   └── PlayerProgress.tsx    # Seek bar component
│   │   ├── navigation/              # Nav components
│   │   │   ├── Navbar.tsx            # Top nav (mobile hamburger + desktop)
│   │   │   ├── MobileNav.tsx         # Slide-out mobile drawer
│   │   │   ├── Sidebar.tsx           # Desktop sidebar
│   │   │   └── Footer.tsx            # Site footer
│   │   ├── common/                   # Shared utility components
│   │   │   ├── SearchBar.tsx         # Global search input
│   │   │   ├── CategoryTabs.tsx      # Category filter tabs
│   │   │   ├── InfiniteScroll.tsx    # Infinite scroll wrapper
│   │   │   ├── ImageWithFallback.tsx # Next/image with fallback
│   │   │   ├── AdBanner.tsx          # Ad placement component
│   │   │   └── NewsletterForm.tsx    # Email subscribe form
│   │   └── admin/                    # Admin-only components
│   │       ├── Sidebar.tsx           # Admin sidebar navigation
│   │       ├── DataTable.tsx         # Reusable data table
│   │       ├── UploadZone.tsx        # Drag-drop file uploader to R2
│   │       ├── RichEditor.tsx        # Post body editor
│   │       ├── StatsCard.tsx         # Analytics stat cards
│   │       └── RecentActivity.tsx    # Latest actions feed
│   │
│   ├── lib/
│   │   ├── db.ts                     # Prisma client singleton
│   │   ├── redis.ts                  # Upstash Redis client
│   │   ├── r2.ts                     # Cloudflare R2 / S3 client
│   │   ├── meilisearch.ts            # Meilisearch client
│   │   ├── resend.ts                 # Resend email client
│   │   ├── auth.ts                   # Auth.js config
│   │   ├── payload.ts                # Payload CMS client
│   │   ├── seo.ts                    # SEO metadata helpers
│   │   ├── utils.ts                  # General utilities (cn, formatDate...)
│   │   └── validations/              # Zod schemas
│   │       ├── post.schema.ts
│   │       ├── music.schema.ts
│   │       └── user.schema.ts
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── usePlayer.ts              # Audio player controls
│   │   ├── useDownload.ts            # Download with progress
│   │   ├── useSearch.ts              # Debounced search hook
│   │   ├── useInfiniteScroll.ts      # Intersection observer
│   │   └── useToast.ts              # react-hot-toast wrapper
│   │
│   ├── store/                        # Zustand stores
│   │   ├── player.store.ts           # Audio player global state
│   │   ├── auth.store.ts             # User auth state
│   │   └── ui.store.ts               # UI state (modals, sidebar open)
│   │
│   ├── types/                        # TypeScript type definitions
│   │   ├── post.types.ts
│   │   ├── music.types.ts
│   │   ├── artist.types.ts
│   │   └── api.types.ts
│   │
│   ├── payload/                      # Payload CMS configuration
│   │   ├── payload.config.ts         # Main Payload config
│   │   └── collections/              # Payload collections
│   │       ├── Posts.ts
│   │       ├── Music.ts
│   │       ├── Artists.ts
│   │       ├── Albums.ts
│   │       ├── Categories.ts
│   │       ├── Tags.ts
│   │       ├── Media.ts
│   │       └── Users.ts
│   │
│   └── middleware.ts                 # Auth + rate limiting middleware
│
├── .env                              # Local env (never commit)
├── .env.example                      # Env template (commit this)
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── pnpm-lock.yaml
└── ROADMAP.md                        # This file
```

---

## 7. Phase Roadmap

### Phase 0 — Prerequisites & Environment Setup ✅ COMPLETE (Feb 2026)

**Goal:** Everything installed, configured, running locally in Docker.

- [x] Install all prerequisites (Node.js, pnpm, Docker, Git)
- [x] Initialize Git repository + GitHub repo (first commit: e6c04f4)
- [x] Initialize Next.js 16 project with TypeScript (App Router, Turbopack)
- [x] Setup Docker (PostgreSQL:5433 + Redis:6380 + Meilisearch:7700 — no conflicts with soundloaded-\*)
- [x] Setup `.env` files (.env.example committed, .env in .gitignore)
- [x] Install all dependencies (production + dev — 78 files committed)
- [x] Initialize Prisma v5 + run first migration (20260226060224_init)
- [x] Configure Tailwind CSS v4
- [x] Initialize shadcn/ui (34 components installed; src/components/ui/\*\* excluded from ESLint)
- [ ] Setup uselayouts.com components (copy from site when building pages)
- [x] Configure ESLint, Prettier, Husky (commitlint body max 100 chars)
- [ ] Connect Cloudflare R2 bucket (needs real credentials in .env)
- [ ] Connect Neon PostgreSQL (needs production DATABASE_URL)
- [ ] Connect Upstash Redis (needs UPSTASH_REDIS_REST_URL)
- [ ] Initial Vercel project setup (pending GitHub repo push)

**Deliverable:** ✅ Local dev server running at `localhost:3000`, Docker services up, first commit made.

---

### Phase 1 — Foundation & Navigation ✅ COMPLETE (Feb 2026)

**Goal:** The shell of the blog is navigable on mobile and desktop.

- [x] Build root layout with Navbar, MobileNav, Footer
- [x] Mobile hamburger menu with slide-out drawer (shadcn Sheet)
- [x] Desktop navigation with category links
- [x] Dark/Light mode toggle (next-themes)
- [x] Category tabs (Music, News, Gist, Albums, Artists)
- [x] Homepage (FeaturedPost, LatestPostsGrid, TrendingSidebar, PopularMusicSidebar)
- [x] Responsive grid system (mobile 1-col, tablet 2-col, desktop 3-col)
- [x] Global search bar with Cmd+K shortcut (SearchDialog)
- [x] Footer with site links, social icons, newsletter form
- [x] 404 page and loading spinner
- [x] Skeleton screens (PostCardSkeleton variants)
- [x] ConditionalNavigation — hides public nav on /admin routes

**Deliverable:** Navigable shell, mobile-first, dark mode working. ✅

---

### Phase 2 — Blog Core (Posts & Content) ✅ COMPLETE (Feb 2026)

**Goal:** Full blog content pipeline — create, publish, display articles.

- [x] Setup Payload CMS v3 with all collections (Users, Media, Categories, Tags, Posts, Artists, Albums, Music)
- [x] Rich text editor with Lexical (images, embeds, blockquotes) via Payload
- [x] Draft / Publish / Scheduled / Archived workflow
- [x] Post detail page /[slug] with full Lexical JSON renderer (PostBody)
- [x] News listing page /news
- [x] Gist listing page /gist
- [x] PostCard component (3 variants: default, featured, compact)
- [x] PostHero with cover image, breadcrumbs, author, date, views
- [x] Related posts section (RelatedPosts)
- [x] Social share buttons (WhatsApp, Twitter/X, Facebook, Telegram, Copy Link)
- [x] SEO metadata per post (Open Graph, Twitter Cards, JSON-LD in generateMetadata)
- [x] Prisma data layer: lib/api/posts.ts (getFeaturedPost, getLatestPosts, getPostBySlug, etc.)
- [x] REST API: /api/posts, /api/posts/[slug], /api/categories
- [ ] Comment system (planned — Prisma Comment model exists, UI pending)
- [ ] RSS feed (/feed.xml) — planned
- [ ] Sitemap generation (next-sitemap) — planned Phase 6

**Deliverable:** Full editorial workflow. Editors can write and publish articles. Public can read them. ✅

---

### Phase 3 — Music System (Downloads & Player) ✅ COMPLETE (Feb 2026)

**Goal:** The core music feature — uploads, metadata, downloads, playback.

- [x] Music, Album, Artist collections in Payload CMS
- [x] Prisma data layer: lib/api/music.ts (getPopularMusic, getLatestMusic, getArtistBySlug, etc.)
- [x] Signed URL download endpoint /api/music/[id]/download (Upstash rate-limited, R2 presigned)
- [x] Stream endpoint /api/music/[id]/stream (redirects to R2 for Howler.js)
- [x] Download counter + stream counter incremented in Prisma
- [x] Music listing page /music, Music detail /music/[slug]
- [x] MusicCard, DownloadButton (with loading/done/error states + react-hot-toast)
- [x] Album pages /albums, /albums/[slug] with full tracklist
- [x] Artist pages /artists, /artists/[slug] with discography
- [x] Persistent floating MusicPlayer (Howler.js, Zustand store with persist)
- [x] Seek bar (Slider), volume control, prev/next track
- [x] MiniPlayer component (minimized state)
- [x] react-hot-toast for all download, stream, copy events

**Deliverable:** Users can browse, preview, and download music. Player persists across navigation. ✅

---

### Phase 4 — Admin Dashboard ✅ COMPLETE (Feb 2026)

**Goal:** Internal tools for the editorial team.

- [x] Admin layout at /admin (collapsible sidebar + topbar + main area)
- [x] Auth guard: redirects to /login if not ADMIN/SUPER_ADMIN/EDITOR
- [x] Dashboard: stats cards (posts, music, artists, downloads, subscribers) + recent posts
- [x] Posts table: list, filter by status/type, search, paginate
- [x] Create post form /admin/posts/new (title, slug, excerpt, body, cover, category, author, status)
- [x] Edit post form /admin/posts/[id] (same fields + delete/archive)
- [x] Music upload form /admin/music/upload (R2 key, metadata, artist, album)
- [x] Music table /admin/music (list, search, download/stream counts)
- [x] Artist management /admin/artists
- [x] Album management /admin/albums
- [x] Category management /admin/categories (create/edit/delete inline)
- [x] Comment moderation /admin/comments (approve/reject/spam, bulk actions)
- [x] Newsletter /admin/newsletter (subscriber list, stats cards, CSV export)
- [x] Analytics /admin/analytics (charts: pageviews, downloads, top posts)
- [x] User management /admin/users (role assignment, invite by email)
- [x] Settings /admin/settings (site name, social links, notifications — localStorage)
- [x] Admin API routes: /api/admin/posts, /api/admin/music, /api/admin/comments,
      /api/admin/newsletter, /api/admin/albums, /api/admin/categories, /api/admin/users
- [x] Login page /login (Auth.js v5 credentials, bcryptjs)

**Deliverable:** Full-featured admin panel. Team can manage all content without touching code. ✅

---

### Phase 5 — PWA, Performance & Polish

**Goal:** Native app feel, offline support, top Lighthouse scores.

- [ ] Serwist Service Worker setup
- [ ] Offline fallback page (branded "You're offline" page)
- [ ] Cache strategy: articles cached on visit, images cached progressively
- [ ] Background sync: download queue works when back online
- [ ] Web Push notifications: "New Music: Burna Boy drops tonight"
- [ ] PWA manifest (`manifest.json`) with all icon sizes
- [ ] Add-to-homescreen prompt (custom, branded)
- [ ] Splash screens for iOS and Android
- [ ] Image optimization audit (all images through next/image, WebP/AVIF)
- [ ] Bundle analyzer audit — remove any unused code
- [ ] Lighthouse audit: target 90+ on all categories
- [ ] Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] Prefetching: hover on links prefetches next page
- [ ] Skeleton loading everywhere (no jarring layout shifts)
- [ ] Framer Motion: page transitions, card hover effects, player animations
- [ ] uselayouts.com polish pass on all public pages

**Deliverable:** Install-to-homescreen, offline reading, Lighthouse 90+.

---

### Phase 6 — Search, SEO & Growth

**Goal:** Discoverability — show up on Google, find content fast.

- [ ] Meilisearch: index all posts, music, artists on content creation
- [ ] Search results page with faceted filtering (by type, genre, date)
- [ ] Instant search (debounced, results appear as you type)
- [ ] Search analytics (what are users searching for?)
- [ ] Google Search Console integration
- [ ] Structured data: Article, MusicRecording, Person, BreadcrumbList
- [ ] Internal linking system (related posts, same artist posts)
- [ ] Sitemap auto-updated on content publish
- [ ] Newsletter subscription with double opt-in
- [ ] Social auto-sharing on publish (optional — Twitter/X API)
- [ ] Vercel Analytics + Umami self-hosted analytics

**Deliverable:** SEO-ready, discoverable, newsletter growing.

---

### Phase 7 — Monetization & Scale

**Goal:** Revenue generation and production hardening.

- [ ] Google AdSense / direct ad placements (AdBanner component)
- [ ] Premium download tier (optional — gated behind account)
- [ ] Paystack integration (Nigerian payment gateway for premium)
- [ ] Sentry error monitoring (frontend + API)
- [ ] Rate limiting middleware on all API routes (Upstash Redis)
- [ ] Database connection pooling (PgBouncer via Neon)
- [ ] CDN caching headers tuned (Cloudflare page rules)
- [ ] Load testing (k6 or Artillery)
- [ ] Security audit (OWASP headers, CSP, rate limits, input sanitization)
- [ ] Backup strategy (daily Neon snapshots, R2 versioning)

---

## 8. Complete Installation Guide

### 8.1 Prerequisites

```bash
# Install Node.js 20+ via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 20
nvm use 20

# Install pnpm (fast, disk-efficient package manager)
npm install -g pnpm

# Install Docker Desktop
# → https://www.docker.com/products/docker-desktop/

# Install Git
# → https://git-scm.com/downloads

# Install Vercel CLI
pnpm install -g vercel

# Install Payload CLI
pnpm install -g payload
```

### 8.2 Initialize the Project

```bash
# Create Next.js 15 project
pnpm create next-app@latest soundloaded-blog \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd soundloaded-blog
```

### 8.3 Git Initialization

```bash
git init
git remote add origin https://github.com/soundloadedng/soundloaded-blog.git
git branch -M main

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Next.js
.next/
out/
build/

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Payload CMS
media/

# Database
prisma/dev.db

# Misc
.DS_Store
*.pem
.vercel
*.tsbuildinfo
next-env.d.ts

# Logs
*.log
npm-debug.log*
pnpm-debug.log*

# Docker
docker/data/
EOF

git add .
git commit -m "chore: initialize Next.js 15 project"
```

### 8.4 Install All Production Dependencies

```bash
# ── Core CMS ──────────────────────────────────────────────────────────
pnpm add payload @payloadcms/next @payloadcms/richtext-lexical \
  @payloadcms/db-postgres @payloadcms/storage-s3

# ── Database & ORM ────────────────────────────────────────────────────
pnpm add @prisma/client
pnpm add -D prisma

# ── Authentication ────────────────────────────────────────────────────
pnpm add next-auth@beta bcryptjs
pnpm add -D @types/bcryptjs

# ── UI & Styling ──────────────────────────────────────────────────────
pnpm add next-themes framer-motion lucide-react react-icons
pnpm add class-variance-authority clsx tailwind-merge

# ── Toast (System-wide — NO shadcn toast) ─────────────────────────────
pnpm add react-hot-toast

# ── Forms & Validation ────────────────────────────────────────────────
pnpm add react-hook-form zod @hookform/resolvers

# ── State Management ──────────────────────────────────────────────────
pnpm add zustand

# ── Data Fetching ─────────────────────────────────────────────────────
pnpm add @tanstack/react-query @tanstack/react-query-devtools axios

# ── Audio Player ──────────────────────────────────────────────────────
pnpm add howler
pnpm add -D @types/howler

# ── File Storage — Cloudflare R2 (S3-compatible SDK) ──────────────────
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner @aws-sdk/lib-storage

# ── Search ────────────────────────────────────────────────────────────
pnpm add meilisearch

# ── Email ─────────────────────────────────────────────────────────────
pnpm add resend

# ── Image Processing ──────────────────────────────────────────────────
pnpm add sharp

# ── PWA (Service Worker) ──────────────────────────────────────────────
pnpm add @serwist/next serwist

# ── Caching — Upstash Redis ───────────────────────────────────────────
pnpm add @upstash/redis @upstash/ratelimit

# ── SEO & Sitemap ─────────────────────────────────────────────────────
pnpm add next-sitemap

# ── Analytics ─────────────────────────────────────────────────────────
pnpm add @vercel/analytics @vercel/speed-insights

# ── Error Monitoring ──────────────────────────────────────────────────
pnpm add @sentry/nextjs

# ── Charts (Admin Analytics) ──────────────────────────────────────────
pnpm add recharts

# ── Drag & Drop (Admin file upload) ───────────────────────────────────
pnpm add react-dropzone

# ── Utilities ─────────────────────────────────────────────────────────
pnpm add date-fns slugify

# ── Infinite Scroll ───────────────────────────────────────────────────
pnpm add react-intersection-observer
```

### 8.5 Install Dev Dependencies

```bash
pnpm add -D \
  @types/node \
  @types/react \
  @types/react-dom \
  typescript \
  eslint \
  eslint-config-next \
  prettier \
  prettier-plugin-tailwindcss \
  husky \
  lint-staged \
  @commitlint/cli \
  @commitlint/config-conventional \
  cross-env \
  dotenv-cli
```

### 8.6 Setup shadcn/ui

```bash
# Initialize shadcn/ui
pnpm dlx shadcn@latest init

# When prompted:
# Style: Default
# Base color: Neutral (or Zinc — suits dark theme)
# CSS variables: Yes

# Install all needed components
pnpm dlx shadcn@latest add \
  button \
  card \
  input \
  label \
  textarea \
  select \
  checkbox \
  radio-group \
  switch \
  slider \
  progress \
  badge \
  avatar \
  separator \
  skeleton \
  sheet \
  dialog \
  alert-dialog \
  dropdown-menu \
  navigation-menu \
  tabs \
  accordion \
  collapsible \
  popover \
  hover-card \
  scroll-area \
  table \
  form \
  command \
  breadcrumb \
  pagination \
  sidebar \
  chart \
  drawer \
  sonner

# IMPORTANT: We use react-hot-toast, NOT sonner/toast from shadcn.
# The sonner install above is only if needed for admin patterns.
# For ALL user-facing toasts: use react-hot-toast only.
```

### 8.7 Setup uselayouts.com Components

```bash
# Visit https://www.uselayouts.com and browse their shadcn-compatible
# layout components. Install/copy the ones needed for:
# - Hero sections (homepage music hero)
# - Feature grids (trending music grid)
# - Card layouts (music card, news card variants)
# - Navigation patterns (sticky navbar, mobile menu)
# - Footer layouts
# - Pricing/CTA sections (for premium features)

# Most uselayouts.com components are copy-paste into src/components/layouts/
# Create the directory:
mkdir -p src/components/layouts

# After copying components from uselayouts.com, place them here:
# src/components/layouts/HeroSection.tsx
# src/components/layouts/FeatureGrid.tsx
# src/components/layouts/MusicHero.tsx
# etc.
```

### 8.8 Setup Prisma

```bash
# Initialize Prisma
pnpm prisma init --datasource-provider postgresql

# This creates:
# prisma/schema.prisma  ← edit with your schema (see Section 14)
# .env                  ← add DATABASE_URL here

# After writing your schema:
pnpm prisma generate          # Generate Prisma client
pnpm prisma migrate dev --name init  # Run first migration
pnpm prisma studio            # Open visual DB browser (optional)
```

### 8.9 Setup Payload CMS

```bash
# Payload v3 integrates directly into Next.js
# Add to your next.config.ts:

# Create payload config file:
touch src/payload/payload.config.ts

# Run Payload setup (generates types):
pnpm payload generate:types
```

### 8.10 Setup Husky & Commit Lint

```bash
# Initialize Husky
pnpm exec husky init

# Pre-commit hook (lint + type check)
cat > .husky/pre-commit << 'EOF'
pnpm lint-staged
EOF

# Commit message hook
cat > .husky/commit-msg << 'EOF'
pnpm commitlint --edit $1
EOF

# Commitlint config
cat > .commitlintrc.json << 'EOF'
{
  "extends": ["@commitlint/config-conventional"]
}
EOF

# Lint-staged config in package.json:
# "lint-staged": {
#   "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
#   "*.{json,md,css}": ["prettier --write"]
# }
```

### 8.11 Configure next.config.ts

```typescript
// next.config.ts
import { withPayload } from "@payloadcms/next/withPayload";
import { withSerwist } from "@serwist/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.soundloaded.ng", // Cloudflare R2 custom domain
      },
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ],
    },
  ],
};

const withPWA = withSerwist({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

export default withPayload(withPWA(nextConfig));
```

---

## 9. Cloudflare R2 CDN Setup

### 9.1 Create Cloudflare Account & R2 Bucket

```
1. Go to https://dash.cloudflare.com
2. Navigate to: R2 Object Storage → Create bucket
3. Bucket name: soundloaded-media
4. Region: Auto (Cloudflare distributes globally)
5. Click "Create bucket"

Repeat for a second bucket:
6. Bucket name: soundloaded-music
   (Separate bucket for audio files — easier to manage CDN rules)
```

### 9.2 Enable Public Access & Custom Domain

```
For soundloaded-media (images, documents):
1. Go to bucket → Settings → Public Access
2. Enable "Allow Access"
3. Custom Domain → Add Domain: cdn.soundloaded.ng
4. Cloudflare auto-provisions SSL certificate

For soundloaded-music (audio files):
1. Keep public access OFF (use signed URLs for controlled downloads)
2. Custom Domain: music.soundloaded.ng (for authenticated streaming)
```

### 9.3 Create R2 API Credentials

```
1. Cloudflare Dashboard → R2 → Manage R2 API Tokens
2. Create API Token:
   - Token name: soundloaded-blog-api
   - Permissions: Object Read & Write
   - Bucket: soundloaded-media, soundloaded-music
3. Save:
   - Account ID: (copy from R2 overview page)
   - Access Key ID: → R2_ACCESS_KEY_ID
   - Secret Access Key: → R2_SECRET_ACCESS_KEY
```

### 9.4 Configure R2 CORS (for browser direct upload)

```json
[
  {
    "AllowedOrigins": [
      "https://soundloaded.ng",
      "https://www.soundloaded.ng",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

Apply via Wrangler CLI:

```bash
npm install -g wrangler
wrangler login

# Apply CORS config
wrangler r2 bucket cors put soundloaded-media --file cors.json
wrangler r2 bucket cors put soundloaded-music --file cors.json
```

### 9.5 R2 Client in Next.js

```typescript
// src/lib/r2.ts
import { S3Client } from "@aws-sdk/client-s3";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const MEDIA_BUCKET = "soundloaded-media";
export const MUSIC_BUCKET = "soundloaded-music";
export const CDN_URL = "https://cdn.soundloaded.ng";
export const MUSIC_CDN_URL = "https://music.soundloaded.ng";
```

### 9.6 Generate Signed Download URLs

```typescript
// src/app/api/music/[id]/download/route.ts
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, MUSIC_BUCKET } from "@/lib/r2";
import { redis } from "@/lib/redis";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  // Rate limit: 10 downloads per IP per hour
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const key = `download:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 3600);
  if (count > 10) {
    return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // Get music record from DB
  const music = await prisma.music.findUnique({ where: { id: params.id } });
  if (!music) return Response.json({ error: "Not found" }, { status: 404 });

  // Generate signed URL (valid for 5 minutes)
  const command = new GetObjectCommand({
    Bucket: MUSIC_BUCKET,
    Key: music.r2Key,
    ResponseContentDisposition: `attachment; filename="${music.filename}"`,
  });

  const url = await getSignedUrl(r2Client, command, { expiresIn: 300 });

  // Increment download counter
  await prisma.music.update({
    where: { id: params.id },
    data: { downloadCount: { increment: 1 } },
  });

  return Response.json({ url });
}
```

### 9.7 Cloudflare Caching Rules

```
In Cloudflare Dashboard → your domain → Caching → Cache Rules:

Rule 1: Cache all images from R2
  - URL: cdn.soundloaded.ng/*
  - Cache Level: Cache Everything
  - Edge TTL: 1 year
  - Browser TTL: 30 days

Rule 2: Never cache signed music URLs
  - URL: music.soundloaded.ng/*
  - Cache Level: Bypass

Rule 3: Cache Next.js static assets
  - URL: soundloaded.ng/_next/static/*
  - Cache Level: Cache Everything
  - Edge TTL: 1 year
```

---

## 10. Docker Configuration

Docker is used for **local development only**. Production runs on cloud services (Neon, Upstash, Meilisearch Cloud). Docker gives you a consistent local environment that mirrors production exactly.

### 10.1 docker-compose.yml

```yaml
# docker/docker-compose.yml
version: "3.9"

services:
  postgres:
    image: postgres:16-alpine
    container_name: soundloaded-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: soundloaded
      POSTGRES_PASSWORD: soundloaded_dev_password
      POSTGRES_DB: soundloaded_blog
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U soundloaded"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: soundloaded-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass "redis_dev_password"
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "--no-auth-warning", "-a", "redis_dev_password", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  meilisearch:
    image: getmeili/meilisearch:v1.6
    container_name: soundloaded-meilisearch
    restart: unless-stopped
    environment:
      MEILI_MASTER_KEY: "meilisearch_dev_master_key"
      MEILI_ENV: "development"
    ports:
      - "7700:7700"
    volumes:
      - meilisearch_data:/meili_data
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--spider", "http://localhost:7700/health"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
  meilisearch_data:
```

### 10.2 Dockerfile (Production)

```dockerfile
# docker/Dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### 10.3 .dockerignore

```
node_modules
.next
.git
.env
.env.local
docker/data
*.log
```

### 10.4 Development Scripts

```bash
# Start all local services
docker compose -f docker/docker-compose.yml up -d

# Stop all services
docker compose -f docker/docker-compose.yml down

# View logs
docker compose -f docker/docker-compose.yml logs -f

# Reset everything (clean slate)
docker compose -f docker/docker-compose.yml down -v
```

Add to `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "db:start": "docker compose -f docker/docker-compose.yml up -d",
    "db:stop": "docker compose -f docker/docker-compose.yml down",
    "db:reset": "docker compose -f docker/docker-compose.yml down -v && pnpm db:start",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio",
    "db:seed": "dotenv -e .env -- tsx prisma/seed.ts",
    "payload:generate": "payload generate:types"
  }
}
```

---

## 11. Git Workflow & Branching Strategy

### Branch Structure

```
main          ← production (auto-deploys to Vercel)
  └── develop ← staging (auto-deploys to Vercel preview)
        ├── feature/music-player
        ├── feature/admin-dashboard
        ├── feature/download-system
        ├── fix/mobile-nav-overflow
        └── hotfix/download-rate-limit
```

### Branch Rules (set in GitHub)

```
main:
  - Require pull request before merge
  - Require 1 approving review
  - Require status checks (CI lint + type-check) to pass
  - No direct pushes

develop:
  - Require pull request before merge
  - Require CI to pass
```

### Commit Convention (Conventional Commits)

```
feat:     New feature
fix:      Bug fix
docs:     Documentation changes
style:    Formatting, no logic change
refactor: Code restructure, no behavior change
perf:     Performance improvement
test:     Adding/updating tests
chore:    Build process, dependencies, tooling
ci:       CI/CD changes

Examples:
feat(music): add persistent audio player with Howler.js
fix(mobile): resolve hamburger menu z-index overlap
feat(admin): add drag-drop music upload to R2
perf(images): switch to AVIF format for album art
chore(deps): update Next.js to 15.2.0
```

### Workflow

```bash
# Start new feature
git checkout develop
git pull origin develop
git checkout -b feature/music-player

# Work, commit regularly
git add src/components/player/
git commit -m "feat(player): add Howler.js audio engine with play/pause controls"

# Push and create PR
git push origin feature/music-player
gh pr create --base develop --title "feat(player): persistent audio player"

# After review + merge → develop deploys to preview
# When develop is ready → PR to main → deploys to production
```

---

## 12. Vercel Deployment Guide

### 12.1 Initial Setup

```bash
# Login to Vercel CLI
vercel login

# Link project (from project root)
vercel link

# When prompted:
# Set up and deploy? Yes
# Which scope? soundloadedng
# Link to existing project? No (first time)
# Project name: soundloaded-blog
# Directory: ./
```

### 12.2 Environment Variables on Vercel

```bash
# Add all env vars to Vercel (production)
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add R2_ACCESS_KEY_ID production
# ... (see Section 13 for full list)

# Or add via Vercel Dashboard:
# Project → Settings → Environment Variables
```

### 12.3 Project Settings

```
# vercel.json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "regions": ["lhr1", "iad1"],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        },
        {
          "key": "Service-Worker-Allowed",
          "value": "/"
        }
      ]
    }
  ]
}
```

### 12.4 Deployment Triggers

```
main branch push    → soundloaded.ng (production)
develop branch push → soundloaded-blog-git-develop.vercel.app (staging preview)
PR opened           → soundloaded-blog-[pr-number].vercel.app (PR preview)
```

### 12.5 Custom Domain

```bash
# Add domain via CLI
vercel domains add soundloaded.ng

# Or via Dashboard:
# Project → Settings → Domains → Add soundloaded.ng
# Vercel provides DNS records to add in Cloudflare:
#   Type: A, Name: @, Value: 76.76.21.21
#   Type: CNAME, Name: www, Value: cname.vercel-dns.com
```

---

## 13. Environment Variables Reference

```bash
# .env.example — commit this file (no real values)
# .env         — never commit this file

# ── Application ───────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Soundloaded Blog"
NODE_ENV=development

# ── Database (PostgreSQL via Neon) ────────────────────────────────────
DATABASE_URL="postgresql://soundloaded:password@localhost:5432/soundloaded_blog?schema=public"
# Production Neon:
# DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/soundloaded?sslmode=require"

# ── Authentication (Auth.js / NextAuth) ────────────────────────────────
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-generate-with-openssl-rand-hex-32

# ── Payload CMS ────────────────────────────────────────────────────────
PAYLOAD_SECRET=another-super-secret-key-for-payload

# ── Cloudflare R2 ──────────────────────────────────────────────────────
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_MEDIA_BUCKET=soundloaded-media
R2_MUSIC_BUCKET=soundloaded-music
NEXT_PUBLIC_CDN_URL=https://cdn.soundloaded.ng
NEXT_PUBLIC_MUSIC_CDN_URL=https://music.soundloaded.ng

# ── Redis (Upstash) ────────────────────────────────────────────────────
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# ── Meilisearch ────────────────────────────────────────────────────────
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_ADMIN_KEY=meilisearch_dev_master_key
NEXT_PUBLIC_MEILISEARCH_HOST=http://localhost:7700
NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY=your-search-only-key

# ── Email (Resend) ──────────────────────────────────────────────────────
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=noreply@soundloaded.ng
RESEND_NEWSLETTER_FROM=newsletter@soundloaded.ng

# ── Error Monitoring (Sentry) ──────────────────────────────────────────
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
SENTRY_AUTH_TOKEN=your-sentry-auth-token

# ── Analytics ──────────────────────────────────────────────────────────
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-umami-site-id
NEXT_PUBLIC_UMAMI_URL=https://analytics.soundloaded.ng

# ── Docker (local only) ────────────────────────────────────────────────
POSTGRES_USER=soundloaded
POSTGRES_PASSWORD=soundloaded_dev_password
POSTGRES_DB=soundloaded_blog
REDIS_PASSWORD=redis_dev_password
```

---

## 14. Database Schema Overview

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ── Users ──────────────────────────────────────────────────────────────
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  password      String?
  image         String?
  role          UserRole  @default(READER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  posts         Post[]
  comments      Comment[]
  downloads     Download[]
  accounts      Account[]
  sessions      Session[]
}

enum UserRole {
  READER
  CONTRIBUTOR
  EDITOR
  ADMIN
  SUPER_ADMIN
}

// ── Posts ──────────────────────────────────────────────────────────────
model Post {
  id          String      @id @default(cuid())
  title       String
  slug        String      @unique
  excerpt     String?
  body        Json        // Lexical/Payload rich text JSON
  coverImage  String?     // R2 CDN URL
  status      PostStatus  @default(DRAFT)
  type        PostType    @default(NEWS)
  publishedAt DateTime?
  views       Int         @default(0)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  authorId    String
  author      User        @relation(fields: [authorId], references: [id])
  categoryId  String?
  category    Category?   @relation(fields: [categoryId], references: [id])
  tags        PostTag[]
  comments    Comment[]
  music       Music?      // One-to-one if post is a music post

  @@index([slug])
  @@index([status, publishedAt])
  @@index([type, publishedAt])
}

enum PostStatus {
  DRAFT
  PUBLISHED
  SCHEDULED
  ARCHIVED
}

enum PostType {
  NEWS
  MUSIC
  GIST
  ALBUM
  VIDEO
  LYRICS
}

// ── Music ──────────────────────────────────────────────────────────────
model Music {
  id             String   @id @default(cuid())
  title          String
  slug           String   @unique
  r2Key          String   // Cloudflare R2 object key
  filename       String   // Original filename for download header
  fileSize       BigInt   // File size in bytes
  duration       Int?     // Duration in seconds
  format         String   // mp3, flac, wav
  bitrate        Int?     // kbps
  coverArt       String?  // R2 CDN URL
  downloadCount  Int      @default(0)
  streamCount    Int      @default(0)
  year           Int?
  genre          String?
  label          String?
  isExclusive    Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  postId         String   @unique
  post           Post     @relation(fields: [postId], references: [id])
  artistId       String
  artist         Artist   @relation(fields: [artistId], references: [id])
  albumId        String?
  album          Album?   @relation(fields: [albumId], references: [id])
  downloads      Download[]

  @@index([slug])
  @@index([artistId])
}

// ── Artists ─────────────────────────────────────────────────────────────
model Artist {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  bio         String?
  photo       String?  // R2 CDN URL
  country     String?  @default("Nigeria")
  genre       String?
  instagram   String?
  twitter     String?
  facebook    String?
  spotify     String?
  appleMusic  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  music       Music[]
  albums      Album[]

  @@index([slug])
}

// ── Albums ──────────────────────────────────────────────────────────────
model Album {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  coverArt    String?  // R2 CDN URL
  releaseDate DateTime?
  type        AlbumType @default(ALBUM)
  genre       String?
  label       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  artistId    String
  artist      Artist   @relation(fields: [artistId], references: [id])
  tracks      Music[]

  @@index([slug])
}

enum AlbumType {
  ALBUM
  EP
  MIXTAPE
  COMPILATION
}

// ── Downloads ───────────────────────────────────────────────────────────
model Download {
  id        String   @id @default(cuid())
  ip        String
  userAgent String?
  country   String?
  createdAt DateTime @default(now())

  musicId   String
  music     Music    @relation(fields: [musicId], references: [id])
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])

  @@index([musicId])
  @@index([createdAt])
}

// ── Categories & Tags ───────────────────────────────────────────────────
model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?
  color       String?  // Hex color for UI
  posts       Post[]

  @@index([slug])
}

model Tag {
  id    String    @id @default(cuid())
  name  String    @unique
  slug  String    @unique
  posts PostTag[]

  @@index([slug])
}

model PostTag {
  postId String
  tagId  String
  post   Post   @relation(fields: [postId], references: [id])
  tag    Tag    @relation(fields: [tagId], references: [id])

  @@id([postId, tagId])
}

// ── Comments ─────────────────────────────────────────────────────────────
model Comment {
  id        String        @id @default(cuid())
  body      String
  status    CommentStatus @default(PENDING)
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  postId    String
  post      Post          @relation(fields: [postId], references: [id])
  authorId  String
  author    User          @relation(fields: [authorId], references: [id])
  parentId  String?
  parent    Comment?      @relation("CommentReplies", fields: [parentId], references: [id])
  replies   Comment[]     @relation("CommentReplies")

  @@index([postId, status])
}

enum CommentStatus {
  PENDING
  APPROVED
  REJECTED
  SPAM
}

// ── Newsletter ────────────────────────────────────────────────────────────
model Subscriber {
  id          String             @id @default(cuid())
  email       String             @unique
  name        String?
  status      SubscriberStatus   @default(PENDING)
  confirmedAt DateTime?
  createdAt   DateTime           @default(now())
}

enum SubscriberStatus {
  PENDING
  CONFIRMED
  UNSUBSCRIBED
}

// ── Auth (NextAuth) ───────────────────────────────────────────────────────
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

---

## 15. API Endpoints Overview

```
GET    /api/posts                  → List posts (paginated, filtered)
GET    /api/posts/[slug]           → Single post by slug
POST   /api/posts                  → Create post (admin)
PATCH  /api/posts/[id]             → Update post (admin)
DELETE /api/posts/[id]             → Delete post (admin)

GET    /api/music                  → List music (paginated, genre filter)
GET    /api/music/[slug]           → Single music by slug
POST   /api/music                  → Create music entry (admin)
GET    /api/music/[id]/download    → Generate signed R2 download URL
GET    /api/music/trending         → Top downloaded this week

GET    /api/artists                → List artists
GET    /api/artists/[slug]         → Artist profile + discography

GET    /api/albums/[slug]          → Album + full tracklist

GET    /api/search?q=burna+boy     → Full-text search (Meilisearch)
GET    /api/search/suggest?q=burn  → Autocomplete suggestions

POST   /api/upload/presigned       → Get R2 presigned upload URL (admin)
POST   /api/upload/confirm         → Confirm R2 upload complete

POST   /api/comments               → Post a comment
PATCH  /api/comments/[id]          → Moderate comment (admin)

POST   /api/newsletter/subscribe   → Subscribe to newsletter
POST   /api/newsletter/unsubscribe → Unsubscribe

GET    /api/analytics/summary      → Dashboard stats (admin)
GET    /api/analytics/downloads    → Download stats by track/date (admin)

POST   /api/webhooks/payload       → Payload CMS → Vercel ISR revalidation
```

---

## 16. UI Component Strategy

### shadcn/ui — Used Everywhere (Admin + Frontend)

Base primitive components. The foundation of all UI:

- Buttons, Inputs, Selects, Checkboxes, Radios
- Cards, Dialogs, Sheets, Dropdowns
- Tables (admin data tables), Charts (admin analytics)
- Command (search palette Cmd+K), Breadcrumb, Pagination
- Sidebar (admin navigation)

### uselayouts.com — Frontend Polish Layer

Premium layout components that enhance the public-facing blog:

- Hero sections (homepage, music landing)
- Feature/grid layouts (trending music grid, latest news grid)
- Card variants (horizontal music cards, news cards with badges)
- Navigation layouts (sticky header patterns)
- Footer layouts
- CTA sections (newsletter subscribe)
- All uselayouts components placed in `src/components/layouts/`

### react-hot-toast — Notifications (System-Wide)

**ONLY** use react-hot-toast. Do NOT use shadcn/sonner toast anywhere.

```typescript
// src/hooks/useToast.ts — centralized toast config
import toast from "react-hot-toast";

export const notify = {
  success: (msg: string) => toast.success(msg, { duration: 3000 }),
  error: (msg: string) => toast.error(msg, { duration: 4000 }),
  loading: (msg: string) => toast.loading(msg),
  download: (filename: string) =>
    toast.success(`Downloading ${filename}...`, {
      icon: "⬇️",
      duration: 3000,
    }),
  dismiss: (id: string) => toast.dismiss(id),
};

// In root layout (src/app/layout.tsx):
import { Toaster } from "react-hot-toast";

// <Toaster
//   position="bottom-center"  // Bottom on mobile
//   toastOptions={{
//     style: {
//       background: "#1a1a1a",
//       color: "#fff",
//       border: "1px solid #333",
//     },
//   }}
// />
```

### Mobile-First Component Rules

Every component must follow this order:

```
Base styles   → mobile (360px+)
sm:           → small tablet (640px+)
md:           → tablet (768px+)
lg:           → desktop (1024px+)
xl:           → large desktop (1280px+)
```

Touch targets minimum 44x44px. Bottom navigation on mobile. Swipe gestures for player. No hover-only interactions on mobile.

---

## Quick Start Summary

```bash
# 1. Clone repo
git clone https://github.com/soundloadedng/soundloaded-blog.git
cd soundloaded-blog

# 2. Install dependencies
pnpm install

# 3. Copy env file
cp .env.example .env
# Fill in your values in .env

# 4. Start Docker services (Postgres + Redis + Meilisearch)
pnpm db:start

# 5. Run database migrations
pnpm db:migrate

# 6. Seed development data
pnpm db:seed

# 7. Start development server
pnpm dev

# 8. Open browser
# Blog: http://localhost:3000
# Admin: http://localhost:3000/admin
# Payload CMS: http://localhost:3000/admin (Payload routes)
# Prisma Studio: http://localhost:5555 (run: pnpm db:studio)
# Meilisearch: http://localhost:7700
```

---

_Soundloaded Blog Platform — Empowering African Artists, Connecting African Audiences._
_Built with love from Lagos._
