/**
 * Bengali Number and Date Formatting Utilities
 */

const BENGALI_DIGITS: Record<string, string> = {
  "0": "০",
  "1": "১",
  "2": "২",
  "3": "৩",
  "4": "৪",
  "5": "৫",
  "6": "৬",
  "7": "৭",
  "8": "৮",
  "9": "৯",
};

const BENGALI_DAYS = [
  "রবিবার",
  "সোমবার",
  "মঙ্গলবার",
  "বুধবার",
  "বৃহস্পতিবার",
  "শুক্রবার",
  "শনিবার",
];

const BENGALI_MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

/**
 * Convert any integer or formatted number to Bengali digits with commas
 * e.g. 1000 -> ১,০০০; 25000 -> ২৫,০০০
 */
export function toBengaliNumber(value: number | string): string {
  if (value === undefined || value === null) return "০";
  const num = typeof value === "number" ? value : parseInt(value.toString(), 10);
  if (isNaN(num)) return "০";

  // Use Intl for comma separation
  const formattedStr = num.toLocaleString("en-US");
  return formattedStr.replace(/[0-9]/g, (digit) => BENGALI_DIGITS[digit] || digit);
}

/**
 * Extract day number in Bengali from YYYY-MM-DD
 * e.g. "2026-08-26" -> "২৬"
 */
export function getBengaliDayNumber(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-").map((p) => parseInt(p, 10));
  if (parts.length < 3) return "";
  return toBengaliNumber(parts[2]);
}

/**
 * Format timestamp into short Bengali date e.g. "২৬ আগস্ট"
 */
export function formatBengaliDateShort(timestamp: number): string {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  const month = BENGALI_MONTHS[d.getMonth()] || "আগস্ট";
  const day = toBengaliNumber(d.getDate());
  return `${day} ${month}`;
}

/**
 * Parse YYYY-MM-DD into Bengali localized date
 * e.g. 2026-08-26 -> বুধবার, ২৬ আগস্ট
 */
export function formatBengaliDate(dateStr: string, includeYear: boolean = false): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-").map((p) => parseInt(p, 10));
  if (parts.length < 3) return dateStr;

  const year = parts[0];
  const month = parts[1] - 1;
  const day = parts[2];

  const dateObj = new Date(year, month, day);
  const dayName = BENGALI_DAYS[dateObj.getDay()];
  const monthName = BENGALI_MONTHS[month];
  const bengaliDay = toBengaliNumber(day);
  const bengaliYear = toBengaliNumber(year);

  if (includeYear) {
    return `${dayName}, ${bengaliDay} ${monthName} ${bengaliYear}`;
  }
  return `${dayName}, ${bengaliDay} ${monthName}`;
}

/**
 * Get Bengali day name for a YYYY-MM-DD string
 */
export function getBengaliDayName(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-").map((p) => parseInt(p, 10));
  if (parts.length < 3) return "";
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  return BENGALI_DAYS[dateObj.getDay()];
}
