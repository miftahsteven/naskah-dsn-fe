"use client";

import React from "react";
import { X, ExternalLink, Download, FileText, Loader2 } from "lucide-react";
import { getBaseUrl } from "@/lib/api";

const HTML_PDF_PRIMARY_COLOR = '#2563eb';

interface DocumentReaderProps {
  title: string;
  fileUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

const DocumentReader: React.FC<DocumentReaderProps> = ({ title, fileUrl, isOpen, onClose }) => {
  const [htmlContent, setHtmlContent] = React.useState<string | null>(null);
  const [htmlContentWithSignatures, setHtmlContentWithSignatures] = React.useState<string | null>(null);

  // Safely check properties to avoid errors when closed with empty props
  const safeFileUrl = fileUrl || "";
  const safeTitle = title || "";

  const BASE_URL = getBaseUrl();
  const builtUrl = safeFileUrl.startsWith("http://") || safeFileUrl.startsWith("https://")
    ? safeFileUrl
    : `${BASE_URL}/${safeFileUrl.startsWith("/") ? safeFileUrl.slice(1) : safeFileUrl}`;
  const [resolvedUrl, setResolvedUrl] = React.useState<string | null>(null);
  const [resolvedMimeType, setResolvedMimeType] = React.useState<string | null>(null);
  const fullUrl = resolvedUrl || builtUrl;

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const isDetailEndpoint = builtUrl.includes('/api/documents/') && !builtUrl.endsWith('/download');
  const directUrl = isDetailEndpoint ? resolvedUrl : fullUrl;
  const effectiveUrl = directUrl || fullUrl;
  const urlForType = safeTitle || effectiveUrl || safeFileUrl;
  const lowerUrlForType = urlForType.toLowerCase();
  const isDocx = resolvedMimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    || resolvedMimeType === 'application/msword'
    || lowerUrlForType.endsWith('.docx')
    || lowerUrlForType.endsWith('.doc');
  const isHtml = resolvedMimeType === 'text/html'
    || lowerUrlForType.endsWith('.html')
    || lowerUrlForType.endsWith('.htm');
  const isPdf = resolvedMimeType === 'application/pdf' || lowerUrlForType.endsWith('.pdf');
  const isLocalhost = (effectiveUrl || '').includes('localhost') || (effectiveUrl || '').includes('127.0.0.1');

  let fullUrlWithToken = effectiveUrl;
  if (token && effectiveUrl && (effectiveUrl.startsWith("http://") || effectiveUrl.startsWith("https://"))) {
    const separator = effectiveUrl.includes('?') ? '&' : '?';
    fullUrlWithToken = `${effectiveUrl}${separator}token=${encodeURIComponent(token)}`;
  }

  const appendQueryParam = (url: string, key: string, value: string) => {
    if (!url) return url;
    return `${url}${url.includes('?') ? '&' : '?'}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  };

  const downloadFileName = isHtml
    ? `${safeTitle.replace(/[/\\?%*:|"<>]/g, '_').replace(/\.(html?|htm)$/i, '') || 'document'}.pdf`
    : safeTitle || 'document';

  const downloadUrl = isHtml ? appendQueryParam(fullUrlWithToken, 'pdf', '1') : fullUrlWithToken;
  const htmlPreviewUrl = isHtml ? appendQueryParam(fullUrlWithToken, 'preview', 'html') : fullUrlWithToken;

  const handleDownload = async (downloadUrl: string, filename: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(downloadUrl, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Gagal mendownload berkas:', err);
      alert('Gagal mendownload berkas');
    }
  };

  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);
  const [pdfComponents, setPdfComponents] = React.useState<{ Document?: any; Page?: any } | null>(null);
  const [pdfNumPages, setPdfNumPages] = React.useState<number>(0);
  const [pdfPage, setPdfPage] = React.useState<number>(1);
  const [pdfScale, setPdfScale] = React.useState<number>(1.0);
  const [signatureRows, setSignatureRows] = React.useState<Array<{
    id: string;
    userId: string;
    fullName: string;
    jobTitle: string;
    signedAt: string;
    payload: string;
  }>>([]);
  const [signatureQrMap, setSignatureQrMap] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    let cancelled = false;
    async function resolveDocFileUrl() {
      if (!builtUrl || !builtUrl.includes('/api/documents/')) return;

      try {
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const detailUrl = builtUrl.replace(/\/download$/, '');
        const res = await fetch(detailUrl, { headers });
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;

        const version = json?.data?.versions?.[0];
        const resolved = version?.fileUrl || json?.data?.fileUrl;
        const mimeType = version?.mimeType || json?.data?.mimeType;
        if (resolved) setResolvedUrl(resolved);
        if (mimeType) setResolvedMimeType(mimeType);
      } catch (err) {
        console.warn('Failed to resolve document detail to version URL:', err);
      }
    }
    resolveDocFileUrl();
    return () => { cancelled = true; };
  }, [builtUrl, token]);

  React.useEffect(() => {
    let cancelled = false;
    if (!builtUrl || !builtUrl.includes('/api/documents/')) return undefined;

    async function loadDocumentSignatures() {
      try {
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const detailUrl = builtUrl.replace(/\/download$/, '');
        const res = await fetch(detailUrl, { headers });
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;

        const signatures = json?.data?.signatures || [];
        const rows = signatures
          .filter((s: any) => s.signedAt)
          .map((s: any) => ({
            id: String(s.id),
            userId: String(s.userId),
            fullName: s.user?.fullName || 'Penandatangan',
            jobTitle: s.user?.jobTitle || 'Penandatangan',
            signedAt: new Date(s.signedAt).toLocaleString('id-ID', {
              timeZone: 'Asia/Jakarta',
              dateStyle: 'long',
              timeStyle: 'short',
            }),
            payload: JSON.stringify({
              signatureId: s.id,
              documentId: s.documentId,
              userId: s.userId,
              signedAt: s.signedAt,
              fullName: s.user?.fullName,
            }),
          }));

        setSignatureRows(rows);
      } catch (err) {
        console.warn('Failed to load document signatures for viewer:', err);
      }
    }

    loadDocumentSignatures();
    return () => { cancelled = true; };
  }, [builtUrl, token]);

  React.useEffect(() => {
    if (!signatureRows.length) {
      setSignatureQrMap({});
      return undefined;
    }

    let cancelled = false;
    async function generateSignatureQrs() {
      try {
        const qrcode = await import('qrcode');
        const results = await Promise.all(signatureRows.map((row) =>
          qrcode.toDataURL(row.payload, {
            margin: 1,
            width: 180,
            color: { dark: '#0f172a', light: '#ffffff' },
          })
        ));

        if (cancelled) return;

        const qrMap: Record<string, string> = {};
        signatureRows.forEach((row, index) => {
          qrMap[row.id] = results[index];
        });
        setSignatureQrMap(qrMap);
      } catch (err) {
        console.warn('Failed to generate signature QR codes:', err);
      }
    }

    generateSignatureQrs();
    return () => { cancelled = true; };
  }, [signatureRows]);

  React.useEffect(() => {
    if (!isHtml || !htmlContent) {
      setHtmlContentWithSignatures(null);
      return;
    }

    if (!signatureRows.length || Object.keys(signatureQrMap).length !== signatureRows.length) {
      setHtmlContentWithSignatures(htmlContent);
      return;
    }

    let enhanced = htmlContent;
    if (!/<!doctype html>/i.test(enhanced)) enhanced = `<!doctype html>\n${enhanced}`;

    const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Parse metadata from HTML
    let templateVariables: any = {};
    let penandatanganSteps: any[] = [];
    const metaMatch = enhanced.match(/<script id="template-metadata" type="application\/json">\s*([\s\S]*?)\s*<\/script>/);
    if (metaMatch) {
      try {
        const meta = JSON.parse(metaMatch[1] || '{}');
        templateVariables = meta.templateVariables || {};
        penandatanganSteps = (meta.steps || []).filter((st: any) => st.role === 'PENANDATANGAN');
      } catch (e) {
        console.warn("Failed to parse template metadata in reader:", e);
      }
    }

    // 1. Inject QR code into matching signature boxes in letter HTML
    signatureRows.forEach(row => {
      const qrDataUrl = signatureQrMap[row.id];
      if (!qrDataUrl) return;

      const signerIndex = penandatanganSteps.findIndex((st: any) => st.userId === row.userId);

      // Build candidates for matching
      const candidates: string[] = [];
      if (row.fullName) {
        candidates.push(row.fullName);
      }
      if (signerIndex !== -1 && templateVariables) {
        if (signerIndex === 0) {
          if (templateVariables.namaKetua) candidates.push(templateVariables.namaKetua);
          if (templateVariables.namaPenandatangan) candidates.push(templateVariables.namaPenandatangan);
        } else if (signerIndex === 1) {
          if (templateVariables.namaSekretaris) candidates.push(templateVariables.namaSekretaris);
        }
      }
      // Default fallback names
      if (signerIndex === 0 || (signerIndex === -1 && row.fullName?.toLowerCase().includes('admin'))) {
        candidates.push("CHOLIL NAFIS");
        candidates.push("HASANUDDIN");
      }
      if (signerIndex === 1) {
        candidates.push("AMIRSYAH TAMBUNAN");
        candidates.push("ANWAR ABBAS");
      }

      let match: RegExpExecArray | null = null;
      let matchedCandidate = "";

      for (const cand of candidates) {
        const tokens = cand
          .split(/[\s,.]+/)
          .filter((t: string) => t.length >= 3 && !/^(dr|kh|prof|drs|h|lc|phd|ma|sh|mag|msi|ir)$/i.test(t));
        if (tokens.length === 0) continue;

        const namePattern = tokens.map((t: string) => escapeRegExp(t)).join('(?:<[^>]+>|\\s|&nbsp;|&#160;)+');
        const nameRegex = new RegExp(namePattern, 'gi');
        match = nameRegex.exec(enhanced);
        if (match) {
          matchedCandidate = cand;
          break;
        }
      }

      if (match) {
        const matchIndex = match.index;
        const prefix = enhanced.substring(0, matchIndex);

        const lastOpenTagIndex = prefix.lastIndexOf('<');
        let targetIndex = matchIndex;
        if (lastOpenTagIndex !== -1) {
          const tagSub = prefix.substring(lastOpenTagIndex);
          if (/^<(div|p|u|b|strong|span)[^>]*>/i.test(tagSub)) {
            targetIndex = lastOpenTagIndex;
          }
        }

        const realPrefix = enhanced.substring(0, targetIndex);
        const suffix = enhanced.substring(targetIndex);

        const qrImageHtml = `<div style="text-align:center; margin:2px auto; line-height:0; display:block;"><img src="${qrDataUrl}" alt="QR Signature" style="width:65px; height:65px; object-fit:contain; display:inline-block;" /></div>`;

        const sliceLen = Math.min(300, realPrefix.length);
        const prefixBase = realPrefix.slice(0, realPrefix.length - sliceLen);
        const lastSlice = realPrefix.slice(realPrefix.length - sliceLen);

        if (/margin-bottom:\s*\d+px/i.test(lastSlice)) {
          const updatedSlice = lastSlice.replace(/margin-bottom:\s*\d+px/gi, 'margin-bottom: 4px');
          enhanced = prefixBase + updatedSlice + qrImageHtml + suffix;
        } else if (/(<div[^>]*style="[^"]*height:[^"]*"[^>]*>\s*<\/div>)/gi.test(lastSlice)) {
          const updatedSlice = lastSlice.replace(/(<div[^>]*style="[^"]*height:[^"]*"[^>]*>\s*<\/div>)/gi, qrImageHtml);
          enhanced = prefixBase + updatedSlice + suffix;
        } else if (/(?:<br\s*\/?>\s*){2,}/i.test(lastSlice)) {
          const updatedSlice = lastSlice.replace(/(?:<br\s*\/?>\s*){2,}/gi, qrImageHtml);
          enhanced = prefixBase + updatedSlice + suffix;
        } else {
          enhanced = realPrefix + qrImageHtml + suffix;
        }
      }
    });

    // Inject CSS rules to scale down large logo images in the letterhead
    const imageStyle = `
      <style id="amanah-kop-styles">
        .kop-surat img, td img, img[src^="data:image"] {
          max-width: 75px !important;
          max-height: 90px !important;
          height: auto !important;
          width: auto !important;
          display: inline-block !important;
          vertical-align: middle !important;
        }
      </style>
    `;
    if (enhanced.includes('</head>')) {
      enhanced = enhanced.replace('</head>', `${imageStyle}\n</head>`);
    } else {
      enhanced = imageStyle + enhanced;
    }

    setHtmlContentWithSignatures(enhanced);
  }, [isHtml, htmlContent, signatureRows, signatureQrMap]);

  React.useEffect(() => {
    if (isOpen && isHtml && htmlPreviewUrl) {
      setHtmlContent(null);

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      fetch(htmlPreviewUrl, { headers })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.text();
        })
        .then(text => setHtmlContent(text))
        .catch(err => console.error("Failed to load HTML:", err));
    }
  }, [isOpen, isHtml, htmlPreviewUrl, token]);

  // Try converting DOCX to HTML in-browser using mammoth (if available).
  React.useEffect(() => {
    if (!(isOpen && isDocx && directUrl)) return undefined;

    let cancelled = false;

    setHtmlContent(null);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(directUrl, { headers })
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
  }, [isOpen, isDocx, directUrl, token]);

  // Fetch PDF as blob when protected by auth or to avoid CORS issues; create object URL for iframe
  React.useEffect(() => {
    if (!(isOpen && isPdf && directUrl)) return undefined;

    let cancelled = false;
    let objectUrl: string | null = null;

    setBlobUrl(null);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(directUrl, { headers })
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
  }, [isOpen, isPdf, directUrl, token]);

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
            <button
              onClick={() => handleDownload(downloadUrl, downloadFileName)}
              className="p-2.5 text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
              title={isHtml ? 'Download HTML sebagai PDF' : 'Download file'}
            >
              <Download size={20} />
            </button>
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
          {signatureRows.length > 0 && (
            <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 z-10">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Penandatangan</p>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">QR Code Tanda Tangan</h3>
                </div>
                <span className="text-[11px] font-medium text-slate-400">Ditampilkan di viewer</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {signatureRows.map((row) => (
                  <div key={row.id} className="flex items-center gap-3 p-3 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden">
                      {signatureQrMap[row.id] ? (
                        <img src={signatureQrMap[row.id]} alt="QR Code" className="w-full h-full object-contain" />
                      ) : (
                        <div className="text-[10px] text-slate-400">Loading QR...</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{row.fullName}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{row.jobTitle}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{row.signedAt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
                href={effectiveUrl}
                download
                className="flex items-center gap-2 px-8 py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Download size={20} />
                Unduh Dokumen Berformat DOCX
              </a>
            </div>
          ) : (
            <>
              {((isHtml && htmlContent === null) || (isPdf && blobUrl === null) || (isDetailEndpoint && !directUrl)) && (
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
                  key={htmlContentWithSignatures || htmlContent || 'loading'}
                  id="document-iframe"
                  src={isHtml ? undefined : (isPdf ? (blobUrl || viewerUrl) : viewerUrl)}
                  srcDoc={isHtml ? (htmlContentWithSignatures || htmlContent || "") : undefined}
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
