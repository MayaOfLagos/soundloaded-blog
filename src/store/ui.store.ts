import { create } from "zustand";

interface UIState {
  isMobileNavOpen: boolean;
  isSearchOpen: boolean;
  isPlayerFullscreen: boolean;

  openMobileNav: () => void;
  closeMobileNav: () => void;
  toggleMobileNav: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
  openPlayerFullscreen: () => void;
  closePlayerFullscreen: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMobileNavOpen: false,
  isSearchOpen: false,
  isPlayerFullscreen: false,

  openMobileNav: () => set({ isMobileNavOpen: true }),
  closeMobileNav: () => set({ isMobileNavOpen: false }),
  toggleMobileNav: () => set((s) => ({ isMobileNavOpen: !s.isMobileNavOpen })),
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
  toggleSearch: () => set((s) => ({ isSearchOpen: !s.isSearchOpen })),
  openPlayerFullscreen: () => set({ isPlayerFullscreen: true }),
  closePlayerFullscreen: () => set({ isPlayerFullscreen: false }),
}));
