"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Loader2,
  Mail,
  Briefcase,
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

const UserManagementPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users");
      setUsers(res.data.data);
    } catch {
      setError("Gagal memuat data user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-1 sm:mb-2 leading-tight flex items-center gap-3">
            <Users size={28} className="text-primary flex-shrink-0" />
            <span>Manajemen User</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
            Kelola akses, role, dan akun staff dalam organisasi Anda.
          </p>
        </div>
        <button className="flex items-center gap-2 px-5 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm w-full sm:w-auto justify-center">
          <UserPlus size={18} />
          <span>Tambah User</span>
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
          <input
            type="text"
            placeholder="Cari user berdasarkan nama atau email..."
            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-primary/50 transition-all text-sm shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm flex-shrink-0">
          <Filter size={18} />
          <span className="hidden sm:inline">Filter</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-[24px] sm:rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 sm:py-32 flex flex-col items-center justify-center gap-4 text-slate-400">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="font-medium animate-pulse">Memuat data user...</p>
          </div>
        ) : error ? (
          <div className="py-24 sm:py-32 flex flex-col items-center justify-center gap-4 text-red-500">
            <ShieldAlert size={40} />
            <p className="font-bold">{error}</p>
            <button onClick={fetchUsers} className="text-sm font-bold underline">Coba Lagi</button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-24 sm:py-32 text-center text-slate-400 font-medium italic">
            Tidak ada user ditemukan.
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="text-left py-5 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">User Details</th>
                    <th className="text-left py-5 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">Role & Unit</th>
                    <th className="text-left py-5 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">Security</th>
                    <th className="text-left py-5 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">Status</th>
                    <th className="text-right py-5 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-base group-hover:text-primary transition-colors uppercase flex-shrink-0">
                            {u.fullName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white leading-tight mb-1 truncate">{u.fullName}</p>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Mail size={11} />
                              <span className="truncate">{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-primary/10 text-primary uppercase tracking-tight">{u.role.name}</span>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                            <Briefcase size={11} />
                            <span>{u.unit?.name || "Global / Kantor Pusat"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", u.twoFactorEnabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700")} />
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tighter">
                            2FA {u.twoFactorEnabled ? "On" : "Off"}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        {u.isActive ? (
                          <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/50">
                            <CheckCircle2 size={13} />
                            <span>Aktif</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                            <XCircle size={13} />
                            <span>Nonaktif</span>
                          </div>
                        )}
                      </td>
                      <td className="py-5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-2 hover:bg-primary/10 hover:text-primary text-slate-400 rounded-lg transition-all"><Edit2 size={17} /></button>
                          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-lg transition-all"><MoreVertical size={17} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map((u) => (
                <div key={u.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-base uppercase flex-shrink-0">
                      {u.fullName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{u.fullName}</p>
                        {u.isActive ? (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex-shrink-0">Aktif</span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border flex-shrink-0">Nonaktif</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-primary/10 text-primary uppercase">{u.role.name}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <div className={cn("w-1.5 h-1.5 rounded-full", u.twoFactorEnabled ? "bg-emerald-500" : "bg-slate-300")} />
                      2FA {u.twoFactorEnabled ? "On" : "Off"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserManagementPage;
