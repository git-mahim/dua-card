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
import { toBengaliNumber } from "@/lib/formatters";
import { triggerHaptic } from "@/lib/haptics";
import { BookPlus, SearchX, CheckCircle2, Clock } from "lucide-react";

interface DuaListProps {
  duas: DuaRecord[];
  todayLogs: Record<string, DuaDailyLog>;
  searchQuery: string;
  onEdit: (dua: DuaRecord) => void;
  onDeleteRequest: (dua: DuaRecord) => void;
  onToggleCompleted: (dua: DuaRecord) => void;
  onOpenCountModal: (dua: DuaRecord) => void;
  onQuickAddCount: (dua: DuaRecord, delta: number) => void;
  onOpenAnalytics: (dua: DuaRecord) => void;
  onMoveUp: (dua: DuaRecord) => void;
  onMoveDown: (dua: DuaRecord) => void;
  onReorder: (newOrderedList: DuaRecord[]) => void;
  onAddNew: () => void;
  onOpenDua?: (dua: DuaRecord) => void;
  hideVirtue?: boolean;
}

type TabFilter = "all" | "pending" | "completed";

export const DuaList: React.FC<DuaListProps> = ({
  duas,
  todayLogs,
  searchQuery,
  onEdit,
  onDeleteRequest,
  onToggleCompleted,
  onOpenCountModal,
  onQuickAddCount,
  onOpenAnalytics,
  onMoveUp,
  onMoveDown,
  onReorder,
  onAddNew,
  onOpenDua,
  hideVirtue = false,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");

  // PointerSensor with responsive 250ms press delay and 5px tolerance
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  });

  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  });

  const sensors = useSensors(pointerSensor, keyboardSensor);

  // Handle Drag Start: Provide distinct haptic tick on lift
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    triggerHaptic(40);
  };

  // Handle Drag End: Reorder list and trigger settle haptic
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
        <h2 className="text-base font-bold font-bengali text-zinc-800 dark:text-zinc-200 mb-1">
          এখনো কোনো দোয়া সংরক্ষিত নেই
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bengali max-w-xs mb-6 leading-relaxed">
          আপনার পছন্দসই দোয়া সংরক্ষণ করতে নিচে &apos;+&apos; বাটনে অথবা এখানে চাপুন।
        </p>
        <button
          type="button"
          onClick={onAddNew}
          className="px-5 py-2.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-semibold font-bengali shadow-md transition-all active:scale-95"
        >
          নতুন দোয়া যোগ করুন
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3 pb-24">
      {/* Smart Status Filter Tabs (সকল দোয়া | বাকি দোয়া | পড়েছি) */}
      {!isSearchActive && (
        <div className="w-full grid grid-cols-3 gap-1.5 p-1.5 bg-surface-card border border-zinc-200/90 dark:border-zinc-800/90 rounded-2xl shadow-xs text-xs font-bengali">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(25);
              setActiveTab("all");
            }}
            className={`py-2.5 sm:py-3 px-2 rounded-xl font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
              activeTab === "all"
                ? "bg-[#ffb31a] text-zinc-950 shadow-xs scale-[1.01]"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60"
            }`}
          >
            <span>সকল দোয়া</span>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold leading-none translate-y-[0.5px] ${
                activeTab === "all"
                  ? "bg-black/15 text-zinc-950"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/60"
              }`}
            >
              {toBengaliNumber(duas.length)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(25);
              setActiveTab("pending");
            }}
            className={`py-2.5 sm:py-3 px-2 rounded-xl font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
              activeTab === "pending"
                ? "bg-[#ffb31a] text-zinc-950 shadow-xs scale-[1.01]"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60"
            }`}
          >
            <span>বাকি দোয়া</span>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold leading-none translate-y-[0.5px] ${
                activeTab === "pending"
                  ? "bg-black/15 text-zinc-950"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/60"
              }`}
            >
              {toBengaliNumber(pendingCount)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(25);
              setActiveTab("completed");
            }}
            className={`py-2.5 sm:py-3 px-2 rounded-xl font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
              activeTab === "completed"
                ? "bg-[#ffb31a] text-zinc-950 shadow-xs scale-[1.01]"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60"
            }`}
          >
            <span>পড়েছি</span>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold leading-none translate-y-[0.5px] ${
                activeTab === "completed"
                  ? "bg-black/15 text-zinc-950"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/60"
              }`}
            >
              {toBengaliNumber(completedCount)}
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
          <h2 className="text-base font-bold font-bengali text-zinc-800 dark:text-zinc-200 mb-1">
            কোনো ফলাফল পাওয়া যায়নি
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bengali max-w-xs">
            &apos;{searchQuery}&apos; দিয়ে কোনো সংরক্ষিত দোয়া খুঁজে পাওয়া যায়নি।
          </p>
        </div>
      )}

      {/* Empty State: All Finished in "Pending" Tab */}
      {!isSearchActive && activeTab === "pending" && displayedDuas.length === 0 && (
        <div className="w-full flex flex-col items-center justify-center py-12 px-4 text-center bg-surface-card border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h2 className="text-base font-bold font-bengali text-zinc-900 dark:text-zinc-100 mb-1">
            মাশাআল্লাহ! আজকের সকল দোয়া সম্পন্ন হয়েছে!
          </h2>
          <p className="text-xs text-zinc-500 font-bengali max-w-xs mb-4">
            আজকের জন্য আর কোনো দোয়া বাকি নেই। সব দোয়া দেখতে নিচের বাটনে চাপুন।
          </p>
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-xl text-xs font-bold font-bengali transition-colors"
          >
            সকল দোয়া দেখুন
          </button>
        </div>
      )}

      {/* Empty State: None Finished in "Completed" Tab */}
      {!isSearchActive && activeTab === "completed" && displayedDuas.length === 0 && (
        <div className="w-full flex flex-col items-center justify-center py-12 px-4 text-center bg-surface-card border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-[#ffb31a]/10 text-[#c87d00] dark:text-[#ffb31a] flex items-center justify-center mb-3">
            <Clock className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h2 className="text-base font-bold font-bengali text-zinc-900 dark:text-zinc-100 mb-1">
            আজকে এখনো কোনো দোয়া সম্পন্ন করা হয়নি
          </h2>
          <p className="text-xs text-zinc-500 font-bengali max-w-xs mb-4">
            দোয়া কার্ডে ডাবল ট্যাপ করে অথবা কাউন্ট যোগ করে আমল সম্পন্ন করুন।
          </p>
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className="px-4 py-2 bg-[#ffb31a] hover:bg-[#e69c05] text-zinc-950 rounded-xl text-xs font-bold font-bengali transition-colors shadow-2xs"
          >
            দোয়ার তালিকা দেখুন
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
              <div className="w-full flex flex-col gap-3 touch-pan-y">
                {displayedDuas.map((dua, index) => (
                  <DuaCard
                    key={dua.id}
                    dua={dua}
                    todayLog={todayLogs[dua.id]}
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
                  />
                ))}
              </div>
            </SortableContext>

            {/* Drag Overlay: Fluid lifted card following finger/mouse without document jump */}
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
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="w-full flex flex-col gap-3">
            {displayedDuas.map((dua, index) => (
              <DuaCard
                key={dua.id}
                dua={dua}
                todayLog={todayLogs[dua.id]}
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
              />
            ))}
          </div>
        ))}
    </div>
  );
};
