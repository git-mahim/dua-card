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
    editor.chain().focus().setSemanticStyle(styleKey).run();
  };

  return (
    <div className="w-full flex flex-col gap-2 p-2.5 bg-zinc-100/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
      {/* Semantic Style Selectors (Top Row) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-select">
        {/* 1. শিরোনাম (Title) */}
        <button
          type="button"
          onClick={() => handleStyleChange("dua-title")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold font-bengali shrink-0 transition-all ${
            currentSemanticStyle === "dua-title"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm scale-100"
              : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200/60 dark:border-zinc-700/60"
          }`}
          title={SEMANTIC_STYLES["dua-title"].description}
          aria-label="দোয়ার শিরোনাম"
        >
          <Type className="w-4 h-4 text-[#ffb31a]" />
          <span>শিরোনাম</span>
        </button>

        {/* 2. উচ্চারণ (Pronunciation) */}
        <button
          type="button"
          onClick={() => handleStyleChange("dua-pronunciation")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold font-bengali shrink-0 transition-all ${
            currentSemanticStyle === "dua-pronunciation"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm scale-100"
              : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200/60 dark:border-zinc-700/60"
          }`}
          title={SEMANTIC_STYLES["dua-pronunciation"].description}
          aria-label="উচ্চারণ"
        >
          <Languages className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          <span>উচ্চারণ</span>
        </button>

        {/* 3. অনুবাদ (Meaning with Highlight Box) */}
        <button
          type="button"
          onClick={() => handleStyleChange("dua-meaning")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold font-bengali shrink-0 transition-all ${
            currentSemanticStyle === "dua-meaning"
              ? "bg-[#ffb31a] text-zinc-950 shadow-sm ring-2 ring-[#ffb31a]/40 font-bold"
              : "bg-white dark:bg-zinc-800 text-[#c87d00] dark:text-[#ffb31a] hover:bg-[#ffb31a]/10 dark:hover:bg-[#ffb31a]/15 border border-[#ffb31a]/40"
          }`}
          title={SEMANTIC_STYLES["dua-meaning"].description}
          aria-label="অনুবাদ"
        >
          <BookOpen className="w-4 h-4 text-[#c87d00] dark:text-[#ffb31a]" />
          <span>অনুবাদ</span>
        </button>

        {/* 4. সাধারণ টেক্সট (Normal Paragraph) */}
        <button
          type="button"
          onClick={() => handleStyleChange("dua-paragraph")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold font-bengali shrink-0 transition-all ${
            currentSemanticStyle === "dua-paragraph"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm scale-100"
              : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200/60 dark:border-zinc-700/60"
          }`}
          title={SEMANTIC_STYLES["dua-paragraph"].description}
          aria-label="সাধারণ টেক্সট"
        >
          <AlignLeft className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          <span>সাধারণ টেক্সট</span>
        </button>
      </div>

      {/* Extended Formatting Tools (Bottom Row) */}
      <div className="flex items-center justify-between pt-1.5 border-t border-zinc-200/80 dark:border-zinc-800/80">
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {/* Bold */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
              editor.isActive("bold")
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            }`}
            title="বোল্ড (Bold)"
            aria-label="বোল্ড"
          >
            <Bold className="w-4 h-4" />
          </button>

          {/* Italic */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              editor.isActive("italic")
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            }`}
            title="ইটালিক (Italic)"
            aria-label="ইটালিক"
          >
            <Italic className="w-4 h-4" />
          </button>

          {/* Strikethrough */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              editor.isActive("strike")
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            }`}
            title="স্ট্রাইকথ্রু (Strikethrough)"
            aria-label="স্ট্রাইকথ্রু"
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          {/* Blockquote / উদ্ধৃতি */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              editor.isActive("blockquote")
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            }`}
            title="উদ্ধৃতি (Blockquote)"
            aria-label="উদ্ধৃতি"
          >
            <Quote className="w-4 h-4" />
          </button>

          {/* Bullet List */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              editor.isActive("bulletList")
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            }`}
            title="বুলেট তালিকা"
            aria-label="বুলেট তালিকা"
          >
            <List className="w-4 h-4" />
          </button>

          {/* Numbered / Ordered List */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              editor.isActive("orderedList")
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            }`}
            title="নম্বর তালিকা"
            aria-label="নম্বর তালিকা"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          {/* Horizontal Line / Divider */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            title="বিভাজক রেখা (Divider)"
            aria-label="বিভাজক রেখা"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-1 shrink-0 ml-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="পূর্বে যান (Undo)"
            aria-label="পূর্বাবস্থায় ফেরান"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="পুনরায় করুন (Redo)"
            aria-label="পুনরায় করুন"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
