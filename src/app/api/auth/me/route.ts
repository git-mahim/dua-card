import { NextRequest, NextResponse } from "next/server";
import { getUnifiedUser } from "@/lib/serverAuth";

export async function GET(req: NextRequest) {
  const googleClientId =
    process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || "";
  const googleClientSecret =
    process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || "";
  const isGoogleConfigured = Boolean(
    googleClientId &&
    googleClientSecret &&
    !googleClientId.includes("your_google") &&
    !googleClientId.includes("placeholder")
  );

  try {
    const user = await getUnifiedUser(req);
    if (!user) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        isGoogleConfigured,
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        provider: user.provider,
      },
      isGoogleConfigured,
    });
  } catch (error) {
    return NextResponse.json({
      authenticated: false,
      user: null,
      isGoogleConfigured,
    });
  }
}
