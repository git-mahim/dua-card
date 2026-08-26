import Dexie, { type Table } from "dexie";
import { DuaRecord, DuaDailyLog, DuaAggregatedStats } from "./types";

export class DuaCardDatabase extends Dexie {
  duas!: Table<DuaRecord, string>;
  logs!: Table<DuaDailyLog, string>;

  constructor() {
    super("DuaCardDB");
    this.version(1).stores({
      duas: "id, sortOrder, createdAt, updatedAt",
    });
    this.version(2).stores({
      duas: "id, sortOrder, createdAt, updatedAt",
      logs: "id, duaId, date, [duaId+date]",
    });
  }
}

export const db = new DuaCardDatabase();

export const DAILY_RESET_TIME_STORAGE_KEY = "dua_daily_reset_time";
export const DEFAULT_DAILY_RESET_TIME = "06:00";

/**
 * Get configured daily reset time (HH:MM), default "06:00"
 */
export function getDailyResetTime(): string {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(DAILY_RESET_TIME_STORAGE_KEY);
      if (saved && /^\d{2}:\d{2}$/.test(saved)) {
        return saved;
      }
    } catch {}
  }
  return DEFAULT_DAILY_RESET_TIME;
}

/**
 * Save configured daily reset time (HH:MM) and notify listeners
 */
export function setDailyResetTime(timeStr: string): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(DAILY_RESET_TIME_STORAGE_KEY, timeStr);
      window.dispatchEvent(new Event("dua_daily_reset_time_changed"));
    } catch {}
  }
}

/**
 * Get effective spiritual Date based on configured daily reset time threshold.
 */
export function getSpiritualDate(now: Date = new Date()): Date {
  const target = new Date(now);
  const resetTime = getDailyResetTime();
  const [rHour, rMin] = resetTime.split(":").map((n) => parseInt(n, 10) || 0);

  const resetToday = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
    rHour,
    rMin,
    0,
    0
  );

  // If current time is before today's reset time, active session is yesterday
  if (target.getTime() < resetToday.getTime()) {
    target.setDate(target.getDate() - 1);
  }
  return target;
}

/**
 * Compute the active spiritual date string (YYYY-MM-DD) based on custom reset time.
 * If current time is before the daily reset time, it belongs to the previous day's active session.
 */
export function getLocalDateString(d?: Date): string {
  const targetDate = d ? new Date(d) : getSpiritualDate();
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, "0");
  const day = String(targetDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Fetch all duas ordered by sortOrder ascending (0 is top)
 */
export async function getAllDuas(): Promise<DuaRecord[]> {
  try {
    const list = await db.duas.orderBy("sortOrder").toArray();
    return list;
  } catch (error) {
    console.error("Failed to get duas from IndexedDB:", error);
    return [];
  }
}

/**
 * Get a single dua by ID
 */
export async function getDuaById(id: string): Promise<DuaRecord | undefined> {
  try {
    return await db.duas.get(id);
  } catch (error) {
    console.error(`Failed to get dua with id ${id}:`, error);
    return undefined;
  }
}

/**
 * Add a new dua at the very top of the list.
 */
export async function createDua(data: {
  richTextContent: any;
  plainTextPreview: string;
  title?: string;
}): Promise<DuaRecord> {
  const now = Date.now();
  const id = `dua_${now}_${Math.random().toString(36).substring(2, 9)}`;

  // Find minimum sortOrder to place new dua at the very top
  const existingDuas = await getAllDuas();
  const minSortOrder =
    existingDuas.length > 0
      ? Math.min(...existingDuas.map((d) => d.sortOrder ?? 0))
      : 0;

  // New item gets minSortOrder - 1, or 0 if empty
  const newSortOrder = existingDuas.length > 0 ? minSortOrder - 1 : 0;

  const newDua: DuaRecord = {
    id,
    richTextContent: data.richTextContent,
    plainTextPreview: data.plainTextPreview,
    title: data.title || "",
    createdAt: now,
    updatedAt: now,
    sortOrder: newSortOrder,
    schemaVersion: 1,
  };

  await db.duas.add(newDua);
  return newDua;
}

/**
 * Update an existing dua
 */
export async function updateDua(
  id: string,
  updates: Partial<Omit<DuaRecord, "id" | "createdAt">>
): Promise<void> {
  await db.duas.update(id, {
    ...updates,
    updatedAt: Date.now(),
  });
}

/**
 * Delete a dua by ID and remove associated logs
 */
export async function deleteDua(id: string): Promise<void> {
  await db.transaction("rw", db.duas, db.logs, async () => {
    await db.duas.delete(id);
    await db.logs.where("duaId").equals(id).delete();
  });
}

/**
 * Reorder duas according to an array of IDs in new order
 */
export async function reorderDuas(orderedIds: string[]): Promise<void> {
  await db.transaction("rw", db.duas, async () => {
    for (let index = 0; index < orderedIds.length; index++) {
      const id = orderedIds[index];
      await db.duas.update(id, {
        sortOrder: index,
        updatedAt: Date.now(),
      });
    }
  });
}

/**
 * Move a dua up one position
 */
export async function moveDuaUp(id: string): Promise<void> {
  const list = await getAllDuas();
  const index = list.findIndex((d) => d.id === id);
  if (index <= 0) return;

  const newOrder = [...list];
  const [removed] = newOrder.splice(index, 1);
  newOrder.splice(index - 1, 0, removed);

  await reorderDuas(newOrder.map((d) => d.id));
}

/**
 * Move a dua down one position
 */
export async function moveDuaDown(id: string): Promise<void> {
  const list = await getAllDuas();
  const index = list.findIndex((d) => d.id === id);
  if (index < 0 || index >= list.length - 1) return;

  const newOrder = [...list];
  const [removed] = newOrder.splice(index, 1);
  newOrder.splice(index + 1, 0, removed);

  await reorderDuas(newOrder.map((d) => d.id));
}

/**
 * Replace all duas with imported data
 */
export async function replaceAllDuas(newDuas: DuaRecord[]): Promise<void> {
  await db.transaction("rw", db.duas, async () => {
    await db.duas.clear();
    const normalized = newDuas.map((dua, index) => ({
      ...dua,
      sortOrder: index,
    }));
    await db.duas.bulkAdd(normalized);
  });
}

/**
 * Merge new duas into existing list
 */
export async function mergeImportedDuas(importedDuas: DuaRecord[]): Promise<{
  added: number;
  skipped: number;
}> {
  const existing = await getAllDuas();
  const existingIds = new Set(existing.map((d) => d.id));
  const existingTextSet = new Set(
    existing.map((d) => d.plainTextPreview.trim().toLowerCase())
  );

  let added = 0;
  let skipped = 0;
  const toAdd: DuaRecord[] = [];

  let nextSortOrder =
    existing.length > 0
      ? Math.max(...existing.map((d) => d.sortOrder ?? 0)) + 1
      : 0;

  for (const item of importedDuas) {
    const isIdDuplicate = existingIds.has(item.id);
    const isTextDuplicate =
      item.plainTextPreview &&
      existingTextSet.has(item.plainTextPreview.trim().toLowerCase());

    if (isIdDuplicate || isTextDuplicate) {
      skipped++;
    } else {
      toAdd.push({
        ...item,
        id: item.id || `dua_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        sortOrder: nextSortOrder++,
      });
      added++;
    }
  }

  if (toAdd.length > 0) {
    await db.duas.bulkAdd(toAdd);
  }

  return { added, skipped };
}

/**
 * Delete all local records
 */
export async function clearDatabase(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.setItem("dua_card_cleared_v1", "true");
  }
  await db.transaction("rw", db.duas, db.logs, async () => {
    await db.duas.clear();
    await db.logs.clear();
  });
}

/* ==========================================================================
   DAILY LOGS & AMAL TRACKING (DHIKR COUNTER & HABIT ANALYTICS)
   ========================================================================== */

/**
 * Get a specific daily log for a dua
 */
export async function getDailyLog(
  duaId: string,
  dateStr: string = getLocalDateString()
): Promise<DuaDailyLog | undefined> {
  try {
    const id = `${duaId}_${dateStr}`;
    return await db.logs.get(id);
  } catch (error) {
    console.error(`Failed to get log for ${duaId} on ${dateStr}:`, error);
    return undefined;
  }
}

/**
 * Get all logs for today across all duas
 */
export async function getAllTodayLogs(
  dateStr: string = getLocalDateString()
): Promise<Record<string, DuaDailyLog>> {
  try {
    const logs = await db.logs.where("date").equals(dateStr).toArray();
    const map: Record<string, DuaDailyLog> = {};
    for (const log of logs) {
      map[log.duaId] = log;
    }
    return map;
  } catch (error) {
    console.error(`Failed to get today logs for ${dateStr}:`, error);
    return {};
  }
}

/**
 * Toggle completed state for today (Instagram-style double tap)
 */
export async function toggleTodayCompleted(
  duaId: string,
  dateStr: string = getLocalDateString()
): Promise<DuaDailyLog> {
  const id = `${duaId}_${dateStr}`;
  const existing = await db.logs.get(id);

  if (existing) {
    const updated: DuaDailyLog = {
      ...existing,
      completed: !existing.completed,
      updatedAt: Date.now(),
    };
    await db.logs.put(updated);
    return updated;
  } else {
    const newLog: DuaDailyLog = {
      id,
      duaId,
      date: dateStr,
      count: 0,
      completed: true,
      updatedAt: Date.now(),
    };
    await db.logs.put(newLog);
    return newLog;
  }
}

/**
 * Reset all completed logs and counts for today (uncheck all cards)
 */
export async function resetAllTodayLogs(
  dateStr: string = getLocalDateString()
): Promise<void> {
  const logs = await db.logs.where("date").equals(dateStr).toArray();
  const now = Date.now();
  const resetLogs = logs.map((log) => ({
    ...log,
    completed: false,
    count: 0,
    updatedAt: now,
  }));
  if (resetLogs.length > 0) {
    await db.logs.bulkPut(resetLogs);
  }
}

/**
 * Add or increment count for a dua on a specific date (+33, +100, etc.)
 */
export async function addDuaCount(
  duaId: string,
  delta: number,
  dateStr: string = getLocalDateString()
): Promise<DuaDailyLog> {
  const id = `${duaId}_${dateStr}`;
  const existing = await db.logs.get(id);
  const now = Date.now();

  if (existing) {
    const newCount = Math.max(0, existing.count + delta);
    const updated: DuaDailyLog = {
      ...existing,
      count: newCount,
      completed: newCount > 0 ? true : existing.completed,
      updatedAt: now,
    };
    await db.logs.put(updated);
    return updated;
  } else {
    const newCount = Math.max(0, delta);
    const newLog: DuaDailyLog = {
      id,
      duaId,
      date: dateStr,
      count: newCount,
      completed: newCount > 0,
      updatedAt: now,
    };
    await db.logs.put(newLog);
    return newLog;
  }
}

/**
 * Set an exact count for a dua on a specific date
 */
export async function setDuaCount(
  duaId: string,
  count: number,
  dateStr: string = getLocalDateString()
): Promise<DuaDailyLog> {
  const id = `${duaId}_${dateStr}`;
  const existing = await db.logs.get(id);
  const now = Date.now();
  const safeCount = Math.max(0, count);

  if (existing) {
    const updated: DuaDailyLog = {
      ...existing,
      count: safeCount,
      completed: safeCount > 0 ? true : existing.completed,
      updatedAt: now,
    };
    await db.logs.put(updated);
    return updated;
  } else {
    const newLog: DuaDailyLog = {
      id,
      duaId,
      date: dateStr,
      count: safeCount,
      completed: safeCount > 0,
      updatedAt: now,
    };
    await db.logs.put(newLog);
    return newLog;
  }
}

/**
 * Calculate aggregated statistics, streaks, and history for a specific dua
 */
export async function getDuaAggregatedStats(duaId: string): Promise<DuaAggregatedStats> {
  try {
    const allLogs = await db.logs.where("duaId").equals(duaId).toArray();
    // Sort descending by date
    allLogs.sort((a, b) => b.date.localeCompare(a.date));

    const todayDate = getSpiritualDate();
    const todayStr = getLocalDateString();
    
    // Start of this week (Sunday)
    const dayOfWeek = todayDate.getDay();
    const startOfWeek = new Date(todayDate);
    startOfWeek.setDate(todayDate.getDate() - dayOfWeek);
    const startOfWeekStr = getLocalDateString(startOfWeek);

    // Current month prefix (YYYY-MM)
    const currentMonthPrefix = todayStr.substring(0, 7);

    let totalCount = 0;
    let thisWeekCount = 0;
    let thisMonthCount = 0;

    const logMap = new Map<string, DuaDailyLog>();
    for (const log of allLogs) {
      logMap.set(log.date, log);
      totalCount += log.count;
      if (log.date >= startOfWeekStr && log.date <= todayStr) {
        thisWeekCount += log.count;
      }
      if (log.date.startsWith(currentMonthPrefix)) {
        thisMonthCount += log.count;
      }
    }

    // Calculate Streak (consecutive days completed or count > 0)
    let streakDays = 0;
    const checkDate = new Date(todayDate);
    const todayLog = logMap.get(todayStr);

    // If today is not done yet, check if yesterday was done to preserve streak
    if (!todayLog || (!todayLog.completed && todayLog.count === 0)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dStr = getLocalDateString(checkDate);
      const entry = logMap.get(dStr);
      if (entry && (entry.completed || entry.count > 0)) {
        streakDays++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      totalCount,
      thisWeekCount,
      thisMonthCount,
      streakDays,
      logs: allLogs,
    };
  } catch (error) {
    console.error(`Failed to aggregate stats for ${duaId}:`, error);
    return {
      totalCount: 0,
      thisWeekCount: 0,
      thisMonthCount: 0,
      streakDays: 0,
      logs: [],
    };
  }
}
