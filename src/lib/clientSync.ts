"use client";

import { BackupPayload, DuaRecord, DuaDailyLog } from "./types";
import { getAllDuas, db, replaceAllDuas, ensureCoreDuas } from "./db";

export type SyncStatus =
  | "idle"
  | "syncing"
  | "synced"
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
  user: SyncUser | null;
  isGoogleConfigured?: boolean;
  errorMessage?: string;
}

let currentState: SyncState = {
  status: "unauthenticated",
  lastSyncedAt: null,
  user: null,
  isGoogleConfigured: false,
};

const listeners = new Set<(state: SyncState) => void>();

function updateState(partial: Partial<SyncState>) {
  currentState = { ...currentState, ...partial };
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

    // Automatically trigger initial cloud pull/sync
    await triggerCloudSync({ forcePullIfServerHasData: true });
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
    // Fetch NextAuth CSRF token
    const csrfRes = await fetch("/api/auth/csrf");
    if (!csrfRes.ok) {
      window.location.href = "/api/auth/signin/google";
      return;
    }
    const { csrfToken } = await csrfRes.json();

    // Create and submit POST form to NextAuth Google sign in endpoint
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
    lastSyncedAt: null,
  });
}

/**
 * Perform Cloud Sync (Push local to cloud and restore if cloud has newer data)
 */
export async function triggerCloudSync(options?: {
  forcePullIfServerHasData?: boolean;
}): Promise<{ success: boolean; syncedCount?: number; error?: string }> {
  if (typeof window === "undefined") return { success: false };

  // Check offline
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    updateState({ status: "offline" });
    return { success: false, error: "ইন্টারনেট সংযোগ নেই" };
  }

  const isAuth = await checkAuthStatus();
  if (!isAuth) {
    updateState({ status: "unauthenticated" });
    return { success: false, error: "অনুগ্রহ করে গুগল দিয়ে সাইন-ইন করুন" };
  }

  try {
    updateState({ status: "syncing" });

    // Step 1: Export local data payload
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

    // Step 2: Send to /api/sync
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      updateState({
        status: "error",
        errorMessage: data.error || "সিঙ্ক করতে ব্যর্থ হয়েছে",
      });
      return { success: false, error: data.error || "সিঙ্ক ব্যর্থ হয়েছে" };
    }

    // Step 3: If server merged payload returned, write back to local db & refresh UI
    const mergedPayload = data.mergedPayload || data.data;
    if (mergedPayload && Array.isArray(mergedPayload.duas) && mergedPayload.duas.length > 0) {
      await replaceAllDuas(mergedPayload.duas);
      if (Array.isArray(mergedPayload.logs) && mergedPayload.logs.length > 0) {
        try {
          await db.logs.clear();
          await db.logs.bulkPut(mergedPayload.logs);
        } catch (e) {
          console.warn("Failed to update local logs:", e);
        }
      }
    }
    await ensureCoreDuas();

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("dua_data_synced_from_cloud"));
    }

    const now = Date.now();
    updateState({
      status: "synced",
      lastSyncedAt: now,
      errorMessage: undefined,
    });

    return {
      success: true,
      syncedCount: data.totalRecords || localDuas.length,
    };
  } catch (err) {
    console.error("Cloud sync error:", err);
    updateState({
      status: "error",
      errorMessage: "ক্লাউড সিঙ্ক করতে সমস্যা হয়েছে",
    });
    return { success: false, error: "ক্লাউড সিঙ্ক করতে সমস্যা হয়েছে" };
  }
}

/**
 * Schedule background auto-sync debounced (e.g. after any dua add/edit/delete/mark completed)
 */
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function notifyDataChangedAndScheduleSync(): void {
  if (typeof window === "undefined") return;

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(async () => {
    try {
      const state = getSyncState();
      if (state.user && state.status !== "syncing") {
        await triggerCloudSync();
      }
    } catch (e) {
      console.warn("Auto-sync failed:", e);
    }
  }, 1200);
}
