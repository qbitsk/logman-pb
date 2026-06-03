import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({ key: z.string().min(4).max(256) });

async function signCookieValue(value: string, secret: string): Promise<string> {
  const algorithm = { name: "HMAC", hash: "SHA-256" };
  const keyBuf = new TextEncoder().encode(secret);
  const cryptoKey = await crypto.subtle.importKey("raw", keyBuf, algorithm, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(value));
  const base64Sig = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return encodeURIComponent(`${value}.${base64Sig}`);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const { key } = result.data;

  // Find a user role="user" with the matching NFC key
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.nfcKey, key), eq(users.role, "user")))
    .limit(1);

  // Generic error to avoid key enumeration
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret =
    process.env.BETTER_AUTH_SECRET ??
    process.env.AUTH_SECRET ??
    "";

  // Generate session token and store session
  const token =
    crypto.randomUUID().replace(/-/g, "") +
    crypto.randomUUID().replace(/-/g, "");

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(sessions).values({
    id: crypto.randomUUID(),
    token,
    userId: user.id,
    expiresAt,
    createdAt: now,
    updatedAt: now,
    ipAddress:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  // Sign cookie value the same way Better Auth does
  const signedValue = await signCookieValue(token, secret);
  const isSecure = process.env.NODE_ENV === "production";
  const cookieStr = [
    `better-auth.session_token=${signedValue}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${7 * 24 * 60 * 60}`,
    ...(isSecure ? ["Secure"] : []),
  ].join("; ");

  const response = NextResponse.json({ ok: true });
  response.headers.set("Set-Cookie", cookieStr);
  return response;
}
