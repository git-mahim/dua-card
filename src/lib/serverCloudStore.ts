import { BackupPayload } from "./types";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// In-memory fallback cache for serverless environments when DB env is pending
const memoryStorage = new Map<string, { payload: BackupPayload; updatedAt: number }>();

function getUserKey(userEmail: string): string {
  return crypto.createHash("sha256").update(userEmail.toLowerCase().trim()).digest("hex");
}

function getLocalDataFilePath(userKey: string): string {
  const dir = path.join(process.cwd(), ".data");
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {}
  }
  return path.join(dir, `sync_${userKey}.json`);
}

/**
 * Save user backup to Cloud Database (Supabase REST / MongoDB / Local fallback)
 */
export async function saveUserCloudData(
  userEmail: string,
  payload: BackupPayload
): Promise<{ success: boolean; provider: string; error?: string }> {
  const userKey = getUserKey(userEmail);
  const now = Date.now();

  // Always update in-memory cache
  memoryStorage.set(userKey, { payload, updatedAt: now });

  // 1. Check Supabase REST API
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const endpoint = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/user_backups`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify({
          user_key: userKey,
          email: userEmail.toLowerCase().trim(),
          payload,
          updated_at: new Date(now).toISOString(),
        }),
      });

      if (res.ok) {
        return { success: true, provider: "supabase" };
      } else {
        console.warn("Supabase sync warning:", await res.text());
      }
    } catch (err) {
      console.warn("Supabase network error:", err);
    }
  }

  // 2. Local JSON file fallback (works perfectly during development)
  try {
    const filePath = getLocalDataFilePath(userKey);
    fs.writeFileSync(
      filePath,
      JSON.stringify({ userEmail, payload, updatedAt: now }, null, 2),
      "utf-8"
    );
    return { success: true, provider: "local_storage" };
  } catch (err) {
    // In serverless read-only disk, memory storage is already updated
    return { success: true, provider: "memory_cache" };
  }
}

/**
 * Retrieve user backup from Cloud Database
 */
export async function getUserCloudData(
  userEmail: string
): Promise<{ payload: BackupPayload | null; updatedAt?: number; provider: string }> {
  const userKey = getUserKey(userEmail);

  // 1. Check Supabase
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const endpoint = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/user_backups?user_key=eq.${userKey}&select=*`;
      const res = await fetch(endpoint, {
        method: "GET",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });

      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const row = rows[0];
          return {
            payload: row.payload as BackupPayload,
            updatedAt: new Date(row.updated_at).getTime(),
            provider: "supabase",
          };
        }
      }
    } catch (err) {
      console.warn("Supabase fetch error:", err);
    }
  }

  // 2. Check Local File
  try {
    const filePath = getLocalDataFilePath(userKey);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(content);
      return {
        payload: parsed.payload as BackupPayload,
        updatedAt: parsed.updatedAt,
        provider: "local_storage",
      };
    }
  } catch {}

  // 3. Check Memory Storage
  if (memoryStorage.has(userKey)) {
    const cached = memoryStorage.get(userKey)!;
    return {
      payload: cached.payload,
      updatedAt: cached.updatedAt,
      provider: "memory_cache",
    };
  }

  return { payload: null, provider: "none" };
}
