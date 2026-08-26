import { Extension } from "@tiptap/react";
import Paragraph from "@tiptap/extension-paragraph";
import { SEMANTIC_STYLES } from "@/styles/typography";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    semanticStyle: {
      /**
       * Set the semantic style of the current block
       */
      setSemanticStyle: (styleName: string) => ReturnType;
      /**
       * Unset the semantic style (revert to normal paragraph)
       */
      unsetSemanticStyle: () => ReturnType;
    };
  }
}

/**
 * Custom TipTap Paragraph extension with support for semantic styles
 */
export const SemanticParagraph = Paragraph.extend({
  name: "paragraph",

  addAttributes() {
    return {
      semanticStyle: {
        default: "dua-paragraph",
        rendered: true,
        parseHTML: (element) => {
          return element.getAttribute("data-semantic-style") || "dua-paragraph";
        },
        renderHTML: (attributes) => {
          const styleKey = attributes.semanticStyle || "dua-paragraph";
          const typography = SEMANTIC_STYLES[styleKey];
          const customClass = typography ? typography.className : "dua-paragraph";

          return {
            "data-semantic-style": styleKey,
            class: customClass,
          };
        },
      },
    };
  },

  addCommands() {
    return {
      setSemanticStyle:
        (styleName: string) =>
        ({ commands }) => {
          return commands.updateAttributes("paragraph", {
            semanticStyle: styleName,
          });
        },
      unsetSemanticStyle:
        () =>
        ({ commands }) => {
          return commands.updateAttributes("paragraph", {
            semanticStyle: "dua-paragraph",
          });
        },
    };
  },
});
