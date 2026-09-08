"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { toBengaliDigits, toBengaliNumber } from "./formatters";

export type Language = "bn" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  formatNumber: (num: number | string) => string;
  formatSyncTime: (timestamp: number | null | undefined) => string;
  formatResetTime: (timeStr: string) => string;
}

const STORAGE_KEY = "dua_card_lang_pref";

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  bn: {
    // Header & Navigation
    appName: "দোয়া কার্ড",
    appSubtitle: "দৈনিক দোয়ার সংগ্রহ ও আমল ট্র্যাকার",
    dailyDhikr: "আজকের আমল",
    settingsTitle: "সেটিংস ও ব্যাকআপ",
    syncTooltip: "গুগল ক্লাউড সিঙ্ক",
    offlineNotice: "অফলাইন মোড সক্রিয়",

    // Tabs & Filter
    allDuas: "সকল দোয়া",
    pendingDuas: "বাকি দোয়া",
    completedDuas: "পড়েছি",
    searchPlaceholder: "দোয়া খুঁজুন (শিরোনাম বা টেক্সট)...",
    noDuasFound: "কোনো দোয়া পাওয়া যায়নি",
    addNewDua: "নতুন দোয়া যোগ করুন",
    emptyStateText: "আপনার দোয়ার সংগ্রহে এখনো কোনো দোয়া যুক্ত করা হয়নি।",
    resetAllButton: "সকল আমল রিসেট",
    resetAllConfirm: "আপনি কি আজকের সকল দোয়ার কাউন্টার রিসেট করতে চান?",

    // Card Badges & Stats
    badgePending: "বাকি",
    badgeCompleted: "পড়েছি",
    todayCount: "আজকে",
    totalCount: "সর্বমোট",
    timesSuffix: "বার",
    showVirtue: "ফজিলত দেখুন",
    hideVirtue: "ফজিলত লুকান",
    quickAddTooltip: "কুইক কাউন্ট",
    actions: "অপশনসমূহ",

    // Actions & Context Menu
    edit: "সম্পাদনা",
    delete: "মুছে ফেলুন",
    analytics: "আমল রিপোর্ট",
    shareImage: "ছবি হিসেবে সেভ",
    moveUp: "উপরে নিন",
    moveDown: "নিচে নিন",
    copy: "কপি করুন",
    copied: "কপি হয়েছে!",
    stayAwake: "স্ক্রিন অন রাখুন",

    // Count Modal
    countModalTitle: "দৈনিক আমল কাউন্টার",
    countModalSub: "আজকের আমল রেকর্ড আপডেট করুন",
    totalReadToday: "আজকে সর্বমোট পাঠ",
    selectPresetCount: "ডিফল্ট সংখ্যা নির্বাচন করুন:",
    quickAddCount: "কুইক যোগ করুন:",
    customCountLabel: "কাস্টম সংখ্যা লিখুন:",
    customCountPlaceholder: "যেমন: ৫০ বা ৫০০",
    addBtn: "যোগ করুন",
    resetCounter: "কাউন্টার রিসেট",
    doneBtn: "সম্পন্ন",
    oneTime: "১ বার",
    threeTimes: "৩ বার",
    sevenTimes: "৭ বার",
    thirtyThreeTimes: "৩৩ বার",
    hundredTimes: "১০০ বার",
    fiveHundredTimes: "৫০০ বার",

    // Settings Modal
    settingsModalTitle: "সেটিংস ও ব্যাকআপ",
    languageSetting: "ভাষা / Language",
    themeSetting: "থিম / Appearance",
    lightMode: "লাইট মোড",
    darkMode: "ডার্ক মোড",
    googleProfileTitle: "ক্লাউড অ্যাকাউন্ট ও ব্যাকআপ",
    connected: "সংযুক্ত",
    notConnected: "সংযুক্ত নেই",
    lastSynced: "সর্বশেষ ব্যাকআপ:",
    lastBackup: "সর্বশেষ ব্যাকআপ:",
    syncNow: "ক্লাউড ব্যাকআপ",
    backupNow: "ক্লাউড ব্যাকআপ",
    restoreNow: "রিস্টোর করুন",
    autoBackupNotice: "ব্যাকআপ বাটনে টিপ দিলে ক্লাউডে ব্যাকআপ সেভ হবে, এবং রিস্টোর বাটনে টিপ দিলে ক্লাউড থেকে রিস্টোর হবে।",
    confirmRestoreCloudTitle: "ক্লাউড ব্যাকআপ রিস্টোর করবেন?",
    confirmRestoreCloudDesc: "ক্লাউডের সর্বশেষ ব্যাকআপ থেকে দোয়াসমূহ লোকাল অ্যাপে রিস্টোর করা হবে। আপনি কি নিশ্চিত?",
    noCloudBackupFound: "ক্লাউডে কোনো ব্যাকআপ পাওয়া যায়নি",
    cloudBackupSuccess: "ক্লাউডে সফলভাবে ব্যাকআপ সংরক্ষিত হয়েছে",
    cloudRestoreSuccess: "ক্লাউড ব্যাকআপ সফলভাবে রিস্টোর হয়েছে",
    logout: "লগআউট",
    signInWithGoogle: "ইমেইল ও পাসকোড দিয়ে ক্লাউড লগইন",
    googleAuthDesc: "আপনার ইমেইল ও পাসকোড দিয়ে লগইন করে সকল ডিভাইসে দোয়া ক্লাউড ব্যাকআপ ও রিস্টোর রাখুন।",
    dailyResetTitle: "দৈনিক আমল রিসেট সময়",
    dailyResetSub: "প্রতিদিন এই সময়ে দোয়ার স্ট্যাটাস আবার নতুন দিনের জন্য রিসেট হবে",
    setTime: "নির্ধারিত সময়:",
    typographyTitle: "ফন্টের আকার কাস্টমাইজ",
    defaultReset: "ডিফল্ট রিসেট",
    duaTitleFont: "দোয়ার শিরোনাম",
    duaArabicFont: "উচ্চারণ / আরবি",
    duaMeaningFont: "দোয়ার অনুবাদ",
    duaVirtueFont: "শিক্ষা ও সহায়ক নোট",
    manualBackupTitle: "ম্যানুয়াল ব্যাকআপ ও রিস্টোর (ফাইল)",
    totalSaved: "সংরক্ষিত:",
    itemsSuffix: "টি",
    exportBackup: "ব্যাকআপ ডাউনলোড (JSON)",
    importBackup: "ফাইল রিস্টোর করুন",
    restoreDefaultDuas: "ডিফল্ট দোয়া রিস্টোর",
    clearAllData: "সকল ডেটা মুছুন",
    hideTitleOnHomeLabel: "হোমপেজে দোয়ার শিরোনাম লুকান",
    hideTitleOnHomeSub: "কার্ডে শিরোনাম অংশটি ডিফল্টভাবে গোপন থাকবে",
    hideVirtueOnHomeLabel: "হোমপেজে দোয়ার ফজিলত লুকান",
    hideVirtueOnHomeSub: "কার্ডে ফজিলত অংশটি ডিফল্টভাবে গোপন থাকবে",

    // Google Cloud Setup in Login Modal
    googleSetupTitle: "গুগল ক্লাউড API সেটআপ (১ বার)",
    googleSetupDesc: "গুগলের অফিসিয়াল লগইন চালু করতে Google Cloud Console থেকে ফ্রি OAuth Client ID ও Secret দিন:",
    copyUriBtn: "কপি URI",
    saveAndLogin: "সংরক্ষণ ও গুগল লগইন",

    // Dialog / Confirmation
    confirmDeleteTitle: "দোয়াটি মুছে ফেলতে চান?",
    confirmDeleteDesc: "এই দোয়াটি স্থায়ীভাবে আপনার তালিকা থেকে মুছে যাবে।",
    confirmClearAllTitle: "সকল ডেটা মুছে ফেলতে চান?",
    confirmClearAllDesc: "আপনার সকল সংরক্ষিত দোয়া ও পড়ার হিস্টোরি মুছে যাবে।",
    cancel: "বাতিল",
    confirm: "নিশ্চিত করুন",

    // Analytics Modal
    analyticsTitle: "আমলের পরিসংখ্যান ও রিপোর্ট",
    overallStats: "সামগ্রিক অগ্রগতি",
    totalRecitations: "সর্বমোট পাঠ",
    maxInSingleDay: "একদিনে সর্বোচ্চ পাঠ",
    activeDays: "আমলকৃত দিন",
    weeklyProgress: "গত ৭ দিনের আমল হিস্টোরি",

    // Image Export Modal
    exportModalTitle: "দোয়া কার্ড ইমেজ তৈরি",
    downloadImage: "ছবি ডাউনলোড করুন",
    shareImageBtn: "শেয়ার করুন",

    // Editor Modal
    createDuaTitle: "নতুন দোয়া যোগ করুন",
    editDuaTitle: "দোয়া সম্পাদনা",
    fieldTitle: "দোয়ার শিরোনাম *",
    fieldTitlePlaceholder: "যেমন: সকালে ও সন্ধ্যায় ৩ বার পড়ার দোয়া",
    fieldArabic: "আরবি / উচ্চারণ",
    fieldArabicPlaceholder: "আরবি মূল টেক্সট অথবা বাংলা উচ্চারণ লিখুন...",
    fieldMeaning: "অর্থ ও অনুবাদ",
    fieldMeaningPlaceholder: "দোয়ার বাংলা অর্থ লিখুন...",
    fieldVirtue: "ফজিলত ও শিক্ষা",
    fieldVirtuePlaceholder: "হাদিসের রেফারেন্স বা দোয়ার ফজিলত লিখুন...",
    saveDua: "সংরক্ষণ করুন",
  },
  en: {
    // Header & Navigation
    appName: "Dua Card",
    appSubtitle: "Daily Islamic Supplications & Dhikr Tracker",
    dailyDhikr: "Daily Dhikr",
    settingsTitle: "Settings & Backup",
    syncTooltip: "Google Cloud Sync",
    offlineNotice: "Offline Mode Active",

    // Tabs & Filter
    allDuas: "All Duas",
    pendingDuas: "Pending",
    completedDuas: "Completed",
    searchPlaceholder: "Search duas by title or text...",
    noDuasFound: "No duas found",
    addNewDua: "Add New Dua",
    emptyStateText: "No duas added yet. Add your first dua using the button below.",
    resetAllButton: "Reset Today's Duas",
    resetAllConfirm: "Are you sure you want to reset all dua counters for today?",

    // Card Badges & Stats
    badgePending: "Pending",
    badgeCompleted: "Completed",
    todayCount: "Today",
    totalCount: "Total",
    timesSuffix: "times",
    showVirtue: "View Virtues",
    hideVirtue: "Hide Virtues",
    quickAddTooltip: "Quick Count",
    actions: "Options",

    // Actions & Context Menu
    edit: "Edit",
    delete: "Delete",
    analytics: "Analytics & History",
    shareImage: "Export Image",
    moveUp: "Move Up",
    moveDown: "Move Down",
    copy: "Copy Text",
    copied: "Copied!",
    stayAwake: "Keep Screen On",

    // Count Modal
    countModalTitle: "Daily Dhikr Counter",
    countModalSub: "Update today's recitation record",
    totalReadToday: "Total Recitations Today",
    selectPresetCount: "Select Preset Count:",
    quickAddCount: "Quick Add:",
    customCountLabel: "Enter Custom Count:",
    customCountPlaceholder: "e.g. 50 or 500",
    addBtn: "Add",
    resetCounter: "Reset Counter",
    doneBtn: "Done",
    oneTime: "1 time",
    threeTimes: "3 times",
    sevenTimes: "7 times",
    thirtyThreeTimes: "33 times",
    hundredTimes: "100 times",
    fiveHundredTimes: "500 times",

    // Settings Modal
    settingsModalTitle: "Settings & Backup",
    languageSetting: "Language / ভাষা",
    themeSetting: "Theme / Appearance",
    lightMode: "Light",
    darkMode: "Dark",
    googleProfileTitle: "Cloud Account & Backup",
    connected: "Connected",
    notConnected: "Not Connected",
    lastSynced: "Last Backup:",
    lastBackup: "Last Backup:",
    syncNow: "Cloud Backup",
    backupNow: "Cloud Backup",
    restoreNow: "Restore Backup",
    autoBackupNotice: "Tap 'Cloud Backup' to save to cloud, and tap 'Restore Backup' to restore your last backup.",
    confirmRestoreCloudTitle: "Restore Cloud Backup?",
    confirmRestoreCloudDesc: "This will restore suas from your latest cloud backup into this device. Are you sure?",
    noCloudBackupFound: "No cloud backup found on server",
    cloudBackupSuccess: "Cloud backup saved successfully",
    cloudRestoreSuccess: "Cloud backup restored successfully",
    logout: "Logout",
    signInWithGoogle: "Sign In with Email & Passcode",
    googleAuthDesc: "Sign in with your Email and Passcode to keep your duas securely backed up across devices.",
    dailyResetTitle: "Daily Dhikr Reset Time",
    dailyResetSub: "Duas daily completion status will automatically reset at this time each day",
    setTime: "Configured Time:",
    typographyTitle: "Customize Font Sizes",
    defaultReset: "Reset Defaults",
    duaTitleFont: "Dua Title",
    duaArabicFont: "Arabic / Pronunciation",
    duaMeaningFont: "Translation & Meaning",
    duaVirtueFont: "Virtues & Lesson Notes",
    manualBackupTitle: "Manual Backup & Restore (File)",
    totalSaved: "Saved:",
    itemsSuffix: "items",
    exportBackup: "Export Backup (JSON)",
    importBackup: "Restore from File",
    restoreDefaultDuas: "Restore Default Duas",
    clearAllData: "Clear All Data",
    hideTitleOnHomeLabel: "Hide Title on Home Cards",
    hideTitleOnHomeSub: "Keep the title section hidden on home cards",
    hideVirtueOnHomeLabel: "Hide Virtues on Home Cards",
    hideVirtueOnHomeSub: "Keep the virtues section collapsed by default on home cards",

    // Google Cloud Setup in Login Modal
    googleSetupTitle: "Google Cloud API Setup (One-time)",
    googleSetupDesc: "To enable official Google login, enter your free OAuth Client ID and Secret from Google Cloud Console:",
    copyUriBtn: "Copy URI",
    saveAndLogin: "Save & Sign In with Google",

    // Dialog / Confirmation
    confirmDeleteTitle: "Delete this Dua?",
    confirmDeleteDesc: "This dua will be permanently deleted from your collection.",
    confirmClearAllTitle: "Clear All Data?",
    confirmClearAllDesc: "All your saved duas and recitation history will be deleted.",
    cancel: "Cancel",
    confirm: "Confirm",

    // Analytics Modal
    analyticsTitle: "Dhikr Analytics & Progress",
    overallStats: "Overall Progress",
    totalRecitations: "Total Recitations",
    maxInSingleDay: "Single Day Record",
    activeDays: "Active Days",
    weeklyProgress: "Last 7 Days Progress",

    // Image Export Modal
    exportModalTitle: "Generate Dua Card Image",
    downloadImage: "Download Image",
    shareImageBtn: "Share Image",

    // Editor Modal
    createDuaTitle: "Add New Dua",
    editDuaTitle: "Edit Dua",
    fieldTitle: "Dua Title *",
    fieldTitlePlaceholder: "e.g. Morning & Evening Protection Dua",
    fieldArabic: "Arabic / Pronunciation",
    fieldArabicPlaceholder: "Enter Arabic text or pronunciation...",
    fieldMeaning: "Meaning & Translation",
    fieldMeaningPlaceholder: "Enter translation in Bengali or English...",
    fieldVirtue: "Virtues & Benefits",
    fieldVirtuePlaceholder: "Enter Hadith references or virtue notes...",
    saveDua: "Save Dua",
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: "bn",
  setLanguage: () => {},
  t: (key: string) => key,
  formatNumber: (n) => String(n),
  formatSyncTime: () => "",
  formatResetTime: () => "",
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("bn");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language;
      if (saved === "en" || saved === "bn") {
        setLanguageState(saved);
        if (typeof document !== "undefined") {
          document.documentElement.lang = saved;
          if (saved === "en") {
            document.documentElement.classList.add("lang-en");
          } else {
            document.documentElement.classList.remove("lang-en");
          }
        }
      }
    } catch {}
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      if (typeof document !== "undefined") {
        document.documentElement.lang = lang;
        if (lang === "en") {
          document.documentElement.classList.add("lang-en");
        } else {
          document.documentElement.classList.remove("lang-en");
        }
      }
    } catch {}
  };

  const t = (key: string): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS.bn?.[key] || key;
  };

  const formatNumber = (num: number | string): string => {
    if (language === "bn") {
      return toBengaliNumber(num);
    }
    const n = typeof num === "number" ? num : parseInt(num.toString(), 10);
    return isNaN(n) ? "0" : n.toLocaleString("en-US");
  };

  const formatSyncTime = (timestamp: number | null | undefined): string => {
    if (!timestamp) {
      return language === "bn" ? "এখনো সিঙ্ক হয়নি" : "Never synced";
    }
    const now = Date.now();
    const diffSec = Math.floor((now - timestamp) / 1000);

    if (diffSec < 45) {
      return language === "bn" ? "এইমাত্র (আপ-টু-ডেট)" : "Just now (Up to date)";
    }

    const d = new Date(timestamp);
    const today = new Date();

    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (language === "bn") {
      const hour = d.getHours();
      const min = d.getMinutes();
      let period = "রাত";
      let displayHour = hour;

      if (hour >= 4 && hour < 6) period = "ভোর";
      else if (hour >= 6 && hour < 12) period = "সকাল";
      else if (hour >= 12 && hour < 16) {
        period = "দুপুর";
        displayHour = hour === 12 ? 12 : hour - 12;
      } else if (hour >= 16 && hour < 19) {
        period = "বিকাল";
        displayHour = hour - 12;
      } else if (hour >= 19 && hour < 23) {
        period = "সন্ধ্যা/রাত";
        displayHour = hour - 12;
      } else {
        period = "রাত";
        displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
      }

      const bh = toBengaliDigits(displayHour);
      const bm = min < 10 ? `০${toBengaliDigits(min)}` : toBengaliDigits(min);
      const timeStr = `${period} ${bh}:${bm} মিনিট`;

      if (isToday) return `আজকে, ${timeStr}`;
      if (isYesterday) return `গতকাল, ${timeStr}`;

      const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
      const month = months[d.getMonth()] || "";
      const day = toBengaliDigits(d.getDate());
      return `${day} ${month}, ${timeStr}`;
    } else {
      // English format
      const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
      if (isToday) return `Today, ${timeStr}`;
      if (isYesterday) return `Yesterday, ${timeStr}`;
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return `${dateStr}, ${timeStr}`;
    }
  };

  const formatResetTime = (timeStr: string): string => {
    if (!timeStr || !timeStr.includes(":")) {
      return language === "bn" ? "সকাল ৬:০০ টা" : "6:00 AM";
    }
    const [hStr, mStr] = timeStr.split(":");
    let hour = parseInt(hStr, 10);
    const min = parseInt(mStr, 10) || 0;
    if (isNaN(hour)) hour = 6;

    if (language === "bn") {
      let period = "সকাল";
      let displayHour = hour;
      if (hour >= 4 && hour < 12) period = "সকাল";
      else if (hour >= 12 && hour < 16) {
        period = "দুপুর";
        displayHour = hour === 12 ? 12 : hour - 12;
      } else if (hour >= 16 && hour < 19) {
        period = "বিকাল";
        displayHour = hour - 12;
      } else {
        period = "রাত";
        displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
      }

      const bh = toBengaliDigits(displayHour);
      const bm = min === 0 ? "০০" : (min < 10 ? `০${toBengaliDigits(min)}` : toBengaliDigits(min));
      return `${period} ${bh}:${bm} টা`;
    } else {
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
      const minStr = min < 10 ? `0${min}` : `${min}`;
      return `${displayHour}:${minStr} ${period}`;
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        formatNumber,
        formatSyncTime,
        formatResetTime,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
