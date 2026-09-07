import { NextRequest, NextResponse } from "next/server";
import { getUnifiedUser } from "@/lib/serverAuth";
import { saveUserCloudData, getUserCloudData } from "@/lib/serverCloudStore";
import { BackupSchema } from "@/lib/backup";
import { BackupPayload, DuaRecord } from "@/lib/types";

function mergePayloads(
  cloudPayload: BackupPayload | null,
  localPayload: BackupPayload
): BackupPayload {
  if (!cloudPayload || !Array.isArray(cloudPayload.duas)) {
    return localPayload;
  }

  const duaMap = new Map<string, DuaRecord>();

  // 1. Add all existing cloud duas
  for (const d of cloudPayload.duas) {
    if (d && d.id) {
      duaMap.set(d.id, d);
    }
  }

  // 2. Merge local duas (keep whichever has newer updatedAt)
  for (const d of localPayload.duas) {
    if (d && d.id) {
      const existing = duaMap.get(d.id);
      if (!existing) {
        duaMap.set(d.id, d);
      } else {
        const cloudTime = existing.updatedAt || 0;
        const localTime = d.updatedAt || 0;
        if (localTime >= cloudTime) {
          duaMap.set(d.id, d);
        }
      }
    }
  }

  const mergedDuas = Array.from(duaMap.values());

  // 3. Merge logs
  const logMap = new Map<string, any>();
  if (Array.isArray(cloudPayload.logs)) {
    for (const l of cloudPayload.logs) {
      if (l && (l.id || l.duaId)) {
        const key = l.id || `${l.duaId}_${l.date}`;
        logMap.set(key, l);
      }
    }
  }
  if (Array.isArray(localPayload.logs)) {
    for (const l of localPayload.logs) {
      if (l && (l.id || l.duaId)) {
        const key = l.id || `${l.duaId}_${l.date}`;
        logMap.set(key, l);
      }
    }
  }

  return {
    metadata: {
      appName: "Dua Card",
      version: "1.0.0",
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      totalRecords: mergedDuas.length,
    },
    duas: mergedDuas,
    logs: Array.from(logMap.values()),
  };
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUnifiedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "অননুমোদিত এক্সেস। অনুগ্রহ করে লগইন করুন।" },
        { status: 401 }
      );
    }

    const cloudData = await getUserCloudData(user.email);
    return NextResponse.json({
      success: true,
      data: cloudData.payload,
      updatedAt: cloudData.updatedAt,
      provider: cloudData.provider,
    });
  } catch (error) {
    console.error("Sync GET error:", error);
    return NextResponse.json(
      { success: false, error: "ক্লাউড ডেটা লোড করতে ব্যর্থ হয়েছে" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUnifiedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "অননুমোদিত এক্সেস। অনুগ্রহ করে লগইন করুন।" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { payload } = body;

    if (!payload || !Array.isArray(payload.duas)) {
      return NextResponse.json(
        { success: false, error: "অবৈধ ব্যাকআপ ডেটা ফরম্যাট" },
        { status: 400 }
      );
    }

    // Parse and validate incoming payload
    const parsed = BackupSchema.safeParse(payload);
    const validPayload = parsed.success ? parsed.data : payload;

    // Fetch existing user backup from cloud store
    const existingCloud = await getUserCloudData(user.email);

    // Merge cloud and local payload smartly
    const mergedPayload = mergePayloads(existingCloud.payload, validPayload as BackupPayload);

    // Save merged payload to cloud store
    const result = await saveUserCloudData(user.email, mergedPayload);

    return NextResponse.json({
      success: true,
      syncedAt: Date.now(),
      provider: result.provider,
      mergedPayload,
      message: "ক্লাউডে সফলভাবে সিঙ্ক ও ব্যাকআপ রিস্টোর হয়েছে",
    });
  } catch (error) {
    console.error("Sync POST error:", error);
    return NextResponse.json(
      { success: false, error: "ক্লাউডে ডেটা সিঙ্ক করতে ব্যর্থ হয়েছে" },
      { status: 500 }
    );
  }
}
