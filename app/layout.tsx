import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/toast";
import { LocaleProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Logman PB",
  description: "Data submission and management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sk" suppressHydrationWarning>
      <body className="min-h-dvh bg-brand-50 dark:bg-gray-950 antialiased">
        <Toaster>
          <ThemeProvider>
            <LocaleProvider>{children}</LocaleProvider>
          </ThemeProvider>
        </Toaster>
      </body>
    </html>
  );
}
