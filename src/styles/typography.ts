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
    fontWeight: "font-bold",
    lineHeight: "leading-[1.35]",
    className: "dua-title text-[19px] sm:text-[21px] font-bold leading-[1.35] text-zinc-900 dark:text-zinc-100 mb-3.5 sm:mb-4 font-bengali tracking-normal",
  },
  "dua-pronunciation": {
    id: "dua-pronunciation",
    name: "Bengali Pronunciation",
    bengaliLabel: "উচ্চারণ",
    description: "আরবি বা বাংলা উচ্চারণ - স্পষ্ট ও পরিচ্ছন্ন",
    fontSize: "text-[16px] sm:text-[17px]",
    fontWeight: "font-medium",
    lineHeight: "leading-[1.5]",
    className: "dua-pronunciation text-[16px] sm:text-[17px] font-medium leading-[1.5] text-zinc-800 dark:text-zinc-200 mb-3.5 font-bengali",
  },
  "dua-meaning": {
    id: "dua-meaning",
    name: "Meaning / Translation",
    bengaliLabel: "অনুবাদ",
    description: "দোয়ার অর্থ ও অনুবাদ - হালকা সোনালী হাইলাইট ও বর্ডার",
    fontSize: "text-[14.5px] sm:text-[15.5px]",
    fontWeight: "font-normal",
    lineHeight: "leading-[1.5]",
    className: "dua-meaning text-[14.5px] sm:text-[15.5px] font-normal leading-[1.5] text-zinc-900 dark:text-zinc-100 pl-3.5 pr-3 py-3 my-3.5 border-l-[3.5px] border-[#ffb31a] bg-[#ffb31a]/10 dark:bg-[#ffb31a]/15 rounded-r-[12px] font-bengali",
  },
  "dua-paragraph": {
    id: "dua-paragraph",
    name: "Normal Paragraph",
    bengaliLabel: "সাধারণ টেক্সট",
    description: "শিক্ষা, প্রেক্ষাপট বা সহায়ক নোট",
    fontSize: "text-[14.5px] sm:text-[15.5px]",
    fontWeight: "font-normal",
    lineHeight: "leading-[1.5]",
    className: "dua-paragraph text-[14.5px] sm:text-[15.5px] font-normal leading-[1.5] text-zinc-700 dark:text-zinc-300 mt-3 mb-2.5 font-bengali",
  },
};
