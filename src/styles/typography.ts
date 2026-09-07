/**
 * Centralized Typography Configuration for Dua Card
 * 
 * Predefined semantic text styles ensuring uniform typographic hierarchy 
 * across editor, cards, and reader view with calibrated 4px/8px design system spacing.
 */

export interface TypographyStyle {
  id: string;
  name: string;
  bengaliLabel: string;
  description: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  className: string;
  containerClassName?: string;
}

export const SEMANTIC_STYLES: Record<string, TypographyStyle> = {
  "dua-title": {
    id: "dua-title",
    name: "Dua Title",
    bengaliLabel: "শিরোনাম",
    description: "দোয়ার প্রধান শিরোনাম - বড় ও বোল্ড",
    fontSize: "text-[19px] sm:text-[21px]",
    fontWeight: "font-extrabold",
    lineHeight: "leading-[1.45]",
    className: "dua-title text-[19px] sm:text-[21px] font-bold leading-[1.45] text-zinc-900 dark:text-zinc-50 mb-2.5 font-bengali tracking-normal",
  },
  "dua-pronunciation": {
    id: "dua-pronunciation",
    name: "Bengali Pronunciation",
    bengaliLabel: "উচ্চারণ",
    description: "আরবি বা বাংলা উচ্চারণ - স্পষ্ট ও পরিচ্ছন্ন",
    fontSize: "text-[16px] sm:text-[17px]",
    fontWeight: "font-medium",
    lineHeight: "leading-[1.75]",
    className: "dua-pronunciation text-[16px] sm:text-[17px] font-medium leading-[1.75] text-zinc-800 dark:text-zinc-200 mb-2 font-bengali",
  },
  "dua-meaning": {
    id: "dua-meaning",
    name: "Meaning / Translation",
    bengaliLabel: "অনুবাদ",
    description: "দোয়ার অর্থ ও অনুবাদ - হালকা সোনালী হাইলাইট ও বর্ডার",
    fontSize: "text-[13px] sm:text-[14px]",
    fontWeight: "font-normal",
    lineHeight: "leading-[1.7]",
    className: "dua-meaning text-[13px] sm:text-[14px] font-normal leading-[1.7] text-zinc-900 dark:text-zinc-100 pl-3.5 pr-3 py-2.5 my-2.5 border-l-[3px] border-[#ffb31a] bg-amber-500/[0.06] dark:bg-amber-400/[0.08] rounded-r-[12px] font-bengali shadow-2xs",
  },
  "dua-paragraph": {
    id: "dua-paragraph",
    name: "Normal Paragraph",
    bengaliLabel: "সাধারণ টেক্সট",
    description: "শিক্ষা, প্রেক্ষাপট বা সহায়ক নোট",
    fontSize: "text-[12px] sm:text-[13px]",
    fontWeight: "font-normal",
    lineHeight: "leading-[1.7]",
    className: "dua-paragraph text-[12px] sm:text-[13px] font-normal leading-[1.7] text-zinc-600 dark:text-zinc-300 my-2 font-bengali",
  },
};
