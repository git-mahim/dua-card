import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "./ThemeProvider";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { DragOnlySlider } from "./DragOnlySlider";
import { exportAllDataToJson, importDataFromJson, clearAllData } from "@/lib/backup";
import { getDuaCount, getAllDuas, getDailyResetTime, setDailyResetTime, restoreDemoDuas } from "@/lib/db";
import { toBengaliNumber, formatResetTimeToBengali, formatBengaliSyncTime } from "@/lib/formatters";
import { triggerHaptic } from "@/lib/haptics";
import {
  subscribeSyncState,
  triggerCloudSync,
  logoutUser,
  SyncState,
} from "@/lib/clientSync";
import { useLanguage } from "@/lib/i18n";
import {
  ArrowLeft,
  Sun,
  Moon,
  Type,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RotateCcw,
  FileJson,
  Eye,
  EyeOff,
  Clock,
  Sparkles,
  Cloud,
  LogOut,
  LogIn,
  RefreshCw,
  UserCheck,
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataImported?: () => void;
  onDataChanged?: () => void;
  totalDuasCount?: number;
  onClearAllData?: () => Promise<void>;
  hideTitleOnHome: boolean;
  onToggleHideTitle: (hide: boolean) => void;
  hideVirtueOnHome: boolean;
  onToggleHideVirtue: (hide: boolean) => void;
  onOpenLogin?: () => void;
}

// Configurable Typography Elements
const FONT_CONFIGS = [
  {
    key: "dua-title" as const,
    label: "দোয়ার শিরোনাম",
    min: 8,
    max: 32,
    defaultSize: 20,
    presets: { s: 16, m: 20, l: 24 },
  },
  {
    key: "dua-pronunciation" as const,
    label: "উচ্চারণ / আরবি",
    min: 8,
    max: 28,
    defaultSize: 17,
    presets: { s: 14, m: 17, l: 20 },
  },
  {
    key: "dua-meaning" as const,
    label: "দোয়ার অনুবাদ",
    min: 8,
    max: 24,
    defaultSize: 13,
    presets: { s: 10, m: 13, l: 16 },
  },
  {
    key: "dua-paragraph" as const,
    label: "শিক্ষা ও সহায়ক নোট",
    min: 8,
    max: 24,
    defaultSize: 12,
    presets: { s: 10, m: 12, l: 15 },
  },
];

type FontSizeState = {
  "dua-title": number;
  "dua-pronunciation": number;
  "dua-meaning": number;
  "dua-paragraph": number;
};

const DEFAULT_FONT_SIZES: FontSizeState = {
  "dua-title": 20,
  "dua-pronunciation": 17,
  "dua-meaning": 13,
  "dua-paragraph": 12,
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onDataImported,
  onDataChanged,
  hideTitleOnHome,
  onToggleHideTitle,
  hideVirtueOnHome,
  onToggleHideVirtue,
  onOpenLogin,
}) => {
  const notifyChange = () => {
    onDataImported?.();
    onDataChanged?.();
  };
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t, formatNumber, formatSyncTime, formatResetTime } = useLanguage();
  const [syncState, setSyncState] = useState<SyncState>({
    status: "unauthenticated",
    lastSyncedAt: null,
    user: null,
  });
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeSyncState((state) => {
      setSyncState(state);
    });
    return () => unsubscribe();
  }, []);
  const [totalDuasCount, setTotalDuasCount] = useState<number>(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showRestoreDemoConfirm, setShowRestoreDemoConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [importPreview, setImportPreview] = useState<{
    count: number;
    filename: string;
    jsonString: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Daily Reset Time State
  const [dailyResetTime, setDailyResetTimeState] = useState<string>("06:00");

  // Font Size state synced with CSS Variables & LocalStorage
  const [fontSizes, setFontSizes] = useState<FontSizeState>(DEFAULT_FONT_SIZES);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("dua_font_sizes");
        if (saved) {
          const parsed = JSON.parse(saved);
          const merged = { ...DEFAULT_FONT_SIZES, ...parsed };
          setFontSizes(merged);
          applyFontSizesToDom(merged);
        }
      } catch (e) {
        console.error("Failed to load saved font sizes", e);
      }
      setDailyResetTimeState(getDailyResetTime());
    }
  }, []);

  const applyFontSizesToDom = (sizes: FontSizeState) => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.style.setProperty("--dua-title-size", `${sizes["dua-title"]}px`);
      root.style.setProperty("--dua-pronunciation-size", `${sizes["dua-pronunciation"]}px`);
      root.style.setProperty("--dua-meaning-size", `${sizes["dua-meaning"]}px`);
      root.style.setProperty("--dua-paragraph-size", `${sizes["dua-paragraph"]}px`);
    }
  };

  const handleUpdateFontSize = (key: keyof FontSizeState, size: number) => {
    triggerHaptic(15);
    const updated = { ...fontSizes, [key]: size };
    setFontSizes(updated);
    applyFontSizesToDom(updated);
    try {
      localStorage.setItem("dua_font_sizes", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save font sizes", e);
    }
  };

  const handleResetFontSizes = () => {
    triggerHaptic(30);
    setFontSizes(DEFAULT_FONT_SIZES);
    applyFontSizesToDom(DEFAULT_FONT_SIZES);
    try {
      localStorage.setItem("dua_font_sizes", JSON.stringify(DEFAULT_FONT_SIZES));
    } catch (e) {
      console.error("Failed to reset font sizes", e);
    }
    showToast("success", "ফন্ট সাইজ ডিফল্টে রিসেট করা হয়েছে");
  };

  const handleUpdateResetTime = (newTime: string) => {
    if (!newTime || !/^\d{2}:\d{2}$/.test(newTime)) return;
    triggerHaptic(30);
    setDailyResetTimeState(newTime);
    setDailyResetTime(newTime);
    showToast(
      "success",
      `দৈনিক আমল রিসেট সময় পরিবর্তন করে ${formatResetTimeToBengali(newTime)} করা হয়েছে`
    );
  };

  useEffect(() => {
    if (isOpen) {
      loadStats();
      setDailyResetTimeState(getDailyResetTime());
    }
  }, [isOpen]);

  const loadStats = async () => {
    try {
      const count = await getDuaCount();
      setTotalDuasCount(count);
    } catch (e) {
      console.error("Failed to load stats", e);
    }
  };

  const showToast = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleExport = async () => {
    try {
      setIsProcessing(true);
      triggerHaptic(40);
      const json = await exportAllDataToJson();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dua-card-backup-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("success", "সম্পূর্ণ ব্যাকআপ ফাইল সফলভাবে ডাউনলোড হয়েছে");
    } catch (err) {
      console.error("Export error:", err);
      showToast("error", "ব্যাকআপ ফাইল তৈরি করতে ব্যর্থ হয়েছে");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        let count = 0;
        if (parsed.duas && Array.isArray(parsed.duas)) {
          count = parsed.duas.length;
        } else if (Array.isArray(parsed)) {
          count = parsed.length;
        } else {
          throw new Error("Invalid backup JSON format");
        }

        setImportPreview({
          count,
          filename: file.name,
          jsonString: text,
        });
      } catch (err) {
        console.error("Import file parse error:", err);
        showToast("error", "অবৈধ ব্যাকআপ ফাইল। সঠিক JSON ফাইল নির্বাচন করুন");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRestoreMerge = async () => {
    if (!importPreview) return;
    try {
      setIsProcessing(true);
      triggerHaptic(50);
      const res = await importDataFromJson(importPreview.jsonString, {
        overwriteExisting: false,
      });
      setImportPreview(null);
      await loadStats();
      notifyChange();
      showToast(
        "success",
        `সফলভাবে ${toBengaliNumber(res.duasImported)} টি নতুন দোয়া ব্যাকআপ থেকে যুক্ত করা হয়েছে`
      );
    } catch (err) {
      console.error("Restore merge error:", err);
      showToast("error", "ডেটা রিস্টোর করতে সমস্যা হয়েছে");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreReplace = async () => {
    if (!importPreview) return;
    try {
      setIsProcessing(true);
      triggerHaptic(50);
      const res = await importDataFromJson(importPreview.jsonString, {
        overwriteExisting: true,
      });
      setImportPreview(null);
      await loadStats();
      notifyChange();
      showToast(
        "success",
        `পুরনো ডেটা প্রতিস্থাপন করে ${toBengaliNumber(res.duasImported)} টি দোয়া রিস্টোর করা হয়েছে`
      );
    } catch (err) {
      console.error("Restore replace error:", err);
      showToast("error", "ডেটা প্রতিস্থাপন করতে সমস্যা হয়েছে");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmClearAll = async () => {
    try {
      setIsProcessing(true);
      triggerHaptic(60);
      await clearAllData();
      setShowClearConfirm(false);
      await loadStats();
      notifyChange();
      showToast("success", "সকল সংরক্ষিত দোয়ার ডেটা সফলভাবে মুছে ফেলা হয়েছে");
    } catch (err) {
      console.error("Clear all error:", err);
      showToast("error", "ডেটা মুছে ফেলতে সমস্যা হয়েছে");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmRestoreDemo = async () => {
    try {
      setIsProcessing(true);
      triggerHaptic(50);
      const restored = await restoreDemoDuas();
      setShowRestoreDemoConfirm(false);
      await loadStats();
      notifyChange();
      showToast(
        "success",
        `সফলভাবে ${toBengaliNumber(restored.length)} টি ডিফল্ট দোয়া রিস্টোর করা হয়েছে`
      );
    } catch (err) {
      console.error("Restore demo error:", err);
      showToast("error", "ডিফল্ট দোয়া রিস্টোর করতে সমস্যা হয়েছে");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSync = async () => {
    try {
      setIsProcessing(true);
      triggerHaptic(40);
      const res = await triggerCloudSync();
      if (res.success) {
        await loadStats();
        notifyChange();
        showToast("success", "ক্লাউডের সাথে সকল ডেটা সফলভাবে সিঙ্ক হয়েছে");
      } else {
        showToast("error", res.error || "সিঙ্ক করতে ব্যর্থ হয়েছে");
      }
    } catch (e) {
      showToast("error", "ক্লাউড সিঙ্ক করতে সমস্যা হয়েছে");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsProcessing(true);
      triggerHaptic(30);
      await logoutUser();
      showToast("success", "সফলভাবে লগআউট হয়েছে");
    } catch (e) {
      showToast("error", "লগআউট করতে সমস্যা হয়েছে");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      className="fixed inset-0 z-50 flex flex-col bg-background text-foreground animate-in fade-in duration-150 overflow-y-auto font-bengali"
    >
      {/* Top Header / Navigation Bar */}
      <header className="sticky top-0 z-10 w-full bg-white/85 dark:bg-[#121212]/85 backdrop-blur-xl border-b border-zinc-200/60 dark:border-zinc-800/60 px-4 py-3 flex items-center justify-between max-w-md mx-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label={language === "bn" ? "ফিরে যান" : "Go Back"}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all active:scale-95 shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1
          id="settings-title"
          className="text-base font-bold text-zinc-900 dark:text-zinc-50"
        >
          {t("settingsModalTitle")}
        </h1>

        <div className="w-9 h-9" />
      </header>

      {/* Main Settings Page Container */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-4 pb-24 flex flex-col gap-5">
        {/* Toast Alert */}
        {notification && (
          <div
            role="status"
            aria-live="polite"
            className={`p-3.5 rounded-[14px] text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-1 ${
              notification.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Google User Profile & Cloud Auto-Sync (Positioned at TOP) */}
        <div className="p-4 bg-white dark:bg-[#181818] border border-zinc-200/80 dark:border-zinc-800 rounded-[22px] shadow-2xs flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              {t("googleProfileTitle")}
            </span>
            {syncState.user && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t("connected")}
              </span>
            )}
          </div>

          {syncState.user ? (
            <div className="flex flex-col gap-3">
              {/* User Profile Card */}
              <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/80 rounded-[18px] border border-zinc-200/60 dark:border-zinc-800 flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full bg-[#ffb31a]/20 text-[#c87d00] dark:text-[#ffb31a] font-bold text-base flex items-center justify-center border border-[#ffb31a]/30 shadow-xs">
                    {syncState.user.email ? syncState.user.email.charAt(0).toUpperCase() : <Cloud className="w-5 h-5" />}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate font-mono">
                    {syncState.user.email}
                  </h4>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 truncate mt-0.5 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                    <span>{language === "bn" ? "অটো-সিঙ্ক সক্রিয়" : "Auto-sync active"}</span>
                  </p>
                </div>
              </div>

              {/* Last Sync Timestamp Record */}
              <div className="px-3 py-2 bg-amber-500/[0.06] dark:bg-amber-400/[0.06] rounded-[14px] border border-[#ffb31a]/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                  <Clock className="w-3.5 h-3.5 text-[#ffb31a] shrink-0" />
                  <span className="text-[11px]">{t("lastSynced")}</span>
                </div>
                <span className="text-xs font-bold text-zinc-900 dark:text-[#ffb31a]">
                  {formatSyncTime(syncState.lastSyncedAt)}
                </span>
              </div>

              {/* Sync Actions */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400">
                  <span className={`w-2 h-2 rounded-full ${
                    syncState.status === "syncing"
                      ? "bg-[#ffb31a] animate-pulse"
                      : "bg-emerald-500"
                  }`} />
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    {syncState.status === "syncing" ? (language === "bn" ? "সিঙ্ক হচ্ছে..." : "Syncing...") : (language === "bn" ? "ক্লাউড নিরাপদ" : "Cloud Secure")}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={isProcessing || syncState.status === "syncing"}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ffb31a] hover:bg-[#e69c05] text-zinc-950 rounded-[11px] text-xs font-bold transition-all active:scale-95 shadow-2xs disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${syncState.status === "syncing" ? "animate-spin" : ""}`} />
                    <span>{t("syncNow")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isProcessing}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-zinc-600 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 rounded-[11px] text-xs font-medium transition-all active:scale-95"
                    title={t("logout")}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t("logout")}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {t("googleAuthDesc")}
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLogin?.();
                }}
                className="w-full min-h-[44px] py-2 px-3.5 bg-[#ffb31a]/15 hover:bg-[#ffb31a]/25 text-zinc-950 dark:text-[#ffb31a] font-bold text-xs rounded-[14px] border border-[#ffb31a]/40 shadow-2xs flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                <Cloud className="w-4 h-4 text-[#ffb31a] shrink-0" />
                <span>{t("signInWithGoogle")}</span>
              </button>
            </div>
          )}
        </div>

        {/* Daily Reset Time Configuration */}
        <div className="p-4 bg-white dark:bg-[#181818] border border-zinc-200/80 dark:border-zinc-800 rounded-[20px] shadow-2xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[11px] bg-[#ffb31a]/15 text-[#c87d00] dark:text-[#ffb31a] flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                  {t("dailyResetTitle")}
                </label>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">
                  {t("dailyResetSub")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                নির্ধারিত সময়:
              </span>
              <span className="text-xs font-bold text-[#c87d00] dark:text-[#ffb31a] bg-[#ffb31a]/10 px-2.5 py-1 rounded-[8px] border border-[#ffb31a]/25">
                {formatResetTimeToBengali(dailyResetTime)}
              </span>
            </div>

            {/* Native Time Picker Input */}
            <div className="relative">
              <input
                type="time"
                value={dailyResetTime}
                onChange={(e) => handleUpdateResetTime(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-mono font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-[10px] cursor-pointer outline-none focus:ring-2 focus:ring-[#ffb31a]/40 transition-all"
                title="রিসেট সময় পরিবর্তন করুন"
              />
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {[
              { label: "সকাল ০৬:০০", value: "06:00" },
              { label: "সকাল ০৯:০০", value: "09:00" },
              { label: "রাত ১২:০০", value: "00:00" },
            ].map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => handleUpdateResetTime(preset.value)}
                className={`py-1.5 px-2 rounded-[10px] text-[11px] font-bold transition-all active:scale-95 ${
                  dailyResetTime === preset.value
                    ? "bg-[#ffb31a] text-zinc-950 shadow-xs"
                    : "bg-zinc-100 dark:bg-zinc-800/70 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200/60 dark:border-zinc-800/60"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Card Display Preferences */}
        {/* Hide Title on Home Toggle */}
        <div className="p-4 bg-white dark:bg-[#181818] border border-zinc-200/80 dark:border-zinc-800 rounded-[20px] shadow-2xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-[11px] bg-[#ffb31a]/15 text-[#c87d00] dark:text-[#ffb31a] flex items-center justify-center shrink-0">
                {hideTitleOnHome ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <label
                  htmlFor="hide-title-toggle"
                  className="text-xs font-bold text-zinc-900 dark:text-zinc-100 cursor-pointer block truncate"
                >
                  {t("hideTitleOnHomeLabel")}
                </label>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">
                  {t("hideTitleOnHomeSub")}
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              id="hide-title-toggle"
              type="button"
              role="switch"
              aria-checked={hideTitleOnHome}
              onClick={() => onToggleHideTitle(!hideTitleOnHome)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                hideTitleOnHome ? "bg-[#ffb31a]" : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  hideTitleOnHome ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Compact View Toggle */}
        <div className="p-4 bg-white dark:bg-[#181818] border border-zinc-200/80 dark:border-zinc-800 rounded-[20px] shadow-2xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-[11px] bg-[#ffb31a]/15 text-[#c87d00] dark:text-[#ffb31a] flex items-center justify-center shrink-0">
                {hideVirtueOnHome ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <label
                  htmlFor="hide-virtue-toggle"
                  className="text-xs font-bold text-zinc-900 dark:text-zinc-100 cursor-pointer block truncate"
                >
                  {t("hideVirtueOnHomeLabel")}
                </label>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">
                  {t("hideVirtueOnHomeSub")}
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              id="hide-virtue-toggle"
              type="button"
              role="switch"
              aria-checked={hideVirtueOnHome}
              onClick={() => onToggleHideVirtue(!hideVirtueOnHome)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                hideVirtueOnHome ? "bg-[#ffb31a]" : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  hideVirtueOnHome ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Theme Preferences */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {t("themeSetting")}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`min-h-[44px] flex items-center justify-center gap-2 p-2.5 rounded-[12px] text-xs font-medium border transition-all ${
                theme === "light"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-xs font-bold"
                  : "bg-white dark:bg-[#181818] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-[#ffb31a]" />
              <span>{t("lightMode")}</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`min-h-[44px] flex items-center justify-center gap-2 p-2.5 rounded-[12px] text-xs font-medium border transition-all ${
                theme === "dark"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-xs font-bold"
                  : "bg-white dark:bg-[#181818] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>{t("darkMode")}</span>
            </button>
          </div>
        </div>

        {/* Language Preferences (Right below Theme Preferences as requested) */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {t("languageSetting")}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setLanguage("bn")}
              className={`min-h-[44px] flex items-center justify-center gap-2 p-2.5 rounded-[12px] text-xs font-medium border transition-all ${
                language === "bn"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-xs font-bold"
                  : "bg-white dark:bg-[#181818] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <span className="text-sm font-bold text-[#ffb31a]">অ</span>
              <span>বাংলা (Bengali)</span>
            </button>
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`min-h-[44px] flex items-center justify-center gap-2 p-2.5 rounded-[12px] text-xs font-medium border transition-all ${
                language === "en"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-xs font-bold"
                  : "bg-white dark:bg-[#181818] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <span className="text-sm font-bold text-[#ffb31a]">EN</span>
              <span>English</span>
            </button>
          </div>
        </div>

        {/* Font & Size Preferences */}
        <div className="flex flex-col gap-2.5 p-4 bg-white dark:bg-[#181818] border border-zinc-200/80 dark:border-zinc-800 rounded-[20px] shadow-2xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-[#ffb31a]" />
              <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {t("typographyTitle")}
              </label>
            </div>
            <button
              type="button"
              onClick={handleResetFontSizes}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-[10px] text-[11px] font-bold transition-all active:scale-95 border border-zinc-200 dark:border-zinc-700/80 shadow-2xs"
              title={t("defaultReset")}
            >
              <RotateCcw className="w-3 h-3 text-[#ffb31a]" />
              <span>{t("defaultReset")}</span>
            </button>
          </div>

          <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {[
              {
                key: "dua-title" as const,
                label: t("duaTitleFont"),
                min: 8,
                max: 32,
                presets: { s: 16, m: 19, l: 24 },
              },
              {
                key: "dua-pronunciation" as const,
                label: t("duaArabicFont"),
                min: 8,
                max: 28,
                presets: { s: 14, m: 17, l: 20 },
              },
              {
                key: "dua-meaning" as const,
                label: t("duaMeaningFont"),
                min: 8,
                max: 24,
                presets: { s: 10, m: 13, l: 16 },
              },
              {
                key: "dua-paragraph" as const,
                label: t("duaVirtueFont"),
                min: 8,
                max: 24,
                presets: { s: 10, m: 12, l: 15 },
              },
            ].map((item) => {
              const currentSize = fontSizes[item.key];
              return (
                <div key={item.key} className="flex flex-col gap-1.5 py-2.5 first:pt-1 last:pb-0">
                  {/* Top Row: Element Label, Pixel Counter, S M L Buttons */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {item.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400">
                        {formatNumber(currentSize)}px
                      </span>
                      {/* S M L Preset Buttons */}
                      <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-[10px] p-0.5 border border-zinc-200/80 dark:border-zinc-700/80">
                        {(["s", "m", "l"] as const).map((preset) => {
                          const presetVal = item.presets[preset];
                          const isActive = currentSize === presetVal;
                          return (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handleUpdateFontSize(item.key, presetVal)}
                              className={`px-2 py-0.5 rounded-[8px] text-[10px] font-extrabold uppercase transition-all ${
                                isActive
                                  ? "bg-[#ffb31a] text-zinc-950 shadow-xs scale-105"
                                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100"
                              }`}
                            >
                              {preset}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Drag-Only Slider */}
                  <div className="pt-0.5">
                    <DragOnlySlider
                      min={item.min}
                      max={item.max}
                      step={1}
                      value={currentSize}
                      onChange={(newVal) => handleUpdateFontSize(item.key, newVal)}
                      label={item.label}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Manual Backup and Restore */}
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {t("manualBackupTitle")}
            </label>
            <span className="text-[11px] text-zinc-400">
              {t("totalSaved")} {formatNumber(totalDuasCount)} {t("itemsSuffix")}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Export Button */}
            <button
              type="button"
              onClick={handleExport}
              disabled={isProcessing || totalDuasCount === 0}
              className="min-h-[44px] flex items-center justify-center gap-2 p-2.5 bg-white dark:bg-[#181818] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-[12px] text-xs font-medium border border-zinc-200/80 dark:border-zinc-800 transition-colors disabled:opacity-40 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t("exportBackup")}</span>
            </button>

            {/* Import Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="min-h-[44px] flex items-center justify-center gap-2 p-2.5 bg-white dark:bg-[#181818] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-[12px] text-xs font-medium border border-zinc-200/80 dark:border-zinc-800 transition-colors disabled:opacity-40 shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{t("importBackup")}</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Import Preview Confirmation Dialog */}
        {importPreview && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-[20px] flex flex-col gap-2.5 animate-in fade-in">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <FileJson className="w-4 h-4 shrink-0" />
              <span className="text-xs font-bold">
                {language === "bn" ? `ব্যাকআপ প্রিভিউ: ${importPreview.filename}` : `Backup Preview: ${importPreview.filename}`}
              </span>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
              {language === "bn"
                ? `ফাইলে মোট ${formatNumber(importPreview.count)} টি দোয়ার তথ্য পাওয়া গেছে। আপনি কীভাবে ডেটা রিস্টোর করতে চান?`
                : `Found ${formatNumber(importPreview.count)} duas in this backup file. How would you like to restore?`}
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleRestoreMerge}
                disabled={isProcessing}
                className="min-h-[44px] py-1.5 px-2 bg-[#ffb31a] hover:bg-[#e69c05] text-zinc-950 font-bold text-xs rounded-[12px] shadow-xs transition-colors"
              >
                {language === "bn" ? "যুক্ত করুন (Merge)" : "Merge (Add)"}
              </button>
              <button
                type="button"
                onClick={handleRestoreReplace}
                disabled={isProcessing}
                className="min-h-[44px] py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-[12px] shadow-xs transition-colors"
              >
                {language === "bn" ? "প্রতিস্থাপন (Replace)" : "Replace (Overwrite)"}
              </button>
              <button
                type="button"
                onClick={() => setImportPreview(null)}
                className="col-span-2 py-1.5 px-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-xs"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        )}

        {/* Reset & Default Duas Actions */}
        <div className="flex flex-col gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {language === "bn" ? "রিসেট ও ডিফল্ট ডেটা" : "Reset & Core Duas"}
          </label>

          {/* Restore Demo Duas */}
          <button
            type="button"
            onClick={() => setShowRestoreDemoConfirm(true)}
            disabled={isProcessing}
            className="min-h-[44px] w-full flex items-center justify-center gap-2 p-2.5 rounded-[12px] border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#c87d00] dark:text-[#ffb31a]" />
            <span>{t("restoreDefaultDuas")}</span>
          </button>

          {/* Clear All Duas */}
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            disabled={isProcessing || totalDuasCount === 0}
            className="min-h-[44px] w-full flex items-center justify-center gap-2 p-2.5 rounded-[12px] border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-medium hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t("clearAllData")}</span>
          </button>
        </div>

        {/* Privacy Note */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 rounded-[20px] text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-[#ffb31a] shrink-0 mt-0.5" />
          <span>
            {language === "bn"
              ? "আপনার সকল দোয়ার তথ্য সম্পূর্ণভাবে আপনার এই ডিভাইসের IndexedDB-তে সংরক্ষিত থাকে। কোনো রিমোট সার্ভারে ডেটা পাঠানো হয় না। নিয়মিত ব্যাকআপ ডাউনলোড করে রাখুন।"
              : "All your dua records are securely stored locally in your browser's IndexedDB. Automatic Google sync keeps them backed up."}
          </span>
        </div>
      </main>

      {/* Restore Demo Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showRestoreDemoConfirm}
        title={language === "bn" ? "ডিফল্ট দোয়া ফিরিয়ে আনবেন?" : "Restore Default Duas?"}
        description={language === "bn" ? "আপনার বর্তমান দোয়ার তালিকা প্রতিস্থাপিত হয়ে মূল ২৫টি ইসলামিক ডিফল্ট দোয়া যুক্ত হবে।" : "Your current dua list will be restored with the 25 core authentic Islamic duas."}
        confirmLabel={language === "bn" ? "হ্যাঁ, ফিরিয়ে আনুন" : "Yes, Restore"}
        cancelLabel={t("cancel")}
        onConfirm={handleConfirmRestoreDemo}
        onCancel={() => setShowRestoreDemoConfirm(false)}
        isDestructive={false}
      />

      {/* Clear All Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showClearConfirm}
        title={t("confirmClearAllTitle")}
        description={t("confirmClearAllDesc")}
        confirmLabel={language === "bn" ? "হ্যাঁ, মুছে ফেলুন" : "Yes, Clear All"}
        cancelLabel={t("cancel")}
        onConfirm={handleConfirmClearAll}
        onCancel={() => setShowClearConfirm(false)}
        isDestructive={true}
      />
    </div>
  );
};
