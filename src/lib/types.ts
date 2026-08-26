import { JSONContent } from "@tiptap/react";

export type SemanticStyleType =
  | "dua-title"
  | "dua-pronunciation"
  | "dua-meaning"
  | "dua-virtue"
  | "dua-paragraph";

export interface DuaRecord {
  id: string;
  richTextContent: JSONContent;
  plainTextPreview: string;
  title?: string;
  createdAt: number;
  updatedAt: number;
  sortOrder: number;
  schemaVersion: number;
}

export interface DuaDailyLog {
  id: string; // Format: `${duaId}_${YYYY-MM-DD}`
  duaId: string;
  date: string; // YYYY-MM-DD
  count: number;
  completed: boolean;
  updatedAt: number;
}

export interface BackupMetadata {
  appName: string;
  version: string;
  schemaVersion: number;
  exportedAt: string;
  totalRecords: number;
}

export interface BackupPayload {
  metadata: BackupMetadata;
  duas: DuaRecord[];
  logs?: DuaDailyLog[];
}

export type ThemeMode = "light" | "dark";

export interface SearchFilterState {
  query: string;
}

export interface DuaAggregatedStats {
  totalCount: number;
  thisWeekCount: number;
  thisMonthCount: number;
  streakDays: number;
  logs: DuaDailyLog[];
}
