"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "./ThemeProvider";
import {
  exportBackupFile,
  validateBackupJson,
  restoreBackupMerge,
  restoreBackupReplace,
} from "@/lib/backup";
import { DuaRecord } from "@/lib/types";
import {
  X,
  ArrowLeft,
  Download,
  Upload,
  Moon,
  Sun,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileJson,
  EyeOff,
  Eye,
  Type,
  RotateCcw,
} from "lucide-react";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import {
  FONT_CONFIGS,
  FontSizeSettings,
  DEFAULT_FONT_SIZES,
  loadSavedFontSizes,
  saveFontSizes,
} from "@/lib/fontSize";
import { toBengaliNumber } from "@/lib/formatters";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
  onClearAllData: () => Promise<void>;
  totalDuasCount: number;
  hideVirtueOnHome: boolean;
  onToggleHideVirtue: (enabled: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onDataChanged,
  onClearAllData,
  totalDuasCount,
  hideVirtueOnHome,
  onToggleHideVirtue,
}) => {
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Import preview state
  const [importPreview, setImportPreview] = useState<{
    duas: DuaRecord[];
    count: number;
    filename: string;
  } | null>(null);

  // Destructive delete confirmation
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Font size configuration state
  const [fontSizes, setFontSizes] = useState<FontSizeSettings>(DEFAULT_FONT_SIZES);

  useEffect(() => {
    if (isOpen) {
      setFontSizes(loadSavedFontSizes());
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isOpen]);

  const handleUpdateFontSize = (key: keyof FontSizeSettings, size: number) => {
    setFontSizes((prev) => {
      const updated = { ...prev, [key]: size };
      saveFontSizes(updated);
      return updated;
    });
  };

  const handleResetFontSizes = () => {
    setFontSizes(DEFAULT_FONT_SIZES);
    saveFontSizes(DEFAULT_FONT_SIZES);
  };

  if (!isOpen) return null;

  const showToast = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Handle Export Backup
  const handleExport = async () => {
    try {
      setIsProcessing(true);
      const res = await exportBackupFile();
      if (res.success) {
        showToast("success", `ব্যাকআপ ফাইল সফলভাবে ডাউনলোড হয়েছে (${res.recordCount} টি দোয়া)`);
      } else {
        showToast("error", res.error || "ব্যাকআপ এক্সপোর্ট করতে সমস্যা হয়েছে");
      }
    } catch {
      showToast("error", "একটি অপ্রত্যাশিত ত্রুটি ঘটেছে");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Import File Selected
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const validation = validateBackupJson(text);

        if (!validation.isValid) {
          showToast(
            "error",
            `ফাইলটি সঠিক নয়: ${validation.errors.join(", ")}`
          );
          return;
        }

        const payload = validation.payload!;
        setImportPreview({
          duas: payload.duas,
          count: payload.duas.length,
          filename: file.name,
        });
      } catch {
        showToast("error", "ফাইল পড়তে ব্যর্থ হয়েছে। সঠিক JSON ফাইল নির্বাচন করুন।");
      } finally {
        // Reset input so same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsText(file);
  };

  // Execute Merge Restore
  const handleRestoreMerge = async () => {
    if (!importPreview) return;
    try {
      setIsProcessing(true);
      const res = await restoreBackupMerge(importPreview.duas);
      if (res.success) {
        showToast(
          "success",
          `সফলভাবে যুক্ত হয়েছে (${res.importedCount} টি নতুন, ${res.updatedCount} টি আপডেট)।`
        );
        setImportPreview(null);
        onDataChanged();
      } else {
        showToast("error", "রিস্টোর ব্যর্থ হয়েছে।");
      }
    } catch {
      showToast("error", "রিস্টোর প্রক্রিয়া ব্যর্থ হয়েছে।");
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute Replace Restore
  const handleRestoreReplace = async () => {
    if (!importPreview) return;
    try {
      setIsProcessing(true);
      const res = await restoreBackupReplace(importPreview.duas);
      if (res.success) {
        showToast(
          "success",
          `সকল তথ্য প্রতিস্থাপিত হয়েছে (${importPreview.count} টি দোয়া)।`
        );
        setImportPreview(null);
        onDataChanged();
      } else {
        showToast("error", "প্রতিস্থাপন ব্যর্থ হয়েছে।");
      }
    } catch {
      showToast("error", "প্রতিস্থাপন ব্যর্থ হয়েছে।");
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute Delete All Data
  const handleConfirmClearAll = async () => {
    try {
      setIsProcessing(true);
      await onClearAllData();
      setShowClearConfirm(false);
      showToast("success", "সকল লোকাল ডেটা মুছে ফেলা হয়েছে।");
      onDataChanged();
    } catch {
      showToast("error", "ডেটা মুছতে সমস্যা হয়েছে।");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col bg-background text-foreground animate-in fade-in duration-150 overflow-y-auto overscroll-y-contain w-full max-w-full font-bengali select-text"
    >
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-20 w-full bg-background/95 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="ফিরে যান"
              className="p-1.5 -ml-1 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-bengali">
              সেটিংস ও ডেটা ব্যবস্থাপনা
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Settings Page Container */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-4 pb-24 flex flex-col gap-4">
        {/* Toast Alert */}
        {notification && (
          <div
            role="status"
            aria-live="polite"
            className={`p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-1 ${
              notification.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Card Display Preferences */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-xl bg-[#ffb31a]/15 text-[#c87d00] dark:text-[#ffb31a] flex items-center justify-center shrink-0">
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
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-medium border transition-all ${
                theme === "light"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-sm font-bold"
                  : "bg-zinc-50 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-[#ffb31a]" />
              <span>লাইট মোড</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-medium border transition-all ${
                theme === "dark"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-sm font-bold"
                  : "bg-zinc-50 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>ডার্ক মোড</span>
            </button>
          </div>
        </div>

        {/* Font & Size Preferences */}
        <div className="flex flex-col gap-2 p-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <div className="flex items-center justify-between pb-1 border-b border-zinc-200/60 dark:border-zinc-800/60">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-[#ffb31a]" />
              <label className="text-xs font-bold font-bengali text-zinc-900 dark:text-zinc-100">
                ফন্ট ও সাইজ
              </label>
            </div>
            <button
              type="button"
              onClick={handleResetFontSizes}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-200/70 dark:bg-zinc-800 hover:bg-zinc-300/80 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-[11px] font-bold font-bengali transition-all active:scale-95 border border-zinc-200/90 dark:border-zinc-700/90 shadow-2xs"
              title="ডিফল্ট ফন্ট সাইজে ফিরে যান"
            >
              <RotateCcw className="w-3 h-3 text-[#ffb31a]" />
              <span>ডিফল্ট রিসেট</span>
            </button>
          </div>

          <div className="flex flex-col divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
            {FONT_CONFIGS.map((item) => {
              const currentSize = fontSizes[item.key];
              return (
                <div key={item.key} className="flex flex-col gap-1.5 py-2 first:pt-1 last:pb-0">
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
                      <div className="flex items-center bg-zinc-200/70 dark:bg-zinc-800 rounded-lg p-0.5 border border-zinc-200/80 dark:border-zinc-700/80">
                        {(["s", "m", "l"] as const).map((preset) => {
                          const presetVal = item.presets[preset];
                          const isActive = currentSize === presetVal;
                          return (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handleUpdateFontSize(item.key, presetVal)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase transition-all ${
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
        <div className="flex flex-col gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
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
              className="flex items-center justify-center gap-2 p-2.5 bg-zinc-100 dark:bg-zinc-900/80 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-medium border border-zinc-200/80 dark:border-zinc-800 transition-colors disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ব্যাকআপ এক্সপোর্ট</span>
            </button>

            {/* Import Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex items-center justify-center gap-2 p-2.5 bg-zinc-100 dark:bg-zinc-900/80 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-medium border border-zinc-200/80 dark:border-zinc-800 transition-colors disabled:opacity-40"
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
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col gap-2.5 animate-in fade-in">
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
                className="py-1.5 px-2 bg-[#ffb31a] hover:bg-[#e69c05] text-zinc-950 font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                যুক্ত করুন (Merge)
              </button>
              <button
                type="button"
                onClick={handleRestoreReplace}
                disabled={isProcessing}
                className="py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
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
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-medium hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>সকল সংরক্ষিত দোয়া মুছে ফেলুন</span>
          </button>
        </div>

        {/* Privacy Note */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed flex items-start gap-2">
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
