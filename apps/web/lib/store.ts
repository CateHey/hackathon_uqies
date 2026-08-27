"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FreedomProfile } from "@free-me/core";

export type Mode = "explore" | "professional";

/** The onboarding form, saved as the user goes so a refresh loses nothing. */
export type Draft = Partial<FreedomProfile>;

interface UiState {
  mode: Mode;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
  draft: Draft;
  setDraft: (patch: Draft) => void;
  clearDraft: () => void;
  disclaimerSeen: boolean;
  setDisclaimerSeen: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      mode: "explore",
      setMode: (mode) => set({ mode }),
      toggleMode: () => set((s) => ({ mode: s.mode === "explore" ? "professional" : "explore" })),
      draft: { country: "AU", currency: "AUD" },
      setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
      clearDraft: () => set({ draft: { country: "AU", currency: "AUD" } }),
      disclaimerSeen: false,
      setDisclaimerSeen: () => set({ disclaimerSeen: true }),
    }),
    { name: "free-me-ui" },
  ),
);
