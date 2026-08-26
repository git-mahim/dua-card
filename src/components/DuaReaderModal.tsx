"use client";

import React, { useState } from "react";
import { DuaRecord } from "@/lib/types";
import { StructuredDuaViewer } from "./StructuredDuaViewer";
import { useWakeLock } from "@/lib/wakeLock";
import {
  ArrowLeft,
  Edit3,
  SunMedium,
  Copy,
  Check,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  Trash2,
} from "lucide-react";

interface DuaReaderModalProps {
  dua: DuaRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (dua: DuaRecord) => void;
  onDeleteRequest: (dua: DuaRecord) => void;
  onMoveUp?: (dua: DuaRecord) => void;
  onMoveDown?: (dua: DuaRecord) => void;
}

export const DuaReaderModal: React.FC<DuaReaderModalProps> = ({
  dua,
  isOpen,
  onClose,
  onEdit,
  onDeleteRequest,
  onMoveUp,
  onMoveDown,
}) => {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
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

  if (!isOpen || !dua) return null;

  const handleToggleWakeLock = async () => {
    if (isLocked) {
      await releaseWakeLock();
    } else {
      await requestWakeLock();
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(dua.plainTextPreview);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reader-title"
      className="fixed inset-0 z-50 flex flex-col bg-background text-foreground animate-in fade-in duration-150 overflow-y-auto"
    >
      {/* Top Header / Navigation Bar */}
      <header className="sticky top-0 z-10 w-full bg-background/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="ফিরে যান"
          className="p-2 -ml-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          {/* Screen Wake Lock Toggle */}
          {isWakeLockSupported && (
            <button
              type="button"
              onClick={handleToggleWakeLock}
              className={`p-2 rounded-xl text-xs font-bengali flex items-center gap-1 transition-colors ${
                isLocked
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
              title={isLocked ? "স্ক্রিন অলওয়েজ অন সক্রিয়" : "স্ক্রিন অন রাখুন"}
            >
              <SunMedium className="w-4 h-4" />
            </button>
          )}

          {/* Copy Text Action */}
          <button
            type="button"
            onClick={handleCopyText}
            aria-label="টেক্সট কপি করুন"
            className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="কপি করুন"
          >
            {copied ? (
              <Check className="w-4 h-4 text-[#ffb31a]" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>

          {/* Text-based Edit Button */}
          <button
            type="button"
            onClick={() => onEdit(dua)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium font-bengali rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>সম্পাদনা</span>
          </button>

          {/* Overflow Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              aria-label="আরও অপশন"
              aria-expanded={showMenu}
              className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-8 z-50 w-36 bg-white dark:bg-[#1a1a1a] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg py-1 text-xs font-bengali animate-in fade-in zoom-in-95 duration-100">
                  {onMoveUp && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onMoveUp(dua);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-left transition-colors"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                      <span>উপরে নিন</span>
                    </button>
                  )}
                  {onMoveDown && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onMoveDown(dua);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-left transition-colors"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                      <span>নিচে নিন</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onDeleteRequest(dua);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>মুছে ফেলুন</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Reading Canvas */}
      <main className="flex-1 w-full max-w-lg mx-auto px-5 py-6 pb-20">
        <article className="prose dark:prose-invert max-w-none">
          <StructuredDuaViewer content={dua.richTextContent} isTruncated={false} />
        </article>

        {/* Footer meta */}
        <footer className="mt-12 pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-600 font-bengali">
          <span>সংরক্ষণ: {new Date(dua.createdAt).toLocaleDateString("bn-BD")}</span>
          <span>আপডেট: {new Date(dua.updatedAt).toLocaleDateString("bn-BD")}</span>
        </footer>
      </main>
    </div>
  );
};
