import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import {
  db,
  getAllDuas,
  createDua,
  updateDua,
  deleteDua,
  reorderDuas,
  moveDuaUp,
  moveDuaDown,
  replaceAllDuas,
  mergeImportedDuas,
  clearDatabase,
  getLocalDateString,
  getSpiritualDate,
  toggleTodayCompleted,
  addDuaCount,
  setDuaCount,
  getDuaAggregatedStats,
  getAllTodayLogs,
} from "../src/lib/db";
import { DuaRecord } from "../src/lib/types";

describe("IndexedDB Dua Card Database Operations", () => {
  beforeEach(async () => {
    await db.duas.clear();
    await db.logs.clear();
  });

  it("should create a new dua and assign sortOrder to top", async () => {
    const dua1 = await createDua({
      richTextContent: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            attrs: { semanticStyle: "dua-title" },
            content: [{ type: "text", text: "রাব্বানা আতিনা" }],
          },
        ],
      },
      plainTextPreview: "রাব্বানা আতিনা ফিদ্দুনিয়া হাসানাহ",
      title: "রাব্বানা আতিনা",
    });

    expect(dua1.id).toBeDefined();
    expect(dua1.title).toBe("রাব্বানা আতিনা");

    const dua2 = await createDua({
      richTextContent: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            attrs: { semanticStyle: "dua-title" },
            content: [{ type: "text", text: "সাইয়্যিদুল ইস্তিগফার" }],
          },
        ],
      },
      plainTextPreview: "আল্লাহুম্মা আনতা রাব্বি লা ইলাহা ইল্লা আনতা",
      title: "সাইয়্যিদুল ইস্তিগফার",
    });

    expect(dua2.sortOrder).toBeLessThan(dua1.sortOrder);

    const all = await getAllDuas();
    expect(all.length).toBe(2);
    expect(all[0].id).toBe(dua2.id);
    expect(all[1].id).toBe(dua1.id);
  });

  it("should update a dua record", async () => {
    const created = await createDua({
      richTextContent: { type: "doc", content: [] },
      plainTextPreview: "আগের টেক্সট",
      title: "আগের শিরোনাম",
    });

    await updateDua(created.id, {
      title: "নতুন শিরোনাম",
      plainTextPreview: "নতুন সংশোধিত টেক্সট",
    });

    const list = await getAllDuas();
    expect(list[0].title).toBe("নতুন শিরোনাম");
    expect(list[0].plainTextPreview).toBe("নতুন সংশোধিত টেক্সট");
  });

  it("should delete a dua record and cascade delete logs", async () => {
    const created = await createDua({
      richTextContent: { type: "doc", content: [] },
      plainTextPreview: "মুছে ফেলার জন্য তৈরি",
      title: "মুছুন",
    });

    await addDuaCount(created.id, 100);
    let allLogs = await db.logs.where("duaId").equals(created.id).toArray();
    expect(allLogs.length).toBe(1);

    await deleteDua(created.id);

    const list = await getAllDuas();
    expect(list.length).toBe(0);

    allLogs = await db.logs.where("duaId").equals(created.id).toArray();
    expect(allLogs.length).toBe(0);
  });

  it("should reorder duas correctly", async () => {
    const d1 = await createDua({ richTextContent: { type: "doc" }, plainTextPreview: "১", title: "১" });
    const d2 = await createDua({ richTextContent: { type: "doc" }, plainTextPreview: "২", title: "২" });
    const d3 = await createDua({ richTextContent: { type: "doc" }, plainTextPreview: "৩", title: "৩" });

    let list = await getAllDuas();
    expect(list.map((d) => d.id)).toEqual([d3.id, d2.id, d1.id]);

    await reorderDuas([d1.id, d2.id, d3.id]);

    list = await getAllDuas();
    expect(list.map((d) => d.id)).toEqual([d1.id, d2.id, d3.id]);
  });

  it("should support accessible moveUp and moveDown", async () => {
    const d1 = await createDua({ richTextContent: {}, plainTextPreview: "1", title: "1" });
    const d2 = await createDua({ richTextContent: {}, plainTextPreview: "2", title: "2" });

    await moveDuaDown(d2.id);
    let list = await getAllDuas();
    expect(list[0].id).toBe(d1.id);
    expect(list[1].id).toBe(d2.id);

    await moveDuaUp(d2.id);
    list = await getAllDuas();
    expect(list[0].id).toBe(d2.id);
    expect(list[1].id).toBe(d1.id);
  });

  it("should toggle today completed status and reset count to 0 when unchecked", async () => {
    const d = await createDua({ richTextContent: {}, plainTextPreview: "টেস্ট", title: "টেস্ট" });

    // 1st toggle -> completed = true, count = 1
    const log1 = await toggleTodayCompleted(d.id);
    expect(log1.completed).toBe(true);
    expect(log1.count).toBe(1);

    // Add count: +50
    await addDuaCount(d.id, 50);
    const logWithCount = await db.logs.get(`${d.id}_${getLocalDateString()}`);
    expect(logWithCount?.count).toBe(51);
    expect(logWithCount?.completed).toBe(true);

    // 2nd toggle (Uncheck) -> completed = false AND count reset to 0
    const log2 = await toggleTodayCompleted(d.id);
    expect(log2.completed).toBe(false);
    expect(log2.count).toBe(0);

    const todayMap2 = await getAllTodayLogs();
    expect(todayMap2[d.id]?.completed).toBe(false);
    expect(todayMap2[d.id]?.count).toBe(0);

    // 3rd toggle (Check again) -> completed = true, count = 1
    const log3 = await toggleTodayCompleted(d.id);
    expect(log3.completed).toBe(true);
    expect(log3.count).toBe(1);
  });

  it("should track counts and calculate aggregated statistics & streak correctly", async () => {
    const d = await createDua({ richTextContent: {}, plainTextPreview: "জিকির", title: "ইস্তিগফার" });

    // Add count for today: +100
    await addDuaCount(d.id, 100);
    // Add count for today: +500
    await addDuaCount(d.id, 500);

    const todayStr = getLocalDateString();
    const todayLog = await db.logs.get(`${d.id}_${todayStr}`);
    expect(todayLog?.count).toBe(600);
    expect(todayLog?.completed).toBe(true);

    // Add log for yesterday: 1000
    const baseDate = getSpiritualDate();
    const yesterday = new Date(baseDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);
    await setDuaCount(d.id, 1000, yesterdayStr);

    // Add log for day before yesterday: 500
    const twoDaysAgo = new Date(baseDate);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = getLocalDateString(twoDaysAgo);
    await setDuaCount(d.id, 500, twoDaysAgoStr);

    const stats = await getDuaAggregatedStats(d.id);
    expect(stats.totalCount).toBe(2100); // 600 + 1000 + 500
    expect(stats.streakDays).toBe(3); // 3 consecutive days
    expect(stats.logs.length).toBe(3);
  });

  it("should reset/uncheck all completed duas for today cleanly", async () => {
    const d1 = await createDua({ richTextContent: {}, plainTextPreview: "দোয়া ১", title: "দোয়া ১" });
    const d2 = await createDua({ richTextContent: {}, plainTextPreview: "দোয়া ২", title: "দোয়া ২" });

    // Mark d1 as completed and d2 with count 50
    await toggleTodayCompleted(d1.id);
    await addDuaCount(d2.id, 50);

    let todayMap = await getAllTodayLogs();
    expect(todayMap[d1.id]?.completed).toBe(true);
    expect(todayMap[d2.id]?.count).toBe(50);

    // Call resetAllTodayLogs
    const { resetAllTodayLogs } = await import("../src/lib/db");
    await resetAllTodayLogs();

    todayMap = await getAllTodayLogs();
    expect(todayMap[d1.id]).toBeUndefined();
    expect(todayMap[d2.id]).toBeUndefined();
  });

  it("should prevent deleting protected core duas", async () => {
    const { ensureCoreDuas } = await import("../src/lib/db");
    const coreDuas = await ensureCoreDuas();
    expect(coreDuas.length).toBe(25);

    const firstProtected = coreDuas[0];
    expect(firstProtected.isProtected).toBe(true);

    const deleted = await deleteDua(firstProtected.id);
    expect(deleted).toBe(false);

    const listAfter = await getAllDuas();
    expect(listAfter.length).toBe(25);
    expect(listAfter.find((d) => d.id === firstProtected.id)).toBeDefined();
  });

  it("should preserve the 25 core authentic duas when clearDatabase is called", async () => {
    // Add custom dua
    await createDua({
      richTextContent: {},
      plainTextPreview: "কাস্টম দোয়া",
      title: "কাস্টম দোয়া",
    });

    await clearDatabase();

    const list = await getAllDuas();
    expect(list.length).toBe(25);
    expect(list.every((d) => d.isProtected)).toBe(true);
  });
});
