"use client";

import React, { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export const OfflineBadge: React.FC = () => {
  const { language } = useLanguage();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    setIsOffline(!navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="h-9 px-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold inline-flex items-center gap-1.5 shrink-0 animate-pulse transition-all shadow-2xs"
      title={language === "bn" ? "ইন্টারনেট সংযোগ নেই - অফলাইন মোড চালু" : "Offline mode active"}
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 stroke-[2.2]" />
      <span>{language === "bn" ? "অফলাইন" : "Offline"}</span>
    </div>
  );
};
