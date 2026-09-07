"use client";

import React, { useState, useEffect } from "react";
import { Settings, Moon, Sun, Sunrise, Sunset, Cloud, RefreshCw } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { OfflineBadge } from "./OfflineBadge";
import { subscribeSyncState, SyncState } from "@/lib/clientSync";
import { useLanguage } from "@/lib/i18n";

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenLogin?: () => void;
}

type TimeSlot = "morning" | "noon" | "evening" | "night";

interface GreetingInfo {
  bn: string;
  en: string;
  slot: TimeSlot;
}

function getDynamicGreeting(): GreetingInfo {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 12) {
    return { bn: "সকালের আমল", en: "Morning Dhikr", slot: "morning" };
  } else if (hour >= 12 && hour < 16) {
    return { bn: "দুপুরের আমল", en: "Noon Dhikr", slot: "noon" };
  } else if (hour >= 16 && hour < 19) {
    return { bn: "সান্ধ্য আমল", en: "Evening Dhikr", slot: "evening" };
  } else {
    return { bn: "রাতের আমল", en: "Night Dhikr", slot: "night" };
  }
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenLogin,
}) => {
  const { theme, setTheme } = useTheme();
  const { language, t } = useLanguage();
  const [greeting, setGreeting] = useState<GreetingInfo>({
    bn: "সকালের আমল",
    en: "Morning Dhikr",
    slot: "morning",
  });
  const [syncState, setSyncState] = useState<SyncState>({
    status: "unauthenticated",
    lastSyncedAt: null,
    user: null,
  });

  useEffect(() => {
    const unsubscribe = subscribeSyncState((state) => {
      setSyncState(state);
    });
    return () => unsubscribe();
  }, []);

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

  const handleCloudClick = () => {
    onOpenLogin?.();
  };

  const displayGreeting = language === "bn" ? greeting.bn : greeting.en;

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
              <h1 className="text-[16px] sm:text-[17px] font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
                {displayGreeting}
              </h1>
              <OfflineBadge />
            </div>
          </div>

          {/* Action Buttons Group */}
          <div className="flex items-center gap-1">
            {/* Cloud Sync Status / Login Button */}
            <button
              type="button"
              onClick={handleCloudClick}
              aria-label={
                syncState.user
                  ? `Cloud Sync: ${syncState.status === "syncing" ? "Syncing" : "Synced"}`
                  : "Cloud Login"
              }
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                syncState.status === "syncing"
                  ? "text-[#c87d00] dark:text-[#ffb31a] bg-[#ffb31a]/15 animate-pulse"
                  : syncState.user
                  ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
              }`}
              title={
                syncState.user
                  ? `${language === "bn" ? "ক্লাউডে সিঙ্ক করা আছে" : "Synced with Cloud"} (${syncState.user.email})`
                  : language === "bn" ? "ক্লাউড ব্যাকআপ চালু করতে লগইন করুন" : "Sign in to enable cloud backup"
              }
            >
              {syncState.status === "syncing" ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#c87d00] dark:text-[#ffb31a]" />
              ) : syncState.user ? (
                <div className="relative">
                  <Cloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute -top-0.5 -right-0.5 ring-2 ring-white dark:ring-[#121212]" />
                </div>
              ) : (
                <Cloud className="w-4 h-4" />
              )}
            </button>

            {/* Direct Light / Dark Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Theme: ${theme === "dark" ? "Dark" : "Light"}`}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all active:scale-95"
              title={theme === "dark" ? t("lightMode") : t("darkMode")}
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
              aria-label={t("settingsTitle")}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all active:scale-95"
              title={t("settingsTitle")}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
