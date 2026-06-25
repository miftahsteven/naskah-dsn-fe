"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Loader2,
  AlertCircle,
  ChevronDown,
  X,
  Archive,
  Trash2,
  RotateCcw,
  Calendar,
  Layers,
  ShieldAlert,
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import Can from "@/components/auth/Can";
import DocumentReader from "@/components/documents/DocumentReader";

const statusClass = (status: string) => {
  const map: Record<string, string> = {
    SIGNED: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/50",
    PENDING_APPROVAL: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/50",
    REJECTED: "bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:border-red-900/50",
  };
  return map[status] ?? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
};

const MONTHS = [
  { value: "", label: "Semua Bulan" },
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" }
];

export default function ArsipSuratPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [classifications, setClassifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters State
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(""); // "", "INCOMING", "OUTGOING"
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  // Column level SAP ERP style search
  const [colFilters, setColFilters] = useState({
    title: "",
    docNumber: "",
    creator: ""
  });

  // Readers & Detail Drawer
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [docsRes, metaRes] = await Promise.all([
        api.get("/documents", {
          params: { status: "ARCHIVED" }
        }),
        api.get("/documents/meta")
      ]);
      setDocuments(docsRes.data.data);
      setCategories(metaRes.data.data.categories);
      setClassifications(metaRes.data.data.classifications);
    } catch (err: any) {
      setError("Gagal memuat dokumen arsip");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRestore = async (id: string) => {
    if (!confirm("Kembalikan dokumen ini dari arsip ke daftar aktif utama?")) return;
    try {
      setActionLoading(true);
      await api.patch(`/documents/${id}/restore`);
      alert("Dokumen berhasil dikembalikan dari arsip.");
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal mengembalikan dokumen");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("HAPUS PERMANEN dokumen ini beserta seluruh versinya? Tindakan ini tidak dapat dibatalkan!")) return;
    try {
      setActionLoading(true);
      await api.delete(`/documents/${id}`);
      alert("Dokumen berhasil dihapus secara permanen.");
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menghapus dokumen");
    } finally {
      setActionLoading(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("");
    setMonthFilter("");
    setYearFilter("");
    setCategoryFilter("");
    setClassFilter("");
    setColFilters({ title: "", docNumber: "", creator: "" });
  };

  // Dynamic Year Extraction
  const yearsList = useMemo(() => {
    const years = new Set<string>();
    documents.forEach((doc) => {
      if (doc.createdAt) {
        years.add(new Date(doc.createdAt).getFullYear().toString());
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [documents]);

  // Client-side filtering logic
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Search Box (Global)
      if (search) {
        const query = search.toLowerCase();
        const matchesGlobal =
          doc.title?.toLowerCase().includes(query) ||
          doc.documentNumber?.toLowerCase().includes(query) ||
          doc.category?.name?.toLowerCase().includes(query);
        if (!matchesGlobal) return false;
      }

      // Column Filters (ERP Style)
      if (colFilters.title) {
        const query = colFilters.title.toLowerCase();
        const matchesTitle =
          doc.title?.toLowerCase().includes(query) ||
          doc.documentNumber?.toLowerCase().includes(query);
        if (!matchesTitle) return false;
      }
      if (colFilters.creator) {
        const query = colFilters.creator.toLowerCase();
        const matchesCreator = doc.creator?.fullName?.toLowerCase().includes(query);
        if (!matchesCreator) return false;
      }

      // Dropdown Filters
      if (typeFilter && doc.documentType !== typeFilter) return false;
      if (categoryFilter && doc.categoryId !== categoryFilter) return false;
      if (classFilter && doc.classificationId !== classFilter) return false;

      // Date Filters (Month & Year)
      if (doc.createdAt) {
        const createdDate = new Date(doc.createdAt);
        if (monthFilter) {
          const docMonth = (createdDate.getMonth() + 1).toString();
          if (docMonth !== monthFilter) return false;
        }
        if (yearFilter) {
          const docYear = createdDate.getFullYear().toString();
          if (docYear !== yearFilter) return false;
        }
      } else {
        // If no date and date filter is active, exclude it
        if (monthFilter || yearFilter) return false;
      }

      return true;
    });
  }, [documents, search, typeFilter, monthFilter, yearFilter, categoryFilter, classFilter, colFilters]);

  const FilterPanel = () => (
    <div className="space-y-4">
      {/* Tipe Surat */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Jenis Surat</label>
        <div className="relative">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-sm appearance-none outline-none focus:border-[#006633] transition-all font-medium text-slate-800 dark:text-white">
            <option value="">Semua Jenis Surat</option>
            <option value="INCOMING">Surat Masuk</option>
            <option value="OUTGOING">Surat Keluar</option>
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Kategori */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Kategori Dokumen</label>
        <div className="relative">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-sm appearance-none outline-none focus:border-[#006633] transition-all font-medium text-slate-800 dark:text-white">
            <option value="">Semua Kategori</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Klasifikasi */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Klasifikasi</label>
        <div className="relative">
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
            className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-sm appearance-none outline-none focus:border-[#006633] transition-all font-medium text-slate-800 dark:text-white">
            <option value="">Semua Klasifikasi</option>
            {classifications.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Bulan */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Bulan</label>
          <div className="relative">
            <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-sm appearance-none outline-none focus:border-[#006633] transition-all font-medium text-slate-800 dark:text-white">
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Tahun */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Tahun</label>
          <div className="relative">
            <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-sm appearance-none outline-none focus:border-[#006633] transition-all font-medium text-slate-800 dark:text-white">
              <option value="">Semua Tahun</option>
              {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <button onClick={resetFilters} className="w-full py-3 text-xs font-bold text-slate-450 hover:text-[#006633] transition-colors border-t border-slate-100 dark:border-slate-850 pt-4 mt-2">
        Reset Semua Filter
      </button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-850 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-[#006633]/10 text-[#006633] rounded-xl flex items-center justify-center">
              <Archive size={22} />
            </div>
            Pustaka Arsip Surat
          </h1>
          <p className="text-slate-450 text-xs mt-1 font-semibold">
            Daftar surat masuk dan keluar yang sudah diarsipkan. Tidak aktif di halaman operasional utama.
          </p>
        </div>
      </div>

      {/* Global Search + Filter Trigger */}
      <div className="flex gap-3">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#006633] transition-colors" size={18} />
          <input
            type="text"
            placeholder="Cari judul, nomor surat, atau kategori di arsip..."
            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-[#006633] transition-all text-sm shadow-sm font-medium text-slate-900 dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setFilterOpen(true)}
          className={cn(
            "flex items-center gap-2 px-5 py-3.5 border rounded-2xl font-bold shadow-sm transition-all flex-shrink-0 text-sm",
            typeFilter || monthFilter || yearFilter || categoryFilter || classFilter
              ? "bg-[#006633] text-white border-[#006633] hover:bg-[#006633]/90"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          )}
        >
          <Filter size={18} />
          <span>Filter{(typeFilter || monthFilter || yearFilter || categoryFilter || classFilter) ? " ●" : ""}</span>
        </button>
      </div>

      {/* Filter Modal */}
      {filterOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setFilterOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[28px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2 text-base">
                <Filter size={18} className="text-[#006633]" /> Filter Arsip
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
                onClick={() => setFilterOpen(false)}
                className="w-full py-3.5 rounded-2xl bg-[#006633] text-white font-bold text-sm hover:bg-[#006633]/95 transition-all shadow-md shadow-[#006633]/10"
              >
                Terapkan &amp; Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden relative z-10 w-full">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4 text-slate-400">
            <Loader2 className="animate-spin text-[#006633]" size={40} />
            <p className="font-semibold text-xs animate-pulse">Memuat data arsip...</p>
          </div>
        ) : error ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4 text-red-500">
            <ShieldAlert size={40} />
            <p className="font-bold text-sm">{error}</p>
            <button onClick={fetchData} className="text-xs font-extrabold underline hover:text-red-700">Coba Lagi</button>
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto w-full">
              <table className="w-full min-w-[900px] text-xs border-collapse">
                <thead className="bg-[#006633]/8 text-[#006633] dark:bg-[#006633]/15 dark:text-emerald-400">
                  <tr className="border-b border-slate-300 dark:border-slate-700">
                    <th className="text-center py-2.5 px-3 font-extrabold w-12">No.</th>
                    <th className="text-left py-2.5 px-3 font-extrabold border-l border-slate-300 dark:border-slate-700 w-[35%]">Judul & Nomor</th>
                    <th className="text-left py-2.5 px-3 font-extrabold border-l border-slate-300 dark:border-slate-700 w-[15%]">Jenis Surat</th>
                    <th className="text-left py-2.5 px-3 font-extrabold border-l border-slate-300 dark:border-slate-700 w-[15%]">Klasifikasi & Kategori</th>
                    <th className="text-left py-2.5 px-3 font-extrabold border-l border-slate-300 dark:border-slate-700 w-[15%]">Tanggal Arsip</th>
                    <th className="text-left py-2.5 px-3 font-extrabold border-l border-slate-300 dark:border-slate-700 w-[15%]">Pembuat</th>
                    <th className="text-center py-2.5 px-3 font-extrabold border-l border-slate-300 dark:border-slate-700 w-[140px]">Aksi</th>
                  </tr>
                  {/* Column Filters (SAP ERP Style) */}
                  <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-300 dark:border-slate-700">
                    <th></th>
                    <th className="py-1.5 px-2 border-l border-slate-300 dark:border-slate-700">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Cari judul/nomor..."
                          value={colFilters.title}
                          onChange={(e) => setColFilters(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-2 py-1 text-[11px] font-normal bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded outline-none focus:border-[#006633] focus:ring-1 focus:ring-[#006633]/20"
                        />
                        {colFilters.title && (
                          <button onClick={() => setColFilters(prev => ({ ...prev, title: "" }))} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    </th>
                    <th className="border-l border-slate-300 dark:border-slate-700"></th>
                    <th className="border-l border-slate-300 dark:border-slate-700"></th>
                    <th className="border-l border-slate-300 dark:border-slate-700"></th>
                    <th className="py-1.5 px-2 border-l border-slate-300 dark:border-slate-700">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Cari pembuat..."
                          value={colFilters.creator}
                          onChange={(e) => setColFilters(prev => ({ ...prev, creator: e.target.value }))}
                          className="w-full px-2 py-1 text-[11px] font-normal bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded outline-none focus:border-[#006633] focus:ring-1 focus:ring-[#006633]/20"
                        />
                        {colFilters.creator && (
                          <button onClick={() => setColFilters(prev => ({ ...prev, creator: "" }))} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-440">
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    </th>
                    <th className="border-l border-slate-300 dark:border-slate-700 text-center">
                      {(colFilters.title || colFilters.creator) && (
                        <button
                          onClick={() => setColFilters({ title: "", docNumber: "", creator: "" })}
                          className="text-[10px] font-bold text-red-500 hover:underline"
                        >
                          Clear
                        </button>
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                  {filteredDocuments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-450 font-semibold text-xs">
                        Tidak ada dokumen arsip yang cocok dengan kriteria filter.
                      </td>
                    </tr>
                  ) : (
                    filteredDocuments.map((doc, idx) => {
                      const fileUrl = doc.fileUrl;
                      const hasFile = doc.versions?.length > 0;
                      return (
                        <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/25 transition-colors font-medium text-slate-700 dark:text-slate-300 animate-in fade-in-50 duration-200">
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3 border-l border-slate-200 dark:border-slate-800">
                            <div className="font-extrabold text-slate-900 dark:text-white line-clamp-1">{doc.title}</div>
                            <div className="font-mono text-[10px] text-slate-400 font-bold mt-0.5">{doc.documentNumber || "-"}</div>
                          </td>
                          <td className="py-3 px-3 border-l border-slate-200 dark:border-slate-800">
                            {doc.documentType === "INCOMING" ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50">
                                Surat Masuk
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50">
                                Surat Keluar
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 border-l border-slate-200 dark:border-slate-800">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{doc.classification?.name || "-"}</div>
                            <div className="text-[10px] text-slate-450 mt-0.5">{doc.category?.name || "-"}</div>
                          </td>
                          <td className="py-3 px-3 border-l border-slate-200 dark:border-slate-800 font-mono text-[10px] text-slate-500 font-bold">
                            {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            }) : "-"}
                          </td>
                          <td className="py-3 px-3 border-l border-slate-200 dark:border-slate-800">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{doc.creator?.fullName || "System"}</div>
                            <div className="text-[10px] text-slate-450 font-mono font-bold truncate max-w-[120px]">{doc.creator?.email || ""}</div>
                          </td>
                          <td className="py-3 px-3 border-l border-slate-200 dark:border-slate-800 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* Read Document */}
                              <button
                                onClick={() => setSelectedDoc(doc)}
                                title="Lihat Dokumen"
                                className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 hover:bg-blue-100 transition-colors"
                              >
                                <Eye size={14} />
                              </button>
                              
                              {/* Download File */}
                              {hasFile ? (
                                <a
                                  href={fileUrl}
                                  download
                                  title="Unduh File"
                                  className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 hover:bg-indigo-100 transition-colors"
                                >
                                  <Download size={14} />
                                </a>
                              ) : (
                                <div className="p-1.5 text-slate-300 cursor-not-allowed">
                                  <Download size={14} />
                                </div>
                              )}

                              {/* Restore/Kembalikan */}
                              <Can perform="DOC_EDIT">
                                <button
                                  onClick={() => handleRestore(doc.id)}
                                  disabled={actionLoading}
                                  title="Kembalikan Dokumen"
                                  className="p-1.5 rounded-lg bg-[#006633]/10 text-[#006633] dark:bg-[#006633]/20 dark:text-emerald-400 hover:bg-[#006633]/20 transition-colors"
                                >
                                  <RotateCcw size={14} />
                                </button>
                              </Can>

                              {/* Delete Permanently */}
                              <Can perform="DOC_DELETE">
                                <button
                                  onClick={() => handleDelete(doc.id)}
                                  disabled={actionLoading}
                                  title="Hapus Permanen"
                                  className="p-1.5 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450 hover:bg-rose-100 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </Can>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDocuments.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                  Tidak ada dokumen arsip yang cocok.
                </div>
              ) : (
                filteredDocuments.map((doc, idx) => (
                  <div key={doc.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">{doc.title}</h4>
                        <p className="font-mono text-[9px] text-slate-450 mt-0.5">{doc.documentNumber || "-"}</p>
                      </div>
                      {doc.documentType === "INCOMING" ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                          Masuk
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                          Keluar
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap justify-between items-center text-[10px] text-slate-500 font-semibold gap-2">
                      <div className="flex items-center gap-1.5">
                        <Layers size={12} className="text-[#006633]" />
                        <span>{doc.category?.name || doc.classification?.name || "-"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono">
                        <Calendar size={12} className="text-[#006633]" />
                        <span>
                          {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          }) : "-"}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 border-t border-slate-50 dark:border-slate-800/40 pt-2.5">
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 font-bold text-[10px]"
                      >
                        <Eye size={12} /> Lihat
                      </button>
                      
                      <Can perform="DOC_EDIT">
                        <button
                          onClick={() => handleRestore(doc.id)}
                          disabled={actionLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#006633]/10 text-[#006633] dark:bg-[#006633]/20 dark:text-emerald-400 font-bold text-[10px]"
                        >
                          <RotateCcw size={12} /> Kembalikan
                        </button>
                      </Can>

                      <Can perform="DOC_DELETE">
                        <button
                          onClick={() => handleDelete(doc.id)}
                          disabled={actionLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450 font-bold text-[10px]"
                        >
                          <Trash2 size={12} /> Hapus
                        </button>
                      </Can>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Document Reader Overlay Modal */}
      {selectedDoc && (
        <DocumentReader
          isOpen={!!selectedDoc}
          title={selectedDoc.title}
          fileUrl={selectedDoc.fileUrl}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </div>
  );
}
