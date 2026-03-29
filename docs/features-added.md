# Soundloaded Blog — Feature Additions & Improvements

**Date:** March 28, 2026
**Scope:** Music streaming infrastructure, playlists, player UX, admin panel, codebase hardening

---

## 1. Playlists System (Full Feature)

### Database

- Added `Playlist` and `PlaylistTrack` models to Prisma schema
- `Playlist`: title, slug, description, coverImage, isPublic, userId, timestamps
- `PlaylistTrack`: join table with `position` field for ordering, unique constraint per playlist+music
- Relations added to `User` and `Music` models

### User-Facing API (`/api/user/playlists/`)

- `GET /api/user/playlists` — list user's playlists with cover art mosaic
- `POST /api/user/playlists` — create playlist with auto-slug generation
- `GET /api/user/playlists/[id]` — get playlist with full track details (supports public access for non-owners)
- `PATCH /api/user/playlists/[id]` — update title/description/cover/visibility
- `DELETE /api/user/playlists/[id]` — delete with ownership check
- `POST /api/user/playlists/[id]/tracks` — add track (auto-positions, dedupes)
- `PATCH /api/user/playlists/[id]/tracks` — batch reorder tracks
- `DELETE /api/user/playlists/[id]/tracks/[trackId]` — remove + recalculate positions

### Public API (`/api/playlists/`)

- `GET /api/playlists` — browse all public playlists with search + pagination
- `GET /api/playlists/[id]` — public playlist detail with tracks (auth-aware for owner features)

### React Query Hooks (`src/hooks/usePlaylist.ts`)

- `useUserPlaylists()` — list user's playlists
- `usePlaylist(id)` — single playlist with tracks
- `useCreatePlaylist()` — create mutation with toast
- `useUpdatePlaylist()` — update mutation
- `useDeletePlaylist()` — delete mutation
- `useAddTrackToPlaylist()` — add track with 409 duplicate handling
- `useRemoveTrackFromPlaylist()` — remove track
- `useReorderPlaylistTracks()` — batch reorder

### Validation (`src/lib/validations/user.ts`)

- `createPlaylistSchema` — title (1-100), description (optional, max 500), isPublic
- `updatePlaylistSchema` — all fields optional
- `addTrackToPlaylistSchema` — musicId required
- `reorderPlaylistSchema` — array of {id, position}

### UI Components

- **CreatePlaylistModal** (`src/components/music/CreatePlaylistModal.tsx`) — dialog with name, description, public/private toggle
- **PlaylistPicker** (`src/components/music/PlaylistPicker.tsx`) — bottom sheet for "Add to Playlist" flow, shows all user playlists, inline create
- **PlaylistCard** (`src/components/music/PlaylistCard.tsx`) — grid card with auto-mosaic cover (2x2 from first 4 track covers), play overlay, privacy badge, creator name

### Pages

- **User Playlist Management** (`/library/playlists`) — grid of user's playlists with create button, "Liked Songs" virtual card, privacy badges
- **User Playlist Detail** (`/library/playlists/[id]`) — header with gradient, cover, play/shuffle/share/delete, track list with heart + remove
- **Public Playlists Browse** (`/playlists`) — search, infinite scroll grid, MorphingTitle animation
- **Public Playlist Detail** (`/playlists/[id]`) — YouTube Music-style two-panel layout:
  - Left info panel (sticky): cover art, title, creator avatar, description, metadata, play/shuffle/share buttons
  - Right track list: numbered rows with cover, title, artist, album, duration, heart, remove (owner)
  - "More Playlists" scroll shelf at bottom
  - Dominant color gradient background extracted from cover art

### Integration

- **MusicActionMenu**: added "Add to Playlist" option that opens PlaylistPicker sheet
- **MusicLeftSidebar**: added "Playlists" nav link (public browse) + renamed library link to "My Playlists"
- **Music Page** (`/music`): added "Community Playlists" scroll shelf section

---

## 2. Player Store — Shuffle, Repeat & Play History

### Shuffle (`src/store/player.store.ts`)

- `shuffle: boolean` state + `toggleShuffle()` action
- When enabled: randomizes queue, preserves original order for un-shuffle
- `playNext()` picks random unplayed track when shuffle is on

### Repeat (`src/store/player.store.ts`)

- `repeatMode: 'off' | 'all' | 'one'` + `cycleRepeat()` action
- `playNext()`: repeat-one loops current track, repeat-all loops to start of queue
- `playPrev()`: repeat-all wraps to end of queue
- Howl.js `onend`: repeat-one seeks to 0 and replays without re-fetching stream

### Play History

- `playHistory: Track[]` — max 50 tracks, deduplicated, persisted to localStorage
- Populated automatically when `setTrack()` is called
- Preserved when `clearPlayer()` is called (history survives player close)

### Desktop Controls (`src/components/music/MusicPlayer.tsx`)

- Shuffle button: toggles on/off, brand color when active
- Repeat button: cycles off -> all -> one, brand color when active, shows Repeat1 icon for repeat-one

---

## 3. Music Playback Bug Fixes

### Problem: Tracks Without Audio Files Show as "Playing"

Tracks without R2 audio files (empty/missing `r2Key`) would display equalizer bars and show as "currently playing" when clicked, even though no audio loaded.

### Root Cause

1. `MusicCardData` interface lacked `r2Key` field — 6 components set it to `""` in `toPlayerTrack()`
2. `MusicPlayer.tsx` created Howl instance and set `isPlaying: true` without validating `r2Key`
3. No `onerror`/`onloaderror` handlers on Howl to revert state on stream failure
4. Stream API incremented `streamCount` even when `r2Key` was missing

### Fixes Applied

**Data layer** (`src/lib/api/music.ts`):

- Added `r2Key: string` to `MusicCardData` interface
- Added `r2Key: t.r2Key` to all 5 mapper functions

**All `toPlayerTrack()` conversions** (6 files fixed):

- `MusicShelfCard.tsx`, `MusicListItem.tsx`, `MusicActionMenu.tsx`, `MusicRightSidebar.tsx`, `MusicCard.tsx`, `ArtistDetailClient.tsx`
- Changed from `r2Key: ""` to `r2Key: t.r2Key`

**MusicPlayer.tsx** — playback gating:

- Added early return when `!currentTrack.r2Key`: sets `isPlaying: false`, `isBuffering: false`
- Added `onloaderror` handler: reverts `isPlaying` and `isBuffering` on stream failure
- Added `onplayerror` handler: same revert logic

**Stream API** (`/api/music/[id]/stream/route.ts`):

- Added `if (!music.r2Key)` check — returns 404 before generating presigned URL
- `streamCount` only incremented after successful URL generation

---

## 4. Buffering Indicator

### Problem

The player store tracked `isBuffering` state but never showed it in the UI. Users saw no visual feedback when audio was loading.

### Fix

- Desktop play button: shows `Loader2` spinner animation while buffering instead of play/pause icon
- Mobile play button: same spinner treatment
- Both automatically clear when `onplay` fires (buffering -> playing transition)

---

## 5. Admin Playlists Management

### Admin API (`/api/admin/playlists/`)

- `GET /api/admin/playlists` — list all playlists with search, pagination, owner info
- `GET /api/admin/playlists/[id]` — single playlist with tracks
- `PATCH /api/admin/playlists/[id]` — update title/description/visibility
- `DELETE /api/admin/playlists/[id]` — delete playlist
- All routes require ADMIN/SUPER_ADMIN role

### Admin Page (`/admin/playlists`)

- Server-rendered data table with search and pagination
- Columns: title, owner, track count, public toggle, updated date, actions
- Checkbox selection with bulk delete
- Inline public/private toggle (Switch component)
- Single + bulk delete with AlertDialog confirmation
- External link to view public page

### Admin Sidebar

- Added "Playlists" with `ListMusic` icon to main navigation in `AdminSidebar.tsx`

---

## 6. Music Page Revamp — Mixed Layouts

### Problem

All music page sections used identical horizontal scroll shelves — repetitive and basic.

### Changes (`/music` page)

Sections now alternate between grid, scroll shelf, and chart-list layouts:

| Section             | Layout                     | MorphingTitle                                                   |
| ------------------- | -------------------------- | --------------------------------------------------------------- |
| New Releases        | Grid (2->3->4 cols)        | "New Releases", "Just Dropped", "Fresh Music", "Latest Drops"   |
| Trending Now        | Scroll Shelf               | "Trending Now", "Hot Right Now", "What's Poppin", "Fire Tracks" |
| Most Streamed       | Chart List (numbered rows) | "Most Streamed", "Top Charts", "Fan Favorites", "Hit Tracks"    |
| Top Albums          | Grid                       | "Top Albums", "Album Picks", "Full Projects"                    |
| Rising Artists      | Scroll Shelf               | "Rising Artists", "New Voices", "Artists to Watch"              |
| Community Playlists | Scroll Shelf               | "Community Playlists", "Curated Collections", "Playlist Picks"  |
| Genre shelves       | Scroll Shelf per genre     | Genre name                                                      |

### New Components

- **MusicListItem** (`src/components/music/MusicListItem.tsx`) — chart-style row with rank number, cover, title/artist, stream count, play-on-hover, heart button
- **MorphingTitle** — now accepts `titles`, `className`, `as` props (backward compatible)
- **ScrollShelf** — title prop now accepts `ReactNode` for MorphingTitle integration

### Data Layer

- Added `streamCount` to `MusicCardData` interface and all mappers
- Added `getMostStreamedMusic()` function — orders by `streamCount desc`, filters `> 0`
- Added `getPublicPlaylists()` function for the playlists shelf section

---

## 7. Seek Bar & Volume Bar — Spotify-Style Hover Behavior

### Seek Bar Hover Tooltip

- Desktop seek bar shows floating timestamp tooltip following cursor position
- Calculates time from mouse X position relative to bar width
- Shows `formatDuration()` in a small pill above the cursor

### Slider Component Updates (`src/components/ui/slider.tsx`)

- Default range color: `muted-foreground/60` (gray)
- Hover range color: `bg-brand` (accent color, like Spotify's green)
- Thumb hidden by default, appears on hover/active (`opacity-0 group-hover:opacity-100`)
- Track grows slightly on hover (h-1 -> h-1.5 for default variant)
- Thin variant stays at h-[2px] (used for mobile player)

---

## 8. Heart/Favorite Button — Wired to API

### MiniPlayer + MusicPlayer

- Replaced static `<Heart>` icons with functional `<HeartButton>` component
- Connected to `useMusicFavorite` hook via existing `/api/user/favorites` API
- Features: optimistic toggle, burst animation on like, toast notifications, sign-in prompt for unauthenticated users

---

## Files Modified/Created Summary

### New Files (27)

- `src/app/api/user/playlists/route.ts`
- `src/app/api/user/playlists/[id]/route.ts`
- `src/app/api/user/playlists/[id]/tracks/route.ts`
- `src/app/api/user/playlists/[id]/tracks/[trackId]/route.ts`
- `src/app/api/playlists/route.ts`
- `src/app/api/playlists/[id]/route.ts`
- `src/app/api/admin/playlists/route.ts`
- `src/app/api/admin/playlists/[id]/route.ts`
- `src/hooks/usePlaylist.ts`
- `src/components/music/CreatePlaylistModal.tsx`
- `src/components/music/PlaylistPicker.tsx`
- `src/components/music/PlaylistCard.tsx`
- `src/components/music/MusicListItem.tsx`
- `src/app/(user)/library/playlists/page.tsx`
- `src/app/(user)/library/playlists/[id]/page.tsx`
- `src/app/(user)/library/playlists/[id]/PlaylistDetailClient.tsx`
- `src/app/playlists/page.tsx`
- `src/app/playlists/PlaylistsPageClient.tsx`
- `src/app/playlists/[id]/page.tsx`
- `src/app/playlists/[id]/PlaylistPageClient.tsx`
- `src/app/admin/playlists/page.tsx`
- `src/app/admin/playlists/_components/PlaylistsTable.tsx`
- `docs/features-added.md`

### Modified Files (18)

- `prisma/schema.prisma` — Playlist + PlaylistTrack models
- `src/lib/validations/user.ts` — playlist validation schemas
- `src/lib/api/music.ts` — r2Key in MusicCardData, getMostStreamedMusic, getPublicPlaylists
- `src/store/player.store.ts` — shuffle, repeat, playHistory
- `src/components/music/MusicPlayer.tsx` — shuffle/repeat controls, buffering spinner, r2Key validation, error handlers
- `src/components/music/MiniPlayer.tsx` — HeartButton integration
- `src/components/music/MusicShelfCard.tsx` — r2Key fix
- `src/components/music/MusicListItem.tsx` — r2Key fix (created new)
- `src/components/music/MusicActionMenu.tsx` — "Add to Playlist" + r2Key fix
- `src/components/music/MusicRightSidebar.tsx` — r2Key fix
- `src/components/music/MusicCard.tsx` — r2Key fix
- `src/components/music/ScrollShelf.tsx` — ReactNode title prop
- `src/components/blog/MorphingTitle.tsx` — configurable props
- `src/components/ui/slider.tsx` — hover behavior, accent color
- `src/components/admin/AdminSidebar.tsx` — Playlists nav link
- `src/components/music/MusicLeftSidebar.tsx` — Playlists public nav link
- `src/app/music/page.tsx` — mostStreamed + playlists data fetching
- `src/app/music/MusicPageClient.tsx` — mixed layout sections
- `src/app/api/music/[id]/stream/route.ts` — r2Key validation
- `src/app/artists/[slug]/ArtistDetailClient.tsx` — r2Key fix
