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
  User as UserIcon,
  Users,
  Plus,
  Trash2,
  X,
  Send,
  Eye
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import DocumentReader from "@/components/documents/DocumentReader";
import { useAuthStore } from "@/stores/auth.store";
import Can from "@/components/auth/Can";

// ── Approval Submit Modal ──────────────────────────────────────────────────
const ApprovalSubmitModal = ({
  documentId,
  onClose,
  onSuccess,
}: {
  documentId: string;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [users, setUsers] = useState<any[]>([]);
  const [steps, setSteps] = useState<{ userId: string }[]>([{ userId: "" }]);
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(true);

  useEffect(() => {
    api.get("/users")
      .then((res) => setUsers(res.data.data))
      .catch((err) => console.error("Failed to fetch users", err))
      .finally(() => setFetchingUsers(false));
  }, []);

  const handleAddStep = () => setSteps([...steps, { userId: "" }]);
  const handleRemoveStep = (index: number) => setSteps(steps.filter((_, i) => i !== index));
  const handleUserChange = (index: number, val: string) => {
    const newSteps = [...steps];
    newSteps[index].userId = val;
    setSteps(newSteps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (steps.some((s) => !s.userId)) {
      alert("Harap pilih penandatangan untuk semua urutan.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/workflow/submit", {
        documentId,
        stepConfig: steps.map((s, i) => ({ stepNumber: i + 1, userId: s.userId })),
      });
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal mengajukan persetujuan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl w-full max-w-lg p-6 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Alur Persetujuan</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">Tentukan siapa saja yang harus menandatangani dokumen ini secara berurutan.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
            <X size={18} />
          </button>
        </div>

        {fetchingUsers ? (
          <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-3 items-center group">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                    {idx + 1}
                  </div>
                  <select
                    required
                    value={step.userId}
                    onChange={(e) => handleUserChange(idx, e.target.value)}
                    className="flex-1 px-4 py-3 bg-[#F7F5EC] border border-[#DDDBC9] rounded-xl outline-none focus:border-[#006633]/50 focus:bg-white text-sm appearance-none"
                  >
                    <option value="">— Pilih Penandatangan —</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.fullName} ({u.role.name})</option>
                    ))}
                  </select>
                  {steps.length > 1 && (
                    <button type="button" onClick={() => handleRemoveStep(idx)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button type="button" onClick={handleAddStep} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 font-bold text-sm hover:border-slate-300 hover:bg-slate-50 transition-all">
              <Plus size={16} /> Tambah Penandatangan
            </button>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-50 border border-slate-200 transition-all">
                Batal
              </button>
              <button type="submit" disabled={loading} className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #006633 0%, #1B7F4A 100%)' }}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Mulai Workflow</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ── Workflow Edit Modal ────────────────────────────────────────────────────
const WorkflowEditModal = ({
  documentId,
  onClose,
  onSuccess,
}: {
  documentId: string;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [users, setUsers] = useState<any[]>([]);
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    api.get("/users")
      .then((res) => setUsers(res.data.data))
      .catch((err) => console.error("Failed to fetch users", err));

    api.get(`/workflow/document/${documentId}`)
      .then((res) => {
        if (res.data.status === "success" && res.data.data.length > 0) {
          setSteps(res.data.data);
        } else {
          setSteps([{ userId: "" }]);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch current steps", err);
        setSteps([{ userId: "" }]);
      })
      .finally(() => setFetching(false));
  }, [documentId]);

  const handleAddStep = () => setSteps([...steps, { userId: "", status: "WAITING" }]);
  const handleRemoveStep = (index: number) => {
    if (steps[index].status === "APPROVED") return;
    setSteps(steps.filter((_, i) => i !== index));
  };
  const handleUserChange = (index: number, val: string) => {
    if (steps[index].status === "APPROVED") return;
    const newSteps = [...steps];
    newSteps[index].userId = val;
    setSteps(newSteps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (steps.some((s) => !s.userId)) {
      alert("Harap pilih penandatangan untuk semua urutan.");
      return;
    }
    setLoading(true);
    try {
      await api.put(`/workflow/document/${documentId}`, {
        stepConfig: steps.map((s, i) => ({ stepNumber: i + 1, userId: s.userId })),
      });
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal mengubah alur persetujuan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl w-full max-w-lg p-6 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ubah Alur Persetujuan</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">Langkah yang sudah disetujui terkunci dan tidak dapat diubah.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
            <X size={18} />
          </button>
        </div>

        {fetching ? (
          <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-2">
              {steps.map((step, idx) => {
                const isApproved = step.status === "APPROVED";
                return isApproved ? (
                  <div key={idx} className="flex gap-3 items-start group">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-2">
                      <CheckCircle2 size={12} />
                    </div>
                    <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-800 dark:text-white">{step.approver || "Approver " + (idx + 1)}</p>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                          APPROVED
                        </span>
                      </div>
                      {step.actionedAt && (
                        <p className="text-[9px] text-slate-400 font-mono">
                          {new Date(step.actionedAt).toLocaleString('id-ID')}
                        </p>
                      )}
                      {step.comment && (
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 italic mt-1 leading-relaxed bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                          &ldquo;{step.comment}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div key={idx} className="flex gap-3 items-center group">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                      {idx + 1}
                    </div>
                    <select
                      required
                      value={step.userId || ""}
                      onChange={(e) => handleUserChange(idx, e.target.value)}
                      className="flex-1 px-4 py-3 bg-[#F7F5EC] border border-[#DDDBC9] rounded-xl outline-none focus:border-[#006633]/50 focus:bg-white text-sm appearance-none"
                    >
                      <option value="">— Pilih Penandatangan —</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.fullName} ({u.role.name})</option>
                      ))}
                    </select>
                    {steps.length > 1 && (
                      <button type="button" onClick={() => handleRemoveStep(idx)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <button type="button" onClick={handleAddStep} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 font-bold text-sm hover:border-slate-300 hover:bg-slate-50 transition-all">
              <Plus size={16} /> Tambah Penandatangan
            </button>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-50 border border-slate-200 transition-all">
                Batal
              </button>
              <button type="submit" disabled={loading} className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #006633 0%, #1B7F4A 100%)' }}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Simpan Perubahan</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ── Revision Modal ──────────────────────────────────────────────────
const RevisionModal = ({
  documentId,
  onClose,
  onSuccess
}: {
  documentId: string;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert("Pilih file revisi terlebih dahulu");

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("changeNotes", notes || "Revisi Dokumen");

      await api.put(`/documents/${documentId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal mengunggah revisi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 p-8 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
              <Plus size={20} />
            </div>
            Upload Revisi Baru
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 ml-1">File Dokumen Baru</label>
            <div className="relative group">
              <input required type="file" onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div className="w-full px-4 py-8 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-2 group-hover:border-blue-500/50 group-hover:bg-blue-50/10 transition-all">
                <Download size={24} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-blue-500 truncate max-w-[200px]">
                  {file ? file.name : "Klik atau seret file revisi (PDF/Word)"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 ml-1">Catatan Perubahan (Opsional)</label>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Jelaskan apa saja yang diperbaiki..."
              className="w-full h-24 px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm outline-none ring-2 ring-transparent focus:ring-blue-500/20 transition-all resize-none"
            />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 size={20} className="animate-spin" /> : <><Send size={18} /> Kirim Revisi</>}
          </button>
        </form>
      </div>
    </div>
  );
};

const DocumentDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isWorkflowEditModalOpen, setIsWorkflowEditModalOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [readerDoc, setReaderDoc] = useState<{ title: string, fileUrl: string } | null>(null);
  const user = useAuthStore((state) => state.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isSuperOrAdmin = user && ['SUPER_ADMIN', 'ORG_ADMIN'].includes(user.role);
  const canDeleteVersionRole = mounted && isSuperOrAdmin; 

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

  const handleDeleteVersion = async (versionId: string) => {
    if (!confirm("Yakin ingin menghapus versi dokumen ini secara permanen?")) return;
    try {
      await api.delete(`/documents/${params.id}/versions/${versionId}`);
      fetchDetail();
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menghapus versi dokumen");
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

  /**
   * Opens the document HTML in a new browser window with a print button.
   * The user can then use Ctrl+P / Cmd+P to Save as PDF.
   * This approach is 100% reliable - no external libraries, no Puppeteer.
   */
  const openPrintWindow = (htmlText: string, fileName: string) => {
    if (typeof window === 'undefined') return;

    // Extract <style> tags and <body> content only
    const styles = (htmlText.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || []).join('\n');
    const bodyMatch = htmlText.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : htmlText;

    // Build a clean, printable HTML page
    const printHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fileName || 'Dokumen'}</title>
  ${styles}
  <style>
    @media print {
      .print-btn-bar { display: none !important; }
      body { margin: 0 !important; }
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
      cursor: pointer; display: flex; align-items: center; gap: 8px;
    }
    .print-btn:hover { background: #dbeafe; }
    body { padding-top: 56px; }
    @media print { body { padding-top: 0; } }
  </style>
</head>
<body>
  <div class="print-btn-bar">
    <span>📄 ${fileName ? fileName.replace(/\.(html?|htm)$/i, '.pdf') : 'Dokumen'}</span>
    <button class="print-btn" onclick="window.print()">🖨️ Cetak / Simpan sebagai PDF</button>
  </div>
  ${bodyContent}
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 800);
    });
  <\/script>
</body>
</html>`;

    const blob = new Blob([printHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWin = window.open(url, '_blank');
    if (!printWin) {
      alert('Popup diblokir browser. Izinkan popup untuk halaman ini dan coba lagi.');
      URL.revokeObjectURL(url);
      return;
    }
    // Cleanup blob URL after window opens
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  /**
   * Downloads a document as PDF. For HTML template docs, calls the /render endpoint
   * which returns HTML with QR codes injected, then opens a print window.
   */
  const handleDownloadLatestAsPdf = async (docId: string, fileName: string) => {
    try {
      const BASE_URL = typeof window !== 'undefined'
        ? (process.env.NEXT_PUBLIC_API_URL || (window.location.hostname.includes('mscode.id') ? 'https://mui-api.mscode.id/api' : 'http://localhost:4002/api'))
        : 'http://localhost:4002/api';
      const baseUrl = BASE_URL.replace(/\/api\/?$/, '');
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

      const res = await fetch(`${baseUrl}/api/documents/${docId}/render`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }

      const htmlText = await res.text();
      openPrintWindow(htmlText, fileName);
    } catch (err) {
      console.error('Gagal mengunduh PDF:', err);
      alert('Gagal mengunduh PDF. Silakan coba lagi.');
    }
  };

  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const BASE_URL = typeof window !== 'undefined'
        ? (process.env.NEXT_PUBLIC_API_URL || (window.location.hostname.includes('mscode.id') ? 'https://mui-api.mscode.id/api' : 'http://localhost:4002/api'))
        : 'http://localhost:4002/api';
      const baseUrl = BASE_URL.replace(/\/api\/?$/, '');
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const safeFileUrl = fileUrl || '';
      const fullUrl = safeFileUrl.startsWith('http://') || safeFileUrl.startsWith('https://')
        ? safeFileUrl
        : `${baseUrl}/${safeFileUrl.startsWith('/') ? safeFileUrl.slice(1) : safeFileUrl}`;

      const res = await fetch(fullUrl, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const contentType = res.headers.get('Content-Type') || '';
      const contentDisposition = res.headers.get('Content-Disposition') || '';
      let finalFileName = fileName || 'dokumen';
      const cdMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (cdMatch && cdMatch[1]) finalFileName = cdMatch[1];

      if (contentType.includes('text/html')) {
        const htmlText = await res.text();
        openPrintWindow(htmlText, finalFileName);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', finalFileName.match(/\.(html?|htm)$/i)
        ? finalFileName.replace(/\.(html?|htm)$/i, '.pdf')
        : finalFileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Gagal mengunduh berkas', err);
      alert('Gagal mengunduh berkas');
    }
  };

  const handleDownloadLatest = () => {
    if (!doc || !doc.versions || doc.versions.length === 0) return;
    const latestVersion = doc.versions[0];
    const isTemplate = latestVersion.fileName?.toLowerCase().endsWith('.html') || latestVersion.mimeType === 'text/html';
    if (isTemplate) {
      handleDownloadLatestAsPdf(doc.id, latestVersion.fileName);
    } else {
      handleDownloadFile(latestVersion.fileUrl, latestVersion.fileName);
    }
  };


  return (
    <div className="space-y-8 pb-20">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-primary font-bold transition-colors group w-fit"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Kembali</span>
        </button>
        <div className="flex items-center gap-3">
          <Can perform="DOC_EDIT">
            {doc.status === 'REVISION' && (
              <button
                onClick={() => setIsRevisionModalOpen(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all text-sm"
              >
                <Plus size={18} />
                <span>Kirim Revisi</span>
              </button>
            )}
          </Can>
          <button onClick={handleDownloadLatest} className="flex-1 sm:flex-none flex items-center justify-center gap-2 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-primary transition-all">
            <Download size={20} />
            <span className="sm:hidden text-xs font-bold">Unduh</span>
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
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className={cn(
                    "text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-sm uppercase tracking-tight",
                    doc.status === 'SIGNED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/50' :
                      doc.status === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/50' :
                        'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  )}>
                    {doc.status}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{doc.category?.name}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">{doc.title}</h1>
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-tight">Nomor:</span>
                    <span className="text-[10px] sm:text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-800">{doc.documentNumber || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-tight">Klasifikasi:</span>
                    <span className={cn(
                      "text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-md border",
                      doc.classification?.level === 'RAHASIA' ? 'text-red-600 border-red-100 bg-red-50' : 'text-slate-600 border-slate-100 bg-slate-50'
                    )}>
                      {doc.classification?.name}
                    </span>
                  </div>
                </div>
              </div>
              <Can perform="DOC_UPLOAD">
                {doc.status === 'DRAFT' && (
                  <button
                    onClick={() => setIsApprovalModalOpen(true)}
                    className="shrink-0 flex items-center justify-center gap-2 px-6 py-4 sm:py-3 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all w-full md:w-auto"
                    style={{ background: 'linear-gradient(135deg, #006633 0%, #1B7F4A 100%)', boxShadow: '0 4px 16px rgba(0,102,51,0.2)' }}
                  >
                    <Play size={20} />
                    <span>Ajukan Persetujuan</span>
                  </button>
                )}
              </Can>
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
            <div className="bg-white dark:bg-slate-900 rounded-[24px] sm:rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                      <th className="text-left py-4 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold w-20">Versi</th>
                      <th className="text-left py-4 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold">Nama File</th>
                      <th className="text-left py-4 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold w-32">Ukuran</th>
                      <th className="text-left py-4 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold w-40">Waktu</th>
                      <th className="text-right py-4 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold w-32">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {doc.versions.map((v: any, idx: number) => (
                      <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                        <td className="py-4 px-6">
                          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">v{v.versionNum}</span>
                        </td>
                        <td className="py-4 px-6 relative w-full">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate pr-4" title={v.fileName}>{v.fileName}</p>
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-500 font-mono">
                          {(v.fileSize / 1024 / 1024).toFixed(2)} MB
                        </td>
                        <td className="py-4 px-6 text-[11px] text-slate-400">
                          {new Date(v.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                          <td className="py-4 px-6 flex items-center justify-end gap-2 text-right">
                            <Can perform="DOC_VIEW">
                              <button onClick={() => setReaderDoc({ title: v.fileName, fileUrl: v.fileName?.toLowerCase().endsWith('.html') || v.mimeType === 'text/html' ? `/api/documents/${doc.id}/versions/${v.id}/download` : v.fileUrl })} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary rounded-lg transition-all" title="Lihat Dokumen">
                                <Eye size={16} />
                              </button>
                            </Can>
                            <button onClick={() => handleDownloadFile(v.fileName?.toLowerCase().endsWith('.html') || v.mimeType === 'text/html' ? `/api/documents/${doc.id}/versions/${v.id}/download` : v.fileUrl, v.fileName)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary rounded-lg transition-all" title="Unduh">
                              <Download size={16} />
                            </button>
                            <Can perform="DOC_DELETE">
                              {doc.versions.length > 1 && v.versionNum > 1 && (
                                <button onClick={() => handleDeleteVersion(v.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 rounded-lg transition-all" title="Hapus Versi">
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </Can>
                          </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Feed View */}
              <div className="md:hidden divide-y divide-slate-50 dark:divide-slate-800">
                {doc.versions.map((v: any, idx: number) => (
                  <div key={v.id} className="p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">v{v.versionNum}</span>
                      <span className="text-[10px] font-mono text-slate-400">{(v.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{v.fileName}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] text-slate-400">{new Date(v.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      <div className="flex items-center gap-1.5">
                        <Can perform="DOC_VIEW">
                          <button onClick={() => setReaderDoc({ title: v.fileName, fileUrl: v.fileName?.toLowerCase().endsWith('.html') || v.mimeType === 'text/html' ? `/api/documents/${doc.id}/versions/${v.id}/download` : v.fileUrl })} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 rounded-lg text-[10px] font-bold text-blue-600 transition-all">
                            <Eye size={14} /> Lihat
                          </button>
                        </Can>
                        <Can perform="DOC_DELETE">
                          {doc.versions.length > 1 && v.versionNum > 1 && (
                            <button onClick={() => handleDeleteVersion(v.id)} className="flex items-center justify-center p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 rounded-lg text-red-500 transition-all" title="Hapus Versi">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </Can>
                        <button onClick={() => handleDownloadFile(v.fileName?.toLowerCase().endsWith('.html') || v.mimeType === 'text/html' ? `/api/documents/${doc.id}/versions/${v.id}/download` : v.fileUrl, v.fileName)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-primary transition-all">
                          <Download size={14} /> Unduh
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Sidebar Info */}
        <div className="space-y-8">
          {/* Workflow Status Card */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck size={20} className="text-primary" />
                Status Workflow
              </h3>
              {doc.workflowInstances && doc.workflowInstances.length > 0 &&
                !['COMPLETED', 'REJECTED'].includes(doc.workflowInstances[doc.workflowInstances.length - 1].status) &&
                (doc.creatorId === user?.id || isSuperOrAdmin || (user && user.role === 'ADMIN')) && (
                  <button
                    onClick={() => setIsWorkflowEditModalOpen(true)}
                    className="px-4 py-1.5 border border-red-200 dark:border-red-800 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                  >
                    Ubah
                  </button>
              )}
            </div>

            {doc.workflowInstances && doc.workflowInstances.length > 0 ? (
              <div className="relative space-y-6 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                {doc.workflowInstances[doc.workflowInstances.length - 1].steps
                  .sort((a: any, b: any) => b.stepNumber - a.stepNumber)
                  .map((step: any, idx: number) => (
                    <div key={step.id} className="relative pl-10">
                      {/* Step dot */}
                      <div className={cn(
                        "absolute left-0 top-1 w-8 h-8 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold z-10 transition-all shadow-sm",
                        step.status === 'APPROVED' ? "bg-emerald-500 text-white" :
                          step.status === 'PENDING' ? "bg-amber-500 text-white animate-pulse" :
                            step.status === 'REJECTED' ? "bg-red-500 text-white" :
                              step.status === 'REVISION' ? "bg-amber-100 text-amber-600" :
                                "bg-slate-100 text-slate-400 dark:bg-slate-800"
                      )}>
                        {step.status === 'APPROVED' ? <CheckCircle2 size={12} /> : step.stepNumber}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn(
                            "text-xs font-bold leading-none",
                            step.status === 'PENDING' ? "text-amber-600" : "text-slate-900 dark:text-white"
                          )}>
                            {step.user?.fullName || "Approver " + step.stepNumber}
                          </p>
                          <span className={cn(
                            "text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-tight",
                            step.status === 'APPROVED' ? "bg-emerald-50 text-emerald-600" :
                              step.status === 'PENDING' && step.actionedAt ? "bg-blue-50 text-blue-600" :
                                step.status === 'PENDING' ? "bg-amber-50 text-amber-600" :
                                  "bg-slate-50 text-slate-400"
                          )}>
                            {step.status === 'PENDING' && step.actionedAt ? 'PENDING - REVISI MASUK' : step.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {step.user?.jabatan?.name || step.user?.role?.name || "Penandatangan"}
                        </p>
                        {step.comment && (
                          <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] text-slate-600 dark:text-slate-400 italic leading-relaxed">&ldquo;{step.comment}&rdquo;</p>
                            {step.status === 'PENDING' && step.actionedAt && (
                              <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/50 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400">Telah direvisi oleh Admin (v{doc.versions.length}). Silakan periksa kembali.</p>
                              </div>
                            )}
                          </div>
                        )}
                        {step.actionedAt && (
                          <p className="text-[8px] text-slate-400 mt-1 font-mono">
                            {new Date(step.actionedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
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
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detail Pembuat</h3>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                <UserIcon size={22} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 dark:text-white leading-tight mb-1 truncate">{doc.creator.fullName}</p>
                <p className="text-[11px] text-slate-500 truncate">{doc.creator.email}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-50 dark:border-slate-800 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1">Dibuat</p>
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{new Date(doc.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1">Update</p>
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{new Date(doc.updatedAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          </div>

          {/* Security / QR Placeholder */}
          <div className="p-8 rounded-[32px] gradient-primary text-white shadow-xl shadow-primary/20 flex flex-col items-center text-center gap-4">
            <div className="w-20 h-20 bg-white rounded-2xl p-2 shadow-inner">
              {/* Placeholder for QR Code */}
              <div className="w-full h-full bg-slate-50 flex items-center justify-center text-[10px] font-mono text-slate-400 text-center leading-tight">
                VERIFIED<br />BY MUI
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm">Verifikasi Dokumen</h4>
              <p className="text-[10px] text-white/70 leading-relaxed">Gunakan kode QR ini untuk memverifikasi keaslian dokumen di luar sistem.</p>
            </div>
          </div>
        </div>
      </div>

      {isApprovalModalOpen && (
        <ApprovalSubmitModal
          documentId={doc.id}
          onClose={() => setIsApprovalModalOpen(false)}
          onSuccess={() => {
            setIsApprovalModalOpen(false);
            fetchDetail();
          }}
        />
      )}

      {isWorkflowEditModalOpen && (
        <WorkflowEditModal
          documentId={doc.id}
          onClose={() => setIsWorkflowEditModalOpen(false)}
          onSuccess={() => {
            setIsWorkflowEditModalOpen(false);
            fetchDetail();
          }}
        />
      )}

      {/* Document Reader Modal */}
      <DocumentReader
        isOpen={!!readerDoc}
        onClose={() => setReaderDoc(null)}
        title={readerDoc?.title || ""}
        fileUrl={readerDoc?.fileUrl || ""}
      />

      {/* Revision Modal */}
      {isRevisionModalOpen && (
        <RevisionModal
          documentId={doc.id}
          onClose={() => setIsRevisionModalOpen(false)}
          onSuccess={() => {
            setIsRevisionModalOpen(false);
            fetchDetail();
          }}
        />
      )}
    </div>
  );
};

export default DocumentDetailPage;
