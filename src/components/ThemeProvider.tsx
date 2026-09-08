"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ThemeMode } from "@/lib/types";

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  resolvedTheme: "light",
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

const THEME_STORAGE_KEY = "dua_card_theme_pref";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read saved preference, default to system preference if none saved
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (saved === "light" || saved === "dark") {
      setThemeState(saved);
    } else {
      const prefersDark =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setThemeState(prefersDark ? "dark" : "light");
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      root.style.colorScheme = "dark";
      setResolvedTheme("dark");
      updateThemeMeta("#121212");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      root.style.colorScheme = "light";
      setResolvedTheme("light");
      updateThemeMeta("#ffffff");
    }
  }, [theme, mounted]);

  // Listen for system theme changes and PWA window focus/visibility changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const syncPwaMeta = () => {
      const activeColor = theme === "dark" ? "#121212" : "#ffffff";
      updateThemeMeta(activeColor);
    };

    window.addEventListener("focus", syncPwaMeta);
    document.addEventListener("visibilitychange", syncPwaMeta);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (!saved) {
        setThemeState(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => {
      window.removeEventListener("focus", syncPwaMeta);
      document.removeEventListener("visibilitychange", syncPwaMeta);
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  const updateThemeMeta = (color: string) => {
    const isDark = color !== "#ffffff";
    const root = document.documentElement;

    // 1. Update element background colors & colorScheme directly
    root.style.colorScheme = isDark ? "dark" : "light";
    root.style.backgroundColor = color;
    if (document.body) {
      document.body.style.backgroundColor = color;
    }

    // 2. Remove and re-insert color-scheme meta tag for WebAPK / PWA engine
    const oldCS = document.querySelectorAll('meta[name="color-scheme"]');
    oldCS.forEach((m) => m.remove());

    const colorSchemeMeta = document.createElement("meta");
    colorSchemeMeta.setAttribute("name", "color-scheme");
    colorSchemeMeta.setAttribute("content", isDark ? "dark" : "light");
    document.head.appendChild(colorSchemeMeta);

    // 3. Remove and re-insert theme-color meta tag (forces Android WebAPK MutationObserver status bar update)
    const oldThemeMetas = document.querySelectorAll('meta[name="theme-color"]');
    oldThemeMetas.forEach((m) => m.remove());

    const newThemeMeta = document.createElement("meta");
    newThemeMeta.setAttribute("name", "theme-color");
    newThemeMeta.setAttribute("content", color);
    document.head.appendChild(newThemeMeta);

    // 4. Remove and re-insert apple-mobile-web-app-status-bar-style for iOS Standalone PWA
    const oldAppleMetas = document.querySelectorAll('meta[name="apple-mobile-web-app-status-bar-style"]');
    oldAppleMetas.forEach((m) => m.remove());

    const appleMeta = document.createElement("meta");
    appleMeta.setAttribute("name", "apple-mobile-web-app-status-bar-style");
    appleMeta.setAttribute("content", isDark ? "black-translucent" : "default");
    document.head.appendChild(appleMeta);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
