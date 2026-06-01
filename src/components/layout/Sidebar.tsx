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
  Shield,
  KeyRound
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
      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 group relative font-medium text-sm border-l-4",
      active
        ? "text-white bg-slate-800/80 border-[#D4AF37] font-semibold"
        : "text-slate-400 hover:bg-white/5 hover:text-white border-transparent"
    )}
  >
    <Icon
      size={18}
      className={cn(
        active ? "text-[#D4AF37]" : "text-slate-400 group-hover:text-white transition-colors"
      )}
    />
    <span className="flex-1">{label}</span>
    {active && (
      <ChevronRight size={14} className="text-[#D4AF37] opacity-80" />
    )}
  </Link>
);

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard Ringkasan" },
    { href: "/surat-masuk", icon: FileText, label: "Surat Masuk" },
    { href: "/surat-keluar", icon: FileText, label: "Surat Keluar" },
    { href: "/approvals", icon: FileCheck, label: "Persetujuan E-Sign" },
    {
      href: "/users",
      icon: Users,
      label: "Manajemen Pengguna",
      permission: "USER_EDIT",
    },
    {
      href: "/roles",
      icon: ShieldCheck,
      label: "Hak Akses & Otoritas",
      permission: "ROLE_MANAGE",
    },
    {
      href: "/audit-log",
      icon: Activity,
      label: "Log Audit Kriptografi",
      roles: ["SUPER_ADMIN", "ORG_ADMIN"],
    },
  ];

  const filteredNavItems = navItems.filter((item) => {
    // Admin bypass logic
    if (user && ["SUPER_ADMIN", "ORG_ADMIN"].includes(user.role)) return true;

    // Check by permission if defined
    if (item.permission) {
      return user?.permissions?.includes(item.permission);
    }

    // Fallback to roles if defined
    if (item.roles) {
      return user && item.roles.includes(user.role);
    }

    // Default: visible to everyone
    return true;
  });

  return (
    <>
      {/* Sidebar Panel */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-72 bg-[#0B1325] border-r border-slate-800 flex flex-col p-5 transition-transform duration-300 ease-in-out select-none",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
          "lg:sticky lg:translate-x-0 lg:z-10 lg:shadow-none"
        )}
      >
        {/* Logo + Mobile Close Button */}
        <div className="flex items-center gap-3 mb-8 px-2 py-1">
          {/* Amanah Logo */}
          <div className="w-10 h-10 rounded-lg flex-shrink-0 p-0.5 bg-[#1E293B] border border-[#D4AF37]/30 flex items-center justify-center shadow-md">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
              <path d="M24 4L38 12V28L24 36L10 28V12L24 4Z" stroke="#D4AF37" strokeWidth="1.8" fill="none" />
              <circle cx="10" cy="20" r="1.5" fill="#D4AF37" />
              <circle cx="38" cy="20" r="1.5" fill="#D4AF37" />
              <circle cx="24" cy="4" r="1.5" fill="#D4AF37" />
              <path d="M10 20H6M38 20H42" stroke="#D4AF37" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M24 4V1" stroke="#D4AF37" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M24 13L28 22H24H20L24 13Z" fill="#D4AF37" />
              <path d="M24 22V32" stroke="#D4AF37" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M21 26H27" stroke="#D4AF37" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-extrabold text-white text-base leading-none tracking-tight">
              AMANAH
            </h1>
            <span className="text-[9px] font-bold tracking-wider text-[#D4AF37] block mt-1 uppercase">
              Manajemen Dokumen
            </span>
          </div>
          {/* Close button - only on mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all flex-shrink-0"
            aria-label="Tutup menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav Menu */}
        <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
          <div className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-2 ml-4">
            Menu Utama
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

          <div className="mt-6 text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-2 ml-4">
            Konfigurasi
          </div>
          <NavItem
            href="/settings"
            icon={Settings}
            label="Pengaturan Sistem"
            active={pathname === "/settings"}
            onClick={onClose}
          />
        </nav>

        {/* User Info + Logout */}
        <div className="mt-5 pt-5 border-t border-slate-800">
          {user && (
            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl mb-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#D4AF37]/5 rounded-full blur-md -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="flex items-center gap-2.5 relative z-10">
                <div className="w-8 h-8 rounded-lg bg-[#1E293B] border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] font-bold text-xs flex-shrink-0">
                  {user.fullName?.charAt(0) ?? "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate leading-tight">
                    {user.fullName}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Shield size={10} className="text-emerald-400 shrink-0" />
                    <span className="text-[8px] font-extrabold text-emerald-400 uppercase tracking-wider">
                      Secured Signer
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/60 flex justify-between items-center text-[9px] font-mono text-slate-500">
                <span>Otoritas: {user.role}</span>
                <span className="text-emerald-500/80 flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" /> Active CA
                </span>
              </div>
            </div>
          )}

          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all font-semibold text-xs group cursor-pointer"
          >
            <LogOut
              size={16}
              className="group-hover:-translate-x-1 transition-transform"
            />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
