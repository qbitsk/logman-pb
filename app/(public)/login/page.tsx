"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Triangle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn.email({ email, password });
      router.push("/dashboard");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-2">
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600">
              <Triangle className="w-6 h-6 text-white" />
            </div>
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
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email" type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="input" placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password" type="password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="input" placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-brand-600 font-medium hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
