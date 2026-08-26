"use client";

import React, { useState, useEffect } from "react";
import { DuaRecord } from "@/lib/types";
import { toBengaliNumber } from "@/lib/formatters";
import { triggerHaptic } from "@/lib/haptics";
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
        className="w-full max-w-sm bg-surface-card border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150 touch-auto select-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="count-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#ffb31a]/15 text-[#c87d00] dark:text-[#ffb31a] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3
                id="count-modal-title"
                className="text-sm font-bold font-bengali text-zinc-900 dark:text-zinc-100 line-clamp-1"
              >
                {dua.title || "দৈনিক আমল কাউন্টার"}
              </h3>
              <p className="text-[11px] text-zinc-500 font-bengali">আজকের পড়ার সংখ্যা যুক্ত করুন</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Total Display */}
        <div className="flex flex-col items-center justify-center py-3 bg-[#ffb31a]/10 dark:bg-[#ffb31a]/15 border border-[#ffb31a]/25 rounded-2xl">
          <span className="text-[11px] font-bengali text-zinc-600 dark:text-zinc-400 mb-1">
            আজকে সর্বমোট পাঠ
          </span>
          <div className="text-3xl font-extrabold font-mono text-zinc-950 dark:text-[#ffb31a] tracking-tight">
            {toBengaliNumber(currentCount)}{" "}
            <span className="text-sm font-bengali font-semibold text-zinc-700 dark:text-zinc-300">
              বার
            </span>
          </div>
        </div>

        {/* Quick Increment Preset Buttons */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold font-bengali text-zinc-600 dark:text-zinc-400">
            কুইক যোগ করুন:
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[33, 100, 500, 1000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleQuickAdd(amt)}
                className="py-2.5 px-2 bg-zinc-100 dark:bg-zinc-800/90 hover:bg-[#ffb31a] hover:text-zinc-950 dark:hover:bg-[#ffb31a] dark:hover:text-zinc-950 active:scale-95 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-bold font-bengali border border-zinc-200/80 dark:border-zinc-700/80 transition-all flex items-center justify-center gap-1 shadow-sm"
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
                <span>{toBengaliNumber(amt)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Input Form (Divider removed) */}
        <div className="flex flex-col gap-1.5 pt-0.5">
          <label className="text-xs font-semibold font-bengali text-zinc-600 dark:text-zinc-400">
            কাস্টম সংখ্যা লিখুন:
          </label>

          <form onSubmit={handleCustomAddSubmit} className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              min="1"
              placeholder="যেমন: ২০০০"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="flex-1 min-w-0 px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-[#ffb31a] font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 placeholder:font-bengali [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="submit"
              disabled={!customInput || parseInt(customInput, 10) <= 0}
              className="px-3.5 py-2 bg-[#ffb31a] hover:bg-[#e69c05] disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 disabled:cursor-not-allowed text-zinc-950 text-xs font-bold font-bengali rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1 shrink-0 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>যোগ করুন</span>
            </button>
          </form>
        </div>

        {/* Footer Actions: 2 Half-width Buttons [ কাউন্টার রিসেট ] & [ সম্পন্ন ] */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleReset}
            disabled={currentCount === 0}
            className="py-2.5 px-3 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs font-bold font-bengali transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs active:scale-95"
            title="আজকের কাউন্ট ০ করুন"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>কাউন্টার রিসেট</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-3 bg-[#ffb31a] hover:bg-[#e69c05] text-zinc-950 rounded-xl text-xs font-bold font-bengali transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>সম্পন্ন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
