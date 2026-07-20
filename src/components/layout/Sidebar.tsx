"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  Mail,
  Send,
  GitPullRequest,
  Archive,
  StickyNote,
  Workflow,
  FilePen,
  Database,
  Globe,
  LayoutDashboard,
  Users as UsersIcon,
  FileBarChart,
  Building2,
  MapPin,
  UserCog,
  Settings,
  LogOut,
  X,
  Shield,
  Calendar,
  ClipboardList,
  CheckSquare,
  Award,
  Presentation,
  Briefcase,
  Receipt,
  Coins,
  Wallet,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ─── Leaf Menu Item ──────────────────────────────────────────────── */
interface LeafItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
  indent?: boolean;
}

const LeafItem = ({ href, icon: Icon, label, active, onClick, indent }: LeafItemProps) => {
  if (indent) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          "flex items-center gap-2.5 px-3 py-[7px] rounded-lg transition-all duration-200 group text-[13px] border border-transparent",
          active
            ? "bg-[#006633]/8 text-[#006633] font-bold border-[#006633]/10"
            : "text-slate-600 hover:bg-slate-50 hover:text-[#006633] font-medium"
        )}
      >
        <Icon
          size={14}
          className={cn(
            "shrink-0 transition-colors",
            active ? "text-[#006633]" : "text-slate-400 group-hover:text-[#006633]"
          )}
        />
        <span className="flex-1 leading-snug truncate">{label}</span>
        {active && (
          <span className="w-1 h-1 bg-[#D4AF37] rounded-full shadow-sm shadow-[#D4AF37]/50 animate-pulse" />
        )}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group relative font-semibold text-[13px] border border-transparent",
        active
          ? "bg-gradient-to-r from-[#006633] to-[#12824A] text-white shadow-sm border-[#006633]/10"
          : "text-slate-600 hover:bg-slate-50 hover:text-[#006633]"
      )}
    >
      <Icon
        size={17}
        className={cn(
          "shrink-0 transition-all duration-200 group-hover:scale-105",
          active ? "text-white" : "text-slate-400 group-hover:text-[#006633]"
        )}
      />
      <span className="flex-1 leading-tight">{label}</span>
      {active && (
        <span className="absolute right-3.5 w-1.5 h-1.5 bg-[#D4AF37] rounded-full shadow-sm shadow-[#D4AF37]/50" />
      )}
    </Link>
  );
};

/* ─── Section Header ──────────────────────────────────────────────── */
const SectionHeader = ({ label }: { label: string }) => (
  <div className="text-[10px] uppercase tracking-[0.15em] text-[#006633]/50 font-bold mt-5 mb-1.5 px-3.5 flex items-center gap-2">
    <span className="w-3.5 h-[1.5px] bg-[#D4AF37]/40 rounded-full" />
    {label}
  </div>
);

/* ─── Static Nav Section (always open) ────────────────────────────── */
interface NavGroupProps {
  label: string;
  children: React.ReactNode;
  active?: boolean;
}

const NavGroup = ({ label, children, active }: NavGroupProps) => (
  <div className="mt-4">
    <div className="flex items-center gap-2 px-3.5 py-1">
      <span className="w-1 h-3 bg-[#D4AF37] rounded-full shrink-0" />
      <span className={cn(
        "text-[10px] uppercase tracking-[0.15em] font-extrabold",
        active ? "text-[#006633]" : "text-slate-400"
      )}>{label}</span>
    </div>
    <div className="mt-1 ml-[19px] border-l border-slate-100 pl-3 flex flex-col gap-1 pb-1">
      {children}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   SIDEBAR
   ═══════════════════════════════════════════════════════════════════ */
const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const anyActive = (...hrefs: string[]) =>
    hrefs.some((h) => pathname === h || pathname.startsWith(h + "/"));

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-[260px] bg-white border-r border-slate-100 flex flex-col transition-all duration-300 ease-in-out select-none",
          isOpen ? "translate-x-0 shadow-2xl shadow-black/5" : "-translate-x-full",
          "lg:sticky lg:translate-x-0 lg:z-10 lg:shadow-none"
        )}
      >
        {/* ── Logo Area ─────────────────────────────────────── */}
        <div className="px-4.5 pt-4.5 pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#006633] flex items-center justify-center shadow-md shadow-[#006633]/15 shrink-0 overflow-hidden p-1">
              <Image
                src="/images/logo-dsn.png"
                alt="Logo DSN-MUI"
                width={32}
                height={32}
                className="object-contain brightness-0 invert"
                style={{ width: 'auto', height: 'auto' }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-extrabold text-[#006633] text-[15px] leading-none tracking-tight">
                AMANAH
              </h1>
              <span className="text-[9px] font-bold tracking-wider text-[#D4AF37] block mt-1.5 uppercase">
                DSN-MUI Digital
              </span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all flex-shrink-0"
              aria-label="Tutup menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Navigation ────────────────────────────────────── */}
        <nav className="flex-1 flex flex-col gap-0.5 overflow-y-auto px-3 pt-3.5 pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200">

          {/* Beranda */}
          <LeafItem
            href="/dashboard"
            icon={Home}
            label="Beranda"
            active={pathname === "/dashboard"}
            onClick={onClose}
          />


          <NavGroup
            label="Persuratan"
            active={anyActive("/surat-masuk", "/surat-keluar", "/disposisi", "/arsip-surat", "/memo-internal")}
          >
            <LeafItem href="/surat-masuk" icon={Mail} label="Surat Masuk" active={anyActive("/surat-masuk")} onClick={onClose} indent />
            <LeafItem href="/surat-keluar" icon={Send} label="Surat Keluar" active={anyActive("/surat-keluar")} onClick={onClose} indent />
            <LeafItem href="/disposisi" icon={GitPullRequest} label="Disposisi" active={anyActive("/disposisi")} onClick={onClose} indent />
            <LeafItem href="/arsip-surat" icon={Archive} label="Arsip" active={anyActive("/arsip-surat")} onClick={onClose} indent />
            <LeafItem href="/template-surat" icon={StickyNote} label="Template Surat" active={pathname === "/template-surat"} onClick={onClose} indent />
          </NavGroup>

          <NavGroup
            label="Agenda dan Rapat"
            active={anyActive("/agenda", "/notula", "/tindak-lanjut")}
          >
            <LeafItem href="/agenda" icon={Calendar} label="Agenda" active={anyActive("/agenda")} onClick={onClose} indent />
            <LeafItem href="/notula" icon={ClipboardList} label="Notula Rapat" active={anyActive("/notula")} onClick={onClose} indent />
            <LeafItem href="/tindak-lanjut" icon={CheckSquare} label="Tindak Lanjut" active={anyActive("/tindak-lanjut")} onClick={onClose} indent />
          </NavGroup>

          <NavGroup
            label="Fatwa"
            active={anyActive("/fatwa-workflow", "/fatwa-draft", "/fatwa-database", "/fatwa-publikasi")}
          >
            <LeafItem href="/fatwa-workflow" icon={Workflow} label="Dashboard Fatwa" active={anyActive("/fatwa-workflow")} onClick={onClose} indent />
            <LeafItem href="/fatwa-draft" icon={FilePen} label="Draft Fatwa" active={anyActive("/fatwa-draft")} onClick={onClose} indent />
            <LeafItem href="/fatwa-database" icon={Database} label="Database Fatwa" active={anyActive("/fatwa-database")} onClick={onClose} indent />
            <LeafItem href="/fatwa-publikasi" icon={Globe} label="Publikasi Fatwa" active={anyActive("/fatwa-publikasi")} onClick={onClose} indent />
          </NavGroup>

          <NavGroup
            label="Keuangan"
            active={anyActive("/invoice", "/kontribusi-dps", "/tagihan-lks")}
          >
            <LeafItem href="/invoice" icon={Receipt} label="Invoice" active={anyActive("/invoice")} onClick={onClose} indent />
            <LeafItem href="/kontribusi-dps" icon={Coins} label="Kontribusi DPS" active={anyActive("/kontribusi-dps")} onClick={onClose} indent />
            <LeafItem href="/tagihan-lks" icon={Wallet} label="Tagihan LKS/LBS/LPS" active={anyActive("/tagihan-lks")} onClick={onClose} indent />
          </NavGroup>

          <NavGroup
            label="DPS"
            active={anyActive("/dps-dashboard", "/dps-data", "/dps-laporan")}
          >
            <LeafItem href="/dps-dashboard" icon={LayoutDashboard} label="Dashboard DPS" active={anyActive("/dps-dashboard")} onClick={onClose} indent />
            <LeafItem href="/dps-data" icon={UsersIcon} label="Data DPS" active={anyActive("/dps-data")} onClick={onClose} indent />
            <LeafItem href="/dps-laporan" icon={FileBarChart} label="Laporan DPS" active={anyActive("/dps-laporan")} onClick={onClose} indent />
          </NavGroup>


          <NavGroup
            label="Pelatihan dan Sertifikasi"
            active={anyActive("/pdps", "/pdmmf", "/workshop", "/ijtima-sanawi", "/magang")}
          >
            <LeafItem href="/pdps" icon={Award} label="PDPS" active={anyActive("/pdps")} onClick={onClose} indent />
            <LeafItem href="/pdmmf" icon={Award} label="PDMMF" active={anyActive("/pdmmf")} onClick={onClose} indent />
            <LeafItem href="/workshop" icon={Presentation} label="Workshop" active={anyActive("/workshop")} onClick={onClose} indent />
            <LeafItem href="/ijtima-sanawi" icon={UsersIcon} label="Ijtima' Sanawi" active={anyActive("/ijtima-sanawi")} onClick={onClose} indent />
            <LeafItem href="/magang" icon={Briefcase} label="Magang" active={anyActive("/magang")} onClick={onClose} indent />
          </NavGroup>


          <div className="px-3.5 my-1">
            <LeafItem
              href="/arsip-digital"
              icon={FolderOpen}
              label="Arsip Digital"
              active={pathname === "/arsip-digital" || pathname.startsWith("/arsip-digital/")}
              onClick={onClose}
            />
          </div>


          <NavGroup
            label="Master Data"
            active={anyActive("/master-lembaga", "/master-wilayah", "/users")}
          >
            <LeafItem href="/master-lembaga" icon={Building2} label="Lembaga" active={anyActive("/master-lembaga")} onClick={onClose} indent />
            <LeafItem href="/master-wilayah" icon={MapPin} label="Wilayah" active={anyActive("/master-wilayah")} onClick={onClose} indent />
            <LeafItem href="/users" icon={UserCog} label="Pengguna" active={anyActive("/users")} onClick={onClose} indent />
          </NavGroup>

          {/* ── PENGATURAN ─────────────────────── */}

          <LeafItem
            href="/settings"
            icon={Settings}
            label="Pengaturan"
            active={pathname === "/settings"}
            onClick={onClose}
          />
        </nav>

        {/* ── User Card + Logout ────────────────────────────── */}
        <div className="px-3 pb-3.5 pt-2 border-t border-slate-100">
          {user && (
            <div className="p-3 bg-gradient-to-br from-[#E8F5EE] to-[#F7F5EC] border border-slate-100 rounded-xl mb-2 relative overflow-hidden shadow-sm">
              {/* Decorative circle */}
              <div className="absolute -top-3 -right-3 w-12 h-12 bg-[#D4AF37]/10 rounded-full blur-md pointer-events-none" />

              <div className="flex items-center gap-2.5 relative z-10">
                <div className="w-8 h-8 rounded-lg bg-[#006633] flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm">
                  {user.fullName?.charAt(0) ?? "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                    {user.fullName}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wide">
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all font-semibold text-xs group cursor-pointer"
          >
            <LogOut
              size={15}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
