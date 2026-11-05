import { Suspense } from "react";
import { AnalyticsShell } from "@/components/analytics/AnalyticsShell";

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <AnalyticsShell>{children}</AnalyticsShell>
    </Suspense>
  );
}
