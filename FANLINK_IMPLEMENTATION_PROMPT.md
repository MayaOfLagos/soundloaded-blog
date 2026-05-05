# Fanlink Feature Implementation Prompt

## Project Context

**Repository:** SoundLoaded Blog (Music streaming & artist platform)
**Tech Stack:** Next.js 16 + React + TypeScript + Prisma + PostgreSQL + Tailwind CSS + shadcn/ui
**Auth:** NextAuth.js with role-based access (USER, ARTIST, LABEL, ADMIN)

You are implementing a comprehensive "Fanlink" feature — smart landing pages for music releases that route fans to streaming platforms while capturing emails, accepting tips, and enabling A/B conversion testing.

---

## Feature Overview

Fanlinks are shareable landing pages artists create for their releases. Each fanlink:

- Has a unique slug (`/fanlink/artist-new-song`)
- Displays cover art, title, artist name, description
- Lists streaming platform buttons (Spotify, Apple Music, Boomplay, etc.)
- Can require email capture before showing links
- Can accept tips via Paystack
- Can show countdown timer for pre-saves
- Can gate content behind social actions (follow/share)
- Supports A/B testing different content/URLs

---

## Phase 1: Core Infrastructure (Start Here)

### 1.1 Database Schema

Add these models to `prisma/schema.prisma`:

```prisma
model Fanlink {
  id              String   @id @default(cuid())
  slug            String   @unique
  title           String
  artistName      String
  type            String   // SINGLE, ALBUM, EP, MIXTAPE

  // Content
  releaseDate     DateTime?
  description     String?
  genre           String?
  coverArt        String?

  // Styling
  accentColor     String   @default("#e11d48")
  pageTheme       String   @default("dark")   // dark | light | auto
  buttonStyle     String   @default("filled") // filled | outline | pill

  // Platform links (JSON array)
  platformLinks   Json     @default("[]")

  // Email capture
  emailCaptureEnabled Boolean @default(false)
  emailCapturePrompt  String  @default("Enter your email to unlock")
  showSocialIcons     Boolean @default(true)

  // Tips
  tipEnabled      Boolean  @default(false)
  tipLabel        String   @default("Support this artist")
  tipAmounts      Json     @default("[200, 500, 1000]") // in kobo

  // Pre-save
  preSaveEnabled    Boolean @default(false)
  preSaveSpotifyUrl String?
  preSaveAppleUrl   String?
  preSaveDeezerUrl   String?
  preSaveMessage    String  @default("Save this track before it drops!")

  // Fan-gate
  fanGateEnabled    Boolean @default(false)
  fanGateAction     String  @default("follow") // follow | share | both
  fanGateSpotifyUrl String?
  fanGateTwitterText String?

  // A/B Testing
  abEnabled       Boolean  @default(false)
  abSplit         Int      @default(50) // percentage to variant B

  // Status
  status          String   @default("DRAFT") // DRAFT | PUBLISHED | ARCHIVED | SUSPENDED

  // Analytics counters
  totalClicks     Int      @default(0)
  uniqueVisitors  Int      @default(0)

  // Relations
  createdById     String
  createdBy       User     @relation(fields: [createdById], references: [id], onDelete: Cascade)
  artistId        String?
  artist          Artist?  @relation(fields: [artistId], references: [id], onDelete: SetNull)

  clicks          FanlinkClick[]
  emails          FanlinkEmail[]
  tips            FanlinkTip[]
  variants        FanlinkVariant[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([slug])
  @@index([createdById])
  @@index([artistId])
  @@index([status])
}

model FanlinkClick {
  id          String   @id @default(cuid())
  fanlinkId   String
  fanlink     Fanlink  @relation(fields: [fanlinkId], references: [id], onDelete: Cascade)

  platform    String?  // which button clicked
  variant     String?  // A or B for A/B testing

  ip          String?
  country     String?
  city        String?
  device      String?  // mobile | desktop | tablet
  browser     String?
  referrer    String?
  sessionId   String?

  createdAt   DateTime @default(now())

  @@index([fanlinkId, createdAt])
  @@index([fanlinkId, platform])
  @@index([fanlinkId, variant])
}

model FanlinkEmail {
  id          String   @id @default(cuid())
  fanlinkId   String
  fanlink     Fanlink  @relation(fields: [fanlinkId], references: [id], onDelete: Cascade)
  email       String
  createdAt   DateTime @default(now())

  @@index([fanlinkId])
  @@unique([fanlinkId, email])
}

model FanlinkTip {
  id          String   @id @default(cuid())
  fanlinkId   String
  fanlink     Fanlink  @relation(fields: [fanlinkId], references: [id], onDelete: Cascade)
  email       String
  amount      Int      // in kobo
  reference   String   @unique // Paystack reference
  status      String   @default("pending") // pending | success | failed
  createdAt   DateTime @default(now())

  @@index([fanlinkId])
  @@index([reference])
}

model FanlinkVariant {
  id            String   @id @default(cuid())
  fanlinkId     String
  fanlink       Fanlink  @relation(fields: [fanlinkId], references: [id], onDelete: Cascade)

  label         String   @default("B") // A, B, C, etc.
  title         String?
  description   String?
  coverArt      String?
  accentColor   String   @default("#e11d48")
  platformLinks Json     @default("[]")

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([fanlinkId])
  @@unique([fanlinkId, label])
}
```

**After adding schema:**

1. Run `pnpm db:migrate` to create migration
2. Run `pnpm db:generate` to update Prisma client types

---

### 1.2 API Routes

#### Creator Routes (`src/app/api/fanlinks/`)

**`route.ts` — List & Create**

```typescript
// GET /api/fanlinks — List user's fanlinks
// POST /api/fanlinks — Create new fanlink
// Request body: { slug, title, artistName, type, ... }
// Response: { fanlink: Fanlink }
```

**`[id]/route.ts` — Get, Update, Delete**

```typescript
// GET /api/fanlinks/[id] — Get single fanlink
// PATCH /api/fanlinks/[id] — Update fanlink
// DELETE /api/fanlinks/[id] — Delete fanlink
```

**`check-slug/route.ts` — Slug availability**

```typescript
// GET /api/fanlinks/check-slug?slug=xyz
// Response: { available: boolean }
```

**`[id]/emails/route.ts` — Email export**

```typescript
// GET /api/fanlinks/[id]/emails — CSV export of collected emails
// Response: text/csv with headers: Email,Date
```

**`[id]/variants/route.ts` — A/B Variants**

```typescript
// GET /api/fanlinks/[id]/variants — List variants
// POST /api/fanlinks/[id]/variants — Create variant B
// PATCH /api/fanlinks/[id]/variants — Update variant (body: { variantId, ... })
```

#### Public Routes (`src/app/api/fanlink/[slug]/`)

**`click/route.ts` — Track clicks**

```typescript
// POST /api/fanlink/[slug]/click
// Body: { platform?, sessionId?, variant? }
// Stores: platform, variant, ip, device, browser, country, referrer
```

**`email/route.ts` — Submit email**

```typescript
// POST /api/fanlink/[slug]/email
// Body: { email }
// Validates email, stores in FanlinkEmail, returns { success: true }
```

**`tip/route.ts` — Initialize tip**

```typescript
// POST /api/fanlink/[slug]/tip
// Body: { email, amount }
// Creates Paystack transaction, returns { authorization_url, reference }
```

**`qr/route.ts` — Generate QR**

```typescript
// GET /api/fanlink/[slug]/qr?size=600&format=png
// Returns: PNG or SVG QR code image
```

**`og/route.ts` — OG Image**

```typescript
// GET /api/fanlink/[slug]/og
// Returns: Dynamic OpenGraph image for social sharing
```

#### Admin Routes (`src/app/api/admin/fanlinks/`)

**`route.ts` — Admin list**
**`[id]/route.ts` — Admin get/update/delete**
**`[id]/emails/route.ts` — Admin CSV export**

#### Webhook

**`src/app/api/fanlink/tip-webhook/route.ts`**

```typescript
// POST /api/fanlink/tip-webhook
// Paystack webhook for tip status updates
// Verifies signature, updates FanlinkTip status
```

---

### 1.3 Components to Build

#### `src/components/fanlink/FanlinkForm.tsx`

Multi-step form for creating/editing fanlinks.

**Steps:**

1. **Core Info:** Title, artist, type, slug (with availability check), release date, genre, description
2. **Platforms:** Add/edit platform links (URL + enabled toggle + sort order), cover art upload, accent color picker, button style, page theme
3. **Fan Engagement:** Email capture toggle + prompt, tip button toggle + amounts, pre-save toggle + URLs + message, fan-gate toggle + config, A/B testing toggle + split percentage, Variant B editor (if A/B enabled in edit mode)
4. **Publish:** Status toggle (draft/published), preview link, save button

**Props:**

```typescript
type Props = {
  initialData?: Partial<FormData> & { id?: string };
  initialVariant?: VariantData | null;
  artistName: string;
  mode?: "create" | "edit";
};
```

**Platform list (constant):**

```typescript
const PLATFORMS = [
  { key: "spotify", label: "Spotify", icon: "🎧" },
  { key: "apple-music", label: "Apple Music", icon: "🍎" },
  { key: "boomplay", label: "Boomplay", icon: "🔊" },
  { key: "audiomack", label: "Audiomack", icon: "🎶" },
  { key: "youtube-music", label: "YouTube Music", icon: "▶️" },
  { key: "deezer", label: "Deezer", icon: "🎼" },
  { key: "tidal", label: "Tidal", icon: "🌊" },
  { key: "amazon-music", label: "Amazon Music", icon: "📦" },
  { key: "soundcloud", label: "SoundCloud", icon: "☁️" },
  { key: "tiktok", label: "TikTok", icon: "🎤" },
  { key: "soundloaded", label: "SoundLoaded", icon: "🎵" },
];
```

#### `src/components/fanlink/CoverArtUpload.tsx`

Image upload component using Payload CMS upload or direct upload.

**Props:**

```typescript
type Props = {
  value: string; // current image URL
  onChange: (url: string) => void;
};
```

#### `src/components/fanlink/FanlinkLandingPage.tsx`

Public-facing landing page component (used in `/fanlink/[slug]/page.tsx`).

**Features:**

- Responsive design (mobile-first)
- Theme support (dark/light/auto)
- Cover art display with gradient background
- Platform buttons with icons
- Email capture form (if enabled)
- Tip button with Paystack (if enabled)
- Pre-save countdown timer (if enabled and release date in future)
- Fan-gate modal (if enabled)
- A/B variant selection on mount (random roll based on abSplit)
- Social icons (if artist has social links)
- Merch link button (if configured)
- Click tracking on all interactions

**A/B Logic:**

```typescript
// On mount, if abEnabled and variants exist:
const roll = Math.random() * 100;
if (roll < abSplit) {
  setActiveVariant(variantB); // Show variant B content
} else {
  setActiveVariant(null); // Show default (variant A)
}

// Track variant in all click events:
recordClick(platform, activeVariant ? "B" : "A");
```

#### `src/components/fanlink/ReleaseDateCountdown.tsx`

Pre-save countdown widget.

**Props:**

```typescript
type Props = {
  releaseDate: string; // ISO date string
  message: string;
};
```

**Behavior:**

- Shows days:hours:minutes:seconds until release
- When countdown reaches zero, shows "Out Now!" message

#### `src/components/fanlink/FanlinkCard.tsx`

Dashboard list item showing fanlink summary.

**Features:**

- Title, slug, status badge
- Quick stats (clicks, emails)
- Action buttons: Edit, View (if published), QR preview toggle, Delete

#### `src/components/fanlink/FanlinkAnalytics.tsx`

Analytics dashboard for a fanlink.

**Props:**

```typescript
type Props = {
  fanlink: { title; totalClicks; uniqueVisitors; abEnabled };
  clicksByPlatform: ClicksByGroup;
  clicksByDevice: ClicksByGroup;
  clicksByCountry: ClicksByGroup;
  clicksByVariant: ClicksByGroup; // for A/B comparison
  emailCount: number;
};
```

**UI:**

- Stat cards: Total clicks, unique visitors, emails collected, top platform
- A/B comparison bar chart (if abEnabled)
- Bar charts: Clicks by platform, device, country

#### `src/components/fanlink/AdminFanlinkEditor.tsx`

Admin interface for managing any fanlink.

**Tabs:**

- Edit: Full form same as creator
- Analytics: View stats + email export button

---

### 1.4 Pages to Build

#### Creator Dashboard

**`src/app/(user)/dashboard/fanlinks/page.tsx`**

- List all user's fanlinks
- Create new button
- Empty state for first-time users

**`src/app/(user)/dashboard/fanlinks/new/page.tsx`**

- FanlinkForm in create mode
- Prefill artistName from user profile

**`src/app/(user)/dashboard/fanlinks/[id]/edit/page.tsx`**

- Fetch fanlink + variant data
- FanlinkForm in edit mode with initialData + initialVariant

**`src/app/(user)/dashboard/fanlinks/[id]/analytics/page.tsx`**

- Fetch analytics data (clicks by platform/device/country/variant)
- Email count
- Render FanlinkAnalytics
- Export emails button

#### Public Page

**`src/app/fanlink/[slug]/page.tsx`**

- Server component fetching published fanlink
- If not published → 404
- Render FanlinkLandingPage with data
- Generate metadata for SEO/OG

#### Admin Pages

**`src/app/admin/fanlinks/page.tsx`**

- List all fanlinks (paginated)
- Search/filter by creator, status

**`src/app/admin/fanlinks/[id]/page.tsx`**

- Fetch full fanlink data + analytics
- Render AdminFanlinkEditor
- Admin actions: suspend, delete

---

## Phase 2: Fan Engagement (After Phase 1 works)

### Email Capture Flow

1. User visits fanlink with `emailCaptureEnabled: true`
2. Landing page shows email input modal/section
3. Submit calls `POST /api/fanlink/[slug]/email`
4. On success, unlocks platform links

### Tip Flow (Paystack)

1. User clicks tip button, selects amount
2. Frontend calls `POST /api/fanlink/[slug]/tip`
3. Backend initializes Paystack transaction
4. Returns `authorization_url` for redirect
5. User completes payment on Paystack
6. Paystack webhook calls `/api/fanlink/tip-webhook`
7. Backend verifies signature, updates tip status

### Pre-Save Countdown

1. Check if `releaseDate` is in future
2. If yes, show `ReleaseDateCountdown` component
3. Display pre-save message + streaming platform logos
4. When countdown ends, automatically show "Out Now!" + platform links

### Fan-Gate

1. If `fanGateEnabled: true`, show locked state
2. Display required action (follow on Spotify, share on Twitter, or both)
3. User completes action (opens follow/share in new tab)
4. Click "I've completed" to unlock
5. Store unlock in session/localStorage so user doesn't re-gate

---

## Phase 3: A/B Testing (After Phase 2 works)

### Variant B Editor

In FanlinkForm Step 3, when `abEnabled` is true and mode is "edit":

Show additional section "Variant B Content" with fields:

- Title (optional, falls back to main)
- Description (optional, falls back to main)
- Cover Art (optional, falls back to main)
- Accent Color (required, separate from main)
- Platform Links (optional per platform, falls back to main)

On save:

- If variant exists → PATCH to update
- If no variant → POST to create

### Variant Selection Logic

In `FanlinkLandingPage`:

```typescript
useEffect(() => {
  if (fanlink.abEnabled && fanlink.variants.length > 0) {
    const roll = Math.random() * 100;
    if (roll < fanlink.abSplit) {
      setActiveVariant(fanlink.variants[0]);
    }
  }
}, []);

const displayTitle = activeVariant?.title ?? fanlink.title;
const displayCoverArt = activeVariant?.coverArt ?? fanlink.coverArt;
// etc.
```

### Analytics

Track variant in every click:

```typescript
await fetch(`/api/fanlink/${slug}/click`, {
  method: "POST",
  body: JSON.stringify({
    platform,
    variant: activeVariant ? "B" : "A",
    sessionId,
  }),
});
```

Display A/B comparison in analytics page showing:

- Variant A clicks vs Variant B clicks
- Percentage split
- Performance winner indicator

---

## Implementation Order

### Week 1: Foundation

1. Database schema + migration
2. API routes: CRUD for fanlinks, click tracking
3. FanlinkForm component (Steps 1-2)
4. FanlinkLandingPage basic version
5. Creator dashboard list + create pages

### Week 2: Polish Core

1. FanlinkCard component
2. Edit page
3. QR generation
4. Slug availability check
5. OG images

### Week 3: Fan Engagement

1. Email capture + FanlinkEmail model
2. CSV export
3. Tip integration (Paystack)
4. Pre-save countdown
5. Fan-gate

### Week 4: A/B Testing

1. FanlinkVariant model
2. Variant API routes
3. Variant B editor in FanlinkForm
4. Variant selection logic in landing page
5. A/B analytics display

### Week 5: Admin & Analytics

1. Admin list page
2. Admin detail page with editor
3. Analytics dashboard
4. Email export for admin
5. Final testing & bug fixes

---

## Key Technical Decisions

### Why separate click table?

- `Fanlink.totalClicks` for fast counter display
- `FanlinkClick` table for detailed analytics queries
- Accept tradeoff: storage vs query performance

### Why JSON for platform links?

- Flexible schema (platforms change over time)
- Easy to extend with new fields per link
- Prisma supports typed JSON

### Why A/B split on frontend?

- No server session required
- CDN can cache the same HTML for all visitors
- Variant selection happens client-side via JS

### Database Index Strategy

```prisma
@@index([slug])           // Public page lookups
@@index([createdById])    // User's fanlinks list
@@index([status])        // Filter by draft/published
@@index([fanlinkId, createdAt]) // Analytics time-series
@@index([fanlinkId, platform])   // Platform breakdown
@@index([fanlinkId, variant])  // A/B analytics
```

---

## Testing Checklist

### Core Functionality

- [ ] Create fanlink with all fields
- [ ] Slug uniqueness enforced
- [ ] Public page loads for published fanlinks
- [ ] 404 for draft fanlinks (unless owner)
- [ ] Click tracking records device/browser/geo
- [ ] QR code generates correctly

### Fan Engagement

- [ ] Email capture form shows when enabled
- [ ] Duplicate email prevented
- [ ] CSV export has correct format
- [ ] Tip button initializes Paystack
- [ ] Webhook updates tip status
- [ ] Countdown shows correct time remaining
- [ ] Fan-gate unlocks after action

### A/B Testing

- [ ] Variant B editor saves correctly
- [ ] Variant selection respects abSplit percentage
- [ ] Variant content overrides display correctly
- [ ] Click tracking includes variant field
- [ ] Analytics shows A vs B comparison

### Admin

- [ ] Admin can edit any fanlink
- [ ] Admin can suspend fanlink
- [ ] Admin can export emails

---

## Common Issues & Solutions

### TypeScript Errors

**Prisma groupBy return type:**

```typescript
// Prisma returns _count as optional
// Use optional chaining everywhere:
const total = items.reduce((s, i) => s + (i._count?.id ?? 0), 0);
```

**PlatformLink type:**

```typescript
type PlatformLink = {
  platform: string;
  url: string;
  label?: string;
  isEnabled: boolean;
  sortOrder: number;
};
```

### Build Errors

**CoverArtUpload placeholder:** Component doesn't accept placeholder prop. Put helper text as `<p>` below the component instead.

**FanlinkAnalytics props:** Remember to pass `abEnabled` and `clicksByVariant` to the component.

---

## File Structure Reference

```
src/
├── app/
│   ├── api/
│   │   ├── fanlinks/
│   │   │   ├── route.ts
│   │   │   ├── check-slug/route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       ├── emails/route.ts
│   │   │       └── variants/route.ts
│   │   ├── fanlink/
│   │   │   └── [slug]/
│   │   │       ├── click/route.ts
│   │   │       ├── email/route.ts
│   │   │       ├── tip/route.ts
│   │   │       ├── qr/route.ts
│   │   │       └── og/route.ts
│   │   ├── fanlink/tip-webhook/route.ts
│   │   └── admin/fanlinks/
│   │       ├── route.ts
│   │       └── [id]/
│   │           ├── route.ts
│   │           └── emails/route.ts
│   ├── (user)/dashboard/fanlinks/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [id]/
│   │       ├── edit/page.tsx
│   │       └── analytics/page.tsx
│   ├── fanlink/
│   │   └── [slug]/
│   │       └── page.tsx
│   └── admin/fanlinks/
│       ├── page.tsx
│       └── [id]/page.tsx
├── components/fanlink/
│   ├── FanlinkForm.tsx
│   ├── FanlinkLandingPage.tsx
│   ├── FanlinkCard.tsx
│   ├── FanlinkAnalytics.tsx
│   ├── AdminFanlinkEditor.tsx
│   ├── CoverArtUpload.tsx
│   └── ReleaseDateCountdown.tsx
└── lib/
    └── utils.ts (slugify helper)
```

---

## Success Criteria

The feature is complete when:

1. Creators can build, edit, publish fanlinks
2. Public can visit fanlinks and click platform buttons
3. Clicks are tracked with device/geo data
4. Emails can be captured and exported
5. Tips can be received via Paystack
6. Pre-save countdown works
7. A/B testing shows different content and tracks conversion
8. Admin can oversee all fanlinks
9. All TypeScript compiles without errors
10. All API routes have proper auth checks

---

**Begin with Phase 1.1 (Database Schema) and work through each section systematically. Test each component/page as you build it before moving to the next.**
