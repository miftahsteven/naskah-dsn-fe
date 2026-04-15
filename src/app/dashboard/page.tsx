"use client";

import React from "react";
import {
  FileText,
  FileCheck,
  Clock,
  AlertCircle,
  Plus,
  Search,
  ArrowUpRight,
  TrendingUp,
  Files,
  UserCheck,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";

const StatCard = ({ icon: Icon, label, value, trend, color }: any) => (
  <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
    <div className="flex justify-between items-start mb-4">
      <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${color} text-white shadow-lg`}>
        <Icon size={22} />
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-full uppercase tracking-tight">
          <TrendingUp size={12} />
          <span>{trend}</span>
        </div>
      )}
    </div>
    <div className="space-y-1">
      <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">{label}</p>
      <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tabular-nums">{value}</h3>
    </div>
  </div>
);

const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);

  const stats = [
    { icon: Files, label: "Total Dokumen", value: "254", trend: "+12%", color: "bg-primary" },
    { icon: Clock, label: "Menunggu Approval", value: "18", trend: "7 Baru", color: "bg-amber-500" },
    { icon: UserCheck, label: "Perlu Tanda Tangan", value: "5", trend: "Mendesak", color: "bg-accent" },
    { icon: FileCheck, label: "Selesai", value: "231", trend: "95%", color: "bg-emerald-600" },
  ];

  const recentDocuments = [
    { title: "Fatwa tentang Wakaf Tunai", number: "001/DSN-MUI/IV/2026", status: "SIGNED", date: "2 jam yang lalu" },
    { title: "Surat Keputusan Pengurus", number: "SK/042/ORG/2026", status: "PENDING", date: "5 jam yang lalu" },
    { title: "Nota Dinas Internal", number: "ND/11/SEK/2026", status: "DRAFT", date: "Kemarin" },
    { title: "MoU Kerjasama Bank Syariah", number: "MOU/005/EXT/2026", status: "PENDING", date: "Kemarin" },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      SIGNED: "bg-emerald-50 text-emerald-600 border-emerald-100",
      PENDING: "bg-amber-50 text-amber-600 border-amber-100",
      DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
    };
    return map[status] ?? "bg-slate-100 text-slate-600 border-slate-200";
  };

  return (
    <div className="space-y-6 sm:space-y-10">
      {/* Welcome Header */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-[28px] sm:rounded-[32px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2 leading-tight">
              Selamat Datang,{" "}
              <span className="text-gradient">{user?.fullName || "Pimpinan"}</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm sm:text-base max-w-lg">
              Berikut adalah ringkasan dokumen dan aktivitas terbaru di MUI Naskah Digital hari ini.
            </p>
          </div>
          <div className="relative z-10">
            <button className="flex items-center gap-2 px-5 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm">
              <Plus size={18} />
              <span>Dokumen Baru</span>
            </button>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-1/3 h-full bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Recent Documents */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 sm:gap-3">
              <FileText className="text-primary" size={20} />
              <span>Dokumen Terbaru</span>
            </h2>
            <button className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
              Lihat Semua
              <ArrowUpRight size={14} />
            </button>
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block bg-white dark:bg-slate-900 rounded-[24px] sm:rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="text-left py-4 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">Judul Dokumen</th>
                    <th className="text-left py-4 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">Nomor</th>
                    <th className="text-left py-4 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">Status</th>
                    <th className="text-right py-4 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {recentDocuments.map((doc, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer group">
                      <td className="py-4 px-6">
                        <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{doc.title}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400">{doc.number}</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tight shadow-sm border ${statusBadge(doc.status)}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <p className="text-xs text-slate-400 font-medium">{doc.date}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List */}
          <div className="sm:hidden space-y-3">
            {recentDocuments.map((doc, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{doc.title}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${statusBadge(doc.status)}`}>
                    {doc.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-mono text-slate-400">{doc.number}</p>
                  <p className="text-[11px] text-slate-400">{doc.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4 sm:space-y-6">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white px-1">Aktivitas Cepat</h2>
          <div className="space-y-4">
            <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-primary/5 border border-primary/10 flex items-start gap-4 hover:bg-primary/10 transition-all cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                <Search size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Verifikasi Dokumen</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Pindai kode QR atau masukkan nomor unik verifikasi.</p>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl animate-pulse bg-accent/5 border border-accent/10 flex items-start gap-4 hover:bg-accent/10 transition-all cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-accent shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Pemberitahuan Sistem</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Sertifikat enkripsi kunci penandatangan akan segera kedaluwarsa.</p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl gradient-primary text-white shadow-xl shadow-primary/20 space-y-4">
            <h4 className="font-bold flex items-center gap-2 text-sm sm:text-base">
              <FileText size={18} />
              Panduan Cepat
            </h4>
            <p className="text-xs text-white/80 leading-relaxed">
              Gunakan fitur &ldquo;Draft&rdquo; untuk menyimpan progres dokumen Anda sebelum dikirim untuk proses tanda tangan digital.
            </p>
            <button className="text-[10px] font-bold uppercase tracking-widest bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-all">
              Pelajari
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
