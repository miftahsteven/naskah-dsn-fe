"use client";

import React from "react";
import {
  Paperclip,
  FileText,
  Users,
  Download,
  Eye,
  Building2,
  Folder,
  FileCheck2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getBaseUrl } from "@/lib/api";

const getBaseUrlSafe = () => {
  if (typeof window !== "undefined") return getBaseUrl();
  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002/api").replace("/api", "");
};

const getFileDownloadUrl = (rawUrl?: string) => {
  if (!rawUrl) return "#";
  let url = rawUrl;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `${getBaseUrlSafe()}/${rawUrl.replace(/^\//, "")}`;
  }
  const token = typeof window !== "undefined"
    ? localStorage.getItem("accessToken") ||
      (() => {
        try {
          return JSON.parse(localStorage.getItem("auth-storage") || "{}")?.state?.accessToken;
        } catch {
          return null;
        }
      })()
    : null;
  if (token && (url.includes("/api/") || url.includes("/documents/")) && !url.includes("token=")) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}token=${encodeURIComponent(token)}`;
  }
  return url;
};

const CANDIDATE_DOC_SPECS = [
  { key: "suratMui", title: "Surat Pengantar dari MUI Setempat" },
  { key: "sertifikatPelatihan", title: "Sertifikat Pelatihan Dasar Pengawas Syariah dari DSN-MUI" },
  { key: "sertifikatKompetensi", title: "Sertifikat Kompetensi Pengawas Syariah dari LSP MUI" },
  { key: "profilCv", title: "Profil Calon DPS (Daftar Riwayat Hidup dan KTP terbaru)" },
  { key: "suratPernyataanNonPegawai", title: "Surat Keterangan Tidak Menjadi Pengurus/Pegawai Aktif LKS/LBS/LPS" },
  { key: "dokumenLain", title: "Dokumen Lain Calon" },
];

const getNormalizedCandidateDocs = (rawDocs: any) => {
  if (!rawDocs) return [];
  if (Array.isArray(rawDocs)) {
    return rawDocs.map((d: any, idx: number) => ({
      key: d.key || `doc-${idx}`,
      title: d.title || d.requirementName || `Dokumen #${idx + 1}`,
      fileName: d.fileName || "berkas.pdf",
      fileUrl: d.fileUrl || "",
      fileSize: d.fileSize || 0,
    }));
  }
  if (typeof rawDocs === "object") {
    return CANDIDATE_DOC_SPECS.map((spec) => {
      const doc = rawDocs[spec.key];
      return {
        key: spec.key,
        title: spec.title,
        fileName: doc?.fileName || "",
        fileUrl: doc?.fileUrl || "",
        fileSize: doc?.fileSize || 0,
      };
    }).filter((item) => item.key !== "dokumenLain" || Boolean(item.fileUrl));
  }
  return [];
};

interface EvidenceDocumentsTabProps {
  doc: any;
  publicSub: any;
  candidatesList: any[];
  isRsDoc: boolean;
  onOpenReaderDoc: (docInfo: { title: string; fileUrl: string }) => void;
}

export const EvidenceDocumentsTab: React.FC<EvidenceDocumentsTabProps> = ({
  doc,
  publicSub,
  candidatesList,
  isRsDoc,
  onOpenReaderDoc,
}) => {
  const allSubmissionDocs = publicSub?.documents || [];

  // Filter RS specific legal documents
  const hospitalLegalDocs = allSubmissionDocs.filter((d: any) => {
    const n = (d.requirementName || d.title || "").toLowerCase();
    return (
      n.includes("akta") ||
      n.includes("izin") ||
      n.includes("nib") ||
      n.includes("sk rups") ||
      n.includes("profil") ||
      n.includes("laporan keuangan") ||
      n.includes("komitmen") ||
      n.includes("mukisi") ||
      n.includes("halal") ||
      n.includes("akreditasi") ||
      n.includes("transfer")
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[32px] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
        {/* Header */}
        <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Paperclip size={20} className="text-emerald-600" />
            Berkas Dokumen Lampiran & Evidence Lengkap
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Seluruh berkas persyaratan pengajuan pemohon, surat resmi perusahaan, dan berkas lampiran pendukung tersaji lengkap di sini. Klik berkas untuk pratinjau langsung.
          </p>
        </div>

        {/* ── BAGIAN 1: SURAT PENGANTAR / PERMOHONAN RESMI PERUSAHAAN ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-700">
            <div className="flex items-center gap-2.5">
              <Building2 size={16} className="text-emerald-600" />
              <span>1. Surat Permohonan Resmi / Pengantar Perusahaan</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
              Dokumen Utama Pemohon
            </span>
          </div>

          {publicSub?.officialLetterUrl ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs hover:border-emerald-500 transition-all">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0 font-bold text-xs shadow-xs">
                  PDF
                </div>
                <div className="space-y-1 min-w-0">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug break-words">
                    Surat Permohonan Resmi Instansi: {publicSub.company?.name || publicSub.company?.companyName || doc.sender}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      No. Surat: {doc.documentNumber || publicSub.companyLetterNumber || "—"}
                    </span>
                    <span>•</span>
                    <span className="font-mono">
                      Berkas: {publicSub.officialLetterName || "Surat_Permohonan.pdf"}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-slate-400">
                      Ukuran: {publicSub.officialLetterSize ? (publicSub.officialLetterSize / 1024 / 1024).toFixed(2) + " MB" : "Tersedia"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() =>
                    onOpenReaderDoc({
                      title: `Surat Permohonan Resmi - ${publicSub.company?.name || "Perusahaan"}`,
                      fileUrl: publicSub.officialLetterUrl,
                    })
                  }
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer"
                >
                  <Eye size={14} />
                  <span>Lihat Berkas</span>
                </button>
                <a
                  href={getFileDownloadUrl(publicSub.officialLetterUrl)}
                  download={publicSub.officialLetterName || "Surat_Permohonan.pdf"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all"
                  title="Unduh Berkas"
                >
                  <Download size={15} />
                </a>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
              Berkas surat permohonan resmi pemohon belum terlampir.
            </div>
          )}
        </div>

        {/* ── BAGIAN 2: BERKAS PERSYARATAN CALON DEWAN PENGAWAS SYARIAH (PER KANDIDAT) ── */}
        {candidatesList.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <Users size={16} className="text-emerald-600" />
                <span>2. Berkas Persyaratan Khusus Calon DPS ({candidatesList.length} Kandidat)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                5-6 Berkas Wajib per Calon
              </span>
            </div>

            <div className="space-y-6">
              {candidatesList.map((cand: any, cIdx: number) => {
                const docs = getNormalizedCandidateDocs(cand.documents);
                return (
                  <div
                    key={cand.id || cIdx}
                    className="p-5 rounded-2xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 space-y-4"
                  >
                    {/* Candidate Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700/60 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-xs shadow-2xs">
                          #{cIdx + 1}
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {cand.name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            {cand.nik && <span>NIK: <strong className="font-mono text-slate-700 dark:text-slate-300">{cand.nik}</strong></span>}
                            {cand.email && <span>Email: {cand.email}</span>}
                            {cand.phone && <span>Telp: {cand.phone}</span>}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-300/50 self-start sm:self-auto">
                        {docs.filter((d: any) => d.fileUrl).length} dari {docs.length} Berkas Lengkap
                      </span>
                    </div>

                    {/* Candidate Documents Full List (Judul Terlihat Jelas & Jangan Terpotong) */}
                    <div className="space-y-2.5">
                      {docs.map((docItem: any, dIdx: number) => {
                        const hasFile = Boolean(docItem.fileUrl);
                        return (
                          <div
                            key={dIdx}
                            className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-emerald-500 transition-all"
                          >
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-start gap-2.5">
                                <span className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5">
                                  {dIdx + 1}
                                </span>
                                <div className="space-y-0.5">
                                  {/* Full Unabridged Title */}
                                  <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug break-words">
                                    {docItem.title}
                                  </h5>
                                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                                    {hasFile ? (
                                      <>
                                        <span className="font-mono text-slate-600 dark:text-slate-400">
                                          {docItem.fileName || "berkas.pdf"}
                                        </span>
                                        <span>•</span>
                                        <span className="font-mono text-slate-400">
                                          {docItem.fileSize ? (docItem.fileSize / 1024 / 1024).toFixed(2) + " MB" : "Tersedia"}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-amber-600 dark:text-amber-400 font-semibold italic">
                                        Berkas belum diunggah oleh pemohon
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {hasFile ? (
                              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onOpenReaderDoc({
                                      title: `${cand.name} - ${docItem.title}`,
                                      fileUrl: docItem.fileUrl,
                                    })
                                  }
                                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-xs border border-emerald-200/80 transition-all cursor-pointer shadow-2xs"
                                >
                                  <Eye size={13} />
                                  <span>Lihat Berkas</span>
                                </button>
                                <a
                                  href={getFileDownloadUrl(docItem.fileUrl)}
                                  download={docItem.fileName || "dokumen.pdf"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all"
                                  title="Unduh Berkas"
                                >
                                  <Download size={14} />
                                </a>
                              </div>
                            ) : (
                              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 shrink-0">
                                Belum Terunggah
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── BAGIAN 3: DOKUMEN LEGALITAS RUMAH SAKIT SYARIAH (JIKA PERMOHONAN RS) ── */}
        {isRsDoc && hospitalLegalDocs.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>3. Dokumen Legalitas & Persyaratan Khusus Rumah Sakit Syariah</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                {hospitalLegalDocs.length} Berkas
              </span>
            </div>

            <div className="space-y-2.5">
              {hospitalLegalDocs.map((docItem: any, idx: number) => {
                const hasFile = Boolean(docItem.fileUrl);
                return (
                  <div
                    key={idx}
                    className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-emerald-500 transition-all"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug break-words">
                        {docItem.requirementName || docItem.title}
                      </h5>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-mono text-slate-600 dark:text-slate-400">
                          {docItem.fileName || "berkas.pdf"}
                        </span>
                        {docItem.fileSize && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-slate-400">
                              {(docItem.fileSize / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {hasFile ? (
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() =>
                            onOpenReaderDoc({
                              title: docItem.requirementName || docItem.title,
                              fileUrl: docItem.fileUrl,
                            })
                          }
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-xs border border-emerald-200/80 transition-all cursor-pointer shadow-2xs"
                        >
                          <Eye size={13} />
                          <span>Lihat Berkas</span>
                        </button>
                        <a
                          href={getFileDownloadUrl(docItem.fileUrl)}
                          download={docItem.fileName || "dokumen.pdf"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all"
                          title="Unduh Berkas"
                        >
                          <Download size={14} />
                        </a>
                      </div>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-700 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 shrink-0">
                        Belum Diunggah
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── BAGIAN 4: BERKAS SURAT MASUK UTAMA & EVIDENCE INTERNAL DSN ── */}
        {doc.versions && doc.versions.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <FileText size={16} className="text-emerald-600" />
                <span>4. Berkas Surat Masuk Utama (Arsip Internal PDF / DOCX)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                {doc.versions.length} Versi Dokumen
              </span>
            </div>

            <div className="space-y-2.5">
              {doc.versions.map((v: any, idx: number) => {
                const isDocx = v.fileName?.toLowerCase().endsWith(".docx") || v.fileName?.toLowerCase().endsWith(".doc");
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-emerald-500 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                        {isDocx ? "DOCX" : "PDF"}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <h5 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white break-words">
                          {v.fileName}
                        </h5>
                        <p className="text-[11px] text-slate-400 font-mono">
                          Versi #{v.versionNumber || idx + 1} • {(v.fileSize / 1024 / 1024).toFixed(2)} MB • {new Date(v.createdAt).toLocaleDateString("id-ID")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => onOpenReaderDoc({ title: v.fileName, fileUrl: v.fileUrl })}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
                      >
                        <Eye size={13} /> Lihat Berkas
                      </button>
                      <a
                        href={getFileDownloadUrl(v.fileUrl)}
                        download={v.fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all"
                        title="Unduh"
                      >
                        <Download size={14} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── BAGIAN 5: EVIDENCE FILES & FOLDERS INTERNAL TAMBAHAN ── */}
        {(doc.evidenceFiles?.length > 0 || doc.evidenceFolders?.length > 0) && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <Folder size={16} className="text-emerald-600" />
                <span>5. Berkas Evidence & Folder Pendukung Tambahan</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(doc.evidenceFiles || []).map((ef: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-extrabold text-slate-800 dark:text-slate-200 truncate">
                      {ef.name || "Berkas Evidence"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {(ef.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenReaderDoc({ title: ef.name, fileUrl: ef.fileUrl })}
                      className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                      title="Lihat"
                    >
                      <Eye size={14} />
                    </button>
                    <a
                      href={getFileDownloadUrl(ef.fileUrl)}
                      download={ef.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
                      title="Unduh"
                    >
                      <Download size={14} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
