"use client";

import React, { useState, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DuaRecord, DuaDailyLog } from "@/lib/types";
import { StructuredDuaViewer } from "./StructuredDuaViewer";
import { DoubleTapCheckAnimation } from "./DoubleTapCheckAnimation";
import { toBengaliNumber, formatBengaliDateShort } from "@/lib/formatters";
import { triggerHaptic } from "@/lib/haptics";
import {
  MoreVertical,
  ArrowUp,
  ArrowDown,
  Trash2,
  GripVertical,
  Edit3,
  TrendingUp,
  Plus,
  CheckCircle2,
  Sparkles,
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
  onOpen?: (dua: DuaRecord) => void;
  onMoveUp?: (dua: DuaRecord) => void;
  onMoveDown?: (dua: DuaRecord) => void;
  isFirst?: boolean;
  isLast?: boolean;
  isDragOverlay?: boolean;
  hideVirtue?: boolean;
}

export const DuaCard: React.FC<DuaCardProps> = ({
  dua,
  todayLog,
  onEdit,
  onDeleteRequest,
  onToggleCompleted,
  onOpenCountModal,
  onQuickAddCount,
  onOpenAnalytics,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false,
  isDragOverlay = false,
  hideVirtue = false,
}) => {
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

  // Handle Instagram-style Double Tap
  const handleCardClick = (e: React.MouseEvent) => {
    if (isDragOverlay) return;

    // Ignore if clicked on buttons or menu
    const target = e.target as HTMLElement;
    if (target.closest("[data-no-double-tap]")) return;

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 320;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap triggered
      triggerHaptic(50);
      if (!isCompleted) {
        setShowCheckAnim(true);
      }
      if (onToggleCompleted) {
        onToggleCompleted(dua);
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      tabIndex={0}
      onClick={handleCardClick}
      aria-label={dua.title ? `দোয়া: ${dua.title}` : "দোয়া কার্ড"}
      className={`group relative w-full border rounded-3xl p-4 text-left select-none outline-none transition-all duration-200 ${
        isDragOverlay
          ? "border-[#ffb31a] bg-white dark:bg-[#181818] z-50 pointer-events-none shadow-xl scale-[1.02]"
          : isCompleted
          ? "opacity-35 hover:opacity-90 bg-surface-card border-zinc-200/90 dark:border-zinc-800/80 hover:border-[#ffb31a]/40 shadow-xs"
          : "opacity-100 bg-surface-card hover:bg-surface-cardHover border-zinc-200/90 dark:border-zinc-800/80 hover:border-[#ffb31a]/40 shadow-xs"
      }`}
    >
      {/* Double Tap Success Animation Overlay */}
      <DoubleTapCheckAnimation
        show={showCheckAnim}
        onAnimationEnd={() => setShowCheckAnim(false)}
      />

      {/* Top Bar: Drag Grip, Date, Completion Status & Three-Dot Menu */}
      <div className="flex items-center justify-between gap-2 mb-2 no-select">
        <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
          <GripVertical className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" />
          <span className="text-[10px] font-mono tracking-wider">
            {formatBengaliDateShort(dua.createdAt)}
          </span>
        </div>

        <div className="flex items-center gap-1.5" data-no-double-tap="true">
          {/* Completed Pill Badge */}
          {isCompleted && (
            <button
              type="button"
              onClick={() => onToggleCompleted && onToggleCompleted(dua)}
              className="px-2 py-0.5 bg-[#ffb31a]/20 text-[#b36f00] dark:text-[#ffb31a] border border-[#ffb31a]/40 rounded-full text-[10px] font-bold font-bengali flex items-center gap-1 shadow-2xs hover:bg-[#ffb31a]/30 transition-colors"
              title="ডাবল ট্যাপে সম্পূর্ণ হয়েছে (আনচেক করতে ট্যাপ করুন)"
            >
              <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
              <span>সম্পূর্ণ</span>
            </button>
          )}

          {/* Secondary Action Overflow Menu */}
          {!isDragOverlay && (
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                aria-label="অপশন মেনু"
                aria-expanded={showMenu}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <>
                  {/* Backdrop to close menu */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                    }}
                  />
                  <div className="absolute right-0 top-7 z-50 w-44 bg-white dark:bg-[#1a1a1a] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl py-1 text-xs font-bengali animate-in fade-in zoom-in-95 duration-100 divide-y divide-zinc-100 dark:divide-zinc-800/60">
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
                          <span>উপরে নিন</span>
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
                          <span>নিচে নিন</span>
                        </button>
                      )}
                    </div>

                    <div className="py-1">
                      {/* আমল হিস্ট্রি (Analytics) */}
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
                          <span>আমল হিস্ট্রি</span>
                        </button>
                      )}

                      {/* সম্পাদনা (Edit) */}
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
                        <span>সম্পাদনা</span>
                      </button>
                    </div>

                    <div className="py-1">
                      {/* মুছে ফেলুন (Delete) */}
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
                        <span>মুছে ফেলুন</span>
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
      <div className="relative">
        <StructuredDuaViewer
          content={dua.richTextContent}
          isTruncated={false}
          hideVirtue={hideVirtue}
        />
      </div>

      {/* Bottom Action Footer: 2 Clean, Balanced Buttons (Never Wraps) */}
      {!isDragOverlay && (
        <div
          className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between gap-2"
          data-no-double-tap="true"
        >
          {/* Left: Direct "আমল হিস্ট্রি" Button */}
          {onOpenAnalytics && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(40);
                onOpenAnalytics(dua);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold font-bengali text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 active:scale-95 rounded-xl border border-zinc-200/70 dark:border-zinc-700/70 transition-all shadow-2xs whitespace-nowrap"
              title="আমল হিস্ট্রি ও বিস্তারিত চার্ট দেখুন"
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#ffb31a]" />
              <span>আমল হিস্ট্রি</span>
            </button>
          )}

          {/* Right: Counter Badge (Tap to open count dialog) */}
          <button
            type="button"
            onClick={() => onOpenCountModal && onOpenCountModal(dua)}
            className={`px-2.5 py-1 rounded-xl text-xs font-bengali font-bold border transition-all active:scale-95 flex items-center gap-1.5 shadow-2xs whitespace-nowrap ${
              currentCount > 0
                ? "bg-[#ffb31a]/15 border-[#ffb31a]/40 text-amber-900 dark:text-[#ffb31a]"
                : "bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200/80 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 hover:border-[#ffb31a]/40"
            }`}
            title="আমল সংখ্যা যোগ বা পরিবর্তন করুন"
          >
            <span>আজকে:</span>
            <span className="font-mono font-extrabold text-[13px]">
              {toBengaliNumber(currentCount)}
            </span>
            <span className="text-[10px] font-medium opacity-80">বার</span>
            <Plus className="w-3 h-3 text-[#ffb31a] stroke-[2.5]" />
          </button>
        </div>
      )}
    </article>
  );
};
