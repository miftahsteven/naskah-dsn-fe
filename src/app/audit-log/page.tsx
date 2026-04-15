"use client";

import React, { useState, useEffect } from "react";
import { 
  Activity, 
  Search, 
  Filter, 
  ArrowUpRight, 
  Clock, 
  User as UserIcon, 
  FileText, 
  ShieldCheck, 
  LogIn, 
  Loader2, 
  AlertCircle,
  Calendar
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

const AuditLogPage = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/audit", {
        params: { search }
      });
      setLogs(res.data.data);
    } catch (err: any) {
      setError("Gagal memuat catatan aktivitas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionIcon = (action: string) => {
    if (action.includes("LOGIN")) return <LogIn size={16} className="text-emerald-500" />;
    if (action.includes("DOCUMENT") || action.includes("UPLOAD")) return <FileText size={16} className="text-primary" />;
    if (action.includes("WORKFLOW") || action.includes("APPROVE")) return <ShieldCheck size={16} className="text-amber-500" />;
    if (action.includes("USER")) return <UserIcon size={16} className="text-blue-500" />;
    return <Activity size={16} className="text-slate-400" />;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 leading-tight flex items-center gap-3">
            <Activity size={32} className="text-primary" />
            <span>Audit Log & Aktivitas</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Rekam jejak digital seluruh tindakan yang dilakukan oleh pengguna dalam sistem.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Cari aktivitas atau pengguna..." 
            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-primary/50 transition-all text-sm shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
          <Calendar size={18} />
          <span>Rentang Waktu</span>
        </button>
      </div>

      {/* Log Feed Container */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-4 text-slate-400">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="font-medium animate-pulse">Memuat log sistem...</p>
          </div>
        ) : error ? (
          <div className="py-32 flex flex-col items-center justify-center gap-4 text-red-500">
            <AlertCircle size={40} />
            <p className="font-bold">{error}</p>
            <button onClick={fetchLogs} className="text-sm font-bold underline">Coba Lagi</button>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-32 text-center text-slate-400 font-medium italic">Belum ada aktivitas yang tercatat.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left py-5 px-8 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">Waktu</th>
                  <th className="text-left py-5 px-8 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">Pengguna</th>
                  <th className="text-left py-5 px-8 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">Aksi</th>
                  <th className="text-left py-5 px-8 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">Detail Resource</th>
                  <th className="text-right py-5 px-8 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">Info IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                    <td className="py-5 px-8 whitespace-nowrap">
                       <div className="flex flex-col">
                          <p className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">{new Date(log.createdAt).toLocaleDateString()}</p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                             <Clock size={10} />
                             {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                       </div>
                    </td>
                    <td className="py-5 px-8">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs">
                             {log.user.fullName.charAt(0)}
                          </div>
                          <div>
                             <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{log.user.fullName}</p>
                             <p className="text-[10px] text-slate-400">{log.user.email}</p>
                          </div>
                       </div>
                    </td>
                    <td className="py-5 px-8">
                       <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                             {getActionIcon(log.action)}
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">{log.action}</span>
                       </div>
                    </td>
                    <td className="py-5 px-8">
                       <div className="flex flex-col">
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{log.resource}</p>
                          <p className="text-[10px] font-mono text-slate-400 uppercase">{log.resourceId || "-"}</p>
                       </div>
                    </td>
                    <td className="py-5 px-8 text-right">
                       <div className="flex flex-col items-end">
                          <p className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter">{log.ip || "127.0.0.1"}</p>
                          <p className="text-[9px] text-slate-300 max-w-[120px] truncate">{log.userAgent || "Unknown Browser"}</p>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogPage;
