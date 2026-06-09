import { createAuthEndpoint, APIError } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import type { BetterAuthPlugin } from "better-auth";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

/**
 * Custom NFC-card login mounted at `/api/auth/nfc/login`.
 *
 * Workers tap a card whose key maps to a `role: "user"` account; we look it up
 * and create a session for them. Unlike the previous hand-rolled route, this is
 * a real Better Auth plugin, so session creation and cookie signing — including
 * the cookie cache — are delegated to Better Auth and stay in sync with the rest
 * of auth automatically. The matching client plugin in `lib/auth/client.ts`
 * refreshes `useSession` on success, so no page reload is needed.
 *
 * Errors are intentionally generic to avoid NFC key enumeration.
 */
export const nfcPlugin = () =>
  ({
    id: "nfc",
    endpoints: {
      nfcLogin: createAuthEndpoint(
        "/nfc/login",
        {
          method: "POST",
          body: z.object({ key: z.string().min(4).max(256) }),
        },
        async (ctx) => {
          const { key } = ctx.body;

          // Look up the card → user mapping. Only the id is needed here; the
          // canonical user shape (without the secret nfcKey column) is fetched
          // below via Better Auth's adapter.
          const [match] = await db
            .select({ id: users.id })
            .from(users)
            .where(and(eq(users.nfcKey, key), eq(users.role, "user")))
            .limit(1);

          if (!match) {
            throw new APIError("UNAUTHORIZED", { message: "Invalid" });
          }

          const user = await ctx.context.internalAdapter.findUserById(match.id);
          if (!user) {
            throw new APIError("UNAUTHORIZED", { message: "Invalid" });
          }

          const session = await ctx.context.internalAdapter.createSession(user.id);
          if (!session) {
            throw new APIError("INTERNAL_SERVER_ERROR");
          }

          await setSessionCookie(ctx, { session, user });
          return ctx.json({ ok: true });
        }
      ),
    },
  }) satisfies BetterAuthPlugin;
