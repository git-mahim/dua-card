import { describe, it, expect } from "vitest";
import { validateBackupJson } from "../src/lib/backup";

describe("Backup & Restore JSON Validation", () => {
  it("should validate a proper Dua Card backup JSON file", () => {
    const validJson = JSON.stringify({
      metadata: {
        appName: "Dua Card",
        version: "1.0.0",
        schemaVersion: 1,
        exportedAt: "2026-08-26T12:00:00.000Z",
        totalRecords: 1,
      },
      duas: [
        {
          id: "dua_12345",
          richTextContent: { type: "doc", content: [] },
          plainTextPreview: "রাব্বানা আতিনা ফিদ্দুনিয়া হাসানাহ",
          title: "রাব্বানা আতিনা",
          createdAt: 1700000000000,
          updatedAt: 1700000000000,
          sortOrder: 0,
          schemaVersion: 1,
        },
      ],
    });

    const result = validateBackupJson(validJson);
    expect(result.success).toBe(true);
    expect(result.data?.duas.length).toBe(1);
    expect(result.data?.duas[0].id).toBe("dua_12345");
  });

  it("should support a loose array of Dua records directly", () => {
    const arrayJson = JSON.stringify([
      {
        id: "dua_999",
        richTextContent: { type: "doc" },
        plainTextPreview: "টেক্সট",
        title: "শিরোনাম",
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        sortOrder: 0,
        schemaVersion: 1,
      },
    ]);

    const result = validateBackupJson(arrayJson);
    expect(result.success).toBe(true);
    expect(result.data?.duas.length).toBe(1);
  });

  it("should reject non-JSON string", () => {
    const result = validateBackupJson("Not a valid json string at all");
    expect(result.success).toBe(false);
    expect(result.error).toContain("valid JSON");
  });

  it("should reject JSON missing required fields like id or createdAt", () => {
    const malformedJson = JSON.stringify({
      metadata: {
        appName: "Dua Card",
        version: "1.0.0",
        schemaVersion: 1,
        exportedAt: "2026-08-26T12:00:00.000Z",
        totalRecords: 1,
      },
      duas: [
        {
          // missing id and createdAt
          plainTextPreview: "অসম্পূর্ণ ডেটা",
        },
      ],
    });

    const result = validateBackupJson(malformedJson);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid backup structure");
  });
});
