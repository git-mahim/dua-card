import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Deprecated. Use NextAuth Google OAuth." }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ error: "Deprecated. Use NextAuth Google OAuth." }, { status: 410 });
}
