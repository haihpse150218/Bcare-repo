"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserPublic } from "@bcare/shared";

interface AuthState {
  user: UserPublic | null;
  token: string | null;
  refreshToken: string | null;
  setAuth: (user: UserPublic, token: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      setAuth: (user, token, refreshToken) => set({ user, token, refreshToken }),
      logout: () => set({ user: null, token: null, refreshToken: null }),
    }),
    { name: "bcare-auth" }
  )
);
