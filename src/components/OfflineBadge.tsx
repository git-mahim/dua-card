"use client";

import React, { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export const OfflineBadge: React.FC = () => {
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
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium font-bengali shrink-0 animate-pulse"
      title="ইন্টারনেট সংযোগ নেই - অফলাইনে কাজ করছে"
    >
      <WifiOff className="w-3.5 h-3.5" />
      <span>অফলাইন</span>
    </div>
  );
};
