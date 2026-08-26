"use client";

import React, { useState, useEffect } from "react";
import { DuaRecord } from "@/lib/types";
import { RichTextEditor, extractDuaMetadata } from "./Editor/RichTextEditor";
import { JSONContent } from "@tiptap/react";
import { ArrowLeft, Check, AlertCircle } from "lucide-react";

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
  }, [dua, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!editorData.plainText.trim()) {
      setErrorMsg("দয়া করে দোয়ার কিছু বিবরণ বা টেক্সট লিখুন।");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg("");
      await onSave({
        richTextContent: editorData.json,
        plainTextPreview: editorData.plainText,
        title: editorData.extractedTitle || "দোয়া",
      });
      onClose();
    } catch (err) {
      console.error("Save dua error:", err);
      setErrorMsg("দোয়া সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col bg-background text-foreground animate-in fade-in duration-150 overflow-y-auto"
    >
      {/* Top Action Header */}
      <header className="sticky top-0 z-10 w-full bg-background/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          aria-label="বাতিল করুন"
          className="p-2 -ml-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h2 className="text-sm font-bold font-bengali text-zinc-900 dark:text-zinc-100">
          {dua ? "দোয়া সম্পাদনা" : "নতুন দোয়া যুক্ত করুন"}
        </h2>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#ffb31a] hover:bg-[#e69c05] active:scale-95 text-zinc-950 text-xs font-bold font-bengali rounded-xl transition-all disabled:opacity-50 shadow-sm"
        >
          {isSaving ? (
            <div className="w-3.5 h-3.5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>সংরক্ষণ</span>
            </>
          )}
        </button>
      </header>

      {/* Editor Body */}
      <main className="flex-1 w-full max-w-lg mx-auto px-3 sm:px-4 py-3 flex flex-col justify-between min-h-0">
        {errorMsg && (
          <div className="p-3 mb-2 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bengali flex items-center gap-2 shrink-0">
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
