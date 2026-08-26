/**
 * Font Size Customization and Management for Dua Card
 */

export interface FontSizeSettings {
  title: number;
  pronunciation: number;
  meaning: number;
  general: number;
}

export const DEFAULT_FONT_SIZES: FontSizeSettings = {
  title: 20,
  pronunciation: 16,
  meaning: 15,
  general: 15,
};

export interface FontElementConfig {
  key: keyof FontSizeSettings;
  label: string;
  min: number;
  max: number;
  presets: { s: number; m: number; l: number };
}

export const FONT_CONFIGS: FontElementConfig[] = [
  {
    key: "title",
    label: "শিরোনাম",
    min: 15,
    max: 26,
    presets: { s: 17, m: 20, l: 24 },
  },
  {
    key: "pronunciation",
    label: "উচ্চারণ",
    min: 12,
    max: 22,
    presets: { s: 14, m: 16, l: 19 },
  },
  {
    key: "meaning",
    label: "অনুবাদ",
    min: 12,
    max: 22,
    presets: { s: 13, m: 15, l: 18 },
  },
  {
    key: "general",
    label: "সাধারণ টেক্সট",
    min: 12,
    max: 22,
    presets: { s: 13, m: 15, l: 18 },
  },
];

export const FONT_STORAGE_KEY = "dua_card_font_size_pref";

/**
 * Apply CSS variables to :root / documentElement
 */
export function applyFontSizesToDOM(settings: FontSizeSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--dua-font-title", `${settings.title}px`);
  root.style.setProperty("--dua-font-pronunciation", `${settings.pronunciation}px`);
  root.style.setProperty("--dua-font-meaning", `${settings.meaning}px`);
  root.style.setProperty("--dua-font-general", `${settings.general}px`);
}

/**
 * Load saved font size preferences from localStorage
 */
export function loadSavedFontSizes(): FontSizeSettings {
  if (typeof window === "undefined") return { ...DEFAULT_FONT_SIZES };
  try {
    const saved = localStorage.getItem(FONT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        title: typeof parsed.title === "number" ? parsed.title : DEFAULT_FONT_SIZES.title,
        pronunciation:
          typeof parsed.pronunciation === "number"
            ? parsed.pronunciation
            : DEFAULT_FONT_SIZES.pronunciation,
        meaning:
          typeof parsed.meaning === "number" ? parsed.meaning : DEFAULT_FONT_SIZES.meaning,
        general:
          typeof parsed.general === "number" ? parsed.general : DEFAULT_FONT_SIZES.general,
      };
    }
  } catch (e) {
    console.error("Failed to load font size settings:", e);
  }
  return { ...DEFAULT_FONT_SIZES };
}

/**
 * Save and apply font size settings
 */
export function saveFontSizes(settings: FontSizeSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FONT_STORAGE_KEY, JSON.stringify(settings));
    applyFontSizesToDOM(settings);
  } catch (e) {
    console.error("Failed to save font size settings:", e);
  }
}
