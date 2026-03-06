# Settings System Upgrade — WordPress-Level Power

## Current State (What We Have)

### 8 Settings Tabs — 55+ Fields

| Tab               | Fields                                                                                                                  | Status   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- | -------- |
| **General**       | siteName, tagline, siteUrl, contactEmail, copyrightText, logoLight, logoDark, favicon, defaultOgImage                   | Complete |
| **SEO & Meta**    | metaTitleTemplate, metaDescription, seoKeywords, googleSiteVerification, bingSiteVerification, googleAnalyticsId        | Complete |
| **Social Links**  | instagram, twitter, facebook, youtube, spotify, tiktok, appleMusic, telegram, whatsapp                                  | Complete |
| **PWA**           | pwaAppName, pwaShortName, pwaThemeColor, pwaBackgroundColor, pwaDisplayMode, pwaOrientation, pwaIcons, pwaSplashScreens | Complete |
| **Notifications** | discordWebhookUrl, notifyOnNewComment, notifyOnNewSubscriber, notifyOnNewMusicUpload, emailNotificationsAdmin           | Complete |
| **Content**       | postsPerPage, defaultPostStatus, enableComments, autoApproveComments, enableDownloads, maxDownloadsPerHour              | Complete |
| **Appearance**    | brandColor, enableDarkMode, defaultTheme, customCss                                                                     | Complete |
| **Environment**   | 13 env-var status indicators (read-only)                                                                                | Complete |

---

## Gap Analysis — What WordPress Has That We Don't

### 1. Reading & Homepage Settings (HIGH PRIORITY)

WordPress lets admins control what the homepage shows and how feeds behave.

**Missing fields:**

- `homepageDisplay` — "latest_posts" | "static_page" (WordPress: Settings > Reading)
- `homepageId` — ID of static page to use as homepage
- `feedItemCount` — number of items in RSS feed (currently hardcoded to 20)
- `feedContentMode` — "full" | "excerpt" (show full content vs summary in RSS)
- `searchEngineVisibility` — boolean: discourage search engines (adds noindex meta)

### 2. Discussion / Comments (HIGH PRIORITY)

Our comment settings are minimal. WordPress has deep control.

**Missing fields:**

- `requireLoginToComment` — boolean (only logged-in users can comment)
- `commentNestingDepth` — int 1–5 (we currently support 1 level of nesting)
- `commentsPerPage` — int (pagination within comment section, currently hardcoded 20)
- `commentOrder` — "newest" | "oldest" (display order)
- `closeCommentsAfterDays` — int 0=never (auto-close old threads)
- `commentModerationKeywords` — text (hold comments containing these words)
- `commentBlocklist` — text (reject comments with these words/IPs/emails)
- `showAvatars` — boolean
- `defaultAvatarStyle` — "initials" | "gravatar" | "none"

### 3. Timezone & Locale (MEDIUM PRIORITY)

WordPress has timezone, date format, time format, and language.

**Missing fields:**

- `timezone` — string (IANA timezone, e.g. "Africa/Lagos")
- `dateFormat` — string (e.g. "MMM d, yyyy" or "dd/MM/yyyy")
- `timeFormat` — string (e.g. "h:mm a" or "HH:mm")
- `language` — string (locale code, e.g. "en-NG")

### 4. Maintenance & Visibility (MEDIUM PRIORITY)

WordPress has a maintenance mode concept. Many CMS platforms have this.

**Missing fields:**

- `maintenanceMode` — boolean (show maintenance page to non-admins)
- `maintenanceMessage` — text (custom message during maintenance)
- `maintenanceAllowedIPs` — text (comma-separated IPs that bypass maintenance)

### 5. Code Injection (MEDIUM PRIORITY)

We have `customCss` but no script injection for analytics/pixels/chat widgets.

**Missing fields:**

- `headerScripts` — text (injected into `<head>`, for analytics, fonts, etc.)
- `footerScripts` — text (injected before `</body>`, for chat widgets, pixels)
- `adsenseId` — string (Google AdSense publisher ID)
- `adSlots` — JSON (ad placement configuration)

### 6. Media Settings (LOW-MEDIUM PRIORITY)

WordPress has configurable image sizes and organization.

**Missing fields:**

- `thumbnailSize` — int (thumbnail dimension, e.g. 150)
- `mediumSize` — int (medium image dimension, e.g. 300)
- `largeSize` — int (large image dimension, e.g. 1024)
- `imageQuality` — int 1–100 (WebP/AVIF compression quality)
- `enableWatermark` — boolean
- `watermarkImage` — string (R2 key for watermark overlay)
- `watermarkPosition` — "center" | "bottom-right" | "bottom-left" etc.

### 7. Security (LOW-MEDIUM PRIORITY)

Hardening settings that many CMS platforms expose.

**Missing fields:**

- `maxLoginAttempts` — int (lockout after N failed attempts)
- `loginLockoutDuration` — int (minutes to lock out)
- `requireStrongPasswords` — boolean
- `allowRegistration` — boolean (open registration vs admin-only)
- `defaultUserRole` — "READER" | "AUTHOR" (role for new registrations)

### 8. Email Settings (LOW PRIORITY)

WordPress has built-in email config (though often via plugin).

**Missing fields:**

- `emailFromName` — string (sender name for system emails)
- `emailFromAddress` — string (sender email)
- `emailWelcomeEnabled` — boolean (send welcome email on registration)
- `emailDigestEnabled` — boolean (weekly digest to subscribers)
- `emailDigestDay` — "monday" | "friday" etc.

### 9. Performance / Cache (LOW PRIORITY)

Some CMS platforms expose cache TTL and CDN purge controls.

**Missing fields:**

- `cacheTtlPages` — int (seconds, page cache TTL, currently hardcoded ISR values)
- `cacheTtlApi` — int (seconds, API cache duration)
- `enableImageOptimization` — boolean (auto-convert to WebP/AVIF)

---

## Implementation Plan

### Phase A — Reading & Comments Enhancement (Priority: HIGH)

**New Prisma fields:** 14 fields
**Modified files:** schema, settings lib, admin UI (2 tabs), comment system, RSS, layout

1. Add 14 new fields to `SiteSettings` model in Prisma
2. Run migration
3. Update `PublicSettings` interface + `buildPublicSettings()` + defaults
4. Update admin settings Zod schemas (client + server)
5. Build "Reading" sub-section in Content tab (or new tab)
6. Expand Discussion/Content tab with all comment settings
7. Wire comment settings into `CommentSection`, `CommentList`, `CommentForm`, `/api/comments`
8. Wire reading settings into RSS feed route + homepage

### Phase B — Locale, Maintenance & Code Injection (Priority: MEDIUM)

**New Prisma fields:** 11 fields
**Modified files:** schema, settings lib, admin UI (new tabs), layout, middleware

1. Add 11 new fields to `SiteSettings`
2. Run migration
3. Add "Locale" section to General tab
4. Add "Maintenance" tab to admin settings
5. Expand "Appearance" tab with code injection (headerScripts, footerScripts)
6. Build maintenance mode middleware (redirect non-admins)
7. Wire timezone/date format into `formatRelativeDate` and all date displays
8. Inject header/footer scripts in layout.tsx

### Phase C — Media, Security & Email (Priority: LOW-MEDIUM)

**New Prisma fields:** 16 fields
**Modified files:** schema, settings lib, admin UI (new tabs), upload pipeline, auth

1. Add 16 new fields to `SiteSettings`
2. Run migration
3. Add "Media" section to admin settings
4. Add "Security" section to admin settings
5. Add "Email" section to admin settings
6. Wire image size settings into upload/processing pipeline
7. Wire security settings into auth routes + registration
8. Wire email settings into Resend integration

---

## Summary — 41 New Fields Across 9 Categories

| Category                 | New Fields | Priority   | Phase |
| ------------------------ | ---------- | ---------- | ----- |
| Reading & Homepage       | 5          | HIGH       | A     |
| Discussion / Comments    | 9          | HIGH       | A     |
| Timezone & Locale        | 4          | MEDIUM     | B     |
| Maintenance & Visibility | 3          | MEDIUM     | B     |
| Code Injection & Ads     | 4          | MEDIUM     | B     |
| Media Settings           | 7          | LOW-MEDIUM | C     |
| Security                 | 5          | LOW-MEDIUM | C     |
| Email Settings           | 5          | LOW        | C     |
| Performance / Cache      | 3          | LOW        | C     |
