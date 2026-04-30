"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600 mb-4">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-brand-950 dark:text-white mb-2">Registration disabled</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          New accounts can only be created by an administrator.
        </p>
        <Link href="/login" className="btn-primary inline-block">
          Back to login
        </Link>
      </div>
    </div>
  );
}
