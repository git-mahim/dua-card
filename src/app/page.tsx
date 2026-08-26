"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { DuaList } from "@/components/DuaList";
import { DuaReaderModal } from "@/components/DuaReaderModal";
import { DuaEditorModal } from "@/components/DuaEditorModal";
import { DuaCountModal } from "@/components/DuaCountModal";
import { DuaAnalyticsModal } from "@/components/DuaAnalyticsModal";
import { SettingsModal } from "@/components/SettingsModal";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { DuaExportModal } from "@/components/DuaExportModal";
import { DuaRecord, DuaDailyLog } from "@/lib/types";
import {
  getAllDuas,
  createDua,
  updateDua,
  deleteDua,
  reorderDuas,
  clearDatabase,
  moveDuaUp,
  moveDuaDown,
  getAllTodayLogs,
  toggleTodayCompleted,
  resetAllTodayLogs,
  addDuaCount,
  setDuaCount,
} from "@/lib/db";
import { Plus } from "lucide-react";
import { JSONContent } from "@tiptap/react";

import { applyFontSizesToDOM, loadSavedFontSizes } from "@/lib/fontSize";

const HIDE_VIRTUE_STORAGE_KEY = "dua_card_hide_virtue_home";

export default function HomePage() {
  const [duas, setDuas] = useState<DuaRecord[]>([]);
  const [todayLogs, setTodayLogs] = useState<Record<string, DuaDailyLog>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Card view preferences (Hide virtue on home cards)
  const [hideVirtueOnHome, setHideVirtueOnHome] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Modals state
  const [activeReaderDua, setActiveReaderDua] = useState<DuaRecord | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingDua, setEditingDua] = useState<DuaRecord | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Habit Tracker & Export Modals
  const [activeCountDua, setActiveCountDua] = useState<DuaRecord | null>(null);
  const [activeAnalyticsDua, setActiveAnalyticsDua] = useState<DuaRecord | null>(null);
  const [activeExportDua, setActiveExportDua] = useState<DuaRecord | null>(null);

  // Deletion and Reset modal state
  const [duaToDelete, setDuaToDelete] = useState<DuaRecord | null>(null);
  const [isResetTodayConfirmOpen, setIsResetTodayConfirmOpen] = useState(false);

  // Load saved preferences & font sizes
  useEffect(() => {
    if (typeof window !== "undefined") {
      applyFontSizesToDOM(loadSavedFontSizes());
      const saved = localStorage.getItem(HIDE_VIRTUE_STORAGE_KEY);
      if (saved === "true") {
        setHideVirtueOnHome(true);
      }
    }
  }, []);

  const handleToggleHideVirtue = (enabled: boolean) => {
    setHideVirtueOnHome(enabled);
    if (typeof window !== "undefined") {
      localStorage.setItem(HIDE_VIRTUE_STORAGE_KEY, enabled ? "true" : "false");
    }
  };

  // Fetch today's habit logs
  const refreshLogs = useCallback(async () => {
    try {
      const logs = await getAllTodayLogs();
      setTodayLogs(logs);
    } catch (err) {
      console.error("Failed to load today logs:", err);
    }
  }, []);

  // Fetch all duas from IndexedDB
  const refreshDuas = useCallback(async () => {
    try {
      let list = await getAllDuas();
      if (
        list.length === 0 &&
        typeof window !== "undefined" &&
        !localStorage.getItem("dua_card_cleared_v1")
      ) {
        const { INITIAL_DEMO_DUAS } = await import("@/lib/seedData");
        const { replaceAllDuas } = await import("@/lib/db");
        await replaceAllDuas(INITIAL_DEMO_DUAS);
        list = INITIAL_DEMO_DUAS;
      }
      setDuas(list);
      await refreshLogs();
    } catch (err) {
      console.error("Failed to load duas:", err);
    } finally {
      setIsLoading(false);
    }
  }, [refreshLogs]);

  useEffect(() => {
    refreshDuas();

    const handleResetTimeChange = () => {
      refreshLogs();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("dua_daily_reset_time_changed", handleResetTimeChange);
      window.addEventListener("focus", refreshLogs);
    }

    // Periodic check every 60 seconds to detect crossing the daily reset time threshold
    const timer = setInterval(() => {
      refreshLogs();
    }, 60 * 1000);

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("dua_daily_reset_time_changed", handleResetTimeChange);
        window.removeEventListener("focus", refreshLogs);
      }
      clearInterval(timer);
    };
  }, [refreshDuas, refreshLogs]);

  // Create or Update Dua
  const handleSaveDua = async (data: {
    richTextContent: JSONContent;
    plainTextPreview: string;
    title: string;
  }) => {
    if (editingDua) {
      // Update existing
      await updateDua(editingDua.id, {
        richTextContent: data.richTextContent,
        plainTextPreview: data.plainTextPreview,
        title: data.title,
      });
      if (activeReaderDua && activeReaderDua.id === editingDua.id) {
        setActiveReaderDua((prev) =>
          prev
            ? {
                ...prev,
                richTextContent: data.richTextContent,
                plainTextPreview: data.plainTextPreview,
                title: data.title,
                updatedAt: Date.now(),
              }
            : null
        );
      }
    } else {
      // Create new (defaults to top)
      await createDua({
        richTextContent: data.richTextContent,
        plainTextPreview: data.plainTextPreview,
        title: data.title,
      });
    }
    await refreshDuas();
  };

  // Delete Dua
  const handleConfirmDelete = async () => {
    if (!duaToDelete) return;
    await deleteDua(duaToDelete.id);
    if (activeReaderDua?.id === duaToDelete.id) {
      setActiveReaderDua(null);
    }
    setDuaToDelete(null);
    await refreshDuas();
  };

  // Reorder Duas via drag-and-drop
  const handleReorder = async (newOrderedList: DuaRecord[]) => {
    setDuas(newOrderedList);
    const ids = newOrderedList.map((d) => d.id);
    await reorderDuas(ids);
  };

  // Accessible Move Up
  const handleMoveUp = async (dua: DuaRecord) => {
    await moveDuaUp(dua.id);
    await refreshDuas();
  };

  // Accessible Move Down
  const handleMoveDown = async (dua: DuaRecord) => {
    await moveDuaDown(dua.id);
    await refreshDuas();
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingDua(null);
    setIsEditorOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (dua: DuaRecord) => {
    setEditingDua(dua);
    setIsEditorOpen(true);
  };

  // Instagram-style Double Tap Toggle Completed
  const handleToggleCompleted = async (dua: DuaRecord) => {
    await toggleTodayCompleted(dua.id);
    await refreshLogs();
  };

  // Quick Add Count (+100, etc.)
  const handleQuickAddCount = async (dua: DuaRecord, delta: number) => {
    await addDuaCount(dua.id, delta);
    await refreshLogs();
  };

  // Set Count from Modal
  const handleSetCountFromModal = async (count: number) => {
    if (!activeCountDua) return;
    await setDuaCount(activeCountDua.id, count);
    await refreshLogs();
  };

  // Add Count from Modal
  const handleAddCountFromModal = async (delta: number) => {
    if (!activeCountDua) return;
    await addDuaCount(activeCountDua.id, delta);
    await refreshLogs();
  };

  // Reset All Today's Completed Duas
  const handleConfirmResetAllToday = async () => {
    try {
      await resetAllTodayLogs();
      triggerHaptic(40);
      await refreshLogs();
    } catch (e) {
      console.error("Failed to reset today's logs:", e);
    } finally {
      setIsResetTodayConfirmOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-[#ffb31a]/30 selection:text-zinc-900 dark:selection:text-zinc-100 transition-colors duration-200">
      {/* Sticky Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSearchOpen={isSearchOpen}
        onToggleSearch={() => {
          setIsSearchOpen(!isSearchOpen);
          if (isSearchOpen) setSearchQuery("");
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-3 pb-20">

        {isLoading ? (
          <div className="w-full flex justify-center items-center py-24">
            <div className="w-6 h-6 border-2 border-[#ffb31a] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <DuaList
            duas={duas}
            todayLogs={todayLogs}
            searchQuery={searchQuery}
            onEdit={handleOpenEdit}
            onDeleteRequest={(dua) => setDuaToDelete(dua)}
            onToggleCompleted={handleToggleCompleted}
            onOpenCountModal={(dua) => setActiveCountDua(dua)}
            onQuickAddCount={handleQuickAddCount}
            onOpenAnalytics={(dua) => setActiveAnalyticsDua(dua)}
            onExportImage={(dua) => setActiveExportDua(dua)}
            onResetAllToday={() => setIsResetTodayConfirmOpen(true)}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onReorder={handleReorder}
            onAddNew={handleOpenCreate}
            hideVirtue={hideVirtueOnHome}
          />
        )}
      </main>

      {/* Floating Action Button (FAB) for Adding Dua */}
      <div className="fixed bottom-6 right-6 z-20">
        <button
          type="button"
          onClick={handleOpenCreate}
          aria-label="নতুন দোয়া যোগ করুন"
          className="w-14 h-14 rounded-full bg-[#ffb31a] hover:bg-[#e69c05] text-zinc-950 font-bold shadow-lg shadow-[#ffb31a]/25 flex items-center justify-center active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-[#ffb31a]/30"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Full-Screen Dua Reader Modal */}
      <DuaReaderModal
        dua={activeReaderDua}
        isOpen={!!activeReaderDua}
        onClose={() => setActiveReaderDua(null)}
        onEdit={(dua) => handleOpenEdit(dua)}
        onDeleteRequest={(dua) => setDuaToDelete(dua)}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
      />

      {/* Dua Editor Modal (Create / Edit) */}
      <DuaEditorModal
        dua={editingDua}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingDua(null);
        }}
        onSave={handleSaveDua}
      />

      {/* Quick Count Modal */}
      <DuaCountModal
        isOpen={!!activeCountDua}
        dua={activeCountDua}
        currentCount={activeCountDua ? todayLogs[activeCountDua.id]?.count || 0 : 0}
        onClose={() => setActiveCountDua(null)}
        onAddCount={handleAddCountFromModal}
        onSetCount={handleSetCountFromModal}
      />

      {/* Habit Analytics & Streak History Modal */}
      <DuaAnalyticsModal
        isOpen={!!activeAnalyticsDua}
        dua={activeAnalyticsDua}
        onClose={() => setActiveAnalyticsDua(null)}
        onDataChanged={refreshLogs}
      />

      {/* Settings & Backup/Restore Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onDataChanged={refreshDuas}
        onClearAllData={clearDatabase}
        totalDuasCount={duas.length}
        hideVirtueOnHome={hideVirtueOnHome}
        onToggleHideVirtue={handleToggleHideVirtue}
      />

      {/* Dua Image Export & Share Modal */}
      <DuaExportModal
        dua={activeExportDua}
        isOpen={!!activeExportDua}
        onClose={() => setActiveExportDua(null)}
      />

      {/* Delete Single Dua Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!duaToDelete}
        title="দোয়াটি মুছে ফেলবেন?"
        description={`"${duaToDelete?.title || "এই দোয়াটি"}" আপনার তালিকা থেকে স্থায়ীভাবে মুছে যাবে।`}
        confirmLabel="মুছে ফেলুন"
        cancelLabel="বাতিল"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDuaToDelete(null)}
        isDestructive={true}
      />

      {/* Reset All Today's Completed Duas Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isResetTodayConfirmOpen}
        title="আজকের সকল আমল রিসেট করবেন?"
        description="আজকের জন্য সম্পন্ন হওয়া এবং পাঠ করা সকল দোয়া আবার নতুন করে পড়ার জন্য আনচেক হয়ে যাবে।"
        confirmLabel="হ্যাঁ, আনচেক করুন"
        cancelLabel="বাতিল"
        isDestructive={false}
        iconType="reset"
        onConfirm={handleConfirmResetAllToday}
        onCancel={() => setIsResetTodayConfirmOpen(false)}
      />
    </div>
  );
}
