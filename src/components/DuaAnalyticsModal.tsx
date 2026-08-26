"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { DuaRecord, DuaDailyLog, DuaAggregatedStats } from "@/lib/types";
import { getDuaAggregatedStats, setDuaCount, getLocalDateString } from "@/lib/db";
import { toBengaliNumber, formatBengaliDate, getBengaliDayNumber } from "@/lib/formatters";
import { triggerHaptic } from "@/lib/haptics";
import {
  X,
  ArrowLeft,
  Flame,
  Calendar,
  BarChart3,
  CheckCircle2,
  TrendingUp,
  History,
  Edit2,
  Check,
  Award,
} from "lucide-react";

interface DuaAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dua: DuaRecord | null;
  onDataChanged?: () => void;
}

export const DuaAnalyticsModal: React.FC<DuaAnalyticsModalProps> = ({
  isOpen,
  onClose,
  dua,
  onDataChanged,
}) => {
  const [stats, setStats] = useState<DuaAggregatedStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editCountInput, setEditCountInput] = useState("");
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(13); // Default to today (index 13 in 14-day list)
  const containerRef = useRef<HTMLDivElement>(null);

  const loadStats = useCallback(async () => {
    if (!dua) return;
    setIsLoading(true);
    try {
      const data = await getDuaAggregatedStats(dua.id);
      setStats(data);
    } catch (e) {
      console.error("Failed to load dua stats:", e);
    } finally {
      setIsLoading(false);
    }
  }, [dua]);

  useEffect(() => {
    if (isOpen && dua) {
      loadStats();
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: "instant" });
      }
    }
  }, [isOpen, dua, loadStats]);

  // Lock background scroll when modal is active
  useEffect(() => {
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

  // Filter logs strictly to the last 14 days (2 weeks)
  const twoWeeksLogs = useMemo(() => {
    if (!stats || !stats.logs) return [];
    return stats.logs.slice(0, 14);
  }, [stats]);

  // Visual 14-day Activity Bar Chart dataset
  const { chartDays, maxChartCount } = useMemo(() => {
    const today = new Date();
    const days: Array<{
      dateStr: string;
      dayNumber: string;
      fullDateLabel: string;
      count: number;
      completed: boolean;
      isToday: boolean;
    }> = [];

    const logMap = new Map<string, DuaDailyLog>();
    if (stats?.logs) {
      stats.logs.forEach((log) => logMap.set(log.date, log));
    }

    // Build exactly 14 days chronologically from 13 days ago to today
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const log = logMap.get(dateStr);
      const count = log ? log.count : 0;
      const completed = log ? log.completed : false;

      days.push({
        dateStr,
        dayNumber: getBengaliDayNumber(dateStr),
        fullDateLabel: formatBengaliDate(dateStr),
        count,
        completed,
        isToday: i === 0,
      });
    }

    const maxVal = days.reduce((max, d) => Math.max(max, d.count), 0);
    return { chartDays: days, maxChartCount: maxVal > 0 ? maxVal : 10 };
  }, [stats]);

  const handleStartEdit = (date: string, currentCount: number) => {
    triggerHaptic(20);
    setEditingDate(date);
    setEditCountInput(String(currentCount));
  };

  const handleSaveEdit = async (date: string) => {
    if (!dua) return;
    const parsed = parseInt(editCountInput.replace(/[^0-9]/g, ""), 10);
    const finalVal = isNaN(parsed) ? 0 : Math.max(0, parsed);
    await setDuaCount(dua.id, finalVal, date);
    triggerHaptic(40);
    setEditingDate(null);
    await loadStats();
    if (onDataChanged) onDataChanged();
  };

  if (!isOpen || !dua) return null;

  const todayStr = getLocalDateString();
  const selectedDay = chartDays[selectedDayIdx] || chartDays[chartDays.length - 1];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-background text-foreground flex flex-col w-full max-w-full overflow-x-hidden overflow-y-auto overscroll-x-none touch-pan-y animate-in fade-in duration-150 font-bengali"
    >
      {/* Solid Sticky Top Navigation Bar */}
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-xl border-b border-zinc-200/80 dark:border-zinc-800/80 shrink-0 px-4 py-3.5 w-full max-w-full shadow-xs box-border">
        <div className="max-w-xl mx-auto w-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <button
              type="button"
              onClick={onClose}
              aria-label="ফিরে যান"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all active:scale-95 shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-[11px] bg-[#ffb31a]/15 text-[#c87d00] dark:text-[#ffb31a] flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base font-bold font-bengali text-zinc-900 dark:text-zinc-50 truncate">
                {dua.title || "দোয়ার আমল হিস্ট্রি"}
              </h1>
              <p className="text-[11px] text-zinc-500 font-bengali truncate">
                আমল ও ধারাবাহিকতা বিশ্লেষণ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Solid Main Page Content */}
      <main className="flex-1 w-full max-w-full px-4 pt-5 pb-12 font-bengali box-border overflow-x-hidden">
        <div className="max-w-xl mx-auto w-full space-y-5">
          {isLoading ? (
            <div className="py-24 flex justify-center items-center">
              <div className="w-8 h-8 border-2 border-[#ffb31a] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : stats ? (
            <>
              {/* 4 Top Summary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
                {/* Total Count */}
                <div className="p-4 bg-white dark:bg-[#181818] border border-zinc-200/80 dark:border-zinc-800 rounded-[20px] flex flex-col justify-between shadow-2xs min-h-[92px] min-w-0">
                  <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-1">
                    <span className="truncate">মোট আমল</span>
                    <Award className="w-4 h-4 text-[#ffb31a] shrink-0" />
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold font-mono text-zinc-950 dark:text-white truncate">
                    {toBengaliNumber(stats.totalCount)}
                  </div>
                  <span className="text-[10.5px] text-zinc-400 mt-0.5 truncate">সর্বমোট পাঠ</span>
                </div>

                {/* Streak */}
                <div className="p-4 bg-amber-500/10 dark:bg-amber-400/15 border border-[#ffb31a]/35 rounded-[20px] flex flex-col justify-between shadow-2xs min-h-[92px] min-w-0">
                  <div className="flex items-center justify-between text-[#c87d00] dark:text-[#ffb31a] text-xs font-bold mb-1">
                    <span className="truncate">চলমান ধারা</span>
                    <Flame className="w-4 h-4 text-orange-500 shrink-0" />
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold font-mono text-zinc-950 dark:text-[#ffb31a] truncate">
                    {toBengaliNumber(stats.streakDays)}{" "}
                    <span className="text-xs font-bengali font-semibold">দিন</span>
                  </div>
                  <span className="text-[10.5px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">একটানা পাঠ</span>
                </div>

                {/* This Week */}
                <div className="p-4 bg-white dark:bg-[#181818] border border-zinc-200/80 dark:border-zinc-800 rounded-[20px] flex flex-col justify-between shadow-2xs min-h-[92px] min-w-0">
                  <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-1">
                    <span className="truncate">এই সপ্তাহে</span>
                    <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold font-mono text-zinc-950 dark:text-white truncate">
                    {toBengaliNumber(stats.thisWeekCount)}
                  </div>
                  <span className="text-[10.5px] text-zinc-400 mt-0.5 truncate">গত ৭ দিন</span>
                </div>

                {/* This Month */}
                <div className="p-4 bg-white dark:bg-[#181818] border border-zinc-200/80 dark:border-zinc-800 rounded-[20px] flex flex-col justify-between shadow-2xs min-h-[92px] min-w-0">
                  <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-1">
                    <span className="truncate">এই মাসে</span>
                    <BarChart3 className="w-4 h-4 text-emerald-500 shrink-0" />
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold font-mono text-zinc-950 dark:text-white truncate">
                    {toBengaliNumber(stats.thisMonthCount)}
                  </div>
                  <span className="text-[10.5px] text-zinc-400 mt-0.5 truncate">চলতি মাস</span>
                </div>
              </div>

              {/* Visual Activity Bar Chart (Last 14 Days / 2 Weeks) */}
              <div className="p-4 sm:p-5 bg-white dark:bg-[#181818] border border-zinc-200/80 dark:border-zinc-800 rounded-[22px] shadow-2xs w-full min-w-0 box-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    <BarChart3 className="w-4 h-4 text-[#ffb31a]" />
                    <span>গত ২ সপ্তাহের আমল গ্রাফ</span>
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    সর্বোচ্চ: {toBengaliNumber(maxChartCount)} বার
                  </span>
                </div>

                {/* Selected Day Info Badge (Clean & Responsive) */}
                {selectedDay && (
                  <div className="mb-3 px-3 py-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {selectedDay.fullDateLabel} {selectedDay.isToday && "(আজ)"}
                    </span>
                    <span className="font-bold text-[#c87d00] dark:text-[#ffb31a] font-mono">
                      {toBengaliNumber(selectedDay.count)} বার পাঠ
                    </span>
                  </div>
                )}

                {/* Bar Graph Visual Columns (14 Days) */}
                <div className="h-28 flex items-end justify-between gap-1 pt-3 pb-1 px-0.5 border-b border-zinc-200 dark:border-zinc-800 w-full overflow-hidden">
                  {chartDays.map((item, idx) => {
                    const heightPercent =
                      maxChartCount > 0
                        ? Math.max(10, (item.count / maxChartCount) * 100)
                        : 10;
                    const hasCount = item.count > 0;
                    const isSelected = idx === selectedDayIdx;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          triggerHaptic(15);
                          setSelectedDayIdx(idx);
                        }}
                        aria-label={`${item.fullDateLabel}: ${item.count} বার`}
                        className="flex-1 min-w-0 flex flex-col items-center gap-1 h-full justify-end focus:outline-none transition-transform active:scale-95"
                      >
                        {/* Bar */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-md transition-all duration-200 ${
                            isSelected
                              ? "bg-[#ffb31a] ring-2 ring-[#ffb31a]/60 shadow-sm"
                              : item.isToday
                              ? "bg-[#ffb31a]/80"
                              : hasCount
                              ? "bg-amber-400/70 dark:bg-amber-500/60"
                              : "bg-zinc-200/90 dark:bg-zinc-800"
                          }`}
                        />
                        {/* Bengali Date Number below bar */}
                        <span
                          className={`text-[9px] sm:text-[10px] font-mono font-bold leading-none ${
                            isSelected
                              ? "text-[#c87d00] dark:text-[#ffb31a] underline"
                              : item.isToday
                              ? "text-[#c87d00] dark:text-[#ffb31a]"
                              : "text-zinc-500 dark:text-zinc-400"
                          }`}
                        >
                          {item.dayNumber}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Day-by-Day Historical Log List (Strictly 2 Weeks / 14 Entries) */}
              <div className="space-y-2.5 pb-6 w-full min-w-0">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  <div className="flex items-center gap-1.5">
                    <History className="w-4 h-4 text-[#ffb31a]" />
                    <span>তারিখভিত্তিক আমল তালিকা (গত ২ সপ্তাহ)</span>
                  </div>
                  <span className="text-[11px] font-normal text-zinc-400">
                    {toBengaliNumber(twoWeeksLogs.length)} টি এন্ট্রি
                  </span>
                </div>

                {twoWeeksLogs.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-[#181818] border border-zinc-200/80 dark:border-zinc-800 rounded-[20px]">
                    <History className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                    <p className="text-xs text-zinc-500 font-bengali">
                      গত ২ সপ্তাহে কোনো আমল রেকর্ড পাওয়া যায়নি
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {twoWeeksLogs.map((log) => {
                      const isToday = log.date === todayStr;
                      const isEditingThis = editingDate === log.date;

                      return (
                        <div
                          key={log.date}
                          className={`p-3.5 sm:p-4 rounded-[18px] border transition-all flex items-center justify-between gap-3 ${
                            isToday
                              ? "bg-amber-500/[0.04] dark:bg-amber-400/[0.05] border-[#ffb31a]/40 shadow-xs"
                              : "bg-white dark:bg-[#181818] border-zinc-200/80 dark:border-zinc-800 shadow-2xs"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                                log.completed
                                  ? "bg-amber-500/20 text-[#c87d00] dark:text-[#ffb31a]"
                                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                  {formatBengaliDate(log.date)}
                                </span>
                                {isToday && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#ffb31a] text-zinc-950 rounded-full shrink-0">
                                    আজকে
                                  </span>
                                )}
                              </div>
                              <span className="text-[10.5px] text-zinc-400 font-mono block truncate">
                                {log.date}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isEditingThis ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  value={editCountInput}
                                  onChange={(e) => setEditCountInput(e.target.value)}
                                  className="w-16 h-8 px-2 text-center text-xs font-mono font-bold bg-zinc-100 dark:bg-zinc-800 border border-[#ffb31a] rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(log.date)}
                                  aria-label="সংরক্ষণ করুন"
                                  className="w-8 h-8 rounded-lg bg-[#ffb31a] text-zinc-950 flex items-center justify-center font-bold active:scale-95 shadow-xs"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-extrabold font-mono text-zinc-800 dark:text-zinc-200">
                                  {toBengaliNumber(log.count)} বার
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(log.date, log.count)}
                                  aria-label="আমল সংখ্যা পরিবর্তন"
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
};
