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
 * Convert any integer to plain Bengali digits WITHOUT commas
 * Essential for Years (e.g. 2026 -> ২০২৬), dates, IDs
 */
export function toBengaliDigits(value: number | string): string {
  if (value === undefined || value === null) return "০";
  return value.toString().replace(/[0-9]/g, (digit) => BENGALI_DIGITS[digit] || digit);
}

/**
 * Convert any integer or formatted number to Bengali digits with commas for counts
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
  return toBengaliDigits(parts[2]);
}

/**
 * Format timestamp into short Bengali date e.g. "২৬ আগস্ট"
 */
export function formatBengaliDateShort(timestamp: number): string {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  const month = BENGALI_MONTHS[d.getMonth()] || "আগস্ট";
  const day = toBengaliDigits(d.getDate());
  return `${day} ${month}`;
}

/**
 * Parse YYYY-MM-DD into Bengali localized date
 * e.g. 2026-08-26 -> বুধবার, ২৬ আগস্ট ২০২৬
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
  const bengaliDay = toBengaliDigits(day);
  const bengaliYear = toBengaliDigits(year);

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

const BENGALI_SUFFIXES: Record<number, string> = {
  1: "লা",
  2: "রা",
  3: "রা",
  4: "ঠা",
  5: "ই",
  6: "ই",
  7: "ই",
  8: "ই",
  9: "ই",
  10: "ই",
  11: "ই",
  12: "ই",
  13: "ই",
  14: "ই",
  15: "ই",
  16: "ই",
  17: "ই",
  18: "ই",
  19: "শে",
  20: "শে",
  21: "শে",
  22: "শে",
  23: "শে",
  24: "শে",
  25: "শে",
  26: "শে",
  27: "শে",
  28: "শে",
  29: "শে",
  30: "শে",
  31: "শে",
};

/**
 * Format today's date in traditional Bengali format without number commas in year
 * e.g. "২৬শে আগস্ট, ২০২৬" or "৫ই আগস্ট, ২০২৬"
 */
export function getBengaliTodayFormatted(withSuffix: boolean = true): string {
  const d = new Date();
  const dayNum = d.getDate();
  const dayStr = toBengaliDigits(dayNum);
  const suffix = withSuffix ? (BENGALI_SUFFIXES[dayNum] || "") : "";
  const month = BENGALI_MONTHS[d.getMonth()] || "আগস্ট";
  const year = toBengaliDigits(d.getFullYear());
  return `${dayStr}${suffix} ${month}, ${year}`;
}

/**
 * Format a 24-hour time string (HH:MM) into a Bengali localized label
 * e.g. "06:00" -> "সকাল ৬:০০ টা", "09:30" -> "সকাল ৯:৩০ টা", "14:00" -> "দুপুর ২:০০ টা", "20:00" -> "রাত ৮:০০ টা", "00:00" -> "রাত ১২:০০ টা"
 */
export function formatResetTimeToBengali(timeStr: string): string {
  if (!timeStr || !timeStr.includes(":")) return "সকাল ৬:০০ টা";
  const [hStr, mStr] = timeStr.split(":");
  let hour = parseInt(hStr, 10);
  const min = parseInt(mStr, 10) || 0;
  if (isNaN(hour)) hour = 6;

  let period = "সকাল";
  let displayHour = hour;

  if (hour >= 4 && hour < 12) {
    period = "সকাল";
    displayHour = hour;
  } else if (hour >= 12 && hour < 16) {
    period = "দুপুর";
    displayHour = hour === 12 ? 12 : hour - 12;
  } else if (hour >= 16 && hour < 19) {
    period = "বিকাল";
    displayHour = hour - 12;
  } else {
    period = "রাত";
    displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
  }

  const bh = toBengaliDigits(displayHour);
  const bm = min === 0 ? "০০" : (min < 10 ? `০${toBengaliDigits(min)}` : toBengaliDigits(min));
  return `${period} ${bh}:${bm} টা`;
}

/**
 * Format timestamp into human-readable Bengali relative / exact date-time string
 * e.g. "এইমাত্র (আপ-টু-ডেট)", "আজকে, ভোর ০৩:৪৫ মিনিট", "গতকাল, রাত ১১:২০ মিনিট", "২৮ আগস্ট • রাত ১০:১৫ মিনিট"
 */
export function formatBengaliSyncTime(timestamp: number | null | undefined): string {
  if (!timestamp) return "এখনো সিঙ্ক হয়নি";
  const now = Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);

  if (diffSec < 45) {
    return "এইমাত্র (আপ-টু-ডেট)";
  }

  const d = new Date(timestamp);
  const today = new Date();

  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  const hour = d.getHours();
  const min = d.getMinutes();

  let period = "রাত";
  let displayHour = hour;

  if (hour >= 4 && hour < 6) {
    period = "ভোর";
    displayHour = hour;
  } else if (hour >= 6 && hour < 12) {
    period = "সকাল";
    displayHour = hour;
  } else if (hour >= 12 && hour < 16) {
    period = "দুপুর";
    displayHour = hour === 12 ? 12 : hour - 12;
  } else if (hour >= 16 && hour < 19) {
    period = "বিকাল";
    displayHour = hour - 12;
  } else if (hour >= 19 && hour < 23) {
    period = "সন্ধ্যা/রাত";
    displayHour = hour - 12;
  } else {
    period = "রাত";
    displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
  }

  const bh = toBengaliDigits(displayHour);
  const bm = min < 10 ? `০${toBengaliDigits(min)}` : toBengaliDigits(min);
  const timeStr = `${period} ${bh}:${bm} মিনিট`;

  if (isToday) {
    return `আজকে, ${timeStr}`;
  }
  if (isYesterday) {
    return `গতকাল, ${timeStr}`;
  }

  const month = BENGALI_MONTHS[d.getMonth()] || "";
  const day = toBengaliDigits(d.getDate());
  return `${day} ${month}, ${timeStr}`;
}
