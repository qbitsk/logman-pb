"use client";

import Link from "next/link";
import { ShieldX } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function UnauthorizedPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/20 mb-4">
          <ShieldX className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t.unauthorized.title}</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {t.unauthorized.description}
        </p>
        <Link href="/dashboard" className="btn-primary">
          {t.unauthorized.backToDashboard}
        </Link>
      </div>
    </div>
  );
}
