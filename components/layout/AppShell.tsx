"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  const handleMenuToggle = () => {
    if (window.innerWidth >= 768) {
      setDesktopCollapsed((v) => !v);
    } else {
      setMobileOpen((v) => !v);
    }
  };

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} collapsed={desktopCollapsed} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMenuToggle={handleMenuToggle} />
        <main className="flex-1 overflow-y-auto p-4 md:p-5 lg:p-8">
          <div className="max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
