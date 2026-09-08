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
  title: 19,
  pronunciation: 17,
  meaning: 13,
  general: 12,
};

export const FONT_STORAGE_KEY = "dua_font_sizes";

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
  root.style.setProperty("--dua-title-size", `${settings.title}px`);
  root.style.setProperty("--dua-pronunciation-size", `${settings.pronunciation}px`);
  root.style.setProperty("--dua-meaning-size", `${settings.meaning}px`);
  root.style.setProperty("--dua-paragraph-size", `${settings.general}px`);
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
        title: typeof parsed.title === "number" ? parsed.title : (typeof parsed["dua-title"] === "number" ? parsed["dua-title"] : DEFAULT_FONT_SIZES.title),
        pronunciation:
          typeof parsed.pronunciation === "number"
            ? parsed.pronunciation
            : (typeof parsed["dua-pronunciation"] === "number" ? parsed["dua-pronunciation"] : DEFAULT_FONT_SIZES.pronunciation),
        meaning:
          typeof parsed.meaning === "number" ? parsed.meaning : (typeof parsed["dua-meaning"] === "number" ? parsed["dua-meaning"] : DEFAULT_FONT_SIZES.meaning),
        general:
          typeof parsed.general === "number" ? parsed.general : (typeof parsed["dua-paragraph"] === "number" ? parsed["dua-paragraph"] : DEFAULT_FONT_SIZES.general),
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
  applyFontSizesToDOM(settings);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(FONT_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save font size settings:", e);
    }
  }
}
