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

  // Listen for system theme changes if user hasn't set explicit preference
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (!saved) {
        setThemeState(e.matches ? "dark" : "light");
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

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

    // 2. Update color-scheme meta tag
    let colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
    if (!colorSchemeMeta) {
      colorSchemeMeta = document.createElement("meta");
      colorSchemeMeta.setAttribute("name", "color-scheme");
      document.head.appendChild(colorSchemeMeta);
    }
    colorSchemeMeta.setAttribute("content", isDark ? "dark" : "light");

    // 3. Update all theme-color meta tags in DOM directly without removing nodes
    const metas = document.querySelectorAll('meta[name="theme-color"]');
    if (metas.length > 0) {
      metas.forEach((m) => {
        m.removeAttribute("media");
        m.setAttribute("content", color);
      });
    } else {
      const meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      meta.setAttribute("content", color);
      document.head.appendChild(meta);
    }

    // 4. Update apple-mobile-web-app-status-bar-style for iOS
    let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!appleMeta) {
      appleMeta = document.createElement("meta");
      appleMeta.setAttribute("name", "apple-mobile-web-app-status-bar-style");
      document.head.appendChild(appleMeta);
    }
    appleMeta.setAttribute("content", isDark ? "black-translucent" : "default");
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
