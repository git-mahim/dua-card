"use client";

import React from "react";
import { AlertTriangle, RotateCcw, X } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
  iconType?: "danger" | "reset";
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = "মুছে ফেলুন",
  cancelLabel = "বাতিল",
  onConfirm,
  onCancel,
  isDestructive = true,
  iconType = "danger",
}) => {
  React.useEffect(() => {
    if (isOpen) {
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

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150 h-[100dvh] w-screen overscroll-none touch-none select-none box-border font-bengali"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white dark:bg-[#181818] border border-zinc-200/90 dark:border-zinc-800/90 rounded-[20px] p-5 shadow-2xl text-left flex flex-col gap-4 touch-auto select-auto"
      >
        <div className="flex items-start justify-between">
          {iconType === "reset" || !isDestructive ? (
            <div className="w-10 h-10 rounded-[12px] bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[#c87d00] dark:text-[#ffb31a] shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-[12px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          )}
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-1">
            {title}
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-850">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] px-4 py-2 text-xs font-medium rounded-[12px] border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-[44px] px-4 py-2 text-xs font-bold rounded-[12px] transition-all active:scale-95 ${
              isDestructive
                ? "bg-rose-600 hover:bg-rose-500 text-white"
                : "bg-[#ffb31a] hover:bg-[#e69c05] text-zinc-950 shadow-xs"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
