import { DuaRecord } from "./types";

function getBlockText(block: any): string {
  if (!block) return "";
  if (block.type === "text" && block.text) return block.text;
  if (block.content && Array.isArray(block.content)) {
    return block.content.map(getBlockText).join(" ");
  }
  return "";
}

/**
 * Format and copy Dua text and meaning to clipboard:
 *
 * দোয়া: [দোয়ার উচ্চারণ/টেক্সট]
 * অর্থ: [দোয়ার অর্থ]
 */
export async function copyDuaTextAndMeaning(
  dua: DuaRecord,
  lang: string = "bn"
): Promise<{ success: boolean; formatted: string }> {
  let pronunciationText = "";
  let meaningText = "";

  if (dua.richTextContent && Array.isArray(dua.richTextContent.content)) {
    const blocks = dua.richTextContent.content;

    // Extract strictly by semanticStyle: pronunciation for Dua text, meaning for Meaning text
    for (const block of blocks) {
      const style = block.attrs?.semanticStyle;
      const blockText = getBlockText(block).trim();
      if (!blockText) continue;

      if (style === "dua-pronunciation" && !pronunciationText) {
        pronunciationText = blockText;
      } else if (style === "dua-meaning" && !meaningText) {
        meaningText = blockText;
      }
    }

    // Fallback if pronunciation tag was not explicitly set: find first non-title, non-meaning block
    if (!pronunciationText) {
      for (const block of blocks) {
        const style = block.attrs?.semanticStyle;
        const blockText = getBlockText(block).trim();
        if (blockText && style !== "dua-title" && style !== "dua-meaning") {
          pronunciationText = blockText;
          break;
        }
      }
    }
  }

  // Final fallback for plainTextPreview if rich text is empty
  if (!pronunciationText) {
    pronunciationText = dua.plainTextPreview || "";
  }

  let formatted = "";
  if (lang === "bn") {
    formatted = `দোয়া: ${pronunciationText}`;
    if (meaningText) {
      formatted += `\nঅর্থ: ${meaningText}`;
    }
  } else {
    formatted = `Dua: ${pronunciationText}`;
    if (meaningText) {
      formatted += `\nMeaning: ${meaningText}`;
    }
  }

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(formatted);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = formatted;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    // Try native share on mobile devices if available
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: dua.title || (lang === "bn" ? "দোয়া" : "Dua"),
          text: formatted,
        });
      } catch (shareErr) {
        // User cancelled share or share unavailable, clipboard copy succeeded
      }
    }

    return { success: true, formatted };
  } catch (err) {
    console.error("Failed to copy dua text:", err);
    return { success: false, formatted };
  }
}
