"use client";

import React from "react";
import { X, ExternalLink, Download, FileText, Loader2 } from "lucide-react";

interface DocumentReaderProps {
  title: string;
  fileUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

const DocumentReader: React.FC<DocumentReaderProps> = ({ title, fileUrl, isOpen, onClose }) => {
  if (!isOpen) return null;

  // Assume fileUrl is something like "uploads/filename.pdf"
  // The backend serves static files from /uploads
  const fullUrl = `http://localhost:4002/${fileUrl}`;

  const isDocx = title.toLowerCase().endsWith('.docx') || title.toLowerCase().endsWith('.doc') || fileUrl.toLowerCase().endsWith('.docx') || fileUrl.toLowerCase().endsWith('.doc');
  const isLocalhost = fullUrl.includes('localhost') || fullUrl.includes('127.0.0.1');

  // Use Google Docs viewer or Microsoft Office Online Viewer for Office documents
  // Note: These public viewer APIs require the file URL to be publicly accessible from the internet.
  const viewerUrl = isDocx 
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fullUrl)}` 
    : fullUrl;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-4 md:p-8">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Reader Container */}
      <div className="relative w-full h-full max-w-6xl bg-white dark:bg-slate-950 rounded-none sm:rounded-[32px] flex flex-col shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden">
        
        {/* ...Toolbar omitted for brevity but I need to keep the exact same lines... */}
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <FileText size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white truncate pr-4">{title}</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Document Reader — Amanah Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a 
              href={fullUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2.5 text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
              title="Open in new tab"
            >
              <ExternalLink size={20} />
            </a>
            <a 
              href={fullUrl} 
              download
              className="p-2.5 text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
              title="Download file"
            >
              <Download size={20} />
            </a>
            <div className="w-px h-6 bg-slate-100 dark:bg-slate-800 mx-1" />
            <button 
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-900 relative">
          {isDocx && isLocalhost ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-900">
               <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-3xl shadow-sm flex items-center justify-center text-blue-500 mb-6 relative overflow-hidden">
                  <FileText size={48} strokeWidth={1.5} />
                  <div className="absolute bottom-3 right-3 text-[10px] font-extrabold bg-blue-100 px-1.5 py-0.5 rounded text-blue-700">DOCX</div>
               </div>
               <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-3">Limitasi Environment Lokal</h3>
               <p className="text-sm text-slate-500 max-w-md mb-8 leading-relaxed">
                 Server simulasi lokal (<strong>localhost</strong>) tidak dapat diakses oleh layanan Microsoft Word Viewer secara langsung dari internet. File PDF dapat dilihat, namun file Microsoft Word sementara akan diunduh terlebih dahulu pada mode pengembang.
               </p>
               <a 
                 href={fullUrl} 
                 download
                 className="flex items-center gap-2 px-8 py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
               >
                 <Download size={20} />
                 Unduh Dokumen Berformat DOCX
               </a>
            </div>
          ) : (
            <>
              <div className="absolute inset-0 flex items-center justify-center text-slate-300 pointer-events-none">
                 <div className="flex flex-col items-center gap-3">
                    <Loader2 size={32} className="animate-spin text-primary/30" />
                    <p className="text-xs font-bold uppercase tracking-widest opacity-50">Memuat berkas amanah...</p>
                 </div>
              </div>
              <iframe 
                src={viewerUrl} 
                className="w-full h-full border-none relative z-10 bg-white"
                title={title}
              />
            </>
          )}
        </div>

        {/* Footer / Info */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
           <p className="text-[10px] text-slate-400 font-medium">Hanya untuk keperluan internal DSN-MUI Amanah.</p>
           <div className="flex items-center gap-1.5 overflow-hidden">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">Verified Protocol</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentReader;
