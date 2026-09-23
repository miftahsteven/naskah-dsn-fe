"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  FileText,
  Calendar,
  Building2,
  Clock,
  Award,
  Copy,
  Check,
  Printer,
  ChevronDown,
  ChevronUp,
  Lock,
  BadgeCheck,
  Share2,
  FileCheck,
} from "lucide-react";
import { getApiUrl } from "@/lib/api";
import { getAssetUrl } from "@/lib/utils";

interface VerificationData {
  id: string;
  title: string;
  documentNumber: string | null;
  category: string;
  classification: string;
  organization: string;
  status: string;
  createdAt: string;
  creator: string;
  signatures: {
    userId: string;
    fullName: string;
    email: string;
    jobTitle: string;
    signedAt: string;
  }[];
  workflowSteps: {
    fullName: string;
    jobTitle: string;
    status: string;
    actionedAt: string | null;
  }[];
}

const DocumentVerificationPage = () => {
  const params = useParams();
  const docId = params.id as string;
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);

  const API_BASE = getApiUrl();

  useEffect(() => {
    if (!docId) return;

    fetch(`${API_BASE}/documents/${docId}/verify`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Dokumen tidak ditemukan atau terjadi kesalahan server.");
        }
        return res.json();
      })
      .then((resJson) => {
        if (resJson.status === "success" && resJson.data) {
          setData(resJson.data);
        } else {
          setError("Gagal memuat data verifikasi.");
        }
      })
      .catch((err) => {
        setError(err.message || "Gagal memverifikasi dokumen.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [docId, API_BASE]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // Helper to format role title according to DSN-MUI official appointments
  const getOfficialRole = (fullName: string, jobTitle: string) => {
    const lower = (fullName || "").toLowerCase();
    if (lower.includes("cholil") || lower.includes("nafis")) {
      return "Ketua Badan Pengurus DSN-MUI";
    }
    if (lower.includes("amirsyah") || lower.includes("tambunan")) {
      return "Sekretaris Badan Pengurus DSN-MUI";
    }
    if (lower.includes("adiwarman")) {
      return "Wakil Ketua Badan Pengurus DSN-MUI";
    }
    if (lower.includes("hasanuddin")) {
      return "Wakil Ketua Badan Pengurus DSN-MUI";
    }
    if (lower.includes("anwar abbas") || lower.includes("asrori")) {
      return "Wakil Sekretaris Badan Pengurus DSN-MUI";
    }
    if (jobTitle && jobTitle !== "Pejabat" && jobTitle !== "PENANDATANGAN") {
      return jobTitle;
    }
    return "Pejabat Penandatangan DSN-MUI";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FBFBF8] dark:bg-[#0B140E] p-6 text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#132219] p-2 shadow-lg border border-[#006633]/20 flex items-center justify-center">
            <img
              src={getAssetUrl("/images/logo-dsn.png")}
              alt="Logo DSN-MUI"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="absolute -inset-2 border-2 border-[#006633] border-t-transparent rounded-3xl animate-spin" />
        </div>
        <h2 className="text-base font-bold text-slate-850 dark:text-slate-200">
          Memverifikasi Keaslian Dokumen...
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
          Menghubungkan ke sistem otentikasi Tanda Tangan Elektronik Dewan Syariah Nasional MUI
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FBFBF8] dark:bg-[#0B140E] p-6">
        <div className="w-full max-w-md bg-white dark:bg-[#132219] border border-red-200/80 dark:border-red-900/50 rounded-3xl p-8 text-center shadow-xl shadow-red-500/5 relative overflow-hidden">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-200 dark:border-red-800">
            <XCircle size={36} />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-[10px] font-bold tracking-widest uppercase mb-3 border border-red-200/60 dark:border-red-900/60">
            Verifikasi Tidak Valid
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">
            Dokumen Tidak Ditemukan
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-6">
            {error || "Dokumen ini tidak terdaftar dalam pangkalan data resmi sertifikasi digital Dewan Syariah Nasional MUI atau berkas telah mengalami perubahan."}
          </p>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <ShieldCheck size={14} className="text-[#006633]" />
            DSN-MUI Amanah Digital Trust
          </div>
        </div>
      </div>
    );
  }

  const isValid = data.status === "SIGNED";

  return (
    <div className="min-h-screen bg-[#FBFBF8] dark:bg-[#0B140E] text-slate-800 dark:text-slate-100 flex flex-col items-center py-6 sm:py-8 px-4 sm:px-6 relative selection:bg-[#006633]/20 selection:text-[#006633]">
      
      {/* Background Subtle Gradient & Geometry Accent */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden print:hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-[#006633]/8 via-[#D4AF37]/5 to-transparent blur-3xl opacity-70" />
      </div>

      {/* ── MAIN VERIFICATION CARD ── */}
      <main className="relative z-10 w-full max-w-2xl bg-white dark:bg-[#111C15] border border-slate-200/90 dark:border-emerald-950/60 rounded-3xl shadow-2xl shadow-[#006633]/5 overflow-hidden">
        
        {/* Top Gold-Green Brand Ribbon Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#006633] via-[#D4AF37] to-[#006633]" />

        {/* Decorative Watermark Seal Stamp (Subtle & Authentic) */}
        <div className="absolute top-20 right-4 pointer-events-none select-none opacity-[0.045] dark:opacity-[0.06] transform rotate-12 scale-125">
          <img
            src={getAssetUrl("/images/stempel-dsn.png")}
            alt="Stempel Resmi DSN-MUI"
            className="w-72 h-72 object-contain"
          />
        </div>

        {/* ── STATUS HERO SECTION ── */}
        <div
          className={`p-6 sm:p-8 text-center border-b relative ${
            isValid
              ? "bg-gradient-to-b from-[#006633]/6 via-transparent to-transparent border-emerald-100 dark:border-emerald-900/30"
              : "bg-gradient-to-b from-amber-500/6 via-transparent to-transparent border-amber-100 dark:border-amber-900/30"
          }`}
        >
          {/* Status Badge Emblem with DSN-MUI Logo & Checked Ornament */}
          <div className="flex justify-center mb-6">
            {isValid ? (
              <div className="relative inline-flex flex-col items-center">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white dark:bg-[#132219] p-3 shadow-xl shadow-[#006633]/15 border-2 border-[#006633]/20 flex items-center justify-center ring-4 ring-emerald-500/10">
                  <img
                    src={getAssetUrl("/images/logo-dsn.png")}
                    alt="Dewan Syariah Nasional MUI"
                    className="w-full h-full object-contain"
                  />
                </div>
                {/* Checklist "Checked" ornament */}
                <div className="absolute -bottom-2.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#006633] to-[#004d26] text-white flex items-center gap-1.5 shadow-md border-2 border-white dark:border-[#111C15]">
                  <div className="w-4 h-4 rounded-full bg-[#D4AF37] text-white flex items-center justify-center shadow-xs">
                    <Check size={11} strokeWidth={3.5} />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-wider">Checked</span>
                </div>
              </div>
            ) : (
              <div className="relative inline-flex flex-col items-center">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white dark:bg-[#132219] p-3 shadow-xl shadow-amber-500/15 border-2 border-amber-500/30 flex items-center justify-center ring-4 ring-amber-500/10">
                  <img
                    src={getAssetUrl("/images/logo-dsn.png")}
                    alt="Dewan Syariah Nasional MUI"
                    className="w-full h-full object-contain grayscale opacity-60"
                  />
                </div>
                <div className="absolute -bottom-2.5 px-3 py-1 rounded-full bg-amber-600 text-white flex items-center gap-1.5 shadow-md border-2 border-white dark:border-[#111C15]">
                  <XCircle size={13} strokeWidth={2.5} />
                  <span className="text-[11px] font-black uppercase tracking-wider">Unverified</span>
                </div>
              </div>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isValid ? "Dokumen Sah & Terverifikasi" : "Dokumen Belum Ditandatangani Penuh"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-350 max-w-lg mx-auto font-normal mt-1.5 leading-relaxed">
            {isValid
              ? "Tanda Tangan Elektronik (TTE) pada surat ini telah tersertifikasi secara digital dan terdaftar resmi di pangkalan data Dewan Syariah Nasional - Majelis Ulama Indonesia."
              : "Dokumen ini terdaftar dalam sistem namun masih dalam alur persetujuan internal atau revisi."}
          </p>

          {/* Quick Meta Indicators */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-[#006633] dark:text-emerald-300">
              <BadgeCheck size={14} className="text-[#006633] dark:text-emerald-400" />
              STATUS: {data.status}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 dark:bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[11px] font-bold text-[#997A1E] dark:text-[#E5C365]">
              <Lock size={12} />
              TTE Terenkripsi Amanah
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-350">
              <Clock size={12} />
              {new Date().toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* ── DOCUMENT DETAILS SECTION ── */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Section Title */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <FileCheck size={18} className="text-[#006633] dark:text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Informasi Dokumen Resmi
              </h3>
            </div>
            <span className="text-[10px] font-semibold text-[#D4AF37] dark:text-[#E5C365] bg-[#D4AF37]/10 px-2 py-0.5 rounded-md border border-[#D4AF37]/20">
              Otentikasi Sistem
            </span>
          </div>

          {/* Grid Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Nomor Surat Card */}
            <div className="p-4 rounded-2xl bg-[#FBFBF8] dark:bg-[#132219]/60 border border-slate-200/80 dark:border-slate-800 space-y-1 md:col-span-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Award size={13} className="text-[#006633]" /> Nomor Dokumen / Surat
              </span>
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-sm sm:text-base font-extrabold text-[#006633] dark:text-emerald-400 tracking-tight break-all">
                  {data.documentNumber || "— (Nomor belum diterbitkan)"}
                </p>
                {data.documentNumber && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(data.documentNumber || "");
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    title="Salin Nomor Surat"
                    className="p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0 print:hidden"
                  >
                    {copied ? <Check size={14} className="text-[#006633]" /> : <Copy size={14} />}
                  </button>
                )}
              </div>
            </div>

            {/* Judul Dokumen */}
            <div className="p-4 rounded-2xl bg-[#FBFBF8] dark:bg-[#132219]/60 border border-slate-200/80 dark:border-slate-800 space-y-1 md:col-span-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={13} /> Perihal / Judul Naskah
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                {data.title}
              </p>
            </div>

            {/* Instansi Penerbit */}
            <div className="p-4 rounded-2xl bg-[#FBFBF8] dark:bg-[#132219]/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Building2 size={13} /> Instansi Penerbit
              </span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {data.organization}
              </p>
            </div>

            {/* Klasifikasi & Kategori */}
            <div className="p-4 rounded-2xl bg-[#FBFBF8] dark:bg-[#132219]/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Award size={13} /> Klasifikasi & Kategori
              </span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {data.classification} • {data.category}
              </p>
            </div>

            {/* Tanggal Terbit */}
            <div className="p-4 rounded-2xl bg-[#FBFBF8] dark:bg-[#132219]/60 border border-slate-200/80 dark:border-slate-800 space-y-1 md:col-span-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={13} /> Tanggal Dibuat / Diterbitkan
              </span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {new Date(data.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                WIB
              </p>
            </div>
          </div>

          {/* ── SIGNATORIES SECTION ── */}
          <div className="space-y-3 pt-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#006633] dark:text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Penandatangan Resmi (TTE)
                </h3>
              </div>
              <span className="text-[10px] font-bold text-[#006633] dark:text-emerald-400 bg-[#006633]/10 px-2 py-0.5 rounded-md">
                {data.signatures.length} Pejabat Berwenang
              </span>
            </div>

            {data.signatures.length > 0 ? (
              <div className="space-y-3">
                {data.signatures.map((sig, idx) => {
                  const roleName = getOfficialRole(sig.fullName, sig.jobTitle);
                  return (
                    <div
                      key={sig.userId || idx}
                      className="p-4 sm:p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#132219] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:border-[#006633]/40 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-[#006633] dark:text-emerald-400 border border-[#006633]/20 flex items-center justify-center shrink-0">
                          <ShieldCheck size={24} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                            {sig.fullName}
                          </p>
                          <p className="text-[11px] font-semibold text-[#006633] dark:text-emerald-400 uppercase tracking-wide truncate">
                            {roleName}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {sig.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800/80 shrink-0">
                        <div className="inline-flex items-center gap-1 text-[10px] text-[#006633] dark:text-emerald-300 font-bold bg-[#006633]/10 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-[#006633]/20">
                          <CheckCircle2 size={12} />
                          Ditandatangani
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium sm:mt-1">
                          {new Date(sig.signedAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          WIB
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs font-medium">
                Belum ada penandatanganan digital yang tercatat untuk dokumen ini.
              </div>
            )}
          </div>

          {/* ── AUDIT TRAIL DISCLOSURE (ALUR PERSETUJUAN & PARAF) ── */}
          {data.workflowSteps && data.workflowSteps.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAuditTrail(!showAuditTrail)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-between transition-colors print:hidden"
              >
                <span className="flex items-center gap-2">
                  <Clock size={14} className="text-slate-400" />
                  Riwayat Alur Persetujuan & Paraf ({data.workflowSteps.length} Tahapan)
                </span>
                {showAuditTrail ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showAuditTrail && (
                <div className="mt-3 p-4 rounded-2xl bg-[#FBFBF8] dark:bg-[#132219]/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                  {data.workflowSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800 last:border-b-0 last:pb-0"
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                          step.status === "APPROVED" || step.status === "SIGNED"
                            ? "bg-emerald-100 text-[#006633] dark:bg-emerald-950/60 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {step.fullName}
                          </p>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              step.status === "APPROVED" || step.status === "SIGNED"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {step.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">{step.jobTitle}</p>
                        {step.actionedAt && (
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            {new Date(step.actionedAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            WIB
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ACTION BUTTONS ── */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 print:hidden">
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              {copied ? <Check size={14} className="text-[#006633]" /> : <Share2 size={14} />}
              {copied ? "Tautan Berhasil Disalin!" : "Bagikan Tautan Verifikasi"}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-[#006633] hover:bg-[#005229] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-[#006633]/20"
            >
              <Printer size={14} />
              Cetak Bukti Verifikasi
            </button>
          </div>

          {/* ── OFFICIAL LEGAL DISCLAIMER ── */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
            <p className="font-semibold text-[#006633] dark:text-emerald-400 mb-1 flex items-center gap-1.5">
              <ShieldCheck size={14} />
              Pernyataan Keabsahan Dokumen Elektronik
            </p>
            Informasi di atas merupakan catatan resmi yang bersumber langsung dari sistem informasi persuratan Dewan Syariah Nasional - Majelis Ulama Indonesia. Sesuai dengan UU ITE dan regulasi persuratan DSN-MUI, tanda tangan elektronik yang tertera pada dokumen ini memiliki kekuatan hukum yang sah dan mengikat.
          </div>
        </div>

        {/* ── CARD FOOTER ── */}
        <div className="px-6 sm:px-8 py-3.5 bg-[#F8F9F5] dark:bg-[#0E1712] border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center text-[10px] font-bold tracking-wider">
          <span className="text-[#006633] dark:text-emerald-400">
            AMANAH • DSN-MUI DIGITAL TRUST
          </span>
        </div>
      </main>

      {/* ── INSTITUTIONAL PAGE FOOTER ── */}
      <footer className="relative z-10 mt-8 text-center text-[11px] text-slate-400 dark:text-slate-500 max-w-lg space-y-1">
        <p className="font-semibold text-slate-600 dark:text-slate-400">
          Dewan Syariah Nasional – Majelis Ulama Indonesia (DSN-MUI)
        </p>
        <p>Jl. Dempo No.19,  Pegangsaan, Kec. Menteng, Kota Jakarta Pusat, Daerah Khusus Ibukota Jakarta 10320</p>
        <p className="text-[10px] text-slate-400/80 pt-1">
          © {new Date().getFullYear()} DSN-MUI Amanah e-Office • Hak Cipta Dilindungi
        </p>
      </footer>
    </div>
  );
};

export default DocumentVerificationPage;

