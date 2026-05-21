"use client";

import { useTranslation, type Locale } from "@/lib/i18n";
import { useState, useRef, useEffect } from "react";
import { Languages } from "lucide-react";

const localeLabels: Record<Locale, string> = {
  en: "EN",
  sk: "SK",
};

export function LanguageToggle() {
  const { locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors text-xs font-semibold"
        aria-label="Switch language"
      >
        <span>{localeLabels[locale]}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-24 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-lg py-1 z-50">
          {(Object.keys(localeLabels) as Locale[]).map((l) => (
            <button
              key={l}
              onClick={() => { setLocale(l); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                l === locale
                  ? "text-brand-600 dark:text-brand-400 font-semibold"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {localeLabels[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
