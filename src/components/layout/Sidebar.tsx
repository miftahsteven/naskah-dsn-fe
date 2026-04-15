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
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
}

const NavItem = ({ href, icon: Icon, label, active }: NavItemProps) => (
  <Link
    href={href}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
      active 
        ? "bg-primary text-white shadow-lg shadow-primary/20" 
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
    )}
  >
    <Icon size={20} className={cn(active ? "text-white" : "group-hover:scale-110 transition-transform")} />
    <span className="font-medium">{label}</span>
    {active && (
      <div className="absolute right-3">
        <ChevronRight size={14} />
      </div>
    )}
  </Link>
);

const Sidebar = () => {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/documents", icon: FileText, label: "Dokumen" },
    { href: "/approvals", icon: FileCheck, label: "Persetujuan" },
    { href: "/users", icon: Users, label: "User Management", roles: ["SUPER_ADMIN", "ORG_ADMIN"] },
    { href: "/roles", icon: ShieldCheck, label: "Role & Permission", roles: ["SUPER_ADMIN"] },
    { href: "/audit-log", icon: Activity, label: "Audit Log", roles: ["SUPER_ADMIN", "ORG_ADMIN"] },
  ];

  const filteredNavItems = navItems.filter(item => 
    !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <aside className="w-72 h-screen border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col p-6 sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-xl shadow-lg">
          M
        </div>
        <div>
          <h1 className="font-bold text-slate-900 dark:text-white leading-tight">MUI Naskah</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Digital System</p>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 flex flex-col gap-2">
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
        />
      </nav>

      {/* Logout */}
      <button
        onClick={() => logout()}
        className="mt-auto flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all font-medium group"
      >
        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span>Keluar</span>
      </button>
    </aside>
  );
};

export default Sidebar;
