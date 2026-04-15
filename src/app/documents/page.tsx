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
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

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

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [docsRes, metaRes] = await Promise.all([
        api.get("/documents", {
          params: { search, status: statusFilter, categoryId: categoryFilter, classificationId: classFilter },
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

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchData(); };
  const resetFilters = () => { setStatusFilter(""); setCategoryFilter(""); setClassFilter(""); };

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

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-1 sm:mb-2 leading-tight flex items-center gap-3">
            <FileText size={28} className="text-primary flex-shrink-0" />
            <span>Riwayat Dokumen</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Akses dan kelola seluruh dokumen resmi yang ada dalam sistem.</p>
        </div>
        <Link href="/documents/new">
          <button className="flex items-center gap-2 px-5 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm w-full sm:w-auto justify-center">
            <Plus size={18} />
            <span>Dokumen Baru</span>
          </button>
        </Link>
      </div>

      {/* Search + Mobile Filter Toggle */}
      <div className="flex gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
          <input type="text" placeholder="Cari judul atau nomor dokumen..."
            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-primary/50 transition-all text-sm shadow-sm"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </form>
        {/* Mobile filter button */}
        <button onClick={() => setFilterOpen(true)}
          className="lg:hidden flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-300 font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex-shrink-0">
          <Filter size={18} />
          <span className="hidden sm:inline">Filter</span>
        </button>
      </div>

      {/* Mobile Filter Drawer Overlay */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setFilterOpen(false)} />
          <div className="relative ml-auto w-80 max-w-[90vw] h-full bg-white dark:bg-slate-900 shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Filter size={18} className="text-primary" /> Filter Dokumen
              </h3>
              <button onClick={() => setFilterOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all">
                <X size={20} />
              </button>
            </div>
            <FilterPanel />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm sticky top-24">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold mb-5">
              <Filter size={18} className="text-primary" />
              <span>Filter Dokumen</span>
            </div>
            <FilterPanel />
          </div>
        </aside>

        {/* Document List */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-slate-900 rounded-[24px] sm:rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
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
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50">
                        <th className="text-left py-5 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">Judul & Metadata</th>
                        <th className="text-left py-5 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">Status</th>
                        <th className="text-left py-5 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">Pembuat</th>
                        <th className="text-right py-5 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {documents.map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                          <td className="py-5 px-6">
                            <div className="flex flex-col">
                              <Link href={`/documents/${doc.id}`} className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors text-sm mb-1 line-clamp-1">
                                {doc.title}
                              </Link>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-mono text-slate-400">{doc.documentNumber || "No Number"}</span>
                                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{doc.category.name}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm", statusClass(doc.status))}>
                              {doc.status}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{doc.creator.fullName}</p>
                            <p className="text-[10px] text-slate-400">{new Date(doc.createdAt).toLocaleDateString()}</p>
                          </td>
                          <td className="py-5 px-6 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link href={`/documents/${doc.id}`}>
                                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-xl transition-all"><Eye size={17} /></button>
                              </Link>
                              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-xl transition-all"><Download size={17} /></button>
                              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-xl transition-all"><MoreVertical size={17} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card List */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {documents.map((doc) => (
                    <div key={doc.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <Link href={`/documents/${doc.id}`} className="font-bold text-slate-900 dark:text-white text-sm leading-tight line-clamp-2 hover:text-primary transition-colors">
                          {doc.title}
                        </Link>
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0", statusClass(doc.status))}>
                          {doc.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                        <span className="font-mono">{doc.documentNumber || "No Number"}</span>
                        <span>{doc.creator.fullName} · {new Date(doc.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Link href={`/documents/${doc.id}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition-all">
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
    </div>
  );
};

export default DocumentsPage;
