import { describe, it, expect, beforeEach } from "vitest";
import {
  validateCredentials,
  createSessionToken,
  verifySessionToken,
} from "../src/lib/serverAuth";
import {
  saveUserCloudData,
  getUserCloudData,
} from "../src/lib/serverCloudStore";
import { BackupPayload } from "../src/lib/types";

describe("Email & Password Auth & Session Verification", () => {
  beforeEach(() => {
    process.env.ADMIN_EMAIL = "admin@duacard.app";
    process.env.ADMIN_PASSWORD = "admin";
  });

  it("should validate correct user email and passcode", () => {
    const res = validateCredentials("user@example.com", "pass123");
    expect(res.success).toBe(true);
    expect(res.user?.email).toBe("user@example.com");
  });

  it("should reject invalid email or short passcode", () => {
    const res1 = validateCredentials("invalid-email", "pass123");
    expect(res1.success).toBe(false);

    const res2 = validateCredentials("user@example.com", "12");
    expect(res2.success).toBe(false);

    const res3 = validateCredentials("", "");
    expect(res3.success).toBe(false);
  });

  it("should create valid signed session token and verify successfully", () => {
    const user = {
      email: "admin@duacard.app",
      role: "admin",
      loginTime: Date.now(),
    };

    const token = createSessionToken(user);
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);

    const decoded = verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.email).toBe("admin@duacard.app");
  });

  it("should reject tampered session tokens", () => {
    const user = {
      email: "admin@duacard.app",
      role: "admin",
      loginTime: Date.now(),
    };

    const token = createSessionToken(user);
    const tampered = token.slice(0, -5) + "abcde";

    const decoded = verifySessionToken(tampered);
    expect(decoded).toBeNull();
  });
});

describe("Cloud Store Two-Way Sync Adapter", () => {
  const testEmail = "testuser@duacard.app";
  const dummyPayload: BackupPayload = {
    metadata: {
      appName: "Dua Card",
      version: "1.0.0",
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      totalRecords: 1,
    },
    duas: [
      {
        id: "dua_test_1",
        title: "টেস্ট দোয়া",
        plainTextPreview: "টেস্ট প্রিভিউ",
        richTextContent: { type: "doc" },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        sortOrder: 0,
        schemaVersion: 1,
      },
    ],
    logs: [],
  };

  it("should save and retrieve user backup data cleanly", async () => {
    const saveRes = await saveUserCloudData(testEmail, dummyPayload);
    expect(saveRes.success).toBe(true);

    const getRes = await getUserCloudData(testEmail);
    expect(getRes.payload).not.toBeNull();
    expect(getRes.payload?.duas.length).toBe(1);
    expect(getRes.payload?.duas[0].title).toBe("টেস্ট দোয়া");
  });
});
