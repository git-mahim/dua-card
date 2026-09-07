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
import { LoginModal } from "@/components/LoginModal";
import { DuaRecord, DuaDailyLog } from "@/lib/types";
import {
  getAllDuas,
  ensureCoreDuas,
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
import {
  checkAuthStatus,
  triggerCloudSync,
  notifyDataChangedAndScheduleSync,
} from "@/lib/clientSync";
import { Plus } from "lucide-react";
import { JSONContent } from "@tiptap/react";

import { applyFontSizesToDOM, loadSavedFontSizes } from "@/lib/fontSize";
import { triggerHaptic } from "@/lib/haptics";
import { useLanguage } from "@/lib/i18n";

const HIDE_TITLE_STORAGE_KEY = "dua_card_hide_title_home";
const HIDE_VIRTUE_STORAGE_KEY = "dua_card_hide_virtue_home";

export default function HomePage() {
  const { language, t } = useLanguage();
  const [duas, setDuas] = useState<DuaRecord[]>([]);
  const [todayLogs, setTodayLogs] = useState<Record<string, DuaDailyLog>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Card view preferences (Hide title and virtue on home cards)
  const [hideTitleOnHome, setHideTitleOnHome] = useState(false);
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

  // Deletion modal state
  const [duaToDelete, setDuaToDelete] = useState<DuaRecord | null>(null);

  // Load saved preferences & font sizes
  useEffect(() => {
    if (typeof window !== "undefined") {
      applyFontSizesToDOM(loadSavedFontSizes());
      const savedTitle = localStorage.getItem(HIDE_TITLE_STORAGE_KEY);
      if (savedTitle === "true") {
        setHideTitleOnHome(true);
      }
      const savedVirtue = localStorage.getItem(HIDE_VIRTUE_STORAGE_KEY);
      if (savedVirtue === "true") {
        setHideVirtueOnHome(true);
      }
    }
  }, []);

  const handleToggleHideTitle = (enabled: boolean) => {
    setHideTitleOnHome(enabled);
    if (typeof window !== "undefined") {
      localStorage.setItem(HIDE_TITLE_STORAGE_KEY, enabled ? "true" : "false");
    }
  };

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

  // Fetch all duas from IndexedDB (with 5 core authentic duas guaranteed)
  const refreshDuas = useCallback(async () => {
    try {
      const list = await ensureCoreDuas();
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

    // Check cloud login status & sync if online
    checkAuthStatus().then((isAuth) => {
      if (isAuth && typeof navigator !== "undefined" && navigator.onLine) {
        triggerCloudSync();
      }
    });

    const handleResetTimeChange = () => {
      refreshLogs();
    };

    const handleCloudSyncRefresh = () => {
      refreshDuas();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("dua_daily_reset_time_changed", handleResetTimeChange);
      window.addEventListener("dua_data_synced_from_cloud", handleCloudSyncRefresh);
      window.addEventListener("focus", refreshLogs);
    }

    // Periodic check every 60 seconds to detect crossing the daily reset time threshold
    const timer = setInterval(() => {
      refreshLogs();
    }, 60 * 1000);

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("dua_daily_reset_time_changed", handleResetTimeChange);
        window.removeEventListener("dua_data_synced_from_cloud", handleCloudSyncRefresh);
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
    notifyDataChangedAndScheduleSync();
  };

  // Delete Dua
  const handleConfirmDelete = async () => {
    if (!duaToDelete) return;
    if (duaToDelete.isProtected) {
      setDuaToDelete(null);
      return;
    }
    await deleteDua(duaToDelete.id);
    if (activeReaderDua?.id === duaToDelete.id) {
      setActiveReaderDua(null);
    }
    setDuaToDelete(null);
    await refreshDuas();
    notifyDataChangedAndScheduleSync();
  };

  // Reorder Duas via drag-and-drop
  const handleReorder = async (newOrderedList: DuaRecord[]) => {
    setDuas(newOrderedList);
    const ids = newOrderedList.map((d) => d.id);
    await reorderDuas(ids);
    notifyDataChangedAndScheduleSync();
  };

  // Accessible Move Up
  const handleMoveUp = async (dua: DuaRecord) => {
    await moveDuaUp(dua.id);
    await refreshDuas();
    notifyDataChangedAndScheduleSync();
  };

  // Accessible Move Down
  const handleMoveDown = async (dua: DuaRecord) => {
    await moveDuaDown(dua.id);
    await refreshDuas();
    notifyDataChangedAndScheduleSync();
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
    notifyDataChangedAndScheduleSync();
  };

  // Quick Add Count (+100, etc.)
  const handleQuickAddCount = async (dua: DuaRecord, delta: number) => {
    await addDuaCount(dua.id, delta);
    await refreshLogs();
    notifyDataChangedAndScheduleSync();
  };

  // Set Count from Modal
  const handleSetCountFromModal = async (count: number) => {
    if (!activeCountDua) return;
    await setDuaCount(activeCountDua.id, count);
    await refreshLogs();
    notifyDataChangedAndScheduleSync();
  };

  // Add Count from Modal
  const handleAddCountFromModal = async (delta: number) => {
    if (!activeCountDua) return;
    await addDuaCount(activeCountDua.id, delta);
    await refreshLogs();
    notifyDataChangedAndScheduleSync();
  };

  // Instant Reset All Today's Completed Duas
  const handleResetAllToday = async () => {
    try {
      triggerHaptic(40);
      setTodayLogs({});
      await resetAllTodayLogs();
      await refreshLogs();
      notifyDataChangedAndScheduleSync();
    } catch (e) {
      console.error("Failed to reset today's logs:", e);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-[#ffb31a]/30 selection:text-zinc-900 dark:selection:text-zinc-100 transition-colors duration-200">
      {/* Sticky Header */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
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
            onResetAllToday={handleResetAllToday}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onReorder={handleReorder}
            onAddNew={handleOpenCreate}
            hideVirtue={hideVirtueOnHome}
            hideTitle={hideTitleOnHome}
          />
        )}
      </main>

      {/* Floating Action Button (FAB) for Adding Dua */}
      <div className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] right-5 sm:right-6 z-20">
        <button
          type="button"
          onClick={handleOpenCreate}
          aria-label={t("addNewDua")}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#ff9f00] to-[#ffc247] hover:from-[#e68e00] hover:to-[#ffb31a] text-zinc-950 font-bold shadow-lg shadow-[#ffb31a]/30 hover:shadow-xl hover:shadow-[#ffb31a]/40 flex items-center justify-center active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-[#ffb31a]/30"
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
        hideTitleOnHome={hideTitleOnHome}
        onToggleHideTitle={handleToggleHideTitle}
        hideVirtueOnHome={hideVirtueOnHome}
        onToggleHideVirtue={handleToggleHideVirtue}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      {/* Cloud Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={refreshDuas}
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
        title={t("confirmDeleteTitle")}
        description={
          language === "bn"
            ? `"${duaToDelete?.title || "এই দোয়াটি"}" আপনার তালিকা থেকে স্থায়ীভাবে মুছে যাবে।`
            : `"${duaToDelete?.title || "This dua"}" will be permanently removed from your collection.`
        }
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDuaToDelete(null)}
        isDestructive={true}
      />
    </div>
  );
}
