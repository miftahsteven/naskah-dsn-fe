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
  History,
  FileBadge,
  Loader2,
  AlertCircle,
  ChevronDown
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

const DocumentsPage = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [classifications, setClassifications] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [docsRes, metaRes] = await Promise.all([
        api.get("/documents", {
          params: {
            search,
            status: statusFilter,
            categoryId: categoryFilter,
            classificationId: classFilter
          }
        }),
        api.get("/documents/meta")
      ]);
      setDocuments(docsRes.data.data);
      setCategories(metaRes.data.data.categories);
      setClassifications(metaRes.data.data.classifications);
    } catch (err: any) {
      setError("Gagal memuat dokumen");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, categoryFilter, classFilter]); // Fetch on filter change

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 leading-tight flex items-center gap-3">
            <FileText size={32} className="text-primary" />
            <span>Riwayat Dokumen</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Akses dan kelola seluruh dokumen resmi yang ada dalam sistem.
          </p>
        </div>
        <Link href="/documents/new">
          <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
            <Plus size={20} />
            <span>Dokumen Baru</span>
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filter Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
             <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold mb-4">
               <Filter size={18} className="text-primary" />
               <span>Filter Dokumen</span>
             </div>

             {/* Status Filter */}
             <div className="space-y-2">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Status</label>
               <div className="relative">
                 <select 
                   value={statusFilter}
                   onChange={(e) => setStatusFilter(e.target.value)}
                   className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm appearance-none outline-none focus:ring-2 focus:ring-primary/20"
                 >
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

             {/* Category Filter */}
             <div className="space-y-2">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
               <div className="relative">
                 <select 
                   value={categoryFilter}
                   onChange={(e) => setCategoryFilter(e.target.value)}
                   className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm appearance-none outline-none focus:ring-2 focus:ring-primary/20"
                 >
                   <option value="">Semua Kategori</option>
                   {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                 </select>
                 <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
               </div>
             </div>

             {/* Classification Filter */}
             <div className="space-y-2">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Klasifikasi</label>
               <div className="relative">
                 <select 
                   value={classFilter}
                   onChange={(e) => setClassFilter(e.target.value)}
                   className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm appearance-none outline-none focus:ring-2 focus:ring-primary/20"
                 >
                   <option value="">Semua Klasifikasi</option>
                   {classifications.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                 </select>
                 <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
               </div>
             </div>

             <button 
               onClick={() => { setStatusFilter(""); setCategoryFilter(""); setClassFilter(""); }}
               className="w-full py-3 text-xs font-bold text-slate-400 hover:text-primary transition-colors border-t border-slate-100 dark:border-slate-800 pt-4"
             >
               Reset Semua Filter
             </button>
          </div>
        </aside>

        {/* Search & List */}
        <div className="lg:col-span-3 space-y-6">
          <form onSubmit={handleSearch} className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Cari judul dokumen atau nomor dokumen..." 
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-primary/50 transition-all text-sm shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-32 flex flex-col items-center justify-center gap-4 text-slate-400">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="font-medium animate-pulse">Memuat dokumen...</p>
              </div>
            ) : error ? (
              <div className="py-32 flex flex-col items-center justify-center gap-4 text-red-500">
                <AlertCircle size={40} />
                <p className="font-bold">{error}</p>
                <button onClick={fetchData} className="text-sm font-bold underline">Coba Lagi</button>
              </div>
            ) : documents.length === 0 ? (
               <div className="py-32 flex flex-col items-center justify-center gap-4 text-slate-300">
                 <FileBadge size={64} className="opacity-20" />
                 <p className="font-medium">Tidak ada dokumen yang ditemukan.</p>
               </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                      <th className="text-left py-5 px-8 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">Judul & Metadata</th>
                      <th className="text-left py-5 px-8 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">Status</th>
                      <th className="text-left py-5 px-8 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">Pembuat</th>
                      <th className="text-right py-5 px-8 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                        <td className="py-5 px-8">
                          <div className="flex flex-col">
                            <Link href={`/documents/${doc.id}`} className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors text-sm mb-1 line-clamp-1">
                              {doc.title}
                            </Link>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-mono text-slate-400">{doc.documentNumber || "No Number"}</span>
                              <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                              <span className="text-[10px] font-bold text-slate-500 uppercase">{doc.category.name}</span>
                              <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                              <span className={cn(
                                "text-[10px] font-bold uppercase",
                                doc.classification.level === 'RAHASIA' ? 'text-red-500' : 'text-slate-400'
                              )}>
                                {doc.classification.name}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-8">
                          <span className={cn(
                            "text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm",
                            doc.status === 'SIGNED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            doc.status === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            doc.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-100' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          )}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="py-5 px-8">
                           <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{doc.creator.fullName}</p>
                           <p className="text-[10px] text-slate-400">{new Date(doc.createdAt).toLocaleDateString()}</p>
                        </td>
                        <td className="py-5 px-8 text-right">
                          <div className="flex items-center justify-end gap-2">
                             <Link href={`/documents/${doc.id}`}>
                               <button className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-xl transition-all" title="View Detail">
                                 <Eye size={18} />
                               </button>
                             </Link>
                             <button className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-xl transition-all" title="Download">
                               <Download size={18} />
                             </button>
                             <button className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-xl transition-all">
                               <MoreVertical size={18} />
                             </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;
