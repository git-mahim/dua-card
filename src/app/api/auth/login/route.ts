import { NextRequest, NextResponse } from "next/server";
import {
  validateCredentials,
  createSessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/serverAuth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const result = validateCredentials(email || "", password || "");
    if (!result.success || !result.user) {
      return NextResponse.json(
        { success: false, error: result.error || "ভুল ইমেইল বা পাসওয়ার্ড" },
        { status: 401 }
      );
    }

    const token = createSessionToken(result.user);
    const response = NextResponse.json({
      success: true,
      user: {
        email: result.user.email,
        role: result.user.role,
      },
      message: "সফলভাবে লগইন হয়েছে",
    });

    // Set HTTP-Only Cookie valid for 365 days
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { success: false, error: "সার্ভারে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।" },
      { status: 500 }
    );
  }
}
