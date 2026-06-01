"use client";

import React from "react";
import { Bell, Search, Menu, Cpu, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";

interface TopbarProps {
  onMenuClick: () => void;
}

const Topbar = ({ onMenuClick }: TopbarProps) => {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-20">
      
      {/* Left side: Hamburger & HSM status */}
      <div className="flex items-center gap-4">
        {/* Mobile Hamburger */}
        <button
          id="sidebar-toggle"
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all text-slate-600 dark:text-slate-350"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        {/* Cryptographic Node Status Tag - Visible on desktop */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md">
          <Cpu size={12} className="text-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono tracking-wider uppercase">
            HSM Token: Connected
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </div>

        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md">
          <ShieldCheck size={12} className="text-[#D4AF37]" />
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono tracking-wider uppercase">
            Root CA: Validated
          </span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 sm:gap-4">
        
        {/* Search Bar - Polished Corporate Style */}
        <div className="hidden sm:flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 rounded-lg w-60 md:w-72 lg:w-80 transition-all focus-within:ring-2 focus-within:ring-[#D4AF37]/20 focus-within:border-[#D4AF37]/40">
          <Search size={15} className="text-slate-450 flex-shrink-0" />
          <input
            type="text"
            placeholder="Cari nomor seri, dokumen..."
            className="bg-transparent border-none outline-none text-xs w-full text-slate-700 dark:text-slate-250 min-w-0"
          />
        </div>

        <button className="sm:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all text-slate-650 dark:text-slate-400">
          <Search size={18} />
        </button>

        {/* Notifications */}
        <button className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all group border border-slate-100 dark:border-slate-800">
          <Bell
            size={17}
            className="text-slate-600 dark:text-slate-400 group-hover:rotate-12 transition-transform"
          />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-950"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-slate-200 dark:border-slate-850">
          <div className="hidden md:block text-right">
            <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
              {user?.fullName || "Guest Signer"}
            </p>
            <span className="text-[9px] font-extrabold text-[#D4AF37] uppercase tracking-wider block mt-0.5 font-mono">
              {user?.role || "Visitor"}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group hover:border-[#D4AF37]/50 transition-all cursor-pointer">
            <div className="w-full h-full flex items-center justify-center bg-[#0B1325]/10 dark:bg-[#0B1325]/40 text-[#0B1325] dark:text-[#D4AF37] font-bold text-xs">
              {user?.fullName?.charAt(0) ?? "U"}
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};

export default Topbar;
