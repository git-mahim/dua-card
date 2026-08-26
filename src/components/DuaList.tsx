"use client";

import React, { useState } from "react";
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
import { BookPlus, SearchX } from "lucide-react";

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

  // Filter duas by search query across title, pronunciation, and meaning
  const filteredDuas = duas.filter((dua) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();

    if (dua.title && dua.title.toLowerCase().includes(query)) return true;
    if (dua.plainTextPreview && dua.plainTextPreview.toLowerCase().includes(query))
      return true;

    return false;
  });

  // Is dragging enabled only when not searching
  const isSearchActive = searchQuery.trim().length > 0;

  // Empty State: No Duas at all
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

  // Empty State: No search results found
  if (filteredDuas.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 text-zinc-400">
          <SearchX className="w-7 h-7" />
        </div>
        <h2 className="text-base font-bold font-bengali text-zinc-800 dark:text-zinc-200 mb-1">
          কোনো ফলাফল পাওয়া যায়নি
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bengali max-w-xs">
          &apos;{searchQuery}&apos; দিয়ে কোনো সংরক্ষিত দোয়া বা উচ্চারণ খুঁজে পাওয়া যায়নি।
        </p>
      </div>
    );
  }

  // When search is active, disable dragging to prevent index confusion
  if (isSearchActive) {
    return (
      <div className="w-full flex flex-col gap-3 pb-24">
        {filteredDuas.map((dua, index) => (
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
            isLast={index === filteredDuas.length - 1}
            hideVirtue={hideVirtue}
          />
        ))}
      </div>
    );
  }

  return (
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
        <div className="w-full flex flex-col gap-3 pb-24 touch-pan-y">
          {duas.map((dua, index) => (
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
              isLast={index === duas.length - 1}
              hideVirtue={hideVirtue}
            />
          ))}
        </div>
      </SortableContext>

      {/* Drag Overlay: Fluid lifted card following finger/mouse without document jump */}
      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
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
  );
};
