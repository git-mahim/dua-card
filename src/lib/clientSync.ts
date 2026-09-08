"use client";

import { BackupPayload, DuaRecord, DuaDailyLog } from "./types";
import { getAllDuas, db, replaceAllDuas, ensureCoreDuas } from "./db";

export type SyncStatus =
  | "idle"
  | "syncing"
  | "synced"
  | "restoring"
  | "offline"
  | "unauthenticated"
  | "error";

export interface SyncUser {
  email: string;
  name?: string;
  image?: string;
  role?: string;
  provider?: "google" | "credentials";
}

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: number | null;
  lastBackupAt?: number | null;
  user: SyncUser | null;
  isGoogleConfigured?: boolean;
  errorMessage?: string;
}

const LAST_BACKUP_STORAGE_KEY = "dua_card_last_backup_time";

function getInitialLastBackup(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const val = localStorage.getItem(LAST_BACKUP_STORAGE_KEY);
    return val ? parseInt(val, 10) : null;
  } catch {
    return null;
  }
}

let currentState: SyncState = {
  status: "unauthenticated",
  lastSyncedAt: getInitialLastBackup(),
  lastBackupAt: getInitialLastBackup(),
  user: null,
  isGoogleConfigured: false,
};

const listeners = new Set<(state: SyncState) => void>();

function updateState(partial: Partial<SyncState>) {
  currentState = { ...currentState, ...partial };
  // Keep lastSyncedAt and lastBackupAt in sync for backward compatibility
  if (partial.lastBackupAt !== undefined && partial.lastSyncedAt === undefined) {
    currentState.lastSyncedAt = partial.lastBackupAt;
  } else if (partial.lastSyncedAt !== undefined && partial.lastBackupAt === undefined) {
    currentState.lastBackupAt = partial.lastSyncedAt;
  }

  listeners.forEach((listener) => {
    try {
      listener(currentState);
    } catch (e) {
      console.error("Sync listener error:", e);
    }
  });
}

export function subscribeSyncState(listener: (state: SyncState) => void): () => void {
  listeners.add(listener);
  listener(currentState);
  return () => {
    listeners.delete(listener);
  };
}

export function getSyncState(): SyncState {
  return currentState;
}

/**
 * Fetch server backup metadata (updatedAt timestamp) without restoring data
 */
export async function fetchCloudBackupMeta(): Promise<number | null> {
  try {
    const res = await fetch("/api/sync", { method: "GET" });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.updatedAt) {
        const time = Number(data.updatedAt);
        updateState({ lastBackupAt: time, lastSyncedAt: time });
        if (typeof window !== "undefined") {
          localStorage.setItem(LAST_BACKUP_STORAGE_KEY, String(time));
        }
        return time;
      }
    }
  } catch (e) {
    console.warn("Failed to fetch cloud backup metadata:", e);
  }
  return null;
}

/**
 * Check if the user is currently authenticated with the server
 */
export async function checkAuthStatus(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    const res = await fetch("/api/auth/me");
    if (res.ok) {
      const data = await res.json();
      updateState({
        isGoogleConfigured: data.isGoogleConfigured ?? false,
      });

      if (data.authenticated && data.user) {
        updateState({
          status: currentState.status === "unauthenticated" ? "idle" : currentState.status,
          user: data.user,
        });

        // Also fetch latest cloud backup timestamp (read-only, no auto-restore)
        fetchCloudBackupMeta();
        return true;
      }
    }
  } catch (err) {
    console.warn("Auth check failed:", err);
  }

  updateState({ status: "unauthenticated", user: null });
  return false;
}

/**
 * Login with email and password
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    updateState({ status: "syncing" });
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      updateState({
        status: "unauthenticated",
        errorMessage: data.error || "লগইন ব্যর্থ হয়েছে",
      });
      return { success: false, error: data.error || "লগইন ব্যর্থ হয়েছে" };
    }

    updateState({
      status: "idle",
      user: data.user,
      errorMessage: undefined,
    });

    // Fetch cloud backup metadata only (NO auto-restore!)
    await fetchCloudBackupMeta();

    return { success: true };
  } catch (err) {
    updateState({
      status: "error",
      errorMessage: "সার্ভারে কানেক্ট করা যায়নি",
    });
    return { success: false, error: "সার্ভারে কানেক্ট করা যায়নি" };
  }
}

/**
 * Initiate Real Google OAuth 2.0 Sign-In
 */
export async function loginWithGoogle(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const csrfRes = await fetch("/api/auth/csrf");
    if (!csrfRes.ok) {
      window.location.href = "/api/auth/signin/google";
      return;
    }
    const { csrfToken } = await csrfRes.json();

    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/auth/signin/google";

    const csrfInput = document.createElement("input");
    csrfInput.type = "hidden";
    csrfInput.name = "csrfToken";
    csrfInput.value = csrfToken;
    form.appendChild(csrfInput);

    const callbackInput = document.createElement("input");
    callbackInput.type = "hidden";
    callbackInput.name = "callbackUrl";
    callbackInput.value = window.location.origin + "/";
    form.appendChild(callbackInput);

    document.body.appendChild(form);
    form.submit();
  } catch (err) {
    window.location.href = "/api/auth/signin/google";
  }
}

/**
 * Save Google OAuth Client ID and Secret to .env.local dynamically
 */
export async function saveGoogleCredentials(
  clientId: string,
  clientSecret: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch("/api/auth/config-google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, clientSecret }),
    });
    const data = await res.json();
    if (data.success) {
      updateState({ isGoogleConfigured: true });
      return { success: true };
    }
    return { success: false, error: data.error || "সংরক্ষণ ব্যর্থ হয়েছে" };
  } catch (e) {
    return { success: false, error: "সার্ভারে কানেক্ট করা যায়নি" };
  }
}

/**
 * Logout
 */
export async function logoutUser(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {}
  updateState({
    status: "unauthenticated",
    user: null,
  });
}

const PENDING_SYNC_KEY = "dua_card_pending_offline_sync";

function getStorage(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  if (typeof localStorage !== "undefined") {
    return localStorage;
  }
  return null;
}

export function markPendingOfflineChanges(): void {
  const store = getStorage();
  if (store) {
    try {
      store.setItem(PENDING_SYNC_KEY, "true");
    } catch {}
  }
}

export function clearPendingOfflineChanges(): void {
  const store = getStorage();
  if (store) {
    try {
      store.removeItem(PENDING_SYNC_KEY);
    } catch {}
  }
}

export function hasPendingOfflineChanges(): boolean {
  const store = getStorage();
  if (store) {
    try {
      return store.getItem(PENDING_SYNC_KEY) === "true";
    } catch {}
  }
  return false;
}

/**
 * Auto-sync listener on window network reconnection (online event)
 */
if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
  window.addEventListener("online", async () => {
    updateState({ status: "idle" });
    const isAuth = await checkAuthStatus();
    if (isAuth) {
      const res = await triggerCloudBackup({ isSilent: true });
      if (res.success) {
        clearPendingOfflineChanges();
      }
    }
  });

  window.addEventListener("offline", () => {
    updateState({ status: "offline" });
  });
}

/**
 * Perform Cloud Backup: Takes the current local duas and logs snapshot and saves to cloud.
 * This overwrites the cloud backup so deleted duas are permanently excluded.
 */
export async function triggerCloudBackup(options?: {
  isSilent?: boolean;
}): Promise<{ success: boolean; count?: number; error?: string; backupAt?: number }> {
  if (typeof window === "undefined") return { success: false };

  // Check offline
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    if (!options?.isSilent) updateState({ status: "offline" });
    markPendingOfflineChanges();
    return { success: false, error: "ইন্টারনেট সংযোগ নেই" };
  }

  const isAuth = await checkAuthStatus();
  if (!isAuth) {
    if (!options?.isSilent) updateState({ status: "unauthenticated" });
    markPendingOfflineChanges();
    return { success: false, error: "অনুগ্রহ করে গুগল বা ইমেইল দিয়ে সাইন-ইন করুন" };
  }

  try {
    if (!options?.isSilent) updateState({ status: "syncing" });

    const localDuas = await getAllDuas();
    const allLogs = await db.logs.toArray();

    const payload: BackupPayload = {
      metadata: {
        appName: "Dua Card",
        version: "1.0.0",
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        totalRecords: localDuas.length,
      },
      duas: localDuas,
      logs: allLogs,
    };

    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      if (!options?.isSilent) {
        updateState({
          status: "error",
          errorMessage: data.error || "ক্লাউড ব্যাকআপ করতে ব্যর্থ হয়েছে",
        });
      }
      markPendingOfflineChanges();
      return { success: false, error: data.error || "ক্লাউড ব্যাকআপ ব্যর্থ হয়েছে" };
    }

    const now = data.backupAt || Date.now();
    updateState({
      status: "synced",
      lastBackupAt: now,
      lastSyncedAt: now,
      errorMessage: undefined,
    });

    if (typeof window !== "undefined") {
      localStorage.setItem(LAST_BACKUP_STORAGE_KEY, String(now));
      clearPendingOfflineChanges();
    }

    return {
      success: true,
      count: localDuas.length,
      backupAt: now,
    };
  } catch (err) {
    console.error("Cloud backup error:", err);
    markPendingOfflineChanges();
    if (!options?.isSilent) {
      updateState({
        status: "error",
        errorMessage: "ক্লাউড ব্যাকআপ করতে সমস্যা হয়েছে",
      });
    }
    return { success: false, error: "ক্লাউড ব্যাকআপ করতে সমস্যা হয়েছে" };
  }
}

/**
 * Perform Cloud Restore: Explicitly restores data from the latest cloud backup.
 * ONLY runs when the user explicitly clicks the 'Restore' button!
 */
export async function triggerCloudRestore(): Promise<{
  success: boolean;
  count?: number;
  error?: string;
  backupAt?: number;
}> {
  if (typeof window === "undefined") return { success: false };

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    updateState({ status: "offline" });
    return { success: false, error: "ইন্টারনেট সংযোগ নেই" };
  }

  const isAuth = await checkAuthStatus();
  if (!isAuth) {
    updateState({ status: "unauthenticated" });
    return { success: false, error: "অনুগ্রহ করে সাইন-ইন করুন" };
  }

  try {
    updateState({ status: "restoring" });

    const res = await fetch("/api/sync", { method: "GET" });
    const data = await res.json();

    if (!res.ok || !data.success || !data.data) {
      updateState({
        status: "idle",
        errorMessage: data.error || "কোনো ক্লাউড ব্যাকআপ পাওয়া যায়নি",
      });
      return {
        success: false,
        error: data.error || "ক্লাউডে কোনো ব্যাকআপ ডেটা পাওয়া যায়নি",
      };
    }

    const cloudPayload = data.data as BackupPayload;
    if (!cloudPayload.duas || !Array.isArray(cloudPayload.duas) || cloudPayload.duas.length === 0) {
      updateState({
        status: "idle",
      });
      return {
        success: false,
        error: "ক্লাউড ব্যাকআপে কোনো দোয়ার তথ্য নেই",
      };
    }

    // Replace local database with the cloud snapshot
    await replaceAllDuas(cloudPayload.duas);

    if (Array.isArray(cloudPayload.logs) && cloudPayload.logs.length > 0) {
      try {
        await db.logs.clear();
        await db.logs.bulkPut(cloudPayload.logs);
      } catch (e) {
        console.warn("Failed to restore logs:", e);
      }
    }

    await ensureCoreDuas();

    const updatedAt = data.updatedAt || Date.now();
    updateState({
      status: "synced",
      lastBackupAt: updatedAt,
      lastSyncedAt: updatedAt,
      errorMessage: undefined,
    });

    if (typeof window !== "undefined") {
      localStorage.setItem(LAST_BACKUP_STORAGE_KEY, String(updatedAt));
      clearPendingOfflineChanges();
      window.dispatchEvent(new CustomEvent("dua_data_synced_from_cloud"));
    }

    return {
      success: true,
      count: cloudPayload.duas.length,
      backupAt: updatedAt,
    };
  } catch (err) {
    console.error("Cloud restore error:", err);
    updateState({
      status: "error",
      errorMessage: "ক্লাউড ব্যাকআপ রিস্টোর করতে সমস্যা হয়েছে",
    });
    return { success: false, error: "ক্লাউড ব্যাকআপ রিস্টোর করতে সমস্যা হয়েছে" };
  }
}

/**
 * Auto-backup disabled per user requirement:
 * Backups are only triggered manually when the user presses the 'Backup' button.
 */
export async function checkAndPerformDailyAutoBackup(): Promise<boolean> {
  return false;
}

/**
 * Backward compatibility alias: triggerCloudSync will now invoke triggerCloudBackup
 */
export async function triggerCloudSync(): Promise<{
  success: boolean;
  syncedCount?: number;
  error?: string;
}> {
  const res = await triggerCloudBackup();
  return {
    success: res.success,
    syncedCount: res.count,
    error: res.error,
  };
}

/**
 * Notify that local data changed and attempt silent sync (or mark pending offline changes)
 */
export async function notifyDataChangedAndScheduleSync(): Promise<void> {
  if (typeof window === "undefined") return;

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    markPendingOfflineChanges();
    return;
  }

  const isAuth = await checkAuthStatus();
  if (isAuth) {
    const res = await triggerCloudBackup({ isSilent: true });
    if (!res.success) {
      markPendingOfflineChanges();
    }
  } else {
    markPendingOfflineChanges();
  }
}
