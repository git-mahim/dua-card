"use client";

import React from "react";
import { type Editor } from "@tiptap/react";
import {
  Bold,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo2,
  Redo2,
  Type,
  Languages,
  BookOpen,
  AlignLeft,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";
import { SEMANTIC_STYLES } from "@/styles/typography";
import { useLanguage } from "@/lib/i18n";

interface EditorToolbarProps {
  editor: Editor | null;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  const { language } = useLanguage();
  if (!editor) return null;

  const currentSemanticStyle =
    editor.getAttributes("paragraph").semanticStyle || "dua-paragraph";

  const handleStyleChange = (styleKey: string) => {
    if (!editor) return;
    triggerHaptic(25);
    editor.chain().focus().setSemanticStyle(styleKey).run();
  };

  const semanticButtons = [
    {
      key: "dua-title",
      label: language === "bn" ? "শিরোনাম" : "Title",
      icon: Type,
      title: language === "bn" ? (SEMANTIC_STYLES["dua-title"]?.description || "শিরোনাম") : "Title style",
    },
    {
      key: "dua-pronunciation",
      label: language === "bn" ? "উচ্চারণ" : "Arabic",
      icon: Languages,
      title: language === "bn" ? (SEMANTIC_STYLES["dua-pronunciation"]?.description || "উচ্চারণ") : "Pronunciation / Arabic",
    },
    {
      key: "dua-meaning",
      label: language === "bn" ? "অনুবাদ" : "Meaning",
      icon: BookOpen,
      title: language === "bn" ? (SEMANTIC_STYLES["dua-meaning"]?.description || "অনুবাদ") : "Meaning / Translation",
    },
    {
      key: "dua-paragraph",
      label: language === "bn" ? "নোট" : "Notes",
      icon: AlignLeft,
      title: language === "bn" ? (SEMANTIC_STYLES["dua-paragraph"]?.description || "সাধারণ নোট") : "Virtues & Lesson Notes",
    },
  ];

  return (
    <div className="w-full flex flex-col gap-1.5 p-1.5 sm:p-2 bg-white/95 dark:bg-[#181818]/95 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800/90 rounded-[18px] shadow-lg">
      {/* Top Row: Cohesive Segmented Semantic Style Selectors */}
      <div className="grid grid-cols-4 gap-1 no-select">
        {semanticButtons.map((btn) => {
          const Icon = btn.icon;
          const isActive = currentSemanticStyle === btn.key;
          return (
            <button
              key={btn.key}
              type="button"
              onClick={() => handleStyleChange(btn.key)}
              className={`flex items-center justify-center gap-1 py-1.5 px-1 sm:px-2 rounded-[10px] text-[11px] sm:text-xs font-bold transition-all duration-150 active:scale-95 text-center ${
                isActive
                  ? "bg-[#ffb31a] text-zinc-950 shadow-xs ring-1 ring-[#ffb31a] scale-[1.01]"
                  : "bg-zinc-100/90 dark:bg-zinc-850/70 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-200/70 dark:hover:bg-zinc-750 border border-zinc-200/70 dark:border-zinc-800/80"
              }`}
              title={btn.title}
              aria-label={btn.label}
            >
              <Icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${isActive ? "text-zinc-950" : "text-zinc-500 dark:text-zinc-400"}`} />
              <span className="leading-none whitespace-nowrap translate-y-[0.5px]">{btn.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Row: Refined Formatting Tools with Segmented Pill Groups */}
      <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60 dark:border-zinc-800/60">
        {/* Formatting & Blockquote Group */}
        <div className="flex items-center gap-0.5 bg-zinc-100/90 dark:bg-zinc-850/70 p-0.5 rounded-[10px] border border-zinc-200/60 dark:border-zinc-800/60">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(15);
              editor.chain().focus().toggleBold().run();
            }}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-[8px] flex items-center justify-center text-xs font-bold transition-all active:scale-90 ${
              editor.isActive("bold")
                ? "bg-[#ffb31a] text-zinc-950 font-extrabold shadow-2xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/60"
            }`}
            title="Bold"
            aria-label="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(15);
              editor.chain().focus().toggleBlockquote().run();
            }}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-[8px] flex items-center justify-center transition-all active:scale-90 ${
              editor.isActive("blockquote")
                ? "bg-[#ffb31a] text-zinc-950 shadow-2xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/60"
            }`}
            title="Blockquote"
            aria-label="Blockquote"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* List & Divider Group */}
        <div className="flex items-center gap-0.5 bg-zinc-100/90 dark:bg-zinc-850/70 p-0.5 rounded-[10px] border border-zinc-200/60 dark:border-zinc-800/60">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(15);
              editor.chain().focus().toggleBulletList().run();
            }}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-[8px] flex items-center justify-center transition-all active:scale-90 ${
              editor.isActive("bulletList")
                ? "bg-[#ffb31a] text-zinc-950 shadow-2xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/60"
            }`}
            title={language === "bn" ? "বুলেট তালিকা" : "Bullet List"}
            aria-label="Bullet list"
          >
            <List className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(15);
              editor.chain().focus().toggleOrderedList().run();
            }}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-[8px] flex items-center justify-center transition-all active:scale-90 ${
              editor.isActive("orderedList")
                ? "bg-[#ffb31a] text-zinc-950 shadow-2xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/60"
            }`}
            title={language === "bn" ? "নম্বর তালিকা" : "Numbered List"}
            aria-label="Numbered list"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(15);
              editor.chain().focus().setHorizontalRule().run();
            }}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-[8px] flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/60 transition-all active:scale-90"
            title={language === "bn" ? "বিভাজক রেখা (Divider)" : "Divider"}
            aria-label="Divider"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Undo / Redo Group */}
        <div className="flex items-center gap-0.5 bg-zinc-100/90 dark:bg-zinc-850/70 p-0.5 rounded-[10px] border border-zinc-200/60 dark:border-zinc-800/60">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(15);
              editor.chain().focus().undo().run();
            }}
            disabled={!editor.can().undo()}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-[8px] flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/60 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-90"
            title="Undo"
            aria-label="Undo"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(15);
              editor.chain().focus().redo().run();
            }}
            disabled={!editor.can().redo()}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-[8px] flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/60 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-90"
            title="Redo"
            aria-label="Redo"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
