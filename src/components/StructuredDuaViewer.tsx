import React from "react";
import { JSONContent } from "@tiptap/react";
import { SEMANTIC_STYLES } from "@/styles/typography";

interface StructuredDuaViewerProps {
  content: JSONContent;
  isTruncated?: boolean;
  maxBlocks?: number;
  hideVirtue?: boolean;
}

/**
 * Render inline text with marks (bold, italic)
 */
function renderInlineContent(nodes?: JSONContent[]): React.ReactNode {
  if (!nodes || !Array.isArray(nodes)) return null;

  return nodes.map((node, index) => {
    if (node.type === "text" && node.text) {
      let element: React.ReactNode = node.text;

      if (node.marks && Array.isArray(node.marks)) {
        for (const mark of node.marks) {
          if (mark.type === "bold") {
            element = <strong key={`b-${index}`}>{element}</strong>;
          } else if (mark.type === "italic") {
            element = <em key={`i-${index}`}>{element}</em>;
          }
        }
      }

      return <React.Fragment key={index}>{element}</React.Fragment>;
    }
    return null;
  });
}

/**
 * Safely render TipTap JSON content with semantic typography classes
 */
export const StructuredDuaViewer: React.FC<StructuredDuaViewerProps> = ({
  content,
  isTruncated = false,
  maxBlocks = 3,
  hideVirtue = false,
}) => {
  if (!content || !content.content || !Array.isArray(content.content)) {
    return null;
  }

  let visibleBlocks = content.content;

  // If hideVirtue is enabled on Home screen, filter out virtue and secondary notes
  if (hideVirtue) {
    visibleBlocks = visibleBlocks.filter((block) => {
      const style = block.attrs?.semanticStyle;
      return style !== "dua-virtue" && style !== "dua-paragraph";
    });

    // Fallback: If all blocks were filtered out, show at least first 2 blocks
    if (visibleBlocks.length === 0) {
      visibleBlocks = content.content.slice(0, 2);
    }
  }

  const blocks = isTruncated
    ? visibleBlocks.slice(0, maxBlocks)
    : visibleBlocks;

  return (
    <div className="dua-content-root font-bengali text-left select-text">
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          const styleKey = block.attrs?.semanticStyle || "dua-paragraph";
          const typography = SEMANTIC_STYLES[styleKey] || SEMANTIC_STYLES["dua-paragraph"];
          const inner = renderInlineContent(block.content);

          // If paragraph is completely empty, render empty spacer
          if (!block.content || block.content.length === 0) {
            return <div key={index} className="h-2" />;
          }

          if (styleKey === "dua-title") {
            return (
              <h3 key={index} className={typography.className}>
                {inner}
              </h3>
            );
          }

          if (styleKey === "dua-virtue") {
            return (
              <div key={index} className={typography.className}>
                {inner}
              </div>
            );
          }

          return (
            <p key={index} className={typography.className}>
              {inner}
            </p>
          );
        }

        if (block.type === "bulletList") {
          return (
            <ul key={index} className="list-disc pl-5 my-2 space-y-1 text-sm text-zinc-800 dark:text-zinc-200">
              {block.content?.map((item, itemIdx) => (
                <li key={itemIdx}>
                  {item.content?.map((subBlock, subIdx) => (
                    <span key={subIdx}>
                      {renderInlineContent(subBlock.content)}
                    </span>
                  ))}
                </li>
              ))}
            </ul>
          );
        }

        return null;
      })}
    </div>
  );
};
