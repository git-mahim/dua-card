"use client";

import React, { useState, useEffect } from "react";
import { Search, Settings, Moon, Sun, Sunrise, Sunset } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { OfflineBadge } from "./OfflineBadge";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSearchOpen: boolean;
  onToggleSearch: () => void;
  onOpenSettings: () => void;
}

type TimeSlot = "morning" | "noon" | "evening" | "night";

interface GreetingInfo {
  title: string;
  slot: TimeSlot;
}

function getDynamicGreeting(): GreetingInfo {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 12) {
    return { title: "সকালের আমল", slot: "morning" };
  } else if (hour >= 12 && hour < 16) {
    return { title: "দুপুরের আমল", slot: "noon" };
  } else if (hour >= 16 && hour < 19) {
    return { title: "সান্ধ্য আমল", slot: "evening" };
  } else {
    return { title: "রাতের আমল", slot: "night" };
  }
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  isSearchOpen,
  onToggleSearch,
  onOpenSettings,
}) => {
  const { theme, setTheme } = useTheme();
  const [greeting, setGreeting] = useState<GreetingInfo>({
    title: "সকালের আমল",
    slot: "morning",
  });

  useEffect(() => {
    setGreeting(getDynamicGreeting());

    // Update greeting every 5 minutes if app stays open across time slots
    const interval = setInterval(() => {
      setGreeting(getDynamicGreeting());
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/85 dark:bg-[#121212]/85 backdrop-blur-xl border-b border-zinc-200/60 dark:border-zinc-800/60 px-4 py-3 transition-colors duration-200">
      <div className="max-w-md mx-auto flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          {/* Header Title: Dynamic Time-Aware Greeting */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[11px] bg-[#ffb31a]/15 text-[#c87d00] dark:text-[#ffb31a] flex items-center justify-center shrink-0 shadow-2xs">
              {greeting.slot === "morning" && (
                <Sunrise className="w-4 h-4 text-[#ffb31a]" />
              )}
              {greeting.slot === "noon" && (
                <Sun className="w-4 h-4 text-[#ffb31a]" />
              )}
              {greeting.slot === "evening" && (
                <Sunset className="w-4 h-4 text-orange-500" />
              )}
              {greeting.slot === "night" && (
                <Moon className="w-4 h-4 text-[#ffb31a]" />
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <h1 className="text-[16px] sm:text-[17px] font-extrabold font-bengali tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
                {greeting.title}
              </h1>
              <OfflineBadge />
            </div>
          </div>

          {/* Action Buttons Group */}
          <div className="flex items-center gap-1">
            {/* Search Toggle Button */}
            <button
              type="button"
              onClick={onToggleSearch}
              aria-label="অনুসন্ধান"
              aria-expanded={isSearchOpen}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all active:scale-95 ${
                isSearchOpen ? "bg-[#ffb31a]/15 text-[#c87d00] dark:text-[#ffb31a]" : ""
              }`}
              title="খুঁজুন"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Direct Light / Dark Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`বর্তমান থিম: ${theme === "dark" ? "ডার্ক মোড" : "লাইট মোড"}`}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all active:scale-95"
              title={theme === "dark" ? "লাইট মোড চালু করুন" : "ডার্ক মোড চালু করুন"}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-[#ffb31a]" />
              ) : (
                <Moon className="w-4 h-4 text-zinc-700" />
              )}
            </button>

            {/* Settings Button */}
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="সেটিংস ও ব্যাকআপ"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all active:scale-95"
              title="সেটিংস"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Field Bar (Smooth animated expand) */}
        {isSearchOpen && (
          <div className="relative w-full animate-in fade-in slide-in-from-top-2 duration-150">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="শিরোনাম, উচ্চারণ, অনুবাদ বা নোট দিয়ে খুঁজুন..."
              autoFocus
              className="w-full h-10 pl-9 pr-8 text-xs font-bengali bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#ffb31a]/40 focus:border-[#ffb31a] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 px-1 font-bengali"
              >
                মুছুন
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
