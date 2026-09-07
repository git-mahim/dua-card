"use client";

import React, { useState, useEffect } from "react";
import { Download, X, HelpCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export const InstallPwaPrompt: React.FC = () => {
  const { language } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showHelper, setShowHelper] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (isInstalled || dismissed) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else {
      setShowHelper(!showHelper);
    }
  };

  return (
    <aside
      aria-label="PWA Installation Notice"
      className="w-full mb-4 p-3.5 bg-[#ffb31a]/10 dark:bg-[#ffb31a]/15 border border-[#ffb31a]/25 dark:border-[#ffb31a]/30 rounded-2xl flex flex-col gap-2 text-xs transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold">
          <Download className="w-4 h-4 shrink-0 text-[#ffb31a]" />
          <span>{language === "bn" ? "ফোনে অ্যাপ হিসেবে ইনস্টল করুন" : "Install App on Phone"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3 py-1 bg-[#ffb31a] hover:bg-[#e69c05] active:scale-95 text-zinc-950 font-bold rounded-lg text-xs transition-all shadow-sm"
          >
            {deferredPrompt
              ? (language === "bn" ? "ইনস্টল করুন" : "Install")
              : (language === "bn" ? "কীভাবে ইনস্টল করবেন?" : "How to install?")}
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            aria-label={language === "bn" ? "বিজ্ঞপ্তি বন্ধ করুন" : "Dismiss"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showHelper && (
        <div className="pt-2 border-t border-[#ffb31a]/20 text-zinc-700 dark:text-zinc-300 text-left leading-relaxed">
          <p className="flex items-start gap-1.5 mb-1">
            <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#ffb31a]" />
            <span>
              {language === "bn" ? (
                <>
                  <strong>Android Chrome:</strong> ব্রাউজারের উপরে ডানদিকের তিনটি ডট (<span className="font-mono">⋮</span>) মেনু খুলুন এবং <strong>&apos;Add to Home screen&apos;</strong> বা <strong>&apos;Install app&apos;</strong> নির্বাচন করুন।
                </>
              ) : (
                <>
                  <strong>Android Chrome / Safari:</strong> Tap browser menu (<span className="font-mono">⋮</span> or Share) and select <strong>&apos;Add to Home Screen&apos;</strong>.
                </>
              )}
            </span>
          </p>
        </div>
      )}
    </aside>
  );
};
