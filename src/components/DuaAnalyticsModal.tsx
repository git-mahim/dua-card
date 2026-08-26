"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { DuaRecord, DuaDailyLog, DuaAggregatedStats } from "@/lib/types";
import { getDuaAggregatedStats, setDuaCount, getLocalDateString } from "@/lib/db";
import { toBengaliNumber, formatBengaliDate, getBengaliDayName, getBengaliDayNumber } from "@/lib/formatters";
import { triggerHaptic } from "@/lib/haptics";
import {
  X,
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

type TimeRangeFilter = "7d" | "30d" | "6m" | "1y" | "all";

export const DuaAnalyticsModal: React.FC<DuaAnalyticsModalProps> = ({
  isOpen,
  onClose,
  dua,
  onDataChanged,
}) => {
  const [stats, setStats] = useState<DuaAggregatedStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>("30d");
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

  // Filter logs according to selected time range
  const filteredLogs = useMemo(() => {
    if (!stats || !stats.logs) return [];
    const today = new Date();
    let cutoffDate = new Date();

    if (timeRange === "7d") {
      cutoffDate.setDate(today.getDate() - 7);
    } else if (timeRange === "30d") {
      cutoffDate.setDate(today.getDate() - 30);
    } else if (timeRange === "6m") {
      cutoffDate.setMonth(today.getMonth() - 6);
    } else if (timeRange === "1y") {
      cutoffDate.setFullYear(today.getFullYear() - 1);
    } else {
      return stats.logs;
    }

    const cutoffStr = getLocalDateString(cutoffDate);
    return stats.logs.filter((log) => log.date >= cutoffStr);
  }, [stats, timeRange]);

  // Prepare data for the mini bar chart (7 days for 7d, 14 days for others)
  const chartDays = useMemo(() => {
    const daysToShow = timeRange === "7d" ? 7 : 14;
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
  }, [stats, timeRange]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg max-h-[92vh] bg-surface-card border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="analytics-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#ffb31a]/15 text-[#c87d00] dark:text-[#ffb31a] flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="analytics-modal-title"
                className="text-base font-bold font-bengali text-zinc-900 dark:text-zinc-100 line-clamp-1"
              >
                {dua.title || "দোয়ার আমল হিস্ট্রি"}
              </h2>
              <p className="text-xs text-zinc-500 font-bengali">আমল ও ধারাবাহিকতা বিশ্লেষণ</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 font-bengali">
          {isLoading ? (
            <div className="py-20 flex justify-center items-center">
              <div className="w-7 h-7 border-2 border-[#ffb31a] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : stats ? (
            <>
              {/* 4 Top Summary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Total Count */}
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-zinc-500 text-[11px] font-medium mb-1">
                    <span>মোট আমল</span>
                    <Award className="w-3.5 h-3.5 text-[#ffb31a]" />
                  </div>
                  <div className="text-xl font-extrabold font-mono text-zinc-950 dark:text-white">
                    {toBengaliNumber(stats.totalCount)}
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-0.5">সর্বমোট পাঠ</span>
                </div>

                {/* Streak */}
                <div className="p-3.5 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-[#ffb31a]/30 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[#c87d00] dark:text-[#ffb31a] text-[11px] font-bold mb-1">
                    <span>চলমান ধারা</span>
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                  </div>
                  <div className="text-xl font-extrabold font-mono text-zinc-950 dark:text-[#ffb31a]">
                    {toBengaliNumber(stats.streakDays)}{" "}
                    <span className="text-xs font-bengali font-semibold">দিন</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">একটানা পাঠ</span>
                </div>

                {/* This Week */}
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-zinc-500 text-[11px] font-medium mb-1">
                    <span>এই সপ্তাহে</span>
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div className="text-xl font-extrabold font-mono text-zinc-950 dark:text-white">
                    {toBengaliNumber(stats.thisWeekCount)}
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-0.5">গত ৭ দিন</span>
                </div>

                {/* This Month */}
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-zinc-500 text-[11px] font-medium mb-1">
                    <span>এই মাসে</span>
                    <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="text-xl font-extrabold font-mono text-zinc-950 dark:text-white">
                    {toBengaliNumber(stats.thisMonthCount)}
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-0.5">চলতি মাস</span>
                </div>
              </div>

              {/* Visual Activity Bar Chart */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    <BarChart3 className="w-4 h-4 text-[#ffb31a]" />
                    <span>দৈনিক আমল গ্রাফ</span>
                  </div>
                  <span className="text-[10px] text-zinc-400">
                    সর্বোচ্চ: {toBengaliNumber(maxChartCount)} বার
                  </span>
                </div>

                {/* Bar Graph Visual Columns */}
                <div className="h-28 flex items-end justify-between gap-1 pt-4 pb-1 px-1 border-b border-zinc-200 dark:border-zinc-800">
                  {chartDays.map((item, idx) => {
                    const heightPercent = maxChartCount > 0 ? Math.max(8, (item.count / maxChartCount) * 100) : 8;
                    const hasCount = item.count > 0;
                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative"
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
                          className={`text-[10px] sm:text-[11px] font-mono font-bold leading-none ${
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

              {/* Time Range Filter Selector */}
              <div className="flex items-center justify-between gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
                {[
                  { id: "7d", label: "গত ৭ দিন" },
                  { id: "30d", label: "গত ৩০ দিন" },
                  { id: "6m", label: "৬ মাস" },
                  { id: "1y", label: "১ বছর" },
                  { id: "all", label: "সব" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setTimeRange(tab.id as TimeRangeFilter)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      timeRange === tab.id
                        ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Day-by-Day Detailed Log History */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  <div className="flex items-center gap-1.5">
                    <History className="w-4 h-4 text-[#ffb31a]" />
                    <span>তারিখভিত্তিক আমল তালিকা ({toBengaliNumber(filteredLogs.length)} টি এন্ট্রি)</span>
                  </div>
                </div>

                {filteredLogs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-400">
                    এই সময়ের মধ্যে এখনো কোনো আমল হিস্ট্রি নেই।
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {filteredLogs.map((log) => {
                      const isToday = log.date === todayStr;
                      const isEditing = editingDate === log.date;

                      return (
                        <div
                          key={log.id}
                          className={`flex items-center justify-between p-3 rounded-2xl border text-xs transition-colors ${
                            isToday
                              ? "bg-[#ffb31a]/10 dark:bg-[#ffb31a]/15 border-[#ffb31a]/30"
                              : "bg-surface-card border-zinc-200/80 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                          }`}
                        >
                          {/* Date and Day Name */}
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                                log.completed || log.count > 0
                                  ? "bg-[#ffb31a]/20 text-[#c87d00] dark:text-[#ffb31a]"
                                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                <span>{formatBengaliDate(log.date)}</span>
                                {isToday && (
                                  <span className="px-1.5 py-0.2 bg-[#ffb31a] text-zinc-950 font-bold text-[10px] rounded-md">
                                    আজ
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-zinc-400 font-mono">
                                {log.date}
                              </span>
                            </div>
                          </div>

                          {/* Count Value or Edit Input */}
                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  value={editCountInput}
                                  onChange={(e) => setEditCountInput(e.target.value)}
                                  className="w-16 px-2 py-1 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#ffb31a]"
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
                                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                  title="বাতিল"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="text-right">
                                  <span className="font-extrabold font-mono text-sm text-zinc-900 dark:text-zinc-100">
                                    {toBengaliNumber(log.count)}
                                  </span>{" "}
                                  <span className="text-zinc-500 text-[11px]">বার</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(log.date, log.count)}
                                  className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                  title="কাউন্ট সংশোধন করুন"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
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

        {/* Footer Close */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800/80 bg-surface-card shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-xs font-bold font-bengali transition-colors"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
