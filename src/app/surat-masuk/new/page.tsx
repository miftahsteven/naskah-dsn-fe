"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FilePlus,
  Upload,
  X,
  Check,
  Loader2,
  AlertCircle,
  FileText,
  ChevronLeft,
  Info,
  ChevronDown
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

const CreateDocumentPage = () => {
  const router = useRouter();

  const [categories, setCategories] = useState<any[]>([]);
  const [classifications, setClassifications] = useState<any[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // Form State
  const [title, setTitle] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [classificationId, setClassificationId] = useState("");
  const [approvalFlowType, setApprovalFlowType] = useState("SEQUENTIAL");
  const [file, setFile] = useState<File | null>(null);

  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await api.get("/documents/meta");
        setCategories(res.data.data.categories);
        setClassifications(res.data.data.classifications);
      } catch (err) {
        setError("Gagal memuat metadata dokumen");
      } finally {
        setLoadingMeta(false);
      }
    };
    fetchMeta();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Silakan pilih file dokumen terlebih dahulu");
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("documentNumber", docNumber);
    formData.append("categoryId", categoryId);
    formData.append("classificationId", classificationId);
    formData.append("documentType", "INCOMING");
    formData.append("approvalFlowType", approvalFlowType);

    try {
      await api.post("/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
          setProgress(percentCompleted);
        },
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/surat-masuk");
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal mengunggah dokumen");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-primary transition-all mb-2 cursor-pointer"
          >
            <ChevronLeft size={16} />
            <span>Kembali ke Daftar</span>
          </button>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight flex items-center gap-2.5">
            <FilePlus size={24} className="text-[#006633]" />
            <span>Input Surat Masuk</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-[#006633] border border-emerald-100 dark:border-emerald-900/40 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            CA SECURED
          </span>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Left Side: Document Canvas dropzone/preview */}
        <div className="flex-1 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 flex flex-col items-center justify-center min-h-[450px] relative overflow-hidden group">
          {/* Abstract Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

          <input
            type="file"
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
          />

          {file ? (
            <div className="relative z-10 flex flex-col items-center text-center animate-in zoom-in-95 duration-300 w-full max-w-md">
              {/* Document Icon Box */}
              <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-900 shadow-xl border border-slate-100/80 dark:border-slate-800 flex items-center justify-center text-[#006633] mb-6 relative group-hover:scale-105 transition-transform duration-300">
                <FileText size={44} className="stroke-[1.5]" />
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-505 bg-emerald-500 text-white flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-md">
                  <Check size={14} className="stroke-[3]" />
                </div>
              </div>

              <h3 className="text-base font-extrabold text-slate-850 dark:text-white mb-1.5 break-all px-4">{file.name}</h3>
              <p className="text-xs text-slate-400 font-medium mb-6">{(file.size / 1024 / 1024).toFixed(2)} MB</p>

              {/* Integrity & Encryption Metadata details */}
              <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 text-left space-y-3 shadow-sm mb-6">
                <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border-b border-slate-50 dark:border-slate-850 pb-2">
                  <Info size={14} />
                  <span>VERIFIKASI INTEGRITAS</span>
                </div>
                <div className="space-y-2 text-[10.5px] font-medium text-slate-500">
                  <div className="flex justify-between">
                    <span>Nama File</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold truncate max-w-[200px]">{file.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Format</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold uppercase">{file.name.split('.').pop()} File</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Enkripsi Dokumen</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Aktif (AES-256)</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="relative z-20 text-xs font-extrabold text-red-500 hover:text-red-600 hover:underline cursor-pointer transition-all"
              >
                Hapus Berkas &amp; Pilih Ulang
              </button>
            </div>
          ) : (
            <div className="relative z-10 flex flex-col items-center text-center max-w-sm px-6">
              <div className="w-20 h-20 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <Upload size={32} className="stroke-[1.5]" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white mb-2">Seret File Surat Masuk ke Sini</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">
                Atau klik untuk menjelajah file dari komputer Anda. Mendukung PDF, DOC, atau DOCX hingga maksimal 10MB.
              </p>
              <button
                type="button"
                className="px-5 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-all shadow-sm"
              >
                Pilih Berkas Dokumen
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Metadata Console Form */}
        <form onSubmit={handleSubmit} className="w-full lg:w-[450px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-sm p-6 sm:p-8 flex flex-col justify-between shrink-0 space-y-6">
          <div className="space-y-6">
            {/* Feedbacks */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 flex items-start gap-2.5 text-red-600 dark:text-red-400 text-xs animate-in fade-in duration-300">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 flex items-start gap-2.5 text-emerald-600 dark:text-emerald-400 text-xs animate-in fade-in duration-300">
                <Check size={16} className="shrink-0 mt-0.5" />
                <span>Dokumen berhasil diunggah! Mengalihkan...</span>
              </div>
            )}

            {/* Judul Dokumen */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Judul Dokumen</label>
              <div className="relative group">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#006633] transition-colors" size={16} />
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pengajuan Sertifikat Halal PT A"
                  className="w-full pl-11 pr-4 py-3 bg-[#F7F5EC] border border-[#DDDBC9] rounded-2xl outline-none focus:border-[#006633]/50 focus:bg-white text-xs font-medium transition-all"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            </div>

            {/* Nomor Dokumen */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Nomor Dokumen (Opsional)</label>
              <input
                type="text"
                placeholder="Contoh: 001/DSN-MUI/IV/2026"
                className="w-full px-4 py-3 bg-[#F7F5EC] border border-[#DDDBC9] rounded-2xl outline-none focus:border-[#006633]/50 focus:bg-white text-xs font-medium transition-all"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
              />
            </div>

            {/* Category & Classification Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Kategori</label>
                <div className="relative">
                  <select
                    required
                    className="w-full px-4 py-3 bg-[#F7F5EC] border border-[#DDDBC9] rounded-2xl outline-none focus:border-[#006633]/50 focus:bg-white text-xs font-medium transition-all appearance-none"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="">— Pilih —</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Sifat / Klasifikasi</label>
                <div className="relative">
                  <select
                    required
                    className="w-full px-4 py-3 bg-[#F7F5EC] border border-[#DDDBC9] rounded-2xl outline-none focus:border-[#006633]/50 focus:bg-white text-xs font-medium transition-all appearance-none"
                    value={classificationId}
                    onChange={(e) => setClassificationId(e.target.value)}
                  >
                    <option value="">— Pilih —</option>
                    {classifications.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Approval Flow Type */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Tipe Alur Persetujuan</label>
              <div className="relative">
                <select
                  required
                  className="w-full px-4 py-3 bg-[#F7F5EC] border border-[#DDDBC9] rounded-2xl outline-none focus:border-[#006633]/50 focus:bg-white text-xs font-medium transition-all appearance-none"
                  value={approvalFlowType}
                  onChange={(e) => setApprovalFlowType(e.target.value)}
                >
                  <option value="SEQUENTIAL">Bertingkat (Waterfall)</option>
                  <option value="PARALLEL">Paralel (Bersamaan)</option>
                  <option value="NOTIF_ONLY">Tanda Persetujuan (Hanya Pemberitahuan)</option>
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Explanatory Info Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-1.5">
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Info size={13} className="text-[#006633]" />
                <span>Penjelasan Alur</span>
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-medium">
                {approvalFlowType === 'SEQUENTIAL'
                  ? "Persetujuan bertahap di mana penandatangan kedua baru dapat bertanda tangan setelah penandatangan pertama menyetujui dokumen."
                  : approvalFlowType === 'PARALLEL'
                  ? "Semua penandatangan dapat memberikan persetujuan atau tanda tangan secara bersamaan tanpa perlu menunggu antrean."
                  : "Tanda persetujuan berupa pemberitahuan tanpa alur antrean sekuensial (bisa ditandatangani bersamaan)."
                }
              </p>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            {uploading && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                  <span>PROSES UPLOAD</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#006633] transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-750"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={uploading || success || !file}
                className="flex-[2] py-3.5 text-white text-xs font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:hover:scale-100 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #006633 0%, #1B7F4A 100%)' }}
              >
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    <span>Mengunggah...</span>
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    <span>Unggah Dokumen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDocumentPage;
