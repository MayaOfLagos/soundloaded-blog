# Fanlink Feature Implementation Roadmap

## Overview

Smart links for music releases with A/B testing, fan engagement tools, and analytics. Creators build landing pages that route fans to streaming platforms while collecting emails, accepting tips, and testing conversion variants.

---

## How We Started

The fanlink feature began as a request to implement a comprehensive smart link system for music artists on the SoundLoaded platform. The implementation evolved through multiple phases, starting with basic link aggregation and expanding into advanced fan engagement and testing capabilities.

**Initial Requirements:**

- Allow creators to generate shareable landing pages for releases
- Support multiple streaming platform links
- Track click analytics
- Provide QR codes for offline sharing

---

## Completed Phases

### ✅ Phase 1: Core Fanlink Infrastructure

**Status:** COMPLETE

| Feature             | Implementation                                                  |
| ------------------- | --------------------------------------------------------------- |
| Fanlink creation    | Slug, title, artist, release type, cover art                    |
| Platform links      | 12+ platforms (Spotify, Apple Music, Boomplay, Audiomack, etc.) |
| Drag-drop ordering  | Sortable platform link list                                     |
| Public landing page | `/fanlink/[slug]` with responsive design                        |
| QR code generation  | PNG/SVG export + inline preview toggle                          |
| Edit/Save/Publish   | Full CRUD with draft/published states                           |

**Database Models:**

- `Fanlink` — Core entity
- `FanlinkClick` — Click tracking with device/browser/geo data

**API Routes:**

- `GET/POST /api/fanlinks`
- `GET/PATCH/DELETE /api/fanlinks/[id]`
- `GET /api/fanlinks/check-slug`
- `POST /api/fanlink/[slug]/click`
- `GET /api/fanlink/[slug]/qr`

---

### ✅ Phase 2: Fan Engagement Tools

**Status:** COMPLETE

| Feature          | Implementation                                   |
| ---------------- | ------------------------------------------------ |
| Email capture    | Gate content behind email input                  |
| Email CSV export | Creator & admin download buttons                 |
| Tip button       | Paystack integration (₦200-₦1000 preset amounts) |
| Pre-save mode    | Countdown timer + early access messaging         |
| Fan-gate         | Require follow/share to unlock links             |
| Social icons     | Artist social links on landing page              |

**Database Models:**

- `FanlinkEmail` — Collected emails
- `FanlinkTip` — Tips with Paystack refs

**API Routes:**

- `POST /api/fanlink/[slug]/email`
- `POST /api/fanlink/[slug]/tip`
- `GET/POST /api/fanlinks/[id]/emails` — CSV export
- `POST /api/fanlink/tip-webhook`

---

### ✅ Phase 3: A/B Testing System

**Status:** COMPLETE

| Feature              | Implementation                                   |
| -------------------- | ------------------------------------------------ |
| A/B toggle           | Enable/disable split testing in form             |
| Traffic split        | Slider 10-90% allocation                         |
| Variant B editor     | Full editor for alternate title/desc/cover/links |
| Variant tracking     | Click attribution to A or B                      |
| Analytics comparison | Variant A vs B performance display               |

**Database Models:**

- `FanlinkVariant` — Variant B configuration storage

**API Routes:**

- `GET/POST/PATCH /api/fanlinks/[id]/variants`
- Click tracking includes `variant: "A" | "B"`

**UI Components:**

- `VariantComparison` — Side-by-side A/B stats
- Variant editor in Step 3 of FanlinkForm

---

### ✅ Phase 4: Admin & Analytics

**Status:** COMPLETE

| Feature           | Implementation                    |
| ----------------- | --------------------------------- |
| Creator analytics | Platform/device/country breakdown |
| Admin oversight   | Edit, suspend, delete any fanlink |
| Email export      | Admin CSV export button           |
| QR inline preview | Toggle in creator dashboard       |

**Pages:**

- `/dashboard/fanlinks/[id]/analytics` — Creator view
- `/admin/fanlinks/[id]` — Admin editor with tabs

---

## Current Implementation Status

### Database Schema (Prisma)

```prisma
model Fanlink {
  id, slug, title, artistName, type
  releaseDate, description, genre, coverArt
  accentColor, pageTheme, buttonStyle
  platformLinks: Json
  emailCaptureEnabled, emailCapturePrompt
  showSocialIcons
  tipEnabled, tipLabel, tipAmounts
  preSaveEnabled, preSaveSpotifyUrl, preSaveAppleUrl, preSaveDeezerUrl, preSaveMessage
  fanGateEnabled, fanGateAction, fanGateSpotifyUrl, fanGateTwitterText
  abEnabled, abSplit
  status: DRAFT | PUBLISHED
  totalClicks, uniqueVisitors
  // Relations
  clicks   FanlinkClick[]
  emails   FanlinkEmail[]
  tips     FanlinkTip[]
  variants FanlinkVariant[]
}

model FanlinkClick {
  id, fanlinkId
  platform, variant, ip
  country, city, device, browser, referrer, sessionId
  createdAt
}

model FanlinkEmail { id, fanlinkId, email, createdAt }
model FanlinkTip { id, fanlinkId, email, amount, reference, status, createdAt }
model FanlinkVariant { id, fanlinkId, label, title, description, coverArt, accentColor, platformLinks }
```

### API Surface

- **Creator:** `/api/fanlinks/*`, `/api/fanlinks/[id]/*`
- **Public:** `/api/fanlink/[slug]/*` (click, email, tip, qr, og)
- **Admin:** `/api/admin/fanlinks/*`
- **Webhook:** `/api/fanlink/tip-webhook`

### Components

- `FanlinkForm` — Creation/editing with 4 steps
- `FanlinkLandingPage` — Public view with variant selection
- `FanlinkCard` — Dashboard list item with QR toggle
- `FanlinkAnalytics` — Stats dashboard with A/B comparison
- `AdminFanlinkEditor` — Admin editing interface
- `ReleaseDateCountdown` — Pre-save countdown timer
- `CoverArtUpload` — Image upload component

---

## TODOs / Known Issues

### 🔧 Technical Debt

1. **Migration pending:** `20260505000000_add_variant_to_clicks` needs apply to Neon DB
2. **Prisma generate:** May need `pnpm db:generate` after migration
3. **Type safety:** Some `any` types in platform link handling could be stricter

### 🐛 Edge Cases

1. **Variant B without links:** Should fall back to main platform links (currently requires manual config)
2. **A/B with 100% split:** Edge case UI could be clearer
3. **Pre-save after release:** Should auto-hide countdown when releaseDate passed

### 🎨 UI Polish

1. **Mobile Variant Editor:** Step 3 form is long on mobile
2. **Analytics empty state:** Better messaging when no clicks yet
3. **QR styling:** Could offer branded QR codes with logo overlay

---

## Suggested Future Phases

### 🚀 Phase 5: Advanced A/B Testing

**Priority:** High

| Feature                  | Description                                       |
| ------------------------ | ------------------------------------------------- |
| Multiple variants        | A/B/C/D testing beyond just A/B                   |
| Conversion goals         | Define "success" (click, email, tip)              |
| Auto-winner              | Auto-switch to winning variant after significance |
| Statistical significance | Show confidence intervals on analytics            |
| Heatmaps                 | Track where users click on landing page           |

**Estimated effort:** 2-3 sprints

---

### 🚀 Phase 6: Enterprise Features

**Priority:** Medium

| Feature            | Description                                  |
| ------------------ | -------------------------------------------- |
| Custom domains     | `links.yourname.com/fanlink/slug`            |
| Pixel integrations | Meta Pixel, Google Analytics 4, TikTok Pixel |
| UTM builder        | Auto-append UTM params to outbound links     |
| Retargeting        | Meta custom audiences from visitors          |
| Webhooks           | Zapier/Make.com integration for new emails   |

**Estimated effort:** 2 sprints

---

### 🚀 Phase 7: Fan CRM

**Priority:** Medium

| Feature          | Description                                     |
| ---------------- | ----------------------------------------------- |
| Fan profiles     | Aggregate fan activity across multiple fanlinks |
| Segmentation     | Tag fans by behavior (superfan, casual, etc.)   |
| Email campaigns  | Built-in newsletter to captured emails          |
| SMS capture      | Phone number option for Africa market           |
| WhatsApp sharing | Deep links to WhatsApp status/stories           |

**Estimated effort:** 3-4 sprints

---

### 🚀 Phase 8: Monetization Expansion

**Priority:** Low-Medium

| Feature           | Description                               |
| ----------------- | ----------------------------------------- |
| Merch integration | Direct product embeds (Shopify, Selar)    |
| Ticket links      | Event/ticket platform integrations        |
| Subscriptions     | Fan club membership tiers                 |
| Bundles           | Music + merch + tickets in one link       |
| Affiliates        | Track which influencers drove conversions |

**Estimated effort:** 3 sprints

---

## Architecture Decisions

### Why Prisma + PostgreSQL?

- Relational data with JSON fields for flexibility
- ACID compliance for tip transactions
- Row-level security for multi-tenant safety

### Why A/B split on frontend?

- Variant selection happens in `FanlinkLandingPage` useEffect
- No server session storage needed
- Simplifies CDN caching (same URL, different content)

### Why separate click table?

- `totalClicks` counter for fast reads
- `FanlinkClick` table for analytics queries
- Trades storage for query performance

---

## Files & Locations

| Category   | Path                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| Schema     | `prisma/schema.prisma` (models 1377-1440)                                                              |
| Migrations | `prisma/migrations/2026050*`                                                                           |
| API Routes | `src/app/api/fanlink/**`, `src/app/api/fanlinks/**`, `src/app/api/admin/fanlinks/**`                   |
| Components | `src/components/fanlink/*`                                                                             |
| Pages      | `src/app/(user)/dashboard/fanlinks/**`, `src/app/fanlink/[slug]/page.tsx`, `src/app/admin/fanlinks/**` |

---

## Changelog Summary

| Date       | Commit                               | Change                         |
| ---------- | ------------------------------------ | ------------------------------ |
| 2026-05-03 | `20260503000000_add_fanlinks`        | Initial fanlink schema         |
| 2026-05-03 | `20260503100000_fanlink_phase3`      | Pre-save, fan-gate fields      |
| 2026-05-03 | `20260503110000_fanlink_ab_variants` | A/B testing schema             |
| 2026-05-05 | `8d5e4d2`                            | Variant B editor UI            |
| 2026-05-05 | `336efe9`                            | Admin analytics props fix      |
| 2026-05-05 | `9d70f7b`                            | CoverArtUpload placeholder fix |
| 2026-05-05 | `2a07a1c`                            | Optional \_count type fix      |
| 2026-05-05 | `0f4222e`                            | Variant optional chaining fix  |
| 2026-05-05 | `f2c1fd4`                            | StatCard count fix             |

---

## Next Immediate Steps

1. ✅ **Apply migration** — `20260505000000_add_variant_to_clicks` to Neon DB
2. ✅ **Verify build** — All TypeScript errors resolved
3. 🔄 **Monitor analytics** — Confirm variant tracking works post-deploy
4. 📊 **Test A/B flow** — Create test fanlink with Variant B, verify split works

---

_Document created: 2026-05-05_
_Last updated: 2026-05-05_
_Maintainer: Engineering Team_
