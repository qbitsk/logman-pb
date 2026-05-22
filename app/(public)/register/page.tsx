"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function RegisterPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600 mb-4">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-brand-950 dark:text-white mb-2">{t.register.title}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
          {t.register.description}
        </p>
        <Link href="/login" className="btn-primary inline-block">
          {t.register.backToLogin}
        </Link>
      </div>
    </div>
  );
}
