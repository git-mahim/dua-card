import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { clientId, clientSecret } = await req.json();

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, error: "Google Client ID এবং Client Secret উভয়ই আবশ্যক" },
        { status: 400 }
      );
    }

    const envPath = path.join(process.cwd(), ".env.local");
    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf-8");
    }

    // Replace or Append AUTH_GOOGLE_ID
    if (envContent.includes("AUTH_GOOGLE_ID=")) {
      envContent = envContent.replace(
        /AUTH_GOOGLE_ID=.*/g,
        `AUTH_GOOGLE_ID=${clientId.trim()}`
      );
    } else {
      envContent += `\nAUTH_GOOGLE_ID=${clientId.trim()}`;
    }

    // Replace or Append AUTH_GOOGLE_SECRET
    if (envContent.includes("AUTH_GOOGLE_SECRET=")) {
      envContent = envContent.replace(
        /AUTH_GOOGLE_SECRET=.*/g,
        `AUTH_GOOGLE_SECRET=${clientSecret.trim()}`
      );
    } else {
      envContent += `\nAUTH_GOOGLE_SECRET=${clientSecret.trim()}`;
    }

    // Ensure AUTH_SECRET
    if (!envContent.includes("AUTH_SECRET=")) {
      envContent += `\nAUTH_SECRET=dua_card_super_secret_jwt_encryption_key_2026_vercel`;
    }

    fs.writeFileSync(envPath, envContent.trim() + "\n", "utf-8");

    // Also update runtime process.env
    process.env.AUTH_GOOGLE_ID = clientId.trim();
    process.env.AUTH_GOOGLE_SECRET = clientSecret.trim();
    process.env.GOOGLE_CLIENT_ID = clientId.trim();
    process.env.GOOGLE_CLIENT_SECRET = clientSecret.trim();

    return NextResponse.json({
      success: true,
      message: "গুগল অথেনটিকেশন ক্রেডেনশিয়াল সফলভাবে সংরক্ষিত হয়েছে!",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "ক্রেডেনশিয়াল সংরক্ষণ করতে সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}
