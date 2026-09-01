"use client";

import React from "react";
import { X, ExternalLink, Download, FileText, Loader2 } from "lucide-react";
import { getBaseUrl } from "@/lib/api";

const HTML_PDF_PRIMARY_COLOR = '#2563eb';

interface DocumentReaderProps {
  title: string;
  fileUrl: string;
  docId?: string;
  isOpen: boolean;
  onClose: () => void;
}

const DocumentReader: React.FC<DocumentReaderProps> = ({ title, fileUrl, docId, isOpen, onClose }) => {
  const [htmlContent, setHtmlContent] = React.useState<string | null>(null);
  const [htmlContentWithSignatures, setHtmlContentWithSignatures] = React.useState<string | null>(null);

  const [kopSuratBase64, setKopSuratBase64] = React.useState<string>("");
  const [bismillahBase64, setBismillahBase64] = React.useState<string>("");
  const [logoBase64, setLogoBase64] = React.useState<string>("");
  const [wqaUkasBase64, setWqaUkasBase64] = React.useState<string>("");

  React.useEffect(() => {
    const toDataURL = (url: string): Promise<string> =>
      fetch(url)
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.blob();
        })
        .then(
          (blob) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            })
        );

    toDataURL("/images/kop-surat.png")
      .then(b64 => setKopSuratBase64(b64))
      .catch(err => console.warn("Failed to convert kop-surat to base64", err));
    toDataURL("/images/bismillah.svg")
      .then(b64 => setBismillahBase64(b64))
      .catch(err => console.warn("Failed to convert bismillah to base64", err));
    toDataURL("/images/logo-dsn.png")
      .then(b64 => setLogoBase64(b64))
      .catch(err => console.warn("Failed to convert logo to base64", err));
    toDataURL("/images/wqa-ukas.png")
      .then(b64 => setWqaUkasBase64(b64))
      .catch(err => console.warn("Failed to convert wqa-ukas to base64", err));
  }, []);

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
        const workflowInstances = json?.data?.workflowInstances || json?.data?.workflow || [];
        const instancesList = Array.isArray(workflowInstances) ? workflowInstances : [workflowInstances];
        
        // Find penandatangan userIds from workflow steps
        const penandatanganUserIds: string[] = [];
        instancesList.forEach((wf: any) => {
          (wf?.steps || []).forEach((st: any) => {
            if (!st.roleId || st.roleId === 'PENANDATANGAN' || st.role === 'PENANDATANGAN') {
              if (st.userId) penandatanganUserIds.push(String(st.userId));
            }
          });
        });

        const rows: any[] = [];

        signatures
          .filter((s: any) => s.signedAt && (penandatanganUserIds.length === 0 || penandatanganUserIds.includes(String(s.userId))))
          .forEach((s: any) => {
            rows.push({
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
            });
          });

        // Also check approved workflow steps as fallback signatures (PENANDATANGAN only)
        instancesList.forEach((wf: any) => {
          (wf?.steps || []).forEach((st: any) => {
            const isPenandatangan = !st.roleId || st.roleId === 'PENANDATANGAN' || st.role === 'PENANDATANGAN';
            if ((st.status === 'APPROVED' || st.status === 'SIGNED') && st.userId && isPenandatangan) {
              const exists = rows.some(r => r.userId === String(st.userId));
              if (!exists) {
                const signedDate = st.actionedAt || st.updatedAt || new Date();
                rows.push({
                  id: String(st.id),
                  userId: String(st.userId),
                  fullName: st.user?.fullName || 'Penandatangan',
                  jobTitle: st.user?.jobTitle || 'Penandatangan',
                  signedAt: new Date(signedDate).toLocaleString('id-ID', {
                    timeZone: 'Asia/Jakarta',
                    dateStyle: 'long',
                    timeStyle: 'short',
                  }),
                  payload: JSON.stringify({
                    signatureId: st.id,
                    documentId: json?.data?.id,
                    userId: st.userId,
                    signedAt: signedDate,
                    fullName: st.user?.fullName,
                  }),
                });
              }
            }
          });
        });

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

    if (htmlContent.includes('qr-signature-img') || htmlContent.includes('alt="QR Signature"')) {
      let cleaned = htmlContent.replace(/margin:\s*-12px\s+0\s+4px\s+0/gi, 'margin: 4px 0 4px 0');
      cleaned = cleaned.replace(/margin:\s*-?\d+px\s+0\s+\d+px\s+0\s*!important/gi, 'margin: 4px 0 4px 0 !important');
      setHtmlContentWithSignatures(cleaned);
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
    signatureRows.forEach((row, rowIndex) => {
      const qrDataUrl = signatureQrMap[row.id];
      if (!qrDataUrl) return;

      const signerIndex = penandatanganSteps.length > 0
        ? penandatanganSteps.findIndex((st: any) => st.userId === row.userId)
        : rowIndex;

      // Build comprehensive candidates list for matching
      const candidates: string[] = [];
      if (row.fullName) {
        candidates.push(row.fullName);
        const cleanName = row.fullName
          .replace(/\b(Dr|K\.?H|Prof|Drs|H|Lc|Ph\.?D|M\.?A|S\.?H|M\.?Si|Ir|M\.?Ag|S\.?Ag|S\.?E)\b\.?/gi, '')
          .replace(/[\s,.]+/g, ' ')
          .trim();
        if (cleanName && cleanName.length >= 3) {
          candidates.push(cleanName);
        }
      }
      if (templateVariables) {
        if (signerIndex === 0 && templateVariables.namaKetua) candidates.push(templateVariables.namaKetua);
        if (signerIndex === 1 && templateVariables.namaSekretaris) candidates.push(templateVariables.namaSekretaris);
        if (templateVariables.namaPenandatangan) candidates.push(templateVariables.namaPenandatangan);
      }
      // DSN-MUI official name fallbacks
      const userLower = (row.fullName || '').toLowerCase();
      if (signerIndex === 0 || userLower.includes('cholil') || userLower.includes('nafis') || userLower.includes('hasan') || userLower.includes('ketua')) {
        candidates.push("CHOLIL NAFIS");
        candidates.push("HASANUDDIN");
      } else if (signerIndex === 1 || userLower.includes('amirsyah') || userLower.includes('tambunan') || userLower.includes('anwar') || userLower.includes('sekretaris')) {
        candidates.push("AMIRSYAH TAMBUNAN");
        candidates.push("ANWAR ABBAS");
      }

      let bestMatch: { m: RegExpExecArray, cand: string, score: number, index: number } | null = null;

      for (const cand of candidates) {
        const tokens = cand
          .split(/[\s,.]+/)
          .filter((t: string) => t.length >= 3 && !/^(dr|kh|prof|drs|h|lc|phd|ma|sh|mag|msi|ir|se|ag)$/i.test(t));
        if (tokens.length > 0) {
          const patternStr = tokens.map((t: string) => escapeRegExp(t)).join('[\\s\\S]{0,80}?');
          const nameRegex = new RegExp(patternStr, 'gi');
          let m: RegExpExecArray | null;

          while ((m = nameRegex.exec(enhanced)) !== null) {
            const prefix = enhanced.substring(0, m.index);
            
            if (prefix.lastIndexOf('<script') > prefix.lastIndexOf('</script>') ||
                prefix.lastIndexOf('<style') > prefix.lastIndexOf('</style>')) {
              continue;
            }

            const wideSlice = prefix.slice(Math.max(0, prefix.length - 600));
            const closeSlice = prefix.slice(Math.max(0, prefix.length - 200));

            let score = 0;
            if (/Lampiran\s+[0-9I|IVX]+/i.test(prefix)) score -= 100;
            if (/Wakil\s*(?:Ketua|Sekretaris)\s*:/i.test(wideSlice)) score -= 100;
            if (/:\s*(<[^>]+>\s*)*$/.test(closeSlice) || /:\s*$/.test(prefix.trim())) score -= 100;
            if (/<li[^>]*>/i.test(closeSlice) && !/<\/li>/i.test(closeSlice)) score -= 50;
            if (/<blockquote/i.test(closeSlice) && !/<\/blockquote>/i.test(closeSlice)) score -= 50;

            if (/(?:Ketua|Sekretaris|Direktur|Pimpinan|Kepala|Menyetujui|Mengetahui|Ketum|Sekjen)/i.test(wideSlice)) score += 30;
            if (/(?:<br\s*\/?>\s*){2,}/i.test(wideSlice)) score += 15;
            if (/margin-bottom:\s*\d{2,}px/i.test(wideSlice)) score += 25;
            if (/<div[^>]*style="[^"]*height:\s*\d{2,}px/i.test(wideSlice)) score += 25;
            if (/<!--\s*QR_CODE_TTE_PLACEHOLDER\s*-->/i.test(wideSlice)) score += 30;

            if (row.jobTitle) {
              const rRegex = new RegExp(escapeRegExp(row.jobTitle), 'i');
              if (rRegex.test(wideSlice)) score += 20;
            }

            if (!bestMatch || score > bestMatch.score) {
              bestMatch = { m, cand, score, index: m.index };
            }
          }
        }
      }

      const qrImageHtml = `<div style="text-align:left; margin:4px 0 4px 0; line-height:1; display:block; position:relative; width:60px; height:60px;"><img src="${qrDataUrl}" alt="QR Signature" class="qr-signature-img" style="width:60px !important; height:60px !important; min-width:60px !important; min-height:60px !important; object-fit:contain !important; display:block !important; position:absolute; top:0; left:0; z-index:1;" /><img src="${BASE_URL}/images/logo-dsn.png" alt="Logo" style="width:16px !important; height:16px !important; position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); z-index:2; background:#fff; border-radius:50%; padding:2px; object-fit:contain; border:1px solid #1F3F23;" /></div>`;

      if (bestMatch && bestMatch.score > 0) {
        const matchIndex = bestMatch.m.index;
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
        let suffix = enhanced.substring(targetIndex);
        suffix = suffix.replace(/^([^>]+style="[^"]*)(?:margin-top|padding-top):\s*\d+px;?/i, "$1margin-top: 2px;");

        const sliceLen = Math.min(600, realPrefix.length);
        const prefixBase = realPrefix.slice(0, realPrefix.length - sliceLen);
        const lastSlice = realPrefix.slice(realPrefix.length - sliceLen);

        if (lastSlice.includes('qr-signature-img')) {
          return;
        }

        if (/(<div[^>]*style="[^"]*height:\s*\d+px[^"]*"[^>]*>\s*<\/div>)/gi.test(lastSlice)) {
          const updatedSlice = lastSlice.replace(/(<div[^>]*style="[^"]*height:\s*\d+px[^"]*"[^>]*>\s*<\/div>)/gi, qrImageHtml);
          enhanced = prefixBase + updatedSlice + suffix;
        } else if (/<!--\s*QR_CODE_TTE_PLACEHOLDER\s*-->/gi.test(lastSlice)) {
          const updatedSlice = lastSlice.replace(/<!--\s*QR_CODE_TTE_PLACEHOLDER\s*-->/gi, qrImageHtml);
          enhanced = prefixBase + updatedSlice + suffix;
        } else if (/margin-bottom:\s*\d+px/i.test(lastSlice)) {
          const updatedSlice = lastSlice.replace(/margin-bottom:\s*\d+px/gi, 'margin-bottom: 4px');
          enhanced = prefixBase + updatedSlice + qrImageHtml + suffix;
        } else {
          const lastBrMatches = [...lastSlice.matchAll(/(?:<br\s*\/?>\s*){2,}/gi)];
          if (lastBrMatches.length > 0) {
            const lastBrMatch = lastBrMatches[lastBrMatches.length - 1];
            if (lastBrMatch && typeof lastBrMatch.index === 'number') {
              const bPrefix = lastSlice.substring(0, lastBrMatch.index);
              const bSuffix = lastSlice.substring(lastBrMatch.index + lastBrMatch[0].length);
              const updatedSlice = bPrefix + qrImageHtml + bSuffix;
              enhanced = prefixBase + updatedSlice + suffix;
            } else {
              enhanced = realPrefix + qrImageHtml + suffix;
            }
          } else {
            enhanced = realPrefix + qrImageHtml + suffix;
          }
        }
      } else {
        // Safe Role-based Fallback
        const isKetua = signerIndex === 0 || /ketua|ketum/i.test(row.jobTitle || '') || /cholil|nafis/i.test((candidates || []).join(' '));
        const targetRole = isKetua ? '(?:Ketua|Menyetujui|Ketum)' : '(?:Sekretaris|Mengetahui|Sekjen)';

        const lampiranMatch = enhanced.match(/Lampiran\s+[0-9I|IVX]+/i);
        const lampiranIndex = lampiranMatch ? lampiranMatch.index : -1;
        const searchContent = lampiranIndex !== -1 ? enhanced.substring(0, lampiranIndex) : enhanced;

        const roleRegex = new RegExp(`(${targetRole}\\s*,?\\s*(?:<[^>]+>|\\s)*?)(?:<div[^>]*style="[^"]*height:[^"]*"[^>]*>\\s*<\\/div>|(?:<br\\s*\\/?>\\s*){2,})`, 'i');
        const roleMatch = roleRegex.exec(searchContent);
        if (roleMatch) {
          const idx = roleMatch.index;
          const matchLen = roleMatch[0].length;
          const p = enhanced.substring(0, idx);
          const s = enhanced.substring(idx + matchLen);
          enhanced = p + roleMatch[1] + qrImageHtml + s;
        }
      }
    });

    // Inject CSS rules to scale down large logo images in the letterhead and guarantee QR code display
    const imageStyle = `
      <style id="amanah-kop-styles">
        .kop-surat img:not(.kop-surat-img):not([alt*="Kop Surat"]):not([alt*="Bismillah"]):not([src*="bismillah"]):not(.bismillah-img), 
        td img:not(.qr-signature-img):not(.kop-surat-img):not([alt*="Kop Surat"]):not([alt*="Bismillah"]):not([src*="bismillah"]):not(.bismillah-img) {
          max-width: 75px !important;
          max-height: 90px !important;
          height: auto !important;
          width: auto !important;
          display: inline-block !important;
          vertical-align: middle !important;
        }
        .kop-surat-img, img[alt*="Kop Surat"] {
          width: 100% !important;
          max-width: 750px !important;
          height: auto !important;
          display: block !important;
          margin: 0 auto !important;
        }
        img[src*="bismillah"], img[alt*="Bismillah"], .bismillah-img {
          width: 260px !important;
          max-width: 45% !important;
          height: auto !important;
          max-height: 48px !important;
          display: block !important;
          margin: 8px auto 14px auto !important;
          object-fit: contain !important;
          filter: brightness(0) !important;
        }
        img.qr-signature-img {
          width: 60px !important;
          height: 60px !important;
          max-width: 60px !important;
          max-height: 60px !important;
          min-width: 60px !important;
          min-height: 60px !important;
          display: inline-block !important;
          object-fit: contain !important;
        }
        div[style*="width: 60px"][style*="height: 60px"],
        div[style*="width: 70px"][style*="height: 70px"] {
          margin: 4px 0 4px 0 !important;
          width: 60px !important;
          height: 60px !important;
        }
        /* Master Print Layout Table */
        table.master-page-table {
          width: 100% !important;
          border-collapse: collapse !important;
          border: none !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        table.master-page-table > tbody > tr > td {
          padding: 0 !important;
          border: none !important;
          vertical-align: top !important;
        }
        table.master-page-table > tfoot > tr > td {
          height: 20mm !important;
          padding: 0 !important;
          border: none !important;
        }
        /* Eliminate unwanted horizontal lines / borders on page break sections */
        hr { display: none !important; }
        div[style*="border-top: 1px solid #000000"],
        div[style*="border-top:1px solid #000000"],
        div[style*="border-top: 1px solid black"],
        div[style*="border-top:1px solid black"],
        div[style*="border-top: 1px solid #000"],
        div[style*="border-top:1px solid #000"] {
          border-top: none !important;
          padding-top: 0 !important;
        }
        /* Official TTE Footer */
        @media screen {
          body {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
          }
          .master-page-table {
            max-width: 750px !important;
            margin: 0 auto !important;
            padding: 20px 30px !important;
            background: #ffffff !important;
            box-shadow: 0 2px 10px rgba(0,0,0,0.06);
            box-sizing: border-box !important;
            order: 1 !important;
          }
          .amanah-letter-footer {
            display: table !important;
            order: 2 !important;
            width: 100% !important;
            max-width: 750px !important;
            margin: 16px auto 20px auto !important;
            padding: 0 30px !important;
            box-sizing: border-box !important;
          }
        }
        @media print {
          .master-page-table {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
          }
          tfoot {
            display: table-footer-group !important;
          }
          .amanah-letter-footer {
            display: table !important;
            position: fixed !important;
            bottom: 4mm !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            background: #ffffff !important;
            z-index: 99999 !important;
          }
        }
      </style>
    `;
    if (enhanced.includes('</head>')) {
      enhanced = enhanced.replace('</head>', `${imageStyle}\n</head>`);
    } else {
      enhanced = `<head>${imageStyle}</head>${enhanced}`;
    }

    setHtmlContentWithSignatures(enhanced);
  }, [isHtml, htmlContent, signatureRows, signatureQrMap]);

  React.useEffect(() => {
    if (isOpen && isHtml) {
      setHtmlContent(null);

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Extract document ID from docId prop or builtUrl API path
      const extractedDocId = docId 
        || builtUrl.match(/\/api\/documents\/([^/?]+)/)?.[1];

      const targetFetchUrl = (extractedDocId && !extractedDocId.startsWith('file-')) 
        ? `${BASE_URL}/api/documents/${encodeURIComponent(extractedDocId)}/render`
        : htmlPreviewUrl;

      if (!targetFetchUrl) return;

      fetch(targetFetchUrl, { headers })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.text();
        })
        .then(text => {
          const FOOTER_HTML = `<table class="amanah-letter-footer" style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif;">
    <tr>
      <td style="vertical-align: middle; text-align: left; padding: 4px 10px 4px 0; font-size: 7.5pt; line-height: 1.25; font-style: italic; color: #1f2937; border-top: 1px solid #e5e7eb;">
        Dokumen ini telah ditandatangani secara elektronik oleh Sistem Digital Amanah dibawah otoritas Dewan Syariah Nasional-Majelis Ulama Indonesia. Untuk memastikan keaslian tanda tangan elektronik, silahkan pindai QR-Code
      </td>
      <td style="vertical-align: middle; text-align: right; width: 32px; padding: 4px 0; border-top: 1px solid #e5e7eb;">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle;">
          <path d="M16 2L5 6.5V14.5C5 21.2 9.7 27.5 16 29.5C22.3 27.5 27 21.2 27 14.5V6.5L16 2Z" fill="#006633" stroke="#004D26" stroke-width="1.5" stroke-linejoin="round"/>
          <circle cx="16" cy="16" r="8.5" fill="#006633" stroke="#ffffff" stroke-width="1" stroke-dasharray="2 1.5"/>
          <path d="M12 16L14.8 18.8L20.5 13" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </td>
    </tr>
  </table>`;

          let processed = text;
          if (kopSuratBase64) {
            processed = processed.replace(/src=["'][^"']*kop-surat\.png["']/gi, `src="${kopSuratBase64}" class="kop-surat-img"`);
            processed = processed.replace(/(\\?\${HEADER_HTML}|\${HEADER_HTML})/g, `<div style="text-align: center; margin-bottom: 4px; margin-left: 0; margin-right: 0; padding-top: 0;">
    <img src="${kopSuratBase64}" alt="Kop Surat DSN-MUI" class="kop-surat-img" style="width: 100%; max-width: 100%; height: auto; display: block; margin: 0 auto;" />
  </div>
  <div style="text-align: center; margin-top: 8px; margin-bottom: 14px;">
    <img src="${bismillahBase64 || '/images/bismillah.svg'}" alt="Bismillah" style="width: 260px; max-width: 45%; height: auto; max-height: 48px; object-fit: contain; filter: brightness(0); display: block; margin: 8px auto 14px auto;" />
  </div>`);
          }
          processed = processed.replace(/border-top:\s*1px\s*solid\s*#000000;?/gi, 'border-top: none;');
          processed = processed.replace(/border-top:\s*1px\s*solid\s*black;?/gi, 'border-top: none;');
          processed = processed.replace(/border-top:\s*1px\s*solid\s*#000;?/gi, 'border-top: none;');
          processed = processed.replace(/<table class="amanah-letter-footer"[\s\S]*?<\/table>/gi, '');
          processed = processed.replace(/(\\?\${FOOTER_HTML}|\${FOOTER_HTML})/g, '');
          if (bismillahBase64) {
            processed = processed.replace(/src=["'][^"']*bismillah\.svg["']/gi, `src="${bismillahBase64}"`);
          }
          if (logoBase64) {
            processed = processed.replace(/src=["'][^"']*logo-dsn\.png["']/gi, `src="${logoBase64}"`);
          }
          if (wqaUkasBase64) {
            processed = processed.replace(/src=["'][^"']*wqa-ukas\.png["']/gi, `src="${wqaUkasBase64}"`);
          }
          processed = processed.replace(/(<img[^>]*(?:bismillah|Bismillah)[^>]*style=["'])([^"']*)(["'])/gi, (match, p1, p2, p3) => {
            let cleanStyle = p2.replace(/height:\s*[^;]+;?/gi, '').replace(/max-height:\s*[^;]+;?/gi, '').replace(/width:\s*[^;]+;?/gi, '').replace(/max-width:\s*[^;]+;?/gi, '').trim();
            return `${p1}${cleanStyle ? cleanStyle + '; ' : ''}width: 260px; max-width: 45%; height: auto; max-height: 48px; margin: 8px auto 14px auto;${p3}`;
          });
          processed = processed.replace(
            /(<!--\s*SALAM\s*PENUTUP\s*-->[\s\S]*?<p[^>]*>)\s*[Aa]ssalamu([’'‘`]?alaikum\s+Warahmatullah\s+Wabarakatuh[\.,]?)\s*(<\/p>)/gi,
            '$1Wassalamu’alaikum Warahmatullah Wabarakatuh.$3'
          );
          processed = processed.replace(
            /(<p[^>]*>)\s*[Aa]ssalamu([’'‘`]?alaikum\s+Warahmatullah\s+Wabarakatuh)\.\s*(<\/p>)/gi,
            '$1Wassalamu’alaikum Warahmatullah Wabarakatuh.$3'
          );
          processed = processed.replace(/font-size:\s*11pt/gi, 'font-size: 10.5pt');

          // Extract body content and wrap in master-page-table
          let headPart = '';
          let bodyInner = processed;
          if (processed.includes('<body')) {
            const headEnd = processed.indexOf('<body');
            headPart = processed.substring(0, headEnd);
            const bodyStart = processed.indexOf('>', headEnd) + 1;
            const bodyEnd = processed.lastIndexOf('</body>');
            bodyInner = processed.substring(bodyStart, bodyEnd !== -1 ? bodyEnd : undefined);
          }

          if (bodyInner.includes('master-page-table')) {
            bodyInner = bodyInner
              .replace(/<table class="master-page-table"[\s\S]*?<tbody>\s*<tr>\s*<td>/gi, '')
              .replace(/<\/td>\s*<\/tr>\s*<\/tbody>\s*<tfoot>[\s\S]*?<\/tfoot>\s*<\/table>/gi, '');
          }

          const wrappedBody = `
          ${FOOTER_HTML}
          <table class="master-page-table">
            <tbody>
              <tr>
                <td>
                  ${bodyInner}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td>
                  <div style="height: 20mm;"></div>
                </td>
              </tr>
            </tfoot>
          </table>
          `;

          if (headPart) {
            processed = `${headPart}<body>\n${wrappedBody}\n</body>\n</html>`;
          } else {
            processed = `${wrappedBody}`;
          }

          setHtmlContent(processed);
        })
        .catch(err => console.error("Failed to load HTML:", err));
    }
  }, [isOpen, isHtml, htmlPreviewUrl, docId, builtUrl, BASE_URL, token, kopSuratBase64, bismillahBase64, logoBase64, wqaUkasBase64]);

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
