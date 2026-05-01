"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth/client";
import {
  LayoutDashboard, FileText, Users, Download,
  LogOut, ShieldCheck, Menu, X,
  Layers,
  Triangle,
} from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";
import { ThemeToggle } from "./ThemeToggle";

const userNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/worker-productions", label: "My Productions", icon: FileText },
];

const adminNavItems = [
  { href: "/admin/worker-productions", label: "Productions", icon: FileText },
  { href: "/admin/work-categories", label: "Definitions", icon: Layers },
  { href: "/admin/exports", label: "Exports", icon: Download },
  { href: "/admin/users", label: "Users", icon: Users },
];

const roleRank: Record<string, number> = { user: 1, editor: 2, admin: 3 };

function NavLink({
  href,
  label,
  icon: Icon,
  pathname,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  pathname: string;
  onNavigate: () => void;
}) {
  const active = pathname.startsWith(href);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={clsx(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
        active
          ? "bg-brand-600 text-white"
          : "text-gray-600 hover:bg-brand-50 hover:text-brand-700 dark:text-gray-400 dark:hover:bg-brand-900/20 dark:hover:text-brand-300"
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </Link>
  );
}

function NavContent({
  pathname,
  session,
  userRole,
  isAdmin,
  onNavigate,
  onSignOut,
}: {
  pathname: string;
  session: ReturnType<typeof useSession>["data"];
  userRole: string;
  isAdmin: boolean;
  onNavigate: () => void;
  onSignOut: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-brand-100 dark:border-gray-800">
        <div className="flex items-center gap-2 pl-10 md:pl-0">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-brand-600">
              <Triangle className="w-4 h-4 text-white" />
            </div>
          <Image src="/images/logo-brand.webp" alt="Logman PB" width={100} height={24} style={{ width: "auto", height: "32px" }} className="dark:hidden" />
          <Image src="/images/logo-white.webp" alt="Logman PB" width={100} height={24} style={{ width: "auto", height: "32px" }} className="hidden dark:block" />
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {userNavItems.map((item) => (
          <NavLink key={item.href} {...item} pathname={pathname} onNavigate={onNavigate} />
        ))}

        {isAdmin && (
          <>
            <div className="pt-4 pb-1 px-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-600">
                Admin
              </span>
            </div>
            {adminNavItems.map((item) => (
              <NavLink key={item.href} {...item} pathname={pathname} onNavigate={onNavigate} />
            ))}
          </>
        )}
      </nav>

      {/* User + logout */}
      <div className="border-t border-brand-100 dark:border-gray-800 p-4">
        <Link href="/profile" onClick={onNavigate} className="flex items-center gap-3 px-2 mb-3 rounded-lg hover:bg-brand-50 dark:hover:bg-gray-800 transition-colors py-1">
          <div className="w-8 h-8 rounded-full bg-brand-200 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-sm shrink-0">
            {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {session?.user?.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{userRole}</p>
          </div>
        </Link>
        <div className="flex items-center justify-between">
          <button
            onClick={onSignOut}
            className="flex items-center gap-2 flex-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const userRole = session?.user?.role ?? "user";

  const isAdmin = roleRank[userRole] >= roleRank["admin"];

  const handleNavigate = () => setOpen(false);
  const handleSignOut = () =>
    signOut({ fetchOptions: { onSuccess: () => router.push("/login") } });

  const navProps = { pathname, session, userRole, isAdmin, onNavigate: handleNavigate, onSignOut: handleSignOut };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 min-h-screen">
        <NavContent {...navProps} />
      </aside>

      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-100 dark:border-gray-800"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="w-5 h-5 dark:text-gray-300" /> : <Menu className="w-5 h-5 dark:text-gray-300" />}
      </button>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="w-60 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col">
            <NavContent {...navProps} />
          </div>
          <div
            className="flex-1 bg-black/30"
            onClick={() => setOpen(false)}
          />
        </div>
      )}
    </>
  );
}
