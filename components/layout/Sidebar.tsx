"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth/client";
import {
  LayoutDashboard, FileText, Users, Download,
  Layers,
  FileStack,
  ClipboardCheck,
} from "lucide-react";
import { clsx } from "clsx";
import { useTranslation } from "@/lib/i18n";

const roleRank: Record<string, number> = { user: 1, operator: 2, admin: 3 };

function NavLink({
  href,
  label,
  icon: Icon,
  pathname,
  onNavigate,
  collapsed,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  pathname: string;
  onNavigate: () => void;
  collapsed?: boolean;
}) {
  const active = pathname.startsWith(href);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={clsx(
        "flex items-center py-2.5 rounded-lg text-sm font-medium transition-colors",
        collapsed ? "justify-center px-0" : "gap-3 px-3",
        active
          ? "bg-brand-600 text-white"
          : "text-gray-600 hover:bg-brand-50 hover:text-brand-700 dark:text-gray-400 dark:hover:bg-brand-900/20 dark:hover:text-brand-300"
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {!collapsed && label}
    </Link>
  );
}

function NavContent({
  pathname,
  isOperator,
  isAdmin,
  onNavigate,
  collapsed,
}: {
  pathname: string;
  isOperator: boolean;
  isAdmin: boolean;
  onNavigate: () => void;
  collapsed?: boolean;
}) {
  const { t } = useTranslation();

  const userNavItems = [
    { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/worker-productions", label: t.nav.myProductions, icon: FileText },
  ];

  const operatorNavItems = [
    { href: "/admin/worker-productions", label: t.nav.productions, icon: ClipboardCheck },
  ];

  const adminNavItems = [
    { href: "/admin/definitions", label: t.nav.definitions, icon: Layers },
    { href: "/admin/exports", label: t.nav.exports, icon: Download },
    { href: "/admin/users", label: t.nav.users, icon: Users },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-14 flex items-center justify-center">
        {collapsed ? (
          <Image src="/images/logo.png" alt="Logman" width={100} height={100} style={{ width: "auto", height: "25px" }} loading="eager" />
        ) : (
          <div className="flex items-center gap-2 w-full px-3">
            <Image src="/images/logo.png" alt="Logman Triangle" width={100} height={100} style={{ width: "auto", height: "25px" }} loading="eager" />
            <Image src="/images/logo-brand.webp" alt="Logman PB" width={100} height={24} style={{ width: "auto", height: "28px" }} className="dark:hidden" />
            <Image src="/images/logo-white.webp" alt="Logman PB" width={100} height={24} style={{ width: "auto", height: "28px" }} className="hidden dark:block" />
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
        {userNavItems.map((item) => (
          <NavLink key={item.href} {...item} pathname={pathname} onNavigate={onNavigate} collapsed={collapsed} />
        ))}

        {isOperator && (
          <>
            {!collapsed && (
              <div className="pt-4 pb-1 px-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-600">
                  {t.nav.operator}
                </span>
              </div>
            )}
            {collapsed && <div className="pt-2" />}
            {operatorNavItems.map((item) => (
              <NavLink key={item.href} {...item} pathname={pathname} onNavigate={onNavigate} collapsed={collapsed} />
            ))}
          </>
        )}

        {isAdmin && (
          <>
            {!collapsed && (
              <div className="pt-4 pb-1 px-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-600">
                  {t.nav.admin}
                </span>
              </div>
            )}
            {collapsed && <div className="pt-2" />}
            {adminNavItems.map((item) => (
              <NavLink key={item.href} {...item} pathname={pathname} onNavigate={onNavigate} collapsed={collapsed} />
            ))}
          </>
        )}
      </nav>
    </div>
  );
}

export function Sidebar({
  open,
  onClose,
  collapsed,
}: {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const userRole = session?.user?.role ?? "user";

  const isOperator = roleRank[userRole] >= roleRank["operator"];
  const isAdmin = roleRank[userRole] >= roleRank["admin"];

  const navProps = { pathname, isOperator, isAdmin, onNavigate: onClose };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={clsx(
          "hidden md:flex shrink-0 flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 h-dvh sticky top-0 transition-[width] duration-200 ease-in-out overflow-hidden",
          collapsed ? "w-14" : "w-50"
        )}
      >
        <NavContent {...navProps} onNavigate={() => {}} collapsed={collapsed} />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="w-56 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col">
            <NavContent {...navProps} />
          </div>
          <div
            className="flex-1 bg-black/30"
            onClick={onClose}
          />
        </div>
      )}
    </>
  );
}

