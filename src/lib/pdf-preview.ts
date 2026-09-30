import { getAssetUrl } from "./utils";
import { getBaseUrl } from "./api";

export interface AttachmentImage {
  name: string;
  images: string[];
}

let pdfjsPromise: Promise<any> | null = null;

async function getPdfJs() {
  if (typeof window === "undefined") return null;
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      try {
        // @ts-ignore
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        if (pdfjs.GlobalWorkerOptions) {
          pdfjs.GlobalWorkerOptions.workerSrc = getAssetUrl("/pdf.worker.min.mjs");
        }
        return pdfjs;
      } catch (err) {
        console.warn("Failed to load pdfjs-dist legacy build, falling back:", err);
        // @ts-ignore
        const pdfjs = await import("pdfjs-dist/build/pdf.mjs");
        if (pdfjs.GlobalWorkerOptions) {
          pdfjs.GlobalWorkerOptions.workerSrc = getAssetUrl("/pdf.worker.min.mjs");
        }
        return pdfjs;
      }
    })();
  }
  return pdfjsPromise;
}

/**
 * Loads a PDF from a File, Blob, ArrayBuffer, Uint8Array, or URL string
 * and renders all its pages into high-resolution JPEG data URLs.
 */
export async function renderPdfToImageUrls(
  source: File | Blob | ArrayBuffer | Uint8Array | string,
  options?: {
    scale?: number;
    maxPages?: number;
    quality?: number;
  }
): Promise<string[]> {
  if (typeof window === "undefined" || !source) return [];

  const pdfjs = await getPdfJs();
  if (!pdfjs) return [];

  let arrayBuffer: ArrayBuffer;

  if (source instanceof File || source instanceof Blob) {
    arrayBuffer = await source.arrayBuffer();
  } else if (source instanceof ArrayBuffer) {
    arrayBuffer = source;
  } else if (source instanceof Uint8Array) {
    arrayBuffer = source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength) as ArrayBuffer;
  } else if (typeof source === "string") {
    if (source.startsWith("data:application/pdf;base64,")) {
      const base64Data = source.split(",")[1];
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      arrayBuffer = bytes.buffer;
    } else {
      const BASE_URL = getBaseUrl();
      const safeUrl = source.startsWith("http://") || source.startsWith("https://")
        ? source
        : `${BASE_URL}/${source.startsWith("/") ? source.slice(1) : source}`;

      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(safeUrl, { headers });
      if (!res.ok) {
        throw new Error(`Gagal mengunduh berkas lampiran (${res.status})`);
      }
      arrayBuffer = await res.arrayBuffer();
    }
  } else {
    return [];
  }

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapPacked: true,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = options?.maxPages ? Math.min(pdfDoc.numPages, options.maxPages) : pdfDoc.numPages;
  const scale = options?.scale ?? 1.8;
  const quality = options?.quality ?? 0.92;

  const pageImages: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    await page.render({
      canvasContext: ctx,
      viewport: viewport,
      intent: "print",
    }).promise;

    pageImages.push(canvas.toDataURL("image/jpeg", quality));
  }

  return pageImages;
}

/**
 * Loads all evidence files (dokumen pendukung) that are PDF and returns AttachmentImage objects.
 */
export async function loadEvidencePdfImages(
  evidenceFiles?: any[] | null,
  options?: { scale?: number; maxPages?: number }
): Promise<AttachmentImage[]> {
  if (!evidenceFiles || !Array.isArray(evidenceFiles) || evidenceFiles.length === 0) {
    return [];
  }

  const results: AttachmentImage[] = [];

  for (const file of evidenceFiles) {
    const name = file.name || file.fileName || "Lampiran";
    const isPdf = name.toLowerCase().endsWith(".pdf") || file.mimeType === "application/pdf";
    if (!isPdf) continue;

    const fileUrl = file.fileUrl;
    if (!fileUrl && !file.data) continue;

    try {
      const source = file.data || fileUrl;
      const images = await renderPdfToImageUrls(source, options);
      if (images.length > 0) {
        results.push({ name, images });
      }
    } catch (err) {
      console.warn(`Gagal memuat pratinjau lampiran ${name}:`, err);
    }
  }

  return results;
}

/**
 * Generates HTML string to append to a letter document containing all attachment pages.
 */
export function generateAttachmentPagesHtml(attachments: AttachmentImage[]): string {
  if (!attachments || attachments.length === 0) return "";

  return attachments.map((att) =>
    att.images.map((imgUrl, pageIdx) => `
<div class="amanah-attachment-page-wrapper" style="page-break-before: always; break-before: page; margin-top: 24px; text-align: center; order: 9999;">
  <div class="amanah-attachment-page-header" style="text-align: center; font-family: Arial, sans-serif; font-size: 8.5pt; font-weight: bold; color: #475569; padding: 6px 0 10px 0; letter-spacing: 0.5px; border-bottom: 1px dashed #cbd5e1; margin-bottom: 14px;">
    📄 LAMPIRAN: ${att.name.toUpperCase()} (HALAMAN ${pageIdx + 1} DARI ${att.images.length})
  </div>
  <div style="display: flex; justify-content: center; align-items: center; width: 100%;">
    <img src="${imgUrl}" alt="${att.name} Hal ${pageIdx + 1}" class="amanah-attachment-page-img" style="width: 100%; max-width: 794px; height: auto; display: block; margin: 0 auto; box-shadow: 0 4px 14px rgba(0,0,0,0.08); border-radius: 2px;" />
  </div>
</div>`
    ).join("")
  ).join("");
}

export const ATTACHMENT_CSS = `
  /* Attachment Page Layout for Screen and Print */
  @media print {
    .amanah-attachment-page-wrapper {
      page-break-before: always !important;
      break-before: page !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      box-shadow: none !important;
    }
    .amanah-attachment-page-header {
      display: none !important;
    }
    .amanah-attachment-page-img {
      width: 100% !important;
      max-width: 100% !important;
      height: auto !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      display: block !important;
      margin: 0 auto !important;
    }
  }
  @media screen {
    .master-page-table,
    .a4-page-sheet,
    .cert-page {
      order: 1 !important;
    }
    .amanah-letter-footer {
      order: 2 !important;
    }
    .amanah-attachment-page-wrapper {
      max-width: 794px;
      width: 100%;
      margin: 24px auto;
      background: #ffffff;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      box-sizing: border-box;
      padding: 12px;
      border-radius: 4px;
      order: 9999 !important;
    }
    .amanah-attachment-page-header {
      display: block;
      font-size: 8.5pt;
      font-weight: bold;
      color: #475569;
      padding-bottom: 8px;
      border-bottom: 1px dashed #cbd5e1;
      margin-bottom: 12px;
    }
    .amanah-attachment-page-img {
      width: 100%;
      height: auto;
      display: block;
      margin: 0 auto;
    }
  }
`;

/**
 * Opens a print preview window for browser-native printing and PDF saving.
 * Includes the main letter and all attached PDF pages sequentially.
 */
export function openPrintWindow(htmlText: string, fileName: string, attachmentHtml: string = "") {
  if (typeof window === "undefined") return;

  const BASE_URL = getBaseUrl();
  let processedHtml = htmlText;

  // Convert relative image URLs (e.g. images/logo-dsn.png) to absolute URL
  processedHtml = processedHtml.replace(/src=["']\/?(images\/[^"']+)["']/gi, `src="${BASE_URL}/$1"`);
  processedHtml = processedHtml.replace(/border-top:\s*1px\s*solid\s*#000000;?/gi, "border-top: none;");
  processedHtml = processedHtml.replace(/border-top:\s*1px\s*solid\s*black;?/gi, "border-top: none;");
  processedHtml = processedHtml.replace(/border-top:\s*1px\s*solid\s*#000;?/gi, "border-top: none;");
  processedHtml = processedHtml.replace(/<table class="amanah-letter-footer"[\s\S]*?<\/table>/gi, "");
  processedHtml = processedHtml.replace(/\\?\${FOOTER_HTML}/g, "");
  processedHtml = processedHtml.replace(/(<img[^>]*(?:bismillah|Bismillah)[^>]*style=["'])([^"']*)(["'])/gi, (_match, p1, p2, p3) => {
    let cleanStyle = p2.replace(/height:\s*[^;]+;?/gi, "").replace(/max-height:\s*[^;]+;?/gi, "").replace(/width:\s*[^;]+;?/gi, "").replace(/max-width:\s*[^;]+;?/gi, "").trim();
    return `${p1}${cleanStyle ? cleanStyle + "; " : ""}width: 260px; max-width: 45%; height: auto; max-height: 48px; margin: 8px auto 14px auto;${p3}`;
  });
  processedHtml = processedHtml.replace(
    /(<!--\s*SALAM\s*PENUTUP\s*-->[\s\S]*?<p[^>]*>)\s*[Aa]ssalamu([’'‘`]?alaikum\s+Warahmatullah\s+Wabarakatuh[\.,]?)\s*(<\/p>)/gi,
    "$1Wassalamu’alaikum Warahmatullah Wabarakatuh.$3"
  );
  processedHtml = processedHtml.replace(
    /(<p[^>]*>)\s*[Aa]ssalamu([’'‘`]?alaikum\s+Warahmatullah\s+Wabarakatuh)\.\s*(<\/p>)/gi,
    "$1Wassalamu’alaikum Warahmatullah Wabarakatuh.$3"
  );

  const FOOTER_HTML = `<table class="amanah-letter-footer" style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif;">
  <tr>
    <td style="vertical-align: middle; text-align: left; padding: 4px 10px 4px 0; font-size: 7.5pt; line-height: 1.25; font-style: italic; color: #1f2937; border-top: 1px solid #e5e7eb;">
      Dokumen ini telah ditandatangani secara elektronik oleh Sistem Digital Amanah dibawah otoritas Dewan Syariah Nasional-Majelis Ulama Indonesia. Untuk memastikan keaslian tanda tangan elektronik, silakan pindai QR-Code
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

  const styles = (processedHtml.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || []).join("\n");
  const bodyMatch = processedHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let bodyInner = bodyMatch ? bodyMatch[1] : processedHtml;
  if (bodyInner.includes("master-page-table")) {
    bodyInner = bodyInner
      .replace(/<table class="master-page-table"[\s\S]*?<tbody>\s*<tr>\s*<td>/gi, "")
      .replace(/<\/td>\s*<\/tr>\s*<\/tbody>\s*<tfoot>[\s\S]*?<\/tfoot>\s*<\/table>/gi, "");
  }

  // Auto-wrap body in letter-body-wrapper if not already present
  if (!bodyInner.includes("letter-body-wrapper")) {
    const bismillahEndRegex = /(<img[^>]*(?:bismillah|Bismillah)[^>]*>[\s\S]*?<\/div>)/i;
    const bismillahMatch = bismillahEndRegex.exec(bodyInner);
    if (bismillahMatch) {
      const cutIndex = bismillahMatch.index + bismillahMatch[0].length;
      const headerPart = bodyInner.substring(0, cutIndex);
      const restPart = bodyInner.substring(cutIndex);
      bodyInner = `${headerPart}\n<div class="letter-body-wrapper" style="margin-left: 15mm; margin-right: 10mm;">\n${restPart}\n</div>`;
    }
  }

  const printHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <base href="${BASE_URL}/">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fileName || "Dokumen"}</title>
  ${styles}
  <style>
    @page {
      size: A4;
      margin-top: 10mm !important;
      margin-bottom: 12mm !important;
      margin-left: 10mm !important;
      margin-right: 10mm !important;
    }
    @media print {
      .print-btn-bar { display: none !important; }
      body {
        margin: 0 !important;
        padding: 0 !important;
        padding-top: 0 !important;
      }
    }
    .print-btn-bar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
      background: #1e40af; color: white; padding: 10px 20px;
      display: flex; align-items: center; justify-content: space-between;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-family: Arial, sans-serif;
    }
    .print-btn {
      background: white; color: #1e40af; border: none; border-radius: 6px;
      padding: 8px 20px; font-size: 14px; font-weight: bold;
      cursor: pointer;
    }
    .print-btn:hover { background: #dbeafe; }
    body {
      padding-top: 56px;
      font-family: Arial, Helvetica, sans-serif !important;
      font-size: 10.5pt !important;
      line-height: 1.25 !important;
      color: #111827 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Wrapper to keep 25mm left & 20mm right body margins while Kop Surat uses full 190mm */
    .letter-body-wrapper {
      margin-left: 15mm !important;
      margin-right: 10mm !important;
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

    /* Ensure container uses full printable width within standard margins */
    @media screen {
      body {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        background-color: #f1f5f9 !important;
      }
      .master-page-table {
        max-width: 794px !important;
        width: 100% !important;
        margin: 0 auto !important;
        padding: 10mm 10mm 12mm 10mm !important;
        background: #ffffff !important;
        box-shadow: 0 2px 10px rgba(0,0,0,0.06);
        box-sizing: border-box !important;
        order: 1 !important;
      }
      .amanah-letter-footer {
        display: table !important;
        order: 2 !important;
        width: 100% !important;
        max-width: 794px !important;
        margin: 16px auto 20px auto !important;
        padding: 0 10mm !important;
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

    div[style*="margin-left: -30px"],
    div[style*="margin-left:-30px"],
    div[style*="margin-left: -40px"],
    div[style*="margin-left:-40px"] {
      margin-left: 0 !important;
      margin-right: 0 !important;
      padding-top: 0 !important;
    }
    div, p, span, td, th, li, a, ol, ul, b, strong {
      font-family: Arial, Helvetica, sans-serif !important;
      line-height: 1.25 !important;
    }
    p, td, th, li, ol, ul {
      font-size: 10.5pt !important;
    }
    ol, ul {
      margin-top: 2px !important;
      margin-bottom: 4px !important;
      padding-left: 20px !important;
    }
    li {
      margin-bottom: 2px !important;
      font-size: 10.5pt !important;
    }
    p {
      margin-top: 0px !important;
      margin-bottom: 4px !important;
      font-size: 10.5pt !important;
    }
    *[style*="font-size: 11pt"],
    *[style*="font-size:11pt"],
    *[style*="font-size: 12pt"],
    *[style*="font-size:12pt"],
    *[style*="font-size: 13pt"],
    *[style*="font-size:13pt"],
    *[style*="font-size: 14pt"],
    *[style*="font-size:14pt"] {
      font-size: 10.5pt !important;
    }
    .kop-surat-img, img[alt*="Kop Surat"] {
      width: 100% !important;
      max-width: 100% !important;
      height: auto !important;
      display: block !important;
      margin: 0 auto 4px auto !important;
    }
    img[src*="bismillah"], img[alt*="Bismillah"] {
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
      width: 55px !important;
      height: 55px !important;
      max-width: 55px !important;
      max-height: 55px !important;
      display: inline-block !important;
      object-fit: contain !important;
    }
    div[style*="width: 60px"][style*="height: 60px"],
    div[style*="width: 70px"][style*="height: 70px"] {
      margin: 2px 0 2px 0 !important;
      width: 55px !important;
      height: 55px !important;
    }
    .amanah-letter-footer td {
      font-size: 7.5pt !important;
      line-height: 1.25 !important;
    }

    ${ATTACHMENT_CSS}
  </style>
</head>
<body>
  <div class="print-btn-bar">
    <span>📄 ${fileName ? fileName.replace(/\.(html?|htm)$/i, ".pdf") : "Dokumen"}</span>
    <button class="print-btn" onclick="window.print()">🖨️ Cetak / Simpan sebagai PDF</button>
  </div>
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
  ${attachmentHtml || ""}
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 800);
    });
  <\/script>
</body>
</html>`;

  const blob = new Blob([printHtml], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const printWin = window.open(url, "_blank");
  if (!printWin) {
    alert("Popup diblokir browser. Izinkan popup untuk halaman ini dan coba lagi.");
    URL.revokeObjectURL(url);
    return;
  }
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

