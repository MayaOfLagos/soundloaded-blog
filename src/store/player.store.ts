import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Track {
  id: string;
  title: string;
  artist: string;
  coverArt: string;
  r2Key: string;
  duration?: number;
  slug: string;
}

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  isMinimized: boolean;

  setTrack: (track: Track) => void;
  setQueue: (tracks: Track[]) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (id: string) => void;
  playNext: () => void;
  playPrev: () => void;
  togglePlay: () => void;
  setPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  toggleMinimize: () => void;
  clearPlayer: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      queue: [],
      isPlaying: false,
      volume: 0.8,
      isMuted: false,
      currentTime: 0,
      duration: 0,
      isMinimized: false,

      setTrack: (track) => {
        const { queue } = get();
        const alreadyInQueue = queue.some((t) => t.id === track.id);
        set({
          currentTrack: track,
          isPlaying: true,
          currentTime: 0,
          queue: alreadyInQueue ? queue : [track, ...queue],
        });
      },

      setQueue: (tracks) => set({ queue: tracks }),

      addToQueue: (track) =>
        set((s) => ({
          queue: s.queue.some((t) => t.id === track.id) ? s.queue : [...s.queue, track],
        })),

      removeFromQueue: (id) => set((s) => ({ queue: s.queue.filter((t) => t.id !== id) })),

      playNext: () => {
        const { queue, currentTrack } = get();
        if (!currentTrack || queue.length === 0) return;
        const idx = queue.findIndex((t) => t.id === currentTrack.id);
        const next = queue[idx + 1];
        if (next) set({ currentTrack: next, isPlaying: true, currentTime: 0 });
      },

      playPrev: () => {
        const { queue, currentTrack, currentTime } = get();
        if (!currentTrack) return;
        if (currentTime > 3) {
          set({ currentTime: 0 });
          return;
        }
        const idx = queue.findIndex((t) => t.id === currentTrack.id);
        const prev = queue[idx - 1];
        if (prev) set({ currentTrack: prev, isPlaying: true, currentTime: 0 });
      },

      togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
      setPlaying: (playing) => set({ isPlaying: playing }),
      setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
      toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
      setCurrentTime: (time) => set({ currentTime: time }),
      setDuration: (duration) => set({ duration }),
      toggleMinimize: () => set((s) => ({ isMinimized: !s.isMinimized })),
      clearPlayer: () => set({ currentTrack: null, queue: [], isPlaying: false, currentTime: 0 }),
    }),
    {
      name: "soundloadedblog-player",
      partialize: (s) => ({ volume: s.volume, isMuted: s.isMuted, queue: s.queue }),
    }
  )
);
