"use client";

import { useState } from "react";
import { signUp } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signUp.email({ name, email, password });
      router.push("/dashboard");
    } catch {
      setError("Registration failed. This email may already be in use.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600 mb-4">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-brand-950">Create account</h1>
          <p className="text-gray-500 text-sm mt-1">Get started for free</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}
            <div>
              <label className="label" htmlFor="name">Full name</label>
              <input
                id="name" type="text" required
                value={name} onChange={(e) => setName(e.target.value)}
                className="input" placeholder="Jane Smith"
              />
            </div>
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
                id="password" type="password" required minLength={8}
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="input" placeholder="At least 8 characters"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
