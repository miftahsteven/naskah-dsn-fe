"use client";

import React from "react";
import { Bell, Search, Menu, User as UserIcon, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";

const Topbar = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <header className="h-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 sticky top-0 z-10">
      {/* Mobile Toggle */}
      <button className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
        <Menu size={20} />
      </button>

      {/* Search */}
      <div className="hidden md:flex items-center gap-3 bg-slate-100 dark:bg-slate-800/50 px-4 py-2.5 rounded-xl w-96 border border-transparent focus-within:border-primary/30 transition-all">
        <Search size={18} className="text-slate-400" />
        <input 
          type="text" 
          placeholder="Cari dokumen, nomor, atau staff..." 
          className="bg-transparent border-none outline-none text-sm w-full text-slate-700 dark:text-slate-200"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6">
        {/* Notifications */}
        <button className="relative p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all group">
          <Bell size={20} className="text-slate-600 dark:text-slate-400 group-hover:rotate-12 transition-transform" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-950"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-6 border-l border-slate-200 dark:border-slate-800">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">
              {user?.fullName || "Guest"}
            </p>
            <p className="text-[10px] font-bold text-primary dark:text-primary uppercase tracking-tight">
              {user?.role || "Visitor"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden group hover:border-primary/50 transition-all cursor-pointer">
            <UserIcon size={20} className="text-slate-400 group-hover:text-primary transition-colors" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
