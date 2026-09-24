"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Building2,
  Users,
  BellRing,
  Mail,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  FileBadge,
  UserCheck,
  Trash2,
  Lock,
  ChevronDown,
  ChevronUp,
  Sliders,
  Send,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkflowToolbarProps {
  documentId: string;
  doc: any;
  publicSub: any;
  isDpsDoc: boolean;
  isRsDoc: boolean;
  isApproved: boolean;
  hasCertificate: boolean;
  candidatesCount: number;
  meetingsCount: number;
  onOpenInvitePresentation: () => void;
  onOpenInterview: () => void;
  onOpenMeetingAgenda: () => void;
  onOpenApprove: () => void;
  onOpenReject: () => void;
  onOpenUploadCert: () => void;
  onOpenReminder: () => void;
  onOpenSaveDps: () => void;
  onOpenReplyEmail: () => void;
  onOpenDelete: () => void;
}

export const WorkflowToolbar: React.FC<WorkflowToolbarProps> = ({
  documentId,
  doc,
  publicSub,
  isDpsDoc,
  isRsDoc,
  isApproved,
  hasCertificate,
  candidatesCount,
  meetingsCount,
  onOpenInvitePresentation,
  onOpenInterview,
  onOpenMeetingAgenda,
  onOpenApprove,
  onOpenReject,
  onOpenUploadCert,
  onOpenReminder,
  onOpenSaveDps,
  onOpenReplyEmail,
  onOpenDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const currentStatus = publicSub?.status || doc?.status || "BARU";
  const isDpsOrRs = isDpsDoc || isRsDoc;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
      {/* ── IDE COMPACT TOOLBAR RIBBON (COLLAPSIBLE / EXPANDABLE) ── */}
      <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200/70 dark:border-slate-700/70 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: IDE Brand / Label */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-xs font-black text-xs"
            style={{ background: "linear-gradient(135deg, #006633 0%, #1B7F4A 100%)" }}
          >
            <Sparkles size={14} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              Workflow Toolbar
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">
              Alur Dinamis
            </span>
          </div>
        </div>

        {/* Center: IDE Horizontal Action Buttons Group (Quick Action Ribbon) */}
        <div className="flex items-center flex-wrap gap-1.5 overflow-x-auto py-0.5">
          {/* Group 1: Pemohon */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
            <button
              type="button"
              onClick={onOpenInvitePresentation}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold text-[11px] transition-all cursor-pointer"
              title="Undang presentasi pemohon baru"
            >
              <Building2 size={13} className="text-emerald-600 shrink-0" />
              <span>Undang Instansi</span>
            </button>

            {isDpsOrRs && (
              <button
                type="button"
                onClick={onOpenInterview}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/60 text-slate-700 dark:text-slate-200 hover:text-amber-800 dark:hover:text-amber-300 font-bold text-[11px] transition-all cursor-pointer"
                title="Wawancara calon DPS"
              >
                <Users size={13} className="text-amber-600 shrink-0" />
                <span>Interview DPS</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenReminder}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/60 text-slate-700 dark:text-slate-200 hover:text-amber-800 dark:hover:text-amber-300 font-bold text-[11px] transition-all cursor-pointer"
              title="Kirim email pengingat (due date opsional)"
            >
              <BellRing size={13} className="text-amber-600 shrink-0" />
              <span>Pengingat</span>
            </button>
          </div>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5 hidden sm:block" />

          {/* Group 2: Rapat Internal */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
            <button
              type="button"
              onClick={onOpenMeetingAgenda}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-300 font-bold text-[11px] transition-all cursor-pointer"
              title="Buat agenda rapat internal DSN-MUI (dapat berkali-kali)"
            >
              <CalendarDays size={13} className="text-blue-600 shrink-0" />
              <span>+ Rapat</span>
              {meetingsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-black flex items-center justify-center">
                  {meetingsCount}
                </span>
              )}
            </button>
          </div>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5 hidden sm:block" />

          {/* Group 3: Keputusan & Hasil */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
            <button
              type="button"
              onClick={onOpenApprove}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer",
                isApproved
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-200 hover:text-emerald-700"
              )}
              title={isApproved ? "Pengajuan telah disetujui" : "Setujui pengajuan & aktifkan upload sertifikat"}
            >
              <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
              <span>{isApproved ? "Disetujui" : "Setujui"}</span>
            </button>

            <button
              type="button"
              onClick={onOpenReject}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-700 dark:text-slate-200 hover:text-rose-700 dark:hover:text-rose-300 font-bold text-[11px] transition-all cursor-pointer"
              title="Tolak pengajuan atau minta perbaikan dokumen"
            >
              <AlertTriangle size={13} className="text-rose-600 shrink-0" />
              <span>Tolak / Revisi</span>
            </button>

            {/* Upload Sertifikat (Disabled if not approved) */}
            <button
              type="button"
              disabled={!isApproved}
              onClick={onOpenUploadCert}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all",
                isApproved
                  ? "hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-200 hover:text-emerald-700 cursor-pointer"
                  : "opacity-40 text-slate-400 cursor-not-allowed"
              )}
              title={isApproved ? "Upload PDF sertifikat hasil resmi" : "Terkunci: Menunggu persetujuan pengajuan"}
            >
              {isApproved ? <FileBadge size={13} className="text-emerald-600 shrink-0" /> : <Lock size={12} className="shrink-0" />}
              <span>Sertifikat</span>
            </button>

            {isDpsDoc && (
              <button
                type="button"
                disabled={!isApproved}
                onClick={onOpenSaveDps}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all",
                  isApproved
                    ? "hover:bg-sky-50 dark:hover:bg-sky-950/60 text-slate-700 dark:text-slate-200 hover:text-sky-700 cursor-pointer"
                    : "opacity-40 text-slate-400 cursor-not-allowed"
                )}
                title={isApproved ? "Simpan calon DPS ke master database" : "Terkunci: Menunggu persetujuan"}
              >
                <UserCheck size={13} className={isApproved ? "text-sky-600 shrink-0" : "shrink-0"} />
                <span>Simpan DPS</span>
              </button>
            )}
          </div>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5 hidden sm:block" />

          {/* Group 4: Surat & Sistem */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
            <button
              type="button"
              onClick={onOpenReplyEmail}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] transition-all cursor-pointer"
              title="Balas surat masuk via email & lampiran berkas"
            >
              <Mail size={13} className="text-slate-500 shrink-0" />
              <span>Balas Email</span>
            </button>

            <button
              type="button"
              onClick={onOpenDelete}
              className="flex items-center gap-1 p-1 px-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold text-[11px] transition-all cursor-pointer"
              title="Hapus permanen pengajuan"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Right: Expand / Collapse Toggle Button */}
        <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
          <span
            className={cn(
              "px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tight border",
              currentStatus === "DISETUJUI" || currentStatus === "SELESAI"
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300"
                : currentStatus === "DITOLAK"
                ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-300"
                : currentStatus === "PERLU_PERBAIKAN"
                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-900 dark:text-amber-300"
                : "bg-blue-50 dark:bg-blue-950/40 border-blue-300 text-blue-900 dark:text-blue-300"
            )}
          >
            {currentStatus === "PERLU_PERBAIKAN" ? "Perlu Tindakan" : currentStatus.replace(/_/g, " ")}
          </span>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-200 text-[11px] font-extrabold shadow-2xs transition-all cursor-pointer"
          >
            <Sliders size={12} className="text-emerald-600" />
            <span>{isExpanded ? "Tutup Rincian" : "Rincian Tools"}</span>
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* ── EXPANDED DETAILED PANEL (SLIDES DOWN ON TOGGLE) ── */}
      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-4 bg-white dark:bg-slate-900 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Rincian Panel Komponen Alur (Dynamic Flow Workbench)
              </h4>
              <p className="text-[11px] text-slate-500">
                Pilih aksi tahapan berikutnya. Setiap tindakan secara otomatis mencatat nama pemutus dan waktu keputusan pada log trail.
              </p>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1"
            >
              <span>Sembunyikan Panel</span>
              <ChevronUp size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Group 1: Komunikasi & Pemohon */}
            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  1. Komunikasi Pemohon
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={onOpenInvitePresentation}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 hover:border-emerald-500 hover:shadow-xs text-left flex items-start gap-2.5 transition-all group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Building2 size={15} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-slate-800 dark:text-white leading-tight">
                      Undang Instansi
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      Pemaparan presentasi instansi baru
                    </div>
                  </div>
                </button>

                {isDpsOrRs && (
                  <button
                    type="button"
                    onClick={onOpenInterview}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 hover:border-emerald-500 hover:shadow-xs text-left flex items-start gap-2.5 transition-all group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Users size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-slate-800 dark:text-white leading-tight">
                        Interview DPS
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {publicSub?.interviewInvitation
                          ? `Undangan Putaran-${publicSub.interviewInvitation.round || 1}`
                          : "Jadwalkan wawancara calon"}
                      </div>
                    </div>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onOpenReminder}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 hover:border-amber-500 hover:shadow-xs text-left flex items-start gap-2.5 transition-all group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <BellRing size={15} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-slate-800 dark:text-white leading-tight">
                      Kirim Pengingat
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      Follow-up respon + due date
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Group 2: Pembahasan Internal DSN */}
            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  2. Pembahasan Internal
                </span>
                <span className="w-2 h-2 rounded-full bg-blue-500" />
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={onOpenMeetingAgenda}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 hover:border-blue-500 hover:shadow-xs text-left flex items-start gap-2.5 transition-all group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <CalendarDays size={15} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-slate-800 dark:text-white leading-tight">
                      + Agenda Rapat Internal
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {meetingsCount > 0 ? `${meetingsCount} rapat terjadwal` : "Bahas surat masuk ini"}
                    </div>
                  </div>
                </button>

                <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <span className="font-bold block text-blue-900 dark:text-blue-300">
                    Multiple Flow Rapat
                  </span>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    Rapat dapat dibuat berkali-kali. Tersinkron ke menu <strong>Agenda</strong> dan tombol <strong>Notulensi</strong> di menu Notula.
                  </p>
                </div>
              </div>
            </div>

            {/* Group 3: Keputusan & Hasil Permohonan */}
            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  3. Keputusan & Hasil
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={onOpenApprove}
                  className={cn(
                    "w-full p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all group cursor-pointer",
                    isApproved
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                      : "bg-white dark:bg-slate-800 border-slate-200/90 dark:border-slate-700 hover:border-emerald-500 hover:shadow-xs"
                  )}
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform",
                      isApproved ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700"
                    )}
                  >
                    <CheckCircle2 size={15} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold leading-tight">
                      {isApproved ? "✓ Telah Disetujui" : "Setujui Pengajuan"}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {isApproved ? "Proses selesai" : "Selesaikan alur & buka upload"}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={onOpenReject}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 hover:border-rose-500 hover:shadow-xs text-left flex items-start gap-2.5 transition-all group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <AlertTriangle size={15} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-slate-800 dark:text-white leading-tight">
                      Tolak / Minta Revisi
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      Perbaikan berkas atau tolak
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={!isApproved}
                  onClick={onOpenUploadCert}
                  className={cn(
                    "w-full p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all group",
                    isApproved
                      ? "bg-white dark:bg-slate-800 border-slate-200/90 dark:border-slate-700 hover:border-emerald-500 hover:shadow-xs cursor-pointer"
                      : "bg-slate-100/80 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 opacity-60 cursor-not-allowed"
                  )}
                  title={!isApproved ? "Menu ini aktif setelah pengajuan disetujui" : "Upload dokumen hasil resmi"}
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                      isApproved
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-slate-200 text-slate-400 dark:bg-slate-700"
                    )}
                  >
                    {isApproved ? <FileBadge size={15} /> : <Lock size={14} />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-slate-800 dark:text-white leading-tight flex items-center gap-1.5">
                      <span>Upload Sertifikat / SK</span>
                      {!isApproved && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                          Terkunci
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {isApproved
                        ? hasCertificate
                          ? "Sertifikat terbit (Perbarui)"
                          : "Upload PDF sertifikat resmi"
                        : "Harus disetujui dahulu"}
                    </div>
                  </div>
                </button>

                {isDpsDoc && (
                  <button
                    type="button"
                    disabled={!isApproved}
                    onClick={onOpenSaveDps}
                    className={cn(
                      "w-full p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all group",
                      isApproved
                        ? "bg-white dark:bg-slate-800 border-slate-200/90 dark:border-slate-700 hover:border-sky-500 hover:shadow-xs cursor-pointer"
                        : "bg-slate-100/80 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 opacity-60 cursor-not-allowed"
                    )}
                    title={!isApproved ? "Khusus setelah rekomendasi disetujui" : "Simpan data calon ke tabel master"}
                  >
                    <div
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                        isApproved ? "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300" : "bg-slate-200 text-slate-400"
                      )}
                    >
                      <UserCheck size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-slate-800 dark:text-white leading-tight">
                        Simpan ke Master DPS
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {isApproved ? `Simpan ${candidatesCount} DPS ke DB` : "Terkunci (Belum disetujui)"}
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Group 4: Balas Email & Tindakan Sistem */}
            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  4. Aksi Surat & Sistem
                </span>
                <span className="w-2 h-2 rounded-full bg-slate-400" />
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={onOpenReplyEmail}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 hover:border-slate-400 hover:shadow-xs text-left flex items-start gap-2.5 transition-all group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Mail size={15} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-slate-800 dark:text-white leading-tight">
                      Balas Surat via Email
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      Respon umum & lampiran PDF
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={onOpenDelete}
                  className="w-full p-2.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100/80 dark:hover:bg-rose-900/30 text-left flex items-start gap-2.5 transition-all group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Trash2 size={15} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-rose-800 dark:text-rose-200 leading-tight">
                      Hapus Pengajuan
                    </div>
                    <div className="text-[10px] text-rose-600/80 dark:text-rose-400 truncate">
                      Hapus permanen berkas & data
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
