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
  UserCheck
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";

const StatCard = ({ icon: Icon, label, value, trend, color }: any) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
    <div className="flex justify-between items-start mb-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} text-white shadow-lg`}>
        <Icon size={24} />
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
      <h3 className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">{value}</h3>
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

  return (
    <div className="space-y-10">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative p-8 rounded-[32px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 leading-tight">
            Selamat Datang, <span className="text-gradient">{user?.fullName || "Pimpinan"}</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-lg">
            Berikut adalah ringkasan dokumen dan aktivitas terbaru di MUI Naskah Digital hari ini.
          </p>
        </div>
        <div className="flex gap-3 relative z-10">
          <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
            <Plus size={20} />
            <span>Dokumen Baru</span>
          </button>
        </div>
        {/* Abstract background for header */}
        <div className="absolute right-0 top-0 w-1/3 h-full bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Documents */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <FileText className="text-primary" />
              <span>Dokumen Terbaru</span>
            </h2>
            <button className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
              Lihat Semua
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
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
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tight shadow-sm ${
                          doc.status === 'SIGNED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                          doc.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                          'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
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
        </div>

        {/* Quick Actions / Notices */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white px-2">Aktivitas Cepat</h2>
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-primary/5 border border-primary/10 flex items-start gap-4 hover:bg-primary/10 transition-all cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                <Search size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Verifikasi Dokumen</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Pindai kode QR atau masukkan nomor unik verifikasi.</p>
              </div>
            </div>
            
            <div className="p-5 rounded-3xl animate-pulse bg-accent/5 border border-accent/10 flex items-start gap-4 hover:bg-accent/10 transition-all cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-accent shadow-sm group-hover:scale-110 transition-transform">
                <AlertCircle size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Pemberitahuan Sistem</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Sertifikat enkripsi kunci penandatangan akan segera kedaluwarsa.</p>
              </div>
            </div>
          </div>

          {/* Mini Calendar/Schedule info placeholder or similar */}
          <div className="p-8 rounded-3xl gradient-primary text-white shadow-xl shadow-primary/20 space-y-4">
             <h4 className="font-bold flex items-center gap-2">
               <FileText size={18} />
               Panduan Cepat
             </h4>
             <p className="text-xs text-white/80 leading-relaxed">
               Gunakan fitur "Draft" untuk menyimpan progres dokumen Anda sebelum dikirim untuk proses tanda tangan digital.
             </p>
             <button className="text-[10px] font-bold uppercase tracking-widest bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-all">Pelajari</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
