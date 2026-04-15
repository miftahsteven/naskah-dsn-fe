"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Search,
  Calendar,
  Clock,
  User as UserIcon,
  FileText,
  ShieldCheck,
  LogIn,
  Loader2,
  AlertCircle,
} from "lucide-react";
import api from "@/lib/api";

const getActionIcon = (action: string) => {
  if (action.includes("LOGIN")) return <LogIn size={15} className="text-emerald-500" />;
  if (action.includes("DOCUMENT") || action.includes("UPLOAD")) return <FileText size={15} className="text-primary" />;
  if (action.includes("WORKFLOW") || action.includes("APPROVE")) return <ShieldCheck size={15} className="text-amber-500" />;
  if (action.includes("USER")) return <UserIcon size={15} className="text-blue-500" />;
  return <Activity size={15} className="text-slate-400" />;
};

const AuditLogPage = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/audit", { params: { search } });
      setLogs(res.data.data);
    } catch {
      setError("Gagal memuat catatan aktivitas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-1 sm:mb-2 leading-tight flex items-center gap-3">
            <Activity size={28} className="text-primary flex-shrink-0" />
            <span>Audit Log & Aktivitas</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
            Rekam jejak digital seluruh tindakan yang dilakukan oleh pengguna dalam sistem.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
          <input
            type="text"
            placeholder="Cari aktivitas atau pengguna..."
            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-primary/50 transition-all text-sm shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchLogs()}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm flex-shrink-0">
          <Calendar size={18} />
          <span className="hidden sm:inline">Rentang Waktu</span>
        </button>
      </div>

      {/* Log Feed Container */}
      <div className="bg-white dark:bg-slate-900 rounded-[24px] sm:rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 sm:py-32 flex flex-col items-center justify-center gap-4 text-slate-400">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="font-medium animate-pulse">Memuat log sistem...</p>
          </div>
        ) : error ? (
          <div className="py-24 sm:py-32 flex flex-col items-center justify-center gap-4 text-red-500">
            <AlertCircle size={40} />
            <p className="font-bold">{error}</p>
            <button onClick={fetchLogs} className="text-sm font-bold underline">Coba Lagi</button>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-24 sm:py-32 text-center text-slate-400 font-medium italic">
            Belum ada aktivitas yang tercatat.
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="text-left py-5 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">Waktu</th>
                    <th className="text-left py-5 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">Pengguna</th>
                    <th className="text-left py-5 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">Aksi</th>
                    <th className="text-left py-5 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">Detail Resource</th>
                    <th className="text-right py-5 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">Info IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                      <td className="py-5 px-6 whitespace-nowrap">
                        <div className="flex flex-col">
                          <p className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs flex-shrink-0">
                            {log.user.fullName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{log.user.fullName}</p>
                            <p className="text-[10px] text-slate-400 truncate">{log.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 flex-shrink-0">
                            {getActionIcon(log.action)}
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">{log.action}</span>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{log.resource}</p>
                        <p className="text-[10px] font-mono text-slate-400 uppercase">{log.resourceId || "—"}</p>
                      </td>
                      <td className="py-5 px-6 text-right">
                        <p className="text-[10px] font-bold text-slate-400 font-mono">{log.ip || "127.0.0.1"}</p>
                        <p className="text-[9px] text-slate-300 max-w-[130px] truncate ml-auto">{log.userAgent || "Unknown"}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Card Feed */}
            <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map((log) => (
                <div key={log.id} className="p-4 sm:p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                  <div className="flex items-start gap-3">
                    {/* Action Icon */}
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 flex-shrink-0 mt-0.5">
                      {getActionIcon(log.action)}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Action + Time */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-tight">{log.action}</p>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[10px] font-bold text-slate-500">{new Date(log.createdAt).toLocaleDateString()}</p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-0.5 justify-end">
                            <Clock size={9} />
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>

                      {/* User */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 flex-shrink-0">
                          {log.user.fullName.charAt(0)}
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium truncate">{log.user.fullName}</p>
                      </div>

                      {/* Resource + IP */}
                      {log.resource && (
                        <p className="text-[10px] text-slate-400 truncate">{log.resource} {log.resourceId ? `· ${log.resourceId}` : ""}</p>
                      )}
                    </div>
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

export default AuditLogPage;
