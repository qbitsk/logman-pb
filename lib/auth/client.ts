import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { BetterAuthClientPlugin } from "better-auth";
import type { auth } from "./config";
import type { nfcPlugin } from "./nfc-plugin";

/**
 * Client side of the NFC login plugin. `$InferServerPlugin` infers the
 * `/nfc/login` endpoint so `authClient.nfc.login({ key })` is available and
 * typed. The `atomListeners` entry tells the client to refetch the session
 * atom after a successful call, so `useSession()` (e.g. the header) updates
 * immediately — no page reload required.
 */
const nfcClientPlugin = () =>
  ({
    id: "nfc",
    $InferServerPlugin: {} as ReturnType<typeof nfcPlugin>,
    atomListeners: [
      {
        signal: "$sessionSignal",
        matcher: (path: string) => path === "/nfc/login",
      },
    ],
  }) satisfies BetterAuthClientPlugin;

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  plugins: [inferAdditionalFields<typeof auth>(), nfcClientPlugin()],
});

export const { signIn, signOut, signUp, useSession } = authClient;
