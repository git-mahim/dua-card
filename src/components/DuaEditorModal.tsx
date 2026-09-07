"use client";

import React, { useState, useEffect } from "react";
import { DuaRecord } from "@/lib/types";
import { RichTextEditor, extractDuaMetadata } from "./Editor/RichTextEditor";
import { JSONContent } from "@tiptap/react";
import { ArrowLeft, Check, AlertCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface DuaEditorModalProps {
  dua: DuaRecord | null; // If null, mode is create
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    richTextContent: JSONContent;
    plainTextPreview: string;
    title: string;
  }) => Promise<void>;
}

export const DuaEditorModal: React.FC<DuaEditorModalProps> = ({
  dua,
  isOpen,
  onClose,
  onSave,
}) => {
  const { language, t } = useLanguage();
  const [editorData, setEditorData] = useState<{
    json: JSONContent;
    plainText: string;
    extractedTitle: string;
  }>({
    json: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: { semanticStyle: "dua-title" },
          content: [],
        },
      ],
    },
    plainText: "",
    extractedTitle: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  // Dynamic Visual Viewport listener for seamless mobile virtual keyboard docking
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      if (typeof window !== "undefined" && window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      }
    };

    if (typeof window !== "undefined" && window.visualViewport) {
      setViewportHeight(window.visualViewport.height);
      window.visualViewport.addEventListener("resize", handleResize);
      window.visualViewport.addEventListener("scroll", handleResize);
    }

    return () => {
      if (typeof window !== "undefined" && window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
        window.visualViewport.removeEventListener("scroll", handleResize);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (dua) {
      const { plainText, extractedTitle } = extractDuaMetadata(dua.richTextContent);
      setEditorData({
        json: dua.richTextContent,
        plainText,
        extractedTitle: dua.title || extractedTitle,
      });
    } else {
      setEditorData({
        json: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              attrs: { semanticStyle: "dua-title" },
              content: [],
            },
          ],
        },
        plainText: "",
        extractedTitle: "",
      });
    }
    setErrorMsg("");

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
  }, [dua, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!editorData.plainText.trim()) {
      setErrorMsg(language === "bn" ? "দয়া করে দোয়ার কিছু বিবরণ বা টেক্সট লিখুন।" : "Please enter dua text or details.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg("");
      await onSave({
        richTextContent: editorData.json,
        plainTextPreview: editorData.plainText,
        title: editorData.extractedTitle || (language === "bn" ? "দোয়া" : "Dua"),
      });
      onClose();
    } catch (err) {
      console.error("Save dua error:", err);
      setErrorMsg(language === "bn" ? "দোয়া সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।" : "Failed to save dua. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        height: viewportHeight ? `${viewportHeight}px` : "100dvh",
        maxHeight: viewportHeight ? `${viewportHeight}px` : "100dvh",
      }}
      className="fixed inset-x-0 top-0 z-50 flex flex-col bg-background text-foreground animate-in fade-in duration-150 overflow-hidden box-border"
    >
      {/* Top Action Header */}
      <header className="sticky top-0 z-10 w-full bg-white/85 dark:bg-[#121212]/85 backdrop-blur-xl border-b border-zinc-200/60 dark:border-zinc-800/60 px-4 py-2.5 sm:py-3 flex items-center justify-between max-w-lg mx-auto shrink-0">
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          aria-label={t("cancel")}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all active:scale-95 shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
          {dua ? t("editDuaTitle") : t("createDuaTitle")}
        </h2>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="min-h-[36px] sm:min-h-[38px] flex items-center gap-1.5 px-4 py-1.5 bg-[#ffb31a] hover:bg-[#e69c05] active:scale-95 text-zinc-950 text-xs font-bold rounded-[12px] transition-all disabled:opacity-50 shadow-xs shrink-0"
        >
          {isSaving ? (
            <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{t("saveDua")}</span>
            </>
          )}
        </button>
      </header>

      {/* Editor Main Section */}
      <main className="flex-1 min-h-0 w-full max-w-lg mx-auto px-3 sm:px-4 pt-2 pb-2 flex flex-col justify-between overflow-hidden">
        {errorMsg && (
          <div className="p-2.5 mb-2 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <RichTextEditor
          initialContent={dua ? dua.richTextContent : null}
          onChange={(val) => {
            setEditorData(val);
            if (errorMsg) setErrorMsg("");
          }}
          autoFocus={!dua}
        />
      </main>
    </div>
  );
};
