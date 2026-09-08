"use client";

import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DuaRecord, DuaDailyLog } from "@/lib/types";
import { StructuredDuaViewer } from "./StructuredDuaViewer";
import { triggerHaptic } from "@/lib/haptics";
import { useLanguage } from "@/lib/i18n";
import { copyDuaTextAndMeaning } from "@/lib/copyUtils";
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
  Copy,
  ShieldCheck,
} from "lucide-react";

interface DuaCardProps {
  dua: DuaRecord;
  todayLog?: DuaDailyLog;
  orderIndex?: number;
  onEdit: (dua: DuaRecord) => void;
  onDeleteRequest: (dua: DuaRecord) => void;
  onToggleCompleted?: (dua: DuaRecord) => void;
  onOpenCountModal?: (dua: DuaRecord) => void;
  onQuickAddCount?: (dua: DuaRecord, delta: number) => void;
  onOpenAnalytics?: (dua: DuaRecord) => void;
  onCopyText?: (dua: DuaRecord) => void;
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
  orderIndex,
  onEdit,
  onDeleteRequest,
  onToggleCompleted,
  onOpenCountModal,
  onQuickAddCount,
  onOpenAnalytics,
  onCopyText,
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
      className={`group relative w-full bg-surface-card border rounded-[22px] p-4 sm:p-5 ${!isDragOverlay ? "pb-0 sm:pb-0" : ""} transition-all duration-150 select-none no-select ${
        isDragging
          ? "border-[#ffb31a] shadow-xl ring-2 ring-[#ffb31a]/30 z-30"
          : isCompleted
          ? "border-emerald-500/30 dark:border-emerald-500/25 bg-emerald-500/[0.02] dark:bg-emerald-950/[0.08]"
          : "border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-2xs hover:shadow-xs"
      }`}
    >

      {/* Top Bar: Integrated Reorder Handle & Order Badge, Status Badge & Actions Menu */}
      <div className="flex items-center justify-between gap-2 mb-3" data-no-double-tap="true">
        {/* Left Side: Integrated Drag Handle & Order Number Badge */}
        <div className="flex items-center shrink-0">
          {!isDragOverlay ? (
            <div
              {...attributes}
              {...listeners}
              role="button"
              tabIndex={0}
              aria-label={
                language === "bn"
                  ? `ক্রমিক ${formatNumber(orderIndex ?? 1)} - স্থান পরিবর্তন করতে ধরে রাখুন`
                  : `Order ${orderIndex} - Drag to reorder`
              }
              className="touch-none cursor-grab active:cursor-grabbing flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-100/50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200/40 dark:border-zinc-800/50 transition-colors select-none group/drag"
            >
              <GripVertical className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 group-hover/drag:text-zinc-600 dark:group-hover/drag:text-zinc-300 stroke-[1.75]" />
              {typeof orderIndex === "number" && (
                <span className="font-mono text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  {formatNumber(orderIndex)}
                </span>
              )}
            </div>
          ) : (
            typeof orderIndex === "number" && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-100/50 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 font-mono text-[11px] font-medium border border-zinc-200/40 dark:border-zinc-800/50">
                <GripVertical className="w-3.5 h-3.5 text-zinc-400 stroke-[1.75]" />
                <span>{formatNumber(orderIndex)}</span>
              </div>
            )
          )}
        </div>

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
            className={`min-h-[28px] px-2 py-0.5 rounded-lg text-[11px] font-normal transition-all flex items-center gap-1 cursor-pointer select-none active:scale-95 ${
              isCompleted
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400/90 border border-emerald-500/20 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 hover:border-rose-300/40"
                : "bg-zinc-100/60 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 border border-zinc-200/40 dark:border-zinc-800/50 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-500/30"
            }`}
          >
            {isCompleted ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2]" />
                <span className="leading-none">{t("badgeCompleted")}</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5 stroke-[1.75]" />
                <span className="leading-none">{t("badgePending")}</span>
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
                className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 transition-all active:scale-90"
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
                  <div className="absolute right-0 top-7 z-50 w-48 bg-white dark:bg-[#1a1a1a] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-xl py-1 text-xs animate-in fade-in zoom-in-95 duration-100 divide-y divide-zinc-100 dark:divide-zinc-800/60">
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
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          triggerHaptic(40);
                          if (onCopyText) {
                            onCopyText(dua);
                          } else {
                            await copyDuaTextAndMeaning(dua, language);
                          }
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-left transition-colors font-medium"
                      >
                        <Copy className="w-3.5 h-3.5 text-[#ffb31a]" />
                        <span>{language === "bn" ? "দোয়া ও অর্থ কপি করুন" : "Copy Dua & Meaning"}</span>
                      </button>

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
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          onDeleteRequest(dua);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left transition-colors font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t("delete")}</span>
                      </button>
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
          className="mt-3 py-2 border-t border-zinc-100/60 dark:border-zinc-800/50 flex items-center justify-between gap-2"
          data-no-double-tap="true"
        >
          {/* Left: Quick Counter Stepper Pill */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onOpenCountModal && onOpenCountModal(dua)}
              className={`min-h-[30px] px-2.5 py-0.5 rounded-lg text-xs font-normal flex items-center gap-1 transition-all active:scale-95 whitespace-nowrap ${
                isCompleted
                  ? "bg-amber-500/10 dark:bg-amber-400/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 dark:border-amber-500/25 hover:bg-amber-500/15"
                  : "bg-zinc-100/50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/40 dark:border-zinc-800/50"
              }`}
              title={language === "bn" ? "আমল সংখ্যা বিস্তারিত দেখুন বা পরিবর্তন করুন" : "Add or update recitation count"}
            >
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">
                {t("todayCount")}:
              </span>
              <span className={`font-mono font-bold text-[13px] ${
                isCompleted ? "text-amber-900 dark:text-[#ffb31a]" : "text-zinc-700 dark:text-zinc-300"
              }`}>
                {formatNumber(currentCount)}
              </span>
              <span className="text-[10.5px] text-zinc-500 dark:text-zinc-400 font-normal">
                {t("timesSuffix")}
              </span>
            </button>

            {onQuickAddCount && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(30);
                  onQuickAddCount(dua, 1);
                }}
                aria-label={language === "bn" ? "১ বার যোগ করুন" : "Quick add 1"}
                className="w-[30px] h-[30px] rounded-lg bg-zinc-100/50 dark:bg-zinc-800/40 hover:bg-amber-500/10 dark:hover:bg-amber-400/15 text-zinc-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-[#ffb31a] border border-zinc-200/40 dark:border-zinc-800/50 hover:border-amber-500/30 flex items-center justify-center transition-all active:scale-90 font-normal text-xs"
                title={language === "bn" ? "দ্রুত ১ বার যোগ করুন (+১)" : "Quick +1"}
              >
                <Plus className="w-3.5 h-3.5 stroke-[1.75]" />
              </button>
            )}
          </div>

          {/* Right: Direct Analytics Button */}
          {onOpenAnalytics && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(40);
                onOpenAnalytics(dua);
              }}
              className="min-h-[30px] px-2.5 py-0.5 text-xs font-normal text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 bg-zinc-100/50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 rounded-lg border border-zinc-200/40 dark:border-zinc-800/50 transition-all flex items-center gap-1 whitespace-nowrap"
              title={language === "bn" ? "আমল হিস্ট্রি ও বিস্তারিত চার্ট দেখুন" : "View recitation history and analytics"}
            >
              <TrendingUp className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
              <span className="text-[11px] font-normal">{t("analytics")}</span>
            </button>
          )}
        </div>
      )}
    </article>
  );
};
