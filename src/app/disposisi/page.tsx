"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
  UserCheck,
  Users,
  User,
  RefreshCw,
  FileCheck,
  ArrowRight,
  ShieldCheck,
  Layers,
  Calendar,
  ChevronDown,
  SlidersHorizontal,
  Hash,
  Send,
  GitPullRequest,
  Check
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

interface WorkflowStep {
  id?: string;
  stepNumber: number;
  roleId?: string | null;
  userId?: string | null;
  status: "APPROVED" | "PENDING" | "WAITING" | "REJECTED" | "REVISION";
  comment?: string | null;
  actionedAt?: string | null;
  user?: {
    id: string;
    fullName: string;
    email?: string;
    jobTitle?: string;
    role?: { name: string };
  };
}

interface WorkflowInstance {
  id: string;
  status: string;
  currentStep: number;
  steps: WorkflowStep[];
}

interface DocumentData {
  id: string;
  title: string;
  documentNumber: string | null;
  documentType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  category?: { name: string };
  classification?: { name: string };
  creator?: { fullName: string; jobTitle?: string; email?: string };
  workflowInstances?: WorkflowInstance[];
  versions?: { versionNum: number; fileUrl: string }[];
}

export default function DisposisiSuratKeluarPage() {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<DocumentData | null>(null);

  // ── FILTER & PAGINATION STATES ──
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "title" | "doc_number">("date_desc");

  // Fetch Outgoing Documents from API
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/documents?documentType=OUTGOING");
      const rawDocs = res.data?.data?.documents || res.data?.data || [];
      setDocuments(Array.isArray(rawDocs) ? rawDocs : []);
    } catch (err: any) {
      console.error("Error fetching outgoing documents for disposisi:", err);
      setError(err?.response?.data?.message || "Gagal memuat data disposisi surat keluar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Filter Categories dropdown options
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    documents.forEach(d => {
      if (d.category?.name) set.add(d.category.name);
    });
    return Array.from(set).sort();
  }, [documents]);

  // Helper to extract workflow step lists by role
  const getCategorizedSteps = (doc: DocumentData) => {
    const wf = doc.workflowInstances?.[0];
    const steps = wf?.steps ? [...wf.steps].sort((a, b) => a.stepNumber - b.stepNumber) : [];

    const pemparaf = steps.filter(s => s.roleId === "PEMPARAF");
    const approver = steps.filter(s => s.roleId === "APPROVER");
    const penandatangan = steps.filter(s => s.roleId === "PENANDATANGAN" || (!s.roleId && steps.length > 0));

    return { steps, pemparaf, approver, penandatangan };
  };

  // Filter & Search Logic
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      // Document type check (Must be OUTGOING)
      if (doc.documentType && doc.documentType !== "OUTGOING") return false;

      // Status filter
      if (statusFilter && doc.status !== statusFilter) return false;

      // Category filter
      if (categoryFilter && doc.category?.name !== categoryFilter) return false;

      // Role Involvement filter
      if (roleFilter) {
        const { pemparaf, approver, penandatangan } = getCategorizedSteps(doc);
        if (roleFilter === "PEMPARAF" && pemparaf.length === 0) return false;
        if (roleFilter === "APPROVER" && approver.length === 0) return false;
        if (roleFilter === "PENANDATANGAN" && penandatangan.length === 0) return false;
      }

      // Search query (No Surat, Title, Creator, Pemparaf, Approver, Penandatangan)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const { pemparaf, approver, penandatangan } = getCategorizedSteps(doc);
        const matchTitle = doc.title?.toLowerCase().includes(q);
        const matchDocNum = doc.documentNumber?.toLowerCase().includes(q);
        const matchCreator = doc.creator?.fullName?.toLowerCase().includes(q);
        const matchPemparaf = pemparaf.some(p => p.user?.fullName?.toLowerCase().includes(q));
        const matchApprover = approver.some(a => a.user?.fullName?.toLowerCase().includes(q));
        const matchPenandatangan = penandatangan.some(s => s.user?.fullName?.toLowerCase().includes(q));

        if (!matchTitle && !matchDocNum && !matchCreator && !matchPemparaf && !matchApprover && !matchPenandatangan) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "date_desc") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "date_asc") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "doc_number") return (a.documentNumber || "").localeCompare(b.documentNumber || "");
      return 0;
    });
  }, [documents, searchQuery, statusFilter, categoryFilter, roleFilter, sortBy]);

  // Pagination Logic
  const totalItems = filteredDocuments.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedDocuments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDocuments.slice(start, start + pageSize);
  }, [filteredDocuments, currentPage, pageSize]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, categoryFilter, roleFilter, pageSize]);

  // Statistics Count
  const stats = useMemo(() => {
    const total = documents.length;
    const pending = documents.filter(d => d.status === "PENDING_APPROVAL" || d.status === "ACTIVE").length;
    const signed = documents.filter(d => d.status === "SIGNED" || d.status === "COMPLETED").length;
    const rejected = documents.filter(d => d.status === "REJECTED" || d.status === "REVISION").length;
    return { total, pending, signed, rejected };
  }, [documents]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SIGNED":
      case "COMPLETED":
        return <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"><CheckCircle2 size={11} /> SIGNED</span>;
      case "PENDING_APPROVAL":
      case "ACTIVE":
        return <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"><Clock size={11} className="animate-spin" /> PROSES</span>;
      case "REJECTED":
        return <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:border-red-800"><X size={11} /> DITOLAK</span>;
      case "REVISION":
        return <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800"><AlertCircle size={11} /> REVISI</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">DRAFT</span>;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-[#006633] to-emerald-800 p-6 rounded-3xl text-white shadow-xl shadow-emerald-950/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl">
              <GitPullRequest size={20} className="text-amber-300" />
            </div>
            <span className="text-xs font-extrabold tracking-widest text-amber-300 uppercase">
              Tracking & Audit Trail Persuratan
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Disposisi Surat Keluar</h1>
          <p className="text-xs text-emerald-100 max-w-2xl leading-relaxed">
            Daftar lengkap alur disposisi persuratan. Memantau seluruh pihak yang terlibat (Pembuat, Pemparaf, Approver, & Penandatangan) dalam penerbitan setiap Surat Keluar.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDocuments}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-2xl transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Disposisi Surat</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{stats.total}</h3>
            <p className="text-[10px] text-slate-400">Seluruh Surat Keluar terdaftar</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-[#006633] flex items-center justify-center">
            <FileText size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dalam Proses</p>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.pending}</h3>
            <p className="text-[10px] text-slate-400">Sedang diparaf / disetujui</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 flex items-center justify-center">
            <Clock size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Selesai Disetujui</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.signed}</h3>
            <p className="text-[10px] text-slate-400">Telah ditandatangani resmi</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ditolak / Revisi</p>
            <h3 className="text-2xl font-black text-red-600 dark:text-red-400">{stats.rejected}</h3>
            <p className="text-[10px] text-slate-400">Memerlukan perhatian pembuat</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-600 flex items-center justify-center">
            <AlertCircle size={22} />
          </div>
        </div>
      </div>

      {/* ── TOOLBAR & DATATABLES CONTROLS ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Global Search */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari No. Surat, Judul, Pembuat, Pemparaf, Approver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-[#006633]/20 border border-slate-200/80 dark:border-slate-700 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filters dropdown row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 outline-none focus:ring-2 focus:ring-[#006633]/20"
            >
              <option value="">Semua Kategori</option>
              {uniqueCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 outline-none focus:ring-2 focus:ring-[#006633]/20"
            >
              <option value="">Semua Status</option>
              <option value="DRAFT">DRAFT</option>
              <option value="PENDING_APPROVAL">PROSES APPROVAL</option>
              <option value="SIGNED">SIGNED (SELESAI)</option>
              <option value="REJECTED">DITOLAK</option>
              <option value="REVISION">REVISI</option>
            </select>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 outline-none focus:ring-2 focus:ring-[#006633]/20"
            >
              <option value="">Pihak Terlibat: Semua</option>
              <option value="PEMPARAF">Ada Pemparaf</option>
              <option value="APPROVER">Ada Approver</option>
              <option value="PENANDATANGAN">Ada Penandatangan</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 outline-none focus:ring-2 focus:ring-[#006633]/20"
            >
              <option value="date_desc">Terbaru</option>
              <option value="date_asc">Terlama</option>
              <option value="title">Judul (A-Z)</option>
              <option value="doc_number">No. Surat (A-Z)</option>
            </select>

            {/* Clear Filters Button */}
            {(searchQuery || statusFilter || categoryFilter || roleFilter) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("");
                  setCategoryFilter("");
                  setRoleFilter("");
                }}
                className="px-3 py-2.5 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-900/50 hover:bg-red-100 transition-all flex items-center gap-1"
              >
                <X size={13} /> Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* ── DATATABLE TABLE ── */}
        <div className="overflow-x-auto border border-slate-200/80 dark:border-slate-800 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3.5 text-center w-12">#</th>
                <th className="py-3 px-4 min-w-[220px]">No. Surat & Judul</th>
                <th className="py-3 px-4 min-w-[140px]">Kategori & Pembuat</th>
                <th className="py-3 px-4 min-w-[160px]">Pemparaf</th>
                <th className="py-3 px-4 min-w-[160px]">Approver</th>
                <th className="py-3 px-4 min-w-[170px]">Penandatangan</th>
                <th className="py-3 px-4 text-center min-w-[110px]">Status</th>
                <th className="py-3 px-4 text-center min-w-[120px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw size={24} className="animate-spin text-[#006633]" />
                      <span>Memuat data disposisi surat keluar...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedDocuments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <FileText size={32} className="text-slate-300" />
                      <span>Tidak ditemukan data disposisi surat keluar.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedDocuments.map((doc, idx) => {
                  const rowNum = (currentPage - 1) * pageSize + idx + 1;
                  const { pemparaf, approver, penandatangan } = getCategorizedSteps(doc);

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-amber-50/40 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Row Index */}
                      <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-400">
                        {rowNum}
                      </td>

                      {/* No. Surat & Judul */}
                      <td className="py-3 px-4 align-top">
                        <div className="space-y-1">
                          <button
                            onClick={() => setSelectedDoc(doc)}
                            className="font-bold text-[#006633] hover:underline text-xs text-left leading-snug line-clamp-2"
                          >
                            {doc.title}
                          </button>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                              {doc.documentNumber || "Draft (Belum ada nomor)"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Kategori & Pembuat */}
                      <td className="py-3 px-4 align-top">
                        <div className="space-y-1">
                          <span className="inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {doc.category?.name || "RUTIN"}
                          </span>
                          <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                            👤 {doc.creator?.fullName || "Admin"}
                          </p>
                          <p className="text-[9.5px] text-slate-400 font-mono">
                            {formatDate(doc.createdAt)}
                          </p>
                        </div>
                      </td>

                      {/* Pemparaf List */}
                      <td className="py-3 px-4 align-top">
                        {pemparaf.length === 0 ? (
                          <span className="text-[10px] text-slate-400 italic">— Tidak ada</span>
                        ) : (
                          <div className="space-y-1.5">
                            {pemparaf.map((p, pIdx) => (
                              <div
                                key={pIdx}
                                className="flex items-center gap-1.5 text-[10.5px] bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200/70 dark:border-slate-700/80"
                              >
                                {p.status === "APPROVED" ? (
                                  <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                                ) : (
                                  <Clock size={12} className="text-amber-500 shrink-0" />
                                )}
                                <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]" title={p.user?.fullName}>
                                  {p.user?.fullName || "Pemparaf"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Approver List */}
                      <td className="py-3 px-4 align-top">
                        {approver.length === 0 ? (
                          <span className="text-[10px] text-slate-400 italic">— Tidak ada</span>
                        ) : (
                          <div className="space-y-1.5">
                            {approver.map((a, aIdx) => (
                              <div
                                key={aIdx}
                                className="flex items-center gap-1.5 text-[10.5px] bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200/70 dark:border-slate-700/80"
                              >
                                {a.status === "APPROVED" ? (
                                  <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                                ) : (
                                  <Clock size={12} className="text-amber-500 shrink-0" />
                                )}
                                <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]" title={a.user?.fullName}>
                                  {a.user?.fullName || "Approver"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Penandatangan List */}
                      <td className="py-3 px-4 align-top">
                        {penandatangan.length === 0 ? (
                          <span className="text-[10px] text-slate-400 italic">— Belum diatur</span>
                        ) : (
                          <div className="space-y-1.5">
                            {penandatangan.map((s, sIdx) => (
                              <div
                                key={sIdx}
                                className="flex items-center gap-1.5 text-[10.5px] bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200/70 dark:border-slate-700/80"
                              >
                                {s.status === "APPROVED" ? (
                                  <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                                ) : (
                                  <Clock size={12} className="text-amber-500 shrink-0" />
                                )}
                                <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[130px]" title={s.user?.fullName}>
                                  #{sIdx + 1} {s.user?.fullName || "Penandatangan"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center align-top">
                        {getStatusBadge(doc.status)}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center align-top">
                        <button
                          onClick={() => setSelectedDoc(doc)}
                          className="px-3 py-1.5 bg-[#006633]/10 hover:bg-[#006633] text-[#006633] hover:text-white rounded-xl font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 mx-auto"
                        >
                          <Eye size={13} />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION CONTROLS ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Tampilkan</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>dari <strong>{totalItems}</strong> data disposisi</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-4 py-1.5 text-xs font-extrabold text-slate-700 dark:text-slate-300">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── MODAL DETAIL DISPOSISI SURAT KELUAR ── */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-900 to-[#006633] text-white flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full">
                    Detail Disposisi & Audit Trail
                  </span>
                  {getStatusBadge(selectedDoc.status)}
                </div>
                <h3 className="text-lg font-black leading-snug">{selectedDoc.title}</h3>
                <p className="text-xs text-emerald-100 font-mono">
                  No. Surat: {selectedDoc.documentNumber || "Belum ada nomor resmi"}
                </p>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-2xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              {/* Document Overview Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-xs">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pembuat Surat</p>
                  <p className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                    👤 {selectedDoc.creator?.fullName || "Admin"}
                  </p>
                  <p className="text-[10px] text-slate-500">{selectedDoc.creator?.jobTitle || "Pejabat Organisasi"}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kategori & Klasifikasi</p>
                  <p className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                    {selectedDoc.category?.name || "RUTIN"}
                  </p>
                  <p className="text-[10px] text-slate-500">{selectedDoc.classification?.name || "Umum"}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Dibuat</p>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {formatDate(selectedDoc.createdAt)}
                  </p>
                </div>
              </div>

              {/* Workflow Breakdown Timeline */}
              {(() => {
                const { pemparaf, approver, penandatangan } = getCategorizedSteps(selectedDoc);

                return (
                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <GitPullRequest size={16} className="text-[#006633]" />
                      Alur Keterlibatan Pihak Penerbit Surat
                    </h4>

                    {/* Step 1: Pembuat Surat */}
                    <div className="relative pl-6 border-l-2 border-emerald-500 space-y-1">
                      <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-[9px] font-bold">
                        1
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase">
                          Pembuat Surat (Creator)
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{formatDate(selectedDoc.createdAt)}</span>
                      </div>
                      <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                          {selectedDoc.creator?.fullName?.[0] || "A"}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedDoc.creator?.fullName}</p>
                          <p className="text-[10px] text-slate-500">{selectedDoc.creator?.jobTitle || "Pembuat Draft Surat"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Pemparaf (Paralel) */}
                    <div className="relative pl-6 border-l-2 border-amber-400 space-y-2">
                      <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-amber-400 border-2 border-white dark:border-slate-900 flex items-center justify-center text-slate-900 text-[9px] font-bold">
                        2
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase">
                          Pemparaf (Paralel)
                        </span>
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200">
                          {pemparaf.filter(p => p.status === "APPROVED").length}/{pemparaf.length} Disetujui
                        </span>
                      </div>

                      {pemparaf.length === 0 ? (
                        <p className="text-xs italic text-slate-400 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                          Tidak memerlukan pemparaf awal.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {pemparaf.map((p, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                "p-3 rounded-xl border flex items-center justify-between gap-3 text-xs",
                                p.status === "APPROVED"
                                  ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/80"
                                  : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/80"
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={cn(
                                  "w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 text-white",
                                  p.status === "APPROVED" ? "bg-emerald-600" : "bg-amber-500"
                                )}>
                                  {p.user?.fullName?.[0] || "P"}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{p.user?.fullName}</p>
                                  <p className="text-[9.5px] text-slate-400 truncate">{p.user?.jobTitle || "Pemparaf"}</p>
                                </div>
                              </div>
                              <span className={cn(
                                "text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0",
                                p.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                              )}>
                                {p.status === "APPROVED" ? `✓ ${formatDate(p.actionedAt || "")}` : "⏳ Menunggu"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Step 3: Approver (Paralel) */}
                    <div className="relative pl-6 border-l-2 border-blue-400 space-y-2">
                      <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-blue-400 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-[9px] font-bold">
                        3
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase">
                          Approver (Paralel)
                        </span>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full border border-blue-200">
                          {approver.filter(a => a.status === "APPROVED").length}/{approver.length} Disetujui
                        </span>
                      </div>

                      {approver.length === 0 ? (
                        <p className="text-xs italic text-slate-400 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                          Tidak memerlukan pemeriksa/approver.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {approver.map((a, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                "p-3 rounded-xl border flex items-center justify-between gap-3 text-xs",
                                a.status === "APPROVED"
                                  ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/80"
                                  : "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/80"
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={cn(
                                  "w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 text-white",
                                  a.status === "APPROVED" ? "bg-emerald-600" : "bg-blue-500"
                                )}>
                                  {a.user?.fullName?.[0] || "A"}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{a.user?.fullName}</p>
                                  <p className="text-[9.5px] text-slate-400 truncate">{a.user?.jobTitle || "Approver"}</p>
                                </div>
                              </div>
                              <span className={cn(
                                "text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0",
                                a.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                              )}>
                                {a.status === "APPROVED" ? `✓ ${formatDate(a.actionedAt || "")}` : "⏳ Menunggu"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Step 4: Penandatangan (Berjenjang) */}
                    <div className="relative pl-6 border-l-2 border-[#006633] space-y-2">
                      <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-[#006633] border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-[9px] font-bold">
                        4
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-[#006633] dark:text-emerald-400 uppercase">
                          Penandatangan (Berjenjang)
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200">
                          {penandatangan.filter(s => s.status === "APPROVED").length}/{penandatangan.length} Ditandatangani
                        </span>
                      </div>

                      {penandatangan.length === 0 ? (
                        <p className="text-xs italic text-slate-400 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                          Belum ada pejabat penandatangan yang ditugaskan.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {penandatangan.map((s, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                "p-3 rounded-xl border flex items-center justify-between gap-3 text-xs",
                                s.status === "APPROVED"
                                  ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/80"
                                  : s.status === "PENDING"
                                    ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 animate-pulse"
                                    : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700"
                              )}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="font-mono font-bold text-xs text-slate-400 w-5">#{idx + 1}</span>
                                <div className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 text-white",
                                  s.status === "APPROVED" ? "bg-emerald-600" : s.status === "PENDING" ? "bg-amber-500" : "bg-slate-400"
                                )}>
                                  {s.user?.fullName?.[0] || "S"}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{s.user?.fullName}</p>
                                  <p className="text-[9.5px] text-slate-400 truncate">{s.user?.jobTitle || "Pejabat Penandatangan"}</p>
                                </div>
                              </div>
                              <span className={cn(
                                "text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0",
                                s.status === "APPROVED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : s.status === "PENDING"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                              )}>
                                {s.status === "APPROVED" ? `✓ ${formatDate(s.actionedAt || "")}` : s.status === "PENDING" ? "⏳ Giliran TTD" : "Menunggu"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
              <span className="text-xs text-slate-500">
                Dokumen ID: <code className="font-mono font-bold">{selectedDoc.id}</code>
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={`/surat-keluar/${selectedDoc.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-[#006633] text-white text-xs font-bold rounded-2xl hover:bg-[#00552a] transition-all flex items-center gap-1.5 shadow-md shadow-[#006633]/20"
                >
                  <Eye size={14} />
                  <span>Buka Surat Keluar</span>
                </a>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-2xl hover:bg-slate-300 transition-all"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
