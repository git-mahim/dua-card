"use client";

import React, { useState, useEffect } from "react";
import { Search, Settings, Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { OfflineBadge } from "./OfflineBadge";
import { getBengaliTodayFormatted } from "@/lib/formatters";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSearchOpen: boolean;
  onToggleSearch: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  isSearchOpen,
  onToggleSearch,
  onOpenSettings,
}) => {
  const { theme, setTheme } = useTheme();
  const [todayText, setTodayText] = useState<string>("২৬শে আগস্ট, ২০২৬");

  useEffect(() => {
    setTodayText(getBengaliTodayFormatted(true));
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-background/90 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 px-4 py-3 transition-colors duration-200">
      <div className="max-w-md mx-auto flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          {/* Header Title: Today's Date in Bengali */}
          <div className="flex items-center gap-2">
            <h1 className="text-[16px] sm:text-lg font-bold font-bengali tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>{todayText}</span>
            </h1>
            <OfflineBadge />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {/* Search Toggle Button */}
            <button
              type="button"
              onClick={onToggleSearch}
              aria-label="অনুসন্ধান"
              aria-expanded={isSearchOpen}
              className={`p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors ${
                isSearchOpen ? "bg-zinc-100 dark:bg-zinc-800 text-[#ffb31a]" : ""
              }`}
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Direct Light / Dark Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`বর্তমান থিম: ${theme === "dark" ? "ডার্ক মোড" : "লাইট মোড"}`}
              className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
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
              className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Field Bar (Visible when toggled or search query exists) */}
        {isSearchOpen && (
          <div className="relative w-full animate-in fade-in slide-in-from-top-1 duration-150">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="শিরোনাম, উচ্চারণ, অনুবাদ বা নোট দিয়ে খুঁজুন..."
              autoFocus
              className="w-full h-10 pl-9 pr-8 text-xs font-bengali bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 px-1 font-bengali"
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
