"use client";

import React, { useEffect } from "react";
import { useEditor, EditorContent, JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { SemanticParagraph } from "./extensions/semanticStyles";
import { EditorToolbar } from "./EditorToolbar";

interface RichTextEditorProps {
  initialContent?: JSONContent | null;
  placeholder?: string;
  onChange?: (data: {
    json: JSONContent;
    plainText: string;
    extractedTitle: string;
  }) => void;
  autoFocus?: boolean;
}

/**
 * Extract plain text and first Dua Title from TipTap JSON
 */
export function extractDuaMetadata(json: JSONContent): {
  plainText: string;
  extractedTitle: string;
} {
  let plainText = "";
  let extractedTitle = "";

  function traverse(node: JSONContent) {
    if (node.type === "text" && node.text) {
      plainText += node.text + " ";
    }

    if (
      !extractedTitle &&
      node.type === "paragraph" &&
      node.attrs?.semanticStyle === "dua-title"
    ) {
      const titleText =
        node.content?.map((child) => child.text || "").join("") || "";
      if (titleText.trim()) {
        extractedTitle = titleText.trim();
      }
    }

    if (node.content && Array.isArray(node.content)) {
      for (const child of node.content) {
        traverse(child);
      }
    }
  }

  traverse(json);

  // If no explicit dua-title was marked, use the first non-empty line as title
  if (!extractedTitle && plainText.trim()) {
    const firstLine = plainText.trim().split("\n")[0];
    extractedTitle = firstLine.slice(0, 60);
  }

  return {
    plainText: plainText.trim(),
    extractedTitle,
  };
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialContent,
  onChange,
  autoFocus = false,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: false, // Replaced by our SemanticParagraph
        heading: false, // We use semantic styles instead of arbitrary H1/H2
      }),
      SemanticParagraph,
    ],
    content: initialContent || {
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: { semanticStyle: "dua-title" },
          content: [],
        },
      ],
    },
    autofocus: autoFocus,
    editorProps: {
      attributes: {
        class:
          "tiptap flex-1 w-full min-h-[120px] p-3.5 sm:p-4 outline-none font-bengali text-zinc-900 dark:text-zinc-100 leading-relaxed cursor-text",
      },
    },
    onUpdate({ editor }) {
      if (onChange) {
        const json = editor.getJSON();
        const { plainText, extractedTitle } = extractDuaMetadata(json);
        onChange({ json, plainText, extractedTitle });
      }
    },
  });

  useEffect(() => {
    if (editor && initialContent) {
      // If initial content changes externally
      const currentJsonStr = JSON.stringify(editor.getJSON());
      const newJsonStr = JSON.stringify(initialContent);
      if (currentJsonStr !== newJsonStr) {
        editor.commands.setContent(initialContent);
      }
    }
  }, [editor, initialContent]);

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col justify-between h-full gap-2">
      {/* Editor Main Canvas (Gracefully scrollable inside available screen space) */}
      <div className="flex-1 min-h-[120px] w-full bg-white dark:bg-[#181818] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-xs overflow-y-auto flex flex-col focus-within:ring-2 focus-within:ring-[#ffb31a]/40 transition-all">
        <EditorContent editor={editor} className="flex-1 w-full flex flex-col" />
      </div>

      {/* Formatting Toolbar (Docked cleanly above virtual keyboard) */}
      <div className="shrink-0 w-full pt-0.5">
        <EditorToolbar editor={editor} />
      </div>
    </div>
  );
};
