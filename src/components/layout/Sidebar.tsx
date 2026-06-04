"use client";

import React, { useState, useEffect } from "react";
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
  ChevronDown,
  X,
  Shield,
  Inbox,
  FolderArchive,
  Send,
  List,
  FileSignature,
  MessageSquare,
  LayoutTemplate,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Single nav item (leaf) ───────────────────────────────────────────────────
interface LeafItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
  indent?: boolean;
}

const LeafItem = ({ href, icon: Icon, label, active, onClick, indent }: LeafItemProps) => {
  // ── Child item (inside a NavGroup) ──────────────────────────────────────────
  if (indent) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          "flex items-center gap-2.5 px-3 py-2 rounded-md transition-all duration-150 group text-sm",
          active
            ? "text-white font-bold"
            : "text-slate-500 hover:text-slate-200 font-medium"
        )}
      >
        {/* Gold dot indicator — visible only when active */}
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-150",
            active ? "bg-[#D4AF37] shadow-[0_0_6px_#D4AF3780]" : "bg-slate-700 group-hover:bg-slate-500"
          )}
        />
        <span className="flex-1 leading-snug truncate">{label}</span>
      </Link>
    );
  }

  // ── Top-level item ───────────────────────────────────────────────────────────
  return (
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
      <span className="flex-1 leading-tight">{label}</span>
      {active && (
        <ChevronRight size={12} className="text-[#D4AF37] opacity-80 shrink-0" />
      )}
    </Link>
  );
};


// ── Collapsible parent group ─────────────────────────────────────────────────
interface NavGroupProps {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  active?: boolean;   // true if any child route is active
}

const NavGroup = ({ icon: Icon, label, children, defaultOpen = false, active }: NavGroupProps) => {
  const [open, setOpen] = useState(defaultOpen);

  // Auto-expand if a child is active
  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 group border-l-4 text-sm font-semibold",
          active
            ? "text-white border-[#D4AF37]/60 bg-slate-800/40"
            : "text-slate-400 hover:bg-white/5 hover:text-white border-transparent"
        )}
      >
        <Icon
          size={18}
          className={cn(
            active ? "text-[#D4AF37]" : "text-slate-400 group-hover:text-white transition-colors"
          )}
        />
        <span className="flex-1 text-left leading-tight">{label}</span>
        {open
          ? <ChevronDown size={14} className={cn("shrink-0 transition-transform", active ? "text-[#D4AF37]" : "text-slate-500")} />
          : <ChevronRight size={14} className={cn("shrink-0 transition-transform", active ? "text-[#D4AF37]" : "text-slate-500")} />
        }
      </button>

      {/* Child items with animated height */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="mt-0.5 ml-3 border-l border-slate-700/60 pl-1 flex flex-col gap-0.5">
          {children}
        </div>
      </div>
    </div>
  );
};

// ── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const isAdmin = user && ["SUPER_ADMIN", "ORG_ADMIN"].includes(user.role);

  // Helper: is any of the given hrefs currently active?
  const anyActive = (...hrefs: string[]) =>
    hrefs.some((h) => pathname === h || pathname.startsWith(h + "/"));

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
        {/* Logo + Mobile Close */}
        <div className="flex items-center gap-3 mb-8 px-2 py-1">
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
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all flex-shrink-0"
            aria-label="Tutup menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav Menu */}
        <nav className="flex-1 flex flex-col gap-0.5 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">

          {/* ── Menu Utama ─────────────────────────────────────── */}
          <div className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-2 ml-4">
            Menu Utama
          </div>

          {/* Dashboard */}
          <LeafItem
            href="/dashboard"
            icon={LayoutDashboard}
            label="Dashboard Ringkasan"
            active={pathname === "/dashboard"}
            onClick={onClose}
          />

          {/* ── PERSURATAN (parent group) ─────────── */}
          <NavGroup
            icon={Send}
            label="Persuratan"
            active={anyActive("/surat-keluar", "/daftar-surat", "/arsip-surat", "/surat-disposisi")}
          >
            <LeafItem
              href="/surat-keluar/new"
              icon={FileText}
              label="Membuat Surat"
              active={pathname === "/surat-keluar/new" || pathname.startsWith("/surat-keluar/new")}
              onClick={onClose}
              indent
            />
            <LeafItem
              href="/surat-keluar"
              icon={List}
              label="Daftar Surat"
              active={pathname === "/surat-keluar"}
              onClick={onClose}
              indent
            />
            <LeafItem
              href="/arsip-surat"
              icon={FolderArchive}
              label="Arsip"
              active={pathname === "/arsip-surat" || pathname.startsWith("/arsip-surat/")}
              onClick={onClose}
              indent
            />
            <LeafItem
              href="/surat-disposisi"
              icon={FileSignature}
              label="Surat Disposisi"
              active={pathname === "/surat-disposisi" || pathname.startsWith("/surat-disposisi/")}
              onClick={onClose}
              indent
            />
          </NavGroup>

          {/* ── SURAT MASUK (parent group) ─────────── */}
          <NavGroup
            icon={Inbox}
            label="Surat Masuk"
            active={anyActive("/surat-masuk", "/permohonan", "/log-respon")}
          >
            <LeafItem
              href="/surat-masuk"
              icon={Inbox}
              label="Semua Surat Masuk"
              active={pathname === "/surat-masuk" || pathname.startsWith("/surat-masuk/")}
              onClick={onClose}
              indent
            />
            <LeafItem
              href="/permohonan"
              icon={BookOpen}
              label="Permohonan"
              active={pathname === "/permohonan" || pathname.startsWith("/permohonan/")}
              onClick={onClose}
              indent
            />
            <LeafItem
              href="/log-respon"
              icon={MessageSquare}
              label="Log Respon"
              active={pathname === "/log-respon" || pathname.startsWith("/log-respon/")}
              onClick={onClose}
              indent
            />
          </NavGroup>

          {/* Master Surat */}
          <LeafItem
            href="/master-surat"
            icon={LayoutTemplate}
            label="Master Surat"
            active={pathname === "/master-surat" || pathname.startsWith("/master-surat/")}
            onClick={onClose}
          />

          {/* Persetujuan E-Sign */}
          <LeafItem
            href="/approvals"
            icon={FileCheck}
            label="Persetujuan E-Sign"
            active={pathname === "/approvals" || pathname.startsWith("/approvals/")}
            onClick={onClose}
          />

          {/* ── Admin / Restricted ─────────────────────────────── */}
          {(isAdmin || user?.permissions?.includes("USER_EDIT")) && (
            <>
              <div className="mt-5 text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-2 ml-4">
                Administrasi
              </div>
              {(isAdmin || user?.permissions?.includes("USER_EDIT")) && (
                <LeafItem
                  href="/users"
                  icon={Users}
                  label="Manajemen Pengguna"
                  active={pathname === "/users" || pathname.startsWith("/users/")}
                  onClick={onClose}
                />
              )}
              {(isAdmin || user?.permissions?.includes("ROLE_MANAGE")) && (
                <LeafItem
                  href="/roles"
                  icon={ShieldCheck}
                  label="Hak Akses & Otoritas"
                  active={pathname === "/roles" || pathname.startsWith("/roles/")}
                  onClick={onClose}
                />
              )}
              {isAdmin && (
                <LeafItem
                  href="/audit-log"
                  icon={Activity}
                  label="Log Audit Kriptografi"
                  active={pathname === "/audit-log" || pathname.startsWith("/audit-log/")}
                  onClick={onClose}
                />
              )}
            </>
          )}

          {/* ── Konfigurasi ─────────────────────────────────────── */}
          <div className="mt-5 text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-2 ml-4">
            Konfigurasi
          </div>
          <LeafItem
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
