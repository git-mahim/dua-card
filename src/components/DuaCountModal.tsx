"use client";

import React, { useState, useEffect } from "react";
import { DuaRecord } from "@/lib/types";
import { triggerHaptic } from "@/lib/haptics";
import { useLanguage } from "@/lib/i18n";
import { X, Plus, RotateCcw, Check, Sparkles } from "lucide-react";

interface DuaCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  dua: DuaRecord | null;
  currentCount: number;
  onAddCount: (delta: number) => void;
  onSetCount: (count: number) => void;
}

export const DuaCountModal: React.FC<DuaCountModalProps> = ({
  isOpen,
  onClose,
  dua,
  currentCount,
  onAddCount,
  onSetCount,
}) => {
  const { language, t, formatNumber } = useLanguage();
  const [customInput, setCustomInput] = useState("");

  useEffect(() => {
    if (isOpen) {
      setCustomInput("");
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [isOpen]);

  if (!isOpen || !dua) return null;

  const handleQuickAdd = (amount: number) => {
    triggerHaptic(40);
    onAddCount(amount);
  };

  const handleCustomAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customInput.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(val) && val > 0) {
      triggerHaptic(50);
      onAddCount(val);
      setCustomInput("");
    }
  };

  const handleReset = () => {
    if (currentCount === 0) return;
    triggerHaptic(50);
    onSetCount(0);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150 h-[100dvh] w-screen overscroll-none touch-none select-none box-border"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white dark:bg-[#181818] border-0 dark:border dark:border-zinc-800/90 rounded-[22px] p-5 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150 touch-auto select-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="count-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-850 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[11px] bg-[#ffb31a]/15 text-[#c87d00] dark:text-[#ffb31a] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3
                id="count-modal-title"
                className="text-sm font-bold text-zinc-900 dark:text-zinc-50 truncate"
              >
                {dua.title || t("countModalTitle")}
              </h3>
              <p className="text-[11px] text-zinc-500">{t("countModalSub")}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={language === "bn" ? "বন্ধ করুন" : "Close"}
            className="w-8 h-8 rounded-[10px] flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Total Display */}
        <div className="flex flex-col items-center justify-center py-3.5 bg-[#ffb31a]/10 dark:bg-[#ffb31a]/15 border border-[#ffb31a]/25 rounded-[16px]">
          <span className="text-[11px] text-zinc-600 dark:text-zinc-400 mb-1 font-medium">
            {t("totalReadToday")}
          </span>
          <div className="text-3xl font-extrabold font-mono text-zinc-950 dark:text-[#ffb31a] tracking-tight">
            {formatNumber(currentCount)}{" "}
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {t("timesSuffix")}
            </span>
          </div>
        </div>

        {/* Quick Increment Preset Buttons */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            {currentCount === 0 ? t("selectPresetCount") : t("quickAddCount")}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[1, 3, 7, 33, 100, 500].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleQuickAdd(amt)}
                className="min-h-[44px] py-2 px-2 bg-zinc-100 dark:bg-zinc-800/90 hover:bg-[#ffb31a] hover:text-zinc-950 dark:hover:bg-[#ffb31a] dark:hover:text-zinc-950 active:scale-95 text-zinc-800 dark:text-zinc-200 rounded-[12px] text-xs font-bold border border-zinc-200/80 dark:border-zinc-700/80 transition-all flex items-center justify-center gap-1 shadow-2xs"
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
                <span>{formatNumber(amt)} {t("timesSuffix")}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Input Form */}
        <div className="flex flex-col gap-2 pt-0.5">
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            {t("customCountLabel")}
          </label>

          <form onSubmit={handleCustomAddSubmit} className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              min="1"
              placeholder={t("customCountPlaceholder")}
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="flex-1 min-w-0 min-h-[44px] px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#ffb31a]/40 focus:border-[#ffb31a] font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
            />
            <button
              type="submit"
              disabled={!customInput || parseInt(customInput, 10) <= 0}
              className="min-h-[44px] px-3.5 py-2 bg-[#ffb31a] hover:bg-[#e69c05] disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 disabled:cursor-not-allowed text-zinc-950 text-xs font-bold rounded-[12px] transition-all shadow-xs active:scale-95 flex items-center gap-1.5 shrink-0 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{t("addBtn")}</span>
            </button>
          </form>
        </div>

        {/* Footer Actions: 2 Half-width Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleReset}
            disabled={currentCount === 0}
            className="min-h-[44px] py-2.5 px-3 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/80 rounded-[12px] text-xs font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs active:scale-95"
            title={language === "bn" ? "আজকের কাউন্ট ০ করুন" : "Reset today's count to 0"}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t("resetCounter")}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] py-2.5 px-3 bg-[#ffb31a] hover:bg-[#e69c05] text-zinc-950 rounded-[12px] text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{t("doneBtn")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
