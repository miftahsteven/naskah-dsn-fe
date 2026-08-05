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
  Download,
  ChevronRight,
  X,
  RefreshCw
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import DocumentReader from "@/components/documents/DocumentReader";
import Can from "@/components/auth/Can";


const ApprovalsPage = () => {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Action Modal State
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [actionComment, setActionComment] = useState("");
  const [processing, setProcessing] = useState(false);
  const [otpToken, setOtpToken] = useState("");
  const [confirmAction, setConfirmAction] = useState<'APPROVE' | 'REJECT' | 'REVISION' | null>(null);

  // Reader State
  const [readerDoc, setReaderDoc] = useState<{title: string, fileUrl: string} | null>(null);


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

  const handleAction = async () => {
    if (!selectedItem || !confirmAction) return;
    
    if (confirmAction === 'APPROVE' && !otpToken) {
      alert("Harap masukkan kode OTP Google Authenticator");
      return;
    }

    try {
      setProcessing(true);
      await api.post("/workflow/action", {
        stepId: selectedItem.id,
        action: confirmAction,
        comment: actionComment,
        twoFactorToken: otpToken
      });
      setSelectedItem(null);
      setConfirmAction(null);
      setActionComment("");
      setOtpToken("");
      fetchQueue();
    } catch (err: any) {
      alert("Gagal memproses aksi: " + (err.response?.data?.message || err.message));
    } finally {
      setProcessing(false);
    }
  };


  return (
    <div className="space-y-6 sm:space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2 leading-tight flex items-center gap-3">
            <FileCheck size={32} className="text-primary flex-shrink-0" />
            <span>Antrean Persetujuan</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm sm:text-base">
            Dokumen yang memerlukan perhatian dan persetujuan digital Anda.
          </p>
        </div>
        <div className="bg-primary/10 px-4 py-2.5 rounded-2xl flex items-center gap-3 w-fit">
           <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
             {queue.length}
           </div>
           <span className="text-xs font-bold text-primary uppercase tracking-tight">Dokumen Menunggu</span>
        </div>
      </div>

      {loading ? (
        <div className="py-24 sm:py-32 flex flex-col items-center justify-center gap-4 text-slate-400">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="font-medium animate-pulse">Memuat antrean...</p>
        </div>
      ) : error ? (
        <div className="py-24 sm:py-32 flex flex-col items-center justify-center gap-4 text-red-500">
          <AlertCircle size={40} />
          <p className="font-bold text-center px-4">{error}</p>
          <button onClick={fetchQueue} className="text-sm font-bold underline">Coba Lagi</button>
        </div>
      ) : queue.length === 0 ? (
        <div className="py-24 sm:py-32 flex flex-col items-center justify-center gap-6 bg-white dark:bg-slate-900 rounded-[32px] border-2 border-dashed border-slate-100 dark:border-slate-800 text-slate-300 mx-auto max-w-2xl w-full">
           <CheckCircle2 size={64} className="opacity-20 text-emerald-500" />
           <div className="text-center px-6">
             <p className="font-bold text-slate-400 mb-1 text-lg">Semua dokumen telah diproses!</p>
             <p className="text-sm">Antrean Anda kosong saat ini. Kerja bagus!</p>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {queue.map((item) => {
            const doc = item.workflowInstance.document;
            const currentVersion = doc.versions?.[doc.versions.length - 1]; // Get latest version
            
            return (
              <div key={item.id} className="bg-white dark:bg-slate-900 rounded-[28px] sm:rounded-[32px] border border-slate-100 dark:border-slate-800 p-5 sm:p-7 flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group animate-in fade-in slide-in-from-bottom-4 duration-500">
                 {/* Card Header */}
                 <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-2 flex-wrap">
                       {item.status === 'REVISION' ? (
                         <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-100 uppercase tracking-tight shadow-sm">
                           Revisi Diperlukan
                         </span>
                       ) : (
                         <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-tight">
                           Langkah {item.stepNumber} / {item.workflowInstance.steps?.length || "?"}
                         </span>
                       )}
                       {currentVersion && currentVersion.versionNum > 1 && (
                         <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-tight shadow-sm" title={`Direvisi pada: ${new Date(currentVersion.createdAt).toLocaleString('id-ID', {day: 'numeric', month: 'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}`}>
                           Revisi v{currentVersion.versionNum}
                         </span>
                       )}
                    </div>
                    <button 
                      onClick={() => setReaderDoc({title: doc.title, fileUrl: currentVersion?.fileName?.toLowerCase().endsWith('.html') || currentVersion?.mimeType === 'text/html' ? `/api/documents/${doc.id}/download` : (currentVersion?.fileUrl || "")})}
                      className="text-slate-300 hover:text-primary transition-colors p-2 bg-slate-50 dark:bg-slate-800 rounded-xl"
                      title="Preview Document"
                    >
                       <ExternalLink size={18} />
                    </button>
                 </div>

                 {/* Document Info */}
                 <div className="flex-1 space-y-4 mb-8">
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight group-hover:text-primary transition-colors line-clamp-2">
                      {doc.title}
                    </h3>
                    <div className="space-y-2.5">
                       <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
                          <div className="w-5 h-5 rounded-md bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <FileText size={14} />
                          </div>
                          <span className="truncate">{doc.documentNumber || "No Number Specified"}</span>
                       </div>
                       <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
                          <div className="w-5 h-5 rounded-md bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                             <UserIcon size={14} />
                          </div>
                          <span className="truncate">Oleh: {doc.creator?.fullName || "Admin"}</span>
                       </div>
                    </div>
                 </div>


                 {/* Meta Badges */}
                 <div className="flex flex-wrap gap-2 mb-8">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 uppercase tracking-tight">
                      {doc.category.name}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold px-2.5 py-1.5 rounded-lg border uppercase tracking-tight",
                      doc.classification.level === 'RAHASIA' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    )}>
                      {doc.classification.name}
                    </span>
                 </div>

                 {/* Action Footer */}
                 <div className="grid grid-cols-3 gap-2 mt-auto pt-4 border-t border-slate-50 dark:border-slate-800/50">
                    <Can perform="DOC_APPROVE">
                      <button 
                        onClick={() => { setSelectedItem(item); setConfirmAction('APPROVE'); }}
                        className="flex flex-col items-center justify-center gap-1.5 py-3 bg-slate-50 hover:bg-emerald-500 hover:text-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl transition-all active:scale-[0.95] text-[10px]"
                      >
                        <CheckCircle2 size={16} />
                        <span>Setujui</span>
                      </button>
                    </Can>
                    <Can perform="DOC_REVISE">
                      <button 
                        onClick={() => { setSelectedItem(item); setConfirmAction('REVISION'); }}
                        className="flex flex-col items-center justify-center gap-1.5 py-3 bg-slate-50 hover:bg-amber-500 hover:text-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl transition-all active:scale-[0.95] text-[10px]"
                      >
                        <RefreshCw size={16} />
                        <span>Revisi</span>
                      </button>
                    </Can>
                    <Can perform="DOC_REJECT">
                      <button 
                        onClick={() => { setSelectedItem(item); setConfirmAction('REJECT'); }}
                        className="flex flex-col items-center justify-center gap-1.5 py-3 bg-slate-50 hover:bg-red-500 hover:text-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl transition-all active:scale-[0.95] text-[10px]"
                      >
                        <XSquare size={16} />
                        <span>Tolak</span>
                      </button>
                    </Can>
                 </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Action Dialog */}
      {selectedItem && confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => !processing && setSelectedItem(null)}></div>
           <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-2xl p-6 sm:p-10 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
              {/* Close Button Mobile */}
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute right-6 top-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all sm:hidden"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-center text-center gap-5 mb-10">
                 <div className={cn(
                   "w-20 h-20 rounded-[24px] flex items-center justify-center shadow-inner",
                   confirmAction === 'APPROVE' ? "bg-emerald-50 text-emerald-500" :
                   confirmAction === 'REVISION' ? "bg-amber-50 text-amber-500" :
                   "bg-red-50 text-red-500"
                 )}>
                    {confirmAction === 'APPROVE' ? <ShieldCheck size={40} /> : 
                     confirmAction === 'REVISION' ? <RefreshCw size={40} /> : 
                     <XSquare size={40} />}
                 </div>
                 <div>
                    <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
                      {confirmAction === 'APPROVE' ? 'Konfirmasi Persetujuan' : 
                       confirmAction === 'REVISION' ? 'Minta Revisi' : 
                       'Konfirmasi Penolakan'}
                    </h4>
                    <p className="text-sm text-slate-500 font-medium px-4">
                      Dokumen: <br/> 
                      <span className="text-slate-900 dark:text-slate-200 font-bold">&ldquo;{selectedItem.workflowInstance.document.title}&rdquo;</span>
                    </p>
                 </div>
              </div>

              <div className="space-y-6">
                 {confirmAction === 'APPROVE' && (
                   <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Kode Google Authenticator (OTP)</label>
                      <input 
                        type="text"
                        maxLength={6}
                        placeholder="000000"
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary/20 rounded-[24px] outline-none transition-all text-xl font-bold tracking-[0.5em] text-center"
                        value={otpToken}
                        onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                      />
                   </div>
                 )}

                 <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Komentar / Catatan Khusus</label>
                    <textarea 
                      rows={3}
                      placeholder={confirmAction === 'REVISION' ? "Jelaskan apa yang perlu diperbaiki..." : "Berikan alasan atau catatan tambahan..."}
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary/20 rounded-[24px] outline-none transition-all text-sm font-medium resize-none"
                      value={actionComment}
                      onChange={(e) => setActionComment(e.target.value)}
                    />
                 </div>

                 <div className="flex flex-col gap-3">
                     <Can perform={confirmAction === 'APPROVE' ? 'DOC_APPROVE' : confirmAction === 'REVISION' ? 'DOC_REVISE' : 'DOC_REJECT'}>
                        <button 
                          disabled={processing || (confirmAction === 'APPROVE' && otpToken.length < 6)}
                          onClick={handleAction}
                          className={cn(
                            "w-full py-4.5 text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 active:scale-[0.98]",
                            confirmAction === 'APPROVE' ? "bg-emerald-500 shadow-emerald-500/20" :
                            confirmAction === 'REVISION' ? "bg-amber-500 shadow-amber-500/20" :
                            "bg-red-500 shadow-red-500/20"
                          )}
                        >
                          {processing ? <Loader2 className="animate-spin" size={20} /> : (
                            <>
                              {confirmAction === 'APPROVE' ? <CheckCircle2 size={20} /> : 
                               confirmAction === 'REVISION' ? <RefreshCw size={20} /> : 
                               <XSquare size={20} />}
                              <span>Konfirmasi {confirmAction === 'APPROVE' ? 'Setujui' : confirmAction === 'REVISION' ? 'Revisi' : 'Tolak'}</span>
                            </>
                          )}
                        </button>
                     </Can>
                    <button 
                      disabled={processing}
                      onClick={() => setSelectedItem(null)}
                      className="w-full py-2 text-slate-400 font-bold hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-xs"
                    >
                      Batalkan dan Kembali
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Document Reader Modal */}
      <DocumentReader 
        isOpen={!!readerDoc}
        onClose={() => setReaderDoc(null)}
        title={readerDoc?.title || ""}
        fileUrl={readerDoc?.fileUrl || ""}
      />
    </div>
  );
};

export default ApprovalsPage;
