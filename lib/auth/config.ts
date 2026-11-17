import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { nfcPlugin } from "./nfc-plugin";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",

  logger: {
    level: (process.env.LOG_LEVEL as "debug" | "info" | "warn" | "error" | undefined) ?? "info",
    log(level, message, ...args) {
      console.log(`[better-auth:${level}]`, message, ...args);
    },
  },

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),

  emailAndPassword: {
    enabled: true,
    disableSignUp: true, // Public sign-up disabled; admins create users via /api/admin/users
    requireEmailVerification: false, // Set true in production with Resend
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "operator",
        input: false, // Users cannot set their own role
      },
    },
  },

  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ],

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  rateLimit: {
    customRules: {
      // proxy.ts calls /get-session over the loopback on every protected request,
      // so when self-hosted all of them share the client IP 127.0.0.1 and one
      // 100-per-10s bucket. Hitting it returned 429, which the proxy turned into
      // redirects to /login (spurious logouts, HTML where fetch expected JSON).
      // It's a read-only session lookup, so limiting it protects nothing.
      // Sign-in, NFC login etc. stay limited per real client IP (nginx forwards it).
      "/get-session": false,
    },
  },

  plugins: [nfcPlugin()],
});

export type Session = typeof auth.$Infer.Session;
export type AuthUser = typeof auth.$Infer.Session.user;
