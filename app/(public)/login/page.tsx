"use client";

import { useState, useEffect, useRef } from "react";
import { signIn, authClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // NFC card reader detection: rapid keystrokes followed by Enter
  const nfcBuffer = useRef("");
  const nfcLastKey = useRef(0);
  const NFC_SPEED_MS = 50; // max ms between keystrokes for NFC

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const now = Date.now();

      if (e.key === "Enter") {
        const buf = nfcBuffer.current;
        const elapsed = now - nfcLastKey.current;
        nfcBuffer.current = "";

        // Only treat as NFC if buffer has content and last keystroke was fast
        if (buf.length >= 4 && elapsed < NFC_SPEED_MS * 3) {
          e.preventDefault();
          e.stopPropagation();
          handleNfcScan(buf);
        }
        return;
      }

      if (e.key.length === 1) {
        const elapsed = now - nfcLastKey.current;
        // Reset buffer if the user has been idle (i.e. human typing, not NFC)
        if (nfcLastKey.current > 0 && elapsed > NFC_SPEED_MS * 5) {
          nfcBuffer.current = "";
        }
        nfcBuffer.current += e.key;
        nfcLastKey.current = now;
      }
    }

    document.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => document.removeEventListener("keydown", handleKeyDown, { capture: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleNfcScan(key: string) {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      // Goes through the Better Auth client, which signs the session in and
      // refreshes the useSession store — so a soft navigation is enough and the
      // header shows the user immediately, no page reload needed.
      const { error } = await authClient.nfc.login({ key });
      if (error) {
        setError(t.auth.invalidCredentials);
      } else {
        router.push("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await signIn.email({ email, password });
    if (error) {
      setError(t.auth.invalidCredentials);
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-2">
          <div className="flex items-center justify-center gap-2 mb-5">
            <Image src="/images/logo.png" alt="Logman Triangle" width={100} height={100} style={{ width: "auto", height: "42px" }} loading="eager" />
            <Image src="/images/logo-brand.webp" alt="Logman PB" width={130} height={50} style={{ width: "auto", height: "50px" }} loading="eager" className="dark:hidden" />
            <Image src="/images/logo-white.webp" alt="Logman PB" width={130} height={50} style={{ width: "auto", height: "50px" }} loading="eager" className="hidden dark:block" />
          </div>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}
            <div>
              <label className="label" htmlFor="email">{t.auth.email}</label>
              <input
                id="email" type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="input" placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">{t.auth.password}</label>
              <div className="relative">
                <input
                  id="password" type={showPassword ? "text" : "password"} required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10" placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-r-lg"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? t.auth.signingIn : t.auth.signIn}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          {t.auth.noAccount}{" "}
          <Link href="/register" className="text-brand-600 font-medium hover:underline">
            {t.auth.register}
          </Link>
        </p>
      </div>
    </div>
  );
}

