"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Mail,
  CheckCircle2,
  ListFilter,
  FileText,
  User,
  Info,
  Send,
  Building,
  UserCheck,
  Briefcase
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMeetingStore, Meeting, Attendee, MinimalUser } from "@/stores/meeting.store";
import api from "@/lib/api";

// Helper to format meeting time range
const formatMeetingTimeRange = (meeting: Meeting, isShortMonth = false) => {
  if (!meeting.dateTime) return { date: "-", time: "-", full: "-" };
  
  const meetingDate = new Date(meeting.dateTime);
  const formattedDate = meetingDate.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: isShortMonth ? "short" : "long",
    year: "numeric"
  });

  const startTimeStr = meetingDate.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit"
  }) + " WIB";

  if (!meeting.endDateTime) {
    return {
      date: formattedDate,
      time: `${startTimeStr} - Selesai`,
      full: `${formattedDate}, ${startTimeStr} - Selesai`
    };
  }

  const endDate = new Date(meeting.endDateTime);
  const endTimeStr = endDate.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit"
  }) + " WIB";

  const isSameDay = meetingDate.toDateString() === endDate.toDateString();

  if (isSameDay) {
    return {
      date: formattedDate,
      time: `${startTimeStr} - ${endTimeStr}`,
      full: `${formattedDate}, ${startTimeStr} - ${endTimeStr}`
    };
  } else {
    const formattedEndDate = endDate.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: isShortMonth ? "short" : "long",
      year: "numeric"
    });
    return {
      date: `${formattedDate}`,
      time: `${startTimeStr} s.d. ${formattedEndDate}, ${endTimeStr}`,
      full: `${formattedDate}, ${startTimeStr} s.d. ${formattedEndDate}, ${endTimeStr}`
    };
  }
};

export default function MeetingAgendaPage() {
  const router = useRouter();
  const {
    meetingList,
    usersList,
    departmentsList,
    fetchMeetingList,
    fetchUsersList,
    fetchDepartmentsList,
    addMeeting,
    updateMeeting,
    deleteMeeting,
    sendInvitations,
    loading,
    error
  } = useMeetingStore();

  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL"); // ALL, DRAFT, AKTIF, SELESAI, ARSIP

  // Powerful filtering states
  const [targetFilter, setTargetFilter] = useState<string>("ALL_TARGETS");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");
  const [invitationFilter, setInvitationFilter] = useState<string>("ALL"); // ALL, SENT, DRAFT

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form fields
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formAgendaNumber, setFormAgendaNumber] = useState("");
  const [formDateTime, setFormDateTime] = useState("");
  const [formEndDateTime, setFormEndDateTime] = useState("");
  const [untilFinished, setUntilFinished] = useState(false);
  const [formLocation, setFormLocation] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTargetType, setFormTargetType] = useState<Meeting['targetType']>("CROSS_INTERNAL");
  const [formDepartmentId, setFormDepartmentId] = useState("");
  const [formCustomAttendeeIds, setFormCustomAttendeeIds] = useState<string[]>([]);
  const [formExternalEmailsText, setFormExternalEmailsText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [candidateSearchQuery, setCandidateSearchQuery] = useState("");

  // Discussed Surat Masuk states
  const [incomingDocs, setIncomingDocs] = useState<any[]>([]);
  const [discussIncomingDocs, setDiscussIncomingDocs] = useState(false);
  const [selectedDiscussedDocIds, setSelectedDiscussedDocIds] = useState<string[]>([]);
  const [docSearchQuery, setDocSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    setMounted(true);
    fetchMeetingList();
    fetchUsersList();
  }, [fetchMeetingList, fetchUsersList]);

  // Load incoming documents for search
  useEffect(() => {
    const fetchIncomingDocs = async () => {
      try {
        const res = await api.get("/documents", { params: { documentType: "INCOMING" } });
        setIncomingDocs(res.data.data || []);
      } catch (err: any) {
        console.error("Gagal mengambil data surat masuk:", err.message);
      }
    };
    if (mounted) {
      fetchIncomingDocs();
    }
  }, [mounted]);

  // Load departments once users are loaded
  useEffect(() => {
    if (usersList.length > 0) {
      fetchDepartmentsList();
    }
  }, [usersList, fetchDepartmentsList]);

  const getCandidatesFor = (type: Meeting['targetType'], deptId: string) => {
    if (type === "ALL") {
      return usersList;
    }
    if (type === "EXECUTIVE") {
      return usersList.filter((u) => u.department?.name === "Pimpinan Harian");
    }
    if (type === "ALL_BOARD") {
      return usersList.filter((u) =>
        [
          "Pimpinan Harian",
          "Bidang Fatwa",
          "Bidang Layanan, Literasi, Relasi Industri & Regulasi",
          "Anggota Pleno"
        ].includes(u.department?.name || "")
      );
    }
    if (type === "SECRETARIAT") {
      return usersList.filter((u) => u.department?.name === "Kesekretariatan");
    }
    if (type === "FINANCE") {
      return usersList.filter((u) => u.department?.name === "Keuangan");
    }
    if (type === "DEPARTMENT") {
      return deptId ? usersList.filter((u) => u.department?.id === deptId) : [];
    }
    if (type === "CROSS_INTERNAL" || type === "CROSS_AGENCY") {
      return usersList;
    }
    return [];
  };

  // Reset form helper
  const clearForm = () => {
    setSelectedMeeting(null);
    setFormTitle("");
    setFormAgendaNumber("");
    setFormDateTime("");
    setFormEndDateTime("");
    setUntilFinished(false);
    setFormLocation("");
    setFormDescription("");
    setFormTargetType("CROSS_INTERNAL");
    setFormDepartmentId("");
    // Pre-select no internal users by default
    setFormCustomAttendeeIds([]);
    setFormExternalEmailsText("");
    setCandidateSearchQuery("");
    setDiscussIncomingDocs(false);
    setSelectedDiscussedDocIds([]);
    setDocSearchQuery("");
    setIsDropdownOpen(false);
    setFormError(null);
  };

  // Populate form fields for editing
  const populateForm = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setFormTitle(meeting.title);
    setFormAgendaNumber(meeting.agendaNumber || "");
    setFormDateTime(meeting.dateTime ? new Date(meeting.dateTime).toISOString().slice(0, 16) : "");
    if (meeting.endDateTime) {
      setFormEndDateTime(new Date(meeting.endDateTime).toISOString().slice(0, 16));
      setUntilFinished(false);
    } else {
      setFormEndDateTime("");
      setUntilFinished(meeting.dateTime ? true : false);
    }
    setFormLocation(meeting.location);
    setFormDescription(meeting.description || "");
    setFormTargetType(meeting.targetType);
    setFormDepartmentId(meeting.departmentId || "");
    
    // For CROSS_INTERNAL and CROSS_AGENCY, map initial user IDs
    const userIds = meeting.attendees
      .filter((a) => !a.isExternal && a.userId)
      .map((a) => a.userId as string);
    setFormCustomAttendeeIds(userIds);

    const externalEmails = meeting.attendees
      .filter((a) => a.isExternal)
      .map((a) => a.email);
    setFormExternalEmailsText(externalEmails.join(", "));

    if (meeting.discussedDocs && meeting.discussedDocs.length > 0) {
      setDiscussIncomingDocs(true);
      setSelectedDiscussedDocIds(meeting.discussedDocs.map((doc: any) => doc.id));
    } else {
      setDiscussIncomingDocs(false);
      setSelectedDiscussedDocIds([]);
    }
    setDocSearchQuery("");
    setIsDropdownOpen(false);
    setFormError(null);
  };

  // Compute metrics
  const metrics = useMemo(() => {
    const counts = {
      TOTAL: meetingList.length,
      DRAFT: 0,
      AKTIF: 0,
      SELESAI: 0,
      ARSIP: 0
    };
    meetingList.forEach((m) => {
      const status = m.status.toUpperCase();
      if (status in counts) {
        // @ts-ignore
        counts[status] += 1;
      }
    });
    return counts;
  }, [meetingList]);

  // Filter list with powerful filtering logic
  const filteredMeetings = useMemo(() => {
    return meetingList.filter((m) => {
      const matchesSearch =
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.agendaNumber && m.agendaNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        m.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || m.status.toUpperCase() === statusFilter;
      const matchesTarget = targetFilter === "ALL_TARGETS" || m.targetType.toUpperCase() === targetFilter;
      const matchesInvitation =
        invitationFilter === "ALL" ||
        (invitationFilter === "SENT" && m.invitationSent) ||
        (invitationFilter === "DRAFT" && !m.invitationSent);

      let matchesDate = true;
      if (startDateFilter || endDateFilter) {
        const meetingDate = new Date(m.dateTime);
        if (startDateFilter) {
          const start = new Date(startDateFilter);
          start.setHours(0, 0, 0, 0);
          if (meetingDate < start) matchesDate = false;
        }
        if (endDateFilter) {
          const end = new Date(endDateFilter);
          end.setHours(23, 59, 59, 999);
          if (meetingDate > end) matchesDate = false;
        }
      }

      return matchesSearch && matchesStatus && matchesTarget && matchesInvitation && matchesDate;
    });
  }, [meetingList, searchQuery, statusFilter, targetFilter, invitationFilter, startDateFilter, endDateFilter]);

  // Reset page to 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, targetFilter, invitationFilter, startDateFilter, endDateFilter]);

  const paginatedMeetings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMeetings.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMeetings, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredMeetings.length / itemsPerPage) || 1;
  }, [filteredMeetings, itemsPerPage]);

  // Candidates computed list
  const candidates = useMemo(() => {
    if (!mounted) return [];
    return usersList;
  }, [usersList, mounted]);

  // Candidates filtered by search input inside the modal
  const filteredCandidates = useMemo(() => {
    if (!mounted) return [];
    if (!candidateSearchQuery.trim()) {
      // Show selected users + first 10 unselected users
      const selected = usersList.filter((u) => formCustomAttendeeIds.includes(u.id));
      const unselected = usersList.filter((u) => !formCustomAttendeeIds.includes(u.id)).slice(0, 10);
      return [...selected, ...unselected];
    }
    const query = candidateSearchQuery.toLowerCase();
    return usersList.filter((u) =>
      u.fullName.toLowerCase().includes(query) ||
      (u.jabatan?.name && u.jabatan.name.toLowerCase().includes(query)) ||
      (u.department?.name && u.department.name.toLowerCase().includes(query))
    );
  }, [usersList, formCustomAttendeeIds, candidateSearchQuery, mounted]);

  // Select all checkbox state
  const isAllSelected = useMemo(() => {
    if (filteredCandidates.length === 0) return false;
    return filteredCandidates.every((c) => formCustomAttendeeIds.includes(c.id));
  }, [filteredCandidates, formCustomAttendeeIds]);

  const handleSelectAllToggle = () => {
    const visibleIds = filteredCandidates.map((c) => c.id);
    if (isAllSelected) {
      // Remove visible candidates from selection
      setFormCustomAttendeeIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      // Add all visible candidates to selection
      setFormCustomAttendeeIds((prev) => {
        const union = new Set([...prev, ...visibleIds]);
        return Array.from(union);
      });
    }
  };

  // Target Type Label Mapper
  const getTargetTypeLabel = (type: string) => {
    switch (type.toUpperCase()) {
      case "ALL":
        return "Semua Anggota";
      case "EXECUTIVE":
        return "Pengurus Lembaga";
      case "ALL_BOARD":
        return "Seluruh Pengurus";
      case "SECRETARIAT":
        return "Kesekretariatan";
      case "FINANCE":
        return "Keuangan";
      case "DEPARTMENT":
        return "Bidang / Departemen";
      case "CROSS_AGENCY":
        return "Lintas Badan & Eksternal";
      case "CROSS_INTERNAL":
        return "Lintas Internal";
      default:
        return type;
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formTitle || !formDateTime || !formLocation || !formTargetType) {
      setFormError("Judul, Waktu, Lokasi, dan Target Rapat wajib diisi.");
      return;
    }

    if (formCustomAttendeeIds.length === 0 && (!formExternalEmailsText || formTargetType !== "CROSS_AGENCY")) {
      setFormError("Silakan pilih setidaknya 1 peserta rapat yang diundang.");
      return;
    }

    if (!untilFinished && formEndDateTime && formDateTime) {
      const startTime = formDateTime.slice(11, 16);
      if (formEndDateTime <= startTime) {
        setFormError("Jam selesai rapat harus setelah jam mulai rapat.");
        return;
      }
    }

    const payload = {
      title: formTitle,
      agendaNumber: formAgendaNumber || undefined,
      dateTime: new Date(formDateTime).toISOString(),
      endDateTime: untilFinished || !formEndDateTime ? null : new Date(`${formDateTime.slice(0, 10)}T${formEndDateTime}`).toISOString(),
      location: formLocation,
      description: formDescription || undefined,
      targetType: formTargetType,
      departmentId: formTargetType === "DEPARTMENT" ? formDepartmentId : undefined,
      customAttendeeIds: formCustomAttendeeIds,
      externalEmails: formTargetType === "CROSS_AGENCY"
        ? formExternalEmailsText.split(",").map((e) => e.trim()).filter(Boolean)
        : undefined,
      discussedDocIds: discussIncomingDocs ? selectedDiscussedDocIds : []
    };

    let success = false;
    if (selectedMeeting) {
      success = await updateMeeting(selectedMeeting.id, payload);
    } else {
      success = await addMeeting(payload);
    }

    if (success) {
      setIsFormModalOpen(false);
      clearForm();
    } else {
      setFormError(error || "Gagal menyimpan agenda rapat. Pastikan nomor agenda unik.");
    }
  };

  // Send Invitation Handler
  const handleSendInvitations = async (meetingId: string) => {
    const success = await sendInvitations(meetingId);
    if (success) {
      alert("Undangan email sukses terkirim ke seluruh anggota rapat!");
      // Update drawer if it is open
      const updated = meetingList.find((m) => m.id === meetingId);
      if (updated) {
        setSelectedMeeting(updated);
      }
    } else {
      alert("Gagal mengirim undangan.");
    }
  };

  const [sendingSingleEmail, setSendingSingleEmail] = useState<string | null>(null);

  const handleSendInvitationSingle = async (meetingId: string, email: string) => {
    setSendingSingleEmail(email);
    const success = await useMeetingStore.getState().sendInvitationSingle(meetingId, email);
    setSendingSingleEmail(null);
    if (success) {
      alert(`Undangan email sukses dikirim ke ${email}!`);
      const updated = useMeetingStore.getState().meetingList.find((m) => m.id === meetingId);
      if (updated) {
        setSelectedMeeting(updated);
      }
    } else {
      alert("Gagal mengirim undangan.");
    }
  };

  // Delete Handler
  const handleDelete = async () => {
    if (!selectedMeeting) return;
    const success = await deleteMeeting(selectedMeeting.id);
    if (success) {
      setIsDeleteModalOpen(false);
      setSelectedMeeting(null);
    } else {
      alert("Gagal menghapus agenda rapat.");
    }
  };

  // Checkbox toggle for users selection
  const handleUserToggle = (userId: string) => {
    setFormCustomAttendeeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
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
            <span>Agenda & Rapat</span>
            <ChevronRight size={10} />
            <span className="text-[#006633] dark:text-[#D4AF37]">Agenda Rapat</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight mt-1">
            Agenda Rapat
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-1">
            Sistem penjadwalan, pengelolaan, dan pengarsipan agenda rapat digital DSN-MUI.
          </p>
        </div>

        <button
          onClick={() => {
            clearForm();
            setIsFormModalOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#006633] hover:bg-[#00552b] text-white font-bold rounded-lg transition-all text-xs uppercase tracking-wider shadow-sm cursor-pointer"
        >
          <Plus size={16} /> Buat Agenda Rapat
        </button>
      </div>

      {/* ── METRICS SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div
          onClick={() => setStatusFilter("ALL")}
          className={`cursor-pointer rounded-xl p-4 border transition-all duration-200 flex flex-col justify-between ${
            statusFilter === "ALL"
              ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "bg-white border-slate-100 hover:border-slate-200 dark:bg-slate-900 dark:border-slate-850"
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-60">Total Agenda</span>
          <h3 className="text-2xl font-extrabold tracking-tight mt-2">{metrics.TOTAL}</h3>
        </div>

        <div
          onClick={() => setStatusFilter("DRAFT")}
          className={`cursor-pointer rounded-xl p-4 border transition-all duration-200 flex flex-col justify-between ${
            statusFilter === "DRAFT"
              ? "bg-amber-500 border-amber-500 text-white shadow-xs"
              : "bg-white border-slate-100 hover:border-slate-200 dark:bg-slate-900 dark:border-slate-850"
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-60">Draft</span>
          <h3 className="text-2xl font-extrabold tracking-tight mt-2">{metrics.DRAFT}</h3>
        </div>

        <div
          onClick={() => setStatusFilter("AKTIF")}
          className={`cursor-pointer rounded-xl p-4 border transition-all duration-200 flex flex-col justify-between ${
            statusFilter === "AKTIF"
              ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
              : "bg-white border-slate-100 hover:border-slate-200 dark:bg-slate-900 dark:border-slate-850"
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-60">Mendatang / Aktif</span>
          <h3 className="text-2xl font-extrabold tracking-tight mt-2">{metrics.AKTIF}</h3>
        </div>

        <div
          onClick={() => setStatusFilter("SELESAI")}
          className={`cursor-pointer rounded-xl p-4 border transition-all duration-200 flex flex-col justify-between ${
            statusFilter === "SELESAI"
              ? "bg-blue-600 border-blue-600 text-white shadow-xs"
              : "bg-white border-slate-100 hover:border-slate-200 dark:bg-slate-900 dark:border-slate-850"
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-60">Selesai</span>
          <h3 className="text-2xl font-extrabold tracking-tight mt-2">{metrics.SELESAI}</h3>
        </div>

        <div
          onClick={() => setStatusFilter("ARSIP")}
          className={`cursor-pointer rounded-xl p-4 border transition-all duration-200 flex flex-col justify-between ${
            statusFilter === "ARSIP"
              ? "bg-purple-600 border-purple-600 text-white shadow-xs"
              : "bg-white border-slate-100 hover:border-slate-200 dark:bg-slate-900 dark:border-slate-850"
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-60">Diarsipkan / Batal</span>
          <h3 className="text-2xl font-extrabold tracking-tight mt-2">{metrics.ARSIP}</h3>
        </div>
      </div>

      {/* ── MAIN CONTENT CONTAINER (SEARCH & FILTER) ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850 p-5 shadow-xs space-y-4">
        
        {/* Search and Filters Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-50 dark:border-slate-850/40">
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-[#006633] dark:bg-[#D4AF37] rounded-full inline-block" />
              Daftar Agenda Rapat
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
              Menampilkan {filteredMeetings.length} rapat dari total {meetingList.length}
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            {/* Search Bar */}
            <div className="relative w-full md:w-64">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari judul agenda atau lokasi..."
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

        {/* Powerful Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-1 pb-2">
          {/* Target Type Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono">Target Sasaran</label>
            <select
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-[#006633] focus:ring-1 focus:ring-[#006633]/20 transition-all text-slate-700 dark:text-slate-350 font-semibold cursor-pointer"
            >
              <option value="ALL_TARGETS">Semua Sasaran</option>
              <option value="ALL">Semua Anggota</option>
              <option value="EXECUTIVE">Pengurus Lembaga</option>
              <option value="ALL_BOARD">Seluruh Pengurus</option>
              <option value="SECRETARIAT">Kesekretariatan</option>
              <option value="FINANCE">Keuangan</option>
              <option value="DEPARTMENT">Bidang / Departemen</option>
              <option value="CROSS_INTERNAL">Lintas Internal</option>
              <option value="CROSS_AGENCY">Lintas Badan & Eksternal</option>
            </select>
          </div>

          {/* Invitation Status Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono">Status Undangan</label>
            <select
              value={invitationFilter}
              onChange={(e) => setInvitationFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-[#006633] focus:ring-1 focus:ring-[#006633]/20 transition-all text-slate-700 dark:text-slate-350 font-semibold cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="SENT">Terkirim</option>
              <option value="DRAFT">Draf</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono">Mulai Tanggal</label>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-[#006633] focus:ring-1 focus:ring-[#006633]/20 transition-all text-slate-700 dark:text-slate-350 font-semibold cursor-pointer"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono">Sampai Tanggal</label>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-[#006633] focus:ring-1 focus:ring-[#006633]/20 transition-all text-slate-700 dark:text-slate-350 font-semibold cursor-pointer"
            />
          </div>

          {/* Reset Filters */}
          <div className="flex items-end">
            {(targetFilter !== "ALL_TARGETS" || invitationFilter !== "ALL" || startDateFilter || endDateFilter) ? (
              <button
                onClick={() => {
                  setTargetFilter("ALL_TARGETS");
                  setInvitationFilter("ALL");
                  setStartDateFilter("");
                  setEndDateFilter("");
                }}
                className="w-full py-1.5 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-dashed border-rose-200 dark:border-rose-900 rounded-lg transition-all font-bold flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
              >
                <X size={12} /> Reset Filter
              </button>
            ) : (
              <div className="w-full py-1.5 text-xs text-slate-450 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center font-bold select-none cursor-not-allowed uppercase tracking-wider bg-slate-50/50 dark:bg-slate-950/50">
                Filter Aktif: Nihil
              </div>
            )}
          </div>
        </div>

        {/* DATATABLE LIST */}
        <div className="overflow-x-auto border border-slate-100 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-850 bg-[#006633]/8 dark:bg-[#006633]/15 text-[#006633] dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider select-none font-mono">
                <th className="py-3 px-4 font-bold text-center w-12">No.</th>
                <th className="py-3 px-4 font-bold">No. Agenda</th>
                <th className="py-3 px-4 font-bold">Judul Rapat</th>
                <th className="py-3 px-4 font-bold">Tanggal & Waktu</th>
                <th className="py-3 px-4 font-bold">Lokasi</th>
                <th className="py-3 px-4 font-bold">Sasaran</th>
                <th className="py-3 px-4 font-bold">Peserta</th>
                <th className="py-3 px-4 font-bold">Undangan</th>
                <th className="py-3 px-4 font-bold text-center">Status</th>
                <th className="py-3 px-4 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60 dark:divide-slate-850/40 text-xs">
              {loading && meetingList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#006633]"></div>
                      <p className="text-[10px] font-bold text-slate-450 uppercase tracking-widest font-mono">Loading rapat...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedMeetings.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center space-y-2">
                    <AlertTriangle className="size-8 text-slate-350 mx-auto" />
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Belum ada agenda rapat terdaftar</h4>
                    <p className="text-[10px] text-slate-450 font-semibold max-w-xs mx-auto">
                      Silakan buat agenda rapat baru dengan menekan tombol di kanan atas atau sesuaikan filter pencarian.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedMeetings.map((meeting, index) => {
                  const { date: formattedDate, time: formattedTime } = formatMeetingTimeRange(meeting, true);

                  // Status styling
                  let statusBadge = "bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/40";
                  if (meeting.status === "AKTIF") {
                    statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/40";
                  } else if (meeting.status === "SELESAI") {
                    statusBadge = "bg-blue-50 text-blue-700 border-blue-250 dark:bg-blue-950/20 dark:text-blue-450 dark:border-blue-900/40";
                  } else if (meeting.status === "ARSIP") {
                    statusBadge = "bg-purple-50 text-purple-700 border-purple-250 dark:bg-purple-950/20 dark:text-purple-450 dark:border-purple-900/40";
                  } else if (meeting.status === "BATAL") {
                    statusBadge = "bg-rose-50 text-rose-700 border-rose-250 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/40";
                  }

                  const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;

                  return (
                    <tr
                      key={meeting.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-950/25 transition-colors font-medium text-slate-700 dark:text-slate-350"
                    >
                      {/* No. (Row Index) */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-400 dark:text-slate-500 text-center">
                        {rowNumber}
                      </td>

                      {/* No. Agenda */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-500 dark:text-slate-400">
                        {meeting.agendaNumber || "-"}
                      </td>

                      {/* Judul Rapat */}
                      <td className="py-3 px-4 max-w-[200px]">
                        <div className="font-extrabold text-slate-850 dark:text-white line-clamp-1">
                          {meeting.title}
                        </div>
                        {meeting.description && (
                          <div className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold line-clamp-1 mt-0.5">
                            {meeting.description}
                          </div>
                        )}
                      </td>

                      {/* Tanggal & Waktu */}
                      <td className="py-3 px-4">
                        <div className="text-slate-800 dark:text-slate-200 font-bold">{formattedDate}</div>
                        <div className="text-[10px] text-slate-450 dark:text-slate-500 font-bold font-mono mt-0.5">{formattedTime}</div>
                      </td>

                      {/* Lokasi */}
                      <td className="py-3 px-4 max-w-[150px] truncate">
                        <div className="flex items-center gap-1">
                          <MapPin size={11} className="text-slate-450 shrink-0" />
                          <span className="truncate">{meeting.location}</span>
                        </div>
                      </td>

                      {/* Sasaran */}
                      <td className="py-3 px-4 text-[10px] font-extrabold text-[#006633] dark:text-[#D4AF37] uppercase font-mono">
                        {getTargetTypeLabel(meeting.targetType)}
                      </td>

                      {/* Peserta */}
                      <td className="py-3 px-4 font-bold text-slate-500 dark:text-slate-400">
                        {meeting.attendees.length} orang
                      </td>

                      {/* Undangan Status */}
                      <td className="py-3 px-4">
                        {meeting.invitationSent ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-500 uppercase">
                            <CheckCircle2 size={11} /> Terkirim
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-500 uppercase">
                            <AlertTriangle size={11} /> Draf
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${statusBadge}`}>
                          {meeting.status}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedMeeting(meeting);
                              setIsDetailDrawerOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-all cursor-pointer font-bold"
                            title="Detail Rapat"
                          >
                            <Eye size={13} />
                          </button>

                          <button
                            onClick={() => {
                              populateForm(meeting);
                              setIsFormModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-[#006633] bg-[#006633]/10 hover:bg-[#006633]/20 dark:bg-[#006633]/20 dark:hover:bg-[#006633]/30 transition-all cursor-pointer font-bold"
                            title="Edit Rapat"
                          >
                            <Edit2 size={13} />
                          </button>

                          {/* Buat Notula Button */}
                          <button
                            onClick={() => {
                              router.push(`/notula?createFromMeetingId=${meeting.id}`);
                            }}
                            className="p-1.5 rounded-lg text-[#D4AF37] bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 dark:bg-[#D4AF37]/20 dark:hover:bg-[#D4AF37]/30 transition-all cursor-pointer font-bold"
                            title="Tulis / Lihat Notula Rapat"
                          >
                            <FileText size={13} />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedMeeting(meeting);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-450 dark:hover:bg-rose-900/30 transition-all cursor-pointer font-bold"
                            title="Hapus Rapat"
                          >
                            <Trash2 size={13} />
                          </button>
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
        {filteredMeetings.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 text-xs select-none">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-semibold">
              <span>Tampilkan</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded outline-none font-bold text-slate-700 dark:text-slate-350 focus:border-[#006633] focus:ring-1 focus:ring-[#006633]/10"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>data per halaman</span>
            </div>

            <div className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase font-mono">
              Menampilkan {Math.min(filteredMeetings.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredMeetings.length, currentPage * itemsPerPage)} dari {filteredMeetings.length} rapat
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

      {/* 1. CREATE / EDIT MODAL FORM */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-850">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white">
                {selectedMeeting ? "Edit Agenda Rapat" : "Buat Agenda Rapat Baru"}
              </h3>
              <button
                onClick={() => {
                  setIsFormModalOpen(false);
                  clearForm();
                }}
                className="p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-450"
              >
                <X size={16} />
              </button>
            </div>

            {/* Layout body form */}
            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-5 gap-6">
              
              {/* Left Column: Form Inputs (3 cols) */}
              <form onSubmit={handleSubmit} id="meeting-form" className="lg:col-span-3 space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                {formError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-center gap-2">
                    <AlertTriangle className="size-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450">
                    Judul Rapat <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Rapat Pleno Fatwa Triwulan II"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg outline-none focus:border-[#006633] transition-all font-medium text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450">
                      Nomor Agenda / Surat Rapat
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 004/PL/DSN-MUI/VI/2026"
                      value={formAgendaNumber}
                      onChange={(e) => setFormAgendaNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg outline-none focus:border-[#006633] transition-all font-mono text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450">
                      Waktu & Tanggal Mulai <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formDateTime}
                      onChange={(e) => setFormDateTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg outline-none focus:border-[#006633] transition-all font-medium text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div className="space-y-1 sm:col-start-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450">
                        Jam Selesai
                      </label>
                      <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={untilFinished}
                          onChange={(e) => {
                            setUntilFinished(e.target.checked);
                            if (e.target.checked) {
                              setFormEndDateTime("");
                            }
                          }}
                          className="rounded border-slate-300 text-[#006633] focus:ring-[#006633] w-3 h-3 cursor-pointer"
                        />
                        s/d Selesai
                      </label>
                    </div>
                    <input
                      type="time"
                      value={formEndDateTime}
                      onChange={(e) => setFormEndDateTime(e.target.value)}
                      disabled={untilFinished}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg outline-none focus:border-[#006633] transition-all font-medium text-slate-900 dark:text-white disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450">
                    Lokasi Rapat (Fisik atau Link Pertemuan) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Ruang Rapat Lt. 2 DSN-MUI atau Zoom Meeting Link"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg outline-none focus:border-[#006633] transition-all font-medium text-slate-900 dark:text-white"
                    required
                  />
                </div>



                {/* Checkbox Membahas Surat Masuk */}
                <div className="space-y-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={discussIncomingDocs}
                      onChange={(e) => {
                        setDiscussIncomingDocs(e.target.checked);
                        if (!e.target.checked) {
                          setSelectedDiscussedDocIds([]);
                        }
                      }}
                      className="rounded border-slate-350 text-[#006633] focus:ring-[#006633] w-4 h-4 cursor-pointer accent-[#006633]"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Rapat ini membahas Surat Masuk
                    </span>
                  </label>
                </div>

                {discussIncomingDocs && (
                  <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-xl relative animate-in fade-in slide-in-from-top-1 duration-200">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450">
                      Pilih Surat Masuk yang Dibahas
                    </label>
                    <div className="relative">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Cari surat masuk berdasarkan judul atau nomor dokumen..."
                          value={docSearchQuery}
                          onChange={(e) => {
                            setDocSearchQuery(e.target.value);
                            setIsDropdownOpen(true);
                          }}
                          onFocus={() => setIsDropdownOpen(true)}
                          className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-[#006633] transition-all font-medium text-slate-800 dark:text-white"
                        />
                        {docSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setDocSearchQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      {/* Dropdown List */}
                      {isDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                          <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-50 py-1">
                            {incomingDocs.filter((d: any) => {
                              const titleMatch = d.title?.toLowerCase().includes(docSearchQuery.toLowerCase());
                              const numMatch = d.documentNumber?.toLowerCase().includes(docSearchQuery.toLowerCase());
                              return titleMatch || numMatch;
                            }).length === 0 ? (
                              <div className="px-3 py-2 text-[10px] text-slate-400 text-center font-bold">
                                Tidak ada surat masuk ditemukan
                              </div>
                            ) : (
                              incomingDocs
                                .filter((d: any) => {
                                  const titleMatch = d.title?.toLowerCase().includes(docSearchQuery.toLowerCase());
                                  const numMatch = d.documentNumber?.toLowerCase().includes(docSearchQuery.toLowerCase());
                                  return titleMatch || numMatch;
                                })
                                .map((docItem: any) => {
                                  const isSelected = selectedDiscussedDocIds.includes(docItem.id);
                                  return (
                                    <div
                                      key={docItem.id}
                                      onClick={() => {
                                        if (isSelected) {
                                          setSelectedDiscussedDocIds(prev => prev.filter(id => id !== docItem.id));
                                        } else {
                                          setSelectedDiscussedDocIds(prev => [...prev, docItem.id]);
                                        }
                                      }}
                                      className={`px-3 py-2 text-[11px] font-medium flex items-center justify-between cursor-pointer transition-colors ${
                                        isSelected
                                          ? "bg-emerald-50 dark:bg-[#006633]/25 text-[#006633] dark:text-emerald-400"
                                          : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                      }`}
                                    >
                                      <div className="min-w-0 flex-1">
                                        <p className="font-bold truncate" title={docItem.title}>{docItem.title}</p>
                                        <p className="text-[9px] text-slate-450 dark:text-slate-500 font-mono truncate">{docItem.documentNumber || "No Nomor"}</p>
                                      </div>
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        readOnly
                                        className="rounded border-slate-350 text-[#006633] focus:ring-[#006633] size-3.5 pointer-events-none accent-[#006633]"
                                      />
                                    </div>
                                  );
                                })
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Selected List */}
                    {selectedDiscussedDocIds.length > 0 && (
                      <div className="flex flex-col gap-1.5 pt-2">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                          Daftar Surat Masuk Terpilih ({selectedDiscussedDocIds.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedDiscussedDocIds.map((id) => {
                            const d = incomingDocs.find(item => item.id === id);
                            if (!d) return null;
                            return (
                              <div
                                key={id}
                                className="inline-flex items-center gap-1.5 bg-[#006633]/8 dark:bg-[#006633]/15 text-[#006633] dark:text-emerald-400 border border-[#006633]/20 px-2.5 py-1 rounded-full text-[10px] font-bold"
                              >
                                <span className="max-w-[180px] truncate" title={d.title}>
                                  {d.title}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedDiscussedDocIds(prev => prev.filter(x => x !== id))}
                                  className="text-[#006633] dark:text-emerald-400 hover:text-rose-500 dark:hover:text-rose-450 transition-colors"
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450">
                    Keterangan Rapat / Deskripsi Pembahasan
                  </label>
                  <textarea
                    placeholder="Tuliskan keterangan detail mengenai agenda rapat..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg outline-none focus:border-[#006633] transition-all font-medium text-slate-900 dark:text-white h-24 resize-none"
                  />
                </div>
              </form>

              {/* Right Column: Dynamic Choose Attendees (2 cols) */}
              <div className="lg:col-span-2 bg-slate-50/50 dark:bg-slate-950/30 rounded-xl border border-slate-200/60 p-4 flex flex-col max-h-[60vh] lg:max-h-none">
                <div className="pb-2 border-b border-slate-200/60 mb-2 space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-wide text-[#006633] dark:text-[#D4AF37] flex items-center gap-1.5">
                      <Users size={12} />
                      Pilih Anggota Terundang
                    </h4>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-[#006633]/15 text-[#006633] rounded-full font-mono">
                      {formCustomAttendeeIds.length} Terpilih
                    </span>
                  </div>

                  {/* Candidate list search inside modal */}
                  {candidates.length > 0 && (
                    <div className="relative">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari nama atau jabatan..."
                        value={candidateSearchQuery}
                        onChange={(e) => setCandidateSearchQuery(e.target.value)}
                        className="w-full pl-7 pr-3 py-1 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-850 rounded-md text-[10px] outline-none focus:border-[#006633] transition-all font-medium text-slate-800 dark:text-white"
                      />
                    </div>
                  )}

                  {/* Select All Checkbox */}
                  {filteredCandidates.length > 0 && (
                    <div className="flex items-center gap-2 px-1 pt-1">
                      <input
                        type="checkbox"
                        id="select-all-candidates"
                        checked={isAllSelected}
                        onChange={handleSelectAllToggle}
                        className="rounded border-slate-350 text-[#006633] focus:ring-[#006633] size-3.5 cursor-pointer"
                      />
                      <label htmlFor="select-all-candidates" className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 cursor-pointer uppercase tracking-wider">
                        Pilih Semua yang Tampil ({filteredCandidates.length})
                      </label>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 pt-1">
                  {candidates.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 text-[10px] font-bold">
                      Belum ada anggota terdaftar
                    </div>
                  ) : filteredCandidates.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 text-[10px] font-bold">
                      Tidak ada hasil pencarian
                    </div>
                  ) : (
                    filteredCandidates.map((user) => {
                      const isChecked = formCustomAttendeeIds.includes(user.id);
                      return (
                        <label
                          key={user.id}
                          className={`p-2 rounded-lg border flex items-start gap-2.5 shadow-2xs cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-850 ${
                            isChecked
                              ? "bg-emerald-50/20 border-emerald-250 dark:border-[#006633]/30"
                              : "bg-white border-slate-200/50 dark:bg-slate-900 dark:border-slate-850"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleUserToggle(user.id)}
                            className="rounded border-slate-350 text-[#006633] focus:ring-[#006633] mt-0.5 shrink-0 cursor-pointer"
                          />
                          <div className="min-w-0 flex-1">
                            <h5 className="text-[10px] font-bold text-slate-805 dark:text-white truncate leading-tight">
                              {user.fullName}
                            </h5>
                            <p className="text-[9px] text-slate-400 truncate mt-0.5">
                              {user.jabatan?.name || "Anggota"} — {user.department?.name || ""}
                            </p>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/40 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsFormModalOpen(false);
                  clearForm();
                }}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 rounded-lg transition-colors font-bold uppercase tracking-wider text-[10px]"
              >
                Batal
              </button>
              <button
                type="submit"
                form="meeting-form"
                disabled={loading}
                className="px-4 py-2 bg-[#006633] hover:bg-[#00552b] text-white rounded-lg transition-colors font-bold uppercase tracking-wider text-[10px] cursor-pointer"
              >
                {loading ? "Menyimpan..." : selectedMeeting ? "Simpan Perubahan" : "Buat Agenda"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. DETAIL DRAWER DRAWER */}
      {isDetailDrawerOpen && selectedMeeting && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-850 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-350">
            
            {/* Drawer Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-850">
              <div>
                <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#006633] dark:text-[#D4AF37]">
                  Detail Rapat DSN-MUI
                </h3>
                <p className="text-[10px] text-slate-450 font-mono mt-0.5">ID: {selectedMeeting.id}</p>
              </div>
              <button
                onClick={() => {
                  setIsDetailDrawerOpen(false);
                  setSelectedMeeting(null);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Meeting Basic Card Info */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3.5">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                    {selectedMeeting.title}
                  </h4>
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                    selectedMeeting.status === "AKTIF"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-250"
                      : selectedMeeting.status === "SELESAI"
                      ? "bg-blue-50 text-blue-700 border-blue-250"
                      : "bg-amber-50 text-amber-700 border-amber-250"
                  }`}>
                    {selectedMeeting.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold text-slate-650 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-[#006633]" />
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Waktu Rapat</p>
                      <p className="text-slate-800 dark:text-white font-bold">
                        {formatMeetingTimeRange(selectedMeeting).full}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-[#006633]" />
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Lokasi / Link Pertemuan</p>
                      <p className="text-slate-800 dark:text-white font-bold truncate max-w-[200px]" title={selectedMeeting.location}>
                        {selectedMeeting.location}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rapat target & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] uppercase font-bold text-slate-400">Nomor Agenda</span>
                  <span className="font-mono text-slate-800 dark:text-white">{selectedMeeting.agendaNumber || "-"}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] uppercase font-bold text-slate-400">Kategori Peserta</span>
                  <span className="text-[#006633] dark:text-[#D4AF37] font-bold">{getTargetTypeLabel(selectedMeeting.targetType)}</span>
                </div>
                <div className="flex flex-col gap-0.5 sm:col-span-2">
                  <span className="text-[9px] uppercase font-bold text-slate-400">Keterangan / Agenda Pembahasan</span>
                  <p className="text-[11px] font-medium text-slate-700 dark:text-slate-350 leading-relaxed bg-slate-50/30 dark:bg-slate-950/30 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
                    {selectedMeeting.description || "Tidak ada agenda pembahasan tertulis."}
                  </p>
                </div>
              </div>

              {/* Discussed Documents */}
              {selectedMeeting.discussedDocs && selectedMeeting.discussedDocs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-[#006633] dark:text-[#D4AF37] border-b border-slate-100 dark:border-slate-850 pb-1.5 flex justify-between items-center">
                    <span>Dokumen Surat Masuk Yang Dibahas</span>
                    <span className="font-mono text-[10px] text-slate-400">{selectedMeeting.discussedDocs.length} dokumen</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedMeeting.discussedDocs.map((doc: any) => (
                      <div key={doc.id} className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shadow-2xs gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-slate-800 dark:text-white truncate animate-in" title={doc.title}>
                            {doc.title}
                          </p>
                          <p className="text-[9px] text-slate-450 dark:text-slate-500 font-mono mt-0.5 truncate">
                            {doc.documentNumber || "No Nomor"}
                          </p>
                        </div>
                        <a
                          href={`/surat-masuk?id=${doc.id}`}
                          className="text-[9px] font-bold bg-[#006633]/10 text-[#006633] dark:bg-emerald-950/30 dark:text-emerald-400 border border-[#006633]/20 px-2 py-1 rounded hover:bg-[#006633]/20 transition-all shrink-0"
                        >
                          Buka Surat
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attendance Registry Section */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-[#006633] dark:text-[#D4AF37] border-b border-slate-100 dark:border-slate-850 pb-1.5 flex justify-between items-center">
                  <span>Daftar Peserta & Absensi Rapat</span>
                  <span className="font-mono text-[10px] text-slate-400">{selectedMeeting.attendees.length} terundang</span>
                </h4>

                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {selectedMeeting.attendees.map((attendee, idx) => (
                    <div key={idx} className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-lg flex items-center justify-between shadow-2xs gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-[#006633]/15 text-[#006633] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {attendee.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-[11px] font-bold text-slate-800 dark:text-white truncate leading-tight">
                            {attendee.name}
                          </h5>
                          <p className="text-[9px] text-slate-450 dark:text-slate-500 font-semibold truncate leading-tight mt-0.5">
                            {attendee.jabatan} - {attendee.department}
                          </p>
                          <p className="text-[9px] text-slate-400 font-mono truncate leading-none mt-0.5">
                            {attendee.email}
                          </p>
                        </div>
                      </div>

                      {/* Granular email invitation status & Action button */}
                      <div className="flex items-center gap-2 shrink-0">
                        {attendee.invitationSent ? (
                          <span className="text-[8px] font-extrabold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 rounded border border-emerald-250 uppercase tracking-wider">
                            Terkirim
                          </span>
                        ) : (
                          <span className="text-[8px] font-extrabold px-1.5 py-0.5 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 rounded border border-amber-250 uppercase tracking-wider">
                            Pending
                          </span>
                        )}

                        <button
                          onClick={() => handleSendInvitationSingle(selectedMeeting.id, attendee.email)}
                          disabled={sendingSingleEmail === attendee.email}
                          className="p-1 bg-slate-50 border border-slate-200 dark:bg-slate-850 dark:border-slate-800 rounded hover:bg-slate-100 dark:hover:bg-slate-750 text-[#006633] dark:text-emerald-400 transition-colors disabled:opacity-50 cursor-pointer"
                          title="Kirim Undangan Email Mandiri"
                        >
                          <Mail size={12} className={sendingSingleEmail === attendee.email ? "animate-pulse" : ""} />
                        </button>

                        {/* Absensi status tag */}
                        <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                          attendee.status === "HADIR"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-250"
                            : attendee.status === "TIDAK_HADIR"
                            ? "bg-rose-50 text-rose-700 border-rose-250"
                            : "bg-slate-100 text-slate-650 border-slate-200"
                        }`}>
                          {attendee.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Drawer Footer */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/40 flex flex-wrap justify-between items-center gap-3">
              {/* Trigger email button */}
              <div>
                {!selectedMeeting.invitationSent ? (
                  <button
                    onClick={() => handleSendInvitations(selectedMeeting.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
                  >
                    <Send size={12} /> Kirim Undangan ke Semua Peserta
                  </button>
                ) : (
                  <button
                    onClick={() => handleSendInvitations(selectedMeeting.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#006633]/15 text-[#006633] border border-[#006633]/25 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <Send size={12} /> Kirim Ulang Undangan ke Semua Peserta
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => alert("Mengunduh notula rapat (PDF)...")}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Unduh Notula
                </button>
                <button
                  onClick={() => {
                    setIsDetailDrawerOpen(false);
                    setSelectedMeeting(null);
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-650 hover:bg-slate-50 dark:text-slate-350"
                >
                  Tutup
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3. DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Hapus Agenda Rapat
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                  Apakah Anda yakin ingin menghapus agenda rapat <b className="text-slate-700 dark:text-slate-200">"{selectedMeeting.title}"</b>? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-50 dark:border-slate-850/40">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedMeeting(null);
                }}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-650 hover:bg-slate-50 dark:text-slate-350 transition-colors uppercase tracking-wider"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition-colors uppercase tracking-wider cursor-pointer"
              >
                {loading ? "Menghapus..." : "Hapus Agenda"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
