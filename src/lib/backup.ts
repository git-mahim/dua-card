import { z } from "zod";
import { DuaRecord, DuaDailyLog, BackupPayload } from "./types";
import { getAllDuas, replaceAllDuas, mergeImportedDuas, db } from "./db";

export const DuaRecordSchema = z.object({
  id: z.string().min(1),
  richTextContent: z.any().transform((val) => val ?? { type: "doc", content: [] }),
  plainTextPreview: z.string().default(""),
  title: z.string().optional().default(""),
  createdAt: z.number(),
  updatedAt: z.number().default(Date.now()),
  sortOrder: z.number().default(0),
  schemaVersion: z.number().default(1),
  isProtected: z.boolean().optional().default(false),
});

export const DuaDailyLogSchema = z.object({
  id: z.string().min(1),
  duaId: z.string().min(1),
  date: z.string().min(1),
  count: z.number().default(0),
  completed: z.boolean().default(false),
  updatedAt: z.number().default(Date.now()),
});

export const BackupSchema = z.object({
  metadata: z.object({
    appName: z.string().default("Dua Card"),
    version: z.string().default("1.0.0"),
    schemaVersion: z.number().default(1),
    exportedAt: z.string(),
    totalRecords: z.number(),
  }),
  duas: z.array(DuaRecordSchema),
  logs: z.array(DuaDailyLogSchema).optional().default([]),
});

// Also allow raw array of DuaRecords if exported directly
export const LooseBackupSchema = z.union([
  BackupSchema,
  z.array(DuaRecordSchema).transform((duas) => ({
    metadata: {
      appName: "Dua Card",
      version: "1.0.0",
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      totalRecords: duas.length,
    },
    duas,
    logs: [],
  })),
]);

/**
 * Generate and download a human-readable JSON backup file including logs
 */
export async function exportBackupFile(): Promise<{
  filename: string;
  totalRecords: number;
}> {
  const duas = await getAllDuas();
  let logs: DuaDailyLog[] = [];
  try {
    logs = await db.logs.toArray();
  } catch (e) {
    console.error("Failed to read logs for export:", e);
  }

  const dateStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const filename = `dua-card-backup-${dateStr}.json`;

  const payload: BackupPayload = {
    metadata: {
      appName: "Dua Card",
      version: "1.0.0",
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      totalRecords: duas.length,
    },
    duas,
    logs,
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);

  return { filename, totalRecords: duas.length };
}

/**
 * Validate imported JSON backup file contents
 */
export function validateBackupJson(jsonString: string): {
  success: boolean;
  data?: BackupPayload;
  error?: string;
} {
  try {
    const rawParsed = JSON.parse(jsonString);
    const parsed = LooseBackupSchema.safeParse(rawParsed);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .slice(0, 3)
        .join("; ");
      return {
        success: false,
        error: `Invalid backup structure: ${errorMsg}`,
      };
    }

    return {
      success: true,
      data: parsed.data as BackupPayload,
    };
  } catch {
    return {
      success: false,
      error: "The selected file is not valid JSON.",
    };
  }
}

/**
 * Restore backup: Replace mode (with safety snapshot creation)
 */
export async function restoreBackupReplace(
  duas: DuaRecord[],
  logs?: DuaDailyLog[]
): Promise<{ success: boolean; safetyBackupCreated: boolean }> {
  try {
    // Make safety backup snapshot in sessionStorage
    const currentDuas = await getAllDuas();
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        `dua_safety_snapshot_${Date.now()}`,
        JSON.stringify(currentDuas)
      );
    }

    await replaceAllDuas(duas);
    if (logs && logs.length > 0) {
      await db.logs.clear();
      await db.logs.bulkPut(logs);
    }
    return { success: true, safetyBackupCreated: true };
  } catch (error) {
    console.error("Replace backup failed:", error);
    return { success: false, safetyBackupCreated: false };
  }
}

/**
 * Restore backup: Merge mode
 */
export async function restoreBackupMerge(
  duas: DuaRecord[],
  logs?: DuaDailyLog[]
): Promise<{
  success: boolean;
  added: number;
  skipped: number;
}> {
  try {
    const res = await mergeImportedDuas(duas);
    if (logs && logs.length > 0) {
      await db.logs.bulkPut(logs);
    }
    return { success: true, added: res.added, skipped: res.skipped };
  } catch (error) {
    console.error("Merge backup failed:", error);
    return { success: false, added: 0, skipped: 0 };
  }
}

/**
 * Export all data to JSON string
 */
export async function exportAllDataToJson(): Promise<string> {
  const duas = await getAllDuas();
  let logs: DuaDailyLog[] = [];
  try {
    logs = await db.logs.toArray();
  } catch (e) {
    console.error("Failed to read logs for export:", e);
  }

  const payload: BackupPayload = {
    metadata: {
      appName: "Dua Card",
      version: "1.0.0",
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      totalRecords: duas.length,
    },
    duas,
    logs,
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Import data from JSON string
 */
export async function importDataFromJson(
  jsonString: string,
  options: { overwriteExisting: boolean }
): Promise<{ duasImported: number }> {
  const validated = validateBackupJson(jsonString);
  if (!validated.success || !validated.data) {
    throw new Error(validated.error || "Invalid backup data");
  }

  const { duas, logs } = validated.data;
  if (options.overwriteExisting) {
    const res = await restoreBackupReplace(duas, logs);
    if (!res.success) throw new Error("Replace restore failed");
    return { duasImported: duas.length };
  } else {
    const res = await restoreBackupMerge(duas, logs);
    if (!res.success) throw new Error("Merge restore failed");
    return { duasImported: res.added };
  }
}

/**
 * Clear all data from local database
 */
export async function clearAllData(): Promise<void> {
  const { clearDatabase } = await import("./db");
  await clearDatabase();
}

