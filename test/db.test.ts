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
  toggleTodayCompleted,
  addDuaCount,
  setDuaCount,
  getDuaAggregatedStats,
  getAllTodayLogs,
} from "../src/lib/db";
import { DuaRecord } from "../src/lib/types";

describe("IndexedDB Dua Card Database Operations", () => {
  beforeEach(async () => {
    await clearDatabase();
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

  it("should toggle today completed status (Instagram-style double tap)", async () => {
    const d = await createDua({ richTextContent: {}, plainTextPreview: "টেস্ট", title: "টেস্ট" });

    // 1st double tap -> completed = true
    const log1 = await toggleTodayCompleted(d.id);
    expect(log1.completed).toBe(true);

    const todayMap1 = await getAllTodayLogs();
    expect(todayMap1[d.id]?.completed).toBe(true);

    // 2nd double tap -> completed = false (uncheck)
    const log2 = await toggleTodayCompleted(d.id);
    expect(log2.completed).toBe(false);

    const todayMap2 = await getAllTodayLogs();
    expect(todayMap2[d.id]?.completed).toBe(false);
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
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);
    await setDuaCount(d.id, 1000, yesterdayStr);

    // Add log for day before yesterday: 500
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = getLocalDateString(twoDaysAgo);
    await setDuaCount(d.id, 500, twoDaysAgoStr);

    const stats = await getDuaAggregatedStats(d.id);
    expect(stats.totalCount).toBe(2100); // 600 + 1000 + 500
    expect(stats.streakDays).toBe(3); // 3 consecutive days
    expect(stats.logs.length).toBe(3);
  });
});
