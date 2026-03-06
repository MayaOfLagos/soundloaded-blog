# Media Upload & Library — Roadmap

## Overview

Two-tier upload system for the Soundloaded Blog admin panel:

- **FilePond** — Lightweight inline uploads for settings (logo, favicon, OG image, PWA icons)
- **Uppy** — Full media library with dashboard, bulk uploads, and WordPress-style media browser for posts/content

---

## Phase 1: FilePond for Settings Uploads

### Goal

Replace the basic `<input type="file">` in admin settings with FilePond's polished UI.

### Packages

```
pnpm add filepond filepond-plugin-image-preview filepond-plugin-image-validate-size filepond-plugin-file-validate-type filepond-plugin-image-crop filepond-plugin-image-resize filepond-plugin-image-transform react-filepond
```

### Scope

- **Files touched:**
  - `src/app/admin/settings/_components/ImageUploadField.tsx` — Rewrite with FilePond
  - `src/app/api/admin/settings/upload/route.ts` — Already returns presigned R2 URLs (no change needed)
- **Features:**
  - Drag-and-drop + click-to-browse
  - Inline image preview
  - Image crop (useful for logos/favicons to enforce aspect ratios)
  - File type validation (image/png, image/jpeg, image/svg+xml, image/webp, image/x-icon)
  - File size validation (max 2MB for logos, 512KB for favicons, 5MB for OG images)
  - Upload progress indicator
  - Remove/replace existing image
  - Custom server config pointing to our presigned URL flow

### Upload Flow

1. User drops/selects file → FilePond validates type + size
2. FilePond `process` callback → `POST /api/admin/settings/upload` → returns `{ uploadUrl, r2Key }`
3. FilePond uploads file to R2 presigned URL
4. On success → form field set to `r2Key`, preview shows the uploaded image
5. On form save → `r2Key` persisted to DB

---

## Phase 2: Media Prisma Model

### Goal

Track all uploaded media in the database for reuse, search, and management.

### Schema Addition (`prisma/schema.prisma`)

```prisma
model Media {
  id          String   @id @default(cuid())
  filename    String                    // original filename
  r2Key       String   @unique          // R2 object key
  url         String                    // resolved CDN URL
  mimeType    String                    // e.g. image/jpeg, audio/mpeg
  size        Int                       // bytes
  width       Int?                      // image width (null for audio)
  height      Int?                      // image height (null for audio)
  alt         String   @default("")     // alt text for images
  title       String   @default("")     // display title
  caption     String   @default("")     // optional caption
  folder      String   @default("")     // virtual folder for organization
  type        MediaType @default(IMAGE) // IMAGE, AUDIO, VIDEO, DOCUMENT
  uploadedBy  String?                   // user ID who uploaded
  user        User?    @relation(fields: [uploadedBy], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([type])
  @@index([folder])
  @@index([createdAt])
}

enum MediaType {
  IMAGE
  AUDIO
  VIDEO
  DOCUMENT
}
```

### API Routes

| Route                          | Method | Auth   | Purpose                                                  |
| ------------------------------ | ------ | ------ | -------------------------------------------------------- |
| `/api/admin/media`             | GET    | ADMIN+ | List media (paginated, filterable by type/folder/search) |
| `/api/admin/media`             | POST   | ADMIN+ | Upload new media (presigned URL + create DB record)      |
| `/api/admin/media/[id]`        | GET    | ADMIN+ | Get single media item                                    |
| `/api/admin/media/[id]`        | PATCH  | ADMIN+ | Update alt, title, caption, folder                       |
| `/api/admin/media/[id]`        | DELETE | ADMIN+ | Delete from R2 + DB                                      |
| `/api/admin/media/bulk-delete` | POST   | ADMIN+ | Bulk delete selected media                               |

---

## Phase 3: Uppy Media Library

### Goal

WordPress-style media manager in admin panel with Uppy Dashboard for uploads + custom media browser for existing files.

### Packages

```
pnpm add @uppy/core @uppy/dashboard @uppy/drag-drop @uppy/image-editor @uppy/progress-bar @uppy/informer @uppy/aws-s3 @uppy/react
```

### Admin Page

**Route:** `/admin/media`

### Layout: Two Tabs

1. **Upload Tab** — Uppy Dashboard
   - Drag-and-drop zone
   - Bulk file selection
   - Image editor (crop, rotate, resize) via `@uppy/image-editor`
   - Upload progress per file
   - Automatic DB record creation on upload success
   - Supports: images (jpg, png, webp, svg, gif) + audio (mp3, m4a, wav, flac, ogg)

2. **Library Tab** — Custom Media Grid
   - Responsive grid of thumbnails (images) / file icons (audio)
   - Search by filename/title
   - Filter by type (Image, Audio, Video, Document)
   - Filter by folder (virtual folders)
   - Sort by date, name, size
   - Pagination (infinite scroll or numbered)
   - Click to select → shows detail sidebar (preview, metadata, edit alt/title/caption)
   - Multi-select for bulk actions (delete, move folder)
   - Grid/List view toggle

### Uppy Upload Flow

1. User drops files into Uppy Dashboard
2. For each file → `POST /api/admin/media` → returns `{ uploadUrl, r2Key, mediaId }`
3. Uppy uploads to R2 via `@uppy/aws-s3` (presigned URL)
4. On success → DB record marked as uploaded
5. Media grid refreshes to show new uploads

---

## Phase 4: Media Picker for Posts

### Goal

When creating/editing posts, authors can insert images or attach audio files via a modal media picker (like WordPress "Add Media").

### Components

- **`MediaPickerModal.tsx`** — Reusable modal with two tabs:
  - **Upload** — Embedded Uppy (compact mode)
  - **Library** — Browse existing media with search/filter
  - **Select** button → returns selected media item(s) to the caller
- **`MediaPickerButton.tsx`** — Trigger button ("Add Media" / "Set Featured Image")

### Integration Points

- **Post featured image** — Single image picker → sets `featuredImage` field
- **Post content (rich editor)** — Insert image at cursor position
- **Music post audio file** — Single audio picker → sets audio URL
- **Album cover art** — Single image picker
- **Artist profile photo** — Single image picker

### Props Interface

```typescript
interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (media: Media | Media[]) => void;
  multiple?: boolean; // allow multi-select
  allowedTypes?: MediaType[]; // filter to specific types
  maxFiles?: number; // limit selection count
}
```

---

## File Summary

### New Files

```
docs/MEDIA-ROADMAP.md                              — This doc
src/app/admin/media/page.tsx                        — Media library page
src/app/admin/media/_components/MediaGrid.tsx        — Browsable media grid
src/app/admin/media/_components/MediaDetailPanel.tsx — Side panel for media metadata
src/app/admin/media/_components/UppyUploader.tsx     — Uppy Dashboard wrapper
src/app/api/admin/media/route.ts                    — GET (list) + POST (upload)
src/app/api/admin/media/[id]/route.ts               — GET + PATCH + DELETE single
src/app/api/admin/media/bulk-delete/route.ts        — Bulk delete
src/components/admin/MediaPickerModal.tsx            — Reusable picker modal
src/components/admin/MediaPickerButton.tsx           — Trigger button
```

### Modified Files

```
prisma/schema.prisma                                — Add Media model + MediaType enum
src/app/admin/settings/_components/ImageUploadField.tsx — Rewrite with FilePond
```

---

## Dependencies Added

| Package                               | Purpose                  | Bundle Impact |
| ------------------------------------- | ------------------------ | ------------- |
| `filepond`                            | Core upload library      | ~15KB gzipped |
| `react-filepond`                      | React bindings           | ~2KB          |
| `filepond-plugin-image-preview`       | Inline previews          | ~8KB          |
| `filepond-plugin-image-crop`          | Aspect ratio crop        | ~3KB          |
| `filepond-plugin-image-resize`        | Auto-resize              | ~2KB          |
| `filepond-plugin-image-transform`     | Apply crop/resize        | ~3KB          |
| `filepond-plugin-file-validate-type`  | MIME validation          | ~1KB          |
| `filepond-plugin-image-validate-size` | Dimension check          | ~1KB          |
| `@uppy/core`                          | Core upload orchestrator | ~25KB         |
| `@uppy/dashboard`                     | Full upload UI           | ~40KB         |
| `@uppy/image-editor`                  | Crop/rotate/resize       | ~30KB         |
| `@uppy/aws-s3`                        | Presigned URL uploads    | ~5KB          |
| `@uppy/react`                         | React bindings           | ~3KB          |
| `@uppy/informer`                      | Toast notifications      | ~2KB          |
| `@uppy/progress-bar`                  | Upload progress          | ~2KB          |

> All Uppy/FilePond code is admin-only — zero impact on public frontend bundle.
