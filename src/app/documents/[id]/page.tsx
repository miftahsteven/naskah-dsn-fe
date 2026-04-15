"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  FileText, 
  History, 
  ShieldCheck, 
  Clock, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ChevronLeft,
  MoreVertical,
  Play,
  User as UserIcon
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

const DocumentDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/documents/${params.id}`);
      setDoc(res.data.data);
    } catch (err: any) {
      setError("Gagal memuat detail dokumen");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) fetchDetail();
  }, [params.id]);

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-slate-400">
      <Loader2 className="animate-spin text-primary" size={40} />
      <p className="font-medium animate-pulse">Memuat informasi dokumen...</p>
    </div>
  );

  if (error || !doc) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-red-500">
      <AlertCircle size={48} />
      <p className="font-bold">{error || "Dokumen tidak ditemukan"}</p>
      <button onClick={() => router.back()} className="text-sm font-bold underline">Kembali</button>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-primary font-bold transition-colors group"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Kembali</span>
        </button>
        <div className="flex items-center gap-3">
          <button className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-primary transition-all">
             <Download size={20} />
          </button>
          <button className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-primary transition-all">
             <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Document Info & Preview */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Info */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
             <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-4">
                   <div className="flex items-center gap-3">
                      <span className={cn(
                        "text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-sm uppercase tracking-tight",
                        doc.status === 'SIGNED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        doc.status === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      )}>
                        {doc.status}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{doc.category?.name}</span>
                   </div>
                   <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">{doc.title}</h1>
                   <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-2 text-slate-500">
                         <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">Nomor:</span>
                         <span className="text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-800">{doc.documentNumber || "Belum ada nomor"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                         <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">Klasifikasi:</span>
                         <span className={cn(
                           "text-xs font-bold px-2 py-0.5 rounded-md border",
                           doc.classification?.level === 'RAHASIA' ? 'text-red-600 border-red-100 bg-red-50' : 'text-slate-600 border-slate-100 bg-slate-50'
                         )}>
                           {doc.classification?.name}
                         </span>
                      </div>
                   </div>
                </div>
                {doc.status === 'DRAFT' && (
                  <button className="shrink-0 flex items-center gap-2 px-6 py-3 gradient-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                    <Play size={20} />
                    <span>Ajukan Persetujuan</span>
                  </button>
                )}
             </div>
             {/* Abstract background */}
             <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
          </div>

          {/* Versions Table */}
          <div className="space-y-4">
             <h3 className="text-lg font-bold text-slate-900 dark:text-white px-2 flex items-center gap-2">
                <History size={20} className="text-primary" />
                Riwayat Versi
             </h3>
             <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <table className="w-full">
                   <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50">
                        <th className="text-left py-4 px-8 text-[10px] uppercase tracking-widest text-slate-400 font-bold">Versi</th>
                        <th className="text-left py-4 px-8 text-[10px] uppercase tracking-widest text-slate-400 font-bold">Nama File</th>
                        <th className="text-left py-4 px-8 text-[10px] uppercase tracking-widest text-slate-400 font-bold">Ukuran</th>
                        <th className="text-left py-4 px-8 text-[10px] uppercase tracking-widest text-slate-400 font-bold">Waktu</th>
                        <th className="text-right py-4 px-8 text-[10px] uppercase tracking-widest text-slate-400 font-bold">Aksi</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {doc.versions.map((v: any) => (
                        <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                           <td className="py-4 px-8">
                             <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">v{v.versionNum}</span>
                           </td>
                           <td className="py-4 px-8">
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 line-clamp-1">{v.fileName}</p>
                           </td>
                           <td className="py-4 px-8 text-xs text-slate-500 font-mono">
                             {(v.fileSize / 1024 / 1024).toFixed(2)} MB
                           </td>
                           <td className="py-4 px-8 text-[11px] text-slate-400">
                             {new Date(v.createdAt).toLocaleString()}
                           </td>
                           <td className="py-4 px-8 text-right">
                              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary rounded-lg transition-all">
                                 <Download size={16} />
                              </button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        </div>

        {/* Right: Sidebar Info */}
        <div className="space-y-8">
           {/* Workflow Status Card */}
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                 <ShieldCheck size={20} className="text-primary" />
                 Status Workflow
              </h3>
              
              {doc.workflowInstances && doc.workflowInstances.length > 0 ? (
                 <div className="space-y-6">
                   {/* Workflow content simplified for now */}
                   <p className="text-xs text-slate-500">Persetujuan sedang dalam proses.</p>
                 </div>
              ) : (
                 <div className="py-10 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center gap-4 px-4">
                    <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300">
                       <Clock size={24} />
                    </div>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">Belum ada workflow aktif untuk dokumen ini.</p>
                 </div>
              )}
           </div>

           {/* Creator Info */}
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Detail Pembuat</h3>
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <UserIcon size={24} />
                 </div>
                 <div>
                    <p className="font-bold text-slate-900 dark:text-white leading-tight mb-1">{doc.creator.fullName}</p>
                    <p className="text-xs text-slate-500">{doc.creator.email}</p>
                 </div>
              </div>
              <div className="pt-4 border-t border-slate-50 dark:border-slate-800 grid grid-cols-2 gap-4">
                 <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1">Dibuat</p>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{new Date(doc.createdAt).toLocaleDateString()}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1">Terakhir Update</p>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{new Date(doc.updatedAt).toLocaleDateString()}</p>
                 </div>
              </div>
           </div>

           {/* Security / QR Placeholder */}
           <div className="p-8 rounded-[32px] gradient-primary text-white shadow-xl shadow-primary/20 flex flex-col items-center text-center gap-4">
              <div className="w-20 h-20 bg-white rounded-2xl p-2 shadow-inner">
                 {/* Placeholder for QR Code */}
                 <div className="w-full h-full bg-slate-50 flex items-center justify-center text-[10px] font-mono text-slate-400 text-center leading-tight">
                    VERIFIED<br/>BY MUI
                 </div>
              </div>
              <div className="space-y-1">
                 <h4 className="font-bold text-sm">Verifikasi Dokumen</h4>
                 <p className="text-[10px] text-white/70 leading-relaxed">Gunakan kode QR ini untuk memverifikasi keaslian dokumen di luar sistem.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetailPage;
