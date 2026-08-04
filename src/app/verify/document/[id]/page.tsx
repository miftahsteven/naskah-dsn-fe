"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, XCircle, ShieldCheck, FileText, Calendar, Building, Clock, User, Award } from "lucide-react";

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

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002/api";

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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="w-12 h-12 border-4 border-[#006633] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest animate-pulse">Memverifikasi Dokumen...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-red-500/10">
          <XCircle size={40} />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Verifikasi Gagal</h1>
        <p className="text-slate-500 text-sm max-w-md text-center leading-relaxed mb-6">
          {error || "Dokumen tidak valid atau tidak terdaftar dalam sistem sertifikasi digital Amanah."}
        </p>
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">DSN-MUI Amanah Digital Trust</div>
      </div>
    );
  }

  const isValid = data.status === "SIGNED";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center py-12 px-4">
      {/* Header Brand */}
      <div className="flex items-center gap-2.5 mb-10">
        <div className="w-9 h-9 bg-[#006633] rounded-xl flex items-center justify-center shadow-lg shadow-[#006633]/20">
          <ShieldCheck size={20} className="text-white" />
        </div>
        <div>
          <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight block">AMANAH</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block -mt-1">Digital Trust Service</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-xl shadow-slate-100/50 dark:shadow-none overflow-hidden relative">
        
        {/* Status Section */}
        <div className={`p-8 text-center border-b border-slate-50 dark:border-slate-850 relative ${
          isValid 
            ? "bg-gradient-to-b from-emerald-50/50 to-transparent dark:from-emerald-950/10" 
            : "bg-gradient-to-b from-amber-50/50 to-transparent dark:from-amber-950/10"
        }`}>
          <div className="flex justify-center mb-4">
            {isValid ? (
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450 rounded-2xl flex items-center justify-center shadow-md animate-pulse">
                <CheckCircle2 size={32} />
              </div>
            ) : (
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-450 rounded-2xl flex items-center justify-center shadow-md">
                <XCircle size={32} />
              </div>
            )}
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {isValid ? "Dokumen Ini Valid & Asli" : "Dokumen Dalam Proses Approval"}
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Ditandatangani secara elektronik di bawah otoritas Dewan Syariah Nasional MUI
          </p>

          <div className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750 text-[10px] font-bold text-slate-600 dark:text-slate-350 uppercase tracking-widest shadow-sm">
            <Award size={12} className="text-[#006633]" />
            Status: {data.status}
          </div>
        </div>

        {/* Document Meta Section */}
        <div className="p-8 space-y-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detail Dokumen</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-850 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <FileText size={12} /> Judul Dokumen
              </span>
              <p className="text-sm font-extrabold text-slate-850 dark:text-slate-200">{data.title}</p>
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Award size={12} /> Nomor Surat
              </span>
              <p className="text-sm font-extrabold text-[#006633]">{data.documentNumber || "—"}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Building size={12} /> Instansi Penerbit
              </span>
              <p className="text-sm font-extrabold text-slate-850 dark:text-slate-200">{data.organization}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Calendar size={12} /> Tanggal Dibuat
              </span>
              <p className="text-sm font-bold text-slate-850 dark:text-slate-200">
                {new Date(data.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })} WIB
              </p>
            </div>
          </div>

          {/* Signatories List */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Penandatangan Digital</span>
              <span className="text-[10px] text-[#006633] bg-[#006633]/10 px-2 py-0.5 rounded-md">Verified Signatures</span>
            </h3>

            {data.signatures.length > 0 ? (
              <div className="space-y-3">
                {data.signatures.map((sig) => (
                  <div key={sig.userId} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-[#006633] flex items-center justify-center shrink-0">
                      <ShieldCheck size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate">{sig.fullName}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide truncate">{sig.jobTitle}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
                        <Clock size={10} />
                        Signed
                      </div>
                      <p className="text-[9px] text-slate-400 font-semibold mt-1">
                        {new Date(sig.signedAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs font-medium">
                Belum ada tanda tangan digital yang tercatat untuk dokumen ini.
              </div>
            )}
          </div>
        </div>

        {/* Footer Brand */}
        <div className="px-8 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-400 tracking-wider">
          <span>SECURE CERTIFICATE PROTOCOL</span>
          <span className="text-[#006633]">DSN-MUI AMANAH</span>
        </div>
      </div>
    </div>
  );
};

export default DocumentVerificationPage;
