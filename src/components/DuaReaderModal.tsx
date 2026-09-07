"use client";

import React, { useState } from "react";
import { DuaRecord } from "@/lib/types";
import { StructuredDuaViewer } from "./StructuredDuaViewer";
import { useWakeLock } from "@/lib/wakeLock";
import { triggerHaptic } from "@/lib/haptics";
import { useLanguage } from "@/lib/i18n";
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
  ShieldCheck,
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
  const { language, t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { isLocked, isSupported: isWakeLockSupported, requestWakeLock, releaseWakeLock } = useWakeLock();

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
    triggerHaptic(30);
    if (isLocked) {
      await releaseWakeLock();
    } else {
      await requestWakeLock();
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(dua.plainTextPreview);
      triggerHaptic(40);
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
      <header className="sticky top-0 z-10 w-full bg-white/85 dark:bg-[#121212]/85 backdrop-blur-xl border-b border-zinc-200/60 dark:border-zinc-800/60 px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label={language === "bn" ? "ফিরে যান" : "Back"}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all active:scale-95 shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {/* Screen Wake Lock Toggle */}
          {isWakeLockSupported && (
            <button
              type="button"
              onClick={handleToggleWakeLock}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs transition-all active:scale-95 ${
                isLocked
                  ? "bg-[#ffb31a]/15 text-[#c87d00] dark:text-[#ffb31a] border border-[#ffb31a]/30"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
              }`}
              title={t("stayAwake")}
            >
              <SunMedium className="w-4 h-4" />
            </button>
          )}

          {/* Copy Text Action */}
          <button
            type="button"
            onClick={handleCopyText}
            aria-label={t("copy")}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all active:scale-95"
            title={t("copy")}
          >
            {copied ? (
              <Check className="w-4 h-4 text-[#ffb31a] stroke-[2.5]" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>

          {/* Text-based Edit Button */}
          <button
            type="button"
            onClick={() => onEdit(dua)}
            className="min-h-[38px] flex items-center gap-1.5 px-3 py-1.5 bg-[#ffb31a] hover:bg-[#e69c05] text-zinc-950 text-xs font-bold rounded-[11px] active:scale-95 transition-all shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{t("edit")}</span>
          </button>

          {/* Overflow Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              aria-label={t("actions")}
              aria-expanded={showMenu}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-8 z-50 w-36 bg-white dark:bg-[#1a1a1a] border border-zinc-200 dark:border-zinc-800 rounded-[14px] shadow-lg py-1 text-xs animate-in fade-in zoom-in-95 duration-100">
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
                      <span>{t("moveUp")}</span>
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
                      <span>{t("moveDown")}</span>
                    </button>
                  )}
                  {dua.isProtected ? (
                    <div className="w-full flex items-center gap-2 px-3 py-2 text-zinc-400 dark:text-zinc-500 text-left text-[11px] font-medium select-none">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#c87d00] dark:text-[#ffb31a] shrink-0" />
                      <span>{language === "bn" ? "স্থায়ী সংরক্ষিত দোয়া" : "Protected Dua"}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onDeleteRequest(dua);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t("delete")}</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Reading Canvas */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 sm:px-5 py-6 pb-20">
        <div className="w-full bg-surface-card border border-zinc-200/70 dark:border-zinc-800/60 rounded-[24px] p-5 sm:p-6 shadow-xs">
          <StructuredDuaViewer content={dua.richTextContent} isTruncated={false} />
        </div>

        {/* Footer meta */}
        <footer className="mt-8 pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
          <span>
            {language === "bn" ? "সংরক্ষণ: " : "Saved: "}
            {new Date(dua.createdAt).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")}
          </span>
          <span>
            {language === "bn" ? "আপডেট: " : "Updated: "}
            {new Date(dua.updatedAt).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")}
          </span>
        </footer>
      </main>
    </div>
  );
};
