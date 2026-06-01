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
  Info
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
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Breadcrumb / Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-500 hover:text-primary font-bold transition-colors group"
      >
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span>Kembali ke Daftar</span>
      </button>

      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-1 sm:mb-2 flex items-center gap-3">
            <FilePlus size={28} className="text-primary flex-shrink-0" />
            <span>Input Surat Masuk</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm sm:text-base">
            Unggah file dan lengkapi metadata untuk memulai proses administrasi digital.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-[24px] sm:rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6 sm:space-y-8">
            {/* Error/Success Feedbacks */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 flex items-start gap-3 text-red-600 dark:text-red-400 text-sm animate-in fade-in zoom-in duration-300">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 flex items-start gap-3 text-emerald-600 dark:text-emerald-400 text-sm animate-in fade-in zoom-in duration-300">
                <Check size={18} className="shrink-0 mt-0.5" />
                <span>Dokumen berhasil diunggah! Mengalihkan...</span>
              </div>
            )}

            <div className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Judul Dokumen</label>
                <div className="relative group">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    type="text"
                    required
                    placeholder="Judul Dokumen"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
              </div>

              {/* Document Number */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nomor Dokumen (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: 001/DSN-MUI/IV/2026"
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                  <select
                    required
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>

                {/* Classification */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Klasifikasi</label>
                  <select
                    required
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none"
                    value={classificationId}
                    onChange={(e) => setClassificationId(e.target.value)}
                  >
                    <option value="">Pilih Klasifikasi</option>
                    {classifications.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                  </select>
                </div>

                {/* Approval Flow Type */}
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tipe Alur Persetujuan</label>
                  <select
                    required
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none"
                    value={approvalFlowType}
                    onChange={(e) => setApprovalFlowType(e.target.value)}
                  >
                    <option value="SEQUENTIAL">Bertingkat (Waterfall)</option>
                    <option value="PARALLEL">Paralel (Semua approver secara bersamaan)</option>
                  </select>
                </div>
              </div>

              {/* File Upload Dropzone */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">File Dokumen (PDF/DOCX)</label>
                <div className={cn(
                  "border-2 border-dashed rounded-[24px] sm:rounded-[32px] p-6 sm:p-10 flex flex-col items-center justify-center transition-all cursor-pointer relative min-h-[160px]",
                  file ? "border-primary/50 bg-primary/5" : "border-slate-200 dark:border-slate-800 hover:border-primary/30"
                )}>
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                  />
                  {file ? (
                    <div className="flex flex-col items-center animate-in zoom-in duration-300">
                      <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-primary shadow-sm mb-4">
                        <Check size={32} />
                      </div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white mb-1">{file.name}</p>
                      <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="mt-4 text-xs font-bold text-red-500 hover:underline"
                      >
                        Ganti File
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
                        <Upload size={32} />
                      </div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white mb-1">Pilih atau Seret File ke Sini</p>
                      <p className="text-xs text-slate-400">PDF, DOC, DOCX maksimal 10MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={uploading || success}
                className="flex-1 gradient-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Mengunggah {progress}%</span>
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    <span>Unggah Dokumen</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-8 py-4 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-slate-800"
              >
                Batal
              </button>
            </div>
          </form>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-primary p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] text-white shadow-xl shadow-primary/20 relative overflow-hidden group">
            <div className="relative z-10 flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Info size={20} />
              </div>
              <h3 className="text-lg font-bold">Panduan Pengunggahan</h3>
              <p className="text-sm text-white/80 leading-relaxed">
                Pastikan dokumen telah diperiksa isinya sebelum diunggah. Dokumen yang baru diunggah akan masuk ke status <strong>"Draft"</strong> secara default.
              </p>
              <ul className="text-xs space-y-2 mt-2">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-white rounded-full mt-1 shrink-0"></span>
                  <span>Maksimal ukuran file 10MB</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-white rounded-full mt-1 shrink-0"></span>
                  <span>Gunakan judul yang deskriptif</span>
                </li>
              </ul>
            </div>
            {/* Abstract pattern */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-1000"></div>
          </div>

          <div className="p-8 rounded-[32px] border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300">
              <FilePlus size={32} />
            </div>
            <p className="text-xs text-slate-400 font-medium leading-relaxed px-4">
              Dokumen Anda dienkripsi dan disimpan secara aman dalam sistem arsip digital kami.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateDocumentPage;
