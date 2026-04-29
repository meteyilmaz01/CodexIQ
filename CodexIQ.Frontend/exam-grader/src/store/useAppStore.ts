// src/store/useAppStore.ts

import { create } from "zustand";

interface User {
  firstName: string;
  lastName: string;
  role: string;
}

interface AppStore {
  // Theme & Language
  theme: "dark" | "light";
  language: "tr" | "en";
  toggleTheme: () => void;
  setLanguage: (lang: "tr" | "en") => void;

  // Auth
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Theme & Language
  theme: "dark",
  language: "tr",
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
  setLanguage: (lang) => set({ language: lang }),

  // Auth
  token: localStorage.getItem("token"),
  user: JSON.parse(localStorage.getItem("user") || "null"),

  setAuth: (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ token: null, user: null });
  },

  isAuthenticated: () => !!get().token,
}));