"use client";

import React from "react";
import {
  X,
  ExternalLink,
  Download,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { getBaseUrl } from "@/lib/api";

interface DocumentReaderProps {
  title: string;
  fileUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

const DocumentReader: React.FC<DocumentReaderProps> = ({
  title,
  fileUrl,
  isOpen,
  onClose,
}) => {
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [htmlContent, setHtmlContent] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const safeTitle = title || "Dokumen";
  const safeFileUrl = fileUrl || "";

  const baseUrl = getBaseUrl();

  /**
   * Membentuk URL lengkap dokumen.
   *
   * Contoh:
   * NEXT_PUBLIC_API_URL=https://mui-api.mscode.id/api
   * fileUrl=/documents/123/versions/456/download
   *
   * Hasil:
   * https://mui-api.mscode.id/api/documents/123/versions/456/download
   */
  const fullUrl = React.useMemo(() => {
    if (!safeFileUrl) {
      return "";
    }

    if (
      safeFileUrl.startsWith("http://") ||
      safeFileUrl.startsWith("https://")
    ) {
      // Jika backend masih mengirim URL HTTP, ubah ke HTTPS.
      return safeFileUrl.replace(/^http:\/\//i, "https://");
    }

    const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
    const normalizedFileUrl = safeFileUrl.replace(/^\/+/, "");

    return `${normalizedBaseUrl}/${normalizedFileUrl}`;
  }, [baseUrl, safeFileUrl]);

  const lowerTitle = safeTitle.toLowerCase();
  const lowerFileUrl = safeFileUrl.toLowerCase();

  const isDocx =
    lowerTitle.endsWith(".docx") ||
    lowerTitle.endsWith(".doc") ||
    lowerFileUrl.endsWith(".docx") ||
    lowerFileUrl.endsWith(".doc");

  const isHtml =
    lowerTitle.endsWith(".html") ||
    lowerTitle.endsWith(".htm") ||
    lowerFileUrl.endsWith(".html") ||
    lowerFileUrl.endsWith(".htm");

  /**
   * Endpoint /download pada aplikasi ini menghasilkan PDF.
   * Pengecekan !isDocx dan !isHtml mencegah dokumen lain
   * dianggap sebagai PDF.
   */
  const isPdf =
    !isDocx &&
    !isHtml &&
    (lowerTitle.endsWith(".pdf") ||
      lowerFileUrl.endsWith(".pdf") ||
      lowerFileUrl.includes("/download"));

  const isLocalhost =
    fullUrl.includes("localhost") || fullUrl.includes("127.0.0.1");

  /**
   * Ambil token langsung ketika request dijalankan.
   */
  const getAuthorizationHeaders = React.useCallback(() => {
    const headers: Record<string, string> = {};

    if (typeof window !== "undefined") {
      const accessToken = localStorage.getItem("accessToken");

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
    }

    return headers;
  }, []);

  /**
   * Memuat PDF menggunakan fetch + Bearer Token.
   *
   * PDF tidak dimasukkan langsung dari URL API ke iframe,
   * karena iframe tidak dapat mengirim header Authorization.
   */
  React.useEffect(() => {
    if (!isOpen || !isPdf || !fullUrl) {
      return;
    }

    const controller = new AbortController();
    let objectUrl: string | null = null;

    const loadPdf = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setPdfUrl(null);

      try {
        const response = await fetch(fullUrl, {
          method: "GET",
          headers: getAuthorizationHeaders(),
          signal: controller.signal,
        });

        if (!response.ok) {
          let errorDetail = "";

          try {
            errorDetail = await response.text();
          } catch {
            // Abaikan jika body error tidak dapat dibaca.
          }

          throw new Error(
            `Gagal mengambil PDF. HTTP ${response.status}${errorDetail ? ` — ${errorDetail}` : ""
            }`,
          );
        }

        const contentType = response.headers.get("content-type") || "";

        if (
          !contentType.includes("application/pdf") &&
          !contentType.includes("application/octet-stream")
        ) {
          throw new Error(
            `Respons server bukan PDF. Content-Type: ${contentType || "tidak tersedia"
            }`,
          );
        }

        const blob = await response.blob();

        if (blob.size === 0) {
          throw new Error("File PDF yang diterima kosong.");
        }

        const pdfBlob = new Blob([blob], {
          type: "application/pdf",
        });

        objectUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(objectUrl);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Gagal memuat PDF:", error);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan ketika memuat PDF.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      controller.abort();

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [
    isOpen,
    isPdf,
    fullUrl,
    getAuthorizationHeaders,
  ]);

  /**
   * Memuat dokumen HTML menggunakan Bearer Token.
   */
  React.useEffect(() => {
    if (!isOpen || !isHtml || !fullUrl) {
      return;
    }

    const controller = new AbortController();

    const loadHtml = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setHtmlContent(null);

      try {
        const response = await fetch(fullUrl, {
          method: "GET",
          headers: getAuthorizationHeaders(),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Gagal mengambil dokumen HTML. HTTP ${response.status}`,
          );
        }

        const content = await response.text();
        setHtmlContent(content);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Gagal memuat HTML:", error);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan ketika memuat dokumen.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadHtml();

    return () => {
      controller.abort();
    };
  }, [
    isOpen,
    isHtml,
    fullUrl,
    getAuthorizationHeaders,
  ]);

  /**
   * Membuka dokumen di tab baru.
   *
   * Untuk PDF digunakan Blob URL agar autentikasi tidak
   * perlu dikirim kembali oleh tab baru.
   */
  const handleOpenNewTab = () => {
    if (isPdf) {
      if (!pdfUrl) {
        return;
      }

      window.open(pdfUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (isHtml && htmlContent) {
      const htmlBlob = new Blob([htmlContent], {
        type: "text/html;charset=utf-8",
      });

      const htmlUrl = URL.createObjectURL(htmlBlob);
      window.open(htmlUrl, "_blank", "noopener,noreferrer");

      window.setTimeout(() => {
        URL.revokeObjectURL(htmlUrl);
      }, 10_000);

      return;
    }

    if (fullUrl) {
      window.open(fullUrl, "_blank", "noopener,noreferrer");
    }
  };

  /**
   * Download selalu dilakukan melalui fetch agar header
   * Authorization ikut dikirim ke backend.
   */
  const handleDownload = async () => {
    if (!fullUrl) {
      return;
    }

    try {
      setErrorMessage(null);

      const response = await fetch(fullUrl, {
        method: "GET",
        headers: getAuthorizationHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Gagal mengunduh dokumen. HTTP ${response.status}`);
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error("File yang diterima kosong.");
      }

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = safeTitle || "dokumen";
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
      }, 1_000);
    } catch (error) {
      console.error("Gagal mengunduh dokumen:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal mengunduh dokumen.",
      );
    }
  };

  const handlePrintHtml = () => {
    const iframe = document.getElementById(
      "document-iframe",
    ) as HTMLIFrameElement | null;

    if (!iframe?.contentWindow) {
      return;
    }

    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  };

  if (!isOpen) {
    return null;
  }

  /**
   * Microsoft Office Viewer hanya dapat membuka file yang
   * dapat diakses secara publik. Jika DOCX membutuhkan bearer
   * token, sebaiknya file diunduh atau backend membuat signed URL.
   */
  const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
    fullUrl,
  )}`;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-4 md:p-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Reader Container */}
      <div className="relative flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-none bg-white shadow-2xl animate-in zoom-in-95 duration-500 dark:bg-slate-950 sm:rounded-[32px]">
        {/* Toolbar */}
        <div className="z-10 flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText size={20} />
            </div>

            <div className="min-w-0">
              <h2 className="truncate pr-4 text-sm font-extrabold text-slate-900 dark:text-white">
                {safeTitle}
              </h2>

              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Document Reader — Amanah Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenNewTab}
              disabled={isPdf && !pdfUrl}
              className="rounded-xl p-2.5 text-slate-400 transition-all hover:bg-slate-50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-800"
              title="Buka di tab baru"
            >
              <ExternalLink size={20} />
            </button>

            {isHtml ? (
              <button
                type="button"
                onClick={handlePrintHtml}
                disabled={!htmlContent}
                className="rounded-xl p-2.5 text-slate-400 transition-all hover:bg-slate-50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-800"
                title="Cetak / Simpan ke PDF"
              >
                <Download size={20} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDownload}
                className="rounded-xl p-2.5 text-slate-400 transition-all hover:bg-slate-50 hover:text-primary dark:hover:bg-slate-800"
                title="Unduh dokumen"
              >
                <Download size={20} />
              </button>
            )}

            <div className="mx-1 h-6 w-px bg-slate-100 dark:bg-slate-800" />

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2.5 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"
              title="Tutup"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="relative flex-1 bg-slate-100 dark:bg-slate-900">
          {/* Loading */}
          {isLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-900">
              <Loader2 size={36} className="animate-spin text-primary" />

              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Memuat berkas amanah...
              </p>
            </div>
          )}

          {/* Error */}
          {!isLoading && errorMessage && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-50 p-8 text-center dark:bg-slate-900">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-red-500 dark:bg-red-950/30">
                <AlertCircle size={40} />
              </div>

              <h3 className="mb-2 text-lg font-extrabold text-slate-900 dark:text-white">
                Gagal Memuat Dokumen
              </h3>

              <p className="max-w-xl text-sm leading-relaxed text-red-500">
                {errorMessage}
              </p>

              <button
                type="button"
                onClick={handleDownload}
                className="mt-6 flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white"
              >
                <Download size={18} />
                Unduh File Secara Langsung
              </button>
            </div>
          )}

          {/* PDF Viewer */}
          {!isLoading && !errorMessage && isPdf && pdfUrl && (
            <iframe
              id="document-iframe"
              src={pdfUrl}
              className="relative z-10 h-full w-full border-none bg-white"
              title={safeTitle}
            />
          )}

          {/* HTML Viewer */}
          {!isLoading &&
            !errorMessage &&
            isHtml &&
            htmlContent !== null && (
              <iframe
                id="document-iframe"
                srcDoc={htmlContent}
                className="relative z-10 h-full w-full border-none bg-white"
                title={safeTitle}
                sandbox="allow-same-origin allow-scripts allow-forms allow-modals"
              />
            )}

          {/* DOCX lokal */}
          {!isLoading &&
            !errorMessage &&
            isDocx &&
            isLocalhost && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 p-8 text-center dark:bg-slate-900">
                <div className="relative mb-6 flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-white text-blue-500 shadow-sm dark:bg-slate-800">
                  <FileText size={48} strokeWidth={1.5} />

                  <div className="absolute bottom-3 right-3 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-extrabold text-blue-700">
                    DOCX
                  </div>
                </div>

                <h3 className="mb-3 text-xl font-extrabold text-slate-900 dark:text-white">
                  Limitasi Environment Lokal
                </h3>

                <p className="mb-8 max-w-md text-sm leading-relaxed text-slate-500">
                  Microsoft Office Viewer tidak dapat mengakses file dari
                  localhost. Silakan unduh dokumen terlebih dahulu.
                </p>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 font-bold text-white shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Download size={20} />
                  Unduh Dokumen DOCX
                </button>
              </div>
            )}

          {/* DOCX Online Viewer */}
          {!isLoading &&
            !errorMessage &&
            isDocx &&
            !isLocalhost && (
              <iframe
                id="document-iframe"
                src={officeViewerUrl}
                className="relative z-10 h-full w-full border-none bg-white"
                title={safeTitle}
              />
            )}

          {/* File selain PDF, HTML, dan DOCX */}
          {!isLoading &&
            !errorMessage &&
            !isPdf &&
            !isHtml &&
            !isDocx &&
            fullUrl && (
              <iframe
                id="document-iframe"
                src={fullUrl}
                className="relative z-10 h-full w-full border-none bg-white"
                title={safeTitle}
              />
            )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-[10px] font-medium text-slate-400">
            Hanya untuk keperluan internal DSN-MUI Amanah.
          </p>

          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />

            <span className="text-[10px] font-bold uppercase tracking-tight text-emerald-600">
              Verified Protocol
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentReader;