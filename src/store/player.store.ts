import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Track {
  id: string;
  title: string;
  artist: string;
  artistSlug?: string;
  coverArt: string | null;
  r2Key: string;
  duration?: number;
  slug: string;
}

type RepeatMode = "off" | "all" | "one";

interface PlayerState {
  currentTrack: Track | null;
  userQueue: Track[];
  contextQueue: Track[];
  contextLabel: string;
  originalContextQueue: Track[];
  isPlaying: boolean;
  isBuffering: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  isMinimized: boolean;
  shuffle: boolean;
  repeatMode: RepeatMode;
  playHistory: Track[];
  isQueueOpen: boolean;

  setTrack: (track: Track) => void;
  setContextQueue: (tracks: Track[], label: string) => void;
  addToQueue: (track: Track) => void;
  playNextInQueue: (track: Track) => void;
  removeFromUserQueue: (id: string) => void;
  removeFromContextQueue: (id: string) => void;
  moveInUserQueue: (fromIndex: number, toIndex: number) => void;
  clearUserQueue: () => void;
  playNext: () => void;
  playPrev: () => void;
  togglePlay: () => void;
  setPlaying: (playing: boolean) => void;
  setBuffering: (buffering: boolean) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  toggleMinimize: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  toggleQueueOpen: () => void;
  clearPlayer: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      userQueue: [],
      contextQueue: [],
      contextLabel: "",
      originalContextQueue: [],
      isPlaying: false,
      isBuffering: false,
      volume: 0.8,
      isMuted: false,
      currentTime: 0,
      duration: 0,
      isMinimized: false,
      shuffle: false,
      repeatMode: "off" as RepeatMode,
      playHistory: [],
      isQueueOpen: false,

      setTrack: (track) => {
        const { playHistory } = get();
        const updatedHistory = [track, ...playHistory.filter((t) => t.id !== track.id)].slice(
          0,
          50
        );
        set({
          currentTrack: track,
          isPlaying: false,
          isBuffering: true,
          currentTime: 0,
          playHistory: updatedHistory,
        });
      },

      setContextQueue: (tracks, label) =>
        set({ contextQueue: tracks, originalContextQueue: tracks, contextLabel: label }),

      addToQueue: (track) =>
        set((s) => ({
          userQueue: s.userQueue.some((t) => t.id === track.id)
            ? s.userQueue
            : [...s.userQueue, track],
        })),

      playNextInQueue: (track) =>
        set((s) => ({
          userQueue: s.userQueue.some((t) => t.id === track.id)
            ? s.userQueue
            : [track, ...s.userQueue],
        })),

      removeFromUserQueue: (id) =>
        set((s) => ({ userQueue: s.userQueue.filter((t) => t.id !== id) })),

      removeFromContextQueue: (id) =>
        set((s) => ({ contextQueue: s.contextQueue.filter((t) => t.id !== id) })),

      moveInUserQueue: (fromIndex, toIndex) =>
        set((s) => {
          const arr = [...s.userQueue];
          const [moved] = arr.splice(fromIndex, 1);
          arr.splice(toIndex, 0, moved);
          return { userQueue: arr };
        }),

      clearUserQueue: () => set({ userQueue: [] }),

      playNext: () => {
        const { userQueue, contextQueue, currentTrack, repeatMode, shuffle, playHistory } = get();
        if (!currentTrack) return;

        if (repeatMode === "one") {
          set({ currentTime: 0, isPlaying: true, isBuffering: true });
          return;
        }

        // Priority: drain userQueue first
        if (userQueue.length > 0) {
          const [next, ...rest] = userQueue;
          const updatedHistory = [next, ...playHistory.filter((t) => t.id !== next.id)].slice(
            0,
            50
          );
          set({
            currentTrack: next,
            userQueue: rest,
            isPlaying: true,
            isBuffering: true,
            currentTime: 0,
            playHistory: updatedHistory,
          });
          return;
        }

        // Then contextQueue
        if (contextQueue.length === 0) return;
        const idx = contextQueue.findIndex((t) => t.id === currentTrack.id);

        if (shuffle) {
          const others = contextQueue.filter((t) => t.id !== currentTrack.id);
          if (others.length > 0) {
            const next = others[Math.floor(Math.random() * others.length)];
            const updatedHistory = [next, ...playHistory.filter((t) => t.id !== next.id)].slice(
              0,
              50
            );
            set({
              currentTrack: next,
              isPlaying: true,
              isBuffering: true,
              currentTime: 0,
              playHistory: updatedHistory,
            });
          } else if (repeatMode === "all") {
            set({ currentTime: 0, isPlaying: true, isBuffering: true });
          }
          return;
        }

        const next = contextQueue[idx + 1];
        if (next) {
          const updatedHistory = [next, ...playHistory.filter((t) => t.id !== next.id)].slice(
            0,
            50
          );
          set({
            currentTrack: next,
            isPlaying: true,
            isBuffering: true,
            currentTime: 0,
            playHistory: updatedHistory,
          });
        } else if (repeatMode === "all" && contextQueue.length > 0) {
          const first = contextQueue[0];
          const updatedHistory = [first, ...playHistory.filter((t) => t.id !== first.id)].slice(
            0,
            50
          );
          set({
            currentTrack: first,
            isPlaying: true,
            isBuffering: true,
            currentTime: 0,
            playHistory: updatedHistory,
          });
        }
      },

      playPrev: () => {
        const { contextQueue, currentTrack, currentTime, repeatMode, playHistory } = get();
        if (!currentTrack) return;
        if (currentTime > 3) {
          set({ currentTime: 0 });
          return;
        }
        const idx = contextQueue.findIndex((t) => t.id === currentTrack.id);
        const prev = contextQueue[idx - 1];
        if (prev) {
          const updatedHistory = [prev, ...playHistory.filter((t) => t.id !== prev.id)].slice(
            0,
            50
          );
          set({
            currentTrack: prev,
            isPlaying: true,
            isBuffering: true,
            currentTime: 0,
            playHistory: updatedHistory,
          });
        } else if (repeatMode === "all" && contextQueue.length > 0) {
          const last = contextQueue[contextQueue.length - 1];
          const updatedHistory = [last, ...playHistory.filter((t) => t.id !== last.id)].slice(
            0,
            50
          );
          set({
            currentTrack: last,
            isPlaying: true,
            isBuffering: true,
            currentTime: 0,
            playHistory: updatedHistory,
          });
        }
      },

      togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
      setPlaying: (playing) => set({ isPlaying: playing }),
      setBuffering: (buffering) => set({ isBuffering: buffering }),
      setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
      toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
      setCurrentTime: (time) => set({ currentTime: time }),
      setDuration: (duration) => set({ duration }),
      toggleMinimize: () => set((s) => ({ isMinimized: !s.isMinimized })),

      toggleShuffle: () => {
        const { shuffle, contextQueue, originalContextQueue } = get();
        if (shuffle) {
          set({ shuffle: false, contextQueue: originalContextQueue });
        } else {
          const shuffled = [...contextQueue].sort(() => Math.random() - 0.5);
          set({ shuffle: true, contextQueue: shuffled });
        }
      },

      cycleRepeat: () =>
        set((s) => ({
          repeatMode: s.repeatMode === "off" ? "all" : s.repeatMode === "all" ? "one" : "off",
        })),

      toggleQueueOpen: () => set((s) => ({ isQueueOpen: !s.isQueueOpen })),

      clearPlayer: () =>
        set({
          currentTrack: null,
          userQueue: [],
          contextQueue: [],
          contextLabel: "",
          originalContextQueue: [],
          isPlaying: false,
          isBuffering: false,
          currentTime: 0,
          shuffle: false,
          repeatMode: "off" as RepeatMode,
        }),
    }),
    {
      name: "soundloadedblog-player",
      partialize: (s) => ({
        volume: s.volume,
        isMuted: s.isMuted,
        userQueue: s.userQueue,
        contextQueue: s.contextQueue,
        contextLabel: s.contextLabel,
        originalContextQueue: s.originalContextQueue,
        shuffle: s.shuffle,
        repeatMode: s.repeatMode,
        playHistory: s.playHistory,
        currentTrack: s.currentTrack,
        currentTime: s.currentTime,
        duration: s.duration,
        isMinimized: s.isMinimized,
      }),
      // Migrate from old single queue format
      migrate: (persisted) => {
        const state = persisted as Record<string, unknown> | null;
        if (state && state.queue && !state.contextQueue) {
          return {
            ...state,
            contextQueue: state.queue,
            userQueue: [],
            contextLabel: "",
            queue: undefined,
            originalQueue: undefined,
          };
        }
        return state as Record<string, unknown>;
      },
      version: 1,
      skipHydration: true,
    }
  )
);
