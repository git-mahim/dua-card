"use client";

import React, { useState, useEffect } from "react";
import {
  loginUser,
  logoutUser,
  triggerCloudSync,
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
  Smartphone,
  Clock,
  Lock,
  Mail,
  Cloud,
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
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeSyncState((state) => {
      setSyncState(state);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput.trim()) {
      setErrorMsg(
        language === "bn"
          ? "ইমেইল এবং পাসকোড উভয়ই পূরণ করুন"
          : "Both Email and Passcode are required"
      );
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);
      triggerHaptic(40);

      const res = await loginUser(emailInput.trim(), passwordInput.trim());
      setIsLoading(false);

      if (res.success) {
        setSuccessMsg(
          language === "bn"
            ? "ক্লাউড ব্যাকআপ সফলভাবে অন হয়েছে!"
            : "Cloud backup enabled successfully!"
        );
        onLoginSuccess?.();
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 1200);
      } else {
        setErrorMsg(
          res.error ||
            (language === "bn" ? "লগইন করতে ব্যর্থ হয়েছে" : "Login failed")
        );
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(
        language === "bn"
          ? "সার্ভারে কানেক্ট করতে সমস্যা হয়েছে"
          : "Failed to connect to server"
      );
    }
  };

  const handleManualSync = async () => {
    try {
      setIsSyncing(true);
      triggerHaptic(40);
      const res = await triggerCloudSync();
      setIsSyncing(false);
      if (res.success) {
        setSuccessMsg(
          language === "bn"
            ? "ক্লাউডের সাথে সকল দোয়া সফলভাবে সিঙ্ক হয়েছে"
            : "All duas synced with cloud successfully"
        );
        setTimeout(() => setSuccessMsg(null), 2500);
      } else {
        setErrorMsg(
          res.error || (language === "bn" ? "সিঙ্ক করতে ব্যর্থ হয়েছে" : "Sync failed")
        );
      }
    } catch (e) {
      setIsSyncing(false);
      setErrorMsg(
        language === "bn" ? "ক্লাউড সিঙ্ক করতে সমস্যা হয়েছে" : "Sync failed"
      );
    }
  };

  const handleLogout = async () => {
    try {
      triggerHaptic(30);
      await logoutUser();
      onClose();
    } catch (e) {
      setErrorMsg(
        language === "bn" ? "লগআউট করতে সমস্যা হয়েছে" : "Logout failed"
      );
    }
  };

  const userInitial = syncState.user?.email
    ? syncState.user.email.charAt(0).toUpperCase()
    : "D";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cloud-auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-[#181818] border border-zinc-200 dark:border-zinc-800 rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col my-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 pb-3.5 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[12px] bg-[#ffb31a]/15 text-[#c87d00] dark:text-[#ffb31a] flex items-center justify-center shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="cloud-auth-modal-title"
                className="text-base font-bold text-zinc-900 dark:text-zinc-50 leading-tight"
              >
                {syncState.user
                  ? language === "bn"
                    ? "ক্লাউড ব্যাকআপ সক্রিয়"
                    : "Cloud Sync Active"
                  : language === "bn"
                  ? "সহজ ক্লাউড ব্যাকআপ"
                  : "Simple Cloud Backup"}
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-none mt-0.5">
                {syncState.user
                  ? language === "bn"
                    ? "আপনার অ্যাকাউন্ট ও ব্যাকআপ রিকভারি"
                    : "Your Account & Cloud Storage"
                  : language === "bn"
                  ? "ইমেইল ও পাসকোড দিয়ে ১-ক্লিকে ডেটা সেভ রাখুন"
                  : "Enter Email & Passcode to enable backup"}
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
            /* Logged In View */
            <div className="flex flex-col gap-4">
              {/* Account Card */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/70 rounded-[20px] border border-zinc-200/80 dark:border-zinc-800 flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-[#ffb31a]/20 text-[#c87d00] dark:text-[#ffb31a] font-extrabold text-lg flex items-center justify-center shrink-0 border border-[#ffb31a]/30">
                  {userInitial}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate font-sans">
                    {syncState.user.email}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {language === "bn"
                        ? "ক্লাউড সিঙ্ক সক্রিয় রয়েছে"
                        : "Cloud Auto-Sync Active"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Last Sync Timestamp Record */}
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
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      isSyncing || syncState.status === "syncing"
                        ? "animate-spin"
                        : ""
                    }`}
                  />
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
            /* Logged Out Direct Form View */
            <div className="flex flex-col gap-4">
              {/* Feature Points */}
              <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/60 rounded-[18px] border border-zinc-200/70 dark:border-zinc-800/70 flex flex-col gap-2">
                <div className="flex items-start gap-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    {language === "bn"
                      ? "কোনো গুগল কনসোল বা এপিআই কি ছাড়াই সরাসরি ব্যাকআপ সক্রিয় হবে।"
                      : "Direct backup without Google API setup or complex configuration."}
                  </span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                  <Smartphone className="w-4 h-4 text-[#c87d00] dark:text-[#ffb31a] shrink-0 mt-0.5" />
                  <span>
                    {language === "bn"
                      ? "নতুন ডিভাইসে এই ইমেইল ও পাসকোড দিলেই সাথে সাথে সব দোয়া রিস্টোর হবে।"
                      : "Enter this email & passcode on any new phone to restore all duas."}
                  </span>
                </div>
              </div>

              {/* Login / Register Form */}
              <form onSubmit={handleCredentialsLogin} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#ffb31a]" />
                    <span>{language === "bn" ? "আপনার ইমেইল:" : "Your Email:"}</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. mahim@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-100/80 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#ffb31a]/40 focus:border-[#ffb31a] transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#ffb31a]" />
                    <span>{language === "bn" ? "গোপন পাসকোড বা পিন:" : "Secret Passcode / PIN:"}</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="আপনার পছন্দের পাসকোড বা পাসওয়ার্ড"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-100/80 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#ffb31a]/40 focus:border-[#ffb31a] transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-1 w-full min-h-[46px] px-4 py-2.5 bg-[#ffb31a] hover:bg-[#e69c05] text-zinc-950 font-bold text-xs rounded-[16px] shadow-sm hover:shadow transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Cloud className="w-4 h-4" />
                      <span>
                        {language === "bn"
                          ? "লগইন ও ব্যাকআপ চালু করুন"
                          : "Sign In & Enable Backup"}
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
