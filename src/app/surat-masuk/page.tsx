"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Download,
  Eye,
  FileBadge,
  Loader2,
  AlertCircle,
  ChevronDown,
  X,
  Pencil,
  Archive,
  Trash2,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileUp,
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import Can from "@/components/auth/Can";

const statusClass = (status: string) => {
  const map: Record<string, string> = {
    SIGNED: "bg-emerald-50 text-emerald-600 border-emerald-100",
    PENDING_APPROVAL: "bg-amber-50 text-amber-600 border-amber-100",
    REJECTED: "bg-red-50 text-red-600 border-red-100",
  };
  return map[status] ?? "bg-slate-100 text-slate-600 border-slate-200";
};

const DocumentsPage = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [classifications, setClassifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [docsRes, metaRes] = await Promise.all([
        api.get("/documents", {
          params: { search, status: statusFilter, categoryId: categoryFilter, classificationId: classFilter, documentType: "INCOMING" },
        }),
        api.get("/documents/meta"),
      ]);
      setDocuments(docsRes.data.data);
      setCategories(metaRes.data.data.categories);
      setClassifications(metaRes.data.data.classifications);
    } catch {
      setError("Gagal memuat dokumen");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [statusFilter, categoryFilter, classFilter]);

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchData(); };
  const resetFilters = () => { setStatusFilter(""); setCategoryFilter(""); setClassFilter(""); };

  const handleArchive = async (id: string) => {
    if (!confirm("Arsip dokumen ini?")) return;
    try {
      setActionLoading(true);
      await api.patch(`/documents/${id}/archive`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal mengarsipkan dokumen");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setActionLoading(true);
      await api.delete(`/documents/${id}`);
      fetchData();
      setIsDeleteConfirmOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menghapus dokumen");
    } finally {
      setActionLoading(false);
    }
  };

  const FilterPanel = () => (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Status</label>
        <div className="relative">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm appearance-none outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">Semua Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="SIGNED">Signed</option>
            <option value="REJECTED">Rejected</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
        <div className="relative">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm appearance-none outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">Semua Kategori</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Klasifikasi</label>
        <div className="relative">
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
            className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm appearance-none outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">Semua Klasifikasi</option>
            {classifications.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>
      <button onClick={resetFilters} className="w-full py-3 text-xs font-bold text-slate-400 hover:text-primary transition-colors border-t border-slate-100 dark:border-slate-800 pt-4">
        Reset Semua Filter
      </button>
    </div>
  );

  const EditDocumentModal = ({ doc }: { doc: any }) => {
    const [title, setTitle] = useState(doc?.title || "");
    const [catId, setCatId] = useState(doc?.categoryId || "");
    const [clsId, setClsId] = useState(doc?.classificationId || "");
    const [docNum, setDocNum] = useState(doc?.documentNumber || "");
    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        setActionLoading(true);
        const formData = new FormData();
        formData.append("title", title);
        formData.append("categoryId", catId);
        formData.append("classificationId", clsId);
        formData.append("documentNumber", docNum);
        if (file) formData.append("file", file);
        await api.put(`/documents/${doc.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        fetchData();
        setIsEditModalOpen(false);
      } catch (err: any) {
        alert(err.response?.data?.message || "Gagal memperbarui dokumen");
      } finally {
        setActionLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
        <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Pencil size={20} />
                </div>
                Edit Dokumen
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 ml-1">Judul Dokumen</label>
                <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm outline-none ring-2 ring-transparent focus:ring-primary/20 transition-all" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 ml-1">Kategori</label>
                  <select value={catId} onChange={(e) => setCatId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm outline-none ring-2 ring-transparent focus:ring-primary/20 transition-all">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 ml-1">Klasifikasi</label>
                  <select value={clsId} onChange={(e) => setClsId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm outline-none ring-2 ring-transparent focus:ring-primary/20 transition-all">
                    {classifications.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 ml-1">Ganti File (Opsional)</label>
                <div className="relative group">
                  <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-2 group-hover:border-primary/50 group-hover:bg-primary/5 transition-all">
                    <FileUp size={24} className="text-slate-400 group-hover:text-primary transition-colors" />
                    <span className="text-xs font-bold text-slate-500 group-hover:text-primary truncate max-w-[200px]">
                      {file ? file.name : "Klik atau seret file baru ke sini"}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 italic font-medium ml-1">File yang diunggah akan tersimpan sebagai Versi Baru tanpa menghapus versi sebelumnya.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm">
                  Batal
                </button>
                <button type="submit" disabled={actionLoading}
                  className="flex-1 py-3.5 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 transition-all text-sm flex items-center justify-center gap-2">
                  {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const DocumentFlowModal = ({ doc }: { doc: any }) => {
    const workflow = doc?.workflowInstances?.[0]; // Show active/latest
    const steps = workflow?.steps || [];

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsFlowModalOpen(false)} />
        <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-5 duration-200">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600">
                  <Activity size={20} />
                </div>
                Alur Persetujuan
              </h3>
              <button onClick={() => setIsFlowModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {!workflow ? (
                <div className="py-12 text-center space-y-3">
                  <Clock size={40} className="mx-auto text-slate-200" />
                  <p className="text-sm font-bold text-slate-400">Dokumen dalam tahap draft, belum ada alur persetujuan.</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800" />
                  <div className="space-y-8">
                    {steps.map((step: any, idx: number) => (
                      <div key={idx} className="relative flex items-start gap-5">
                        <div className={cn(
                          "w-10 h-10 rounded-xl border-4 border-white dark:border-slate-900 z-10 flex items-center justify-center shadow-sm shrink-0",
                          step.status === 'APPROVED' ? "bg-emerald-500 text-white" :
                          step.status === 'REJECTED' ? "bg-red-500 text-white" :
                          step.status === 'PENDING' ? "bg-amber-500 text-white animate-pulse" : "bg-slate-100 text-slate-400"
                        )}>
                          {step.status === 'APPROVED' ? <CheckCircle2 size={16} /> :
                           step.status === 'REJECTED' ? <X size={16} /> :
                           step.status === 'PENDING' ? <Clock size={16} /> : <span className="text-[10px] font-bold">{step.stepNumber}</span>}
                        </div>
                        <div className="flex-1 pt-0.5 pb-2 border-b border-slate-50 dark:border-slate-800/50">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{step.user?.fullName || "User"}</p>
                            <span className={cn(
                              "text-[9px] font-bold px-2 py-0.5 rounded-full border",
                              step.status === 'APPROVED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                              step.status === 'REJECTED' ? "bg-red-50 text-red-600 border-red-100" :
                              step.status === 'PENDING' && step.actionedAt ? "bg-blue-50 text-blue-600 border-blue-100" :
                              step.status === 'PENDING' ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-slate-50 text-slate-400 border-slate-200"
                            )}>
                              {step.status === 'PENDING' && step.actionedAt ? 'PENDING - REVISI MASUK' : step.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">{step.user?.jobTitle || "Approval Step"}</p>
                          {step.comment && (
                            <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">"{step.comment}"</p>
                              {step.status === 'PENDING' && step.actionedAt && (
                                <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/50 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                  <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400">Telah direvisi oleh Admin. Silakan periksa kembali.</p>
                                </div>
                              )}
                            </div>
                          )}
                          {step.actionedAt && (
                            <p className="text-[9px] text-slate-400 mt-2 font-mono">{new Date(step.actionedAt).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => setIsFlowModalOpen(false)}
              className="mt-10 w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm">
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  };

  const DeleteConfirmationModal = ({ doc }: { doc: any }) => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsDeleteConfirmOpen(false)} />
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-8 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-500/10 rounded-3xl flex items-center justify-center text-red-600 dark:text-red-500 mx-auto mb-6">
          <Trash2 size={40} />
        </div>
        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Hapus Permanen?</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
          Dokumen <span className="font-bold text-slate-900 dark:text-white">"{doc?.title}"</span> dan seluruh filenya akan dihapus selamanya dari sistem. Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setIsDeleteConfirmOpen(false)}
            className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm">
            Batal
          </button>
          <button onClick={() => handleDelete(doc.id)} disabled={actionLoading}
            className="flex-1 py-3.5 bg-red-500 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all text-sm flex items-center justify-center gap-2">
            {actionLoading ? <Loader2 size={18} className="animate-spin" /> : "Ya, Hapus"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-1 sm:mb-2 leading-tight flex items-center gap-3">
            <FileBadge size={28} className="text-primary flex-shrink-0" />
            <span>Surat Masuk (Sertifikat)</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Manajemen surat pengajuan dan penerbitan sertifikat syariah secara terintegrasi.</p>
        </div>
        <Can perform="DOC_UPLOAD">
          <Link href="/surat-masuk/new" className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm w-full sm:w-auto justify-center">
            <Plus size={18} />
            <span>Input Surat Masuk</span>
          </Link>
        </Can>
      </div>

      {/* Search + Filter Button */}
      <div className="flex gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
          <input type="text" placeholder="Cari judul atau nomor dokumen..."
            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-primary/50 transition-all text-sm shadow-sm"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </form>
        {/* Filter button — always visible, opens modal */}
        <button onClick={() => setFilterOpen(true)}
          className={`flex items-center gap-2 px-4 py-3 border rounded-2xl font-bold shadow-sm transition-all flex-shrink-0 text-sm
            ${ (statusFilter || categoryFilter || classFilter)
              ? 'bg-primary text-white border-primary hover:bg-primary/90'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}>
          <Filter size={18} />
          <span>Filter{(statusFilter || categoryFilter || classFilter) ? ' ●' : ''}</span>
        </button>
      </div>

      {/* Filter Modal — centered, all screen sizes */}
      {filterOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setFilterOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[28px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-base">
                <Filter size={18} className="text-primary" /> Filter Dokumen
              </h3>
              <button onClick={() => setFilterOpen(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <FilterPanel />
            </div>
            <div className="px-6 pb-6">
              <button
                onClick={() => { resetFilters(); setFilterOpen(false); }}
                className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                Reset &amp; Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full">
        {/* Document List — full width */}
        <div>
          <div className="bg-white dark:bg-slate-900 rounded-[24px] sm:rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm relative z-10 w-full pb-2">
            {loading ? (
              <div className="py-24 sm:py-32 flex flex-col items-center justify-center gap-4 text-slate-400">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="font-medium animate-pulse">Memuat dokumen...</p>
              </div>
            ) : error ? (
              <div className="py-24 sm:py-32 flex flex-col items-center justify-center gap-4 text-red-500">
                <AlertCircle size={40} />
                <p className="font-bold">{error}</p>
                <button onClick={fetchData} className="text-sm font-bold underline">Coba Lagi</button>
              </div>
            ) : documents.length === 0 ? (
              <div className="py-24 sm:py-32 flex flex-col items-center justify-center gap-4 text-slate-300">
                <FileBadge size={64} className="opacity-20" />
                <p className="font-medium">Tidak ada dokumen yang ditemukan.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block relative overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50">
                        <th className="rounded-tl-[24px] sm:rounded-tl-[32px] text-left py-4 px-5 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800 w-[30%]">Judul & Metadata</th>
                        <th className="text-left py-4 px-5 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">Klasifikasi & Versi</th>
                        <th className="text-left py-4 px-5 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">Progress Alur</th>
                        <th className="text-left py-4 px-5 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">Status</th>
                        <th className="text-left py-4 px-5 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">Pembuat & Tanggal</th>
                        <th className="rounded-tr-[24px] sm:rounded-tr-[32px] text-right py-4 px-5 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {documents.map((doc) => {
                        const wf = doc.workflowInstances?.[0];
                        const steps = wf?.steps ?? [];
                        const totalSteps = steps.length;
                        const doneSteps = steps.filter((s: any) => s.status === 'APPROVED').length;
                        const currentVersion = doc.versions?.[doc.versions.length - 1]?.versionNum ?? doc.currentVersion ?? 1;

                        return (
                        <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                          {/* ── Judul & Metadata ── */}
                          <td className="py-4 px-5">
                            <div className="flex flex-col gap-0.5">
                              <Link href={`/surat-masuk/${doc.id}`} className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors text-sm line-clamp-2 leading-snug">
                                {doc.title}
                              </Link>
                              <div className="flex items-center gap-2 flex-wrap mt-1">
                                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{doc.documentNumber || "No Nomor"}</span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{doc.category?.name ?? "—"}</span>
                              </div>
                              {doc.status === 'REVISION' && wf?.steps?.find((s: any) => s.status === 'REVISION') && (
                                <div className="mt-2 px-2.5 py-2 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                                  <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                                    <AlertCircle size={11} /> Revisi dari: {wf.steps.findLast((s: any) => s.status === 'REVISION')?.user?.fullName}
                                  </p>
                                </div>
                              )}
                              {doc.status === 'REJECTED' && (
                                <div className="mt-2 px-2.5 py-2 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl">
                                  <p className="text-[10px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                                    <X size={11} /> Ditolak: {wf?.steps?.findLast((s: any) => s.status === 'REJECTED')?.user?.fullName || "Approver"}
                                  </p>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* ── Klasifikasi & Versi ── */}
                          <td className="py-4 px-5">
                            <div className="flex flex-col gap-2">
                              {doc.classification?.name ? (
                                <span className="inline-flex items-center text-[10px] font-bold text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/40 px-2 py-0.5 rounded-full w-fit">
                                  {doc.classification.name}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-300 dark:text-slate-600 italic">—</span>
                              )}
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full w-fit">
                                v{currentVersion}
                                {currentVersion > 1 && <span className="text-emerald-500">↑</span>}
                              </span>
                            </div>
                          </td>

                          {/* ── Progress Alur ── */}
                          <td className="py-4 px-5">
                            {totalSteps === 0 ? (
                              <span className="text-[10px] text-slate-300 dark:text-slate-600 italic">Belum ada alur</span>
                            ) : (
                              <div className="flex flex-col gap-1.5 min-w-[80px]">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{doneSteps}/{totalSteps} Step</span>
                                  {doneSteps === totalSteps && totalSteps > 0 && (
                                    <CheckCircle2 size={12} className="text-emerald-500" />
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  {steps.map((s: any, i: number) => (
                                    <div key={i} className={cn(
                                      "h-1.5 flex-1 rounded-full transition-all",
                                      s.status === 'APPROVED' ? "bg-emerald-500" :
                                      s.status === 'REJECTED' ? "bg-red-400" :
                                      s.status === 'PENDING'  ? "bg-amber-400 animate-pulse" :
                                      "bg-slate-200 dark:bg-slate-700"
                                    )} />
                                  ))}
                                </div>
                                {steps.find((s: any) => s.status === 'PENDING') && (
                                  <p className="text-[9px] text-slate-400 truncate max-w-[110px]">
                                    ⏳ {steps.find((s: any) => s.status === 'PENDING')?.user?.fullName}
                                  </p>
                                )}
                              </div>
                            )}
                          </td>

                          {/* ── Status ── */}
                          <td className="py-4 px-5">
                            <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm whitespace-nowrap", statusClass(doc.status))}>
                              {doc.status}
                            </span>
                          </td>

                          {/* ── Pembuat & Tanggal ── */}
                          <td className="py-4 px-5">
                            <div className="flex flex-col gap-0.5">
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[130px]">{doc.creator?.fullName}</p>
                              {doc.creator?.jobTitle && (
                                <p className="text-[9px] text-slate-400 truncate max-w-[130px]">{doc.creator.jobTitle}</p>
                              )}
                              <p className="text-[9px] text-slate-400 mt-0.5">📅 {new Date(doc.createdAt).toLocaleString('id-ID', {day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}</p>
                              {doc.updatedAt && doc.updatedAt !== doc.createdAt && (
                                <p className="text-[9px] text-slate-300 dark:text-slate-600">🔄 {new Date(doc.updatedAt).toLocaleString('id-ID', {day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}</p>
                              )}
                            </div>
                          </td>

                          {/* ── Aksi ── */}
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link href={`/surat-masuk/${doc.id}`} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-xl transition-all inline-flex items-center" title="Lihat Detail">
                                <Eye size={17} />
                              </Link>
                              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-xl transition-all" title="Unduh">
                                <Download size={17} />
                              </button>
                              <div className="relative inline-block">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDropdown(activeDropdown === doc.id ? null : doc.id);
                                    setSelectedDoc(doc);
                                  }}
                                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-xl transition-all">
                                  <MoreVertical size={17} />
                                </button>
                                {activeDropdown === doc.id && (
                                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-[50] animate-in fade-in slide-in-from-top-2 duration-200">
                                    <Can perform="DOC_EDIT">
                                      <button onClick={() => { setIsEditModalOpen(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        {doc.status === 'REVISION' ? (
                                          <><FileUp size={14} className="text-blue-500" /> Upload Revisi Baru</>
                                        ) : (
                                          <><Pencil size={14} className="text-primary" /> Edit Dokumen</>
                                        )}
                                      </button>
                                    </Can>
                                    <button onClick={() => { setIsFlowModalOpen(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                      <Activity size={14} className="text-amber-500" /> Cek Flow
                                    </button>
                                    <button onClick={() => { handleArchive(doc.id); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                      <Archive size={14} className="text-slate-400" /> Arsipkan
                                    </button>
                                    <div className="h-px bg-slate-50 dark:bg-slate-800 my-1" />
                                    <Can perform="DOC_DELETE">
                                      <button onClick={() => { setIsDeleteConfirmOpen(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                        <Trash2 size={14} /> Hapus Permanen
                                      </button>
                                    </Can>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card List */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {documents.map((doc) => (
                    <div key={doc.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <Link href={`/surat-masuk/${doc.id}`} className="font-bold text-slate-900 dark:text-white text-sm leading-tight line-clamp-2 hover:text-primary transition-colors">
                          {doc.title}
                        </Link>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", statusClass(doc.status))}>
                            {doc.status}
                          </span>
                          <div className="relative inline-block">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdown(activeDropdown === doc.id ? null : doc.id);
                                setSelectedDoc(doc);
                              }}
                              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-xl transition-all">
                              <MoreVertical size={17} />
                            </button>

                            {activeDropdown === doc.id && (
                              <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-[50] animate-in fade-in slide-in-from-bottom-2 duration-200">
                                <button onClick={() => { setIsEditModalOpen(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                  {doc.status === 'REVISION' ? (
                                    <><FileUp size={14} className="text-blue-500" /> Upload Revisi Baru</>
                                  ) : (
                                    <><Pencil size={14} className="text-primary" /> Edit Dokumen</>
                                  )}
                                </button>
                                <button onClick={() => { setIsFlowModalOpen(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                  <Activity size={14} className="text-amber-500" /> Cek Flow
                                </button>
                                <button onClick={() => { handleArchive(doc.id); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                  <Archive size={14} className="text-slate-400" /> Arsipkan
                                </button>
                                <div className="h-px bg-slate-50 dark:bg-slate-800 my-1" />
                                <button onClick={() => { setIsDeleteConfirmOpen(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                  <Trash2 size={14} /> Hapus Permanen
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400 mb-2 mt-2">
                        <span className="font-mono">{doc.documentNumber || "No Number"}</span>
                        <span>{doc.creator.fullName} · {new Date(doc.createdAt).toLocaleString('id-ID', {day: 'numeric', month: 'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
                      </div>

                      {doc.status === 'REVISION' && doc.workflowInstances?.[0]?.steps?.find((s: any) => s.status === 'REVISION') && (
                        <div className="mb-3 p-3 bg-blue-50/80 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                           <p className="text-[11px] font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5 mb-1">
                             <AlertCircle size={14} /> Diminta Revisi oleh: {doc.workflowInstances[0].steps.findLast((s: any) => s.status === 'REVISION')?.user?.fullName}
                           </p>
                           <p className="text-[10px] text-blue-600/80 dark:text-blue-300/80 italic leading-snug pl-5">
                             &ldquo;{doc.workflowInstances[0].steps.findLast((s: any) => s.status === 'REVISION')?.comment || "Revisi diperlukan."}&rdquo;
                           </p>
                        </div>
                      )}
                      
                      {doc.status === 'REJECTED' && (
                        <div className="mb-3 p-3 bg-red-50/80 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl">
                           <p className="text-[11px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5 mb-1">
                             <X size={14} /> Ditolak oleh: {doc.workflowInstances?.[0]?.steps?.findLast((s: any) => s.status === 'REJECTED')?.user?.fullName || "Approver"}
                           </p>
                           <p className="text-[10px] text-red-600/80 dark:text-red-300/80 italic leading-snug pl-5">
                             &ldquo;{doc.workflowInstances?.[0]?.steps?.findLast((s: any) => s.status === 'REJECTED')?.comment || "Dokumen tidak disetujui."}&rdquo;
                           </p>
                        </div>
                      )}

                      {doc.status === 'SIGNED' && (
                        <div className="mb-3 p-3 bg-emerald-50/80 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
                           <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                             <CheckCircle2 size={14} /> Dokumen Selesai & Ditandatangani
                           </p>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mt-3">
                        <Link href={`/surat-masuk/${doc.id}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition-all">
                          <Eye size={14} /> Detail
                        </Link>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                          <Download size={14} /> Unduh
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals placed optimally outside layout flows */}
      {isEditModalOpen && selectedDoc && <EditDocumentModal doc={selectedDoc} />}
      {isFlowModalOpen && selectedDoc && <DocumentFlowModal doc={selectedDoc} />}
      {isDeleteConfirmOpen && selectedDoc && <DeleteConfirmationModal doc={selectedDoc} />}
    </div>
  );
};

export default DocumentsPage;
