import { create } from "zustand";

const THEME_MODE_KEY = "cielp_theme_mode";

const getInitialMode = () => {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedMode = window.localStorage.getItem(THEME_MODE_KEY);
  if (storedMode === "dark" || storedMode === "light") {
    return storedMode;
  }

  return "light";
};

const persistMode = (mode) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(THEME_MODE_KEY, mode);
};

const applyDomMode = (mode) => {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.setAttribute("data-theme", mode);
};

const initialMode = getInitialMode();
applyDomMode(initialMode);

export const useThemeStore = create((set) => ({
  mode: initialMode,

  setMode: (mode) => {
    const safeMode = mode === "dark" ? "dark" : "light";
    persistMode(safeMode);
    applyDomMode(safeMode);
    set({ mode: safeMode });
  },

  applyDarkModePreference: (isDarkEnabled) => {
    const nextMode = isDarkEnabled ? "dark" : "light";
    persistMode(nextMode);
    applyDomMode(nextMode);
    set({ mode: nextMode });
  },

  toggleMode: () =>
    set((state) => {
      const nextMode = state.mode === "dark" ? "light" : "dark";
      persistMode(nextMode);
      applyDomMode(nextMode);
      return { mode: nextMode };
    }),
}));
