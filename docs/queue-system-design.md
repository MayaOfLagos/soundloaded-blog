# Queue System — Design & Implementation TODO

## How Music Streaming Platforms Handle Queue

### The Two Queue Types

Every streaming platform (Spotify, Apple Music, YouTube Music) has the same mental model:

1. **Auto-Queue (Context Queue)** — When you click play on a track, all sibling tracks from that context (album, playlist, artist page, chart, etc.) become the "up next" queue. This is implicit — the user didn't manually choose these, the system inferred them from context.

2. **User Queue (Manual Queue)** — When you click "Add to Queue" or "Play Next", those tracks sit in a priority lane ABOVE the auto-queue. They play before the auto-queue resumes. This is explicit — the user chose these.

### How Spotify Does It

```
Currently Playing: Track A
────────────────────────
Next in Queue (user-added):        ← priority lane
  1. Track X (added by user)
  2. Track Y (added by user)
────────────────────────
Next From: "Naija Vibes 2024"      ← auto-queue (context)
  3. Track B
  4. Track C
  5. Track D
```

When Track A finishes:

- Track X plays (from user queue)
- When user queue is empty, auto-queue resumes (Track B)

When you play from a NEW context (click a track from a different playlist):

- User queue is PRESERVED (Track X, Y still queued)
- Auto-queue is REPLACED with the new context
- Currently playing switches to the new track

---

## Current State in Soundloaded

### What We Have

- Single `queue: Track[]` — no distinction between user-added and auto-queued
- `setQueue(tracks)` — replaces entire queue (used when playing from context)
- `addToQueue(track)` — appends to end (used by "Add to Queue" action)
- `playNext()` / `playPrev()` — linear traversal with shuffle/repeat support
- Queue count shown in left sidebar ("N tracks in queue")
- No queue viewing/editing UI

### Problems

1. Playing from a new context REPLACES the entire queue — user-added tracks are lost
2. No "Play Next" (insert after current, not at end)
3. No UI to view, reorder, or remove queued tracks
4. User has no idea what's coming next
5. No distinction between "I chose this" and "the system queued this"

---

## Proposed Architecture

### Store Changes (`player.store.ts`)

```
State:
  currentTrack: Track | null
  userQueue: Track[]          ← NEW: user-manually-added tracks (priority)
  contextQueue: Track[]       ← RENAME from queue: auto-generated from context
  contextLabel: string        ← NEW: "Naija Vibes 2024", "Davido", "New Releases"
  originalContextQueue: Track[] ← for shuffle toggle
  shuffle, repeatMode, playHistory (unchanged)

Actions:
  setTrack(track)             ← play immediately
  setContextQueue(tracks, label) ← replace auto-queue + label (e.g., "From: Naija Vibes")
  addToQueue(track)           ← append to userQueue (end)
  playNext(track)             ← NEW: insert into userQueue at position 0
  removeFromQueue(id, type)   ← NEW: remove from user or context queue
  moveInQueue(from, to, type) ← NEW: reorder within a queue
  clearUserQueue()            ← NEW: clear user queue only
  playNext() / playPrev()     ← updated logic (drain userQueue first, then contextQueue)
```

### Queue Resolution Order (for playNext)

```
1. userQueue[0] → play it, remove from userQueue
2. contextQueue[currentIdx + 1] → play it
3. If end of contextQueue + repeatMode === "all" → loop to contextQueue[0]
4. If end + repeatMode === "off" → stop
```

### Queue Resolution Order (for playPrev)

```
1. If currentTime > 3s → restart current track
2. Check if previous track was from userQueue → go back there
3. contextQueue[currentIdx - 1] → play it
4. If at start + repeatMode === "all" → jump to contextQueue[end]
```

---

## UI Design

### Desktop Queue Panel

- **Trigger**: Queue icon button in the player bar (right section, next to volume)
- **Position**: Slide-out panel from the right side, overlays content (like Spotify)
- **Width**: ~350px
- **Sections**:
  ```
  ┌─────────────────────────────┐
  │ Queue                    ✕  │
  ├─────────────────────────────┤
  │ Now Playing                 │
  │ [cover] Track A - Artist    │
  ├─────────────────────────────┤
  │ Next in Queue               │  ← userQueue (if not empty)
  │ 1. [cover] Track X  ⋮  ✕   │
  │ 2. [cover] Track Y  ⋮  ✕   │
  ├─────────────────────────────┤
  │ Next From: Naija Vibes 2024 │  ← contextQueue
  │ 3. [cover] Track B  ⋮      │
  │ 4. [cover] Track C  ⋮      │
  │ 5. [cover] Track D  ⋮      │
  │ ...                         │
  ├─────────────────────────────┤
  │ Recently Played             │  ← playHistory
  │ [cover] Track Z             │
  │ [cover] Track W             │
  └─────────────────────────────┘
  ```
- Each row: drag handle (reorder), cover art, title/artist, more menu (remove, play next)
- Clear queue button for user queue section
- "Next From" label shows context source

### Mobile Queue Sheet

- **Trigger**: Swipe up from MiniPlayer or tap queue icon in expanded player
- **Position**: Full-screen bottom sheet (like Spotify's mobile queue)
- **Layout**: Same sections as desktop but full-width
- **Interaction**: Swipe-to-remove on rows, long-press to reorder
- **Navigation**: Back button to return to player

### Queue Icon in Player Bar

- Add a `ListMusic` or `ListOrdered` icon button to the desktop player's right section
- Badge showing total queue count (userQueue + remaining contextQueue)
- Active/highlighted when queue panel is open

---

## Implementation TODO

### Phase 1: Store Refactor

- [ ] Split `queue` into `userQueue` and `contextQueue`
- [ ] Add `contextLabel` field (string describing the queue source)
- [ ] Add `playNext(track)` action (insert at userQueue[0])
- [ ] Add `removeFromQueue(id, type: 'user' | 'context')` action
- [ ] Add `moveInQueue(fromIndex, toIndex, type)` action
- [ ] Add `clearUserQueue()` action
- [ ] Update `playNext()` to drain userQueue first
- [ ] Update `playPrev()` to handle dual-queue navigation
- [ ] Update `toggleShuffle()` to only shuffle contextQueue (userQueue stays ordered)
- [ ] Update persist partialize for new fields
- [ ] Maintain backward compatibility with existing `addToQueue()`

### Phase 2: Update All Play Sources

- [ ] MusicShelfCard — `setContextQueue(shelfTracks, shelfTitle)`
- [ ] MusicListItem — `setContextQueue(listTracks, sectionTitle)`
- [ ] MusicRightSidebar — `setContextQueue(sidebarTracks, "Trending"/"Popular")`
- [ ] MusicSortedGrid — `setContextQueue(remainingTracks, "New Releases"/"Trending")`
- [ ] PlaylistPageClient — `setContextQueue(playlistTracks, playlistTitle)`
- [ ] PlaylistDetailClient — same
- [ ] AlbumTracklist — `setContextQueue(albumTracks, albumTitle)`
- [ ] ArtistDetailClient — `setContextQueue(artistTracks, artistName)`
- [ ] TrackActionBar — `setTrack()` only (no context, single play)
- [ ] MusicActionMenu — update "Add to Queue" to use userQueue, add "Play Next"

### Phase 3: Desktop Queue Panel

- [ ] Create `QueuePanel.tsx` component (slide-out from right)
- [ ] "Now Playing" section showing current track
- [ ] "Next in Queue" section showing userQueue with remove buttons
- [ ] "Next From: {contextLabel}" section showing contextQueue
- [ ] "Recently Played" section showing playHistory (last 10)
- [ ] Drag-to-reorder within each section (use @dnd-kit/sortable)
- [ ] "Clear Queue" button for user queue
- [ ] Close button + click-outside-to-close
- [ ] Add queue toggle button to MusicPlayer desktop right section

### Phase 4: Mobile Queue

- [ ] Create `QueueSheet.tsx` component (full-screen bottom sheet)
- [ ] Same sections as desktop adapted for mobile
- [ ] Swipe-to-remove on track rows
- [ ] Long-press drag to reorder
- [ ] Tab bar: "Up Next" / "Recently Played"
- [ ] Add queue button to expanded mobile MusicPlayer
- [ ] Accessible from MiniPlayer via swipe-up gesture or button

### Phase 5: MusicActionMenu Update

- [ ] Add "Play Next" option (inserts at userQueue[0])
- [ ] Rename current "Add to Queue" to clarify it appends to end
- [ ] Both show toast confirmation with track name

### Phase 6: Queue Count Badge

- [ ] Add queue count badge to desktop player's queue button
- [ ] Show total pending (userQueue.length + remaining contextQueue tracks)
- [ ] Animate badge when new tracks are added
- [ ] Update MusicLeftSidebar to show more detailed queue info

### Phase 7: Edge Cases & Polish

- [ ] Handle empty queue gracefully (show "Queue is empty" state)
- [ ] When queue ends naturally (no repeat), show "Queue finished" state
- [ ] Keyboard shortcuts: Q to toggle queue panel
- [ ] Auto-scroll queue panel to highlight currently playing track
- [ ] When user plays from a new context, show brief toast "Playing from {contextLabel}"
- [ ] Persist userQueue separately from contextQueue in localStorage

---

## Key Design Decisions to Make

### 1. What happens when user plays from a new context?

**Recommended**: Replace contextQueue, preserve userQueue.
User-added tracks are intentional — don't discard them.

### 2. Should "Play Next" add to userQueue or insert into contextQueue?

**Recommended**: Always add to userQueue. This is the Spotify model.
UserQueue is the priority lane that plays before contextQueue resumes.

### 3. Should shuffle affect userQueue?

**Recommended**: No. Only shuffle contextQueue.
UserQueue order is intentional (user chose the order by adding sequentially).

### 4. Maximum queue size?

**Recommended**: No hard limit on contextQueue (it comes from context data).
UserQueue: cap at 50 tracks to prevent abuse.

### 5. Should queue persist across sessions?

**Recommended**: Yes, persist both queues in localStorage (already done for queue).
But do NOT auto-play on page load — just restore the queue state silently.

### 6. Mobile vs Desktop — same component or separate?

**Recommended**: Separate components (QueuePanel for desktop, QueueSheet for mobile).
They share the same store and data but have different interaction patterns (drag vs swipe, panel vs sheet).

---

## Dependencies

- `@dnd-kit/core` + `@dnd-kit/sortable` — for drag-to-reorder (check if already installed)
- Existing: `motion/react` (Framer Motion) for panel animations
- Existing: `@/components/ui/sheet` for mobile bottom sheet

---

## Priority Order

1. **Store refactor** (foundation — everything depends on this)
2. **Update play sources** (make contextQueue work everywhere)
3. **Desktop queue panel** (most impactful UX improvement)
4. **MusicActionMenu** (add "Play Next")
5. **Mobile queue sheet** (mobile users need this too)
6. **Polish & edge cases** (last)

---

## Estimated Scope

- Store refactor: 1 file, moderate complexity (backward compat needed)
- Play sources: 9 files, small changes each
- Desktop panel: 1 new component, moderate complexity
- Mobile sheet: 1 new component, moderate complexity
- Action menu: 1 file, small change
- Total: ~12-14 files touched, 2-3 new components
