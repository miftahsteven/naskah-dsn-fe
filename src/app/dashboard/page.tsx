"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  FileCheck,
  Clock,
  AlertCircle,
  Plus,
  Search,
  ArrowUpRight,
  Files,
  UserCheck,
  Loader2,
  ShieldCheck,
  Fingerprint,
  Cpu,
  RefreshCw,
  Lock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ChevronRight
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import api from "@/lib/api";

const StatCard = ({ icon: Icon, label, value, trend, color, code }: any) => (
  <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm transition-all group overflow-hidden">
    <div className={`h-1.5 w-full ${color}`} />
    <div className="p-5">
      <div className="flex justify-between items-start mb-3">
        <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{code}</span>
        {trend && (
          <div className="flex items-center gap-1 text-[9px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/30 uppercase tracking-wider">
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
          <Icon size={20} />
        </div>
        <div className="space-y-0.5">
          <p className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">{label}</p>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-mono">{value}</h3>
        </div>
      </div>
    </div>
  </div>
);

const DashboardPage = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [statsData, setStatsData] = useState<any>(null);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [statsRes, docsRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/documents", { params: { limit: 5 } })
      ]);
      setStatsData(statsRes.data.data);
      setRecentDocs(docsRes.data.data || []);
    } catch (err: any) {
      // Don't use console.error to avoid Next.js dev overlay for 401s
      if (err?.response?.status !== 401) {
        console.log("Gagal memuat dashboard", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const stats = [
    {
      icon: Files,
      code: "METRIC-01 / ARCHIVE",
      label: "Total Dokumen",
      value: statsData?.totalDocs?.toString() || "0",
      trend: "Data Riil",
      color: "bg-slate-500"
    },
    {
      icon: Clock,
      code: "METRIC-02 / IN-FLOW",
      label: "Sedang Diproses",
      value: statsData?.inProgress?.toString() || "0",
      trend: "Proses Aktif",
      color: "bg-amber-500"
    },
    {
      icon: UserCheck,
      code: "METRIC-03 / ACTION-REQ",
      label: "Perlu Tanda Tangan",
      value: statsData?.needsAction?.toString() || "0",
      trend: statsData?.needsAction > 0 ? "MENDESAK" : "CLEAR",
      color: "bg-rose-550"
    },
    {
      icon: FileCheck,
      code: "METRIC-04 / CERTIFIED",
      label: "Selesai & Disegel",
      value: statsData?.signedDocs?.toString() || "0",
      trend: "TERSEGEL",
      color: "bg-emerald-600"
    },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      SIGNED: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
      PENDING_APPROVAL: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
      REVISION: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30",
      REJECTED: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30",
      DRAFT: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700",
    };
    return map[status] ?? "bg-slate-100 text-slate-700 border-slate-300";
  };

  return (
    <div className="space-y-6 sm:space-y-8 select-none">

      {/* ── HEADER BANNER: PLATFORM OTORITAS DOKUMEN (BUMN STYLE) ── */}
      <div className="relative overflow-hidden p-6 sm:p-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

        {/* Banner Details */}
        <div className="relative z-10 flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/20 font-mono">
              Certified E-Sign Otoritas
            </span>
            <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400 font-mono">
              <Cpu size={10} className="text-emerald-500 animate-pulse" /> Nodes: Sync
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
            Sistem Dokumen & Tanda Tangan Digital <span className="text-[#D4AF37]">
              {
                //user?.fullName || "Pimpinan"
              }
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-405 text-xs font-semibold max-w-xl">
            Selamat Datang di Portal Otoritas Amanah. Sesi penandatanganan elektronik tersertifikasi dilindungi oleh modul kriptografi perangkat keras (HSM).
          </p>
        </div>

        {/* Action Button & CA Status Pill */}
        <div className="relative z-10 flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg flex flex-col justify-center">
            <div className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">Status Otoritas CA</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">AKTIF / ROOT-MUI</span>
            </div>
          </div>
          {/* <Link href="/surat-keluar/new" className="flex items-center justify-center gap-2 px-5 py-3 bg-[#006633] hover:bg-[#00552b] text-white font-bold rounded-lg transition-all text-xs uppercase tracking-wider">
            <Plus size={16} /> Buat Surat Keluar
          </Link>
          <Link href="/surat-masuk/new" className="flex items-center justify-center gap-2 px-5 py-3 bg-[#006633] hover:bg-[#00552b] text-white font-bold rounded-lg transition-all text-xs uppercase tracking-wider">
            <Plus size={16} /> Input Surat Masuk
          </Link> */}
        </div>

      </div>

      {/* ── KPI METRICS GRID (SAP BUSINESS ONE STYLE) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* ── MAIN CONTENT GRID: TABULAR DATABASE & SECURITY PANEL ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-7">

        {/* Left Side: Recent Documents Table (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="text-[#D4AF37]" size={16} />
              <span>Arsip Dokumen Terbaru</span>
            </h2>
            <Link href="/surat-keluar" className="text-xs font-bold text-[#0B1325] dark:text-slate-300 flex items-center gap-1 hover:underline uppercase tracking-wider font-mono">
              Lihat Semua <ChevronRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-slate-400" size={28} />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Syncing Database...</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden sm:block bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-3 px-5 text-[9px] uppercase tracking-widest text-slate-450 dark:text-slate-500 font-extrabold">Judul Dokumen</th>
                        <th className="py-3 px-5 text-[9px] uppercase tracking-widest text-slate-450 dark:text-slate-500 font-extrabold">Nomor Seri</th>
                        <th className="py-3 px-5 text-[9px] uppercase tracking-widest text-slate-450 dark:text-slate-500 font-extrabold">Sertifikasi & Kripto</th>
                        <th className="py-3 px-5 text-[9px] uppercase tracking-widest text-slate-450 dark:text-slate-500 font-extrabold">Status</th>
                        <th className="py-3 px-5 text-right text-[9px] uppercase tracking-widest text-slate-450 dark:text-slate-500 font-extrabold">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                      {recentDocs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest font-mono">
                            Belum ada dokumen yang terdaftar
                          </td>
                        </tr>
                      ) : (
                        recentDocs.map((doc) => (
                          <tr
                            key={doc.id}
                            onClick={() => router.push(doc.documentType === 'INCOMING' ? `/surat-masuk/${doc.id}` : `/surat-keluar/${doc.id}`)}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/20 transition-all cursor-pointer group"
                          >
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-2">
                                <FileText size={14} className="text-slate-400 shrink-0" />
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#D4AF37] transition-colors truncate max-w-[180px]">{doc.title}</p>
                              </div>
                            </td>
                            <td className="py-3.5 px-5">
                              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200/40 dark:border-slate-700/40">
                                {doc.documentNumber || "UNREGISTERED"}
                              </span>
                            </td>
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-450 font-mono">
                                <ShieldCheck size={12} className={doc.status === 'SIGNED' ? 'text-emerald-500' : 'text-slate-455'} />
                                <span>{doc.status === 'SIGNED' ? 'SHA-256 / E-Sign' : 'SHA-256 / Hash Only'}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-5">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${statusBadge(doc.status)}`}>
                                {doc.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold font-mono">
                                {new Date(doc.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}
                              </p>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="sm:hidden space-y-3">
                {recentDocs.map((doc) => (
                  <Link key={doc.id} href={doc.documentType === 'INCOMING' ? `/surat-masuk/${doc.id}` : `/surat-keluar/${doc.id}`} className="block bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-sm active:scale-98 transition-all">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">{doc.title}</p>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border flex-shrink-0 ${statusBadge(doc.status)}`}>
                        {doc.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2 mt-2">
                      <span className="text-[9px] font-mono text-slate-450 bg-slate-50 px-1.5 py-0.5 rounded border">{doc.documentNumber || "UNREGISTERED"}</span>
                      <p className="text-[9px] text-slate-400 font-mono">{new Date(doc.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right Side: Security Modules & Widgets (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">

          {/* ── WIDGET 1: SERTIFIKAT ELEKTRONIK SAYA (ADMIN CERT CARD) ── */}
          <div className="space-y-3">
            <h2 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider px-1">Sertifikat Elektronik</h2>
            <div className="bg-[#0B1325] text-white rounded-lg border border-slate-800 p-5 relative overflow-hidden shadow-md">

              {/* Card Holographic BG Grid */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px] opacity-20 pointer-events-none" />
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/10 rounded-full blur-xl pointer-events-none" />

              {/* Card Header */}
              <div className="flex justify-between items-start border-b border-slate-800 pb-3 mb-4 relative z-10">
                <div className="flex items-center gap-1.5">
                  <Fingerprint size={16} className="text-[#D4AF37]" />
                  <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">Amanah CA / Otoritas</span>
                </div>
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 rounded text-[8px] font-bold text-emerald-400 font-mono">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> HSM
                </div>
              </div>

              {/* Card Body */}
              <div className="space-y-3 relative z-10">
                <div>
                  <span className="text-[8px] text-slate-500 uppercase tracking-widest font-semibold block">Pemegang Sertifikat</span>
                  <span className="text-xs font-bold text-white tracking-wide block">{user?.fullName || "SUPER ADMIN MUI"}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[8px] text-slate-500 uppercase tracking-widest font-semibold block">ID Kredensial</span>
                    <span className="text-[10px] font-mono font-bold text-slate-350 block">MUI-ADM-009A1</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 uppercase tracking-widest font-semibold block">Algoritma</span>
                    <span className="text-[10px] font-mono font-bold text-slate-350 block">RSA-2048 / SHA256</span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-500 font-medium">
                  <div className="flex items-center gap-1">
                    <Calendar size={10} className="text-[#D4AF37]" />
                    <span>Hingga 31 Des 2027</span>
                  </div>
                  <span className="text-emerald-400 flex items-center gap-0.5 font-bold"><CheckCircle2 size={10} /> Valid</span>
                </div>
              </div>

            </div>
          </div>

          {/* ── WIDGET 2: VERIFIKATOR KRIPTOGRAFI DOKUMEN ── */}
          <div className="space-y-3">
            <h2 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider px-1">Verifikasi Validitas</h2>
            <div className="p-4 sm:p-5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-4 hover:border-[#D4AF37]/45 transition-all cursor-pointer group">
              <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
                <Search size={18} />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">Pindai QR / Cek Hash</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">Validasi keaslian dokumen tanda tangan menggunakan nomor seri atau kode enkripsi.</p>
              </div>
            </div>
          </div>

          {/* ── WIDGET 3: STATUS NODE KRIPTO SYSTEM ── */}
          <div className="space-y-3">
            <h2 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider px-1">IT Cryptography Status</h2>
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-3 font-mono">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-500 uppercase">Timestamp Authority (TSA)</span>
                <span className="text-emerald-600 font-bold">ONLINE</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-500 uppercase">OCSP Validator API</span>
                <span className="text-emerald-600 font-bold">ONLINE</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-500 uppercase">CRL Certificate Sync</span>
                <span className="text-slate-400 font-bold">LATEST (2m ago)</span>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-[9px] text-amber-600 font-semibold">
                <AlertTriangle size={11} className="shrink-0" />
                <span>SSL certificate expires in 45 days.</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default DashboardPage;
