import { NextRequest } from "next/server";
import crypto from "crypto";

const SESSION_COOKIE_NAME = "dua_auth_session";
const DEFAULT_SECRET = "dua_card_super_secret_jwt_encryption_key_2026_vercel";

export interface AuthUser {
  email: string;
  name?: string;
  image?: string;
  role?: string;
  provider?: "google" | "credentials";
  loginTime: number;
}

function getSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.AUTH_SECRET ||
    DEFAULT_SECRET
  );
}

/**
 * Sign a payload with HMAC-SHA256
 */
export function createSessionToken(user: AuthUser): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify(user)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${signature}`;
}

/**
 * Verify and parse session token
 */
export function verifySessionToken(token: string): AuthUser | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", getSecret())
      .update(`${header}.${payload}`)
      .digest("base64url");

    if (signature !== expectedSignature) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    return decoded as AuthUser;
  } catch (error) {
    return null;
  }
}

/**
 * Validate submitted credentials
 */
export function validateCredentials(email: string, password: string): { success: boolean; user?: AuthUser; error?: string } {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@duacard.app").trim().toLowerCase();
  const adminPassword = (process.env.ADMIN_PASSWORD || "admin").trim();

  // Clean inputs
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  if (!cleanEmail || !cleanPassword) {
    return { success: false, error: "ইমেইল এবং পাসওয়ার্ড উভয়ই আবশ্যক" };
  }

  // Check matching
  if (cleanEmail === adminEmail && cleanPassword === adminPassword) {
    return {
      success: true,
      user: {
        email: cleanEmail,
        role: "admin",
        provider: "credentials",
        loginTime: Date.now(),
      },
    };
  }

  // Also allow configured ALLOWED_GOOGLE_EMAIL if user uses that as admin email
  const altEmail = (process.env.ALLOWED_GOOGLE_EMAIL || "").trim().toLowerCase();
  if (altEmail && cleanEmail === altEmail && cleanPassword === adminPassword) {
    return {
      success: true,
      user: {
        email: cleanEmail,
        role: "admin",
        provider: "credentials",
        loginTime: Date.now(),
      },
    };
  }

  return { success: false, error: "ভুল ইমেইল বা পাসওয়ার্ড প্রদান করা হয়েছে" };
}

/**
 * Get current session from NextRequest cookies or Authorization header
 */
export function getSessionFromRequest(req: NextRequest): AuthUser | null {
  // 1. Check Cookie
  const cookie = req.cookies.get(SESSION_COOKIE_NAME);
  if (cookie?.value) {
    const user = verifySessionToken(cookie.value);
    if (user) return user;
  }

  // 2. Check Authorization Header (Bearer token)
  const authHeader = req.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    const user = verifySessionToken(token);
    if (user) return user;
  }

  return null;
}

/**
 * Unified auth helper: checks both NextAuth (Google) and custom credentials
 */
export async function getUnifiedUser(req: NextRequest): Promise<AuthUser | null> {
  // 1. Check custom cookie/bearer
  const customUser = getSessionFromRequest(req);
  if (customUser) return customUser;

  // 2. Check NextAuth session cookies (Google OAuth)
  const nextAuthCookie =
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value ||
    req.cookies.get("next-auth.session-token")?.value;

  if (nextAuthCookie) {
    try {
      const { decode } = await import("next-auth/jwt");
      const decoded = await decode({
        token: nextAuthCookie,
        secret: getSecret(),
        salt: req.cookies.get("__Secure-authjs.session-token") || req.cookies.get("__Secure-next-auth.session-token")
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      });

      if (decoded?.email) {
        return {
          email: decoded.email as string,
          name: (decoded.name as string) || undefined,
          image: (decoded.picture as string) || undefined,
          role: "user",
          provider: "google",
          loginTime: Date.now(),
        };
      }
    } catch (err) {
      // Decode fallback
    }
  }

  return null;
}

export { SESSION_COOKIE_NAME };
