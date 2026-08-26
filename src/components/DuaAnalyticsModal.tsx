"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
    }
  }, [isOpen, dua, loadStats]);

  // Lock background scroll when solid tab page is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "pan-y";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [isOpen]);

  // Always show maximum 14 days (2 weeks) of logs
  const twoWeeksLogs = useMemo(() => {
    if (!stats || !stats.logs) return [];
    return stats.logs.slice(0, 14);
  }, [stats]);

  // Prepare data for the mini bar chart (14 days = 2 weeks)
  const chartDays = useMemo(() => {
    const daysToShow = 14;
    const result: {
      date: string;
      dayNumber: string;
      fullDateLabel: string;
      count: number;
      isToday: boolean;
    }[] = [];
    const todayStr = getLocalDateString();
    const logMap = new Map<string, DuaDailyLog>();

    if (stats?.logs) {
      for (const l of stats.logs) {
        logMap.set(l.date, l);
      }
    }

    const current = new Date();
    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(current.getDate() - i);
      const dStr = getLocalDateString(d);
      const entry = logMap.get(dStr);
      result.push({
        date: dStr,
        dayNumber: getBengaliDayNumber(dStr),
        fullDateLabel: formatBengaliDate(dStr),
        count: entry ? entry.count : 0,
        isToday: dStr === todayStr,
      });
    }
    return result;
  }, [stats]);

  const maxChartCount = useMemo(() => {
    const counts = chartDays.map((d) => d.count);
    const max = Math.max(1, ...counts);
    return max;
  }, [chartDays]);

  const handleStartEdit = (date: string, currentVal: number) => {
    setEditingDate(date);
    setEditCountInput(currentVal.toString());
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

  return (
    <div className="fixed inset-0 z-50 bg-background text-foreground flex flex-col w-full max-w-full overflow-x-hidden overflow-y-auto overscroll-x-none touch-pan-y animate-in fade-in duration-150">
      {/* Solid Sticky Top Navigation Bar */}
      <header className="sticky top-0 z-20 bg-surface-card border-b border-zinc-200/80 dark:border-zinc-800 shrink-0 px-3 sm:px-6 py-3 w-full max-w-full shadow-xs box-border">
        <div className="max-w-xl mx-auto w-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              type="button"
              onClick={onClose}
              aria-label="ফিরে যান"
              className="p-1.5 sm:p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-2xl bg-[#ffb31a]/15 text-[#c87d00] dark:text-[#ffb31a] flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base font-bold font-bengali text-zinc-900 dark:text-zinc-100 truncate">
                {dua.title || "দোয়ার আমল হিস্ট্রি"}
              </h1>
              <p className="text-[11px] text-zinc-500 font-bengali truncate">আমল ও ধারাবাহিকতা বিশ্লেষণ</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Solid Main Page Content (No Horizontal Overflow) */}
      <main className="flex-1 w-full max-w-full px-3 sm:px-4 py-4 sm:py-6 font-bengali box-border overflow-x-hidden">
        <div className="max-w-xl mx-auto w-full space-y-4 sm:space-y-5">
          {isLoading ? (
            <div className="py-24 flex justify-center items-center">
              <div className="w-8 h-8 border-2 border-[#ffb31a] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : stats ? (
            <>
              {/* 4 Top Summary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 w-full">
                {/* Total Count */}
                <div className="p-3 bg-surface-card border border-zinc-200/80 dark:border-zinc-800 rounded-2xl flex flex-col justify-between shadow-2xs min-w-0">
                  <div className="flex items-center justify-between text-zinc-500 text-[11px] font-medium mb-1">
                    <span className="truncate">মোট আমল</span>
                    <Award className="w-3.5 h-3.5 text-[#ffb31a] shrink-0" />
                  </div>
                  <div className="text-lg sm:text-xl font-extrabold font-mono text-zinc-950 dark:text-white truncate">
                    {toBengaliNumber(stats.totalCount)}
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-0.5 truncate">সর্বমোট পাঠ</span>
                </div>

                {/* Streak */}
                <div className="p-3 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-[#ffb31a]/30 rounded-2xl flex flex-col justify-between shadow-2xs min-w-0">
                  <div className="flex items-center justify-between text-[#c87d00] dark:text-[#ffb31a] text-[11px] font-bold mb-1">
                    <span className="truncate">চলমান ধারা</span>
                    <Flame className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  </div>
                  <div className="text-lg sm:text-xl font-extrabold font-mono text-zinc-950 dark:text-[#ffb31a] truncate">
                    {toBengaliNumber(stats.streakDays)}{" "}
                    <span className="text-xs font-bengali font-semibold">দিন</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">একটানা পাঠ</span>
                </div>

                {/* This Week */}
                <div className="p-3 bg-surface-card border border-zinc-200/80 dark:border-zinc-800 rounded-2xl flex flex-col justify-between shadow-2xs min-w-0">
                  <div className="flex items-center justify-between text-zinc-500 text-[11px] font-medium mb-1">
                    <span className="truncate">এই সপ্তাহে</span>
                    <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  </div>
                  <div className="text-lg sm:text-xl font-extrabold font-mono text-zinc-950 dark:text-white truncate">
                    {toBengaliNumber(stats.thisWeekCount)}
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-0.5 truncate">গত ৭ দিন</span>
                </div>

                {/* This Month */}
                <div className="p-3 bg-surface-card border border-zinc-200/80 dark:border-zinc-800 rounded-2xl flex flex-col justify-between shadow-2xs min-w-0">
                  <div className="flex items-center justify-between text-zinc-500 text-[11px] font-medium mb-1">
                    <span className="truncate">এই মাসে</span>
                    <BarChart3 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  </div>
                  <div className="text-lg sm:text-xl font-extrabold font-mono text-zinc-950 dark:text-white truncate">
                    {toBengaliNumber(stats.thisMonthCount)}
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-0.5 truncate">চলতি মাস</span>
                </div>
              </div>

              {/* Visual Activity Bar Chart (Last 14 Days / 2 Weeks) */}
              <div className="p-3.5 sm:p-4 bg-surface-card border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-2xs w-full min-w-0 overflow-hidden box-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    <BarChart3 className="w-4 h-4 text-[#ffb31a]" />
                    <span>গত ২ সপ্তাহের আমল গ্রাফ</span>
                  </div>
                  <span className="text-[10px] text-zinc-400">
                    সর্বোচ্চ: {toBengaliNumber(maxChartCount)} বার
                  </span>
                </div>

                {/* Bar Graph Visual Columns (14 Days) */}
                <div className="h-28 flex items-end justify-between gap-1 pt-4 pb-1 px-0.5 border-b border-zinc-200 dark:border-zinc-800 w-full overflow-hidden">
                  {chartDays.map((item, idx) => {
                    const heightPercent = maxChartCount > 0 ? Math.max(8, (item.count / maxChartCount) * 100) : 8;
                    const hasCount = item.count > 0;
                    return (
                      <div
                        key={idx}
                        className="flex-1 min-w-0 flex flex-col items-center gap-1 h-full justify-end group relative"
                      >
                        {/* Tooltip on hover */}
                        <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-white text-[10px] py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap z-30 shadow-lg font-bengali">
                          <span>{item.fullDateLabel}:</span>{" "}
                          <span className="font-bold text-[#ffb31a] font-mono">
                            {toBengaliNumber(item.count)} বার
                          </span>
                        </div>

                        {/* Bar */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-md transition-all duration-300 ${
                            item.isToday
                              ? "bg-[#ffb31a] shadow-sm shadow-[#ffb31a]/40"
                              : hasCount
                              ? "bg-amber-400/80 dark:bg-amber-500/70"
                              : "bg-zinc-200 dark:bg-zinc-800"
                          }`}
                        />
                        {/* Bengali Date Number below bar */}
                        <span
                          className={`text-[9px] sm:text-[10px] font-mono font-bold leading-none ${
                            item.isToday
                              ? "text-[#c87d00] dark:text-[#ffb31a]"
                              : "text-zinc-500 dark:text-zinc-400"
                          }`}
                          title={`${item.fullDateLabel}`}
                        >
                          {item.dayNumber}
                        </span>
                      </div>
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
                  <div className="p-8 text-center bg-surface-card border border-zinc-200/80 dark:border-zinc-800 rounded-2xl text-zinc-400 text-xs">
                    এই সময়ের মধ্যে কোনো আমলের রেকর্ড পাওয়া যায়নি।
                  </div>
                ) : (
                  <div className="space-y-2 w-full">
                    {twoWeeksLogs.map((log) => {
                      const isToday = log.date === todayStr;
                      const formattedDate = formatBengaliDate(log.date);
                      const isEditing = editingDate === log.date;

                      return (
                        <div
                          key={log.id}
                          className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 shadow-2xs w-full min-w-0 box-border ${
                            isToday
                              ? "bg-amber-500/5 dark:bg-amber-500/10 border-[#ffb31a]/40"
                              : "bg-surface-card border-zinc-200/80 dark:border-zinc-800"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div
                              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 ${
                                log.completed
                                  ? "bg-[#ffb31a]/20 text-[#c87d00] dark:text-[#ffb31a]"
                                  : "bg-zinc-200/70 dark:bg-zinc-800 text-zinc-400"
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                  {formattedDate}
                                </span>
                                {isToday && (
                                  <span className="px-1.5 py-0.2 text-[9px] bg-[#ffb31a] text-zinc-950 font-bold rounded-full shrink-0">
                                    আজ
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-zinc-400 font-mono block">
                                {log.date}
                              </span>
                            </div>
                          </div>

                          {/* Count Value or Edit Input */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  min="0"
                                  value={editCountInput}
                                  onChange={(e) => setEditCountInput(e.target.value)}
                                  className="w-14 px-1.5 py-1 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#ffb31a] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(log.date)}
                                  className="p-1 bg-[#ffb31a] text-zinc-950 rounded-lg hover:bg-[#e69c05]"
                                  title="সংরক্ষণ"
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingDate(null)}
                                  className="p-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-300"
                                  title="বাতিল"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="text-right">
                                  <span className="font-extrabold font-mono text-xs sm:text-sm text-zinc-950 dark:text-zinc-100">
                                    {toBengaliNumber(log.count)}
                                  </span>{" "}
                                  <span className="text-zinc-500 text-[10px] sm:text-[11px]">বার</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(log.date, log.count)}
                                  className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                  title="কাউন্ট সংশোধন করুন"
                                >
                                  <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                </button>
                              </>
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

      {/* Solid Sticky Bottom Footer */}
      <footer className="sticky bottom-0 bg-surface-card border-t border-zinc-200/80 dark:border-zinc-800 p-3 sm:p-4 shrink-0 shadow-sm w-full max-w-full box-border">
        <div className="max-w-xl mx-auto w-full">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 sm:py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-2xl text-xs font-bold font-bengali transition-colors shadow-2xs"
          >
            বন্ধ করুন / হোমে ফিরে যান
          </button>
        </div>
      </footer>
    </div>
  );
};
