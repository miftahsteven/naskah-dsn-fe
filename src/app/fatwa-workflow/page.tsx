"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Download,
  BookOpen,
  Users,
  Layers,
  PenTool,
  Globe,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  ChevronRight,
  Bell,
  X,
  AlertTriangle,
  Calendar,
  User,
  Filter,
  CheckCircle2,
  FileSpreadsheet
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

export default function FatwaWorkflowPage() {
  const { fatwaList, fetchFatwaList, addFatwa, updateFatwa, deleteFatwa, loading, error } = useFatwaStore();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>("ALL_ACTIVE"); // ALL_ACTIVE, PERMOHONAN, etc.
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form states
  const [selectedFatwa, setSelectedFatwa] = useState<Fatwa | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formAgendaNumber, setFormAgendaNumber] = useState("");
  const [formStatus, setFormStatus] = useState<string>("PERMOHONAN");
  const [formApplicant, setFormApplicant] = useState("");
  const [formTanggal, setFormTanggal] = useState("");
  const [formKeterangan, setFormKeterangan] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchFatwaList();
  }, [fetchFatwaList]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStageFilter, searchQuery]);

  // Stage configurations for rendering icons, colors, labels
  const stageConfig = useMemo(() => {
    return {
      PERMOHONAN: {
        label: "Permohonan",
        colorClass: "from-purple-500 to-indigo-600",
        bgLight: "bg-purple-50 dark:bg-purple-950/20",
        textClass: "text-purple-600 dark:text-purple-400",
        borderClass: "border-purple-200 dark:border-purple-900/30",
        icon: Download,
        index: 1
      },
      KAJIAN: {
        label: "Kajian",
        colorClass: "from-amber-500 to-orange-600",
        bgLight: "bg-amber-50 dark:bg-amber-950/20",
        textClass: "text-amber-600 dark:text-amber-400",
        borderClass: "border-amber-200 dark:border-amber-900/30",
        icon: BookOpen,
        index: 2
      },
      BPH: {
        label: "BPH",
        colorClass: "from-blue-500 to-indigo-600",
        bgLight: "bg-blue-50 dark:bg-blue-950/20",
        textClass: "text-blue-600 dark:text-blue-400",
        borderClass: "border-blue-200 dark:border-blue-900/30",
        icon: Users,
        index: 3
      },
      PLENO: {
        label: "Pleno",
        colorClass: "from-emerald-500 to-teal-600",
        bgLight: "bg-emerald-50 dark:bg-emerald-950/20",
        textClass: "text-emerald-600 dark:text-emerald-400",
        borderClass: "border-emerald-200 dark:border-emerald-900/30",
        icon: Layers,
        index: 4
      },
      TTE: {
        label: "TTE",
        colorClass: "from-teal-500 to-cyan-600",
        bgLight: "bg-teal-50 dark:bg-teal-950/20",
        textClass: "text-teal-600 dark:text-teal-400",
        borderClass: "border-teal-200 dark:border-teal-900/30",
        icon: PenTool,
        index: 5
      },
      PUBLIKASI: {
        label: "Publikasi",
        colorClass: "from-sky-500 to-blue-600",
        bgLight: "bg-sky-50 dark:bg-sky-950/20",
        textClass: "text-sky-600 dark:text-sky-400",
        borderClass: "border-sky-200 dark:border-sky-900/30",
        icon: Globe,
        index: 6
      }
    };
  }, []);

  // Compute counts dynamically based on actual list from server
  const counts = useMemo(() => {
    const defaultCounts = {
      TOTAL_ACTIVE: 0,
      PERMOHONAN: 0,
      KAJIAN: 0,
      BPH: 0,
      PLENO: 0,
      TTE: 0,
      PUBLIKASI: 0
    };

    fatwaList.forEach((f) => {
      const status = f.status.toUpperCase();
      if (status in defaultCounts) {
        // @ts-ignore
        defaultCounts[status] += 1;
        if (status !== "PUBLIKASI") {
          defaultCounts.TOTAL_ACTIVE += 1;
        }
      }
    });

    return defaultCounts;
  }, [fatwaList]);

  // Filter list
  const filteredList = useMemo(() => {
    return fatwaList.filter((f) => {
      const matchesSearch =
        f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.agendaNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.applicant.toLowerCase().includes(searchQuery.toLowerCase());

      const status = f.status.toUpperCase();
      if (selectedStageFilter === "ALL_ACTIVE") {
        return matchesSearch && status !== "PUBLIKASI";
      } else if (selectedStageFilter === "ALL") {
        return matchesSearch;
      } else {
        return matchesSearch && status === selectedStageFilter;
      }
    });
  }, [fatwaList, searchQuery, selectedStageFilter]);

  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredList.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredList, currentPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  }, [filteredList]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredList.length);

  // Set form fields for editing or viewing
  const populateFormFields = (fatwa: Fatwa) => {
    setSelectedFatwa(fatwa);
    setFormTitle(fatwa.title);
    setFormAgendaNumber(fatwa.agendaNumber);
    setFormStatus(fatwa.status);
    setFormApplicant(fatwa.applicant);
    setFormTanggal(fatwa.tanggal ? new Date(fatwa.tanggal).toISOString().split("T")[0] : "");
    setFormKeterangan(fatwa.keterangan || "");
    setFormError(null);
  };

  const clearFormFields = () => {
    setSelectedFatwa(null);
    setFormTitle("");
    setFormAgendaNumber("");
    setFormStatus("PERMOHONAN");
    setFormApplicant("");
    setFormTanggal(new Date().toISOString().split("T")[0]);
    setFormKeterangan("");
    setFormError(null);
  };

  // Submit Create form
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formTitle || !formAgendaNumber || !formStatus || !formApplicant) {
      setFormError("Silakan isi semua field yang wajib.");
      return;
    }

    const success = await addFatwa({
      title: formTitle,
      agendaNumber: formAgendaNumber,
      status: formStatus as any,
      applicant: formApplicant,
      tanggal: formTanggal ? new Date(formTanggal).toISOString() : new Date().toISOString(),
      keterangan: formKeterangan
    });

    if (success) {
      setIsCreateModalOpen(false);
      clearFormFields();
    } else {
      setFormError(error || "Gagal membuat data fatwa baru. Pastikan Nomor Agenda unik.");
    }
  };

  // Submit Edit form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedFatwa) return;

    if (!formTitle || !formAgendaNumber || !formStatus || !formApplicant) {
      setFormError("Silakan isi semua field yang wajib.");
      return;
    }

    const success = await updateFatwa(selectedFatwa.id, {
      title: formTitle,
      agendaNumber: formAgendaNumber,
      status: formStatus as any,
      applicant: formApplicant,
      tanggal: formTanggal ? new Date(formTanggal).toISOString() : new Date().toISOString(),
      keterangan: formKeterangan
    });

    if (success) {
      setIsEditModalOpen(false);
      clearFormFields();
    } else {
      setFormError(error || "Gagal memperbarui data fatwa. Pastikan Nomor Agenda unik.");
    }
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!selectedFatwa) return;
    const success = await deleteFatwa(selectedFatwa.id);
    if (success) {
      setIsDeleteModalOpen(false);
      setSelectedFatwa(null);
    } else {
      alert("Gagal menghapus data fatwa.");
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300">
      
      {/* ── BREADCRUMBS & PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
            <span>Dashboard</span>
            <ChevronRight size={10} />
            <span>Fatwa</span>
            <ChevronRight size={10} />
            <span className="text-[#006633] dark:text-[#D4AF37]">Workflow Fatwa</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight mt-1">
            Workflow Fatwa
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-1">
            Dashboard proses penyusunan fatwa DSN-MUI.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => setSelectedStageFilter("ALL")}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg border transition-all uppercase tracking-wider ${
              selectedStageFilter === "ALL"
                ? "bg-slate-100 border-slate-300 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
            }`}
          >
            <Filter size={13} /> Tampilkan Semua Tahap
          </button>
          <button
            onClick={() => {
              clearFormFields();
              setIsCreateModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#006633] hover:bg-[#00552b] text-white font-bold rounded-lg transition-all text-xs uppercase tracking-wider shadow-sm cursor-pointer"
          >
            <Plus size={16} /> Buat Permohonan
          </button>
        </div>
      </div>

      {/* ── ALUR WORKFLOW FATWA (PIPELINE VISUALIZER WITH STANDALONE TOTAL CARD) ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850 p-6 shadow-xs relative overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-[#006633] dark:bg-[#D4AF37] rounded-full inline-block" />
            Alur Workflow Fatwa
          </h2>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Klik simpul atau total aktif untuk menyaring
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Block: Standalone Total Proses Info Block */}
          <div className="lg:col-span-1">
            <div
              onClick={() => setSelectedStageFilter("ALL_ACTIVE")}
              className={`cursor-pointer rounded-2xl p-5 transition-all border duration-200 flex flex-col justify-between h-full ${
                selectedStageFilter === "ALL_ACTIVE"
                  ? "bg-[#006633] border-[#00552b] text-white shadow-md shadow-[#006633]/25"
                  : "bg-slate-50 border-slate-200/60 hover:border-[#006633]/30 dark:bg-slate-950 dark:border-slate-850 dark:hover:border-[#006633]/50"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className={`p-2 rounded-xl ${selectedStageFilter === "ALL_ACTIVE" ? "bg-white/10" : "bg-emerald-50 dark:bg-emerald-950/20"}`}>
                  <FileText size={20} className={selectedStageFilter === "ALL_ACTIVE" ? "text-white" : "text-[#006633]"} />
                </div>
                <span className={`text-[9px] font-extrabold uppercase tracking-wider ${selectedStageFilter === "ALL_ACTIVE" ? "text-emerald-100" : "text-slate-400"}`}>
                  Aktif
                </span>
              </div>
              <div className="mt-6">
                <h3 className={`text-3xl font-extrabold tracking-tight ${selectedStageFilter === "ALL_ACTIVE" ? "text-white" : "text-slate-850 dark:text-white"}`}>
                  {counts.TOTAL_ACTIVE}
                </h3>
                <p className={`text-xs font-bold mt-1 ${selectedStageFilter === "ALL_ACTIVE" ? "text-emerald-100" : "text-slate-500"}`}>
                  Total Proses Aktif
                </p>
                <p className={`text-[10px] mt-1.5 leading-normal ${selectedStageFilter === "ALL_ACTIVE" ? "text-emerald-200/80" : "text-slate-400"}`}>
                  Seluruh permohonan fatwa yang sedang berjalan dalam tahapan alur.
                </p>
              </div>
            </div>
          </div>

          {/* Right Block: Alur Pipeline Flow */}
          <div className="lg:col-span-3 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-850/60 pt-6 lg:pt-0 lg:pl-6">
            {/* The horizontal connecting line process */}
            <div className="relative flex justify-between items-center w-full max-w-3xl mx-auto px-2 mt-4 mb-2">
              {/* Horizontal Line under nodes */}
              <div className="absolute top-6 left-[8%] right-[8%] h-[2px] bg-slate-100 dark:bg-slate-800 -translate-y-1/2 z-0" />

              {Object.entries(stageConfig).map(([key, config], i) => {
                const IconComponent = config.icon;
                const count = counts[key as keyof typeof counts] || 0;
                const isSelected = selectedStageFilter === key;

                return (
                  <div
                    key={key}
                    onClick={() => setSelectedStageFilter(key)}
                    className="relative z-10 flex flex-col items-center group cursor-pointer"
                  >
                    <div
                      className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-350 shadow-xs ${
                        isSelected
                          ? "bg-slate-900 border-slate-900 text-white scale-110 shadow-lg dark:bg-white dark:border-white dark:text-slate-900"
                          : "bg-white border-slate-200 text-slate-500 hover:border-slate-400 hover:scale-105 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-650"
                      }`}
                    >
                      <IconComponent size={20} className={isSelected ? "text-white dark:text-slate-900" : config.textClass} />
                    </div>

                    <div className="mt-3 text-center space-y-1">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={`w-3.5 h-3.5 rounded-full text-[9px] font-bold flex items-center justify-center text-white bg-gradient-to-r ${config.colorClass}`}>
                          {config.index}
                        </span>
                        <span className={`text-[11px] font-bold leading-tight ${isSelected ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>
                          {config.label}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 font-mono">
                        {count} Aktif
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend color circles */}
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-6 pt-4 border-t border-slate-50 dark:border-slate-850/30">
              {Object.entries(stageConfig).map(([key, config]) => (
                <div
                  key={key}
                  onClick={() => setSelectedStageFilter(key)}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${config.colorClass} group-hover:scale-110 transition-transform`} />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white uppercase tracking-wider">
                    {config.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── TWO COLUMN MAIN LAYOUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        
        {/* LEFT COLUMN: ACTIVE PROCESS LIST (7/10 width) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850 p-5 shadow-xs">
            
            {/* Inner Header with Search and Stats */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 pb-4 border-b border-slate-50 dark:border-slate-850/40">
              <div>
                <h2 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-3.5 bg-[#006633] dark:bg-[#D4AF37] rounded-full inline-block" />
                  Proses Fatwa Aktif
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                  Menampilkan {filteredList.length > 0 ? startIndex + 1 : 0}-{endIndex} dari {filteredList.length} fatwa
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari no. agenda, judul, pengaju..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-[#006633] focus:ring-1 focus:ring-[#006633]/20 transition-all font-medium text-slate-800 dark:text-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-450 hover:text-slate-650"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* LIST CONTAINER */}
            <div className="space-y-3">
              {loading && fatwaList.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#006633]"></div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Loading data...</p>
                </div>
              ) : filteredList.length === 0 ? (
                <div className="py-20 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <AlertTriangle className="size-8 text-slate-350 mx-auto" />
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Tidak ada data fatwa ditemukan</h4>
                  <p className="text-[10px] text-slate-450 font-semibold max-w-xs mx-auto">
                    Silakan ganti kata kunci pencarian Anda atau periksa filter tahap yang sedang aktif.
                  </p>
                </div>
              ) : (
                paginatedList.map((fatwa) => {
                  const config = stageConfig[fatwa.status.toUpperCase() as keyof typeof stageConfig] || {
                    label: fatwa.status,
                    bgLight: "bg-slate-50",
                    textClass: "text-slate-600",
                    borderClass: "border-slate-200",
                    icon: FileText
                  };
                  const IconComp = config.icon;

                  return (
                    <div
                      key={fatwa.id}
                      className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white border border-slate-100 hover:border-slate-200 dark:bg-slate-900 dark:border-slate-850 dark:hover:border-slate-800 rounded-xl transition-all hover:shadow-xs gap-3"
                    >
                      {/* Left Block: Icon and details */}
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        {/* Status Icon Wrapper */}
                        <div className={`p-3 rounded-xl shrink-0 ${config.bgLight} border ${config.borderClass} group-hover:scale-105 transition-transform`}>
                          <IconComp size={18} className={config.textClass} />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <h4 className="font-bold text-slate-850 dark:text-white text-xs sm:text-[13px] leading-snug group-hover:text-[#006633] dark:group-hover:text-[#D4AF37] transition-colors line-clamp-2">
                            {fatwa.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-450 dark:text-slate-500 font-semibold">
                            <span className="font-mono">No. Agenda: {fatwa.agendaNumber}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-850" />
                            <span className="flex items-center gap-1">
                              <User size={10} /> Oleh: {fatwa.applicant}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Block: Date, Stage Badge, Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-50 dark:border-slate-850/40">
                        <div className="sm:text-right space-y-1 text-left">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono block">
                            {formatIndoDate(fatwa.tanggal)}
                          </span>
                          
                          {/* Stage Badge */}
                          <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${config.bgLight} ${config.textClass} ${config.borderClass}`}>
                            <span className={`w-1 h-1 rounded-full ${config.textClass.replace("text-", "bg-")}`} />
                            {config.label}
                          </span>
                        </div>

                        {/* Actions group */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              populateFormFields(fatwa);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1.5 text-slate-450 hover:text-[#006633] hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg transition-all cursor-pointer"
                            title="Detail Fatwa"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => {
                              populateFormFields(fatwa);
                              setIsEditModalOpen(true);
                            }}
                            className="p-1.5 text-slate-450 hover:text-[#D4AF37] hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-lg transition-all cursor-pointer"
                            title="Edit Fatwa"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              populateFormFields(fatwa);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-slate-450 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-all cursor-pointer"
                            title="Hapus Fatwa"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 mt-4 border-t border-slate-50 dark:border-slate-850/40">
                <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-250 text-slate-650 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-850 transition-colors text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Sebelumnya
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        currentPage === pageNum
                          ? "bg-[#006633] text-white shadow-xs"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-450 dark:hover:bg-slate-850 cursor-pointer"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-250 text-slate-650 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-850 transition-colors text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: SIDE PANEL (3/10 width) */}
        <div className="lg:col-span-3 space-y-5">
          
          {/* QUICK ACTION BUTTON CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
            {/* Buat Permohonan Card */}
            <div
              onClick={() => {
                clearFormFields();
                setIsCreateModalOpen(true);
              }}
              className="group cursor-pointer p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 hover:border-emerald-250 dark:hover:border-emerald-900/30 rounded-xl transition-all shadow-xs flex items-center justify-between gap-2"
            >
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-[#006633] dark:group-hover:text-[#D4AF37] transition-colors leading-snug">
                  Buat Permohonan
                </h4>
                <p className="text-[9px] text-slate-400 font-semibold leading-tight">
                  Ajukan permohonan penyusunan fatwa baru
                </p>
              </div>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg shrink-0 group-hover:scale-105 transition-transform text-[#006633] dark:text-[#D4AF37]">
                <Plus size={15} />
              </div>
            </div>

            {/* Laporan Workflow Card */}
            <div
              onClick={() => alert("Membuka halaman laporan dan statistik workflow fatwa...")}
              className="group cursor-pointer p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 hover:border-blue-250 dark:hover:border-blue-900/30 rounded-xl transition-all shadow-xs flex items-center justify-between gap-2"
            >
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors leading-snug">
                  Laporan Workflow
                </h4>
                <p className="text-[9px] text-slate-400 font-semibold leading-tight">
                  Lihat laporan dan statistik penyusunan fatwa
                </p>
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg shrink-0 group-hover:scale-105 transition-transform text-blue-600">
                <FileSpreadsheet size={15} />
              </div>
            </div>
          </div>

          {/* NOTIFIKASI PENTING */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Bell size={14} className="text-amber-500 shrink-0" />
              Notifikasi Penting
            </h3>
            
            <div className="space-y-3.5">
              {/* Alert 1 */}
              <div
                onClick={() => {
                  const found = fatwaList.find(f => f.title.includes("Cloud Computing") || f.agendaNumber === "033/BPH/DSN-MUI/V/2026");
                  if (found) {
                    populateFormFields(found);
                    setIsDetailModalOpen(true);
                  } else {
                    alert("Detail tidak ditemukan.");
                  }
                }}
                className="cursor-pointer group flex items-start gap-3 p-3 bg-amber-50/50 dark:bg-amber-950/10 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-950/30 transition-all"
              >
                <div className="w-5 h-5 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  1
                </div>
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold text-slate-800 dark:text-white leading-tight group-hover:text-amber-600">
                    Menunggu tindak lanjut di tahap BPH
                  </h4>
                  <p className="text-[10px] text-slate-450 dark:text-slate-400 font-semibold leading-snug">
                    Akad ijarah pada layanan cloud computing
                  </p>
                </div>
              </div>

              {/* Alert 2 */}
              <div
                onClick={() => {
                  const found = fatwaList.find(f => f.title.includes("Crypto Asset") || f.agendaNumber === "022/TTE/DSN-MUI/V/2026");
                  if (found) {
                    populateFormFields(found);
                    setIsDetailModalOpen(true);
                  } else {
                    alert("Detail tidak ditemukan.");
                  }
                }}
                className="cursor-pointer group flex items-start gap-3 p-3 bg-teal-50/50 dark:bg-teal-950/10 hover:bg-teal-50 dark:hover:bg-teal-950/20 rounded-xl border border-teal-100 dark:border-teal-950/30 transition-all"
              >
                <div className="w-5 h-5 rounded-full bg-teal-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  2
                </div>
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold text-slate-800 dark:text-white leading-tight group-hover:text-teal-600">
                    Menunggu TTE Ketua DSN-MUI
                  </h4>
                  <p className="text-[10px] text-slate-450 dark:text-slate-400 font-semibold leading-snug">
                    Fatwa tentang Crypto Asset berdasarkan Prinsip Syariah
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── MODALS & DRAWER SYSTEMS ── */}

      {/* 1. CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-850">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white">
                Buat Permohonan Fatwa Baru
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-450"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450">
                  Judul Fatwa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Permohonan Fatwa tentang Transaksi Emas Digital"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg outline-none focus:border-[#006633] transition-all font-medium text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450">
                    Nomor Agenda <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 045/PF/DSN-MUI/V/2026"
                    value={formAgendaNumber}
                    onChange={(e) => setFormAgendaNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg outline-none focus:border-[#006633] transition-all font-mono text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450">
                    Tahapan / Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg outline-none focus:border-[#006633] transition-all font-medium text-slate-900 dark:text-white"
                    required
                  >
                    {Object.entries(stageConfig).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450">
                    Pengaju / Pihak Terkait <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: PT Emas Mulia"
                    value={formApplicant}
                    onChange={(e) => setFormApplicant(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg outline-none focus:border-[#006633] transition-all font-medium text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450">
                    Tanggal Agenda
                  </label>
                  <input
                    type="date"
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg outline-none focus:border-[#006633] transition-all font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450">
                  Deskripsi / Keterangan Tambahan
                </label>
                <textarea
                  placeholder="Keterangan singkat mengenai substansi permohonan fatwa..."
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg outline-none focus:border-[#006633] transition-all font-medium text-slate-900 dark:text-white h-24 resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 rounded-lg transition-colors font-bold uppercase tracking-wider text-[10px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#006633] hover:bg-[#00552b] text-white rounded-lg transition-colors font-bold uppercase tracking-wider text-[10px] cursor-pointer"
                >
                  {loading ? "Menyimpan..." : "Simpan Permohonan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-850">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white">
                Edit Data Fatwa
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-450"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450">
                  Judul Fatwa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg outline-none focus:border-[#006633] transition-all font-medium text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450">
                    Nomor Agenda <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formAgendaNumber}
                    onChange={(e) => setFormAgendaNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg outline-none focus:border-[#006633] transition-all font-mono text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450">
                    Tahapan / Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg outline-none focus:border-[#006633] transition-all font-medium text-slate-900 dark:text-white"
                    required
                  >
                    {Object.entries(stageConfig).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450">
                    Pengaju / Pihak Terkait <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formApplicant}
                    onChange={(e) => setFormApplicant(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg outline-none focus:border-[#006633] transition-all font-medium text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450">
                    Tanggal Agenda
                  </label>
                  <input
                    type="date"
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg outline-none focus:border-[#006633] transition-all font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450">
                  Deskripsi / Keterangan Tambahan
                </label>
                <textarea
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg outline-none focus:border-[#006633] transition-all font-medium text-slate-900 dark:text-white h-24 resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 rounded-lg transition-colors font-bold uppercase tracking-wider text-[10px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#006633] hover:bg-[#00552b] text-white rounded-lg transition-colors font-bold uppercase tracking-wider text-[10px] cursor-pointer"
                >
                  {loading ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. DETAIL DRAWER MODAL */}
      {isDetailModalOpen && selectedFatwa && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Drawer Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-850">
              <div>
                <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#006633] dark:text-[#D4AF37]">
                  Detail Dokumen Fatwa
                </h3>
                <p className="text-[10px] text-slate-450 font-mono mt-0.5">ID: {selectedFatwa.id}</p>
              </div>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedFatwa(null);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Profile Card Summary */}
              <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border ${
                  stageConfig[selectedFatwa.status.toUpperCase() as keyof typeof stageConfig]?.borderClass || "border-slate-200"
                } ${
                  stageConfig[selectedFatwa.status.toUpperCase() as keyof typeof stageConfig]?.bgLight || "bg-slate-50"
                }`}>
                  {React.createElement(stageConfig[selectedFatwa.status.toUpperCase() as keyof typeof stageConfig]?.icon || FileText, {
                    size: 24,
                    className: stageConfig[selectedFatwa.status.toUpperCase() as keyof typeof stageConfig]?.textClass
                  })}
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                    {selectedFatwa.title}
                  </h4>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="inline-flex items-center text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      No: {selectedFatwa.agendaNumber}
                    </span>
                    <span className={`inline-flex items-center text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                      stageConfig[selectedFatwa.status.toUpperCase() as keyof typeof stageConfig]?.bgLight
                    } ${
                      stageConfig[selectedFatwa.status.toUpperCase() as keyof typeof stageConfig]?.textClass
                    } ${
                      stageConfig[selectedFatwa.status.toUpperCase() as keyof typeof stageConfig]?.borderClass
                    }`}>
                      {stageConfig[selectedFatwa.status.toUpperCase() as keyof typeof stageConfig]?.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 1: Detail Metadata */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-[#006633] dark:text-[#D4AF37] border-b border-slate-100 dark:border-slate-850 pb-1.5">
                  1. Informasi Dokumen
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-bold text-slate-400">Pengaju / Pihak Terkait</span>
                    <span className="font-bold text-[#006633] dark:text-[#D4AF37]">{selectedFatwa.applicant}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-bold text-slate-400">Tanggal Agenda</span>
                    <span className="font-mono">{formatIndoDate(selectedFatwa.tanggal)}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-bold text-slate-400">Terdaftar Pada</span>
                    <span className="font-mono">{formatIndoDate(selectedFatwa.createdAt)}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-bold text-slate-400">Pembaruan Terakhir</span>
                    <span className="font-mono">{formatIndoDate(selectedFatwa.updatedAt)}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 sm:col-span-2">
                    <span className="text-[9px] uppercase font-bold text-slate-400">Deskripsi / Keterangan</span>
                    <p className="font-medium text-slate-650 dark:text-slate-350 leading-relaxed bg-slate-50/50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200/50 dark:border-slate-850 text-[11px]">
                      {selectedFatwa.keterangan || "Tidak ada keterangan tambahan."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Progress Pipeline Visualizer */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-[#006633] dark:text-[#D4AF37] border-b border-slate-100 dark:border-slate-850 pb-1.5">
                  2. Riwayat & Progress Workflow
                </h4>
                
                {/* Vertical Step Timeline */}
                <div className="space-y-4 pl-4 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
                  {Object.entries(stageConfig).map(([key, config]) => {
                    const currentActiveIndex = stageConfig[selectedFatwa.status.toUpperCase() as keyof typeof stageConfig]?.index || 1;
                    const isCompleted = config.index < currentActiveIndex;
                    const isActive = config.index === currentActiveIndex;

                    let nodeStyle = "bg-white border-slate-200 text-slate-350 dark:bg-slate-900 dark:border-slate-800";
                    if (isCompleted) {
                      nodeStyle = "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/20";
                    } else if (isActive) {
                      nodeStyle = `border-2 ${config.bgLight} ${config.textClass} ${config.borderClass} font-bold scale-105 ring-4 ring-slate-100 dark:ring-slate-950`;
                    }

                    return (
                      <div key={key} className="flex items-start gap-4 relative z-10">
                        {/* Step Circle indicator */}
                        <div className={`w-5 h-5 rounded-full border text-[9px] font-extrabold flex items-center justify-center shrink-0 ${nodeStyle}`}>
                          {isCompleted ? "✓" : config.index}
                        </div>

                        {/* Step details */}
                        <div className="space-y-0.5">
                          <h5 className={`text-xs font-bold ${
                            isActive
                              ? "text-[#006633] dark:text-[#D4AF37]"
                              : isCompleted
                              ? "text-slate-800 dark:text-slate-200"
                              : "text-slate-400"
                          }`}>
                            Tahap {config.index}: {config.label}
                          </h5>
                          <p className="text-[10px] font-semibold text-slate-400">
                            {isActive
                              ? `Dokumen sedang berada di tahap ${config.label.toLowerCase()} dan menunggu verifikasi.`
                              : isCompleted
                              ? `Telah diselesaikan.`
                              : `Belum dimulai.`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Drawer Footer */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/40 flex justify-end gap-2.5">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setIsEditModalOpen(true);
                }}
                className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-850 rounded-lg text-[10px] font-bold uppercase tracking-wider dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 cursor-pointer"
              >
                Edit Dokumen
              </button>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedFatwa(null);
                }}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-650 hover:bg-slate-50 dark:text-slate-300"
              >
                Tutup Detail
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 4. DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && selectedFatwa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Hapus Data Dokumen Fatwa
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                  Apakah Anda yakin ingin menghapus data fatwa <b className="text-slate-700 dark:text-slate-200">"{selectedFatwa.title}"</b>? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-50 dark:border-slate-850/40">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedFatwa(null);
                }}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-650 hover:bg-slate-50 dark:text-slate-350 transition-colors uppercase tracking-wider"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={loading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition-colors uppercase tracking-wider cursor-pointer"
              >
                {loading ? "Menghapus..." : "Hapus Permanen"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
