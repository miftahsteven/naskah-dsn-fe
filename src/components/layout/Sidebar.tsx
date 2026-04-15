"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  ShieldCheck,
  FileCheck,
  Activity,
  LogOut,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem = ({ href, icon: Icon, label, active, onClick }: NavItemProps) => (
  <Link
    href={href}
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
      active
        ? "bg-primary text-white shadow-lg shadow-primary/20"
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
    )}
  >
    <Icon
      size={20}
      className={cn(
        active ? "text-white" : "group-hover:scale-110 transition-transform"
      )}
    />
    <span className="font-medium">{label}</span>
    {active && (
      <div className="absolute right-3">
        <ChevronRight size={14} />
      </div>
    )}
  </Link>
);

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/documents", icon: FileText, label: "Dokumen" },
    { href: "/approvals", icon: FileCheck, label: "Persetujuan" },
    {
      href: "/users",
      icon: Users,
      label: "User Management",
      roles: ["SUPER_ADMIN", "ORG_ADMIN"],
    },
    {
      href: "/roles",
      icon: ShieldCheck,
      label: "Role & Permission",
      roles: ["SUPER_ADMIN"],
    },
    {
      href: "/audit-log",
      icon: Activity,
      label: "Audit Log",
      roles: ["SUPER_ADMIN", "ORG_ADMIN"],
    },
  ];

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <>
      {/* Sidebar Panel */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-72 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col p-6 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
          "lg:sticky lg:translate-x-0 lg:z-10 lg:shadow-none"
        )}
      >
        {/* Logo + Mobile Close Button */}
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0">
            M
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-slate-900 dark:text-white leading-tight truncate">
              MUI Naskah
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Digital System
            </p>
          </div>
          {/* Close button - only on mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex-shrink-0"
            aria-label="Tutup menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav Menu */}
        <nav className="flex-1 flex flex-col gap-2 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-600 font-bold mb-2 ml-4">
            Main Menu
          </div>
          {filteredNavItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={pathname === item.href}
              onClick={onClose}
            />
          ))}

          <div className="mt-8 text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-600 font-bold mb-2 ml-4">
            Personal
          </div>
          <NavItem
            href="/settings"
            icon={Settings}
            label="Pengaturan"
            active={pathname === "/settings"}
            onClick={onClose}
          />
        </nav>

        {/* User Info + Logout */}
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          {user && (
            <div className="flex items-center gap-3 px-4 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                {user.fullName?.charAt(0) ?? "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">
                  {user.fullName}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-tight text-primary truncate">
                  {user.role}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all font-medium group"
          >
            <LogOut
              size={20}
              className="group-hover:-translate-x-1 transition-transform"
            />
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
