"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Send,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Video,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Trash2,
  Mail,
  Paperclip,
  UserCheck,
  Award,
  BellRing,
  HelpCircle,
  FileText,
  Users,
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// 1. MODAL UNDANG PRESENTASI (INSTANSI / LEMBAGA PEMOHON)
// ─────────────────────────────────────────────────────────────────────────────
interface InvitePresentationModalProps {
  documentId: string;
  submissionNumber?: string;
  companyName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const InvitePresentationModal: React.FC<InvitePresentationModalProps> = ({
  documentId,
  submissionNumber,
  companyName,
  onClose,
  onSuccess,
}) => {
  const [presentationDate, setPresentationDate] = useState<string>("");
  const [presentationTime, setPresentationTime] = useState<string>("09:30 WIB");
  const [format, setFormat] = useState<"ONLINE" | "OFFLINE">("ONLINE");
  const [venue, setVenue] = useState<string>(
    "Kantor DSN MUI Jl. Dempo No. 19 Pegangsaan, Menteng, Jakarta Pusat 10320"
  );
  const [zoomUrl, setZoomUrl] = useState<string>("");
  const [zoomMeetingId, setZoomMeetingId] = useState<string>("");
  const [zoomPasscode, setZoomPasscode] = useState<string>("");
  const [picName, setPicName] = useState<string>("Sekretariat DSN-MUI");
  const [agendaNotes, setAgendaNotes] = useState<string>(
    "Pemaparan profil instansi, profil bisnis / operasional syariah, dan penjelasan maksud permohonan."
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presentationDate) {
      setErrorMessage("Silakan pilih tanggal pelaksanaan presentasi.");
      return;
    }
    if (format === "ONLINE" && !zoomUrl) {
      setErrorMessage("Tautan Zoom / Google Meet wajib diisi untuk format daring.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await api.post(`/documents/${documentId}/invite-presentation`, {
        presentationDate,
        presentationTime,
        format,
        venue: format === "OFFLINE" ? venue : undefined,
        zoomUrl: format === "ONLINE" ? zoomUrl : undefined,
        zoomMeetingId: format === "ONLINE" ? zoomMeetingId : undefined,
        zoomPasscode: format === "ONLINE" ? zoomPasscode : undefined,
        picName,
        agendaNotes,
      });
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Gagal mengirim undangan presentasi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between"
             style={{ background: "linear-gradient(135deg, #064E3B 0%, #065F46 100%)" }}>
          <div className="text-white space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-white/20">
                <Building2 size={18} />
              </span>
              <h3 className="font-extrabold text-base">Undang Presentasi Instansi / Lembaga</h3>
            </div>
            <p className="text-xs text-emerald-100/90 font-medium">
              Kirim undangan resmi untuk pemohon (pemohon baru) guna memaparkan profil dan permohonan.
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-xs flex items-center justify-between">
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Instansi Dituju:</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">{companyName || "Instansi Pemohon"}</span>
            </div>
            {submissionNumber && (
              <span className="font-mono font-bold text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-xl">
                Tiket: {submissionNumber}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Tanggal Presentasi <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={presentationDate}
                onChange={(e) => setPresentationDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Waktu Pelaksanaan
              </label>
              <input
                type="text"
                placeholder="Contoh: 09:30 - 11:30 WIB"
                value={presentationTime}
                onChange={(e) => setPresentationTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Metode Presentasi
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat("ONLINE")}
                className={cn(
                  "p-3 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer",
                  format === "ONLINE"
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                )}
              >
                <Video size={16} />
                <span>Online (Zoom / Meet)</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat("OFFLINE")}
                className={cn(
                  "p-3 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer",
                  format === "OFFLINE"
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                )}
              >
                <MapPin size={16} />
                <span>Tatap Muka (Offline)</span>
              </button>
            </div>
          </div>

          {format === "ONLINE" ? (
            <div className="space-y-3 p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Tautan Pertemuan Virtual (URL) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  placeholder="https://zoom.us/j/... atau https://meet.google.com/..."
                  value={zoomUrl}
                  onChange={(e) => setZoomUrl(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Meeting ID (Opsional)
                  </label>
                  <input
                    type="text"
                    value={zoomMeetingId}
                    onChange={(e) => setZoomMeetingId(e.target.value)}
                    placeholder="812 3456 7890"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Passcode (Opsional)
                  </label>
                  <input
                    type="text"
                    value={zoomPasscode}
                    onChange={(e) => setZoomPasscode(e.target.value)}
                    placeholder="123456"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Lokasi Ruang / Tempat Pertemuan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Catatan / Agenda Paparan Presentasi
            </label>
            <textarea
              rows={3}
              value={agendaNotes}
              onChange={(e) => setAgendaNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-md hover:opacity-95 transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #006633 0%, #1B7F4A 100%)" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Mengirim Undangan...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Kirim Undangan Presentasi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. MODAL SETUJUI PENGAJUAN (APPROVAL)
// ─────────────────────────────────────────────────────────────────────────────
interface ApproveSubmissionModalProps {
  documentId: string;
  submissionTitle: string;
  submissionNumber?: string;
  companyName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ApproveSubmissionModal: React.FC<ApproveSubmissionModalProps> = ({
  documentId,
  submissionTitle,
  submissionNumber,
  companyName,
  onClose,
  onSuccess,
}) => {
  const [approvalNotes, setApprovalNotes] = useState<string>(
    "Permohonan telah ditelaah dan disetujui secara resmi oleh DSN-MUI. Proses permohonan selesai dan siap untuk penerbitan/upload sertifikat hasil."
  );
  const [decisionNumber, setDecisionNumber] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await api.post(`/documents/${documentId}/approve-submission`, {
        approvalNotes,
        decisionNumber: decisionNumber.trim() || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Gagal menyetujui pengajuan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between"
             style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)" }}>
          <div className="text-white space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-white/20">
                <CheckCircle2 size={18} />
              </span>
              <h3 className="font-extrabold text-base">Setujui Permohonan (Penyelesaian)</h3>
            </div>
            <p className="text-xs text-emerald-100/90 font-medium">
              Menyetujui pengajuan ini dan mengaktifkan fitur upload sertifikat / SK hasil.
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Konfirmasi Persetujuan Pengajuan
            </span>
            <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
              {submissionTitle}
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-semibold">
              <span>{companyName || "Instansi Pemohon"}</span>
              {submissionNumber && <span>• Tiket: {submissionNumber}</span>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Nomor SK / Penetapan Resmi (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: SK-DSN-MUI/IX/2026/088"
              value={decisionNumber}
              onChange={(e) => setDecisionNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Catatan / Risalah Persetujuan <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium outline-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-blue-900 dark:text-blue-300 text-[11px] leading-relaxed">
            ℹ️ <strong>Informasi:</strong> Setelah disetujui, status akan berubah menjadi <strong>DISETUJUI / SELESAI</strong>, pemohon menerima notifikasi email, dan tombol <strong>Upload Sertifikat</strong> pada toolbar akan langsung aktif.
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-md hover:opacity-95 transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Memproses Persetujuan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Setujui & Selesaikan Pengajuan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. MODAL MENOLAK PENGAJUAN (REVISI ATAU TOLAK PERMANEN)
// ─────────────────────────────────────────────────────────────────────────────
interface RejectSubmissionModalProps {
  documentId: string;
  submissionTitle: string;
  submissionNumber?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const RejectSubmissionModal: React.FC<RejectSubmissionModalProps> = ({
  documentId,
  submissionTitle,
  submissionNumber,
  onClose,
  onSuccess,
}) => {
  const [rejectType, setRejectType] = useState<"REVISION" | "PERMANENT">("REVISION");
  const [reason, setReason] = useState<string>("");
  const [requestedDocsInput, setRequestedDocsInput] = useState<string>("");
  const [deadlineDays, setDeadlineDays] = useState<number>(7);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMessage("Silakan isi deskripsi alasan penolakan / perbaikan berkas.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const requestedDocs = requestedDocsInput
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + Number(deadlineDays));

      await api.post(`/documents/${documentId}/reject-submission`, {
        reason: reason.trim(),
        isPermanent: rejectType === "PERMANENT",
        requestedDocuments: requestedDocs.length > 0 ? requestedDocs : undefined,
        deadline: rejectType === "REVISION" ? deadlineDate.toISOString() : undefined,
      });

      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Gagal memproses penolakan pengajuan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between"
             style={{ background: "linear-gradient(135deg, #991B1B 0%, #DC2626 100%)" }}>
          <div className="text-white space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-white/20">
                <AlertTriangle size={18} />
              </span>
              <h3 className="font-extrabold text-base">Tolak / Minta Revisi Pengajuan</h3>
            </div>
            <p className="text-xs text-rose-100/90 font-medium">
              Pilih apakah permohonan membutuhkan perbaikan dokumen atau ditolak secara permanen.
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Opsi Jenis Penolakan */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRejectType("REVISION")}
              className={cn(
                "p-3.5 rounded-2xl border text-left space-y-1 transition-all cursor-pointer",
                rejectType === "REVISION"
                  ? "border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 ring-2 ring-amber-500/20"
                  : "border-slate-200 dark:border-slate-700 hover:bg-slate-50"
              )}
            >
              <div className="flex items-center gap-1.5 font-extrabold text-xs text-amber-900 dark:text-amber-200">
                <HelpCircle size={15} className="text-amber-600" />
                <span>Minta Perbaikan</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Dokumen salah / perlu berkas tambahan. Pemohon dapat mengunggah ulang.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setRejectType("PERMANENT")}
              className={cn(
                "p-3.5 rounded-2xl border text-left space-y-1 transition-all cursor-pointer",
                rejectType === "PERMANENT"
                  ? "border-rose-600 bg-rose-50/80 dark:bg-rose-950/40 ring-2 ring-rose-500/20"
                  : "border-slate-200 dark:border-slate-700 hover:bg-slate-50"
              )}
            >
              <div className="flex items-center gap-1.5 font-extrabold text-xs text-rose-800 dark:text-rose-200">
                <AlertTriangle size={15} className="text-rose-600" />
                <span>Tolak Permanen</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Pengajuan ditolak sepenuhnya dan proses dihentikan.
              </p>
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Alasan {rejectType === "REVISION" ? "Permintaan Perbaikan" : "Penolakan"} <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Jelaskan secara rinci alasan kekurangan atau penolakan permohonan..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium outline-none"
            />
          </div>

          {rejectType === "REVISION" && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Daftar Dokumen yang Wajib Dilengkapi / Diperbaiki (Satu baris per dokumen)
                </label>
                <textarea
                  rows={3}
                  value={requestedDocsInput}
                  onChange={(e) => setRequestedDocsInput(e.target.value)}
                  placeholder="Contoh:&#10;Sertifikat Kompetensi LSP MUI terbaru&#10;Surat Pengantar Asli bertandatangan Direktur"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Batas Waktu Perbaikan (Deadline)
                </label>
                <select
                  value={deadlineDays}
                  onChange={(e) => setDeadlineDays(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold outline-none"
                >
                  <option value={3}>3 Hari Kalender</option>
                  <option value={7}>7 Hari Kalender (Standar)</option>
                  <option value={14}>14 Hari Kalender</option>
                  <option value={30}>30 Hari Kalender</option>
                </select>
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-md hover:opacity-95 transition-all disabled:opacity-50",
                rejectType === "PERMANENT" ? "bg-rose-600" : "bg-amber-600"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>{rejectType === "PERMANENT" ? "Konfirmasi Tolak Permanen" : "Kirim Instruksi Perbaikan"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. MODAL PENGINGAT (REMINDER WITH OPTIONAL DUE DATE)
// ─────────────────────────────────────────────────────────────────────────────
interface SendReminderModalProps {
  documentId: string;
  submissionNumber?: string;
  companyName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const SendReminderModal: React.FC<SendReminderModalProps> = ({
  documentId,
  submissionNumber,
  companyName,
  onClose,
  onSuccess,
}) => {
  const [subject, setSubject] = useState<string>(
    `Pengingat Tindak Lanjut Permohonan: ${submissionNumber || "Surat Masuk DSN-MUI"}`
  );
  const [reminderMessage, setReminderMessage] = useState<string>(
    "Yth. Pemohon, mohon segera menindaklanjuti proses dan arahan yang telah disampaikan oleh Tim Verifikator DSN-MUI agar proses permohonan dapat segera dilanjutkan ke tahapan berikutnya."
  );
  const [enableDueDate, setEnableDueDate] = useState<boolean>(true);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderMessage.trim()) {
      setErrorMessage("Pesan pengingat tidak boleh kosong.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await api.post(`/documents/${documentId}/send-reminder`, {
        subject: subject.trim(),
        message: reminderMessage.trim(),
        dueDate: enableDueDate && dueDate ? dueDate : undefined,
      });
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Gagal mengirimkan email pengingat.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between"
             style={{ background: "linear-gradient(135deg, #D97706 0%, #B45309 100%)" }}>
          <div className="text-white space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-white/20">
                <BellRing size={18} />
              </span>
              <h3 className="font-extrabold text-base">Kirim Pengingat ke Pemohon</h3>
            </div>
            <p className="text-xs text-amber-100/90 font-medium">
              Kirim email follow-up resmi kepada pemohon untuk segera merespon feedback DSN-MUI.
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-xs flex items-center justify-between">
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Penerima Pengingat:</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">{companyName || "Instansi Pemohon"}</span>
            </div>
            {submissionNumber && (
              <span className="font-mono font-bold text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-xl">
                Tiket: {submissionNumber}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Subjek Email Pengingat
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Pesan Pengingat / Instruksi Tindak Lanjut <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={reminderMessage}
              onChange={(e) => setReminderMessage(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium outline-none"
            />
          </div>

          {/* Due date toggle */}
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-amber-950 dark:text-amber-200 block">
                  Batas Waktu Respon (Due Date)
                </span>
                <span className="text-[11px] text-slate-500">
                  Pemohon diwajibkan memberikan respon maksimal pada tanggal yang ditentukan.
                </span>
              </div>
              <input
                type="checkbox"
                checked={enableDueDate}
                onChange={(e) => setEnableDueDate(e.target.checked)}
                className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
              />
            </div>

            {enableDueDate && (
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Tanggal Batas Waktu (Due Date) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required={enableDueDate}
                  className="w-full px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-xs font-bold outline-none"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-md hover:opacity-95 transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #D97706 0%, #B45309 100%)" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Mengirim Email...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Kirim Email Pengingat</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. MODAL SIMPAN KE DATABASE DPS (MASTER DATA DPS)
// ─────────────────────────────────────────────────────────────────────────────
interface SaveDpsToDatabaseModalProps {
  documentId: string;
  candidatesList: any[];
  institutionName?: string;
  isApproved: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SaveDpsToDatabaseModal: React.FC<SaveDpsToDatabaseModalProps> = ({
  documentId,
  candidatesList,
  institutionName,
  isApproved,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isApproved) {
      setErrorMessage("Permohonan harus disetujui terlebih dahulu sebelum calon DPS disimpan ke database.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await api.post(`/documents/${documentId}/save-dps-members`);
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Gagal menyimpan data calon DPS ke database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between"
             style={{ background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)" }}>
          <div className="text-white space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-white/20">
                <UserCheck size={18} />
              </span>
              <h3 className="font-extrabold text-base">Simpan ke Master Database DPS</h3>
            </div>
            <p className="text-xs text-sky-100/90 font-medium">
              Menyimpan seluruh calon Dewan Pengawas Syariah yang telah disetujui ke database resmi DSN-MUI.
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!isApproved && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0 text-amber-600" />
              <span>Pengajuan belum disetujui. Selesaikan dan setujui pengajuan terlebih dahulu untuk menyimpan data DPS.</span>
            </div>
          )}

          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Daftar Calon DPS ({candidatesList.length} Orang):
            </span>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {candidatesList.length > 0 ? (
                candidatesList.map((cand, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-extrabold text-slate-900 dark:text-white block">
                        {idx + 1}. {cand.name}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {cand.email || "Tanpa email"} • {cand.phone || "Tanpa telepon"}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-extrabold text-[10px]">
                      Calon DPS
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                  Tidak ada calon DPS yang tercatat pada permohonan ini.
                </div>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50 text-sky-900 dark:text-sky-300 text-[11px] leading-relaxed">
            ℹ️ Data anggota akan tersimpan di tabel <strong>DpsMember</strong> dengan lembaga penugasan <strong>{institutionName || "Lembaga Pemohon"}</strong> dan status aktif.
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isApproved || candidatesList.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-md hover:opacity-95 transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Menyimpan ke Database...</span>
                </>
              ) : (
                <>
                  <UserCheck size={16} />
                  <span>Simpan ke Database DPS</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. MODAL BALAS EMAIL (SURAT MASUK UMUM DENGAN LAMPIRAN)
// ─────────────────────────────────────────────────────────────────────────────
interface ReplyEmailModalProps {
  documentId: string;
  defaultRecipientEmail?: string;
  defaultRecipientName?: string;
  defaultSubject?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReplyEmailModal: React.FC<ReplyEmailModalProps> = ({
  documentId,
  defaultRecipientEmail = "",
  defaultRecipientName = "",
  defaultSubject = "",
  onClose,
  onSuccess,
}) => {
  const [recipientEmail, setRecipientEmail] = useState<string>(defaultRecipientEmail);
  const [recipientName, setRecipientName] = useState<string>(defaultRecipientName);
  const [subject, setSubject] = useState<string>(
    defaultSubject.startsWith("Re:") ? defaultSubject : `Re: ${defaultSubject || "Surat Tanggapan DSN-MUI"}`
  );
  const [message, setMessage] = useState<string>("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setAttachments((prev) => [...prev, ...filesArray].slice(0, 5));
    }
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail.trim()) {
      setErrorMessage("Alamat email penerima wajib diisi.");
      return;
    }
    if (!message.trim()) {
      setErrorMessage("Isi balasan email wajib diisi.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const formData = new FormData();
      formData.append("to", recipientEmail.trim());
      formData.append("recipientName", recipientName.trim());
      formData.append("subject", subject.trim());
      formData.append("message", message.trim());
      attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      await api.post(`/documents/${documentId}/reply-email`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Gagal mengirimkan balasan email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between"
             style={{ background: "linear-gradient(135deg, #1E293B 0%, #334155 100%)" }}>
          <div className="text-white space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-white/20">
                <Mail size={18} />
              </span>
              <h3 className="font-extrabold text-base">Balas Surat Masuk via Email</h3>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Kirim respon resmi disertai dokumen lampiran untuk surat eksternal / undangan umum.
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Alamat Email Penerima <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="nama@instansi.com"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Nama Penerima / Lembaga
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Bapak / Ibu / Instansi"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Subjek Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Isi Balasan Email <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tuliskan respon resmi, klarifikasi, atau jawaban perihal surat masuk terkait..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium outline-none"
            />
          </div>

          {/* Attachments */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Paperclip size={14} className="text-slate-500" />
                <span>Dokumen Lampiran (Maks. 5 Berkas PDF / Dokumen)</span>
              </label>
              <span className="text-[11px] text-slate-400 font-bold">{attachments.length}/5</span>
            </div>

            <label className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/40">
              <Paperclip size={20} className="text-slate-400 mb-1" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Pilih Berkas Lampiran</span>
              <span className="text-[10px] text-slate-400 mt-0.5">PDF, DOCX, PNG, JPG (Maks. 10MB per berkas)</span>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              />
            </label>

            {attachments.length > 0 && (
              <div className="mt-2.5 space-y-1.5">
                {attachments.map((file, idx) => (
                  <div
                    key={idx}
                    className="p-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between text-xs"
                  >
                    <span className="truncate max-w-xs font-medium text-slate-800 dark:text-slate-200">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-md hover:opacity-95 transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Mengirim Email & Berkas...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Kirim Balasan Email</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. MODAL HAPUS PENGAJUAN / PERMOHONAN (CASCADE DELETE)
// ─────────────────────────────────────────────────────────────────────────────
interface DeleteSubmissionModalProps {
  documentId: string;
  submissionTitle: string;
  submissionNumber?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeleteSubmissionModal: React.FC<DeleteSubmissionModalProps> = ({
  documentId,
  submissionTitle,
  submissionNumber,
  onClose,
  onSuccess,
}) => {
  const [confirmText, setConfirmText] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText.toLowerCase() !== "hapus") {
      setErrorMessage("Silakan ketik kata 'HAPUS' untuk mengonfirmasi penghapusan permanen.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await api.delete(`/documents/${documentId}`);
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Gagal menghapus pengajuan / permohonan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-rose-600 text-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-white/20">
                <Trash2 size={18} />
              </span>
              <h3 className="font-extrabold text-base">Hapus Pengajuan / Permohonan</h3>
            </div>
            <p className="text-xs text-rose-100 font-medium">
              Tindakan permanen dan tidak dapat dibatalkan.
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-950 dark:text-rose-200 text-xs space-y-2">
            <p className="font-extrabold leading-snug">
              ⚠️ Peringatan: Seluruh data berkas permohonan ini akan dihapus secara permanen:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-rose-800 dark:text-rose-300">
              <li>Data surat masuk & permohonan publik ({submissionNumber || submissionTitle})</li>
              <li>Seluruh berkas persyaratan calon & evidence pendukung</li>
              <li>Riwayat log disposisi, aktivitas permohonan, dan jadwal agenda rapat terkait</li>
            </ul>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Ketik <strong>HAPUS</strong> untuk mengonfirmasi:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Ketik HAPUS di sini..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-rose-600 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || confirmText.toLowerCase() !== "hapus"}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 shadow-md transition-all disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  <span>Hapus Permohonan Permanen</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
