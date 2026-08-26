"use client";

import React from "react";
import { type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Strikethrough,
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

interface EditorToolbarProps {
  editor: Editor | null;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
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
      label: "শিরোনাম",
      icon: Type,
      title: SEMANTIC_STYLES["dua-title"].description,
    },
    {
      key: "dua-pronunciation",
      label: "উচ্চারণ",
      icon: Languages,
      title: SEMANTIC_STYLES["dua-pronunciation"].description,
    },
    {
      key: "dua-meaning",
      label: "অনুবাদ",
      icon: BookOpen,
      title: SEMANTIC_STYLES["dua-meaning"].description,
    },
    {
      key: "dua-paragraph",
      label: "সাধারণ টেক্সট",
      icon: AlignLeft,
      title: SEMANTIC_STYLES["dua-paragraph"].description,
    },
  ];

  return (
    <div className="w-full flex flex-col gap-2 p-2 sm:p-2.5 bg-surface-card/95 dark:bg-[#161616]/95 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800/90 rounded-2xl shadow-xl font-bengali">
      {/* Top Row: Cohesive Segmented Semantic Style Selectors */}
      <div className="grid grid-cols-4 gap-1.5 no-select">
        {semanticButtons.map((btn) => {
          const Icon = btn.icon;
          const isActive = currentSemanticStyle === btn.key;
          return (
            <button
              key={btn.key}
              type="button"
              onClick={() => handleStyleChange(btn.key)}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 sm:px-2.5 rounded-xl text-xs font-bold font-bengali transition-all duration-150 active:scale-95 text-center ${
                isActive
                  ? "bg-[#ffb31a] text-zinc-950 shadow-xs ring-1 ring-[#ffb31a] scale-[1.01]"
                  : "bg-zinc-100/80 dark:bg-zinc-850/60 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/60 border border-zinc-200/70 dark:border-zinc-800/80"
              }`}
              title={btn.title}
              aria-label={btn.label}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-zinc-950" : "text-zinc-500 dark:text-zinc-400"}`} />
              <span className="truncate leading-none translate-y-[0.5px]">{btn.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Row: Refined Formatting Tools with Segmented Pill Groups */}
      <div className="flex items-center justify-between pt-1.5 border-t border-zinc-200/70 dark:border-zinc-800/70">
        {/* Style & Blockquote Group */}
        <div className="flex items-center gap-0.5 bg-zinc-100/80 dark:bg-zinc-850/60 p-0.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(15);
              editor.chain().focus().toggleBold().run();
            }}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all active:scale-90 ${
              editor.isActive("bold")
                ? "bg-[#ffb31a] text-zinc-950 font-extrabold shadow-2xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/60"
            }`}
            title="বোল্ড (Bold)"
            aria-label="বোল্ড"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(15);
              editor.chain().focus().toggleItalic().run();
            }}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 ${
              editor.isActive("italic")
                ? "bg-[#ffb31a] text-zinc-950 shadow-2xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/60"
            }`}
            title="ইটালিক (Italic)"
            aria-label="ইটালিক"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(15);
              editor.chain().focus().toggleStrike().run();
            }}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 ${
              editor.isActive("strike")
                ? "bg-[#ffb31a] text-zinc-950 shadow-2xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/60"
            }`}
            title="স্ট্রাইকথ্রু (Strikethrough)"
            aria-label="স্ট্রাইকথ্রু"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(15);
              editor.chain().focus().toggleBlockquote().run();
            }}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 ${
              editor.isActive("blockquote")
                ? "bg-[#ffb31a] text-zinc-950 shadow-2xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/60"
            }`}
            title="উদ্ধৃতি (Blockquote)"
            aria-label="উদ্ধৃতি"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* List & Divider Group */}
        <div className="flex items-center gap-0.5 bg-zinc-100/80 dark:bg-zinc-850/60 p-0.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(15);
              editor.chain().focus().toggleBulletList().run();
            }}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 ${
              editor.isActive("bulletList")
                ? "bg-[#ffb31a] text-zinc-950 shadow-2xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/60"
            }`}
            title="বুলেট তালিকা"
            aria-label="বুলেট তালিকা"
          >
            <List className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(15);
              editor.chain().focus().toggleOrderedList().run();
            }}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 ${
              editor.isActive("orderedList")
                ? "bg-[#ffb31a] text-zinc-950 shadow-2xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/60"
            }`}
            title="নম্বর তালিকা"
            aria-label="নম্বর তালিকা"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(15);
              editor.chain().focus().setHorizontalRule().run();
            }}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/60 transition-all active:scale-90"
            title="বিভাজক রেখা (Divider)"
            aria-label="বিভাজক রেখা"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Undo / Redo Group */}
        <div className="flex items-center gap-0.5 bg-zinc-100/80 dark:bg-zinc-850/60 p-0.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(15);
              editor.chain().focus().undo().run();
            }}
            disabled={!editor.can().undo()}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/60 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-90"
            title="পূর্বে যান (Undo)"
            aria-label="পূর্বাবস্থায় ফেরান"
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
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/60 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-90"
            title="পুনরায় করুন (Redo)"
            aria-label="পুনরায় করুন"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
