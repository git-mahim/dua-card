import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/serverAuth";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "সফলভাবে লগআউট হয়েছে",
  });

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });

  return response;
}
