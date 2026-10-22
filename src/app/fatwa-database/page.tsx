"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Database,
  Search,
  Filter,
  Plus,
  FileText,
  Calendar,
  Users,
  Award,
  Layers,
  Edit2,
  Trash2,
  Eye,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Copy,
  BookOpen,
  ArrowUpDown
} from "lucide-react";
import { useFatwaStore, Fatwa } from "@/stores/fatwa.store";

// Helper for formatting Indonesian dates
const formatIndoDate = (dateStr: string) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
};

export default function FatwaDatabasePage() {
  const { fatwaList, fetchFatwaList, stats, fetchStats, addFatwa, updateFatwa, deleteFatwa, loading, error } = useFatwaStore();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [selectedPleno, setSelectedPleno] = useState<string>("ALL");
  const [selectedLeader, setSelectedLeader] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [sortField, setSortField] = useState<"noUrut" | "tahun" | "tanggal" | "title">("noUrut");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Modals
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedFatwa, setSelectedFatwa] = useState<Fatwa | null>(null);

  // Form States (for Edit & Create)
  const [formJudul, setFormJudul] = useState("");
  const [formNomorFatwa, setFormNomorFatwa] = useState("");
  const [formTanggal, setFormTanggal] = useState("");
  const [formPleno, setFormPleno] = useState("");
  const [formTahun, setFormTahun] = useState("");
  const [formTtd1, setFormTtd1] = useState("");
  const [formTtd2, setFormTtd2] = useState("");
  const [formStatus, setFormStatus] = useState("PUBLIKASI");
  const [formKeterangan, setFormKeterangan] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchFatwaList();
    fetchStats();
  }, [fetchFatwaList, fetchStats]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedYear, selectedPleno, selectedLeader, selectedStatus, itemsPerPage]);

  // Extract available distinct years and plenums from data
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    fatwaList.forEach((f) => {
      if (f.tahun) yearsSet.add(f.tahun);
      else if (f.tanggal) {
        const y = new Date(f.tanggal).getFullYear();
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [fatwaList]);

  const availablePlenos = useMemo(() => {
    const plenosSet = new Set<string>();
    fatwaList.forEach((f) => {
      if (f.pleno) plenosSet.add(String(f.pleno));
    });
    return Array.from(plenosSet).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [fatwaList]);

  // Filter & Search Logic
  const filteredFatwas = useMemo(() => {
    return fatwaList.filter((f) => {
      // 1. Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = f.title?.toLowerCase().includes(q);
        const matchNomor = (f.nomorFatwa || f.agendaNumber || "").toLowerCase().includes(q);
        const matchApplicant = f.applicant?.toLowerCase().includes(q);
        const matchKet = f.keterangan?.toLowerCase().includes(q);
        const matchTtd1 = f.penandatangan1?.toLowerCase().includes(q);
        const matchTtd2 = f.penandatangan2?.toLowerCase().includes(q);
        const matchPleno = f.pleno ? String(f.pleno).toLowerCase().includes(q) : false;
        if (!matchTitle && !matchNomor && !matchApplicant && !matchKet && !matchTtd1 && !matchTtd2 && !matchPleno) {
          return false;
        }
      }

      // 2. Year filter
      if (selectedYear !== "ALL") {
        const itemYear = f.tahun || (f.tanggal ? new Date(f.tanggal).getFullYear() : null);
        if (String(itemYear) !== selectedYear) return false;
      }

      // 3. Pleno filter
      if (selectedPleno !== "ALL") {
        if (String(f.pleno) !== selectedPleno) return false;
      }

      // 4. Leader / Signer filter
      if (selectedLeader !== "ALL") {
        const combined = `${f.penandatangan1 || ""} ${f.penandatangan2 || ""} ${f.applicant || ""}`.toLowerCase();
        if (!combined.includes(selectedLeader.toLowerCase())) return false;
      }

      // 5. Status filter
      if (selectedStatus !== "ALL") {
        if (f.status?.toUpperCase() !== selectedStatus.toUpperCase()) return false;
      }

      return true;
    }).sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === "noUrut") {
        valA = a.noUrut ?? 9999;
        valB = b.noUrut ?? 9999;
      } else if (sortField === "tahun") {
        valA = a.tahun ?? (a.tanggal ? new Date(a.tanggal).getFullYear() : 0);
        valB = b.tahun ?? (b.tanggal ? new Date(b.tanggal).getFullYear() : 0);
      } else if (sortField === "tanggal") {
        valA = a.tanggal ? new Date(a.tanggal).getTime() : 0;
        valB = b.tanggal ? new Date(b.tanggal).getTime() : 0;
      } else {
        valA = String(valA || "").toLowerCase();
        valB = String(valB || "").toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [fatwaList, searchQuery, selectedYear, selectedPleno, selectedLeader, selectedStatus, sortField, sortOrder]);

  // Paginated records
  const totalPages = Math.ceil(filteredFatwas.length / itemsPerPage) || 1;
  const paginatedFatwas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredFatwas.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredFatwas, currentPage, itemsPerPage]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }
    const pages: number[] = [];
    for (let p = start; p <= end; p++) {
      pages.push(p);
    }
    return pages;
  }, [totalPages, currentPage]);

  // Open Edit Modal
  const handleOpenEdit = (fatwa: Fatwa) => {
    setSelectedFatwa(fatwa);
    setFormJudul(fatwa.title || "");
    setFormNomorFatwa(fatwa.nomorFatwa || fatwa.agendaNumber || "");
    setFormTanggal(fatwa.tanggal ? fatwa.tanggal.substring(0, 10) : "");
    setFormPleno(fatwa.pleno !== null && fatwa.pleno !== undefined ? String(fatwa.pleno) : "");
    setFormTahun(fatwa.tahun ? String(fatwa.tahun) : "");
    setFormTtd1(fatwa.penandatangan1 || "");
    setFormTtd2(fatwa.penandatangan2 || "");
    setFormStatus(fatwa.status || "PUBLIKASI");
    setFormKeterangan(fatwa.keterangan || "");
    setFormError(null);
    setIsEditModalOpen(true);
  };

  // Submit Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFatwa) return;
    if (!formJudul.trim() || !formNomorFatwa.trim()) {
      setFormError("Judul fatwa dan Nomor fatwa wajib diisi.");
      return;
    }

    setFormLoading(true);
    setFormError(null);

    // Build applicant string from signers
    const signers = [formTtd1.trim(), formTtd2.trim()].filter(Boolean);
    const applicantStr = signers.length > 0 ? signers.join(" & ") : selectedFatwa.applicant;

    const payload: Partial<Fatwa> = {
      title: formJudul.trim(),
      agendaNumber: formNomorFatwa.trim(),
      nomorFatwa: formNomorFatwa.trim(),
      status: formStatus,
      applicant: applicantStr,
      tanggal: formTanggal ? new Date(formTanggal).toISOString() : selectedFatwa.tanggal,
      pleno: formPleno.trim() || null,
      tahun: formTahun ? parseInt(formTahun, 10) : null,
      penandatangan1: formTtd1.trim() || null,
      penandatangan2: formTtd2.trim() || null,
      keterangan: formKeterangan.trim() || null,
    };

    const success = await updateFatwa(selectedFatwa.id, payload);
    setFormLoading(false);

    if (success) {
      setIsEditModalOpen(false);
      showToast(`Fatwa "${formNomorFatwa}" berhasil diperbarui.`);
    } else {
      setFormError(error || "Gagal memperbarui data fatwa.");
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (fatwa: Fatwa) => {
    setSelectedFatwa(fatwa);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!selectedFatwa) return;
    setFormLoading(true);
    const success = await deleteFatwa(selectedFatwa.id);
    setFormLoading(false);

    if (success) {
      setIsDeleteModalOpen(false);
      showToast(`Fatwa "${selectedFatwa.nomorFatwa || selectedFatwa.agendaNumber}" berhasil dihapus.`);
      setSelectedFatwa(null);
    } else {
      alert("Gagal menghapus data fatwa.");
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormJudul("");
    setFormNomorFatwa("");
    setFormTanggal(new Date().toISOString().substring(0, 10));
    setFormPleno("");
    setFormTahun(String(new Date().getFullYear()));
    setFormTtd1("K.H. M. Cholil Nafis, Lc., Ph.D.");
    setFormTtd2("Dr. H. Amirsyah Tambunan, M.A.");
    setFormStatus("PUBLIKASI");
    setFormKeterangan("");
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  // Submit Create
  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJudul.trim() || !formNomorFatwa.trim()) {
      setFormError("Judul fatwa dan Nomor fatwa wajib diisi.");
      return;
    }

    setFormLoading(true);
    setFormError(null);

    const signers = [formTtd1.trim(), formTtd2.trim()].filter(Boolean);
    const applicantStr = signers.length > 0 ? signers.join(" & ") : "Dewan Syariah Nasional MUI";

    const payload: Partial<Fatwa> = {
      title: formJudul.trim(),
      agendaNumber: formNomorFatwa.trim(),
      nomorFatwa: formNomorFatwa.trim(),
      status: formStatus,
      applicant: applicantStr,
      tanggal: formTanggal ? new Date(formTanggal).toISOString() : new Date().toISOString(),
      pleno: formPleno.trim() || null,
      tahun: formTahun ? parseInt(formTahun, 10) : new Date().getFullYear(),
      penandatangan1: formTtd1.trim() || null,
      penandatangan2: formTtd2.trim() || null,
      keterangan: formKeterangan.trim() || null,
    };

    const success = await addFatwa(payload);
    setFormLoading(false);

    if (success) {
      setIsCreateModalOpen(false);
      showToast(`Fatwa baru "${formNomorFatwa}" berhasil ditambahkan ke database.`);
    } else {
      setFormError(error || "Gagal menambahkan fatwa baru. Pastikan Nomor Fatwa unik.");
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ["No", "Nomor Fatwa", "Judul Fatwa", "Tanggal Penetapan", "Rapat Pleno", "Ketua / TTD 1", "Sekretaris / TTD 2", "Tahun", "Status"];
    const rows = filteredFatwas.map((f, i) => [
      f.noUrut ?? i + 1,
      `"${f.nomorFatwa || f.agendaNumber || ""}"`,
      `"${(f.title || "").replace(/"/g, '""')}"`,
      f.tanggal ? f.tanggal.substring(0, 10) : "",
      `"${f.pleno || ""}"`,
      `"${f.penandatangan1 || ""}"`,
      `"${f.penandatangan2 || ""}"`,
      f.tahun || "",
      f.status || ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Database_Fatwa_DSN_MUI_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Berkas CSV berhasil diunduh.");
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Disalin: ${text}`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl bg-slate-900 text-white border border-slate-700 animate-slide-up">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span className="text-xs font-medium">{toast.msg}</span>
        </div>
      )}

      {/* ── HEADER SECTION ── */}
      <div className="relative overflow-hidden p-6 sm:p-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative z-10 flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#006633] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-mono">
              REPOSITORI HUKUM EKONOMI SYARIAH
            </span>
            <span className="text-[9px] font-bold text-slate-400 font-mono">
              DSN-MUI RILIS 2026
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
            Database Fatwa DSN-MUI <span className="text-[#006633] dark:text-emerald-400">dari Masa ke Masa</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold max-w-2xl">
            Repositori resmi seluruh fatwa Dewan Syariah Nasional — Majelis Ulama Indonesia dari tahun 2000 hingga 2026. Seluruh data dapat dicari, disaring, diperbarui (edit), dan dikelola secara terstruktur.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 flex items-center flex-wrap gap-2.5 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg transition-all text-xs uppercase tracking-wider border border-slate-200 dark:border-slate-700"
          >
            <Download size={14} />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#006633] hover:bg-[#00552b] text-white font-bold rounded-lg transition-all text-xs uppercase tracking-wider shadow-sm"
          >
            <Plus size={16} />
            <span>Tambah Fatwa</span>
          </button>
        </div>
      </div>

      {/* ── KPI METRICS CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-5 relative overflow-hidden group">
          <div className="h-1.5 w-full bg-[#006633] absolute top-0 left-0" />
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">FATWA-METRIC-01</span>
            <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-100 uppercase">Sah & Ditetapkan</span>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-[#006633] dark:text-emerald-400">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">Total Fatwa Terdaftar</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{fatwaList.length} <span className="text-xs font-normal text-slate-400">Fatwa</span></h3>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-5 relative overflow-hidden group">
          <div className="h-1.5 w-full bg-amber-500 absolute top-0 left-0" />
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">FATWA-METRIC-02</span>
            <span className="text-[9px] font-extrabold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded border border-amber-100 uppercase">26 Tahun</span>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">Rentang Waktu</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-mono">2000 — 2026</h3>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-5 relative overflow-hidden group">
          <div className="h-1.5 w-full bg-blue-500 absolute top-0 left-0" />
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">FATWA-METRIC-03</span>
            <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded border border-blue-100 uppercase">Forum Pengambilan</span>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600">
              <Layers size={20} />
            </div>
            <div>
              <p className="text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">Total Sidang Pleno</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-mono">60 <span className="text-xs font-normal text-slate-400">Sidang Pleno</span></h3>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-5 relative overflow-hidden group">
          <div className="h-1.5 w-full bg-[#D4AF37] absolute top-0 left-0" />
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">FATWA-METRIC-04</span>
            <span className="text-[9px] font-extrabold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/30 uppercase">Kepemimpinan</span>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <Award size={20} />
            </div>
            <div>
              <p className="text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">Pimpinan Terkini</p>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[140px]" title="K.H. M. Cholil Nafis & Dr. H. Amirsyah Tambunan">
                K.H. Cholil Nafis
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* ── FILTER & SEARCH TOOLBAR ── */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan judul fatwa, nomor (e.g. 01/DSN-MUI/IV/2000), penandatangan, atau pleno..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006633]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center flex-wrap gap-2 shrink-0">
            {/* Year Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tahun:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006633]"
              >
                <option value="ALL">Semua Tahun ({availableYears.length})</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={String(yr)}>
                    Tahun {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Pleno Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pleno:</span>
              <select
                value={selectedPleno}
                onChange={(e) => setSelectedPleno(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006633]"
              >
                <option value="ALL">Semua Pleno</option>
                {availablePlenos.map((pl) => (
                  <option key={pl} value={pl}>
                    Pleno {pl}
                  </option>
                ))}
              </select>
            </div>

            {/* Leader / Period Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pimpinan:</span>
              <select
                value={selectedLeader}
                onChange={(e) => setSelectedLeader(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006633]"
              >
                <option value="ALL">Semua Pimpinan</option>
                <option value="Ali Yafie">Prof. K.H. Ali Yafie (2000)</option>
                <option value="Sahal Mahfudh">K.H. M.A. Sahal Mahfudh (2000-2014)</option>
                <option value="Ma'ruf Amin">Dr. KH. Ma'ruf Amin (2014-2023)</option>
                <option value="Anwar Iskandar">K.H. M. Anwar Iskandar (2023-2025)</option>
                <option value="Cholil Nafis">K.H. M. Cholil Nafis (2026)</option>
              </select>
            </div>

            {/* Reset Filters */}
            {(searchQuery || selectedYear !== "ALL" || selectedPleno !== "ALL" || selectedLeader !== "ALL" || selectedStatus !== "ALL") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedYear("ALL");
                  setSelectedPleno("ALL");
                  setSelectedLeader("ALL");
                  setSelectedStatus("ALL");
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 px-2 py-1.5 underline"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Results Count & Items Per Page */}
        <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            Menampilkan <span className="font-bold text-slate-800 dark:text-slate-200">{filteredFatwas.length}</span> fatwa
            {filteredFatwas.length !== fatwaList.length && (
              <span> (disaring dari total {fatwaList.length} fatwa)</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span>Tampilkan per halaman:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── TABULAR DATABASE LIST ── */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading && fatwaList.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="animate-spin text-slate-400" size={28} />
            <p className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Memuat Database Fatwa...</p>
          </div>
        ) : filteredFatwas.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-center">
            <FileText size={36} className="text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Tidak ada fatwa yang cocok dengan kriteria pencarian.</p>
            <p className="text-xs text-slate-400">Silakan ubah kata kunci pencarian atau sesuaikan filter tahun dan pleno.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-500 font-extrabold">
                  <th className="py-3 px-4 w-12 text-center">No.</th>
                  <th className="py-3 px-4 w-44">Nomor Fatwa</th>
                  <th className="py-3 px-4">Judul Fatwa DSN-MUI</th>
                  <th className="py-3 px-4 w-36">Tanggal Penetapan</th>
                  <th className="py-3 px-4 w-28 text-center">Rapat Pleno</th>
                  <th className="py-3 px-4 w-56">Penandatangan / Pimpinan</th>
                  <th className="py-3 px-4 w-24 text-center">Status</th>
                  <th className="py-3 px-4 w-28 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {paginatedFatwas.map((fatwa, index) => {
                  const displayNo = fatwa.noUrut ?? (currentPage - 1) * itemsPerPage + index + 1;
                  const nomorFatwa = fatwa.nomorFatwa || fatwa.agendaNumber;

                  return (
                    <tr
                      key={fatwa.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* No. */}
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-400">
                        {displayNo}
                      </td>

                      {/* Nomor Fatwa */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[11px]">
                            {nomorFatwa}
                          </span>
                          <button
                            onClick={() => handleCopy(nomorFatwa)}
                            title="Salin nomor fatwa"
                            className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </td>

                      {/* Judul Fatwa */}
                      <td className="py-3 px-4">
                        <div
                          onClick={() => {
                            setSelectedFatwa(fatwa);
                            setIsDetailModalOpen(true);
                          }}
                          className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#006633] dark:group-hover:text-emerald-400 cursor-pointer leading-snug"
                        >
                          {fatwa.title}
                        </div>
                        {fatwa.keterangan && (
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-md">
                            {fatwa.keterangan}
                          </p>
                        )}
                      </td>

                      {/* Tanggal */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        {formatIndoDate(fatwa.tanggal)}
                      </td>

                      {/* Pleno */}
                      <td className="py-3 px-4 text-center">
                        {fatwa.pleno ? (
                          <span className="inline-block px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 rounded-full font-mono text-[10px] font-bold">
                            Pleno {fatwa.pleno}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </td>

                      {/* Penandatangan */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-[11px] leading-tight">
                        {fatwa.penandatangan1 || fatwa.penandatangan2 ? (
                          <div>
                            {fatwa.penandatangan1 && <div className="font-semibold text-slate-800 dark:text-slate-200">{fatwa.penandatangan1}</div>}
                            {fatwa.penandatangan2 && <div className="text-slate-400 text-[10px]">{fatwa.penandatangan2}</div>}
                          </div>
                        ) : (
                          <span>{fatwa.applicant || "DSN-MUI"}</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                          fatwa.status === "PUBLIKASI"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
                            : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800"
                        }`}>
                          {fatwa.status === "PUBLIKASI" ? "RESMI" : fatwa.status}
                        </span>
                      </td>

                      {/* Aksi (Detail, Edit, Hapus) */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Detail Button */}
                          <button
                            onClick={() => {
                              setSelectedFatwa(fatwa);
                              setIsDetailModalOpen(true);
                            }}
                            title="Lihat Rincian Fatwa"
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEdit(fatwa)}
                            title="Edit Data Fatwa"
                            className="p-1.5 rounded hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-600 hover:text-amber-700 transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleOpenDelete(fatwa)}
                            title="Hapus Fatwa dari Database"
                            className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 hover:text-rose-700 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── PAGINATION CONTROLS ── */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-mono">
            Halaman <span className="font-bold text-slate-800 dark:text-slate-200">{currentPage}</span> dari{" "}
            <span className="font-bold text-slate-800 dark:text-slate-200">{totalPages}</span> (Total {filteredFatwas.length} entri)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Sebelumnya
            </button>

            {/* Quick Page Jump */}
            <div className="hidden sm:flex items-center gap-1">
              {pageNumbers.map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded text-xs font-mono font-bold transition-colors ${
                    currentPage === pageNum
                      ? "bg-[#006633] text-white"
                      : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
            >
              Selanjutnya <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── MODAL: EDIT FATWA ── */}
      {isEditModalOpen && selectedFatwa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Edit2 className="text-amber-500" size={18} />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  Edit Data Fatwa DSN-MUI
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Judul Fatwa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formJudul}
                  onChange={(e) => setFormJudul(e.target.value)}
                  placeholder="Contoh: Giro, Tabungan, Pembiayaan Mudharabah..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#006633]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                    Nomor Fatwa / Agenda <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formNomorFatwa}
                    onChange={(e) => setFormNomorFatwa(e.target.value)}
                    placeholder="Contoh: 01/DSN-MUI/IV/2000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#006633]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                    Tanggal Penetapan
                  </label>
                  <input
                    type="date"
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#006633]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                    Rapat Pleno ke-
                  </label>
                  <input
                    type="text"
                    value={formPleno}
                    onChange={(e) => setFormPleno(e.target.value)}
                    placeholder="Contoh: 1, 2, 7 & 8, 60"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#006633]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                    Tahun
                  </label>
                  <input
                    type="number"
                    value={formTahun}
                    onChange={(e) => setFormTahun(e.target.value)}
                    placeholder="2000 - 2026"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#006633]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#006633]"
                  >
                    <option value="PUBLIKASI">PUBLIKASI (Resmi)</option>
                    <option value="PLENO">PLENO</option>
                    <option value="BPH">BPH</option>
                    <option value="KAJIAN">KAJIAN</option>
                    <option value="PERMOHONAN">PERMOHONAN</option>
                    <option value="TTE">TTE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                    Penandatangan 1 (Ketua / Ketum)
                  </label>
                  <input
                    type="text"
                    value={formTtd1}
                    onChange={(e) => setFormTtd1(e.target.value)}
                    placeholder="Contoh: Prof. K.H. Ali Yafie"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#006633]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                    Penandatangan 2 (Sekretaris)
                  </label>
                  <input
                    type="text"
                    value={formTtd2}
                    onChange={(e) => setFormTtd2(e.target.value)}
                    placeholder="Contoh: Drs. H. A Nazri Adlani"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#006633]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Keterangan / Catatan Tambahan
                </label>
                <textarea
                  rows={3}
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  placeholder="Catatan sidang pleno, pengesahan, atau rujukan fatwa..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006633]"
                />
              </div>

              {/* Form Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-[#006633] hover:bg-[#00552b] text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {formLoading && <RefreshCw size={14} className="animate-spin" />}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE FATWA ── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Plus className="text-[#006633] dark:text-emerald-400" size={18} />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  Tambah Fatwa Baru ke Database
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCreate} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Judul Fatwa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formJudul}
                  onChange={(e) => setFormJudul(e.target.value)}
                  placeholder="Contoh: Skema Investasi Emas Digital Berdasarkan Prinsip Syariah"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#006633]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                    Nomor Fatwa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formNomorFatwa}
                    onChange={(e) => setFormNomorFatwa(e.target.value)}
                    placeholder="Contoh: 167/DSN-MUI/X/2026"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#006633]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                    Tanggal Penetapan
                  </label>
                  <input
                    type="date"
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#006633]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                    Rapat Pleno ke-
                  </label>
                  <input
                    type="text"
                    value={formPleno}
                    onChange={(e) => setFormPleno(e.target.value)}
                    placeholder="Contoh: 61"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#006633]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                    Tahun
                  </label>
                  <input
                    type="number"
                    value={formTahun}
                    onChange={(e) => setFormTahun(e.target.value)}
                    placeholder="2026"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#006633]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#006633]"
                  >
                    <option value="PUBLIKASI">PUBLIKASI (Resmi)</option>
                    <option value="PLENO">PLENO</option>
                    <option value="BPH">BPH</option>
                    <option value="KAJIAN">KAJIAN</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                    Penandatangan 1 (Ketua / Ketum)
                  </label>
                  <input
                    type="text"
                    value={formTtd1}
                    onChange={(e) => setFormTtd1(e.target.value)}
                    placeholder="K.H. M. Cholil Nafis, Lc., Ph.D."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#006633]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                    Penandatangan 2 (Sekretaris)
                  </label>
                  <input
                    type="text"
                    value={formTtd2}
                    onChange={(e) => setFormTtd2(e.target.value)}
                    placeholder="Dr. H. Amirsyah Tambunan, M.A."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#006633]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Keterangan / Deskripsi
                </label>
                <textarea
                  rows={3}
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  placeholder="Catatan mengenai materi pokok atau sidang pleno..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006633]"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-[#006633] hover:bg-[#00552b] text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {formLoading && <RefreshCw size={14} className="animate-spin" />}
                  <span>Simpan ke Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRM DELETE ── */}
      {isDeleteModalOpen && selectedFatwa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/40 shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  Hapus Data Fatwa
                </h3>
                <p className="text-[11px] text-slate-500">Konfirmasi tindakan penghapusan permanen.</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">FATWA TARGET</span>
              <p className="text-xs font-bold text-slate-900 dark:text-white">{selectedFatwa.title}</p>
              <p className="text-[11px] font-mono text-[#006633] dark:text-emerald-400 font-semibold">
                Nomor: {selectedFatwa.nomorFatwa || selectedFatwa.agendaNumber}
              </p>
            </div>

            <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
              Apakah Anda yakin ingin menghapus data fatwa ini? Tindakan ini tidak dapat dibatalkan dan data akan dihapus permanen dari basis data sistem Amanah.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-semibold text-xs transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={formLoading}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {formLoading && <RefreshCw size={14} className="animate-spin" />}
                <span>Ya, Hapus Permanen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: DETAIL FATWA ── */}
      {isDetailModalOpen && selectedFatwa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-emerald-50/50 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2">
                <BookOpen className="text-[#006633] dark:text-emerald-400" size={18} />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  Rincian Fatwa DSN-MUI
                </h3>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200">
                  {selectedFatwa.nomorFatwa || selectedFatwa.agendaNumber}
                </span>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mt-2 leading-snug">
                  {selectedFatwa.title}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400 block">Tanggal Penetapan</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {formatIndoDate(selectedFatwa.tanggal)}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400 block">Rapat Pleno</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {selectedFatwa.pleno ? `Sidang Pleno ke-${selectedFatwa.pleno}` : "-"}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400 block">Tahun Dokumen</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {selectedFatwa.tahun || (selectedFatwa.tanggal ? new Date(selectedFatwa.tanggal).getFullYear() : "-")}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400 block">Status Regulasi</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block uppercase">
                    {selectedFatwa.status} (Resmi)
                  </span>
                </div>
              </div>

              {/* Signers Info */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Penandatangan Naskah Fatwa</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[9px] text-slate-400 block">Ketua / Ketum DSN-MUI:</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {selectedFatwa.penandatangan1 || selectedFatwa.applicant || "Dewan Pimpinan DSN-MUI"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">Sekretaris DSN-MUI:</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {selectedFatwa.penandatangan2 || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedFatwa.keterangan && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Catatan & Histori Pleno</span>
                  <p className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 leading-relaxed font-mono text-[11px]">
                    {selectedFatwa.keterangan}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => handleCopy(selectedFatwa.nomorFatwa || selectedFatwa.agendaNumber)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#006633]"
                >
                  <Copy size={14} /> Salin Nomor Fatwa
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleOpenEdit(selectedFatwa);
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Edit2 size={13} /> Edit Fatwa
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDetailModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-semibold transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
