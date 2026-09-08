import { NextRequest, NextResponse } from "next/server";
import { getUnifiedUser } from "@/lib/serverAuth";
import { saveUserCloudData, getUserCloudData } from "@/lib/serverCloudStore";
import { BackupSchema } from "@/lib/backup";
import { BackupPayload, DuaRecord } from "@/lib/types";

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
      totalRecords: cloudData.payload?.duas?.length || 0,
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

    // Save current local snapshot directly to cloud store (no merge to avoid restoring deleted duas)
    const result = await saveUserCloudData(user.email, validPayload as BackupPayload);

    const now = Date.now();
    return NextResponse.json({
      success: true,
      backupAt: now,
      syncedAt: now,
      provider: result.provider,
      totalRecords: (validPayload as BackupPayload).duas.length,
      message: "ক্লাউডে সফলভাবে ব্যাকআপ সংরক্ষিত হয়েছে",
    });
  } catch (error) {
    console.error("Sync POST error:", error);
    return NextResponse.json(
      { success: false, error: "ক্লাউডে ডেটা সেভ করতে ব্যর্থ হয়েছে" },
      { status: 500 }
    );
  }
}
