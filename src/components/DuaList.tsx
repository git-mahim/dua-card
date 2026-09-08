"use client";

import React, { useState, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DuaRecord, DuaDailyLog } from "@/lib/types";
import { DuaCard } from "./DuaCard";
import { triggerHaptic } from "@/lib/haptics";
import { BookPlus, SearchX, CheckCircle2, Clock, RotateCcw } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface DuaListProps {
  duas: DuaRecord[];
  todayLogs: Record<string, DuaDailyLog>;
  searchQuery?: string;
  onEdit: (dua: DuaRecord) => void;
  onDeleteRequest: (dua: DuaRecord) => void;
  onToggleCompleted: (dua: DuaRecord) => void;
  onOpenCountModal: (dua: DuaRecord) => void;
  onQuickAddCount: (dua: DuaRecord, delta: number) => void;
  onOpenAnalytics: (dua: DuaRecord) => void;
  onCopyToast?: (success: boolean) => void;
  onResetAllToday?: () => void;
  onMoveUp: (dua: DuaRecord) => void;
  onMoveDown: (dua: DuaRecord) => void;
  onReorder: (newOrderedList: DuaRecord[]) => void;
  onAddNew: () => void;
  onOpenDua?: (dua: DuaRecord) => void;
  hideVirtue?: boolean;
  hideTitle?: boolean;
}

type TabFilter = "all" | "pending" | "completed";

export const DuaList: React.FC<DuaListProps> = ({
  duas,
  todayLogs,
  searchQuery = "",
  onEdit,
  onDeleteRequest,
  onToggleCompleted,
  onOpenCountModal,
  onQuickAddCount,
  onOpenAnalytics,
  onCopyToast,
  onResetAllToday,
  onMoveUp,
  onMoveDown,
  onReorder,
  onAddNew,
  onOpenDua,
  hideVirtue = false,
  hideTitle = false,
}) => {
  const { language, t, formatNumber } = useLanguage();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      delay: 650,
      tolerance: 8,
    },
  });

  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  });

  const sensors = useSensors(pointerSensor, keyboardSensor);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    triggerHaptic(40);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = duas.findIndex((item) => item.id === active.id);
      const newIndex = duas.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(duas, oldIndex, newIndex);
        onReorder(reordered);
        triggerHaptic(50);
      }
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeDua = activeId ? duas.find((d) => d.id === activeId) : null;

  // Counts for smart tabs
  const completedCount = useMemo(() => {
    return duas.filter(
      (d) => todayLogs[d.id]?.completed || (todayLogs[d.id]?.count && todayLogs[d.id].count > 0)
    ).length;
  }, [duas, todayLogs]);

  const pendingCount = Math.max(0, duas.length - completedCount);

  // Filter duas by search query AND active tab
  const displayedDuas = useMemo(() => {
    return duas.filter((dua) => {
      // 1. Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = dua.title && dua.title.toLowerCase().includes(query);
        const matchesContent =
          dua.plainTextPreview && dua.plainTextPreview.toLowerCase().includes(query);
        if (!matchesTitle && !matchesContent) return false;
      }

      // 2. Tab filter
      const isDone = !!(
        todayLogs[dua.id]?.completed ||
        (todayLogs[dua.id]?.count && todayLogs[dua.id].count > 0)
      );

      if (activeTab === "pending") {
        return !isDone;
      }
      if (activeTab === "completed") {
        return isDone;
      }
      return true;
    });
  }, [duas, searchQuery, activeTab, todayLogs]);

  const isSearchActive = searchQuery.trim().length > 0;
  const isDndActive = !isSearchActive && activeTab === "all";

  // Empty State: No Duas at all in database
  if (duas.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#ffb31a]/10 border border-[#ffb31a]/25 flex items-center justify-center mb-4 text-[#ffb31a]">
          <BookPlus className="w-8 h-8" />
        </div>
        <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-1">
          {language === "bn" ? "এখনো কোনো দোয়া সংরক্ষিত নেই" : "No Duas Saved Yet"}
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mb-6 leading-relaxed">
          {t("emptyStateText")}
        </p>
        <button
          type="button"
          onClick={onAddNew}
          className="px-5 py-2.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-semibold shadow-md transition-all active:scale-95"
        >
          {t("addNewDua")}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4 pb-24">
      {/* Smart Status Filter Tabs (All | Pending | Completed) */}
      {!isSearchActive && (
        <div className="w-full grid grid-cols-3 gap-1.5 p-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-[18px] shadow-2xs">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(25);
              setActiveTab("all");
            }}
            className={`min-h-[44px] py-2 px-1.5 rounded-[14px] font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
              activeTab === "all"
                ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 shadow-xs scale-[1.01]"
                : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-white/50 dark:hover:bg-zinc-800/60"
            }`}
          >
            <span className="text-[13px] sm:text-[14px]">{t("allDuas")}</span>
            <span
              className={`font-mono text-[11px] sm:text-[12px] font-bold leading-none px-1.5 py-0.5 rounded-full ${
                activeTab === "all"
                  ? "bg-[#ffb31a]/20 text-[#c87d00] dark:text-[#ffb31a]"
                  : "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
              }`}
            >
              {formatNumber(duas.length)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(25);
              setActiveTab("pending");
            }}
            className={`min-h-[44px] py-2 px-1.5 rounded-[14px] font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
              activeTab === "pending"
                ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 shadow-xs scale-[1.01]"
                : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-white/50 dark:hover:bg-zinc-800/60"
            }`}
          >
            <span className="text-[13px] sm:text-[14px]">{t("pendingDuas")}</span>
            <span
              className={`font-mono text-[11px] sm:text-[12px] font-bold leading-none px-1.5 py-0.5 rounded-full ${
                activeTab === "pending"
                  ? "bg-[#ffb31a]/20 text-[#c87d00] dark:text-[#ffb31a]"
                  : "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
              }`}
            >
              {formatNumber(pendingCount)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(25);
              setActiveTab("completed");
            }}
            className={`min-h-[44px] py-2 px-1.5 rounded-[14px] font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
              activeTab === "completed"
                ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 shadow-xs scale-[1.01]"
                : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-white/50 dark:hover:bg-zinc-800/60"
            }`}
          >
            <span className="text-[13px] sm:text-[14px]">{t("completedDuas")}</span>
            <span
              className={`font-mono text-[11px] sm:text-[12px] font-bold leading-none px-1.5 py-0.5 rounded-full ${
                activeTab === "completed"
                  ? "bg-[#ffb31a]/20 text-[#c87d00] dark:text-[#ffb31a]"
                  : "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
              }`}
            >
              {formatNumber(completedCount)}
            </span>
          </button>
        </div>
      )}

      {/* Empty State: Search Results */}
      {isSearchActive && displayedDuas.length === 0 && (
        <div className="w-full flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 text-zinc-400">
            <SearchX className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-1">
            {t("noDuasFound")}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
            {language === "bn"
              ? `'${searchQuery}' দিয়ে কোনো সংরক্ষিত দোয়া খুঁজে পাওয়া যায়নি।`
              : `No saved duas matching '${searchQuery}'`}
          </p>
        </div>
      )}

      {/* Empty State: All Finished in "Pending" Tab */}
      {!isSearchActive && activeTab === "pending" && displayedDuas.length === 0 && (
        <div className="w-full flex flex-col items-center justify-center py-12 px-4 text-center bg-surface-card border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
            {language === "bn"
              ? "মাশাআল্লাহ! আজকের সকল দোয়া সম্পন্ন হয়েছে!"
              : "MashaAllah! All daily duas completed for today!"}
          </h2>
          <p className="text-xs text-zinc-500 max-w-xs mb-4">
            {language === "bn"
              ? "আজকের জন্য আর কোনো দোয়া বাকি নেই।"
              : "No more pending duas for today."}
          </p>
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-xl text-xs font-bold transition-colors"
          >
            {t("allDuas")}
          </button>
        </div>
      )}

      {/* Empty State: None Finished in "Completed" Tab */}
      {!isSearchActive && activeTab === "completed" && displayedDuas.length === 0 && (
        <div className="w-full flex flex-col items-center justify-center py-12 px-4 text-center bg-surface-card border border-zinc-200/80 dark:border-zinc-800 rounded-[20px] p-6 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-[#ffb31a]/10 text-[#c87d00] dark:text-[#ffb31a] flex items-center justify-center mb-3">
            <Clock className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
            {language === "bn"
              ? "আজকে এখনো কোনো দোয়া সম্পন্ন করা হয়নি"
              : "No duas completed yet today"}
          </h2>
          <p className="text-xs text-zinc-500 max-w-xs mb-4">
            {language === "bn"
              ? "দোয়া কার্ডে ক্লিক করে কাউন্ট যোগ করে আমল সম্পন্ন করুন।"
              : "Click a dua card badge to record your recitation count."}
          </p>
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className="min-h-[44px] px-4 py-2.5 bg-[#ffb31a] hover:bg-[#e69c05] text-zinc-950 rounded-[12px] text-xs font-bold transition-colors shadow-2xs"
          >
            {t("allDuas")}
          </button>
        </div>
      )}

      {/* List with Drag and Drop Support when on "all" tab */}
      {displayedDuas.length > 0 &&
        (isDndActive ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext
              items={duas.map((d) => d.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="w-full flex flex-col gap-4 touch-pan-y">
                {displayedDuas.map((dua, index) => (
                  <DuaCard
                    key={dua.id}
                    dua={dua}
                    todayLog={todayLogs[dua.id]}
                    orderIndex={index + 1}
                    onEdit={onEdit}
                    onOpen={onOpenDua}
                    onDeleteRequest={onDeleteRequest}
                    onToggleCompleted={onToggleCompleted}
                    onOpenCountModal={onOpenCountModal}
                    onQuickAddCount={onQuickAddCount}
                    onOpenAnalytics={onOpenAnalytics}
                    onMoveUp={onMoveUp}
                    onMoveDown={onMoveDown}
                    isFirst={index === 0}
                    isLast={index === displayedDuas.length - 1}
                    hideVirtue={hideVirtue}
                    hideTitle={hideTitle}
                  />
                ))}
              </div>
            </SortableContext>

            {/* Drag Overlay */}
            <DragOverlay
              dropAnimation={{ duration: 180, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}
            >
              {activeDua ? (
                <DuaCard
                  dua={activeDua}
                  todayLog={todayLogs[activeDua.id]}
                  onEdit={() => {}}
                  onDeleteRequest={() => {}}
                  isDragOverlay={true}
                  hideVirtue={hideVirtue}
                  hideTitle={hideTitle}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="w-full flex flex-col gap-4">
            {displayedDuas.map((dua, index) => (
              <DuaCard
                key={dua.id}
                dua={dua}
                todayLog={todayLogs[dua.id]}
                orderIndex={index + 1}
                onEdit={onEdit}
                onOpen={onOpenDua}
                onDeleteRequest={onDeleteRequest}
                onToggleCompleted={onToggleCompleted}
                onOpenCountModal={onOpenCountModal}
                onQuickAddCount={onQuickAddCount}
                onOpenAnalytics={onOpenAnalytics}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                isFirst={index === 0}
                isLast={index === displayedDuas.length - 1}
                hideVirtue={hideVirtue}
                hideTitle={hideTitle}
              />
            ))}
          </div>
        ))}

      {/* Bottom Action: Reset all completed cards */}
      {duas.length > 0 && onResetAllToday && (
        <div className="pt-4 pb-20 flex flex-col items-center w-full relative z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onResetAllToday();
            }}
            className="w-full sm:w-auto min-w-[200px] px-6 py-3.5 rounded-[16px] bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-500/20 dark:hover:bg-amber-400/20 text-zinc-900 dark:text-zinc-100 hover:text-[#c87d00] dark:hover:text-[#ffb31a] border border-zinc-300 dark:border-zinc-700 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all cursor-pointer select-none"
          >
            <RotateCcw className="w-4 h-4 text-[#ffb31a]" />
            <span>{t("resetAllButton")}</span>
          </button>
        </div>
      )}
    </div>
  );
};
