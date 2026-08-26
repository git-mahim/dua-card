"use client";

import React, { useState, useRef, useEffect } from "react";
import { toPng } from "html-to-image";
import { DuaRecord } from "@/lib/types";
import { StructuredDuaViewer } from "./StructuredDuaViewer";
import { triggerHaptic } from "@/lib/haptics";
import { Download, Share2, X, Check, Loader2, Sparkles } from "lucide-react";

interface DuaExportModalProps {
  dua: DuaRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DuaExportModal: React.FC<DuaExportModalProps> = ({
  dua,
  isOpen,
  onClose,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [isOpen]);

  if (!isOpen || !dua) return null;

  const generateImageBlob = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    
    // High-resolution 2.5x pixel ratio for crisp sharing
    const dataUrl = await toPng(cardRef.current, {
      quality: 0.98,
      pixelRatio: 2.5,
      cacheBust: true,
      skipFonts: false,
    });

    const res = await fetch(dataUrl);
    return await res.blob();
  };

  const handleDownloadImage = async () => {
    try {
      setIsExporting(true);
      triggerHaptic(40);
      
      const blob = await generateImageBlob();
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const cleanTitle = (dua.title || "dua")
        .toLowerCase()
        .replace(/[^a-z0-9\u0980-\u09FF]/g, "-")
        .slice(0, 30);
      link.download = `dua-card-${cleanTitle}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Export image error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    try {
      setIsExporting(true);
      triggerHaptic(40);
      const blob = await generateImageBlob();
      if (!blob) return;

      const cleanTitle = dua.title || "দোয়া কার্ড";
      const file = new File([blob], `${cleanTitle}.png`, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: cleanTitle,
          text: dua.plainTextPreview ? `${dua.plainTextPreview.slice(0, 100)}...` : cleanTitle,
          files: [file],
        });
      } else if (navigator.share) {
        await navigator.share({
          title: cleanTitle,
          text: `${cleanTitle}\n\n${dua.plainTextPreview}`,
        });
      } else {
        // Fallback to download
        await handleDownloadImage();
      }
    } catch (err) {
      // User cancelled or share error
      console.log("Share dismissed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 h-[100dvh] w-screen overscroll-none font-bengali overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-[#181818] border border-zinc-200/90 dark:border-zinc-800/90 rounded-[24px] p-4 sm:p-5 shadow-2xl flex flex-col gap-4 text-left my-auto"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[10px] bg-[#ffb31a]/15 text-[#c87d00] dark:text-[#ffb31a] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                ইমেজ হিসেবে সেভ ও শেয়ার
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                সুন্দর মার্জিন ও হাই কোয়ালিটি কার্ড প্রিভিউ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme Selector Pill for Image */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            ইমেজ স্টাইল:
          </span>
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-[10px] border border-zinc-200/80 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => setThemeMode("light")}
              className={`px-3 py-1 text-xs font-bold rounded-[8px] transition-all ${
                themeMode === "light"
                  ? "bg-white text-zinc-950 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              লাইট থিম
            </button>
            <button
              type="button"
              onClick={() => setThemeMode("dark")}
              className={`px-3 py-1 text-xs font-bold rounded-[8px] transition-all ${
                themeMode === "dark"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              ডার্ক থিম
            </button>
          </div>
        </div>

        {/* Live Export Card Canvas (With generous aesthetic margins) */}
        <div className="w-full max-h-[50vh] overflow-y-auto rounded-2xl border border-zinc-200/90 dark:border-zinc-800 p-2 bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center">
          <div
            ref={cardRef}
            className={`w-full max-w-sm rounded-[22px] p-6 sm:p-7 flex flex-col justify-between gap-4 transition-colors ${
              themeMode === "light"
                ? "bg-[#faf8f5] text-zinc-950 border border-amber-200/60 shadow-md"
                : "bg-[#141414] text-zinc-50 border border-zinc-800 shadow-xl"
            }`}
          >
            {/* Top decorative header in exported image */}
            <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
              <span className="text-[11px] font-bold text-[#c87d00] dark:text-[#ffb31a] tracking-wider uppercase">
                🌙 দৈনিক দোয়া
              </span>
              <span className="text-[10px] text-zinc-400 font-medium">
                {new Date().toLocaleDateString("bn-BD")}
              </span>
            </div>

            {/* Dua Content with Full Bengali Typography */}
            <div className="py-2">
              <StructuredDuaViewer
                content={dua.richTextContent}
                isTruncated={false}
              />
            </div>

            {/* Bottom Brand Watermark */}
            <div className="pt-3 border-t border-amber-500/20 flex items-center justify-between text-[11px] text-zinc-400 font-bengali">
              <span className="font-semibold text-zinc-500 dark:text-zinc-400">
                ✨ দোয়া কার্ড
              </span>
              <span className="text-[10px] text-zinc-400">
                Dua Card App
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={isExporting}
            className="min-h-[44px] flex items-center justify-center gap-2 px-4 py-2 bg-[#ffb31a] hover:bg-[#e69c05] text-zinc-950 font-bold text-xs rounded-[12px] shadow-xs active:scale-95 transition-all disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : copied ? (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>ডাউনলোড সম্পন্ন!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>ইমেজ ডাউনলোড</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleShare}
            disabled={isExporting}
            className="min-h-[44px] flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-xs rounded-[12px] shadow-xs active:scale-95 transition-all disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" />
            <span>সরাসরি শেয়ার</span>
          </button>
        </div>
      </div>
    </div>
  );
};
