"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileCheck, 
  Clock, 
  CheckCircle2, 
  XSquare, 
  ExternalLink, 
  AlertCircle, 
  Loader2,
  FileText,
  MessageSquare,
  ShieldCheck,
  User as UserIcon,
  Download
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

const ApprovalsPage = () => {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Action Modal State
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [actionComment, setActionComment] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await api.get("/workflow/queue");
      setQueue(res.data.data);
    } catch (err: any) {
      setError("Gagal memuat antrean persetujuan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleAction = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedItem) return;
    try {
      setProcessing(true);
      await api.post("/workflow/action", {
        stepId: selectedItem.id,
        action,
        comment: actionComment
      });
      setSelectedItem(null);
      setActionComment("");
      fetchQueue();
    } catch (err: any) {
      alert("Gagal memproses aksi: " + (err.response?.data?.message || err.message));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 leading-tight flex items-center gap-3">
            <FileCheck size={32} className="text-primary" />
            <span>Antrean Persetujuan</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Dokumen yang memerlukan perhatian dan persetujuan digital Anda.
          </p>
        </div>
        <div className="bg-primary/10 px-4 py-2 rounded-xl flex items-center gap-3">
           <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
             {queue.length}
           </div>
           <span className="text-sm font-bold text-primary uppercase tracking-tight">Dokumen Menunggu</span>
        </div>
      </div>

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-4 text-slate-400">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="font-medium animate-pulse">Memuat antrean...</p>
        </div>
      ) : error ? (
        <div className="py-32 flex flex-col items-center justify-center gap-4 text-red-500">
          <AlertCircle size={40} />
          <p className="font-bold">{error}</p>
          <button onClick={fetchQueue} className="text-sm font-bold underline">Coba Lagi</button>
        </div>
      ) : queue.length === 0 ? (
        <div className="py-32 flex flex-col items-center justify-center gap-6 bg-white dark:bg-slate-900 rounded-[32px] border-2 border-dashed border-slate-100 dark:border-slate-800 text-slate-300">
           <CheckCircle2 size={64} className="opacity-20 text-emerald-500" />
           <div className="text-center">
             <p className="font-bold text-slate-400 mb-1">Semua dokumen telah diproses!</p>
             <p className="text-xs">Antrean Anda kosong saat ini.</p>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {queue.map((item) => {
            const doc = item.instance.document;
            return (
              <div key={item.id} className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-6 flex flex-col shadow-sm hover:shadow-md transition-all group animate-in fade-in slide-in-from-bottom-4 duration-500">
                 {/* Card Header */}
                 <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-tight">
                         Langkah {item.stepNumber} dari {item.instance.totalSteps}
                       </span>
                    </div>
                    <button className="text-slate-300 hover:text-primary transition-colors">
                       <ExternalLink size={18} />
                    </button>
                 </div>

                 {/* Document Info */}
                 <div className="flex-1 space-y-3 mb-6">
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight group-hover:text-primary transition-colors">
                      {doc.title}
                    </h3>
                    <div className="flex flex-col gap-1.5">
                       <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                          <FileText size={14} className="text-slate-400" />
                          <span>{doc.documentNumber || "No Number"}</span>
                       </div>
                       <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                          <UserIcon size={14} className="text-slate-400" />
                          <span>Oleh: {doc.creator.fullName}</span>
                       </div>
                    </div>
                 </div>

                 {/* Meta Badges */}
                 <div className="flex flex-wrap gap-2 mb-8">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-800 uppercase">
                      {doc.category.name}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-md border uppercase",
                      doc.classification.level === 'RAHASIA' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                    )}>
                      {doc.classification.name}
                    </span>
                 </div>

                 {/* Action Footer */}
                 <div className="grid grid-cols-2 gap-3 mt-auto">
                    <button 
                      onClick={() => setSelectedItem(item)}
                      className="flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-emerald-500 hover:text-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl transition-all active:scale-[0.95]"
                    >
                      <CheckCircle2 size={16} />
                      <span>Setujui</span>
                    </button>
                    <button 
                      onClick={() => setSelectedItem(item)}
                      className="flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-red-500 hover:text-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl transition-all active:scale-[0.95]"
                    >
                      <XSquare size={16} />
                      <span>Tolak</span>
                    </button>
                 </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Dialog (Simplified inline modal) */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !processing && setSelectedItem(null)}></div>
           <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] shadow-2xl p-8 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center gap-4 mb-8">
                 <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <ShieldCheck size={32} />
                 </div>
                 <div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Konfirmasi Aksi</h4>
                    <p className="text-sm text-slate-500">Berikan catatan atau alasan (opsional) untuk dokumen ini.</p>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Komentar / Catatan</label>
                    <textarea 
                      rows={3}
                      placeholder="Tulis alasan setuju atau penolakan..."
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm resize-none"
                      value={actionComment}
                      onChange={(e) => setActionComment(e.target.value)}
                    />
                 </div>

                 <div className="flex flex-col gap-3">
                    <button 
                      disabled={processing}
                      onClick={() => handleAction('APPROVE')}
                      className="w-full py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all disabled:opacity-70"
                    >
                      {processing ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={20} /> <span>Setujui Dokumen</span></>}
                    </button>
                    <button 
                      disabled={processing}
                      onClick={() => handleAction('REJECT')}
                      className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 hover:bg-red-600 transition-all disabled:opacity-70"
                    >
                      {processing ? <Loader2 className="animate-spin" size={20} /> : <><XSquare size={20} /> <span>Tolak Dokumen</span></>}
                    </button>
                    <button 
                      disabled={processing}
                      onClick={() => setSelectedItem(null)}
                      className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors"
                    >
                      Kembali
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalsPage;
