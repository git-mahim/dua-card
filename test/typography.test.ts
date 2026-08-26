import { describe, it, expect } from "vitest";
import { SEMANTIC_STYLES } from "../src/styles/typography";
import { extractDuaMetadata } from "../src/components/Editor/RichTextEditor";

describe("Typography & Semantic Styles Configuration", () => {
  it("should have predefined semantic styles defined", () => {
    expect(SEMANTIC_STYLES["dua-title"]).toBeDefined();
    expect(SEMANTIC_STYLES["dua-pronunciation"]).toBeDefined();
    expect(SEMANTIC_STYLES["dua-meaning"]).toBeDefined();
    expect(SEMANTIC_STYLES["dua-paragraph"]).toBeDefined();
  });

  it("should have Bengali labels for each semantic style", () => {
    expect(SEMANTIC_STYLES["dua-title"].bengaliLabel).toBe("শিরোনাম");
    expect(SEMANTIC_STYLES["dua-pronunciation"].bengaliLabel).toBe("উচ্চারণ");
    expect(SEMANTIC_STYLES["dua-meaning"].bengaliLabel).toBe("অনুবাদ");
    expect(SEMANTIC_STYLES["dua-paragraph"].bengaliLabel).toBe("সাধারণ টেক্সট");
  });

  it("should extract title and plain text correctly from TipTap JSON", () => {
    const json = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: { semanticStyle: "dua-title" },
          content: [{ type: "text", text: "সাইয়্যিদুল ইস্তিগফার" }],
        },
        {
          type: "paragraph",
          attrs: { semanticStyle: "dua-pronunciation" },
          content: [
            {
              type: "text",
              text: "আল্লাহুম্মা আনতা রাব্বি লা ইলাহা ইল্লা আনতা...",
            },
          ],
        },
      ],
    };

    const { plainText, extractedTitle } = extractDuaMetadata(json);
    expect(extractedTitle).toBe("সাইয়্যিদুল ইস্তিগফার");
    expect(plainText).toContain("সাইয়্যিদুল ইস্তিগফার");
    expect(plainText).toContain("আল্লাহুম্মা আনতা");
  });
});
