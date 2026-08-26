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
 * Check if a JSONContent node has any non-empty text
 */
function hasTextContent(block: JSONContent): boolean {
  if (block.type === "horizontalRule") return true;
  if (!block.content || !Array.isArray(block.content) || block.content.length === 0) {
    return false;
  }
  return block.content.some((child) => {
    if (child.type === "text" && child.text && child.text.trim().length > 0) {
      return true;
    }
    if (child.content && Array.isArray(child.content)) {
      return hasTextContent(child);
    }
    return false;
  });
}

/**
 * Render inline text with marks (bold, italic, strike, code)
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
          } else if (mark.type === "strike") {
            element = <s key={`s-${index}`}>{element}</s>;
          } else if (mark.type === "code") {
            element = (
              <code
                key={`c-${index}`}
                className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs font-mono text-amber-600 dark:text-amber-400"
              >
                {element}
              </code>
            );
          }
        }
      }

      return <React.Fragment key={index}>{element}</React.Fragment>;
    }
    return null;
  });
}

/**
 * Safely render TipTap JSON content with semantic typography classes and full block support
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

  // Filter out any blocks that have no actual text/content
  let visibleBlocks = content.content.filter((block) => hasTextContent(block));

  // If hideVirtue is enabled on Home screen, filter out virtue and secondary notes
  if (hideVirtue) {
    visibleBlocks = visibleBlocks.filter((block) => {
      const style = block.attrs?.semanticStyle;
      return style !== "dua-virtue" && style !== "dua-paragraph";
    });

    // Fallback: If all blocks were filtered out, show at least first 2 blocks
    if (visibleBlocks.length === 0) {
      visibleBlocks = content.content
        .filter((block) => hasTextContent(block))
        .slice(0, 2);
    }
  }

  const blocks = isTruncated
    ? visibleBlocks.slice(0, maxBlocks)
    : visibleBlocks;

  return (
    <div className="dua-content-root font-bengali text-left select-text">
      {blocks.map((block, index) => {
        // 1. Paragraphs (with semantic styles: title, pronunciation, meaning, virtue, paragraph)
        if (block.type === "paragraph") {
          // If paragraph is completely empty, omit completely without any empty spacer
          if (!hasTextContent(block)) {
            return null;
          }

          const styleKey = block.attrs?.semanticStyle || "dua-paragraph";
          const typography = SEMANTIC_STYLES[styleKey] || SEMANTIC_STYLES["dua-paragraph"];
          const inner = renderInlineContent(block.content);

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

        // 2. Blockquotes (কোটেশন / উদ্ধৃতি)
        if (block.type === "blockquote") {
          if (!hasTextContent(block)) return null;

          return (
            <blockquote
              key={index}
              className="border-l-[3.5px] border-[#ffb31a] bg-[#eef0f3] dark:bg-[#222224] pl-3.5 pr-3.5 py-2 my-2 rounded-r-[12px] text-zinc-900 dark:text-zinc-100 text-[12px] font-medium leading-[1.6] shadow-2xs"
            >
              {block.content?.map((subBlock, subIdx) => {
                if (subBlock.type === "paragraph") {
                  if (!hasTextContent(subBlock)) return null;
                  return (
                    <p key={subIdx} className="m-0">
                      {renderInlineContent(subBlock.content)}
                    </p>
                  );
                }
                return <div key={subIdx}>{renderInlineContent(subBlock.content)}</div>;
              })}
            </blockquote>
          );
        }

        // 3. Bullet Lists (বুলেট তালিকা)
        if (block.type === "bulletList") {
          if (!hasTextContent(block)) return null;

          return (
            <ul key={index} className="list-disc pl-5 my-2 space-y-1 text-sm text-zinc-800 dark:text-zinc-200">
              {block.content?.map((item, itemIdx) => (
                <li key={itemIdx} className="leading-relaxed">
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

        // 4. Ordered Lists (নম্বর তালিকা)
        if (block.type === "orderedList") {
          if (!hasTextContent(block)) return null;

          return (
            <ol key={index} className="list-decimal pl-5 my-2 space-y-1 text-sm text-zinc-800 dark:text-zinc-200">
              {block.content?.map((item, itemIdx) => (
                <li key={itemIdx} className="leading-relaxed">
                  {item.content?.map((subBlock, subIdx) => (
                    <span key={subIdx}>
                      {renderInlineContent(subBlock.content)}
                    </span>
                  ))}
                </li>
              ))}
            </ol>
          );
        }

        // 5. Horizontal Divider (বিভাজক রেখা)
        if (block.type === "horizontalRule") {
          return (
            <hr key={index} className="my-2.5 border-t border-zinc-200 dark:border-zinc-800" />
          );
        }

        // 6. Code Block (কোড ব্লক)
        if (block.type === "codeBlock") {
          if (!hasTextContent(block)) return null;

          return (
            <pre
              key={index}
              className="my-2 p-3 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 rounded-xl font-mono text-xs overflow-x-auto border border-zinc-200 dark:border-zinc-800"
            >
              <code>{renderInlineContent(block.content)}</code>
            </pre>
          );
        }

        return null;
      })}
    </div>
  );
};
