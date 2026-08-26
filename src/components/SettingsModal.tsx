"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "./ThemeProvider";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { exportAllDataToJson, importDataFromJson, clearAllData } from "@/lib/backup";
import { getDuaCount, getAllDuas, getDailyResetTime, setDailyResetTime } from "@/lib/db";
import { toBengaliNumber, formatResetTimeToBengali } from "@/lib/formatters";
import { triggerHaptic } from "@/lib/haptics";
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
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataImported: () => void;
  hideVirtueOnHome: boolean;
  onToggleHideVirtue: (hide: boolean) => void;
}

// Configurable Typography Elements
const FONT_CONFIGS = [
  {
    key: "dua-title" as const,
    label: "দোয়ার শিরোনাম",
    min: 16,
    max: 32,
    defaultSize: 20,
    presets: { s: 18, m: 20, l: 24 },
  },
  {
    key: "dua-pronunciation" as const,
    label: "উচ্চারণ / আরবি",
    min: 14,
    max: 28,
    defaultSize: 17,
    presets: { s: 15, m: 17, l: 20 },
  },
  {
    key: "dua-meaning" as const,
    label: "দোয়ার অনুবাদ",
    min: 13,
    max: 24,
    defaultSize: 15,
    presets: { s: 14, m: 15, l: 18 },
  },
  {
    key: "dua-paragraph" as const,
    label: "শিক্ষা ও সহায়ক নোট",
    min: 13,
    max: 24,
    defaultSize: 15,
    presets: { s: 14, m: 15, l: 18 },
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
  "dua-meaning": 15,
  "dua-paragraph": 15,
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onDataImported,
  hideVirtueOnHome,
  onToggleHideVirtue,
}) => {
  const { theme, setTheme } = useTheme();
  const [totalDuasCount, setTotalDuasCount] = useState<number>(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
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
      onDataImported();
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
      onDataImported();
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
      onDataImported();
      showToast("success", "সকল সংরক্ষিত দোয়ার ডেটা সফলভাবে মুছে ফেলা হয়েছে");
    } catch (err) {
      console.error("Clear all error:", err);
      showToast("error", "ডেটা মুছে ফেলতে সমস্যা হয়েছে");
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
          aria-label="ফিরে যান"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all active:scale-95 shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1
          id="settings-title"
          className="text-base font-bold font-bengali text-zinc-900 dark:text-zinc-50"
        >
          সেটিংস ও ব্যাকআপ
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

        {/* Daily Reset Time Configuration */}
        <div className="p-4 bg-white dark:bg-[#181818] border border-zinc-200/80 dark:border-zinc-800 rounded-[20px] shadow-2xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[11px] bg-[#ffb31a]/15 text-[#c87d00] dark:text-[#ffb31a] flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                  দৈনিক আমল রিসেট সময়
                </label>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">
                  প্রতিদিন এই সময়ে দোয়ার স্ট্যাটাস আবার নতুন দিনের জন্য রিসেট হবে
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
                  কমপ্যাক্ট কার্ড ভিউ
                </label>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">
                  হোম কার্ডে বাড়তি বিবরণ লুকিয়ে রাখুন
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
            থিম নির্বাচন
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
              <span>লাইট মোড</span>
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
              <span>ডার্ক মোড</span>
            </button>
          </div>
        </div>

        {/* Font & Size Preferences */}
        <div className="flex flex-col gap-2.5 p-4 bg-white dark:bg-[#181818] border border-zinc-200/80 dark:border-zinc-800 rounded-[20px] shadow-2xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-[#ffb31a]" />
              <label className="text-xs font-bold font-bengali text-zinc-900 dark:text-zinc-100">
                ফন্ট ও সাইজ
              </label>
            </div>
            <button
              type="button"
              onClick={handleResetFontSizes}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-[10px] text-[11px] font-bold font-bengali transition-all active:scale-95 border border-zinc-200 dark:border-zinc-700/80 shadow-2xs"
              title="ডিফল্ট ফন্ট সাইজে ফিরে যান"
            >
              <RotateCcw className="w-3 h-3 text-[#ffb31a]" />
              <span>ডিফল্ট রিসেট</span>
            </button>
          </div>

          <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {FONT_CONFIGS.map((item) => {
              const currentSize = fontSizes[item.key];
              return (
                <div key={item.key} className="flex flex-col gap-1.5 py-2.5 first:pt-1 last:pb-0">
                  {/* Top Row: Element Label, Pixel Counter, S M L Buttons */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold font-bengali text-zinc-800 dark:text-zinc-200">
                      {item.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400">
                        {toBengaliNumber(currentSize)}px
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

                  {/* Bottom Row: Smooth Slider */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <input
                      type="range"
                      min={item.min}
                      max={item.max}
                      step="1"
                      value={currentSize}
                      onChange={(e) =>
                        handleUpdateFontSize(item.key, parseInt(e.target.value, 10))
                      }
                      className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#ffb31a]"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Backup and Restore */}
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              ব্যাকআপ ও রিস্টোর
            </label>
            <span className="text-[11px] text-zinc-400">
              সংরক্ষিত: {toBengaliNumber(totalDuasCount)} টি
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
              <span>ব্যাকআপ এক্সপোর্ট</span>
            </button>

            {/* Import Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="min-h-[44px] flex items-center justify-center gap-2 p-2.5 bg-white dark:bg-[#181818] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-[12px] text-xs font-medium border border-zinc-200/80 dark:border-zinc-800 transition-colors disabled:opacity-40 shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>ব্যাকআপ রিস্টোর</span>
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
              <span className="text-xs font-bold font-bengali">
                ব্যাকআপ প্রিভিউ: {importPreview.filename}
              </span>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
              ফাইলে মোট <strong>{toBengaliNumber(importPreview.count)}</strong> টি দোয়ার তথ্য পাওয়া গেছে। আপনি কীভাবে ডেটা রিস্টোর করতে চান?
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleRestoreMerge}
                disabled={isProcessing}
                className="min-h-[44px] py-1.5 px-2 bg-[#ffb31a] hover:bg-[#e69c05] text-zinc-950 font-bold text-xs rounded-[12px] shadow-xs transition-colors"
              >
                যুক্ত করুন (Merge)
              </button>
              <button
                type="button"
                onClick={handleRestoreReplace}
                disabled={isProcessing}
                className="min-h-[44px] py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-[12px] shadow-xs transition-colors"
              >
                প্রতিস্থাপন (Replace)
              </button>
              <button
                type="button"
                onClick={() => setImportPreview(null)}
                className="col-span-2 py-1.5 px-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-xs"
              >
                বাতিল
              </button>
            </div>
          </div>
        )}

        {/* Destructive Actions */}
        <div className="flex flex-col gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            বিপজ্জনক অ্যাকশন
          </label>
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            disabled={isProcessing || totalDuasCount === 0}
            className="min-h-[44px] w-full flex items-center justify-center gap-2 p-2.5 rounded-[12px] border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-medium hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>সকল সংরক্ষিত দোয়া মুছে ফেলুন</span>
          </button>
        </div>

        {/* Privacy Note */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 rounded-[20px] text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-[#ffb31a] shrink-0 mt-0.5" />
          <span>
            আপনার সকল দোয়ার তথ্য সম্পূর্ণভাবে আপনার এই ডিভাইসের IndexedDB-তে সংরক্ষিত থাকে। কোনো রিমোট সার্ভারে ডেটা পাঠানো হয় না। নিয়মিত ব্যাকআপ ডাউনলোড করে রাখুন।
          </span>
        </div>
      </main>

      {/* Clear All Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showClearConfirm}
        title="সকল তথ্য মুছে ফেলবেন?"
        description="আপনার ডিভাইসে সংরক্ষিত সকল দোয়ার রেকর্ড স্থায়ীভাবে মুছে ফেলা হবে। আপনি কি নিশ্চিত?"
        confirmLabel="হ্যাঁ, মুছে ফেলুন"
        cancelLabel="বাতিল"
        onConfirm={handleConfirmClearAll}
        onCancel={() => setShowClearConfirm(false)}
        isDestructive={true}
      />
    </div>
  );
};
