import { getAllDuas, getDuaAggregatedStats, getLocalDateString } from "./db";
import { DuaRecord } from "./types";

export interface DuaOverallStatItem {
  dua: DuaRecord;
  title: string;
  pronunciation: string;
  totalCount: number;
  todayCount: number;
  thisWeekCount: number;
  thisMonthCount: number;
  streakDays: number;
  lastReadDate: string; // YYYY-MM-DD or empty
  statusCategory: "most_read" | "moderately_read" | "unread";
}

export interface OverallAnalyticsSummary {
  items: DuaOverallStatItem[];
  totalRecitations: number;
  totalDuasCount: number;
  activeDuasCount: number;
  unreadDuasCount: number;
  topDua?: DuaOverallStatItem;
  top5Duas: DuaOverallStatItem[];
  unreadDuas: DuaOverallStatItem[];
}

/**
 * Extract Dua Pronunciation / Main Recitation Text from DuaRecord
 */
export function extractDuaPronunciation(dua: DuaRecord): string {
  if (!dua) return "শিরোনামহীন দোয়া";
  if (dua.richTextContent && Array.isArray(dua.richTextContent.content)) {
    // 1. Try to find block with semanticStyle === "dua-pronunciation"
    for (const block of dua.richTextContent.content) {
      if (block && block.attrs?.semanticStyle === "dua-pronunciation" && Array.isArray(block.content)) {
        const text = block.content.map((c: any) => c?.text || "").join(" ").trim();
        if (text) return text;
      }
    }
    // 2. Try to find any block that is not "dua-title"
    for (const block of dua.richTextContent.content) {
      if (block && block.attrs?.semanticStyle !== "dua-title" && Array.isArray(block.content)) {
        const text = block.content.map((c: any) => c?.text || "").join(" ").trim();
        if (text) return text;
      }
    }
  }

  // 3. Fallback to plainTextPreview
  if (dua.plainTextPreview && dua.plainTextPreview.trim()) {
    let preview = dua.plainTextPreview.trim();
    if (dua.title && preview.startsWith(dua.title)) {
      preview = preview.slice(dua.title.length).trim();
    }
    if (preview) return preview;
  }

  // 4. Fallback to title
  return dua.title || "শিরোনামহীন দোয়া";
}

/**
 * Fetch and aggregate reading statistics across all stored Duas
 */
export async function fetchAllDuasAnalytics(): Promise<OverallAnalyticsSummary> {
  const duas = await getAllDuas();
  const todayStr = getLocalDateString();
  const items: DuaOverallStatItem[] = [];

  let totalRecitations = 0;
  let activeDuasCount = 0;
  let unreadDuasCount = 0;

  for (const dua of duas) {
    if (!dua || !dua.id) continue;
    const stats = await getDuaAggregatedStats(dua.id);
    const logs = stats?.logs || [];
    const todayLog = logs.find((l) => l && l.date === todayStr);
    const todayCount = todayLog ? todayLog.count || 0 : 0;

    // Find latest log with count > 0
    const activeLogs = logs.filter((l) => l && l.count > 0);
    const lastReadDate = activeLogs.length > 0 ? activeLogs[0].date : "";

    const pronunciationText = extractDuaPronunciation(dua);

    totalRecitations += stats.totalCount;
    if (stats.totalCount > 0) {
      activeDuasCount++;
    } else {
      unreadDuasCount++;
    }

    items.push({
      dua,
      title: dua.title || "শিরোনামহীন দোয়া",
      pronunciation: pronunciationText,
      totalCount: stats.totalCount,
      todayCount,
      thisWeekCount: stats.thisWeekCount,
      thisMonthCount: stats.thisMonthCount,
      streakDays: stats.streakDays,
      lastReadDate,
      statusCategory: stats.totalCount > 0 ? "moderately_read" : "unread",
    });
  }

  // Calculate average to categorize most_read vs moderately_read
  const avgCount = activeDuasCount > 0 ? totalRecitations / activeDuasCount : 0;

  items.forEach((item) => {
    if (item.totalCount === 0) {
      item.statusCategory = "unread";
    } else if (item.totalCount >= Math.max(5, avgCount)) {
      item.statusCategory = "most_read";
    } else {
      item.statusCategory = "moderately_read";
    }
  });

  // Sort items by totalCount descending for ranking
  const sortedByCount = [...items].sort((a, b) => b.totalCount - a.totalCount);
  const topDua = sortedByCount.length > 0 && sortedByCount[0].totalCount > 0 ? sortedByCount[0] : undefined;
  const top5Duas = sortedByCount.filter((i) => i.totalCount > 0).slice(0, 5);
  const unreadDuas = items.filter((i) => i.totalCount === 0);

  return {
    items: sortedByCount,
    totalRecitations,
    totalDuasCount: duas.length,
    activeDuasCount,
    unreadDuasCount,
    topDua,
    top5Duas,
    unreadDuas,
  };
}

/**
 * Export analytics summary data into an Excel-compatible CSV file (with UTF-8 BOM)
 */
export function exportAnalyticsToCsv(items: DuaOverallStatItem[], filename?: string): void {
  const BOM = "\uFEFF";
  const nowStr = new Date().toISOString().slice(0, 10);
  const downloadName = filename || `dua-recitation-sheet-${nowStr}.csv`;

  const headers = [
    "ক্রমিক নং",
    "দোয়ার উচ্চারণ (পাঠ)",
    "দোয়ার শিরোনাম",
    "মোট পাঠ সংখ্যা",
    "আজকের পাঠ",
    "এই সপ্তাহে পাঠ",
    "এই মাসে পাঠ",
    "ধারাবাহিকতা (দিন)",
    "সর্বশেষ পাঠের তারিখ",
    "পাঠের অবস্থা"
  ];

  const rows = items.map((item, idx) => {
    const statusLabel =
      item.statusCategory === "most_read"
        ? "বেশি পঠিত"
        : item.statusCategory === "moderately_read"
        ? "পঠিত"
        : "অপঠিত / পড়া হয়নি";

    const cleanPronunciation = `"${(item.pronunciation || item.title || "শিরোনামহীন দোয়া").replace(/"/g, '""')}"`;
    const cleanTitle = `"${(item.title || "শিরোনামহীন দোয়া").replace(/"/g, '""')}"`;

    return [
      idx + 1,
      cleanPronunciation,
      cleanTitle,
      item.totalCount,
      item.todayCount,
      item.thisWeekCount,
      item.thisMonthCount,
      item.streakDays,
      item.lastReadDate || "এখনও পড়া হয়নি",
      `"${statusLabel}"`,
    ];
  });

  const csvContent = BOM + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = downloadName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
