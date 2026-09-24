"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  CheckCircle2,
  Clock,
  Timer,
  ShieldCheck,
  Building2,
  CalendarCheck,
  CalendarDays,
  Award,
  FileBadge,
  Download,
  Eye,
  Video,
  MapPin,
  Users,
  AlertTriangle,
  ChevronRight,
  FileText,
  Send,
  Sparkles,
  ExternalLink,
  Plus,
  ArrowRight,
  Check,
  Layers,
  FileCheck,
  HelpCircle,
  Hash,
  Phone,
  User,
  Quote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getBaseUrl } from "@/lib/api";

const getBaseUrlSafe = () => {
  if (typeof window !== "undefined") return getBaseUrl();
  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002/api").replace("/api", "");
};

const getFileDownloadUrl = (rawUrl?: string) => {
  if (!rawUrl) return "#";
  let url = rawUrl;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `${getBaseUrlSafe()}/${rawUrl.replace(/^\//, "")}`;
  }
  const token = typeof window !== "undefined"
    ? localStorage.getItem("accessToken") ||
      (() => {
        try {
          return JSON.parse(localStorage.getItem("auth-storage") || "{}")?.state?.accessToken;
        } catch {
          return null;
        }
      })()
    : null;
  if (token && (url.includes("/api/") || url.includes("/documents/")) && !url.includes("token=")) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}token=${encodeURIComponent(token)}`;
  }
  return url;
};

const DEFAULT_DSN_OFFICE_ADDRESS =
  "Kantor DSN MUI Jl. Dempo No. 19 Pegangsaan, Menteng, Jakarta Pusat 10320";
const DEFAULT_SIGNATORY_NAME = "K.H. M. Cholil Nafis, Lc., Ph.D.";
const DEFAULT_SIGNATORY_ROLE = "Ketua DSN MUI";

interface ProcessDashboardTabProps {
  doc: any;
  publicSub: any;
  isRsDoc: boolean;
  isDpsDoc: boolean;
  isDpsOrRsDoc: boolean;
  slaStatus: any;
  candidatesList: any[];
  onOpenValidationModal: () => void;
  onOpenInterviewModal: () => void;
  onOpenAssessmentModal: () => void;
  onOpenUploadCertModal: () => void;
  onOpenCreateMeetingModal: () => void;
  onOpenInvitePresentationModal: () => void;
  onOpenApproveModal: () => void;
  onOpenRejectModal: () => void;
  onOpenReminderModal: () => void;
  onOpenReaderDoc: (docInfo: { title: string; fileUrl: string }) => void;
  onNavigateToTab: (tab: "permohonan" | "agenda" | "evidence" | "log") => void;
}

export const ProcessDashboardTab: React.FC<ProcessDashboardTabProps> = ({
  doc,
  publicSub,
  isRsDoc,
  isDpsDoc,
  isDpsOrRsDoc,
  slaStatus,
  candidatesList,
  onOpenValidationModal,
  onOpenInterviewModal,
  onOpenAssessmentModal,
  onOpenUploadCertModal,
  onOpenCreateMeetingModal,
  onOpenInvitePresentationModal,
  onOpenApproveModal,
  onOpenRejectModal,
  onOpenReminderModal,
  onOpenReaderDoc,
  onNavigateToTab,
}) => {
  const router = useRouter();

  const currentStatus = publicSub?.status || doc.status || "BARU";
  const currentDpsStage = publicSub?.dpsStage || "PROSES_PENGAJUAN";

  const isApproved =
    doc.status === "DISETUJUI" ||
    doc.status === "SELESAI" ||
    publicSub?.status === "DISETUJUI" ||
    publicSub?.status === "SELESAI" ||
    currentDpsStage === "LULUS";

  const isRejected = doc.status === "DITOLAK" || publicSub?.status === "DITOLAK" || currentDpsStage === "TIDAK_LULUS";
  const isRevisionNeeded = publicSub?.status === "PERLU_PERBAIKAN";

  // ── PARSE INTERVIEW ROUNDS DYNAMICALLY ──
  const interviewRounds: any[] = React.useMemo(() => {
    let rounds: any[] = [];
    if (publicSub?.interviewHistory) {
      if (Array.isArray(publicSub.interviewHistory)) {
        rounds = publicSub.interviewHistory;
      } else if (typeof publicSub.interviewHistory === "string") {
        try {
          rounds = JSON.parse(publicSub.interviewHistory);
        } catch {
          rounds = [];
        }
      }
    }
    if (rounds.length === 0 && publicSub?.interviewInvitation) {
      rounds = [publicSub.interviewInvitation];
    }
    return rounds;
  }, [publicSub]);

  const latestInterviewRound = interviewRounds.length > 0 ? interviewRounds[interviewRounds.length - 1] : null;
  const hasPendingAssessment = latestInterviewRound && !latestInterviewRound.assessment;
  const hasFailedAssessmentWithoutRetry =
    latestInterviewRound &&
    latestInterviewRound.assessment &&
    (latestInterviewRound.assessment.decision === 'DITOLAK' || latestInterviewRound.assessment.decision === 'PERLU_PERBAIKAN');

  const isProcessCompleted = Boolean(doc.shariaCertificate) || isRejected || (isApproved && doc.status === 'SELESAI');

  // Compute the single recommendation step (stops here)
  const recommendation = React.useMemo(() => {
    if (isProcessCompleted) return null;

    if (!publicSub?.validationType) {
      return {
        title: "Validasi Kelengkapan Dokumen & Persyaratan Administrasi",
        badge: "Rekomendasi Langkah Awal",
        description: "Berkas permohonan baru telah terdaftar. Lakukan pemeriksaan keabsahan dokumen legalitas instansi, surat permohonan resmi, serta berkas calon sebelum melangkah ke proses uji atau koordinasi berikutnya.",
        actionText: "Validasi Dokumen Sekarang",
        actionHandler: onOpenValidationModal,
        actionIcon: <ShieldCheck size={14} className="text-emerald-600" />,
        reason: "Pemeriksaan kelengkapan administrasi dan legalitas merupakan prasyarat awal tata kelola DSN-MUI.",
      };
    }

    if (isDpsOrRsDoc && interviewRounds.length === 0) {
      return {
        title: isRsDoc
          ? "Terbitkan Undangan Wawancara & Asesmen Rumah Sakit Syariah"
          : "Terbitkan Undangan Wawancara Calon DPS (Putaran Ke-1)",
        badge: "Rekomendasi Tahap Asesmen",
        description: "Dokumen administrasi telah tervalidasi. Langkah rekomendasi berikutnya adalah menerbitkan surat undangan resmi untuk uji kepatutan, kelayakan, dan pemaparan syariah kepada pihak pemohon.",
        actionText: "+ Buat Undangan Wawancara",
        actionHandler: onOpenInterviewModal,
        actionIcon: <CalendarCheck size={14} className="text-emerald-600" />,
        secondaryActionText: !publicSub?.presentationInvitation ? "+ Jadwalkan Presentasi" : undefined,
        secondaryActionHandler: !publicSub?.presentationInvitation ? onOpenInvitePresentationModal : undefined,
        reason: "Calon pengawas syariah atau manajemen rumah sakit perlu melalui sesi uji wawancara dan asesmen kompetensi syariah.",
      };
    }

    if (hasPendingAssessment) {
      return {
        title: `Input Penilaian Hasil Wawancara (Putaran Ke-${latestInterviewRound?.round || 1})`,
        badge: "Rekomendasi Penilaian",
        description: `Surat undangan wawancara telah terbit. Setelah sesi wawancara terlaksana, segera input formulir evaluasi, skor kompetensi, dan hasil asesmen calon.`,
        actionText: "Input Nilai Asesmen",
        actionHandler: onOpenAssessmentModal,
        actionIcon: <Award size={14} />,
        reason: "Penilaian hasil wawancara diperlukan sebagai dokumen dasar pertimbangan pada musyawarah pleno.",
      };
    }

    if (hasFailedAssessmentWithoutRetry) {
      const nextRoundNumber = (latestInterviewRound?.round || 1) + 1;
      return {
        title: `Jadwalkan Wawancara Ulang (Putaran Ke-${nextRoundNumber})`,
        badge: "Rekomendasi Tindak Lanjut",
        description: `Hasil asesmen putaran sebelumnya berstatus ${latestInterviewRound?.assessment?.decision}. Pemohon dapat diberikan kesempatan perbaikan kompetensi melalui penerbitan undangan wawancara putaran baru, atau langsung dibawa ke musyawarah pleno.`,
        actionText: `+ Terbitkan Undangan Wawancara Ke-${nextRoundNumber}`,
        actionHandler: onOpenInterviewModal,
        actionIcon: <CalendarCheck size={14} />,
        secondaryActionText: "Musyawarah Pleno BPH",
        secondaryActionHandler: onOpenApproveModal,
        reason: "Memberikan ruang perbaikan bagi calon yang belum memenuhi kriteria kelayakan atau menetapkan keputusan akhir.",
      };
    }

    if (!isApproved && !isRejected) {
      return {
        title: "Musyawarah Sidang Pleno BPH & Penetapan Keputusan Akhir",
        badge: "Rekomendasi Tahap Pleno",
        description: "Seluruh tahapan verifikasi berkas dan evaluasi wawancara telah selesai dilaksanakan. Bawa hasil permohonan ke Sidang Pleno Badan Pengurus Harian (BPH) DSN-MUI untuk penetapan keputusan persetujuan resmi atau penolakan.",
        actionText: "Setujui Permohonan",
        actionHandler: onOpenApproveModal,
        actionIcon: <CheckCircle2 size={14} />,
        secondaryActionText: "Tolak / Minta Revisi",
        secondaryActionHandler: onOpenRejectModal,
        reason: "Keputusan akhir rekomendasi syariah merupakan wewenang Sidang Pleno Badan Pengurus Harian DSN-MUI.",
      };
    }

    if (isApproved && !doc.shariaCertificate) {
      return {
        title: "Unggah Dokumen Sertifikat / SK Rekomendasi Resmi",
        badge: "Rekomendasi Tahap Final",
        description: "Permohonan telah disetujui resmi oleh BPH DSN-MUI. Langkah terakhir adalah mengunggah berkas digital PDF Sertifikat Kesesuaian Syariah atau Surat Keputusan Rekomendasi bertandatangan resmi untuk pemohon.",
        actionText: "Upload Sertifikat / SK",
        actionHandler: onOpenUploadCertModal,
        actionIcon: <FileBadge size={14} />,
        reason: "Pemohon membutuhkan dokumen sertifikat / SK rekomendasi resmi sebagai bukti legalitas syariah.",
      };
    }

    return null;
  }, [
    isProcessCompleted,
    publicSub,
    isDpsOrRsDoc,
    isRsDoc,
    interviewRounds,
    hasPendingAssessment,
    latestInterviewRound,
    hasFailedAssessmentWithoutRetry,
    isApproved,
    isRejected,
    doc.shariaCertificate,
    onOpenValidationModal,
    onOpenInterviewModal,
    onOpenInvitePresentationModal,
    onOpenAssessmentModal,
    onOpenApproveModal,
    onOpenRejectModal,
    onOpenUploadCertModal,
  ]);

  // Compute total real steps count
  const realStepsCount = React.useMemo(() => {
    let count = 1; // Registrasi selalu ada
    if (publicSub?.validationType) count++;
    if (publicSub?.presentationInvitation) count++;
    if (doc.meetings && doc.meetings.length > 0) count++;
    if (interviewRounds.length > 0) {
      interviewRounds.forEach((r) => {
        count++; // invitation
        if (r.assessment) count++; // assessment
      });
    }
    if (isApproved || isRejected) count++;
    if (doc.shariaCertificate) count++;
    return count;
  }, [publicSub, doc.meetings, doc.shariaCertificate, interviewRounds, isApproved, isRejected]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── 1. SLA & EXECUTIVE SUMMARY BANNER ── */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-[28px] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20 shrink-0">
              <Activity size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Dashboard Alur Proses & Evaluasi Permohonan</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pemantauan alur kerja terintegrasi dari registrasi berkas hingga penerbitan hasil resmi DSN-MUI.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-slate-400 font-bold hidden sm:inline">Status Permohonan:</span>
            <span
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border shadow-2xs flex items-center gap-1.5",
                isApproved
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300"
                  : isRejected
                  ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-300"
                  : isRevisionNeeded
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-900 dark:text-amber-300"
                  : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300"
              )}
            >
              <span className={cn(
                "w-2 h-2 rounded-full",
                isApproved ? "bg-emerald-500" : isRejected ? "bg-rose-500" : "bg-amber-500 animate-pulse"
              )} />
              <span>{isRevisionNeeded ? "Perlu Tindakan Pemohon" : currentStatus.replace(/_/g, " ")}</span>
            </span>
          </div>
        </div>

        {/* SLA Working Days Monitor Card */}
        {slaStatus.hasSla && (
          <div
            className={cn(
              "p-4 sm:p-5 rounded-2xl border space-y-3 transition-all",
              slaStatus.isCompleted
                ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100"
                : slaStatus.isOverdue
                ? "bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100"
                : "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100"
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-2xs shrink-0",
                    slaStatus.isCompleted
                      ? "bg-emerald-600"
                      : slaStatus.isOverdue
                      ? "bg-rose-600"
                      : "bg-emerald-600"
                  )}
                >
                  <Timer size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black uppercase tracking-wider">
                      Evaluasi SLA Batas Hari Kerja Permohonan
                    </h4>
                    <span
                      className={cn(
                        "text-[10px] font-black uppercase px-2 py-0.5 rounded-full border",
                        slaStatus.isCompleted
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950"
                          : slaStatus.isOverdue
                          ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 animate-pulse"
                          : "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950"
                      )}
                    >
                      {slaStatus.label}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-75 mt-0.5">
                    {slaStatus.subLabel} • Standar Layanan: 14 Hari Kerja (Senin–Jumat)
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="text-xs font-mono font-black">
                  {slaStatus.isCompleted
                    ? `✓ Selesai (${slaStatus.workingDaysElapsed} Hari Kerja)`
                    : `${slaStatus.workingDaysElapsed} dari 14 Hari Kerja Terlewati`}
                </span>
              </div>
            </div>

            {/* SLA Progress Bar */}
            <div className="w-full bg-slate-200/80 dark:bg-slate-700/60 rounded-full h-2 overflow-hidden p-0.5">
              <div
                className={cn(
                  "h-full transition-all duration-500 rounded-full",
                  slaStatus.isCompleted
                    ? "bg-emerald-600"
                    : slaStatus.isOverdue
                    ? "bg-rose-600"
                    : slaStatus.percentUsed > 75
                    ? "bg-amber-500"
                    : "bg-emerald-600"
                )}
                style={{ width: `${Math.min(100, slaStatus.percentUsed)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── 2. PROFESSIONAL VERTICAL PROCESS PIPELINE (REAL DYNAMIC FLOW) ── */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[28px] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-7">
        
        {/* Pipeline Header with Step Counter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Alur Tahapan Proses Permohonan (Real Flow)
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Menampilkan riwayat proses yang telah terlaksana secara aktual (log dinamis) beserta rekomendasi langkah selanjutnya.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200">
              <Layers size={14} className="text-emerald-600" />
              <span>
                Riwayat Riil: <strong className="text-emerald-700 dark:text-emerald-400">{realStepsCount} Langkah</strong>
              </span>
            </div>
            {recommendation && (
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                <Sparkles size={13} className="text-emerald-600 animate-pulse" />
                <span>+ 1 Rekomendasi</span>
              </div>
            )}
          </div>
        </div>

        {/* ── CONTINUOUS VERTICAL PIPELINE TIMELINE ── */}
        <div className="relative">
          
          {/* Central Connecting Stem Line */}
          <div className="absolute left-[20px] sm:left-[24px] top-6 bottom-10 w-0.5 bg-gradient-to-b from-emerald-500 via-emerald-400 to-slate-200 dark:to-slate-800" />

          <div className="space-y-6">
            {(() => {
              let currentStepIdx = 0;

              return (
                <>
                  {/* ══════════════════════════════════════════════════════════════════
                      REAL STEP 1: PENERIMAAN & REGISTRASI BERKAS
                  ══════════════════════════════════════════════════════════════════ */}
                  {(() => {
                    const stepNum = ++currentStepIdx;
                    return (
                      <div className="relative flex items-start gap-4 sm:gap-6 group">
                        {/* Step Node */}
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-emerald-600/20 ring-4 ring-white dark:ring-slate-900 shrink-0 z-10 transition-transform duration-200 group-hover:scale-105">
                          <CheckCircle2 size={20} />
                        </div>

                        {/* Step Card */}
                        <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/80 transition-all shadow-xs p-5 sm:p-6 space-y-4">
                          
                          {/* Header Row */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2.5">
                              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                                Tahap {stepNum}
                              </span>
                              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                                Penerimaan & Registrasi Berkas Permohonan
                              </h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                                <Check size={12} /> Selesai
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">
                                {new Date(publicSub?.submittedAt || doc.receivedDate || doc.createdAt).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            Surat permohonan resmi dan berkas persyaratan telah diterima secara resmi oleh DSN-MUI dari pemohon <strong className="text-slate-900 dark:text-white">{publicSub?.companyName || publicSub?.company?.name || doc.sender}</strong>.
                          </p>

                          {/* Metadata Data Chips */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <Hash size={11} className="text-emerald-600" />
                                No. Tiket Pengajuan
                              </span>
                              <p className="font-mono text-xs font-black text-slate-900 dark:text-white truncate">
                                {publicSub?.ticketNumber || doc.letterNumber || "AMN-2026"}
                              </p>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <FileText size={11} className="text-emerald-600" />
                                No. Surat Perusahaan
                              </span>
                              <p className="font-mono text-xs font-black text-slate-900 dark:text-white truncate">
                                {doc.letterNumber || publicSub?.companyLetterNumber || "—"}
                              </p>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <User size={11} className="text-emerald-600" />
                                Kontak PIC Pemohon
                              </span>
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {publicSub?.picName || "PIC Instansi"} {publicSub?.picPhone ? `(${publicSub.picPhone})` : ""}
                              </p>
                            </div>
                          </div>

                          {/* Footer Action Bar */}
                          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-t border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500 text-[11px]">
                              Seluruh berkas fisik/digital lampiran dapat diakses pada tab bukti lampiran.
                            </span>
                            <button
                              type="button"
                              onClick={() => onNavigateToTab("evidence")}
                              className="font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                            >
                              <Eye size={14} />
                              <span>Buka Berkas di Tab Lampiran</span>
                              <ArrowRight size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ══════════════════════════════════════════════════════════════════
                      REAL STEP 2: VALIDASI KELENGKAPAN DOKUMEN (JIKA SUDAH DIVALIDASI)
                  ══════════════════════════════════════════════════════════════════ */}
                  {publicSub?.validationType && (() => {
                    const stepNum = ++currentStepIdx;
                    return (
                      <div className="relative flex items-start gap-4 sm:gap-6 group">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-emerald-600/20 ring-4 ring-white dark:ring-slate-900 shrink-0 z-10 transition-transform duration-200 group-hover:scale-105">
                          <ShieldCheck size={20} />
                        </div>

                        <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/80 transition-all shadow-xs p-5 sm:p-6 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2.5">
                              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                                Tahap {stepNum}
                              </span>
                              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                                Validasi Kelengkapan Dokumen & Persyaratan Administrasi
                              </h4>
                            </div>
                            <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border self-start sm:self-auto bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300">
                              Tervalidasi: {publicSub.validationType}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            Pemeriksaan keabsahan dokumen legalitas perusahaan, rekomendasi MUI setempat, sertifikat kompetensi DPS, serta kelengkapan administrasi telah diverifikasi oleh tim DSN-MUI.
                          </p>

                          <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 text-xs space-y-1.5">
                            <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-extrabold">
                              <CheckCircle2 size={15} className="text-emerald-600" />
                              <span>
                                Kategori Pengesahan:{" "}
                                {publicSub.validationType === "BARU"
                                  ? "Rekomendasi DPS Baru"
                                  : publicSub.validationType === "PAW"
                                  ? "Pergantian Antar Waktu (PAW)"
                                  : "Penetapan Keberlanjutan"}
                              </span>
                            </div>
                            {publicSub.validationNotes && (
                              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed pl-6 italic">
                                &ldquo;{publicSub.validationNotes}&rdquo;
                              </p>
                            )}
                          </div>

                          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[11px] text-slate-500 font-medium">
                              {candidatesList.length > 0 ? `${candidatesList.length} Calon DPS diajukan dan terdata.` : "Dokumen persyaratan permohonan telah lengkap."}
                            </span>
                            <button
                              type="button"
                              onClick={onOpenValidationModal}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-2xs self-start sm:self-auto flex items-center gap-1.5"
                            >
                              <ShieldCheck size={14} className="text-emerald-600" />
                              <span>Ubah Validasi Dokumen</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ══════════════════════════════════════════════════════════════════
                      REAL STEP 3: PEMAPARAN PROFIL & PRESENTASI (JIKA ADA UNDANGAN)
                  ══════════════════════════════════════════════════════════════════ */}
                  {publicSub?.presentationInvitation && (() => {
                    const stepNum = ++currentStepIdx;
                    const pres = publicSub.presentationInvitation;
                    return (
                      <div className="relative flex items-start gap-4 sm:gap-6 group">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-emerald-600/20 ring-4 ring-white dark:ring-slate-900 shrink-0 z-10 transition-transform duration-200 group-hover:scale-105">
                          <Building2 size={20} />
                        </div>

                        <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/80 transition-all shadow-xs p-5 sm:p-6 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2.5">
                              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                                Tahap {stepNum}
                              </span>
                              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                                Pemaparan Profil & Presentasi Instansi Pemohon
                              </h4>
                            </div>
                            <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border self-start sm:self-auto bg-emerald-100 text-emerald-800 dark:bg-emerald-950 border-emerald-300">
                              Jadwal Terbit
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            Sesi pemaparan profil dan kesiapan operasional syariah oleh instansi pemohon kepada tim DSN-MUI.
                          </p>

                          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Tanggal & Waktu</span>
                                <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">
                                  {new Date(pres.presentationDate).toLocaleDateString("id-ID", {
                                    weekday: "short",
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </p>
                                <p className="text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                                  {pres.presentationTime} WIB
                                </p>
                              </div>

                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Metode Presentasi</span>
                                <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">
                                  {pres.format === "ONLINE" ? "Online via Zoom" : "Tatap Muka (Offline)"}
                                </p>
                                {pres.zoomUrl ? (
                                  <a
                                    href={pres.zoomUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-emerald-600 hover:underline text-[11px] font-bold flex items-center gap-1 mt-0.5"
                                  >
                                    <Video size={12} /> Buka Tautan Zoom
                                  </a>
                                ) : (
                                  <p className="text-[11px] text-slate-500 mt-0.5">
                                    {pres.venue || DEFAULT_DSN_OFFICE_ADDRESS}
                                  </p>
                                )}
                              </div>

                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Narahubung</span>
                                <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">
                                  {pres.picName || "Sekretariat DSN-MUI"}
                                </p>
                              </div>
                            </div>

                            {pres.agendaNotes && (
                              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
                                <strong>Materi Agenda:</strong> &ldquo;{pres.agendaNotes}&rdquo;
                              </div>
                            )}
                          </div>

                          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[11px] text-slate-500">
                              Undangan presentasi resmi telah terbit dan tersimpan.
                            </span>
                            <button
                              type="button"
                              onClick={onOpenInvitePresentationModal}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-2xs self-start sm:self-auto flex items-center gap-1.5"
                            >
                              <CalendarCheck size={14} className="text-emerald-600" />
                              <span>Ubah Jadwal Presentasi</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ══════════════════════════════════════════════════════════════════
                      REAL STEP 4: PEMBAHASAN RAPAT INTERNAL (JIKA ADA RAPAT TERDAFTAR)
                  ══════════════════════════════════════════════════════════════════ */}
                  {doc.meetings && doc.meetings.length > 0 && (() => {
                    const stepNum = ++currentStepIdx;
                    return (
                      <div className="relative flex items-start gap-4 sm:gap-6 group">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-emerald-600/20 ring-4 ring-white dark:ring-slate-900 shrink-0 z-10 transition-transform duration-200 group-hover:scale-105">
                          <CalendarDays size={20} />
                        </div>

                        <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/80 transition-all shadow-xs p-5 sm:p-6 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2.5">
                              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                                Tahap {stepNum}
                              </span>
                              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                                Pembahasan Agenda Rapat Internal DSN-MUI
                              </h4>
                            </div>
                            <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border self-start sm:self-auto bg-emerald-100 text-emerald-800 dark:bg-emerald-950 border-emerald-300">
                              {doc.meetings.length} Rapat Terjadwal
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            Rapat internal DSN-MUI untuk membahas substansi surat permohonan. Setiap sesi rapat tersinkronisasi ke modul Agenda dan Notula.
                          </p>

                          <div className="space-y-2.5">
                            {doc.meetings.map((m: any, mIdx: number) => (
                              <div
                                key={m.id || mIdx}
                                className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                              >
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                                      {m.agendaNumber || `RAPAT #${mIdx + 1}`}
                                    </span>
                                    <span className="font-extrabold text-slate-900 dark:text-white truncate">
                                      {m.title}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                                    <span className="flex items-center gap-1">
                                      <Clock size={12} className="text-emerald-600" />
                                      {new Date(m.dateTime).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}, {new Date(m.dateTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MapPin size={12} className="text-emerald-600" />
                                      {m.location || DEFAULT_DSN_OFFICE_ADDRESS}
                                    </span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => router.push(`/notula?createFromMeetingId=${m.id}`)}
                                  className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/80 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0 self-start sm:self-auto"
                                >
                                  <FileText size={13} />
                                  <span>Notulensi Rapat</span>
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                            <button
                              type="button"
                              onClick={() => onNavigateToTab("agenda")}
                              className="text-xs font-bold text-slate-500 hover:text-emerald-600 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                            >
                              <CalendarDays size={14} className="text-emerald-600" />
                              <span>Lihat Tab Agenda ({doc.meetings.length})</span>
                              <ArrowRight size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={onOpenCreateMeetingModal}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-2xs self-start sm:self-auto flex items-center gap-1.5"
                            >
                              <Plus size={14} className="text-emerald-600" />
                              <span>+ Tambah Agenda Rapat</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ══════════════════════════════════════════════════════════════════
                      REAL STEP 5+: SESI WAWANCARA & ASESMEN (MULTI-PUTARAN AKTUAL)
                  ══════════════════════════════════════════════════════════════════ */}
                  {interviewRounds.map((rnd: any, rIdx: number) => {
                    const roundNum = rnd.round || rIdx + 1;
                    const invStepNum = ++currentStepIdx;
                    const assessStepNum = rnd.assessment ? ++currentStepIdx : null;

                    const effectiveVenue = rnd.format === "ONLINE"
                      ? "Online via Zoom Meeting DSN-MUI"
                      : (rnd.venue?.includes("Proklamasi") || rnd.venue?.includes("Gedung MUI") || rnd.venue?.includes("Ruang Rapat Pleno")
                          ? DEFAULT_DSN_OFFICE_ADDRESS
                          : (rnd.venue || DEFAULT_DSN_OFFICE_ADDRESS));

                    const effectiveSignatoryName =
                      rnd.signatoryName && !rnd.signatoryName.includes("Hasanuddin")
                        ? rnd.signatoryName
                        : DEFAULT_SIGNATORY_NAME;

                    const effectiveSignatoryRole =
                      rnd.signatoryRole && !rnd.signatoryRole.includes("Pengawasan") && !rnd.signatoryRole.includes("DSN-MUI")
                        ? rnd.signatoryRole
                        : DEFAULT_SIGNATORY_ROLE;

                    return (
                      <React.Fragment key={`interview-round-${roundNum}-${rIdx}`}>
                        {/* ── Sub-Tahap A: Undangan Wawancara Putaran Ke-R ── */}
                        <div className="relative flex items-start gap-4 sm:gap-6 group">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-emerald-600/20 ring-4 ring-white dark:ring-slate-900 shrink-0 z-10 transition-transform duration-200 group-hover:scale-105">
                            <Users size={20} />
                          </div>

                          <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/80 transition-all shadow-xs p-5 sm:p-6 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                              <div className="flex items-center gap-2.5">
                                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                                  Tahap {invStepNum}
                                </span>
                                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                                  {isRsDoc
                                    ? `Undangan Asesmen Rumah Sakit Syariah (Putaran Ke-${roundNum})`
                                    : `Undangan Wawancara Calon DPS (Putaran Ke-${roundNum})`}
                                </h4>
                              </div>
                              <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border self-start sm:self-auto bg-emerald-100 text-emerald-800 dark:bg-emerald-950 border-emerald-300">
                                Undangan Terbit (Putaran {roundNum})
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              Surat undangan resmi diterbitkan untuk pelaksanaan uji kepatutan, kelayakan kompetensi fikih muamalah, dan regulasi tata kelola syariah.
                            </p>

                            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700 pb-2 text-xs">
                                <span className="font-extrabold text-slate-900 dark:text-white font-mono">
                                  {rnd.invitationNumber || `UND-WW/DSN-MUI/2026/R${roundNum}`}
                                </span>
                                <span className="text-slate-500 font-mono text-[11px]">
                                  Pelaksanaan: {rnd.interviewDayDate}, {rnd.interviewTime} WIB
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Metode & Tempat</span>
                                  <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">
                                    {rnd.format === "ONLINE" ? "Online via Zoom" : rnd.format === "HYBRID" ? "Hybrid (Tatap Muka & Zoom)" : "Tatap Muka (Offline)"}
                                  </p>
                                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                    {effectiveVenue}
                                  </p>
                                  {rnd.zoomUrl && (
                                    <a
                                      href={rnd.zoomUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-emerald-600 hover:underline text-[11px] font-bold flex items-center gap-1 mt-1"
                                    >
                                      <Video size={12} /> Buka Tautan Zoom
                                    </a>
                                  )}
                                </div>

                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Peserta Wawancara</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {(rnd.candidates || []).map((cand: string, cIdx: number) => (
                                      <span key={cIdx} className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200/60">
                                        {cand}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Penandatangan Resmi</span>
                                  <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">
                                    {effectiveSignatoryName}
                                  </p>
                                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                                    {effectiveSignatoryRole}
                                  </p>
                                </div>
                              </div>

                              {(rnd.outgoingLetterNumber || rnd.outgoingLetterId) && (
                                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3 bg-amber-50/50 dark:bg-amber-950/20 -mx-4 -mb-3 px-4 py-2.5 rounded-b-xl">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileText size={14} className="text-amber-600 shrink-0" />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 shrink-0">
                                      Surat Keluar Terlampir:
                                    </span>
                                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                      {rnd.outgoingLetterNumber || "Surat Keluar DSN-MUI"}
                                    </span>
                                    {rnd.outgoingLetterTitle && (
                                      <span className="text-xs text-slate-500 truncate hidden sm:inline">
                                        — {rnd.outgoingLetterTitle}
                                      </span>
                                    )}
                                  </div>
                                  {rnd.outgoingLetterId ? (
                                    <a
                                      href={`/surat-keluar/${rnd.outgoingLetterId}`}
                                      className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 shrink-0"
                                    >
                                      <span>Lihat Surat</span>
                                      <ExternalLink size={12} />
                                    </a>
                                  ) : rnd.outgoingLetterFileUrl ? (
                                    <a
                                      href={getFileDownloadUrl(rnd.outgoingLetterFileUrl)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 shrink-0"
                                    >
                                      <Download size={12} />
                                      <span>Unduh Dokumen</span>
                                    </a>
                                  ) : null}
                                </div>
                              )}
                            </div>

                            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                              <span className="text-[11px] text-slate-500">
                                Detail surat undangan putaran ke-{roundNum} tersimpan dalam sistem.
                              </span>
                              <div className="flex items-center gap-2 self-start sm:self-auto">
                                <button
                                  type="button"
                                  onClick={onOpenInterviewModal}
                                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                                >
                                  <CalendarCheck size={14} className="text-emerald-600" />
                                  <span>Ubah Undangan</span>
                                </button>
                                {!rnd.assessment && (
                                  <button
                                    type="button"
                                    onClick={onOpenAssessmentModal}
                                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                                  >
                                    <Award size={14} />
                                    <span>Input Nilai Asesmen</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ── Sub-Tahap B: Penilaian Hasil Wawancara Putaran Ke-R (Hanya jika sudah dinilai) ── */}
                        {rnd.assessment && assessStepNum && (
                          <div className="relative flex items-start gap-4 sm:gap-6 group">
                            <div className={cn(
                              "w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-md ring-4 ring-white dark:ring-slate-900 shrink-0 z-10 transition-transform duration-200 group-hover:scale-105",
                              rnd.assessment.decision === "DITERIMA"
                                ? "bg-emerald-600 text-white shadow-emerald-600/20"
                                : "bg-rose-600 text-white shadow-rose-600/20"
                            )}>
                              <Award size={20} />
                            </div>

                            <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/80 transition-all shadow-xs p-5 sm:p-6 space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-2.5">
                                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                                    Tahap {assessStepNum}
                                  </span>
                                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                                    Penilaian Hasil Wawancara (Putaran Ke-{roundNum})
                                  </h4>
                                </div>
                                <span className={cn(
                                  "px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border self-start sm:self-auto",
                                  rnd.assessment.decision === "DITERIMA"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 border-emerald-300"
                                    : "bg-rose-100 text-rose-800 dark:bg-rose-950 border-rose-300"
                                )}>
                                  {rnd.assessment.decision === "DITERIMA"
                                    ? "Diterima / Lulus Asesmen"
                                    : rnd.assessment.decision === "DITOLAK"
                                    ? "Ditolak / Belum Memenuhi"
                                    : "Perlu Perbaikan"}
                                </span>
                              </div>

                              <div className={cn(
                                "p-4 rounded-xl border space-y-2 text-xs",
                                rnd.assessment.decision === "DITERIMA"
                                  ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                                  : "bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800"
                              )}>
                                <div className="flex items-center justify-between font-bold">
                                  <span className="text-slate-900 dark:text-white">
                                    Asesor Penilai: <strong>{rnd.assessment.assessedByName || "Tim Asesor DSN-MUI"}</strong>
                                  </span>
                                  <span className="font-mono text-sm px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border font-black text-emerald-800 dark:text-emerald-300">
                                    Skor: {rnd.assessment.score} / 100
                                  </span>
                                </div>
                                {rnd.assessment.notes && (
                                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                                    <strong>Catatan Evaluasi:</strong> &ldquo;{rnd.assessment.notes}&rdquo;
                                  </p>
                                )}
                                {rnd.assessment.improvementNotes && (
                                  <p className="text-rose-700 dark:text-rose-300 text-[11px] leading-relaxed font-semibold">
                                    <strong>Arahan Perbaikan:</strong> &ldquo;{rnd.assessment.improvementNotes}&rdquo;
                                  </p>
                                )}
                              </div>

                              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                                <span className="text-[11px] text-slate-500">
                                  Hasil asesmen putaran ke-{roundNum} tercatat resmi.
                                </span>
                                <button
                                  type="button"
                                  onClick={onOpenAssessmentModal}
                                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-2xs self-start sm:self-auto flex items-center gap-1.5"
                                >
                                  <Award size={14} className="text-emerald-600" />
                                  <span>Ubah Nilai Asesmen</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {/* ══════════════════════════════════════════════════════════════════
                      REAL STEP: SIDANG PLENO BPH & KEPUTUSAN AKHIR (JIKA SUDAH DISETUJUI/DITOLAK)
                  ══════════════════════════════════════════════════════════════════ */}
                  {(isApproved || isRejected) && (() => {
                    const stepNum = ++currentStepIdx;
                    return (
                      <div className="relative flex items-start gap-4 sm:gap-6 group">
                        <div className={cn(
                          "w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-md ring-4 ring-white dark:ring-slate-900 shrink-0 z-10 transition-transform duration-200 group-hover:scale-105",
                          isApproved ? "bg-emerald-600 text-white shadow-emerald-600/20" : "bg-rose-600 text-white shadow-rose-600/20"
                        )}>
                          <Award size={20} />
                        </div>

                        <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/80 transition-all shadow-xs p-5 sm:p-6 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2.5">
                              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                                Tahap {stepNum}
                              </span>
                              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                                Sidang Pleno BPH & Keputusan Akhir DSN-MUI
                              </h4>
                            </div>
                            <span className={cn(
                              "px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border self-start sm:self-auto",
                              isApproved
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 border-emerald-300"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-950 border-rose-300"
                            )}>
                              {isApproved ? "Disetujui Resmi" : "Permohonan Ditolak"}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {isApproved
                              ? "Musyawarah Sidang Pleno Badan Pengurus Harian (BPH) DSN-MUI telah menetapkan keputusan persetujuan rekomendasi syariah secara resmi."
                              : "Musyawarah Sidang Pleno Badan Pengurus Harian (BPH) DSN-MUI menetapkan penolakan permohonan karena belum memenuhi regulasi atau fatwa terkait."}
                          </p>

                          {isApproved && (
                            <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
                              <span className="font-extrabold text-emerald-900 dark:text-emerald-200 block">
                                ✓ Permohonan Telah Disetujui Resmi
                              </span>
                              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                                Pengajuan dinyatakan memenuhi seluruh ketentuan fatwa dan regulasi DSN-MUI.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* ══════════════════════════════════════════════════════════════════
                      REAL STEP: PENERBITAN SERTIFIKAT RESMI (JIKA SUDAH ADA SERTIFIKAT)
                  ══════════════════════════════════════════════════════════════════ */}
                  {doc.shariaCertificate && (() => {
                    const stepNum = ++currentStepIdx;
                    return (
                      <div className="relative flex items-start gap-4 sm:gap-6 group">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-emerald-600/20 ring-4 ring-white dark:ring-slate-900 shrink-0 z-10 transition-transform duration-200 group-hover:scale-105">
                          <FileBadge size={20} />
                        </div>

                        <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/80 transition-all shadow-xs p-5 sm:p-6 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2.5">
                              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                                Tahap {stepNum} (Hasil Akhir)
                              </span>
                              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                                Penerbitan Sertifikat / Surat Keputusan Rekomendasi Resmi
                              </h4>
                            </div>
                            <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border self-start sm:self-auto bg-emerald-100 text-emerald-800 dark:bg-emerald-950 border-emerald-300">
                              Sertifikat Terbit
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            Dokumen digital resmi Sertifikat Kesesuaian Syariah atau Surat Keputusan Rekomendasi bertandatangan resmi DSN-MUI telah terbit.
                          </p>

                          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="space-y-1 min-w-0">
                              <span className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-md">
                                {doc.shariaCertificate.certificateNumber || "Sertifikat Resmi"}
                              </span>
                              <p className="font-extrabold text-slate-900 dark:text-white pt-1 truncate">
                                {doc.shariaCertificate.title}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Masa Berlaku: {doc.shariaCertificate.validUntil ? new Date(doc.shariaCertificate.validUntil).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "3 Tahun"}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {doc.shariaCertificate.fileUrl && (
                                <a
                                  href={getFileDownloadUrl(doc.shariaCertificate.fileUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                                >
                                  <Download size={14} />
                                  <span>Unduh PDF</span>
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={onOpenUploadCertModal}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 transition-colors"
                              >
                                Perbarui
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ══════════════════════════════════════════════════════════════════
                      SATU LANGKAH REKOMENDASI SELANJUTNYA (STOP DI SINI)
                  ══════════════════════════════════════════════════════════════════ */}
                  {recommendation && (
                    <div className="relative flex items-start gap-4 sm:gap-6 group animate-in fade-in slide-in-from-top-3 duration-300">
                      {/* Node Rekomendasi */}
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-teal-500 via-emerald-600 to-emerald-700 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-emerald-600/30 ring-4 ring-emerald-500/20 shrink-0 z-10 animate-pulse">
                        <Sparkles size={20} />
                      </div>

                      {/* Card Rekomendasi */}
                      <div className="flex-1 rounded-2xl border-2 border-dashed border-emerald-500/80 bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-white dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-slate-900 shadow-sm hover:shadow-md transition-all p-5 sm:p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 dark:border-emerald-800/60 pb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
                              {recommendation.badge}
                            </span>
                            <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{recommendation.title}</span>
                            </h4>
                          </div>
                          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 self-start sm:self-auto">
                            <Sparkles size={11} className="text-emerald-600" />
                            Rekomendasi Sistem
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                          {recommendation.description}
                        </p>

                        <div className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-emerald-200/80 dark:border-emerald-800/60 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200">
                            <Sparkles size={13} className="text-emerald-600" />
                            <span>Alasan Rekomendasi:</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                            {recommendation.reason}
                          </p>
                        </div>

                        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-emerald-200/60 dark:border-slate-800">
                          <p className="text-[11px] text-slate-500 italic">
                            Admin bebas menentukan alur kerja selanjutnya secara dinamis. Anda dapat menggunakan tombol aksi berikut atau memilih workflow tools lainnya pada toolbar navigasi di atas.
                          </p>
                          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                            {recommendation.secondaryActionText && recommendation.secondaryActionHandler && (
                              <button
                                type="button"
                                onClick={recommendation.secondaryActionHandler}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
                              >
                                {recommendation.secondaryActionText}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={recommendation.actionHandler}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                            >
                              {recommendation.actionIcon}
                              <span>{recommendation.actionText}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ══════════════════════════════════════════════════════════════════
                      SELESAI (JIKA SUDAH SELESAI SELURUHNYA)
                  ══════════════════════════════════════════════════════════════════ */}
                  {isProcessCompleted && (
                    <div className="relative flex items-center gap-4 sm:gap-6 pt-2">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md ring-4 ring-white dark:ring-slate-900 shrink-0 z-10">
                        <CheckCircle2 size={20} />
                      </div>
                      <div className="flex-1 p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <span>Seluruh rangkaian proses permohonan telah selesai dilaksanakan secara resmi. Dokumen dan sertifikat telah tersimpan.</span>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

