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
          "tiptap flex-1 w-full min-h-[320px] sm:min-h-[420px] p-4 sm:p-5 outline-none font-bengali text-zinc-900 dark:text-zinc-100 leading-relaxed cursor-text",
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
    <div className="w-full flex-1 flex flex-col justify-between h-full gap-3">
      {/* Editor Main Canvas (Expansive Full Height) */}
      <div className="flex-1 w-full bg-surface-card border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-sm overflow-hidden flex flex-col focus-within:ring-2 focus-within:ring-[#ffb31a]/40 transition-all">
        <EditorContent editor={editor} className="flex-1 w-full flex flex-col" />
      </div>

      {/* Sticky Bottom Formatting Toolbar */}
      <div className="sticky bottom-0 z-20 w-full pt-1">
        <EditorToolbar editor={editor} />
      </div>
    </div>
  );
};
