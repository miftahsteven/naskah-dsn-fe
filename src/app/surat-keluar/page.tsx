"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Download,
  Eye,
  FileBadge,
  Loader2,
  AlertCircle,
  ChevronDown,
  X,
  Pencil,
  Archive,
  Trash2,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileUp,
  Play,
  Send,
  User as UserIcon,
  ExternalLink,
  ShieldCheck,
  History,
} from "lucide-react";
import api, { getBaseUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import Can from "@/components/auth/Can";
import DocumentReader from "@/components/documents/DocumentReader";

const statusClass = (status: string) => {
  const map: Record<string, string> = {
    SIGNED: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/50",
    PENDING_APPROVAL: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/50",
    REJECTED: "bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:border-red-900/50",
  };
  return map[status] ?? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
};

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

const DocumentPreview = ({ fileUrl, title, docId }: { fileUrl: string, title: string, docId?: string }) => {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const BASE_URL = getBaseUrl();
  const safeFileUrl = fileUrl || "";
  const fullUrl = safeFileUrl.startsWith("http://") || safeFileUrl.startsWith("https://")
    ? safeFileUrl
    : `${BASE_URL}/${safeFileUrl.startsWith("/") ? safeFileUrl.slice(1) : safeFileUrl}`;

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  let fullUrlWithToken = fullUrl;
  if (token && (fullUrl.startsWith("http://") || fullUrl.startsWith("https://"))) {
    const separator = fullUrl.includes('?') ? '&' : '?';
    fullUrlWithToken = `${fullUrl}${separator}token=${encodeURIComponent(token)}`;
  }

  const isDocx = title.toLowerCase().endsWith('.docx') || title.toLowerCase().endsWith('.doc') || safeFileUrl.toLowerCase().endsWith('.docx') || safeFileUrl.toLowerCase().endsWith('.doc');
  const isPdf = title.toLowerCase().endsWith('.pdf') || safeFileUrl.toLowerCase().endsWith('.pdf');
  const isHtml = title.toLowerCase().endsWith('.html') || safeFileUrl.toLowerCase().endsWith('.html') || (!isDocx && !isPdf);

  useEffect(() => {
    if (isHtml) {
      setHtmlContent(null);
      setFetchError(null);
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const fileBasename = safeFileUrl.replace(/^.*[/\\]/, '').replace(/\.(html?|pdf)$/i, '');
      const extractedDocId = docId 
        || fullUrl.match(/\/api\/documents\/([^/?]+)/)?.[1]
        || (fileBasename.startsWith('file-') ? fileBasename : undefined);

      const targetPreviewUrl = extractedDocId 
        ? `${BASE_URL}/api/documents/${encodeURIComponent(extractedDocId)}/render`
        : (fullUrlWithToken.includes('?') ? `${fullUrlWithToken}&preview=html` : `${fullUrlWithToken}?preview=html`);

      fetch(targetPreviewUrl, { headers })
        .then(async res => {
          if (!res.ok) {
            let msg = `HTTP ${res.status}`;
            try {
              const errJson = await res.json();
              if (errJson.message) msg = errJson.message;
            } catch (e) {}
            throw new Error(msg);
          }
          return res.text();
        })
        .then(text => setHtmlContent(text))
        .catch(err => {
          console.error("Failed to load HTML preview:", err);
          setFetchError(err.message || "Gagal memuat pratinjau dokumen.");
        });
    }
  }, [isHtml, fullUrlWithToken, docId, safeFileUrl, fullUrl, BASE_URL, token]);

  const viewerUrl = isDocx 
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fullUrlWithToken)}` 
    : fullUrlWithToken;

  if (isHtml) {
    if (fetchError) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 bg-slate-50 dark:bg-slate-900 p-4 text-center">
          <p className="text-xs font-bold mb-1">Gagal memuat pratinjau dokumen.</p>
          <p className="text-[11px] text-slate-500 font-mono">{typeof fetchError === 'string' ? fetchError : ''}</p>
        </div>
      );
    }
    if (htmlContent === null) {
      return (
        <div className="absolute inset-0 flex items-center justify-center text-slate-300 bg-slate-50 dark:bg-slate-900">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-primary/30" />
            <p className="text-xs font-bold uppercase tracking-widest opacity-50">Memuat dokumen...</p>
          </div>
        </div>
      );
    }
    return (
      <div className="absolute inset-0 overflow-y-auto bg-[#e5e7eb] dark:bg-slate-950 p-2 md:p-6 lg:p-8 flex justify-center scrollbar-thin">
         <div className="w-full max-w-[794px] min-h-[1123px] bg-white shadow-2xl ring-1 ring-black/5 relative flex-shrink-0">
           <iframe srcDoc={htmlContent} className="w-full h-full absolute inset-0 border-none bg-white" title={title} />
         </div>
      </div>
    );
  }

  return <iframe src={viewerUrl} className="absolute inset-0 w-full h-full border-none bg-white" title={title} />;
};

const DocumentsPage = () => {
  const router = useRouter();
  const [documents, setDocuments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [classifications, setClassifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");

  // Pagination & Header Column Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [colFilters, setColFilters] = useState({
    title: "",
    classification: "",
    status: "",
    creator: "",
  });

  // Right Sidebar States
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [sidebarDoc, setSidebarDoc] = useState<any>(null);
  const [fetchingSidebar, setFetchingSidebar] = useState(false);
  const [readerDoc, setReaderDoc] = useState<{ title: string, fileUrl: string, id?: string } | null>(null);

  // Sidebar Modals
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isWorkflowEditModalOpen, setIsWorkflowEditModalOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);

  const fetchSidebarDetail = async (id: string) => {
    try {
      setFetchingSidebar(true);
      const res = await api.get(`/documents/${id}`);
      setSidebarDoc(res.data.data);
    } catch (err) {
      console.error("Gagal memuat detail sidebar", err);
    } finally {
      setFetchingSidebar(false);
    }
  };

  useEffect(() => {
    if (selectedDocId) {
      fetchSidebarDetail(selectedDocId);
    } else {
      setSidebarDoc(null);
    }
  }, [selectedDocId]);

  const getLatestVersion = (doc: any) => {
    if (!doc.versions || doc.versions.length === 0) return null;
    return [...doc.versions].sort((a, b) => b.versionNum - a.versionNum)[0];
  };

  const handleViewDocument = (doc: any) => {
    setSelectedDocId(doc.id);
  };

  /**
   * Opens a print window with the rendered HTML for browser-native PDF saving.
   * No external libraries needed - uses browser's built-in print-to-PDF feature.
   */
  const openPrintWindow = (htmlText: string, fileName: string) => {
    if (typeof window === 'undefined') return;

    const BASE_URL = getBaseUrl();
    let processedHtml = htmlText;

    // Convert relative image URLs (e.g. images/logo-dsn.png) to absolute URL
    processedHtml = processedHtml.replace(/src=["']\/?(images\/[^"']+)["']/gi, `src="${BASE_URL}/$1"`);

    const styles = (processedHtml.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || []).join('\n');
    const bodyMatch = processedHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : processedHtml;

    const printHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <base href="${BASE_URL}/">
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
      cursor: pointer;
    }
    .print-btn:hover { background: #dbeafe; }
    body { padding-top: 56px; }
    @media print { body { padding-top: 0; } }
    img.qr-signature-img {
      width: 70px !important;
      height: 70px !important;
      max-width: 70px !important;
      max-height: 70px !important;
      min-width: 70px !important;
      min-height: 70px !important;
      display: inline-block !important;
      object-fit: contain !important;
    }
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
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  /**
   * For HTML template documents: calls /render to get HTML with QR injected,
   * then opens a print window for browser-native PDF saving.
   */
  const downloadDocumentAsPdf = async (docId: string, fileName: string) => {
    try {
      const BASE_URL = getBaseUrl();
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

      const res = await fetch(`${BASE_URL}/api/documents/${docId}/render`, {
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
      const BASE_URL = getBaseUrl();
      const safeFileUrl = fileUrl || "";
      const fullUrl = safeFileUrl.startsWith("http://") || safeFileUrl.startsWith("https://")
        ? safeFileUrl
        : `${BASE_URL}/${safeFileUrl.startsWith("/") ? safeFileUrl.slice(1) : safeFileUrl}`;

      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(fullUrl, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const contentType = res.headers.get('Content-Type') || '';
      const contentDisposition = res.headers.get('Content-Disposition');
      let finalFileName = fileName || 'dokumen';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          finalFileName = match[1];
        }
      }

      if (contentType.includes('text/html')) {
        const htmlText = await res.text();
        openPrintWindow(htmlText, finalFileName);
        return;
      }

      if (!finalFileName.toLowerCase().endsWith('.pdf')) {
        finalFileName = finalFileName.replace(/\.(html?|htm)$/i, '') + '.pdf';
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', finalFileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Gagal mengunduh berkas", err);
      alert("Gagal mengunduh berkas");
    }
  };

  const handleDownloadDocument = (doc: any) => {
    const latestVersion = getLatestVersion(doc);
    if (!latestVersion) {
      alert("Tidak ada file untuk diunduh");
      return;
    }
    const isTemplate = latestVersion.fileName?.toLowerCase().endsWith('.html') || latestVersion.mimeType === 'text/html';
    if (isTemplate) {
      downloadDocumentAsPdf(doc.id, latestVersion.fileName);
    } else {
      handleDownloadFile(latestVersion.fileUrl, latestVersion.fileName);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [docsRes, metaRes] = await Promise.all([
        api.get("/documents", {
          params: { search, status: statusFilter, categoryId: categoryFilter, classificationId: classFilter, documentType: "OUTGOING" },
        }),
        api.get("/documents/meta"),
      ]);
      setDocuments(docsRes.data.data);
      setCategories(metaRes.data.data.categories);
      setClassifications(metaRes.data.data.classifications);
    } catch {
      setError("Gagal memuat dokumen");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [statusFilter, categoryFilter, classFilter]);

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchData(); };
  const resetFilters = () => { setStatusFilter(""); setCategoryFilter(""); setClassFilter(""); };

  const handleArchive = async (id: string) => {
    if (!confirm("Arsip dokumen ini?")) return;
    try {
      setActionLoading(true);
      await api.patch(`/documents/${id}/archive`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal mengarsipkan dokumen");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setActionLoading(true);
      await api.delete(`/documents/${id}`);
      fetchData();
      setIsDeleteConfirmOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menghapus dokumen");
    } finally {
      setActionLoading(false);
    }
  };

  const FilterPanel = () => (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Status</label>
        <div className="relative">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm appearance-none outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">Semua Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="SIGNED">Signed</option>
            <option value="REJECTED">Rejected</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
        <div className="relative">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm appearance-none outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">Semua Kategori</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Klasifikasi</label>
        <div className="relative">
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
            className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm appearance-none outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">Semua Klasifikasi</option>
            {classifications.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>
      <button onClick={resetFilters} className="w-full py-3 text-xs font-bold text-slate-400 hover:text-primary transition-colors border-t border-slate-100 dark:border-slate-800 pt-4">
        Reset Semua Filter
      </button>
    </div>
  );

  const EditDocumentModal = ({ doc }: { doc: any }) => {
    const [title, setTitle] = useState(doc?.title || "");
    const [catId, setCatId] = useState(doc?.categoryId || "");
    const [clsId, setClsId] = useState(doc?.classificationId || "");
    const [docNum, setDocNum] = useState(doc?.documentNumber || "");
    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        setActionLoading(true);
        const formData = new FormData();
        formData.append("title", title);
        formData.append("categoryId", catId);
        formData.append("classificationId", clsId);
        formData.append("documentNumber", docNum);
        if (file) formData.append("file", file);
        await api.put(`/documents/${doc.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        fetchData();
        setIsEditModalOpen(false);
      } catch (err: any) {
        alert(err.response?.data?.message || "Gagal memperbarui dokumen");
      } finally {
        setActionLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
        <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Pencil size={20} />
                </div>
                Edit Dokumen
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 ml-1">Judul Dokumen</label>
                <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm outline-none ring-2 ring-transparent focus:ring-primary/20 transition-all" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 ml-1">Kategori</label>
                  <select value={catId} onChange={(e) => setCatId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm outline-none ring-2 ring-transparent focus:ring-primary/20 transition-all">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 ml-1">Klasifikasi</label>
                  <select value={clsId} onChange={(e) => setClsId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm outline-none ring-2 ring-transparent focus:ring-primary/20 transition-all">
                    {classifications.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 ml-1">Ganti File (Opsional)</label>
                <div className="relative group">
                  <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-2 group-hover:border-primary/50 group-hover:bg-primary/5 transition-all">
                    <FileUp size={24} className="text-slate-400 group-hover:text-primary transition-colors" />
                    <span className="text-xs font-bold text-slate-500 group-hover:text-primary truncate max-w-[200px]">
                      {file ? file.name : "Klik atau seret file baru ke sini"}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 italic font-medium ml-1">File yang diunggah akan tersimpan sebagai Versi Baru tanpa menghapus versi sebelumnya.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm">
                  Batal
                </button>
                <button type="submit" disabled={actionLoading}
                  className="flex-1 py-3.5 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 transition-all text-sm flex items-center justify-center gap-2">
                  {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const DocumentFlowModal = ({ doc }: { doc: any }) => {
    const workflow = doc?.workflowInstances?.[0]; // Show active/latest
    const steps = workflow?.steps || [];

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsFlowModalOpen(false)} />
        <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-5 duration-200">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600">
                  <Activity size={20} />
                </div>
                Alur Persetujuan
              </h3>
              <button onClick={() => setIsFlowModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {!workflow ? (
                <div className="py-12 text-center space-y-3">
                  <Clock size={40} className="mx-auto text-slate-200" />
                  <p className="text-sm font-bold text-slate-400">Dokumen dalam tahap draft, belum ada alur persetujuan.</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800" />
                  <div className="space-y-8">
                    {[...steps].sort((a: any, b: any) => b.stepNumber - a.stepNumber).map((step: any, idx: number) => (
                      <div key={idx} className="relative flex items-start gap-5">
                        <div className={cn(
                          "w-10 h-10 rounded-xl border-4 border-white dark:border-slate-900 z-10 flex items-center justify-center shadow-sm shrink-0",
                          step.status === 'APPROVED' ? "bg-emerald-500 text-white" :
                          step.status === 'REJECTED' ? "bg-red-500 text-white" :
                          step.status === 'PENDING' ? "bg-amber-500 text-white animate-pulse" : "bg-slate-100 text-slate-400"
                        )}>
                          {step.status === 'APPROVED' ? <CheckCircle2 size={16} /> :
                           step.status === 'REJECTED' ? <X size={16} /> :
                           step.status === 'PENDING' ? <Clock size={16} /> : <span className="text-[10px] font-bold">{step.stepNumber}</span>}
                        </div>
                        <div className="flex-1 pt-0.5 pb-2 border-b border-slate-50 dark:border-slate-800/50">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{step.user?.fullName || "User"}</p>
                            <span className={cn(
                              "text-[9px] font-bold px-2 py-0.5 rounded-full border",
                              step.status === 'APPROVED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                              step.status === 'REJECTED' ? "bg-red-50 text-red-600 border-red-100" :
                              step.status === 'PENDING' && step.actionedAt ? "bg-blue-50 text-blue-600 border-blue-100" :
                              step.status === 'PENDING' ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-slate-50 text-slate-400 border-slate-200"
                            )}>
                              {step.status === 'PENDING' && step.actionedAt ? 'PENDING - REVISI MASUK' : step.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">{step.user?.jobTitle || "Approval Step"}</p>
                          {step.comment && (
                            <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">"{step.comment}"</p>
                              {step.status === 'PENDING' && step.actionedAt && (
                                <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/50 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                  <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400">Telah direvisi oleh Admin. Silakan periksa kembali.</p>
                                </div>
                              )}
                            </div>
                          )}
                          {step.actionedAt && (
                            <p className="text-[9px] text-slate-400 mt-2 font-mono">{new Date(step.actionedAt).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => setIsFlowModalOpen(false)}
              className="mt-10 w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm">
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  };

  const DeleteConfirmationModal = ({ doc }: { doc: any }) => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsDeleteConfirmOpen(false)} />
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-8 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-500/10 rounded-3xl flex items-center justify-center text-red-600 dark:text-red-500 mx-auto mb-6">
          <Trash2 size={40} />
        </div>
        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Hapus Permanen?</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
          Dokumen <span className="font-bold text-slate-900 dark:text-white">"{doc?.title}"</span> dan seluruh filenya akan dihapus selamanya dari sistem. Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setIsDeleteConfirmOpen(false)}
            className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm">
            Batal
          </button>
          <button onClick={() => handleDelete(doc.id)} disabled={actionLoading}
            className="flex-1 py-3.5 bg-red-500 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all text-sm flex items-center justify-center gap-2">
            {actionLoading ? <Loader2 size={18} className="animate-spin" /> : "Ya, Hapus"}
          </button>
        </div>
      </div>
    </div>
  );

  // Client-side filtering logic
  const filteredDocuments = documents.filter((doc) => {
    // 1. Title & Number keyword filter
    if (colFilters.title) {
      const query = colFilters.title.toLowerCase();
      const titleMatch = doc.title?.toLowerCase().includes(query);
      const numberMatch = doc.documentNumber?.toLowerCase().includes(query);
      const categoryMatch = doc.category?.name?.toLowerCase().includes(query);
      if (!titleMatch && !numberMatch && !categoryMatch) return false;
    }
    // 2. Classification filter
    if (colFilters.classification) {
      const query = colFilters.classification.toLowerCase();
      const classMatch = doc.classification?.name?.toLowerCase().includes(query);
      if (!classMatch) return false;
    }
    // 3. Status select filter
    if (colFilters.status) {
      if (doc.status !== colFilters.status) return false;
    }
    // 4. Creator filter
    if (colFilters.creator) {
      const query = colFilters.creator.toLowerCase();
      const creatorMatch = doc.creator?.fullName?.toLowerCase().includes(query);
      if (!creatorMatch) return false;
    }
    return true;
  });

  // Client-side pagination logic
  const totalItems = filteredDocuments.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

  // Reset page when search/filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [colFilters, statusFilter, categoryFilter, classFilter, search]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-1 sm:mb-2 leading-tight flex items-center gap-3">
            <FileText size={28} className="text-primary flex-shrink-0" />
            <span>Surat Keluar (E-Sign)</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Kelola arsip surat keluar dan proses tanda tangan digital secara efisien.</p>
        </div>
        <Can perform="DOC_UPLOAD">
          <Link href="/surat-keluar/new" className="flex items-center gap-2 px-5 py-3 bg-[#006633] hover:bg-[#00552b] text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm w-full sm:w-auto justify-center">
            <Plus size={18} />
            <span>Buat Surat Keluar</span>
          </Link>
        </Can>
      </div>

      {/* Search + Filter Button */}
      <div className="flex gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
          <input type="text" placeholder="Cari judul atau nomor dokumen..."
            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-primary/50 transition-all text-sm shadow-sm"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </form>
        {/* Filter button — always visible, opens modal */}
        <button onClick={() => setFilterOpen(true)}
          className={`flex items-center gap-2 px-4 py-3 border rounded-2xl font-bold shadow-sm transition-all flex-shrink-0 text-sm
            ${ (statusFilter || categoryFilter || classFilter)
              ? 'bg-primary text-white border-primary hover:bg-primary/90'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}>
          <Filter size={18} />
          <span>Filter{(statusFilter || categoryFilter || classFilter) ? ' ●' : ''}</span>
        </button>
      </div>

      {/* Filter Modal — centered, all screen sizes */}
      {filterOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setFilterOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[28px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-base">
                <Filter size={18} className="text-primary" /> Filter Dokumen
              </h3>
              <button onClick={() => setFilterOpen(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <FilterPanel />
            </div>
            <div className="px-6 pb-6">
              <button
                onClick={() => { resetFilters(); setFilterOpen(false); }}
                className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                Reset &amp; Tutup
              </button>
            </div>
          </div>
        </div>
      )}

<div className="w-full">
          {/* Document List — full width */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm relative z-10 w-full overflow-hidden">
            {loading ? (
              <div className="py-24 sm:py-32 flex flex-col items-center justify-center gap-4 text-slate-400">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="font-medium animate-pulse">Memuat dokumen...</p>
              </div>
            ) : error ? (
              <div className="py-24 sm:py-32 flex flex-col items-center justify-center gap-4 text-red-500">
                <AlertCircle size={40} />
                <p className="font-bold">{error}</p>
                <button onClick={fetchData} className="text-sm font-bold underline">Coba Lagi</button>
              </div>
            ) : (
              <>
                {/* Desktop Table - ERP SAP B1 Style */}
                 <div className="hidden md:block relative overflow-x-auto w-full">
                   <table className="w-full min-w-[900px] text-xs border-collapse">
                     <thead className="bg-[#006633]/8 text-[#006633] dark:bg-[#006633]/15 dark:text-emerald-400">
                       <tr className="border-b border-slate-300 dark:border-slate-700">
                         <th className="text-center py-2.5 px-3 font-extrabold w-12">No.</th>
                         <th className="text-left py-2.5 px-3 font-extrabold border-l border-slate-300 dark:border-slate-700 w-[30%]">Judul & Metadata</th>
                         <th className="text-left py-2.5 px-3 font-extrabold border-l border-slate-300 dark:border-slate-700">Klasifikasi & Versi</th>
                         <th className="text-left py-2.5 px-3 font-extrabold border-l border-slate-300 dark:border-slate-700">Progress Alur</th>
                         <th className="text-left py-2.5 px-3 font-extrabold border-l border-slate-300 dark:border-slate-700">Status</th>
                         <th className="text-left py-2.5 px-3 font-extrabold border-l border-slate-300 dark:border-slate-700">Pembuat & Tanggal</th>
                         <th className="text-center py-2.5 px-3 font-extrabold border-l border-slate-300 dark:border-slate-700 w-[140px]">Aksi</th>
                       </tr>
                       {/* Column Header Filters */}
                       <tr className="bg-slate-100/80 dark:bg-slate-800/40 border-b border-slate-300 dark:border-slate-700">
                         <th className="py-1.5 px-2"></th>
                         <th className="py-1.5 px-2 border-l border-slate-300 dark:border-slate-700">
                           <div className="relative">
                             <input
                               type="text"
                               placeholder="Cari judul/nomor..."
                               value={colFilters.title}
                               onChange={(e) => setColFilters(prev => ({ ...prev, title: e.target.value }))}
                               className="w-full px-2 py-1 text-[11px] font-normal bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded outline-none focus:border-[#006633] focus:ring-1 focus:ring-[#006633]/20"
                             />
                             {colFilters.title && (
                               <button onClick={() => setColFilters(prev => ({ ...prev, title: "" }))} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-440 hover:text-slate-660">
                                 <X size={10} />
                               </button>
                             )}
                           </div>
                         </th>
                         <th className="py-1.5 px-2 border-l border-slate-300 dark:border-slate-700">
                           <div className="relative">
                             <input
                               type="text"
                               placeholder="Cari klasifikasi..."
                               value={colFilters.classification}
                               onChange={(e) => setColFilters(prev => ({ ...prev, classification: e.target.value }))}
                               className="w-full px-2 py-1 text-[11px] font-normal bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded outline-none focus:border-[#006633] focus:ring-1 focus:ring-[#006633]/20"
                             />
                             {colFilters.classification && (
                               <button onClick={() => setColFilters(prev => ({ ...prev, classification: "" }))} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-440 hover:text-slate-660">
                                 <X size={10} />
                               </button>
                             )}
                           </div>
                         </th>
                         <th className="py-1.5 px-2 border-l border-slate-300 dark:border-slate-700">
                           {/* Progress: spacer */}
                           <div className="h-6"></div>
                         </th>
                         <th className="py-1.5 px-2 border-l border-slate-300 dark:border-slate-700">
                           <select
                             value={colFilters.status}
                             onChange={(e) => setColFilters(prev => ({ ...prev, status: e.target.value }))}
                             className="w-full px-1 py-1 text-[11px] font-normal bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded outline-none focus:border-[#006633] focus:ring-1 focus:ring-[#006633]/20"
                           >
                             <option value="">Semua</option>
                             <option value="DRAFT">DRAFT</option>
                             <option value="PENDING_APPROVAL">PENDING</option>
                             <option value="SIGNED">SIGNED</option>
                             <option value="REJECTED">REJECTED</option>
                           </select>
                         </th>
                         <th className="py-1.5 px-2 border-l border-slate-300 dark:border-slate-700">
                           <div className="relative">
                             <input
                               type="text"
                               placeholder="Cari pembuat..."
                               value={colFilters.creator}
                               onChange={(e) => setColFilters(prev => ({ ...prev, creator: e.target.value }))}
                               className="w-full px-2 py-1 text-[11px] font-normal bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded outline-none focus:border-[#006633] focus:ring-1 focus:ring-[#006633]/20"
                             />
                             {colFilters.creator && (
                               <button onClick={() => setColFilters(prev => ({ ...prev, creator: "" }))} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-440 hover:text-slate-660">
                                 <X size={10} />
                               </button>
                             )}
                           </div>
                         </th>
                         <th className="py-1.5 px-2 border-l border-slate-300 dark:border-slate-700 text-center">
                           {(colFilters.title || colFilters.classification || colFilters.status || colFilters.creator) && (
                             <button
                               onClick={() => setColFilters({ title: "", classification: "", status: "", creator: "" })}
                               className="text-[10px] text-red-650 hover:text-red-855 font-bold transition-colors w-full flex items-center justify-center gap-0.5"
                             >
                               <X size={10} /> Clear
                             </button>
                           )}
                         </th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                       {paginatedDocuments.length === 0 ? (
                         <tr>
                           <td colSpan={7} className="py-8 text-center text-slate-400 font-medium bg-white dark:bg-slate-900">
                             Tidak ada dokumen yang cocok dengan filter kolom.
                           </td>
                         </tr>
                       ) : (
                         paginatedDocuments.map((doc, index) => {
                           const wf = doc.workflowInstances?.[0];
                           const steps = wf?.steps ? [...wf.steps].sort((a: any, b: any) => a.stepNumber - b.stepNumber) : [];
                           const totalSteps = steps.length;
                           const doneSteps = steps.filter((s: any) => s.status === 'APPROVED').length;
                           const currentVersion = doc.versions?.[doc.versions.length - 1]?.versionNum ?? doc.currentVersion ?? 1;
                           const rowNumber = (currentPage - 1) * pageSize + index + 1;

                           return (
                              <tr key={doc.id} className="hover:bg-amber-50/60 even:bg-slate-50/50 dark:hover:bg-slate-800/40 dark:even:bg-slate-800/20 transition-colors group">
                                {/* ── No. ── */}
                                <td className="py-2.5 px-3 border-b border-slate-200 dark:border-slate-800 align-top text-center font-mono font-bold text-slate-400 dark:text-slate-500">
                                  {rowNumber}
                                </td>

                                {/* ── Judul & Metadata ── */}
                                <td className="py-2.5 px-3 border-b border-l border-slate-200 dark:border-slate-800 align-top">
                                <div className="flex flex-col gap-1">
                                  <button onClick={() => handleViewDocument(doc)} className="font-bold text-[#006633] hover:underline transition-colors text-[13px] line-clamp-2 leading-snug text-left">
                                    {doc.title}
                                  </button>
                                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                    <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{doc.documentNumber || "No Nomor"}</span>
                                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{doc.category?.name ?? "—"}</span>
                                  </div>
                                  {doc.status === 'REVISION' && wf?.steps?.find((s: any) => s.status === 'REVISION') && (
                                    <div className="mt-1 px-2 py-1.5 bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                                      <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                                        <AlertCircle size={12} /> Revisi: {wf.steps.findLast((s: any) => s.status === 'REVISION')?.user?.fullName}
                                      </p>
                                    </div>
                                  )}
                                  {doc.status === 'REJECTED' && (
                                    <div className="mt-1 px-2 py-1.5 bg-red-50/80 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                                      <p className="text-[10px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                                        <X size={12} /> Ditolak: {wf?.steps?.findLast((s: any) => s.status === 'REJECTED')?.user?.fullName || "Approver"}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* ── Klasifikasi & Versi ── */}
                              <td className="py-2.5 px-3 border-b border-l border-slate-200 dark:border-slate-800 align-top">
                                <div className="flex flex-col gap-1.5">
                                  {doc.classification?.name ? (
                                    <span className="inline-flex items-center text-[10px] font-bold text-violet-700 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 px-1.5 py-0.5 rounded w-fit">
                                      {doc.classification.name}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic">—</span>
                                  )}
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 w-fit">
                                    v{currentVersion}
                                    {currentVersion > 1 && <span className="text-[#006633] font-black">↑</span>}
                                  </span>
                                </div>
                              </td>

                              {/* ── Progress Alur ── */}
                              <td className="py-2.5 px-3 border-b border-l border-slate-200 dark:border-slate-800 align-top">
                                {totalSteps === 0 ? (
                                  <span className="text-[10px] text-slate-400 italic">Belum ada alur</span>
                                ) : (
                                  <div className="flex flex-col gap-1 min-w-[110px]">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{doneSteps}/{totalSteps} Step</span>
                                      {doneSteps === totalSteps && totalSteps > 0 && (
                                        <CheckCircle2 size={12} className="text-[#006633]" />
                                      )}
                                    </div>
                                    <div className="flex items-center gap-0.5 mt-0.5">
                                      {steps.map((s: any, i: number) => (
                                        <div key={i} className={cn(
                                          "h-1.5 flex-1 rounded-sm border transition-all",
                                          s.status === 'APPROVED' ? "bg-[#006633] border-[#006633]" :
                                          s.status === 'REJECTED' ? "bg-red-500 border-red-500" :
                                          s.status === 'PENDING'  ? "bg-amber-400 border-amber-500 animate-pulse" :
                                          "bg-slate-200 border-slate-300 dark:bg-slate-700 dark:border-slate-600"
                                        )} title={`${s.roleId || 'Step ' + (i+1)}: ${s.user?.fullName || '—'} (${s.status})`} />
                                      ))}
                                    </div>

                                    {/* Display active step at that moment (Langkah saat itu) */}
                                    {(() => {
                                      const pendingSteps = steps.filter((s: any) => s.status === 'PENDING');
                                      if (pendingSteps.length > 0) {
                                        const role = pendingSteps[0]?.roleId || 'PENANDATANGAN';
                                        const stageName = role === 'PEMPARAF' ? 'Pemparaf' : role === 'APPROVER' ? 'Approver' : 'Penandatangan';
                                        const isParallel = role === 'PEMPARAF' || role === 'APPROVER';
                                        const names = pendingSteps.map((s: any) => s.user?.fullName).filter(Boolean).join(', ');

                                        return (
                                          <div className="mt-1 flex flex-col gap-0.5">
                                            <span className={cn(
                                              "inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded border w-fit uppercase tracking-tight",
                                              role === 'PEMPARAF' ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800" :
                                              role === 'APPROVER' ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800" :
                                              "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
                                            )}>
                                              <span>⏳ {stageName}</span>
                                              <span className="text-[8px] opacity-75">({isParallel ? 'Paralel' : `#${pendingSteps[0].stepNumber}`})</span>
                                            </span>
                                            <p className="text-[9.5px] font-medium text-slate-700 dark:text-slate-300 truncate max-w-[130px]" title={names}>
                                              {names || "—"}
                                            </p>
                                          </div>
                                        );
                                      }

                                      if (doneSteps === totalSteps && totalSteps > 0) {
                                        return (
                                          <p className="text-[9px] font-bold text-[#006633] mt-0.5 flex items-center gap-1">
                                            <span>Selesai Ditandatangani</span>
                                          </p>
                                        );
                                      }

                                      const rejectedStep = steps.find((s: any) => s.status === 'REJECTED');
                                      if (rejectedStep) {
                                        return (
                                          <p className="text-[9px] font-bold text-red-600 dark:text-red-400 mt-0.5 truncate max-w-[130px]" title={`Ditolak oleh ${rejectedStep.user?.fullName}`}>
                                            ❌ Ditolak: {rejectedStep.user?.fullName}
                                          </p>
                                        );
                                      }

                                      const revisionStep = steps.find((s: any) => s.status === 'REVISION');
                                      if (revisionStep) {
                                        return (
                                          <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 mt-0.5 truncate max-w-[130px]" title={`Revisi oleh ${revisionStep.user?.fullName}`}>
                                            🔄 Revisi: {revisionStep.user?.fullName}
                                          </p>
                                        );
                                      }

                                      return null;
                                    })()}
                                  </div>
                                )}
                              </td>

                              {/* ── Status ── */}
                              <td className="py-2.5 px-3 border-b border-l border-slate-200 dark:border-slate-800 align-top">
                                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap", statusClass(doc.status))}>
                                  {doc.status}
                                </span>
                              </td>

                              {/* ── Pembuat & Tanggal ── */}
                              <td className="py-2.5 px-3 border-b border-l border-slate-200 dark:border-slate-800 align-top">
                                <div className="flex flex-col gap-0.5">
                                  <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">{doc.creator?.fullName}</p>
                                  {doc.creator?.jobTitle && (
                                    <p className="text-[9px] text-slate-500 truncate max-w-[130px]">{doc.creator.jobTitle}</p>
                                  )}
                                  <p className="text-[9px] text-slate-500 mt-1">📅 {new Date(doc.createdAt).toLocaleString('id-ID', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'})}</p>
                                </div>
                              </td>

                              {/* ── Aksi ── */}
                              <td className="py-2.5 px-3 border-b border-l border-slate-200 dark:border-slate-800 align-top text-center">
                                <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-[110px] mx-auto">
                                  <button onClick={() => handleViewDocument(doc)} className="p-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors" title="Lihat Detail">
                                    <Eye size={14} />
                                  </button>
                                  <button onClick={() => handleDownloadDocument(doc)} className="p-1.5 rounded-lg text-indigo-650 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-405 dark:hover:bg-indigo-900/30 transition-colors" title="Unduh">
                                    <Download size={14} />
                                  </button>
                                  <Can perform="DOC_EDIT">
                                    <button
                                      onClick={() => {
                                        const latestVersion = getLatestVersion(doc);
                                        const isTemplate = latestVersion?.fileName?.endsWith('.html') || latestVersion?.mimeType === 'text/html';
                                        if (isTemplate) {
                                          router.push(`/surat-keluar/edit/${doc.id}`);
                                        } else {
                                          setSelectedDoc(doc);
                                          setIsEditModalOpen(true);
                                        }
                                      }}
                                      className="p-1.5 rounded-lg text-[#006633] bg-[#006633]/10 hover:bg-[#006633]/20 dark:bg-[#006633]/20 dark:hover:bg-[#006633]/30 transition-colors"
                                      title={doc.status === 'REVISION' ? "Upload Revisi Baru" : "Edit Dokumen"}
                                    >
                                      {doc.status === 'REVISION' ? <FileUp size={14} /> : <Pencil size={14} />}
                                    </button>
                                  </Can>
                                  <button onClick={() => { setSelectedDoc(doc); setIsFlowModalOpen(true); }} className="p-1.5 rounded-lg text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:text-amber-405 dark:hover:bg-amber-900/30 transition-colors" title="Cek Flow Persetujuan">
                                    <Activity size={14} />
                                  </button>
                                  <button onClick={() => { handleArchive(doc.id); }} className="p-1.5 rounded-lg text-slate-650 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors" title="Arsipkan">
                                    <Archive size={14} />
                                  </button>
                                  <Can perform="DOC_DELETE">
                                    <button onClick={() => { setSelectedDoc(doc); setIsDeleteConfirmOpen(true); }} className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-455 dark:hover:bg-rose-900/30 transition-colors" title="Hapus Permanen">
                                      <Trash2 size={14} />
                                    </button>
                                  </Can>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card List */}
                <div className="md:hidden border-t border-slate-200 dark:border-slate-800">
                  {paginatedDocuments.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 font-medium bg-white dark:bg-slate-900">
                      Tidak ada dokumen yang cocok dengan filter kolom.
                    </div>
                  ) : (
                    paginatedDocuments.map((doc) => (
                      <div key={doc.id} className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <button onClick={() => handleViewDocument(doc)} className="font-bold text-[#006633] text-sm leading-tight line-clamp-2 hover:underline transition-colors text-left">
                            {doc.title}
                          </button>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded border", statusClass(doc.status))}>
                              {doc.status}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 mb-2 mt-2">
                          <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{doc.documentNumber || "No Number"}</span>
                          <span>{doc.creator.fullName} · {new Date(doc.createdAt).toLocaleString('id-ID', {day: 'numeric', month: 'short', year:'numeric'})}</span>
                        </div>

                        {doc.status === 'REVISION' && doc.workflowInstances?.[0]?.steps?.find((s: any) => s.status === 'REVISION') && (
                          <div className="mb-3 p-3 bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-[11px] font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5 mb-1">
                              <AlertCircle size={14} /> Revisi: {doc.workflowInstances[0].steps.findLast((s: any) => s.status === 'REVISION')?.user?.fullName}
                            </p>
                            <p className="text-[10px] text-blue-700 dark:text-blue-400 italic leading-snug pl-5">
                              &ldquo;{doc.workflowInstances[0].steps.findLast((s: any) => s.status === 'REVISION')?.comment || "Revisi diperlukan."}&rdquo;
                            </p>
                          </div>
                        )}
                        
                        {doc.status === 'REJECTED' && (
                          <div className="mb-3 p-3 bg-red-50/80 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-[11px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5 mb-1">
                              <X size={14} /> Ditolak oleh: {doc.workflowInstances?.[0]?.steps?.findLast((s: any) => s.status === 'REJECTED')?.user?.fullName || "Approver"}
                            </p>
                            <p className="text-[10px] text-red-700 dark:text-red-400 italic leading-snug pl-5">
                              &ldquo;{doc.workflowInstances?.[0]?.steps?.findLast((s: any) => s.status === 'REJECTED')?.comment || "Dokumen tidak disetujui."}&rdquo;
                            </p>
                          </div>
                        )}

                        {doc.status === 'SIGNED' && (
                          <div className="mb-3 p-3 bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                            <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
                              <CheckCircle2 size={14} /> Dokumen Selesai & Ditandatangani
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 overflow-x-auto pb-1">
                          <button onClick={() => handleViewDocument(doc)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-[#006633] hover:text-white transition-all whitespace-nowrap">
                            <Eye size={14} /> Detail
                          </button>
                          <button onClick={() => handleDownloadDocument(doc)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all whitespace-nowrap">
                            <Download size={14} /> Unduh
                          </button>
                          <Can perform="DOC_EDIT">
                              <button
                                onClick={() => {
                                  const latestVersion = getLatestVersion(doc);
                                  const isTemplate = latestVersion?.fileName?.endsWith('.html') || latestVersion?.mimeType === 'text/html';
                                  if (isTemplate) {
                                    router.push(`/surat-keluar/edit/${doc.id}`);
                                  } else {
                                    setSelectedDoc(doc);
                                    setIsEditModalOpen(true);
                                  }
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold text-[#006633] hover:bg-slate-200 transition-all whitespace-nowrap"
                              >
                                {doc.status === 'REVISION' ? <><FileUp size={14} /> Upload Revisi</> : <><Pencil size={14} /> Edit</>}
                              </button>
                          </Can>
                          <button onClick={() => { setSelectedDoc(doc); setIsFlowModalOpen(true); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold text-amber-600 hover:bg-slate-200 transition-all whitespace-nowrap">
                            <Activity size={14} /> Flow
                          </button>
                          <Can perform="DOC_DELETE">
                              <button onClick={() => { setSelectedDoc(doc); setIsDeleteConfirmOpen(true); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded text-xs font-bold text-red-600 hover:bg-red-100 transition-all whitespace-nowrap">
                                <Trash2 size={14} /> Hapus
                              </button>
                          </Can>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Pagination Footer */}
                <div className="bg-slate-50 dark:bg-slate-800/40 px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {/* Left: Range Info */}
                  <div>
                    {totalItems > 0 ? (
                      <span>
                        Menampilkan <strong className="text-slate-800 dark:text-white">{startIndex + 1}</strong> - <strong className="text-slate-800 dark:text-white">{endIndex}</strong> dari <strong className="text-slate-800 dark:text-white">{totalItems}</strong> data
                      </span>
                    ) : (
                      <span>Tidak ada data untuk ditampilkan</span>
                    )}
                  </div>

                  {/* Center: Page Size Selector */}
                  <div className="flex items-center gap-2">
                    <span>Tampilkan:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs outline-none focus:border-[#006633] focus:ring-1 focus:ring-[#006633]/20"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span>per halaman</span>
                  </div>

                  {/* Right: Page Buttons */}
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1 select-none">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        &laquo;
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        Sebelumnya
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                        .map((page, idx, arr) => {
                          const showEllipsisBefore = page > 1 && arr[idx - 1] !== page - 1;
                          return (
                            <React.Fragment key={page}>
                              {showEllipsisBefore && <span className="px-1 text-slate-400">...</span>}
                              <button
                                onClick={() => setCurrentPage(page)}
                                className={cn(
                                  "px-2.5 py-1 rounded text-xs font-bold transition-all border",
                                  currentPage === page
                                    ? "bg-[#006633] border-[#006633] text-white"
                                    : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                                )}
                              >
                                {page}
                              </button>
                            </React.Fragment>
                          );
                        })}

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        Selanjutnya
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        &raquo;
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      {/* Split Detail Modal */}
      {selectedDocId && sidebarDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 lg:p-8">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedDocId(null)} />
          <div className="relative bg-white dark:bg-slate-900 w-full h-full max-w-[1400px] md:rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 flex flex-col md:flex-row">
            
            {/* Left: Document View */}
            <div className="w-full md:w-[60%] lg:w-[65%] h-[50vh] md:h-full bg-slate-100 dark:bg-slate-950 flex flex-col border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 relative z-10">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                     <FileText size={16} />
                   </div>
                   <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{sidebarDoc.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                   <button onClick={() => handleDownloadDocument(sidebarDoc)} className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all" title="Unduh">
                     <Download size={18} />
                   </button>
                   <button className="p-2 md:hidden text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all" onClick={() => setSelectedDocId(null)}>
                     <X size={18} />
                   </button>
                </div>
              </div>
              <div className="flex-1 relative bg-slate-100 dark:bg-slate-950 overflow-hidden">
                 {(() => {
                    const latestVersion = getLatestVersion(sidebarDoc);
                    if (!latestVersion) {
                       return <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm font-bold">Tidak ada file</div>;
                    }
                    const isTemplate = latestVersion.fileName?.toLowerCase().endsWith('.html') || latestVersion.mimeType === 'text/html';
                    return <DocumentPreview fileUrl={isTemplate ? `/api/documents/${sidebarDoc.id}/download` : latestVersion.fileUrl} title={latestVersion.fileName} docId={sidebarDoc.id} />;
                 })()}
              </div>
            </div>

            {/* Right: Details & Flow */}
            <div className="w-full md:w-[40%] lg:w-[35%] h-[50vh] md:h-full overflow-y-auto bg-white dark:bg-slate-900 flex flex-col relative z-20">
               <div className="sticky top-0 p-4 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-30 flex justify-between items-center hidden md:flex">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                     <FileBadge size={18} className="text-primary" /> Informasi Dokumen
                  </h3>
                  <button onClick={() => setSelectedDocId(null)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all">
                    <X size={18} />
                  </button>
               </div>
               
               <div className="p-6 space-y-8 scrollbar-thin pb-24">
                  {/* Status & Title */}
                  <div>
                    <span className={cn("text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wide", statusClass(sidebarDoc.status))}>
                      {sidebarDoc.status}
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white leading-snug mt-3">{sidebarDoc.title}</h3>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-2 font-mono">{sidebarDoc.documentNumber || "No Nomor"}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2.5">
                    {sidebarDoc.status === 'REVISION' && (
                      <button
                        onClick={() => setIsRevisionModalOpen(true)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 active:scale-[0.97] transition-all shadow-sm cursor-pointer"
                      >
                        <FileUp size={13} />
                        <span>Kirim Revisi</span>
                      </button>
                    )}
                    {sidebarDoc.status === 'DRAFT' && (
                      <button
                        onClick={() => setIsApprovalModalOpen(true)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#006633] hover:bg-[#00552b] text-white font-bold rounded-xl text-xs active:scale-[0.97] transition-all shadow-sm cursor-pointer"
                      >
                        <Play size={13} />
                        <span>Mulai Workflow</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const isTemplate = sidebarDoc.versions?.[0]?.fileName?.endsWith('.html') || sidebarDoc.versions?.[0]?.mimeType === 'text/html';
                        if (isTemplate) router.push(`/surat-keluar/edit/${sidebarDoc.id}`);
                        else {
                          setSelectedDoc(sidebarDoc);
                          setIsEditModalOpen(true);
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      <Pencil size={13} />
                      <span>Edit Info</span>
                    </button>
                  </div>

                  {/* Workflow Stepper Timeline */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-[#006633]" /> Alur Persetujuan
                      </h4>
                      {sidebarDoc.workflowInstances && sidebarDoc.workflowInstances.length > 0 &&
                        !['COMPLETED', 'REJECTED'].includes(sidebarDoc.workflowInstances[sidebarDoc.workflowInstances.length - 1].status) && (
                          <button
                            onClick={() => setIsWorkflowEditModalOpen(true)}
                            className="text-[10px] font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                          >
                            Ubah Alur
                          </button>
                        )}
                    </div>

                    {sidebarDoc.workflowInstances && sidebarDoc.workflowInstances.length > 0 ? (
                      <div className="relative pl-5 space-y-6 before:absolute before:left-[10px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800/80">
                        {sidebarDoc.workflowInstances[sidebarDoc.workflowInstances.length - 1].steps
                          .sort((a: any, b: any) => b.stepNumber - a.stepNumber)
                          .map((step: any) => {
                            const isApproved = step.status === 'APPROVED';
                            const isPending = step.status === 'PENDING';
                            const isRejected = step.status === 'REJECTED';
                            return (
                              <div key={step.id} className="relative">
                                <div className={cn(
                                  "absolute -left-[28px] top-0.5 w-6 h-6 rounded-full border-[3px] border-white dark:border-slate-900 flex items-center justify-center z-10 shadow-sm transition-all",
                                  isApproved ? "bg-emerald-500 text-white" :
                                    isPending ? "bg-amber-400 text-white animate-pulse" :
                                      isRejected ? "bg-red-500 text-white" :
                                        "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
                                )}>
                                  {isApproved ? <CheckCircle2 size={12} /> :
                                    isPending ? <Clock size={12} /> :
                                      isRejected ? <X size={12} /> :
                                        <span className="text-[9px] font-bold">{step.stepNumber}</span>}
                                </div>
                                
                                <div className="text-xs leading-relaxed">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="font-bold text-slate-800 dark:text-slate-200">{step.user?.fullName || "User"}</p>
                                    <span className={cn(
                                      "text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border",
                                      isApproved ? "text-emerald-600 bg-emerald-50/50 border-emerald-100" :
                                        isPending ? "text-amber-600 bg-amber-50/50 border-amber-100" :
                                          isRejected ? "text-red-600 bg-red-50/50 border-red-100" :
                                            "text-slate-400 bg-slate-50 border-slate-200"
                                    )}>
                                      {step.status}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-medium">{step.user?.jobTitle || "Penandatangan"}</p>
                                  {step.comment && (
                                    <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/50 text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
                                      <span className="italic">&ldquo;{step.comment}&rdquo;</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">Belum ada alur workflow yang disubmit.</p>
                    )}
                  </div>

                  {/* Informasi Surat Details */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                      Informasi Lengkap
                    </h4>
                    <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/50 pb-2">
                        <span className="text-slate-500">Nomor Dokumen</span>
                        <span className="text-slate-900 dark:text-slate-100 font-bold font-mono text-right">{sidebarDoc.documentNumber || "—"}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/50 pb-2">
                        <span className="text-slate-500">Tanggal Dibuat</span>
                        <span className="text-slate-900 dark:text-slate-100 font-bold text-right">{new Date(sidebarDoc.createdAt).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/50 pb-2">
                        <span className="text-slate-500">Kategori</span>
                        <span className="text-slate-900 dark:text-slate-100 font-bold text-right">{sidebarDoc.category?.name || "—"}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/50 pb-2">
                        <span className="text-slate-500">Sifat/Klasifikasi</span>
                        <span className="text-slate-900 dark:text-slate-100 font-bold text-right">{sidebarDoc.classification?.name || "—"}</span>
                      </div>
                      <div className="flex justify-between pb-1">
                        <span className="text-slate-500">Pembuat</span>
                        <span className="text-slate-900 dark:text-slate-100 font-bold text-right truncate max-w-[150px]">{sidebarDoc.creator?.fullName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Riwayat Versi */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <History size={14} className="text-[#006633]" /> Riwayat Versi
                      </h4>
                      {sidebarDoc.status !== 'SIGNED' && (
                        <button
                          onClick={() => setIsRevisionModalOpen(true)}
                          className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                        >
                          Unggah Versi Baru
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {sidebarDoc.versions?.map((v: any) => (
                        <div key={v.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 group hover:border-primary/40 transition-all">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-extrabold text-[#006633] bg-[#006633]/10 px-1.5 py-0.5 rounded">v{v.versionNum}</span>
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate" title={v.fileName}>{v.fileName}</p>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 font-mono">{(v.fileSize / 1024 / 1024).toFixed(2)} MB · {new Date(v.createdAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'})}</p>
                          </div>
                          <button
                            onClick={() => handleDownloadFile(v.fileName?.toLowerCase().endsWith('.html') || v.mimeType === 'text/html' ? `/api/documents/${sidebarDoc.id}/versions/${v.id}/download` : v.fileUrl, v.fileName)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg transition-colors flex items-center justify-center shrink-0"
                            title="Unduh"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

               </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals placed optimally outside layout flows */}
      {isEditModalOpen && selectedDoc && <EditDocumentModal doc={selectedDoc} />}
      {isFlowModalOpen && selectedDoc && <DocumentFlowModal doc={selectedDoc} />}
      {isDeleteConfirmOpen && selectedDoc && <DeleteConfirmationModal doc={selectedDoc} />}

      {isApprovalModalOpen && selectedDocId && (
        <ApprovalSubmitModal
          documentId={selectedDocId}
          onClose={() => setIsApprovalModalOpen(false)}
          onSuccess={() => {
            setIsApprovalModalOpen(false);
            fetchData();
            fetchSidebarDetail(selectedDocId);
          }}
        />
      )}

      {isWorkflowEditModalOpen && selectedDocId && (
        <WorkflowEditModal
          documentId={selectedDocId}
          onClose={() => setIsWorkflowEditModalOpen(false)}
          onSuccess={() => {
            setIsWorkflowEditModalOpen(false);
            fetchData();
            fetchSidebarDetail(selectedDocId);
          }}
        />
      )}

      {isRevisionModalOpen && selectedDocId && (
        <RevisionModal
          documentId={selectedDocId}
          onClose={() => setIsRevisionModalOpen(false)}
          onSuccess={() => {
            setIsRevisionModalOpen(false);
            fetchData();
            fetchSidebarDetail(selectedDocId);
          }}
        />
      )}

      {readerDoc && (
        <DocumentReader
          isOpen={!!readerDoc}
          onClose={() => setReaderDoc(null)}
          title={readerDoc.title}
          fileUrl={readerDoc.fileUrl}
          docId={readerDoc.id}
        />
      )}
    </div>
  );
};

export default DocumentsPage;
