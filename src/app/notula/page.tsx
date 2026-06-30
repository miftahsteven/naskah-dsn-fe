"use client";

import React, { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  ChevronRight,
  X,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Share2,
  Info,
  CornerDownRight,
  UserCheck,
  UserPlus,
  UploadCloud,
  Download
} from "lucide-react";
import api from "@/lib/api";
import { useNotulaStore, Notula } from "@/stores/notula.store";
import { useMeetingStore, Meeting, Attendee, MinimalUser } from "@/stores/meeting.store";
import { useAuthStore } from "@/stores/auth.store";

function NotulaPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createFromMeetingId = searchParams.get("createFromMeetingId");

  const {
    notulaList,
    loading: notulaLoading,
    error: notulaError,
    fetchNotulaList,
    addNotula,
    updateNotula,
    deleteNotula,
    shareNotula
  } = useNotulaStore();

  const {
    meetingList,
    usersList,
    fetchMeetingList,
    fetchUsersList
  } = useMeetingStore();

  const currentUser = useAuthStore((state) => state.user);

  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals / Drawers state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form inputs state
  const [selectedNotula, setSelectedNotula] = useState<Notula | null>(null);
  const [formMeetingId, setFormMeetingId] = useState<string>("");
  const [formTitle, setFormTitle] = useState("");
  const [formAgendaNumber, setFormAgendaNumber] = useState("");
  const [formDateTime, setFormDateTime] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formDecisions, setFormDecisions] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formAttendees, setFormAttendees] = useState<Attendee[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Attendees modal search state (for manual input mode)
  const [attendeeSearchQuery, setAttendeeSearchQuery] = useState("");

  // Share modal state
  const [shareTargetNotula, setShareTargetNotula] = useState<Notula | null>(null);
  const [shareSelectedUserIds, setShareSelectedUserIds] = useState<string[]>([]);
  const [shareSearchQuery, setShareSearchQuery] = useState("");

  const [processedMeetingId, setProcessedMeetingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ msg, type });
  };

  useEffect(() => {
    setMounted(true);
    fetchNotulaList();
    fetchMeetingList();
    fetchUsersList();
  }, [fetchNotulaList, fetchMeetingList, fetchUsersList]);

  // Handle automatic form population if directed from Agenda page
  useEffect(() => {
    if (mounted && createFromMeetingId && meetingList.length > 0 && processedMeetingId !== createFromMeetingId) {
      setProcessedMeetingId(createFromMeetingId);
      const meeting = meetingList.find((m) => m.id === createFromMeetingId);
      if (meeting) {
        // Check if Notula already exists for this meeting
        const existingNotula = notulaList.find((n) => n.meetingId === createFromMeetingId);
        if (existingNotula) {
          showToast(`Notula untuk agenda "${meeting.title}" sudah dibuat.`, "info");
          router.replace("/notula");
          setSelectedNotula(existingNotula);
          setIsDetailDrawerOpen(true);
        } else {
          handleInitFromMeeting(meeting);
          // Remove query params to prevent re-opening on reload
          router.replace("/notula");
        }
      }
    }
  }, [mounted, createFromMeetingId, meetingList, notulaList, processedMeetingId]);

  // Pre-fill form from selected meeting
  const handleInitFromMeeting = (meeting: Meeting) => {
    setFormMeetingId(meeting.id);
    setFormTitle(meeting.title);
    setFormAgendaNumber(meeting.agendaNumber || "");
    setFormDateTime(meeting.dateTime ? new Date(meeting.dateTime).toISOString().slice(0, 16) : "");
    setFormLocation(meeting.location);
    setFormContent("");
    setFormFile(null);
    setFormDecisions("");
    setFormNotes("");

    // Default attendance status matches the meeting attendee list, but we default to HADIR_OFFLINE for cost convenience
    const initialAttendees = meeting.attendees.map((att) => ({
      ...att,
      status: (att.status === "HADIR" ? "HADIR_OFFLINE" : att.status) || "HADIR_OFFLINE"
    }));
    setFormAttendees(initialAttendees);
    setSelectedNotula(null);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const clearForm = () => {
    setSelectedNotula(null);
    setFormMeetingId("");
    setFormTitle("");
    setFormAgendaNumber("");
    setFormDateTime("");
    setFormLocation("");
    setFormContent("");
    setFormFile(null);
    setFormDecisions("");
    setFormNotes("");
    setFormAttendees([]);
    setFormError(null);
    setAttendeeSearchQuery("");
  };

  const populateForm = (notula: Notula) => {
    setSelectedNotula(notula);
    setFormMeetingId(notula.meetingId || "");
    setFormTitle(notula.title);
    setFormAgendaNumber(notula.agendaNumber || "");
    setFormDateTime(notula.dateTime ? new Date(notula.dateTime).toISOString().slice(0, 16) : "");
    setFormLocation(notula.location);
    setFormContent(notula.content || "");
    setFormFile(null);
    setFormDecisions(notula.decisions || "");
    setFormNotes(notula.notes || "");
    setFormAttendees(notula.attendees || []);
    setFormError(null);
  };

  // Change attendee status in Form
  const handleUpdateAttendeeStatus = (email: string, status: Attendee["status"]) => {
    setFormAttendees((prev) =>
      prev.map((att) => (att.email === email ? { ...att, status } : att))
    );
  };

  // Bulk status update for attendees
  const handleBulkUpdateStatus = (status: Attendee["status"]) => {
    setFormAttendees((prev) =>
      prev.map((att) => ({ ...att, status }))
    );
  };

  // Toggle user attendee manual (when meetingId is not selected)
  const handleToggleManualAttendee = (user: MinimalUser) => {
    const exists = formAttendees.some((att) => att.userId === user.id);
    if (exists) {
      setFormAttendees((prev) => prev.filter((att) => att.userId !== user.id));
    } else {
      const newAtt: Attendee = {
        userId: user.id,
        name: user.fullName,
        email: user.email,
        phone: user.phone || "",
        department: user.department?.name || "Umum",
        jabatan: user.jabatan?.name || "Anggota",
        isExternal: false,
        status: "HADIR"
      };
      setFormAttendees((prev) => [...prev, newAtt]);
    }
  };

  // Dropdown select meeting triggers
  const handleSelectMeetingDropdown = (meetingId: string) => {
    if (!meetingId) {
      // Switch back to manual mode
      setFormMeetingId("");
      setFormTitle("");
      setFormAgendaNumber("");
      setFormDateTime("");
      setFormLocation("");
      setFormAttendees([]);
      return;
    }

    const meeting = meetingList.find((m) => m.id === meetingId);
    if (meeting) {
      setFormMeetingId(meeting.id);
      setFormTitle(meeting.title);
      setFormAgendaNumber(meeting.agendaNumber || "");
      setFormDateTime(meeting.dateTime ? new Date(meeting.dateTime).toISOString().slice(0, 16) : "");
      setFormLocation(meeting.location);
      const initialAttendees = meeting.attendees.map((att) => ({
        ...att,
        status: att.status || "HADIR"
      }));
      setFormAttendees(initialAttendees);
    }
  };

  // Submit notula Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formTitle || !formDateTime || !formLocation || (!formFile && (!selectedNotula || !selectedNotula.fileUrl))) {
      setFormError("Judul Rapat, Waktu, Lokasi, dan File Hasil Rapat wajib diisi.");
      return;
    }

    if (formAttendees.length === 0) {
      setFormError("Pilih setidaknya 1 peserta rapat yang hadir.");
      return;
    }

    const formData = new FormData();
    if (formMeetingId) formData.append("meetingId", formMeetingId);
    formData.append("title", formTitle);
    if (formAgendaNumber) formData.append("agendaNumber", formAgendaNumber);
    formData.append("dateTime", new Date(formDateTime).toISOString());
    formData.append("location", formLocation);
    formData.append("content", formFile ? formFile.name : (selectedNotula?.content || ""));
    if (formDecisions) formData.append("decisions", formDecisions);
    if (formNotes) formData.append("notes", formNotes);
    formData.append("attendees", JSON.stringify(formAttendees));
    if (formFile) formData.append("file", formFile);

    let success = false;
    if (selectedNotula) {
      success = await updateNotula(selectedNotula.id, formData);
    } else {
      success = await addNotula(formData);
    }

    if (success) {
      setIsFormModalOpen(false);
      clearForm();
      fetchMeetingList(); // Refresh meeting list (linked status changed to SELESAI)
    } else {
      setFormError(notulaError || "Gagal menyimpan notula rapat.");
    }
  };

  // Delete Notula handler
  const handleDelete = async () => {
    if (!selectedNotula) return;
    const success = await deleteNotula(selectedNotula.id);
    if (success) {
      showToast("Notula rapat berhasil dihapus.");
      setIsDeleteModalOpen(false);
      setSelectedNotula(null);
      fetchMeetingList(); // Refresh meeting list statuses
    } else {
      showToast("Gagal menghapus notula rapat.", "error");
    }
  };

  // Share Notula handler
  const handleShareSubmit = async () => {
    if (!shareTargetNotula) return;
    const success = await shareNotula(shareTargetNotula.id, shareSelectedUserIds);
    if (success) {
      showToast("Notula rapat berhasil dibagikan ke pengguna terpilih!");
      setIsShareModalOpen(false);
      setShareTargetNotula(null);
    } else {
      showToast("Gagal membagikan notula.", "error");
    }
  };

  // Filter list
  const filteredNotulas = useMemo(() => {
    return notulaList.filter((n) => {
      const matchesSearch =
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.agendaNumber && n.agendaNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (n.content && n.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
        n.location.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesDate = true;
      if (startDateFilter || endDateFilter) {
        const notulaDate = new Date(n.dateTime);
        if (startDateFilter) {
          const start = new Date(startDateFilter);
          start.setHours(0, 0, 0, 0);
          if (notulaDate < start) matchesDate = false;
        }
        if (endDateFilter) {
          const end = new Date(endDateFilter);
          end.setHours(23, 59, 59, 999);
          if (notulaDate > end) matchesDate = false;
        }
      }

      return matchesSearch && matchesDate;
    });
  }, [notulaList, searchQuery, startDateFilter, endDateFilter]);

  // Pagination filters
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, startDateFilter, endDateFilter]);

  const paginatedNotulas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredNotulas.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredNotulas, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredNotulas.length / itemsPerPage) || 1;
  }, [filteredNotulas, itemsPerPage]);

  // Candidates list for manual attendees
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) =>
      u.fullName.toLowerCase().includes(attendeeSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(attendeeSearchQuery.toLowerCase()) ||
      (u.department?.name && u.department.name.toLowerCase().includes(attendeeSearchQuery.toLowerCase()))
    );
  }, [usersList, attendeeSearchQuery]);

  // Users for sharing dropdown
  const filteredShareUsers = useMemo(() => {
    return usersList.filter((u) => {
      // Exclude creator
      if (shareTargetNotula && u.id === shareTargetNotula.creatorId) return false;
      return (
        u.fullName.toLowerCase().includes(shareSearchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(shareSearchQuery.toLowerCase())
      );
    });
  }, [usersList, shareSearchQuery, shareTargetNotula]);

  // Meetings options that don't have notula yet (for dropdown)
  const availableMeetings = useMemo(() => {
    return meetingList.filter((m) => {
      // Include the current linked meeting if editing
      if (selectedNotula && m.id === selectedNotula.meetingId) return true;
      // Filter out meetings that already have notula
      return !notulaList.some((n) => n.meetingId === m.id);
    });
  }, [meetingList, notulaList, selectedNotula]);

  if (!mounted) return null;

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300">

      {/* ── BREADCRUMBS & HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
            <span>Dashboard</span>
            <ChevronRight size={10} />
            <span>Agenda & Rapat</span>
            <ChevronRight size={10} />
            <span className="text-[#006633] dark:text-[#D4AF37]">Notula Rapat</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight mt-1">
            Notula Rapat
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-1">
            Pencatatan risalah, pembahasan, keputusan hasil rapat DSN-MUI, dan manajemen pembagian akses risalah.
          </p>
        </div>

        <button
          onClick={() => {
            clearForm();
            setIsFormModalOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#006633] hover:bg-[#00552b] text-white font-bold rounded-lg transition-all text-xs uppercase tracking-wider shadow-sm cursor-pointer"
        >
          <Plus size={16} /> Buat Notula Rapat
        </button>
      </div>

      {/* ── MAIN CONTENT CONTAINER (DATATABLE FILTER & TABLE) ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850 p-5 shadow-xs space-y-4">

        {/* Title and Search Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-50 dark:border-slate-850/40">
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-[#006633] dark:bg-[#D4AF37] rounded-full inline-block" />
              Arsip Risalah Rapat
            </h2>
            <p className="text-[10px] text-slate-450 font-bold uppercase mt-1">
              Menampilkan {filteredNotulas.length} risalah rapat terdaftar
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            {/* Search Bar */}
            <div className="relative w-full md:w-64">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari risalah, judul, agenda..."
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
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 pb-2">
          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono">Mulai Tanggal Rapat</label>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-[#006633] focus:ring-1 focus:ring-[#006633]/20 transition-all text-slate-700 dark:text-slate-355 font-semibold cursor-pointer"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono">Sampai Tanggal Rapat</label>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-[#006633] focus:ring-1 focus:ring-[#006633]/20 transition-all text-slate-700 dark:text-slate-355 font-semibold cursor-pointer"
            />
          </div>

          {/* Reset Filters */}
          <div className="flex items-end">
            {(startDateFilter || endDateFilter) ? (
              <button
                onClick={() => {
                  setStartDateFilter("");
                  setEndDateFilter("");
                }}
                className="w-full py-1.5 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-dashed border-rose-200 dark:border-rose-900 rounded-lg transition-all font-bold flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
              >
                <X size={12} /> Reset Filter Tanggal
              </button>
            ) : (
              <div className="w-full py-1.5 text-xs text-slate-450 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center font-bold select-none cursor-not-allowed uppercase tracking-wider bg-slate-50/50 dark:bg-slate-950/50">
                Filter Tanggal: Nihil
              </div>
            )}
          </div>
        </div>

        {/* TABLE DATATABLE */}
        <div className="overflow-x-auto border border-slate-100 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-850 bg-[#006633]/8 dark:bg-[#006633]/15 text-[#006633] dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider select-none font-mono">
                <th className="py-3 px-4 font-bold text-center w-12">No.</th>
                <th className="py-3 px-4 font-bold">No. Agenda</th>
                <th className="py-3 px-4 font-bold">Agenda Rapat</th>
                <th className="py-3 px-4 font-bold">Waktu Rapat</th>
                <th className="py-3 px-4 font-bold">Lokasi</th>
                <th className="py-3 px-4 font-bold">Pembuat</th>
                <th className="py-3 px-4 font-bold">Jumlah Hadir</th>
                <th className="py-3 px-4 font-bold">Status Akses</th>
                <th className="py-3 px-4 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60 dark:divide-slate-850/40 text-xs">
              {notulaLoading && notulaList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#006633]"></div>
                      <p className="text-[10px] font-bold text-slate-455 uppercase tracking-widest font-mono">Loading notula...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedNotulas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center space-y-2">
                    <AlertTriangle className="size-8 text-slate-350 mx-auto" />
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Belum ada risalah rapat terdaftar</h4>
                    <p className="text-[10px] text-slate-455 font-semibold max-w-xs mx-auto">
                      Silakan buat notula rapat baru dengan menekan tombol di kanan atas atau ubah filter pencarian.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedNotulas.map((notula, index) => {
                  const meetingDate = new Date(notula.dateTime);
                  const formattedDate = meetingDate.toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  });
                  const formattedTime = meetingDate.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit"
                  }) + " WIB";

                  // Define user relation/status badge to notula
                  const isCreator = notula.creatorId === currentUser?.id;
                  const shared = Array.isArray(notula.sharedWithIds) ? notula.sharedWithIds : [];
                  const isShared = shared.includes(currentUser?.id || "");
                  const isAttendee = notula.attendees.some((att: any) => att.userId === currentUser?.id);

                  let accessBadge = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800";
                  let accessText = "Peserta";
                  if (isCreator) {
                    accessBadge = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/40";
                    accessText = "Penulis / Pembuat";
                  } else if (isShared) {
                    accessBadge = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-450 dark:border-blue-900/40";
                    accessText = "Dibagikan Akses";
                  } else if (isAttendee) {
                    accessBadge = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/40";
                    accessText = "Peserta Rapat";
                  }

                  const presentCount = notula.attendees.filter((att: any) => ["HADIR", "HADIR_OFFLINE", "HADIR_ONLINE"].includes(att.status)).length;
                  const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;

                  return (
                    <tr
                      key={notula.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-950/25 transition-colors font-medium text-slate-700 dark:text-slate-350"
                    >
                      {/* No. (Row Index) */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-400 dark:text-slate-500 text-center">
                        {rowNumber}
                      </td>

                      {/* No. Agenda */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-500 dark:text-slate-400">
                        {notula.agendaNumber || "-"}
                      </td>

                      {/* Agenda Title */}
                      <td className="py-3 px-4 max-w-[200px]">
                        <div className="font-extrabold text-slate-850 dark:text-white line-clamp-1">
                          {notula.title}
                        </div>
                      </td>

                      {/* Waktu Rapat */}
                      <td className="py-3 px-4">
                        <div className="text-slate-800 dark:text-slate-200 font-bold">{formattedDate}</div>
                        <div className="text-[10px] text-slate-450 dark:text-slate-500 font-bold font-mono mt-0.5">{formattedTime}</div>
                      </td>

                      {/* Lokasi */}
                      <td className="py-3 px-4 max-w-[150px] truncate">
                        <div className="flex items-center gap-1">
                          <MapPin size={11} className="text-slate-450 shrink-0" />
                          <span className="truncate">{notula.location}</span>
                        </div>
                      </td>

                      {/* Pembuat */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{notula.creatorName}</div>
                        <div className="text-[9px] font-bold font-mono text-slate-450 dark:text-slate-550">Pembuat</div>
                      </td>

                      {/* Jumlah Hadir */}
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-slate-800 dark:text-white">{presentCount}</span>
                        <span className="text-slate-450"> / {notula.attendees.length} orang</span>
                      </td>

                      {/* Status Akses */}
                      <td className="py-3 px-4">
                        <span className={`inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${accessBadge}`}>
                          {accessText}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedNotula(notula);
                              setIsDetailDrawerOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-all cursor-pointer font-bold"
                            title="Lihat Detail Notula"
                          >
                            <Eye size={13} />
                          </button>

                          {/* Share button (only for creator or attendees) */}
                          {(isCreator || isAttendee) && (
                            <button
                              onClick={() => {
                                setShareTargetNotula(notula);
                                setShareSelectedUserIds(notula.sharedWithIds || []);
                                setShareSearchQuery("");
                                setIsShareModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-[#D4AF37] bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 dark:bg-[#D4AF37]/20 dark:hover:bg-[#D4AF37]/30 transition-all cursor-pointer font-bold"
                              title="Bagikan / Share Notula"
                            >
                              <Share2 size={13} />
                            </button>
                          )}

                          {/* Edit button (creator only) */}
                          {isCreator && (
                            <button
                              onClick={() => {
                                populateForm(notula);
                                setIsFormModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-[#006633] bg-[#006633]/10 hover:bg-[#006633]/20 dark:bg-[#006633]/20 dark:hover:bg-[#006633]/30 transition-all cursor-pointer font-bold"
                              title="Edit Notula"
                            >
                              <Edit2 size={13} />
                            </button>
                          )}

                          {/* Delete button (creator only) */}
                          {isCreator && (
                            <button
                              onClick={() => {
                                setSelectedNotula(notula);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-450 dark:hover:bg-rose-900/30 transition-all cursor-pointer font-bold"
                              title="Hapus Notula"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        {filteredNotulas.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 text-xs select-none">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-semibold">
              <span>Tampilkan</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded outline-none font-bold text-slate-700 dark:text-slate-300 focus:border-[#006633] focus:ring-1 focus:ring-[#006633]/10"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>data per halaman</span>
            </div>

            <div className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase font-mono">
              Menampilkan {Math.min(filteredNotulas.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredNotulas.length, currentPage * itemsPerPage)} dari {filteredNotulas.length} risalah
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2.5 py-1 border border-slate-200 dark:border-slate-800 rounded text-[10px] font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Pertama
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 border border-slate-200 dark:border-slate-800 rounded text-[10px] font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Sebelumnya
              </button>
              <span className="px-3 py-1 font-extrabold text-slate-800 bg-[#E8F5EE] border border-[#006633]/15 rounded text-[10px] dark:text-emerald-400 dark:bg-[#006633]/20">
                Hal. {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 border border-slate-200 dark:border-slate-800 rounded text-[10px] font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Berikutnya
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 border border-slate-200 dark:border-slate-800 rounded text-[10px] font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Terakhir
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODALS SYSTEMS ── */}

      {/* 1. CREATE / EDIT NOTULA MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-850">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                <FileText className="size-4 text-[#006633] dark:text-[#D4AF37]" />
                {selectedNotula ? "Edit Notula Rapat" : "Buat Notula Rapat Baru"}
              </h3>
              <button
                onClick={() => {
                  setIsFormModalOpen(false);
                  clearForm();
                }}
                className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 font-bold"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-150 rounded-lg flex items-center gap-2.5 text-xs text-rose-700 font-semibold dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Option to link to scheduled meeting */}
              {!selectedNotula && (
                <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-xl dark:bg-slate-950/40 dark:border-slate-850/60 space-y-3.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-white uppercase font-mono">
                    <Info size={14} className="text-[#006633] dark:text-[#D4AF37]" />
                    <span>Hubungkan dengan Agenda Rapat Terdaftar</span>
                  </div>
                  <div>
                    <select
                      value={formMeetingId}
                      onChange={(e) => handleSelectMeetingDropdown(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-[#006633] focus:ring-1 focus:ring-[#006633]/20 transition-all font-semibold"
                    >
                      <option value="">-- Buat Notula Bebas (Tanpa Agenda) --</option>
                      {availableMeetings.map((m) => (
                        <option key={m.id} value={m.id}>
                          [{m.agendaNumber || "Tanpa No"}] {m.title} ({new Date(m.dateTime).toLocaleDateString("id-ID")})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 leading-normal">
                      Menghubungkan notula dengan agenda rapat akan otomatis mengisi judul, waktu, lokasi, dan daftar peserta.
                    </p>
                  </div>
                </div>
              )}

              {/* Main Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  {/* Title */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono">Judul Rapat</label>
                    <input
                      type="text"
                      placeholder="Masukkan judul rapat..."
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      disabled={!!formMeetingId}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-[#006633] focus:ring-1 focus:ring-[#006633]/20 transition-all font-semibold disabled:bg-slate-100 disabled:text-slate-500 dark:disabled:bg-slate-950/40 dark:disabled:text-slate-400"
                    />
                  </div>

                  {/* Agenda Number */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono">Nomor Agenda (Opsional)</label>
                    <input
                      type="text"
                      placeholder="No. Agenda..."
                      value={formAgendaNumber}
                      onChange={(e) => setFormAgendaNumber(e.target.value)}
                      disabled={!!formMeetingId}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-[#006633] focus:ring-1 focus:ring-[#006633]/20 transition-all font-semibold disabled:bg-slate-100 disabled:text-slate-500 dark:disabled:bg-slate-950/40 dark:disabled:text-slate-400"
                    />
                  </div>

                  {/* Date & Time */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono">Tanggal & Waktu</label>
                    <input
                      type="datetime-local"
                      value={formDateTime}
                      onChange={(e) => setFormDateTime(e.target.value)}
                      disabled={!!formMeetingId}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-[#006633] focus:ring-1 focus:ring-[#006633]/20 transition-all font-semibold disabled:bg-slate-100 disabled:text-slate-500 dark:disabled:bg-slate-950/40 dark:disabled:text-slate-400 cursor-pointer"
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono">Lokasi Rapat</label>
                    <input
                      type="text"
                      placeholder="Gedung DSN-MUI, Zoom, dll..."
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      disabled={!!formMeetingId}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-[#006633] focus:ring-1 focus:ring-[#006633]/20 transition-all font-semibold disabled:bg-slate-100 disabled:text-slate-500 dark:disabled:bg-slate-950/40 dark:disabled:text-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-4 flex flex-col h-full">
                  {/* content */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono">
                      File Hasil Rapat / Risalah (Word/PDF/dll) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative group">
                      <input
                        type="file"
                        onChange={(e) => setFormFile(e.target.files?.[0] || null)}
                        accept=".doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        required={!selectedNotula || !selectedNotula.fileUrl}
                      />
                      <div className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-1.5 group-hover:border-[#006633]/50 group-hover:bg-[#006633]/5 transition-all cursor-pointer">
                        <UploadCloud size={20} className="text-slate-400 group-hover:text-[#006633] transition-colors" />
                        <span className="text-[11px] font-bold text-slate-500 group-hover:text-[#006633] truncate max-w-[280px]">
                          {formFile ? formFile.name : (selectedNotula?.fileName ? `File Aktif: ${selectedNotula.fileName}` : "Pilih atau seret file Word/PDF risalah rapat...")}
                        </span>
                      </div>
                    </div>
                    {selectedNotula?.fileUrl && !formFile && (
                      <p className="text-[9px] text-slate-400 italic font-medium ml-1">
                        Biarkan kosong jika tidak ingin mengganti file risalah rapat yang sudah ada.
                      </p>
                    )}
                  </div>

                  {/* Attendance Management section */}
                  <div className="border-t border-slate-100 dark:border-slate-850 pt-3.5 space-y-3.5 flex-1 flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1 font-mono">
                          <Users className="size-3.5 text-[#006633] dark:text-[#D4AF37]" />
                          Peserta Rapat ({formAttendees.length})
                        </h4>
                      </div>

                      {/* Manual attendee search input (Only visible when manual entry mode) */}
                      {!formMeetingId && (
                        <div className="relative w-full sm:w-44">
                          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-450" />
                          <input
                            type="text"
                            placeholder="Cari internal..."
                            value={attendeeSearchQuery}
                            onChange={(e) => setAttendeeSearchQuery(e.target.value)}
                            className="w-full pl-7 pr-2 py-0.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-[10px] outline-none font-medium"
                          />
                        </div>
                      )}
                    </div>

                    {/* Bulk Actions Automation */}
                    {formAttendees.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-850 rounded-xl w-full">
                        <span className="text-[8px] font-extrabold text-slate-550 uppercase tracking-wider ml-1">
                          ⚡ Auto:
                        </span>
                        <div className="flex items-center gap-1 ml-auto">
                          <button
                            type="button"
                            onClick={() => handleBulkUpdateStatus("HADIR_OFFLINE")}
                            className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900/50 text-[8px] font-extrabold uppercase rounded-lg hover:bg-emerald-100/50 transition-colors cursor-pointer"
                          >
                            Offline 🏢
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBulkUpdateStatus("HADIR_ONLINE")}
                            className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-250 dark:border-blue-900/50 text-[8px] font-extrabold uppercase rounded-lg hover:bg-blue-100/50 transition-colors cursor-pointer"
                          >
                            Online 💻
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBulkUpdateStatus("TIDAK_HADIR")}
                            className="px-1.5 py-0.5 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-455 border border-rose-250 dark:border-rose-900/50 text-[8px] font-extrabold uppercase rounded-lg hover:bg-rose-100/50 transition-colors cursor-pointer"
                          >
                            Alpa ❌
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Grid for selecting attendees (Manual Mode) */}
                    {!formMeetingId && attendeeSearchQuery && (
                      <div className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg max-h-24 overflow-y-auto grid grid-cols-1 gap-1 bg-slate-50 dark:bg-slate-950/40">
                        {filteredUsers.length === 0 ? (
                          <p className="text-[9px] text-slate-400 font-bold text-center py-2">User tidak ditemukan.</p>
                        ) : (
                          filteredUsers.map((u) => {
                            const isChecked = formAttendees.some((att) => att.userId === u.id);
                            return (
                              <div
                                key={u.id}
                                onClick={() => handleToggleManualAttendee(u)}
                                className={`flex items-center gap-2 p-1.5 rounded-lg border text-[10px] cursor-pointer select-none transition-all ${isChecked
                                    ? "bg-emerald-50/50 border-emerald-500 text-[#006633] dark:bg-[#006633]/10 dark:text-emerald-400 dark:border-emerald-700"
                                    : "bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-850"
                                  }`}
                              >
                                <div className="truncate flex-1 min-w-0">
                                  <p className="font-extrabold truncate leading-tight">{u.fullName}</p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* Attendees list table */}
                    {formAttendees.length === 0 ? (
                      <div className="py-6 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        <p className="text-[10px] font-bold uppercase tracking-wide">Belum ada peserta terpilih</p>
                      </div>
                    ) : (
                      <div className="border border-slate-100 dark:border-slate-850 rounded-lg overflow-hidden max-h-[220px] overflow-y-auto">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="bg-[#006633]/8 dark:bg-[#006633]/15 text-[#006633] dark:text-emerald-400 text-[9px] uppercase font-bold tracking-wider font-mono border-b border-slate-100 dark:border-slate-850">
                              <th className="py-2 px-2.5">Nama</th>
                              <th className="py-2 px-2.5 text-right">Kehadiran</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-medium">
                            {formAttendees.map((att) => (
                              <tr key={att.email} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10">
                                <td className="py-1.5 px-2.5">
                                  <div className="font-extrabold text-slate-850 dark:text-white leading-tight">{att.name}</div>
                                  <div className="text-[9px] text-slate-400 truncate max-w-[140px] mt-0.5">{att.department} • {att.jabatan}</div>
                                </td>
                                <td className="py-1.5 px-2.5 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    {([
                                      { val: "HADIR_OFFLINE", label: "Off 🏢", active: "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-700" },
                                      { val: "HADIR_ONLINE", label: "On 💻", active: "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-700" },
                                      { val: "TIDAK_HADIR", label: "Alpa ❌", active: "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/20 dark:text-rose-455 dark:border-rose-700" },
                                      { val: "IZIN", label: "Izin ✉️", active: "bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-700" }
                                    ] as { val: Attendee["status"], label: string, active: string }[]).map((opt) => {
                                      const isSelected = att.status === opt.val || (opt.val === "HADIR_OFFLINE" && att.status === "HADIR");
                                      const btnClass = isSelected 
                                        ? opt.active 
                                        : "border-slate-200 text-slate-650 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400";
                                      return (
                                        <button
                                          key={opt.val}
                                          type="button"
                                          onClick={() => handleUpdateAttendeeStatus(att.email, opt.val)}
                                          className={`px-1.5 py-0.5 border text-[8.5px] font-extrabold uppercase rounded-md tracking-wider transition-all cursor-pointer ${btnClass}`}
                                        >
                                          {opt.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="flex justify-between items-center p-5 border-t border-slate-100 dark:border-slate-850">
              <button
                type="button"
                onClick={() => {
                  setIsFormModalOpen(false);
                  clearForm();
                }}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 rounded-lg transition-colors font-bold uppercase tracking-wider text-[10px] cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 bg-[#006633] hover:bg-[#00552b] text-white rounded-lg transition-colors font-bold uppercase tracking-wider text-[10px] cursor-pointer"
              >
                {selectedNotula ? "Simpan Perubahan" : "Simpan Notula Rapat"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. DETAIL DRAWER VIEW */}
      {isDetailDrawerOpen && selectedNotula && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs select-none animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-850 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-350">

            {/* Drawer Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-850">
              <div>
                <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#006633] dark:text-[#D4AF37] font-mono">
                  Risalah Hasil Rapat
                </h3>
                <p className="text-[10px] text-slate-450 dark:text-slate-500 font-mono mt-0.5">ID: {selectedNotula.id}</p>
              </div>
              <button
                onClick={() => {
                  setIsDetailDrawerOpen(false);
                  setSelectedNotula(null);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 font-bold"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Meeting Info */}
              <div className="space-y-4 p-4.5 bg-gradient-to-br from-[#E8F5EE]/60 to-[#F7F5EC]/60 border border-[#006633]/5 dark:from-slate-950/40 dark:to-slate-950/20 dark:border-slate-850 rounded-xl relative overflow-hidden">
                <div className="absolute -top-3 -right-3 w-16 h-16 bg-[#D4AF37]/5 rounded-full blur-md pointer-events-none" />

                <div>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-[#006633]/20 text-[#006633] dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 uppercase tracking-widest font-mono">
                    No. Agenda: {selectedNotula.agendaNumber || "-"}
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-850 dark:text-white mt-2 leading-snug">
                    {selectedNotula.title}
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-slate-450" />
                    <span>
                      {new Date(selectedNotula.dateTime).toLocaleDateString("id-ID", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })} - {new Date(selectedNotula.dateTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-slate-450" />
                    <span className="truncate">{selectedNotula.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users size={12} className="text-slate-450" />
                    <span>Daftar Hadir: {selectedNotula.attendees.filter((a: any) => ["HADIR", "HADIR_OFFLINE", "HADIR_ONLINE"].includes(a.status)).length} / {selectedNotula.attendees.length} orang</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserCheck size={12} className="text-slate-450" />
                    <span>Pembuat: {selectedNotula.creatorName}</span>
                  </div>
                </div>
              </div>

              {/* Discussion Content */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider font-mono">
                  <FileText size={12} className="text-[#006633] dark:text-[#D4AF37]" />
                  <span>Risalah / Dokumen Hasil Rapat</span>
                </div>
                {selectedNotula.fileUrl ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850/60 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 text-[#006633] rounded-lg flex items-center justify-center font-bold">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-805 dark:text-white truncate max-w-[280px]">
                          {selectedNotula.fileName || "dokumen-hasil-rapat"}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                          Hasil Rapat Terunggah
                        </p>
                      </div>
                    </div>
                    <a
                      href={`${api.defaults.baseURL?.replace('/api', '')}/${selectedNotula.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-[#006633] hover:bg-[#00552b] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1 transition-all"
                    >
                      <Download size={12} /> Unduh
                    </a>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850/60 rounded-xl text-xs text-slate-700 dark:text-slate-350 font-medium whitespace-pre-line leading-relaxed min-h-[120px]">
                    {selectedNotula.content}
                  </div>
                )}
              </div>

              {/* Decisions (Key Decisions) */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider font-mono">
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  <span>Keputusan Utama</span>
                </div>
                <div className="p-4 bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-100/50 dark:border-emerald-950/20 rounded-xl text-xs text-slate-700 dark:text-slate-350 font-medium whitespace-pre-line leading-relaxed">
                  {selectedNotula.decisions || "- Tidak ada keputusan tertulis -"}
                </div>
              </div>

              {/* Notes */}
              {selectedNotula.notes && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider font-mono">
                    <Info size={12} className="text-[#D4AF37]" />
                    <span>Catatan Tambahan / Tindak Lanjut</span>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850/60 rounded-xl text-xs text-slate-650 dark:text-slate-400 font-medium whitespace-pre-line leading-relaxed">
                    {selectedNotula.notes}
                  </div>
                </div>
              )}

              {/* Attendees breakdown */}
              {(() => {
                const offlineCount = selectedNotula.attendees.filter((a: any) => a.status === "HADIR_OFFLINE").length;
                const onlineCount = selectedNotula.attendees.filter((a: any) => a.status === "HADIR_ONLINE").length;
                const legacyCount = selectedNotula.attendees.filter((a: any) => a.status === "HADIR").length;
                const totalPresent = offlineCount + onlineCount + legacyCount;
                const absentCount = selectedNotula.attendees.filter((a: any) => a.status === "TIDAK_HADIR").length;
                const izinCount = selectedNotula.attendees.filter((a: any) => a.status === "IZIN").length;
                
                return (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider font-mono">
                        Rekap Kehadiran Peserta
                      </label>
                      <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-extrabold font-mono">
                        <div className="p-2 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
                          <div className="text-emerald-700 dark:text-emerald-455">{offlineCount} Orang</div>
                          <div className="text-[8px] text-slate-400 uppercase mt-0.5">Offline 🏢</div>
                        </div>
                        <div className="p-2 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                          <div className="text-blue-700 dark:text-blue-455">{onlineCount} Orang</div>
                          <div className="text-[8px] text-slate-400 uppercase mt-0.5">Online 💻</div>
                        </div>
                        <div className="p-2 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 rounded-xl">
                          <div className="text-rose-700 dark:text-rose-455">{absentCount} Orang</div>
                          <div className="text-[8px] text-slate-400 uppercase mt-0.5">Tidak Hadir ❌</div>
                        </div>
                        <div className="p-2 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-xl">
                          <div className="text-amber-700 dark:text-amber-455">{izinCount} Orang</div>
                          <div className="text-[8px] text-slate-400 uppercase mt-0.5">Izin ✉️</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider font-mono">
                        <span>Daftar Nama & Kehadiran</span>
                        <span>Total: {selectedNotula.attendees.length} orang</span>
                      </div>

                      <div className="border border-slate-100 dark:border-slate-850 rounded-xl divide-y divide-slate-100 dark:divide-slate-850 overflow-hidden text-xs">
                        {selectedNotula.attendees.map((att: any) => {
                          let badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
                          let labelText = att.status;
                          
                          if (att.status === "HADIR_OFFLINE") {
                            badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/30 dark:text-emerald-450 dark:border-emerald-900/30";
                            labelText = "Offline 🏢";
                          } else if (att.status === "HADIR_ONLINE") {
                            badgeColor = "bg-blue-50 text-blue-700 border-blue-250 dark:bg-blue-950/30 dark:text-blue-450 dark:border-blue-900/30";
                            labelText = "Online 💻";
                          } else if (att.status === "HADIR") {
                            badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/30 dark:text-emerald-450 dark:border-emerald-900/30";
                            labelText = "Hadir";
                          } else if (att.status === "IZIN") {
                            badgeColor = "bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/30 dark:text-amber-455 dark:border-amber-900/30";
                            labelText = "Izin ✉️";
                          } else if (att.status === "TIDAK_HADIR") {
                            badgeColor = "bg-rose-50 text-rose-700 border-rose-250 dark:bg-rose-950/30 dark:text-rose-450 dark:border-rose-900/30";
                            labelText = "Tidak Hadir ❌";
                          }

                          return (
                            <div key={att.email} className="p-3 flex justify-between items-center hover:bg-slate-50/50 dark:hover:bg-slate-950/10">
                              <div>
                                <div className="font-extrabold text-slate-800 dark:text-white">{att.name}</div>
                                <div className="text-[9px] text-[#006633] dark:text-[#D4AF37] font-bold uppercase font-mono mt-0.5">{att.department} • {att.jabatan}</div>
                              </div>
                              <span className={`text-[8px] font-extrabold tracking-wider px-2 py-0.5 rounded-lg border uppercase ${badgeColor}`}>
                                {labelText}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Drawer Footer */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-850 flex justify-end">
              <button
                onClick={() => {
                  setIsDetailDrawerOpen(false);
                  setSelectedNotula(null);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-lg transition-colors font-bold uppercase tracking-wider text-[10px] cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SHARE NOTULA MODAL */}
      {isShareModalOpen && shareTargetNotula && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-850">
              <div>
                <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#006633] dark:text-[#D4AF37] font-mono">
                  Bagikan Risalah Rapat
                </h3>
                <h4 className="text-xs font-bold text-slate-850 dark:text-white mt-1 line-clamp-1">
                  {shareTargetNotula.title}
                </h4>
              </div>
              <button
                onClick={() => {
                  setIsShareModalOpen(false);
                  setShareTargetNotula(null);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 font-bold"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">

              <div className="p-3 bg-blue-50 border border-blue-150 rounded-lg dark:bg-blue-950/20 dark:border-blue-900/40 text-[10px] text-blue-700 dark:text-blue-400 font-bold leading-normal uppercase font-mono flex items-center gap-2">
                <Info size={14} className="shrink-0" />
                <span>Risalah rapat ini hanya terlihat oleh pembuat, peserta rapat, dan pengguna yang dibagikan akses secara manual di bawah ini.</span>
              </div>

              {/* Search User for Sharing */}
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450" />
                <input
                  type="text"
                  placeholder="Cari user berdasarkan nama atau email..."
                  value={shareSearchQuery}
                  onChange={(e) => setShareSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-[#006633] font-medium"
                />
              </div>

              {/* Users list checkboxes */}
              <div className="border border-slate-100 dark:border-slate-850 rounded-xl max-h-52 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-950/20 grid grid-cols-1 gap-1.5">
                {filteredShareUsers.length === 0 ? (
                  <p className="text-[10px] text-slate-450 font-bold text-center py-6 uppercase font-mono">User tidak ditemukan.</p>
                ) : (
                  filteredShareUsers.map((u) => {
                    const isChecked = shareSelectedUserIds.includes(u.id);
                    const isAlreadyAttendee = shareTargetNotula.attendees.some((att: any) => att.userId === u.id);

                    if (isAlreadyAttendee) {
                      return (
                        <div
                          key={u.id}
                          className="flex items-center justify-between p-2 bg-slate-200/50 dark:bg-slate-850/50 rounded-lg border border-transparent text-xs text-slate-450 font-bold select-none cursor-not-allowed"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <div className="w-5 h-5 rounded bg-slate-350 text-white text-[9px] flex items-center justify-center font-bold">
                              {u.fullName.charAt(0)}
                            </div>
                            <span className="truncate">{u.fullName} ({u.email})</span>
                          </div>
                          <span className="text-[8px] font-extrabold uppercase font-mono bg-slate-200 text-slate-500 border border-slate-300 px-1 py-0.5 rounded shrink-0">Peserta Rapat</span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={u.id}
                        onClick={() => {
                          if (isChecked) {
                            setShareSelectedUserIds((prev) => prev.filter((id) => id !== u.id));
                          } else {
                            setShareSelectedUserIds((prev) => [...prev, u.id]);
                          }
                        }}
                        className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer select-none transition-all ${isChecked
                            ? "bg-emerald-50/50 border-emerald-500 text-[#006633] dark:bg-[#006633]/10 dark:text-emerald-400 dark:border-emerald-700"
                            : "bg-white border-slate-100 hover:border-slate-200 dark:bg-slate-900 dark:border-slate-850 text-slate-700 dark:text-slate-300"
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="rounded border-slate-300 text-[#006633] focus:ring-[#006633] shrink-0 pointer-events-none"
                        />
                        <div className="w-5 h-5 rounded bg-[#006633] text-white text-[9px] flex items-center justify-center font-bold shrink-0">
                          {u.fullName.charAt(0)}
                        </div>
                        <div className="truncate flex-1 min-w-0">
                          <p className="font-extrabold truncate leading-tight">{u.fullName}</p>
                          <p className="text-[9px] text-slate-450 dark:text-slate-500 truncate mt-0.5">{u.email}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Summary of selections */}
              <div className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase font-mono">
                Dibagikan dengan: {shareSelectedUserIds.length} pengguna tambahan
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-850 flex justify-between items-center">
              <button
                onClick={() => {
                  setIsShareModalOpen(false);
                  setShareTargetNotula(null);
                }}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 rounded-lg transition-colors font-bold uppercase tracking-wider text-[10px] cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleShareSubmit}
                className="px-4 py-2 bg-[#006633] hover:bg-[#00552b] text-white rounded-lg transition-colors font-bold uppercase tracking-wider text-[10px] cursor-pointer"
              >
                Simpan & Bagikan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && selectedNotula && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg flex flex-col p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="size-8" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider font-mono">Konfirmasi Hapus Notula</h3>
            </div>
            <p className="text-slate-650 dark:text-slate-450 text-xs font-semibold mt-3.5 leading-relaxed">
              Apakah Anda yakin ingin menghapus risalah rapat untuk agenda <strong className="text-slate-850 dark:text-white font-extrabold">"{selectedNotula.title}"</strong>? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-slate-50 dark:border-slate-850/40">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedNotula(null);
                }}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 rounded-lg transition-colors font-bold uppercase tracking-wider text-[10px] cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors font-bold uppercase tracking-wider text-[10px] cursor-pointer"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

    </div>
  );
}

interface ToastProps {
  msg: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}

function Toast({ msg, type, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  let icon = <CheckCircle2 size={17} />;
  let colorClasses = "bg-emerald-600 text-white";
  if (type === "error") {
    icon = <AlertTriangle size={17} />;
    colorClasses = "bg-red-650 text-white";
  } else if (type === "info") {
    icon = <Info size={17} />;
    colorClasses = "bg-[#006633] border border-[#D4AF37] text-white dark:bg-slate-900";
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-xs font-bold uppercase tracking-wide transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${colorClasses}`}
    >
      {icon}
      <span>{msg}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 transition-opacity">
        <X size={15} />
      </button>
    </div>
  );
}

export default function NotulaPage() {
  return (
    <Suspense fallback={
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#006633]"></div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Loading halaman...</p>
      </div>
    }>
      <NotulaPageContent />
    </Suspense>
  );
}
