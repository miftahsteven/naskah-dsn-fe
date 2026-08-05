"use client";

import React from "react";
import {
  AlertCircle,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Printer,
  X,
} from "lucide-react";
import { getBaseUrl } from "@/lib/api";

type DocumentKind =
  | "pdf"
  | "html"
  | "docx"
  | "doc"
  | "image"
  | "text"
  | "unknown";

type ReaderStatus = "idle" | "loading" | "rendering" | "ready" | "error";

interface DocumentReaderProps {
  title: string;
  fileUrl: string;
  isOpen: boolean;
  onClose: () => void;

  /** Opsional. Jika kosong, komponen membaca localStorage.accessToken. */
  accessToken?: string | null;

  /** Opsional untuk header tambahan jika API membutuhkannya. */
  requestHeaders?: Record<string, string>;
}

const PDF_MIME = "application/pdf";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const DOC_MIME = "application/msword";

function joinUrl(baseUrl: string, fileUrl: string): string {
  if (!fileUrl) return "";

  if (/^https?:\/\//i.test(fileUrl)) {
    // Mencegah mixed-content apabila backend masih mengembalikan http://.
    return fileUrl.replace(/^http:\/\//i, "https://");
  }

  return `${baseUrl.replace(/\/+$/, "")}/${fileUrl.replace(/^\/+/, "")}`;
}

function getExtension(value: string): string {
  const cleanValue = value.split("?")[0].split("#")[0].toLowerCase();
  const match = cleanValue.match(/\.([a-z0-9]+)$/i);
  return match?.[1] || "";
}

function getFilenameFromDisposition(value: string | null): string | null {
  if (!value) return null;

  const utf8Match = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].replace(/["']/g, "").trim());
    } catch {
      return utf8Match[1].replace(/["']/g, "").trim();
    }
  }

  const regularMatch = value.match(/filename\s*=\s*"([^"]+)"/i);
  if (regularMatch?.[1]) return regularMatch[1];

  const unquotedMatch = value.match(/filename\s*=\s*([^;]+)/i);
  return unquotedMatch?.[1]?.trim() || null;
}

function startsWithBytes(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((byte, index) => bytes[index] === byte);
}

function detectDocumentKind(args: {
  bytes: Uint8Array;
  mimeType: string;
  filename: string;
  title: string;
  fileUrl: string;
}): DocumentKind {
  const { bytes, mimeType, filename, title, fileUrl } = args;
  const normalizedMime = mimeType.split(";")[0].trim().toLowerCase();
  const extension =
    getExtension(filename) || getExtension(title) || getExtension(fileUrl);

  // PDF: %PDF
  if (startsWithBytes(bytes, [0x25, 0x50, 0x44, 0x46])) return "pdf";

  // Word lama .doc: OLE Compound File
  if (
    startsWithBytes(bytes, [
      0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1,
    ])
  ) {
    return "doc";
  }

  const textSample = new TextDecoder("utf-8", { fatal: false })
    .decode(bytes.slice(0, 1024))
    .replace(/^\uFEFF/, "")
    .trimStart()
    .toLowerCase();

  if (
    textSample.startsWith("<!doctype html") ||
    textSample.startsWith("<html") ||
    textSample.startsWith("<head") ||
    textSample.startsWith("<body")
  ) {
    return "html";
  }

  if (normalizedMime === PDF_MIME || extension === "pdf") return "pdf";

  if (
    normalizedMime === DOCX_MIME ||
    extension === "docx" ||
    // DOCX adalah ZIP. Dalam konteks reader dokumen, ZIP tanpa ekstensi
    // dicoba sebagai DOCX agar endpoint /download tanpa ekstensi tetap bekerja.
    startsWithBytes(bytes, [0x50, 0x4b, 0x03, 0x04])
  ) {
    return "docx";
  }

  if (normalizedMime === DOC_MIME || extension === "doc") return "doc";
  if (normalizedMime.includes("html") || ["html", "htm"].includes(extension)) {
    return "html";
  }
  if (normalizedMime.startsWith("image/")) return "image";
  if (normalizedMime.startsWith("text/")) return "text";

  return "unknown";
}

function injectBaseUrl(html: string, sourceUrl: string): string {
  try {
    const directoryUrl = new URL(".", sourceUrl).toString();
    const baseTag = `<base href="${directoryUrl}">`;

    if (/<head[^>]*>/i.test(html)) {
      return html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`);
    }

    return `${baseTag}${html}`;
  } catch {
    return html;
  }
}

const DocumentReader: React.FC<DocumentReaderProps> = ({
  title,
  fileUrl,
  isOpen,
  onClose,
  accessToken,
  requestHeaders,
}) => {
  const [status, setStatus] = React.useState<ReaderStatus>("idle");
  const [documentKind, setDocumentKind] =
    React.useState<DocumentKind>("unknown");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null);
  const [htmlContent, setHtmlContent] = React.useState<string | null>(null);
  const [textContent, setTextContent] = React.useState<string | null>(null);
  const [docxBuffer, setDocxBuffer] = React.useState<ArrayBuffer | null>(null);
  const [sourceBlob, setSourceBlob] = React.useState<Blob | null>(null);
  const [downloadFilename, setDownloadFilename] = React.useState(title);

  const docxContainerRef = React.useRef<HTMLDivElement>(null);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const safeTitle = title || "Dokumen";
  const safeFileUrl = fileUrl || "";
  const baseUrl = getBaseUrl();

  const fullUrl = React.useMemo(
    () => joinUrl(baseUrl, safeFileUrl),
    [baseUrl, safeFileUrl],
  );

  const buildHeaders = React.useCallback((): Record<string, string> => {
    const headers: Record<string, string> = { ...(requestHeaders || {}) };
    const token =
      accessToken ??
      (typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null);

    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, [accessToken, requestHeaders]);

  React.useEffect(() => {
    if (!isOpen || !fullUrl) return;

    const controller = new AbortController();
    let generatedObjectUrl: string | null = null;

    const loadDocument = async () => {
      setStatus("loading");
      setErrorMessage(null);
      setDocumentKind("unknown");
      setObjectUrl(null);
      setHtmlContent(null);
      setTextContent(null);
      setDocxBuffer(null);
      setSourceBlob(null);
      setDownloadFilename(safeTitle);

      try {
        const response = await fetch(fullUrl, {
          method: "GET",
          headers: buildHeaders(),
          credentials: "include",
          redirect: "follow",
          signal: controller.signal,
        });

        if (!response.ok) {
          let detail = "";
          try {
            const responseType = response.headers.get("content-type") || "";
            if (responseType.includes("json")) {
              detail = JSON.stringify(await response.json());
            } else {
              detail = await response.text();
            }
          } catch {
            // Body error mungkin kosong.
          }

          throw new Error(
            `Request dokumen gagal (HTTP ${response.status})${detail ? `: ${detail.slice(0, 300)}` : ""
            }`,
          );
        }

        const blob = await response.blob();
        if (blob.size === 0) throw new Error("File yang diterima kosong.");

        const dispositionFilename = getFilenameFromDisposition(
          response.headers.get("content-disposition"),
        );
        const resolvedFilename = dispositionFilename || safeTitle || "dokumen";
        const bytes = new Uint8Array(await blob.slice(0, 4096).arrayBuffer());
        const kind = detectDocumentKind({
          bytes,
          mimeType: response.headers.get("content-type") || blob.type,
          filename: resolvedFilename,
          title: safeTitle,
          fileUrl: fullUrl,
        });

        setSourceBlob(blob);
        setDownloadFilename(resolvedFilename);
        setDocumentKind(kind);

        if (kind === "pdf") {
          const pdfBlob = new Blob([blob], { type: PDF_MIME });
          generatedObjectUrl = URL.createObjectURL(pdfBlob);
          setObjectUrl(generatedObjectUrl);
          setStatus("ready");
          return;
        }

        if (kind === "image") {
          generatedObjectUrl = URL.createObjectURL(blob);
          setObjectUrl(generatedObjectUrl);
          setStatus("ready");
          return;
        }

        if (kind === "html") {
          const html = await blob.text();
          setHtmlContent(injectBaseUrl(html, fullUrl));
          setStatus("ready");
          return;
        }

        if (kind === "text") {
          setTextContent(await blob.text());
          setStatus("ready");
          return;
        }

        if (kind === "docx") {
          setStatus("rendering");
          setDocxBuffer(await blob.arrayBuffer());
          return;
        }

        if (kind === "doc") {
          setStatus("error");
          setErrorMessage(
            "Format Word lama (.doc) tidak dapat dirender langsung oleh browser. " +
            "Backend perlu mengonversinya menjadi PDF atau DOCX untuk preview.",
          );
          return;
        }

        setStatus("error");
        setErrorMessage(
          `Format dokumen belum dikenali. Content-Type: ${response.headers.get("content-type") || "tidak tersedia"
          }`,
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;

        console.error("DocumentReader gagal memuat file:", error);
        setStatus("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat memuat dokumen.",
        );
      }
    };

    void loadDocument();

    return () => {
      controller.abort();
      if (generatedObjectUrl) URL.revokeObjectURL(generatedObjectUrl);
    };
  }, [isOpen, fullUrl, safeTitle, buildHeaders]);

  React.useEffect(() => {
    if (
      !isOpen ||
      documentKind !== "docx" ||
      !docxBuffer ||
      !docxContainerRef.current
    ) {
      return;
    }

    let cancelled = false;
    const container = docxContainerRef.current;
    container.innerHTML = "";

    const renderDocx = async () => {
      try {
        const { renderAsync } = await import("docx-preview");
        if (cancelled) return;

        await renderAsync(docxBuffer, container, undefined, {
          className: "docx-preview",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
          useBase64URL: true,
        });

        if (!cancelled) setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        console.error("Gagal merender DOCX:", error);
        setStatus("error");
        setErrorMessage(
          error instanceof Error
            ? `Gagal merender DOCX: ${error.message}`
            : "Gagal merender file DOCX.",
        );
      }
    };

    void renderDocx();

    return () => {
      cancelled = true;
      container.innerHTML = "";
    };
  }, [isOpen, documentKind, docxBuffer]);

  const handleDownload = React.useCallback(async () => {
    try {
      let blob = sourceBlob;

      if (!blob) {
        const response = await fetch(fullUrl, {
          headers: buildHeaders(),
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`Download gagal (HTTP ${response.status}).`);
        }
        blob = await response.blob();
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = downloadFilename || safeTitle || "dokumen";
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (error) {
      console.error("Download gagal:", error);
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Gagal mengunduh dokumen.",
      );
    }
  }, [sourceBlob, fullUrl, buildHeaders, downloadFilename, safeTitle]);

  const handleOpenNewTab = React.useCallback(() => {
    if (objectUrl) {
      window.open(objectUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (htmlContent) {
      const url = URL.createObjectURL(
        new Blob([htmlContent], { type: "text/html;charset=utf-8" }),
      );
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      return;
    }

    // DOCX tidak bisa dibagikan ke tab lain sebagai blob untuk dirender native.
    void handleDownload();
  }, [objectUrl, htmlContent, handleDownload]);

  const handlePrint = React.useCallback(() => {
    if (documentKind === "pdf" || documentKind === "html") {
      iframeRef.current?.contentWindow?.focus();
      iframeRef.current?.contentWindow?.print();
      return;
    }

    window.print();
  }, [documentKind]);

  if (!isOpen) return null;

  const showLoading = status === "loading" || status === "rendering";

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-4 md:p-8">
      <button
        type="button"
        aria-label="Tutup pembaca dokumen"
        className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-none bg-white shadow-2xl dark:bg-slate-950 sm:rounded-[32px]">
        <header className="z-10 flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate pr-3 text-sm font-extrabold text-slate-900 dark:text-white">
                {safeTitle}
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Document Reader — Amanah Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={handleOpenNewTab}
              disabled={showLoading || status === "error"}
              className="rounded-xl p-2.5 text-slate-400 transition hover:bg-slate-50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-800"
              title="Buka di tab baru"
            >
              <ExternalLink size={19} />
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={status !== "ready"}
              className="rounded-xl p-2.5 text-slate-400 transition hover:bg-slate-50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-800"
              title="Cetak"
            >
              <Printer size={19} />
            </button>
            <button
              type="button"
              onClick={() => void handleDownload()}
              disabled={status === "loading"}
              className="rounded-xl p-2.5 text-slate-400 transition hover:bg-slate-50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-800"
              title="Unduh dokumen"
            >
              <Download size={19} />
            </button>
            <div className="mx-1 h-6 w-px bg-slate-100 dark:bg-slate-800" />
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"
              title="Tutup"
            >
              <X size={22} />
            </button>
          </div>
        </header>

        <main className="relative flex-1 overflow-auto bg-slate-100 dark:bg-slate-900">
          {showLoading && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-slate-50/95 dark:bg-slate-900/95">
              <Loader2 size={38} className="animate-spin text-primary" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                {status === "rendering"
                  ? "Merender dokumen Word..."
                  : "Mengambil dokumen..."}
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-center">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-red-500 dark:bg-red-950/30">
                <AlertCircle size={40} />
              </div>
              <h3 className="mb-2 text-lg font-extrabold text-slate-900 dark:text-white">
                Preview Tidak Tersedia
              </h3>
              <p className="max-w-2xl text-sm leading-relaxed text-red-500">
                {errorMessage}
              </p>
              {sourceBlob && (
                <button
                  type="button"
                  onClick={() => void handleDownload()}
                  className="mt-6 flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white"
                >
                  <Download size={18} />
                  Unduh Dokumen
                </button>
              )}
            </div>
          )}

          {documentKind === "pdf" && objectUrl && (
            <iframe
              ref={iframeRef}
              src={objectUrl}
              className="absolute inset-0 h-full w-full border-0 bg-white"
              title={safeTitle}
            />
          )}

          {documentKind === "html" && htmlContent !== null && (
            <iframe
              ref={iframeRef}
              srcDoc={htmlContent}
              className="absolute inset-0 h-full w-full border-0 bg-white"
              title={safeTitle}
              sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox"
            />
          )}

          {documentKind === "docx" && docxBuffer && (
            <div className="min-h-full overflow-auto bg-slate-200 p-4 sm:p-8">
              <div ref={docxContainerRef} className="mx-auto min-h-full" />
            </div>
          )}

          {documentKind === "image" && objectUrl && (
            <div className="flex min-h-full items-center justify-center p-6">
              {/* URL berasal dari Blob lokal yang sudah diautentikasi. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={objectUrl}
                alt={safeTitle}
                className="max-h-full max-w-full object-contain shadow-lg"
              />
            </div>
          )}

          {documentKind === "text" && textContent !== null && (
            <pre className="min-h-full whitespace-pre-wrap break-words bg-white p-8 font-mono text-sm leading-7 text-slate-800">
              {textContent}
            </pre>
          )}
        </main>

        <footer className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-[10px] font-medium text-slate-400">
            Hanya untuk keperluan internal DSN-MUI Amanah.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold uppercase text-emerald-600">
              {documentKind === "unknown" ? "Secure Reader" : documentKind}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DocumentReader;
