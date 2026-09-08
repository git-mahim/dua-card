"use client";

import React, { useState, useEffect } from "react";
import { Settings, Moon, Sun, Cloud, RefreshCw, BarChart3, Sparkles } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { OfflineBadge } from "./OfflineBadge";
import { subscribeSyncState, getSyncState, SyncState } from "@/lib/clientSync";
import { useLanguage } from "@/lib/i18n";
import { triggerHaptic } from "@/lib/haptics";
import { formatBengaliDate } from "@/lib/formatters";

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenLogin?: () => void;
  onOpenAnalyticsSheet?: () => void;
}

function getFormattedHeaderDate(lang: string): string {
  const now = new Date();
  if (lang === "bn") {
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    return formatBengaliDate(dateStr, false);
  }
  return now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenLogin,
  onOpenAnalyticsSheet,
}) => {
  const { theme, setTheme } = useTheme();
  const { language, t } = useLanguage();
  const [formattedDate, setFormattedDate] = useState<string>("");
  const [syncState, setSyncState] = useState<SyncState>(getSyncState());

  useEffect(() => {
    const unsubscribe = subscribeSyncState((state) => {
      setSyncState(state);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setFormattedDate(getFormattedHeaderDate(language));
  }, [language]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleCloudClick = () => {
    onOpenLogin?.();
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/85 dark:bg-[#121212]/85 backdrop-blur-xl border-b border-zinc-200/60 dark:border-zinc-800/60 px-4 py-3 transition-colors duration-200">
      <div className="max-w-md mx-auto flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          {/* Header Title: Assalamu Alaikum Greeting & Localized Date */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[12px] bg-[#ffb31a]/15 text-[#c87d00] dark:text-[#ffb31a] flex items-center justify-center shrink-0 shadow-2xs">
              <Sparkles className="w-4 h-4 text-[#ffb31a]" />
            </div>

            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-[15px] sm:text-[16px] font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
                  {language === "bn" ? "আসসালামু আলাইকুম" : "Assalamu Alaikum"}
                </h1>
                <OfflineBadge />
              </div>
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5 leading-none truncate">
                {formattedDate}
              </span>
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
                  ? `Cloud: ${syncState.status === "syncing" || syncState.status === "restoring" ? "Processing" : "Connected"}`
                  : "Cloud Login"
              }
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                syncState.status === "syncing" || syncState.status === "restoring"
                  ? "text-[#c87d00] dark:text-[#ffb31a] bg-[#ffb31a]/15 animate-pulse"
                  : syncState.user
                  ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
              }`}
              title={
                syncState.user
                  ? `${language === "bn" ? "ক্লাউড অ্যাকাউন্ট সংযুক্ত" : "Cloud Account Connected"} (${syncState.user.email})`
                  : language === "bn" ? "ক্লাউড ব্যাকআপ চালু করতে লগইন করুন" : "Sign in to enable cloud backup"
              }
            >
              {syncState.status === "syncing" || syncState.status === "restoring" ? (
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

            {/* Analytics Sheet Button */}
            {onOpenAnalyticsSheet && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(25);
                  onOpenAnalyticsSheet();
                }}
                aria-label={language === "bn" ? "আমল শিট ও গ্রাফ" : "Analytics Sheet"}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-[#c87d00] dark:hover:text-[#ffb31a] hover:bg-[#ffb31a]/10 transition-all active:scale-95"
                title={language === "bn" ? "আমল শিট ও এক্সেল এক্সপোর্ট" : "Analytics Sheet & Excel Export"}
              >
                <BarChart3 className="w-4 h-4 text-[#c87d00] dark:text-[#ffb31a]" />
              </button>
            )}

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
