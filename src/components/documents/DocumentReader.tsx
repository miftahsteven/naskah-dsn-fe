"use client";

import React from "react";
import { X, ExternalLink, Download, FileText, Loader2 } from "lucide-react";
import { getBaseUrl } from "@/lib/api";

interface DocumentReaderProps {
  title: string;
  fileUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

const DocumentReader: React.FC<DocumentReaderProps> = ({ title, fileUrl, isOpen, onClose }) => {
  const [htmlContent, setHtmlContent] = React.useState<string | null>(null);

  // Safely check properties to avoid errors when closed with empty props
  const safeFileUrl = fileUrl || "";
  const safeTitle = title || "";

  const BASE_URL = getBaseUrl();
  const fullUrl = safeFileUrl.startsWith("http://") || safeFileUrl.startsWith("https://")
    ? safeFileUrl
    : `${BASE_URL}/${safeFileUrl.startsWith("/") ? safeFileUrl.slice(1) : safeFileUrl}`;

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  let fullUrlWithToken = fullUrl;
  if (token && (fullUrl.startsWith("http://") || fullUrl.startsWith("https://"))) {
    const separator = fullUrl.includes('?') ? '&' : '?';
    fullUrlWithToken = `${fullUrl}${separator}token=${encodeURIComponent(token)}`;
  }

  const isDocx = safeTitle.toLowerCase().endsWith('.docx') || safeTitle.toLowerCase().endsWith('.doc') || safeFileUrl.toLowerCase().endsWith('.docx') || safeFileUrl.toLowerCase().endsWith('.doc');
  const isHtml = safeTitle.toLowerCase().endsWith('.html') || safeFileUrl.toLowerCase().endsWith('.html');
  const isPdf = safeTitle.toLowerCase().endsWith('.pdf') || safeFileUrl.toLowerCase().endsWith('.pdf');
  const isLocalhost = fullUrl.includes('localhost') || fullUrl.includes('127.0.0.1');

  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);
  const [pdfComponents, setPdfComponents] = React.useState<{ Document?: any; Page?: any } | null>(null);
  const [pdfNumPages, setPdfNumPages] = React.useState<number>(0);
  const [pdfPage, setPdfPage] = React.useState<number>(1);
  const [pdfScale, setPdfScale] = React.useState<number>(1.0);

  React.useEffect(() => {
    if (isOpen && isHtml && fullUrl) {
      setHtmlContent(null);

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      fetch(fullUrl, { headers })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.text();
        })
        .then(text => setHtmlContent(text))
        .catch(err => console.error("Failed to load HTML:", err));
    }
  }, [isOpen, isHtml, fullUrl, token]);

  // Try converting DOCX to HTML in-browser using mammoth (if available).
  React.useEffect(() => {
    if (!(isOpen && isDocx && fullUrl)) return undefined;

    let cancelled = false;

    setHtmlContent(null);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(fullUrl, { headers })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then(async (arrayBuffer) => {
        if (cancelled) return;
        try {
          const mammoth = await import('mammoth');
          const result = await mammoth.convertToHtml({ arrayBuffer });
          if (cancelled) return;
          setHtmlContent(result.value);
        } catch (err) {
          console.warn('DOCX conversion failed or mammoth not available, falling back to viewer:', err);
        }
      })
      .catch(err => console.error('Failed to fetch DOCX for conversion:', err));

    return () => {
      cancelled = true;
      setHtmlContent(null);
    };
  }, [isOpen, isDocx, fullUrl, token]);

  // Fetch PDF as blob when protected by auth or to avoid CORS issues; create object URL for iframe
  React.useEffect(() => {
    if (!(isOpen && isPdf && fullUrl)) return undefined;

    let cancelled = false;
    let objectUrl: string | null = null;

    setBlobUrl(null);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(fullUrl, { headers })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then(blob => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
        // dynamic import react-pdf and set worker
        import('react-pdf').then((m) => {
          try {
            // set worker to CDN fallback
            m.pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@latest/build/pdf.worker.min.js';
          } catch (e) {}
          setPdfComponents({ Document: m.Document, Page: m.Page });
        }).catch(err => {
          console.warn('react-pdf not available, falling back to iframe', err);
        });
      })
      .catch(err => console.error("Failed to load PDF:", err));

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      setBlobUrl(null);
    };
  }, [isOpen, isPdf, fullUrl, token]);

  if (!isOpen) return null;

  // Use Google Docs viewer or Microsoft Office Online Viewer for Office documents
  // Note: These public viewer APIs require the file URL to be publicly accessible from the internet.
  const viewerUrl = isDocx
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fullUrlWithToken)}`
    : fullUrlWithToken;

  const PdfDoc = pdfComponents?.Document;
  const PdfPage = pdfComponents?.Page;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-4 md:p-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Reader Container */}
      <div className="relative w-full h-full max-w-6xl bg-white dark:bg-slate-950 rounded-none sm:rounded-[32px] flex flex-col shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden">

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
              href={fullUrlWithToken}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
              title="Open in new tab"
            >
              <ExternalLink size={20} />
            </a>
            {isHtml ? (
              <button
                onClick={() => {
                  const iframe = document.getElementById('document-iframe') as HTMLIFrameElement;
                  if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.focus();
                    iframe.contentWindow.print();
                  }
                }}
                className="p-2.5 text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                title="Cetak / Simpan ke PDF"
              >
                <Download size={20} />
              </button>
            ) : (
              <button
                onClick={async () => {
                  try {
                    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
                    const headers: Record<string, string> = {};
                    if (token) {
                      headers['Authorization'] = `Bearer ${token}`;
                    }
                    const res = await fetch(fullUrl, { headers });
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', title);
                    document.body.appendChild(link);
                    link.click();
                    link.parentNode?.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  } catch (err) {
                    console.error("Gagal mendownload berkas:", err);
                    alert("Gagal mendownload berkas");
                  }
                }}
                className="p-2.5 text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                title="Download file"
              >
                <Download size={20} />
              </button>
            )}
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
              {((isHtml && htmlContent === null) || (isPdf && blobUrl === null)) && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-300 pointer-events-none">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={32} className="animate-spin text-primary/30" />
                    <p className="text-xs font-bold uppercase tracking-widest opacity-50">Memuat berkas amanah...</p>
                  </div>
                </div>
              )}
              {isPdf && PdfDoc && PdfPage && blobUrl ? (
                <div className="w-full h-full relative z-10 bg-white flex flex-col">
                  <div className="flex items-center justify-end gap-2 p-2 z-20">
                    <button
                      onClick={() => setPdfPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1 bg-slate-100 rounded"
                      title="Prev page"
                    >◀</button>
                    <div className="text-xs font-bold px-2">{pdfPage} / {pdfNumPages || '?'}</div>
                    <button
                      onClick={() => setPdfPage(p => Math.min(pdfNumPages || p + 1, p + 1))}
                      className="px-3 py-1 bg-slate-100 rounded"
                      title="Next page"
                    >▶</button>
                    <div className="w-px h-6 bg-slate-100 mx-1" />
                    <button onClick={() => setPdfScale(s => Math.max(0.25, s - 0.25))} className="px-2 py-1 bg-slate-100 rounded" title="Zoom out">-</button>
                    <div className="text-xs px-2">{Math.round(pdfScale * 100)}%</div>
                    <button onClick={() => setPdfScale(s => Math.min(4, s + 0.25))} className="px-2 py-1 bg-slate-100 rounded" title="Zoom in">+</button>
                  </div>
                  <div className="flex-1 overflow-auto flex items-center justify-center p-4">
                    <PdfDoc file={blobUrl} onLoadSuccess={(d:any) => { setPdfNumPages(d.numPages); setPdfPage(1); }}>
                      <PdfPage pageNumber={pdfPage} scale={pdfScale} />
                    </PdfDoc>
                  </div>
                </div>
              ) : (
                <iframe
                  id="document-iframe"
                  src={isHtml ? undefined : (isPdf ? (blobUrl || viewerUrl) : viewerUrl)}
                  srcDoc={isHtml ? (htmlContent || "") : undefined}
                  className="w-full h-full border-none relative z-10 bg-white"
                  title={title}
                />
              )}
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
