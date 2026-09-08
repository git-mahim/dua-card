"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  fetchAllDuasAnalytics,
  exportAnalyticsToCsv,
  OverallAnalyticsSummary,
  DuaOverallStatItem,
} from "@/lib/analytics";
import { triggerHaptic } from "@/lib/haptics";
import { useLanguage } from "@/lib/i18n";
import {
  ArrowLeft,
  BarChart3,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Search,
  TrendingUp,
  Award,
  BookOpen,
} from "lucide-react";

interface DuaAnalyticsSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDua?: (duaId: string) => void;
}

export const DuaAnalyticsSheetModal: React.FC<DuaAnalyticsSheetModalProps> = ({
  isOpen,
  onClose,
  onSelectDua,
}) => {
  const { language, t, formatNumber } = useLanguage();
  const [data, setData] = useState<OverallAnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<"all" | "most_read" | "unread" | "streak">("all");
  const containerRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const summary = await fetchAllDuasAnalytics();
      setData(summary);
    } catch (err) {
      console.error("Failed to load overall analytics data", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadData();
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: "instant" });
      }
    }
  }, [isOpen, loadData]);

  // Lock background scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isOpen]);

  // Filtered Dua Items for the Sheet Table
  const filteredItems = useMemo(() => {
    if (!data) return [];
    let list = [...data.items];

    // Filter tab
    if (activeFilter === "most_read") {
      list = list.filter((i) => i.statusCategory === "most_read");
    } else if (activeFilter === "unread") {
      list = list.filter((i) => i.statusCategory === "unread");
    } else if (activeFilter === "streak") {
      list = list.filter((i) => i.streakDays > 0);
    }

    // Search query filter (search both pronunciation and title)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) => i.pronunciation.toLowerCase().includes(q) || i.title.toLowerCase().includes(q)
      );
    }

    return list;
  }, [data, activeFilter, searchQuery]);

  const handleExportCsv = () => {
    if (!data || data.items.length === 0) return;
    triggerHaptic(40);
    exportAnalyticsToCsv(data.items);
  };

  const handleClose = () => {
    triggerHaptic(20);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-background text-foreground flex flex-col w-full max-w-full overflow-x-hidden overflow-y-auto overscroll-x-none touch-pan-y animate-in fade-in duration-150 font-bengali"
    >
      {/* Sticky Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-xl border-b border-zinc-200/80 dark:border-zinc-800/80 shrink-0 px-4 py-3 w-full max-w-full shadow-2xs">
        <div className="max-w-xl mx-auto w-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <button
              type="button"
              onClick={handleClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200/80 dark:border-zinc-700 transition-all active:scale-95 shrink-0 shadow-2xs"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-[11px] bg-[#ffb31a]/15 text-[#c87d00] dark:text-[#ffb31a] flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 truncate">
                {language === "bn" ? "আমল শিট ও গ্রাফ বিশ্লেষণ" : "Recitation Analytics & Sheet"}
              </h1>
              <p className="text-[11px] text-zinc-500 truncate">
                {language === "bn"
                  ? "দোয়ার উচ্চারণ অনুযায়ী পাঠের পরিসংখ্যান ও এক্সেল রিপোর্ট"
                  : "Track read vs unread duas & export Excel report"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!data || data.items.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ffb31a] hover:bg-[#e69c05] text-zinc-950 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-2xs shrink-0"
            title={language === "bn" ? "এক্সেল (CSV) শিট ডাউনলোড করুন" : "Export Excel (CSV) Sheet"}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">{language === "bn" ? "এক্সেল শিট" : "Export Sheet"}</span>
          </button>
        </div>
      </header>

      {/* Main Body Content */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-4 pb-28 flex flex-col gap-4">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#ffb31a] border-t-transparent animate-spin" />
            <p className="text-xs text-zinc-500 font-medium">
              {language === "bn" ? "আমল ডেটা বিশ্লেষণ করা হচ্ছে..." : "Loading analytics sheet..."}
            </p>
          </div>
        ) : !data ? (
          <div className="py-16 text-center text-xs text-zinc-500">
            {language === "bn" ? "কোনো ডেটা পাওয়া যায়নি।" : "No data available."}
          </div>
        ) : (
          <>
            {/* Top 4 Summary Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Total Recitations */}
              <div className="p-3 bg-white dark:bg-[#181818] border border-zinc-200/80 dark:border-zinc-800 rounded-[18px] shadow-2xs flex flex-col gap-1">
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span className="text-[11px] font-semibold">
                    {language === "bn" ? "মোট পাঠ" : "Total Recited"}
                  </span>
                  <BookOpen className="w-3.5 h-3.5 text-[#ffb31a]" />
                </div>
                <span className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 font-mono">
                  {formatNumber(data.totalRecitations)}
                </span>
                <span className="text-[10px] text-zinc-400">
                  {language === "bn" ? "সর্বমোট পঠিত" : "Total times read"}
                </span>
              </div>

              {/* Active Duas */}
              <div className="p-3 bg-white dark:bg-[#181818] border border-zinc-200/80 dark:border-zinc-800 rounded-[18px] shadow-2xs flex flex-col gap-1">
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span className="text-[11px] font-semibold">
                    {language === "bn" ? "পঠিত দোয়া" : "Active Duas"}
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatNumber(data.activeDuasCount)} / {formatNumber(data.totalDuasCount)}
                </span>
                <span className="text-[10px] text-zinc-400">
                  {language === "bn" ? "অন্তত একবার পড়া হয়েছে" : "Read at least once"}
                </span>
              </div>

              {/* Unread Duas */}
              <div className="p-3 bg-white dark:bg-[#181818] border border-zinc-200/80 dark:border-zinc-800 rounded-[18px] shadow-2xs flex flex-col gap-1">
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span className="text-[11px] font-semibold">
                    {language === "bn" ? "অপঠিত দোয়া" : "Unread Duas"}
                  </span>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                  {formatNumber(data.unreadDuasCount)}
                </span>
                <span className="text-[10px] text-zinc-400">
                  {language === "bn" ? "পড়া শুরু হয়নি" : "Never read yet"}
                </span>
              </div>

              {/* Top Dua */}
              <div className="p-3 bg-white dark:bg-[#181818] border border-zinc-200/80 dark:border-zinc-800 rounded-[18px] shadow-2xs flex flex-col gap-1">
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span className="text-[11px] font-semibold truncate">
                    {language === "bn" ? "সেরা দোয়া" : "Top Dua"}
                  </span>
                  <Award className="w-3.5 h-3.5 text-[#ffb31a]" />
                </div>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {data.topDua ? data.topDua.pronunciation || data.topDua.title : language === "bn" ? "নেই" : "N/A"}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {data.topDua
                    ? `${formatNumber(data.topDua.totalCount)} ${language === "bn" ? "বার" : "times"}`
                    : "-"}
                </span>
              </div>
            </div>

            {/* Smart Graph Section: Top 5 Most Recited Duas */}
            <section className="p-4 bg-white dark:bg-[#181818] border border-zinc-200/80 dark:border-zinc-800 rounded-[22px] shadow-2xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#ffb31a]/15 text-[#c87d00] dark:text-[#ffb31a] flex items-center justify-center shrink-0">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    {language === "bn" ? "🔥 সবচেয়ে বেশি পঠিত শীর্ষ দোয়া (উচ্চারণ)" : "🔥 Top Recited Duas"}
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-zinc-400">
                  {language === "bn" ? "শীর্ষ ৫টি" : "Top 5"}
                </span>
              </div>

              {data.top5Duas.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-4">
                  {language === "bn"
                    ? "এখনও কোনো দোয়ার আমল রেকর্ড করা হয়নি।"
                    : "No dua recitation records found yet."}
                </p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {data.top5Duas.map((item, index) => {
                    const maxCount = data.top5Duas[0].totalCount || 1;
                    const percent = Math.min(100, Math.round((item.totalCount / maxCount) * 100));

                    return (
                      <div
                        key={item.dua.id}
                        onClick={() => {
                          if (onSelectDua) {
                            triggerHaptic(20);
                            onSelectDua(item.dua.id);
                          }
                        }}
                        className={`flex flex-col gap-1.5 p-2.5 bg-zinc-50 dark:bg-zinc-900/60 rounded-[14px] border border-zinc-200/50 dark:border-zinc-800/80 transition-all ${
                          onSelectDua ? "cursor-pointer hover:border-amber-500/40 active:scale-[0.99]" : ""
                        }`}
                        title={language === "bn" ? "বিস্তারিত হিস্ট্রি ও গ্রাফ দেখুন" : "View detailed history"}
                      >
                        <div className="flex items-center justify-between text-xs gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-[#ffb31a]/20 text-[#c87d00] dark:text-[#ffb31a] font-bold text-[10px] flex items-center justify-center shrink-0">
                              #{index + 1}
                            </span>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate text-xs">
                              {item.pronunciation || item.title}
                            </span>
                          </div>
                          <span className="font-bold text-zinc-900 dark:text-[#ffb31a] font-mono shrink-0">
                            {formatNumber(item.totalCount)} {language === "bn" ? "বার" : "times"}
                          </span>
                        </div>

                        {/* Bar Meter */}
                        <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#ffb31a] to-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>



            {/* Interactive Sheet / Table Section */}
            <section className="p-4 bg-white dark:bg-[#181818] border border-zinc-200/80 dark:border-zinc-800 rounded-[22px] shadow-2xs flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#ffb31a]/15 text-[#c87d00] dark:text-[#ffb31a] flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    {language === "bn" ? "আমল শিট তালিকা (উচ্চারণ)" : "Recitation Sheet Table"}
                  </h3>
                </div>

                <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 font-mono">
                  {formatNumber(filteredItems.length)} {language === "bn" ? "টি দোয়া" : "items"}
                </span>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      language === "bn" ? "দোয়ার উচ্চারণ বা শিরোনাম দিয়ে খুঁজুন..." : "Search by dua pronunciation or title..."
                    }
                    className="w-full pl-8 pr-3 py-2 text-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-[#ffb31a]/40 text-zinc-900 dark:text-zinc-100 transition-all"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {[
                    { id: "all", label: language === "bn" ? "সব দোয়া" : "All" },
                    { id: "most_read", label: language === "bn" ? "🔥 বেশি পঠিত" : "🔥 Most Read" },
                    { id: "unread", label: language === "bn" ? "⚠️ অপঠিত" : "⚠️ Unread" },
                    { id: "streak", label: language === "bn" ? "⚡ নিয়মিত" : "⚡ Streak" },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic(15);
                        setActiveFilter(filter.id as any);
                      }}
                      className={`py-1 px-2.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all active:scale-95 ${
                        activeFilter === filter.id
                          ? "bg-[#ffb31a] text-zinc-950 shadow-2xs"
                          : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200/60 dark:border-zinc-800"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table / List View */}
              {filteredItems.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-6">
                  {language === "bn" ? "কোনো দোয়া মেলেনি।" : "No duas matched your search."}
                </p>
              ) : (
                <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {filteredItems.map((item, idx) => (
                    <div
                      key={item.dua.id}
                      onClick={() => {
                        if (onSelectDua) {
                          triggerHaptic(20);
                          onSelectDua(item.dua.id);
                        }
                      }}
                      className={`py-2.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 px-1.5 rounded-xl transition-all ${
                        onSelectDua ? "cursor-pointer active:scale-[0.99] hover:bg-[#ffb31a]/10 dark:hover:bg-[#ffb31a]/10" : ""
                      }`}
                      title={language === "bn" ? "বিস্তারিত হিস্ট্রি ও গ্রাফ দেখুন" : "View detailed history"}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-zinc-400 font-mono w-5 shrink-0 text-center">
                          #{idx + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          {/* Main Text: Pronunciation */}
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {item.pronunciation || item.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                            <span>
                              {language === "bn" ? "আজ:" : "Today:"}{" "}
                              <strong className="text-zinc-800 dark:text-zinc-200 font-mono">
                                {formatNumber(item.todayCount)}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              {language === "bn" ? "সপ্তাহে:" : "Week:"}{" "}
                              <strong className="text-zinc-800 dark:text-zinc-200 font-mono">
                                {formatNumber(item.thisWeekCount)}
                              </strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Count & Status Badge */}
                      <div className="flex flex-col items-end shrink-0 gap-1">
                        <span className="text-xs font-bold text-zinc-900 dark:text-[#ffb31a] font-mono">
                          {formatNumber(item.totalCount)} {language === "bn" ? "বার" : "times"}
                        </span>

                        {item.statusCategory === "most_read" ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">
                            {language === "bn" ? "বেশি পঠিত" : "Most Read"}
                          </span>
                        ) : item.statusCategory === "unread" ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9px] font-bold">
                            {language === "bn" ? "অপঠিত" : "Unread"}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[9px] font-medium">
                            {language === "bn" ? "পঠিত" : "Read"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Excel Download Banner Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={!data || data.items.length === 0}
                className="w-full min-h-[46px] py-3 px-4 bg-[#ffb31a] hover:bg-[#e69c05] text-zinc-950 font-bold text-xs rounded-[16px] shadow-2xs flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                <FileSpreadsheet className="w-4 h-4 text-zinc-950 shrink-0" />
                <span>
                  {language === "bn"
                    ? "সম্পূর্ণ আমল রিপোর্ট এক্সেল (CSV) ফাইলে ডাউনলোড করুন"
                    : "Download Full Recitation Report as Excel (CSV)"}
                </span>
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
