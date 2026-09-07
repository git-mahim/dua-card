"use client";

import React, { useState, useEffect } from "react";
import {
  loginWithGoogle,
  logoutUser,
  triggerCloudSync,
  saveGoogleCredentials,
  getSyncState,
  subscribeSyncState,
  SyncState,
} from "@/lib/clientSync";
import { triggerHaptic } from "@/lib/haptics";
import { useLanguage } from "@/lib/i18n";
import {
  X,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  LogOut,
  RefreshCw,
  Sparkles,
  Smartphone,
  Clock,
  Key,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const { language, t, formatSyncTime } = useLanguage();
  const [syncState, setSyncState] = useState<SyncState>(getSyncState());
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Google OAuth Config fields
  const [clientIdInput, setClientIdInput] = useState("");
  const [clientSecretInput, setClientSecretInput] = useState("");
  const [isSavingKeys, setIsSavingKeys] = useState(false);
  const [showKeySetup, setShowKeySetup] = useState(false);
  const [copiedRedirect, setCopiedRedirect] = useState(false);

  useEffect(() => {
    const unsub = subscribeSyncState((state) => {
      setSyncState(state);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setErrorMsg(null);
      triggerHaptic(50);

      if (syncState.isGoogleConfigured) {
        // Direct redirect to real Google OAuth 2.0
        loginWithGoogle();
      } else {
        setIsGoogleLoading(false);
        setShowKeySetup(true);
        setErrorMsg(
          language === "bn"
            ? "গুগল ক্লাউড কনসোলের Client ID ও Client Secret নিচে প্রদান করে সংরক্ষণ করুন।"
            : "Please enter your Google Cloud OAuth Client ID & Client Secret below."
        );
      }
    } catch (err) {
      setIsGoogleLoading(false);
      setErrorMsg(language === "bn" ? "গুগল সাইন-ইন শুরু করতে সমস্যা হয়েছে" : "Failed to initiate Google sign-in");
    }
  };

  const handleSaveAndLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientIdInput.trim() || !clientSecretInput.trim()) {
      setErrorMsg(language === "bn" ? "Google Client ID এবং Client Secret উভয়ই পূরণ করুন" : "Both Client ID and Secret are required");
      return;
    }

    try {
      setIsSavingKeys(true);
      setErrorMsg(null);
      triggerHaptic(40);

      const res = await saveGoogleCredentials(clientIdInput.trim(), clientSecretInput.trim());
      setIsSavingKeys(false);

      if (res.success) {
        setSuccessMsg(
          language === "bn"
            ? "গুগল ক্রেডেনশিয়াল সংরক্ষিত হয়েছে! গুগল সাইন-ইন পেজে রিডাইরেক্ট করা হচ্ছে..."
            : "Credentials saved! Redirecting to Google Sign-in..."
        );
        setTimeout(() => {
          loginWithGoogle();
        }, 1200);
      } else {
        setErrorMsg(res.error || (language === "bn" ? "সংরক্ষণ করতে ব্যর্থ হয়েছে" : "Failed to save"));
      }
    } catch (e) {
      setIsSavingKeys(false);
      setErrorMsg(language === "bn" ? "ক্রেডেনশিয়াল সেভ করতে সমস্যা হয়েছে" : "Failed to save credentials");
    }
  };

  const handleManualSync = async () => {
    try {
      setIsSyncing(true);
      triggerHaptic(40);
      const res = await triggerCloudSync();
      setIsSyncing(false);
      if (res.success) {
        setSuccessMsg(language === "bn" ? "ক্লাউডের সাথে সকল দোয়া সফলভাবে সিঙ্ক হয়েছে" : "All duas synced with cloud successfully");
        setTimeout(() => setSuccessMsg(null), 2500);
      } else {
        setErrorMsg(res.error || (language === "bn" ? "সিঙ্ক করতে ব্যর্থ হয়েছে" : "Sync failed"));
      }
    } catch (e) {
      setIsSyncing(false);
      setErrorMsg(language === "bn" ? "ক্লাউড সিঙ্ক করতে সমস্যা হয়েছে" : "Sync failed");
    }
  };

  const handleLogout = async () => {
    try {
      triggerHaptic(30);
      await logoutUser();
      onClose();
    } catch (e) {
      setErrorMsg(language === "bn" ? "লগআউট করতে সমস্যা হয়েছে" : "Logout failed");
    }
  };

  const handleCopyRedirectUri = () => {
    if (typeof window === "undefined") return;
    const redirectUri = `${window.location.origin}/api/auth/callback/google`;
    navigator.clipboard.writeText(redirectUri);
    triggerHaptic(30);
    setCopiedRedirect(true);
    setTimeout(() => setCopiedRedirect(false), 2000);
  };

  const userInitial = syncState.user?.name
    ? syncState.user.name.charAt(0).toUpperCase()
    : "G";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-[#181818] border border-zinc-200 dark:border-zinc-800 rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col my-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 pb-3.5 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[12px] bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            </div>
            <div>
              <h2
                id="google-auth-modal-title"
                className="text-base font-bold text-zinc-900 dark:text-zinc-50 leading-tight"
              >
                {syncState.user
                  ? (language === "bn" ? "গুগল প্রোফাইল ও সিঙ্ক" : "Google Profile & Sync")
                  : (language === "bn" ? "গুগল ক্লাউড সাইন-ইন" : "Google Cloud Sign-In")}
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-none mt-0.5">
                {syncState.user
                  ? (language === "bn" ? "আপনার গুগল অ্যাকাউন্ট ও ব্যাকআপ রেকর্ড" : "Google Account & Cloud Backup")
                  : (language === "bn" ? "অফিশিয়াল গুগল OAuth দিয়ে নিরাপদ সাইন-ইন" : "Official Google OAuth Sign-in")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={language === "bn" ? "বন্ধ করুন" : "Close"}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          {/* Notification Messages */}
          {errorMsg && (
            <div className="p-3 rounded-[14px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-[14px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {syncState.user ? (
            /* Logged In Google Profile View */
            <div className="flex flex-col gap-4">
              {/* Profile Card */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/70 rounded-[20px] border border-zinc-200/80 dark:border-zinc-800 flex items-center gap-3.5">
                <div className="relative shrink-0">
                  {syncState.user.image && !imgError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={syncState.user.image}
                      alt={syncState.user.name || "User Avatar"}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={() => setImgError(true)}
                      className="w-13 h-13 rounded-full object-cover ring-2 ring-[#ffb31a] shadow-xs"
                    />
                  ) : (
                    <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#ffb31a] to-[#c87d00] text-zinc-950 font-extrabold text-lg flex items-center justify-center shadow-xs">
                      {userInitial}
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-white dark:bg-zinc-800 shadow-xs flex items-center justify-center p-0.5 ring-2 ring-white dark:ring-zinc-900">
                    <svg className="w-3.5 h-3.5" width="14" height="14" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                  </div>
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {syncState.user.name || (language === "bn" ? "গুগল ব্যবহারকারী" : "Google User")}
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5 font-sans">
                    {syncState.user.email}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {language === "bn" ? "ক্লাউডে সংযুক্ত ও অটো-সিঙ্ক সক্রিয়" : "Connected & Auto-Sync Active"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Last Sync Timestamp Record Card */}
              <div className="p-3 bg-amber-500/[0.06] dark:bg-amber-400/[0.06] rounded-[16px] border border-[#ffb31a]/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                  <Clock className="w-3.5 h-3.5 text-[#ffb31a] shrink-0" />
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                    {t("lastSynced")}
                  </span>
                </div>
                <span className="text-xs font-bold text-zinc-900 dark:text-[#ffb31a]">
                  {formatSyncTime(syncState.lastSyncedAt)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing || syncState.status === "syncing"}
                  className="min-h-[44px] px-3 py-2 bg-[#ffb31a] hover:bg-[#e69c05] text-zinc-950 font-bold text-xs rounded-[14px] shadow-xs flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing || syncState.status === "syncing" ? "animate-spin" : ""}`} />
                  <span>{t("syncNow")}</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="min-h-[44px] px-3 py-2 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-700 hover:text-rose-600 dark:text-zinc-300 dark:hover:text-rose-400 font-semibold text-xs rounded-[14px] border border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t("logout")}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Logged Out View */
            <div className="flex flex-col gap-4">
              {/* Feature Points */}
              <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/60 rounded-[18px] border border-zinc-200/70 dark:border-zinc-800/70 flex flex-col gap-2.5">
                <div className="flex items-start gap-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{language === "bn" ? "কোনো পাসওয়ার্ড ছাড়া সরাসরি আপনার আসল গুগল একাউন্ট সংযুক্ত হবে।" : "Instant passwordless sign-in with your official Google account."}</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                  <Smartphone className="w-4 h-4 text-[#c87d00] dark:text-[#ffb31a] shrink-0 mt-0.5" />
                  <span>{language === "bn" ? "নতুন ফোন বা ব্রাউজারে সাইন-ইন করলেই সব দোয়া স্বয়ংক্রিয়ভাবে চলে আসবে।" : "Automatic sync across all your phones, tablets, and computers."}</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                  <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <span>{language === "bn" ? "১০০% ফ্রি ক্লাউড ব্যাকআপ ব্যবস্থা।" : "100% free lifetime cloud storage."}</span>
                </div>
              </div>

              {/* 1-Click Real Google Sign-In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full min-h-[48px] px-4 py-2.5 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-950 dark:text-zinc-50 font-bold text-xs rounded-[16px] border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow transition-all active:scale-98 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isGoogleLoading ? (
                  <div className="w-5 h-5 border-2 border-zinc-950 dark:border-zinc-100 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5 shrink-0" width="20" height="20" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>{t("signInWithGoogle")}</span>
                  </>
                )}
              </button>

              {/* Expandable Google API Keys Setup Box */}
              {(!syncState.isGoogleConfigured || showKeySetup) && (
                <div className="p-3.5 bg-amber-500/[0.07] dark:bg-amber-400/[0.07] rounded-[18px] border border-[#ffb31a]/40 flex flex-col gap-3">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setShowKeySetup(!showKeySetup)}
                  >
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-[#ffb31a]" />
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {t("googleSetupTitle")}
                      </span>
                    </div>
                    {showKeySetup ? (
                      <ChevronUp className="w-4 h-4 text-zinc-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-500" />
                    )}
                  </div>

                  {showKeySetup && (
                    <form onSubmit={handleSaveAndLogin} className="flex flex-col gap-2.5 pt-1">
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        {t("googleSetupDesc")}{" "}
                        <a
                          href="https://console.cloud.google.com/apis/credentials"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#c87d00] dark:text-[#ffb31a] underline inline-flex items-center gap-0.5 font-bold"
                        >
                          Google Cloud Console <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </p>

                      {/* Redirect URI copy box */}
                      <div className="p-2 bg-white dark:bg-zinc-900 rounded-[10px] border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[10px]">
                        <span className="font-mono text-zinc-500 truncate mr-2">
                          {typeof window !== "undefined"
                            ? `${window.location.origin}/api/auth/callback/google`
                            : "http://localhost:3000/api/auth/callback/google"}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyRedirectUri}
                          className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 font-bold rounded flex items-center gap-1 shrink-0"
                        >
                          {copiedRedirect ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedRedirect ? (language === "bn" ? "কপি হয়েছে" : "Copied") : t("copyUriBtn")}</span>
                        </button>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                          Google Client ID:
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="...apps.googleusercontent.com"
                          value={clientIdInput}
                          onChange={(e) => setClientIdInput(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-[#ffb31a]"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                          Google Client Secret:
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="GOCSPX-..."
                          value={clientSecretInput}
                          onChange={(e) => setClientSecretInput(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-[#ffb31a]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingKeys}
                        className="mt-1 w-full py-2 px-3 bg-[#ffb31a] hover:bg-[#e69c05] text-zinc-950 font-bold text-xs rounded-[12px] shadow-xs flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
                      >
                        {isSavingKeys ? (
                          <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span>{t("saveAndLogin")}</span>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
