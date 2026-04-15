"use client";

import React from "react";
import { Bell, Search, Menu, User as UserIcon } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";

interface TopbarProps {
  onMenuClick: () => void;
}

const Topbar = ({ onMenuClick }: TopbarProps) => {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="h-16 sm:h-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-20">
      {/* Mobile Hamburger */}
      <button
        id="sidebar-toggle"
        onClick={onMenuClick}
        className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-600 dark:text-slate-300"
        aria-label="Toggle sidebar"
      >
        <Menu size={22} />
      </button>

      {/* Search — hidden on small mobile, visible mid+ */}
      <div className="hidden sm:flex items-center gap-3 bg-slate-100 dark:bg-slate-800/50 px-4 py-2.5 rounded-xl w-64 md:w-80 lg:w-96 border border-transparent focus-within:border-primary/30 transition-all">
        <Search size={18} className="text-slate-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Cari dokumen, nomor, atau staff..."
          className="bg-transparent border-none outline-none text-sm w-full text-slate-700 dark:text-slate-200 min-w-0"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Search icon only on mobile */}
        <button className="sm:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-600 dark:text-slate-400">
          <Search size={20} />
        </button>

        {/* Notifications */}
        <button className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all group">
          <Bell
            size={20}
            className="text-slate-600 dark:text-slate-400 group-hover:rotate-12 transition-transform"
          />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-950"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-3 sm:pl-5 border-l border-slate-200 dark:border-slate-800">
          <div className="hidden md:block text-right">
            <p className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">
              {user?.fullName || "Guest"}
            </p>
            <p className="text-[10px] font-bold text-primary dark:text-primary uppercase tracking-tight">
              {user?.role || "Visitor"}
            </p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden group hover:border-primary/50 transition-all cursor-pointer">
            <UserIcon
              size={18}
              className="text-slate-400 group-hover:text-primary transition-colors"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
