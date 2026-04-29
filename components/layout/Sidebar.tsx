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

const userNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/submissions", label: "My Submissions", icon: FileText },
];

const adminNavItems = [
  { href: "/admin/submissions", label: "Submissions", icon: FileText },
  { href: "/admin/work-categories", label: "Categories", icon: Layers },
  { href: "/admin/exports", label: "Exports", icon: Download },
  { href: "/admin/users", label: "Users", icon: Users },
];

const roleRank: Record<string, number> = { user: 1, editor: 2, admin: 3 };

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const userRole = session?.user?.role ?? "user";

  const isAdmin = roleRank[userRole] >= roleRank["admin"];

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) => {
    const active = pathname.startsWith(href);
    return (
      <Link
        href={href}
        onClick={() => setOpen(false)}
        className={clsx(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
          active
            ? "bg-brand-600 text-white"
            : "text-gray-600 hover:bg-brand-50 hover:text-brand-700"
        )}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {label}
      </Link>
    );
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-brand-100">
        <div className="flex items-center gap-2 pl-10 md:pl-0">
          <Triangle className="w-6 h-6 text-brand-600" />
          <Image src="/images/logo-brand.png" alt="Logman PB" width={100} height={24} />
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {userNavItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}

        {isAdmin && (
          <>
            <div className="pt-4 pb-1 px-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Admin
              </span>
            </div>
            {adminNavItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </>
        )}
      </nav>

      {/* User + logout */}
      <div className="border-t border-brand-100 p-4">
        <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 px-2 mb-3 rounded-lg hover:bg-brand-50 transition-colors py-1">
          <div className="w-8 h-8 rounded-full bg-brand-200 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0">
            {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {session?.user?.name}
            </p>
            <p className="text-xs text-gray-500 capitalize">{userRole}</p>
          </div>
        </Link>
        <button
          onClick={() => signOut({ fetchOptions: { onSuccess: () => router.push("/login") } })}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-white border-r border-gray-100 min-h-screen">
        <NavContent />
      </aside>

      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow border border-gray-100"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="w-60 bg-white border-r border-gray-100 flex flex-col">
            <NavContent />
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
