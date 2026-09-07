"use client";

import React, { useState, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DuaRecord, DuaDailyLog } from "@/lib/types";
import { StructuredDuaViewer } from "./StructuredDuaViewer";
import { DoubleTapCheckAnimation } from "./DoubleTapCheckAnimation";
import { triggerHaptic } from "@/lib/haptics";
import { useLanguage } from "@/lib/i18n";
import {
  MoreVertical,
  ArrowUp,
  ArrowDown,
  Trash2,
  GripVertical,
  Edit3,
  TrendingUp,
  Plus,
  Check,
  Clock,
  Image as ImageIcon,
  ShieldCheck,
} from "lucide-react";

interface DuaCardProps {
  dua: DuaRecord;
  todayLog?: DuaDailyLog;
  onEdit: (dua: DuaRecord) => void;
  onDeleteRequest: (dua: DuaRecord) => void;
  onToggleCompleted?: (dua: DuaRecord) => void;
  onOpenCountModal?: (dua: DuaRecord) => void;
  onQuickAddCount?: (dua: DuaRecord, delta: number) => void;
  onOpenAnalytics?: (dua: DuaRecord) => void;
  onExportImage?: (dua: DuaRecord) => void;
  onOpen?: (dua: DuaRecord) => void;
  onMoveUp?: (dua: DuaRecord) => void;
  onMoveDown?: (dua: DuaRecord) => void;
  isFirst?: boolean;
  isLast?: boolean;
  isDragOverlay?: boolean;
  hideVirtue?: boolean;
  hideTitle?: boolean;
}

export const DuaCard: React.FC<DuaCardProps> = ({
  dua,
  todayLog,
  onEdit,
  onDeleteRequest,
  onToggleCompleted,
  onOpenCountModal,
  onOpenAnalytics,
  onExportImage,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false,
  isDragOverlay = false,
  hideVirtue = false,
  hideTitle = false,
}) => {
  const { language, t, formatNumber } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);
  const [showCheckAnim, setShowCheckAnim] = useState(false);
  const lastTapRef = useRef<number>(0);

  const isCompleted = !!(todayLog?.completed || (todayLog?.count && todayLog.count > 0));
  const currentCount = todayLog?.count || 0;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: dua.id,
    disabled: isDragOverlay,
  });

  const style: React.CSSProperties = isDragOverlay
    ? {
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
        transform: "scale(1.02)",
        cursor: "grabbing",
      }
    : {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
        touchAction: "pan-y",
      };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isDragOverlay) return;

    const target = e.target as HTMLElement;
    if (target.closest("[data-no-double-tap]")) return;

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 320;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      triggerHaptic(50);
      if (isCompleted) {
        if (onToggleCompleted) {
          onToggleCompleted(dua);
        }
      } else {
        if (onOpenCountModal) {
          onOpenCountModal(dua);
        } else if (onToggleCompleted) {
          onToggleCompleted(dua);
        }
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const handleToggleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic(40);
    if (isCompleted) {
      if (onToggleCompleted) {
        onToggleCompleted(dua);
      }
    } else {
      if (onOpenCountModal) {
        onOpenCountModal(dua);
      } else if (onToggleCompleted) {
        onToggleCompleted(dua);
      }
    }
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      onClick={handleCardClick}
      className={`group relative w-full bg-surface-card border rounded-[22px] p-4 sm:p-5 ${!isDragOverlay ? "pb-0 sm:pb-0" : ""} transition-all duration-150 select-none no-select ${
        isDragging
          ? "border-[#ffb31a] shadow-xl ring-2 ring-[#ffb31a]/30 z-30"
          : isCompleted
          ? "border-emerald-500/30 dark:border-emerald-500/25 bg-emerald-500/[0.02] dark:bg-emerald-950/[0.08]"
          : "border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-2xs hover:shadow-xs"
      }`}
    >
      {/* Instagram-style Double Tap Heart/Check Animation */}
      <DoubleTapCheckAnimation
        show={showCheckAnim}
        onComplete={() => setShowCheckAnim(false)}
      />

      {/* Top Bar: Reorder Handle, Status Badge & Actions Menu */}
      <div className="flex items-center justify-between gap-2 mb-3" data-no-double-tap="true">
        {/* Left Side: Drag Handle */}
        {!isDragOverlay ? (
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={language === "bn" ? "স্থান পরিবর্তন করতে ধরে রাখুন" : "Drag to reorder"}
            className="touch-none cursor-grab active:cursor-grabbing p-1.5 -ml-1 text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-lg transition-colors flex items-center justify-center shrink-0"
          >
            <GripVertical className="w-4 h-4 stroke-[2.2]" />
          </button>
        ) : (
          <div className="w-4 h-4" />
        )}

        {/* Right Side: Status Badge & Context Menu */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Completion Status Badge */}
          <button
            type="button"
            onClick={handleToggleStatus}
            aria-label={
              isCompleted
                ? (language === "bn" ? "পড়েছি সম্পন্ন - আনচেক করতে ক্লিক করুন" : "Completed - Click to uncheck")
                : (language === "bn" ? "বাকি দোয়া - সংখ্যা ইনপুট করতে ক্লিক করুন" : "Pending - Click to record count")
            }
            className={`min-h-[34px] px-2.5 py-1 rounded-[10px] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none active:scale-95 shadow-2xs ${
              isCompleted
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-800"
                : "bg-amber-500/15 text-[#c87d00] dark:text-[#ffb31a] border border-[#ffb31a]/30 hover:bg-[#ffb31a]/25"
            }`}
          >
            {isCompleted ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="leading-none translate-y-[0.5px]">{t("badgeCompleted")}</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5 stroke-[2.2]" />
                <span className="leading-none translate-y-[0.5px]">{t("badgePending")}</span>
              </>
            )}
          </button>

          {/* Secondary Action Overflow Menu */}
          {!isDragOverlay && (
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                aria-label={t("actions")}
                aria-expanded={showMenu}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                    }}
                  />
                  <div className="absolute right-0 top-7 z-50 w-48 bg-white dark:bg-[#1a1a1a] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl py-1 text-xs animate-in fade-in zoom-in-95 duration-100 divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    <div className="py-1">
                      {!isFirst && onMoveUp && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(false);
                            onMoveUp(dua);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-left transition-colors"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                          <span>{t("moveUp")}</span>
                        </button>
                      )}
                      {!isLast && onMoveDown && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(false);
                            onMoveDown(dua);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-left transition-colors"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                          <span>{t("moveDown")}</span>
                        </button>
                      )}
                    </div>

                    <div className="py-1">
                      {onExportImage && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(false);
                            onExportImage(dua);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-left transition-colors font-medium"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-[#ffb31a]" />
                          <span>{t("shareImage")}</span>
                        </button>
                      )}

                      {onOpenAnalytics && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(false);
                            onOpenAnalytics(dua);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-left transition-colors font-medium"
                        >
                          <TrendingUp className="w-3.5 h-3.5 text-[#ffb31a]" />
                          <span>{t("analytics")}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          onEdit(dua);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-left transition-colors font-medium"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#ffb31a]" />
                        <span>{t("edit")}</span>
                      </button>
                    </div>

                    <div className="py-1">
                      {dua.isProtected ? (
                        <div className="w-full flex items-center gap-2 px-3 py-1.5 text-zinc-400 dark:text-zinc-500 text-[11px] font-medium select-none">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#c87d00] dark:text-[#ffb31a] shrink-0" />
                          <span>{language === "bn" ? "স্থায়ী দোয়া (মুছে ফেলা যাবে না)" : "Protected Dua"}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
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
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Structured Rich-Text Content */}
      <div className="relative select-none no-select dua-card-content">
        <StructuredDuaViewer
          content={dua.richTextContent}
          isTruncated={false}
          hideVirtue={hideVirtue}
          hideTitle={hideTitle}
        />
      </div>

      {/* Bottom Action Footer */}
      {!isDragOverlay && (
        <div
          className="mt-3 py-3.5 sm:py-4 border-t border-zinc-100 dark:border-zinc-800/70 flex items-center justify-between gap-2"
          data-no-double-tap="true"
        >
          {/* Left: Quick Counter Badge */}
          <button
            type="button"
            onClick={() => onOpenCountModal && onOpenCountModal(dua)}
            className={`px-3 py-1.5 rounded-[12px] text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs whitespace-nowrap ${
              isCompleted
                ? "bg-[#ffb31a]/15 text-[#c87d00] dark:text-[#ffb31a] border border-[#ffb31a]/35 hover:bg-[#ffb31a]/25"
                : "bg-zinc-100/90 dark:bg-zinc-800/70 hover:bg-[#ffb31a]/15 hover:border-[#ffb31a]/40 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 border border-zinc-200/80 dark:border-zinc-750"
            }`}
            title={language === "bn" ? "আমল সংখ্যা যোগ বা পরিবর্তন করুন" : "Add or update recitation count"}
          >
            <span>{t("todayCount")}:</span>
            <span className={`font-mono font-extrabold text-[13px] ${
              isCompleted ? "text-zinc-950 dark:text-[#ffb31a]" : "text-zinc-900 dark:text-zinc-100"
            }`}>
              {formatNumber(currentCount)}
            </span>
            <span className={`text-[10px] font-medium ${
              isCompleted ? "text-amber-900/80 dark:text-amber-300/80" : "text-zinc-500 dark:text-zinc-400"
            }`}>
              {t("timesSuffix")}
            </span>
            <Plus className="w-3 h-3 text-[#ffb31a] stroke-[2.5]" />
          </button>

          {/* Right: Direct Analytics Button */}
          {onOpenAnalytics && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(40);
                onOpenAnalytics(dua);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 active:scale-95 rounded-[12px] border border-transparent hover:border-zinc-200/80 dark:hover:border-zinc-700/80 transition-all whitespace-nowrap"
              title={language === "bn" ? "আমল হিস্ট্রি ও বিস্তারিত চার্ট দেখুন" : "View recitation history and analytics"}
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#ffb31a]" />
              <span>{t("analytics")}</span>
            </button>
          )}
        </div>
      )}
    </article>
  );
};
