"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  Eye,
  Building2,
  Sparkles,
  Check,
  Calendar,
  Paperclip,
  Folder,
  FolderPlus,
  UploadCloud,
  FileCheck2,
  CalendarDays,
  MapPin,
  Tag,
  CheckSquare,
  FileSpreadsheet,
  AlertTriangle,
  RefreshCw,
  Award,
  ChevronRight,
  CalendarCheck,
  Mail,
  Printer,
  Video,
  Timer,
  HeartPulse,
  FileBadge,
  Activity,
  Search,
} from "lucide-react";
import api, { getBaseUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import DocumentReader from "@/components/documents/DocumentReader";
import { useAuthStore } from "@/stores/auth.store";
import Can from "@/components/auth/Can";
import { calculateSlaStatus } from "@/lib/business-days";
import { WorkflowToolbar } from "@/components/documents/WorkflowToolbar";
import {
  InvitePresentationModal,
  ApproveSubmissionModal,
  RejectSubmissionModal,
  SendReminderModal,
  SaveDpsToDatabaseModal,
  ReplyEmailModal,
  DeleteSubmissionModal,
} from "@/components/documents/WorkflowModals";
import { ProcessDashboardTab } from "@/components/documents/ProcessDashboardTab";
import { EvidenceDocumentsTab } from "@/components/documents/EvidenceDocumentsTab";

const getBaseUrlSafe = () => {
  if (typeof window !== 'undefined') return getBaseUrl();
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002/api').replace('/api', '');
};

const getFileDownloadUrl = (rawUrl?: string) => {
  if (!rawUrl) return '#';
  let url = rawUrl;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `${getBaseUrlSafe()}/${rawUrl.replace(/^\//, '')}`;
  }
  const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || (() => {
    try {
      return JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.accessToken;
    } catch {
      return null;
    }
  })()) : null;
  if (token && (url.includes('/api/') || url.includes('/documents/')) && !url.includes('token=')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}token=${encodeURIComponent(token)}`;
  }
  return url;
};

const CANDIDATE_DOC_SPECS = [
  { key: 'suratMui', title: 'Surat Pengantar dari MUI Setempat' },
  { key: 'sertifikatPelatihan', title: 'Sertifikat Pelatihan Dasar Pengawas Syariah dari DSN-MUI' },
  { key: 'sertifikatKompetensi', title: 'Sertifikat Kompetensi Pengawas Syariah dari LSP MUI' },
  { key: 'profilCv', title: 'Profil Calon DPS (Daftar Riwayat Hidup dan KTP terbaru)' },
  { key: 'suratPernyataanNonPegawai', title: 'Surat Keterangan Tidak Menjadi Pengurus/Pegawai Aktif LKS/LBS/LPS' },
  { key: 'dokumenLain', title: 'Dokumen Lain Calon' },
];

const getNormalizedCandidateDocs = (rawDocs: any) => {
  if (!rawDocs) return [];
  if (Array.isArray(rawDocs)) {
    return rawDocs.map((d: any, idx: number) => ({
      key: d.key || `doc-${idx}`,
      title: d.title || d.requirementName || `Dokumen #${idx + 1}`,
      fileName: d.fileName || 'berkas.pdf',
      fileUrl: d.fileUrl || '',
      fileSize: d.fileSize || 0,
    }));
  }
  if (typeof rawDocs === 'object') {
    return CANDIDATE_DOC_SPECS.map((spec) => {
      const doc = rawDocs[spec.key];
      return {
        key: spec.key,
        title: spec.title,
        fileName: doc?.fileName || '',
        fileUrl: doc?.fileUrl || '',
        fileSize: doc?.fileSize || 0,
      };
    }).filter((item) => item.key !== 'dokumenLain' || Boolean(item.fileUrl));
  }
  return [];
};

// ── MODAL VALIDASI PENGESAHAN DOKUMEN (3 PILIHAN KATEGORI) ─────────────────
interface ValidationModalProps {
  documentId: string;
  submissionNumber?: string;
  companyName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ValidationModal: React.FC<ValidationModalProps> = ({
  documentId,
  submissionNumber,
  companyName,
  onClose,
  onSuccess,
}) => {
  const [validationType, setValidationType] = useState<'BARU' | 'PAW' | 'PENETAPAN_KEBERLANJUTAN'>('BARU');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validationOptions = [
    {
      key: 'BARU',
      number: '1.',
      title: 'Baru',
      subtitle: 'Permohonan rekomendasi pengangkatan / penempatan anggota Dewan Pengawas Syariah Baru.',
      badge: 'Pengajuan Baru',
    },
    {
      key: 'PAW',
      number: '2.',
      title: 'PAW (Pergantian Antar Waktu)',
      subtitle: 'Penggantian anggota DPS yang berhalangan tetap atau berhenti sebelum masa tugas berakhir.',
      badge: 'Pergantian Antar Waktu',
    },
    {
      key: 'PENETAPAN_KEBERLANJUTAN',
      number: '3.',
      title: 'Penetapan Keberlanjutan Rekomendasi',
      subtitle: 'Perpanjangan atau penetapan masa penugasan berkelanjutan bagi DPS yang telah selesai masa tugasnya.',
      badge: 'Keberlanjutan Rekomendasi',
    },
  ];

  const [actionTab, setActionTab] = useState<'VALIDATE' | 'REJECT'>('VALIDATE');
  const [rejectReason, setRejectReason] = useState<string>('');
  const [selectedDocsToFix, setSelectedDocsToFix] = useState<string[]>([
    'sertifikatPelatihan',
  ]);
  const [rejectDeadline, setRejectDeadline] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  const availableDocChecklist = [
    { key: 'suratPengantarPerusahaan', label: '1. Surat Permohonan / Pengantar Resmi Perusahaan' },
    { key: 'suratMui', label: '2. Surat Pengantar dari MUI Setempat' },
    { key: 'sertifikatPelatihan', label: '3. Sertifikat Pelatihan Dasar Pengawas Syariah dari DSN-MUI' },
    { key: 'sertifikatKompetensi', label: '4. Sertifikat Kompetensi Pengawas Syariah dari LSP MUI' },
    { key: 'profilCv', label: '5. Profil Calon DPS (Daftar Riwayat Hidup & KTP Terbaru)' },
    { key: 'suratPernyataanNonPegawai', label: '6. Surat Keterangan Tidak Menjadi Pengurus/Pegawai Aktif LKS/LBS/LPS' },
    { key: 'dokumenLain', label: '7. Dokumen Pendukung Tambahan / Dokumen Lain' },
  ];

  const handleToggleDocToFix = (key: string) => {
    if (selectedDocsToFix.includes(key)) {
      setSelectedDocsToFix(selectedDocsToFix.filter((k) => k !== key));
    } else {
      setSelectedDocsToFix([...selectedDocsToFix, key]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (actionTab === 'VALIDATE') {
        await api.post(`/documents/${documentId}/validate-submission`, {
          validationType,
          notes: notes.trim() || undefined,
        });
      } else {
        if (!rejectReason.trim()) {
          setErrorMessage('Alasan penolakan / permintaan perbaikan berkas wajib diisi secara deskriptif.');
          setIsSubmitting(false);
          return;
        }

        await api.post(`/documents/${documentId}/reject-submission`, {
          reason: rejectReason.trim(),
          requestedDocuments: selectedDocsToFix,
          deadline: rejectDeadline,
        });
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.response?.data?.message ||
          (actionTab === 'VALIDATE'
            ? 'Gagal memproses validasi berkas permohonan.'
            : 'Gagal mengirimkan permintaan perbaikan berkas.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 animate-in zoom-in-95 duration-200 space-y-6 custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-11 h-11 rounded-2xl flex items-center justify-center font-black transition-colors",
              actionTab === 'VALIDATE'
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
            )}>
              {actionTab === 'VALIDATE' ? <ShieldCheck size={22} /> : <AlertTriangle size={22} />}
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                {actionTab === 'VALIDATE'
                  ? 'Validasi Berkas & Kategori Rekomendasi'
                  : 'Tolak & Minta Perbaikan Berkas (Perlu Tindakan)'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {submissionNumber ? `Tiket: ${submissionNumber}` : 'Surat Masuk Permohonan'} {companyName ? `• ${companyName}` : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Action Type Toggle: Setujui vs Tolak */}
        <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActionTab('VALIDATE')}
            className={cn(
              "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
              actionTab === 'VALIDATE'
                ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-sm border border-emerald-200 dark:border-emerald-800"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            )}
          >
            <Check size={15} />
            <span>1. Setujui & Validasi (3 Kategori)</span>
          </button>
          <button
            type="button"
            onClick={() => setActionTab('REJECT')}
            className={cn(
              "py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
              actionTab === 'REJECT'
                ? "bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 shadow-sm border border-rose-200 dark:border-rose-800"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            )}
          >
            <X size={15} />
            <span>2. Tolak / Minta Perbaikan</span>
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {actionTab === 'VALIDATE' ? (
            <>
              {/* Radio Options for 3 Recommendation Categories */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Pilih Kategori Rekomendasi Pemohon *
                </label>
                <div className="space-y-2.5">
                  {validationOptions.map((opt) => (
                    <label
                      key={opt.key}
                      onClick={() => setValidationType(opt.key as any)}
                      className={cn(
                        "flex items-start gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition-all",
                        validationType === opt.key
                          ? "bg-emerald-50/70 border-emerald-600 text-emerald-950 dark:bg-emerald-950/30 dark:border-emerald-500 dark:text-emerald-200 shadow-sm"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      )}
                    >
                      <input
                        type="radio"
                        name="validationType"
                        checked={validationType === opt.key}
                        onChange={() => setValidationType(opt.key as any)}
                        className="mt-1 w-4 h-4 accent-emerald-600 cursor-pointer shrink-0"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                            <span className="text-emerald-600 mr-1.5">{opt.number}</span>
                            {opt.title}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 shrink-0">
                            {opt.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {opt.subtitle}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Verification Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Catatan Validasi & Verifikasi Dokumen
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Seluruh kelengkapan berkas resmi (Surat Pengantar, Sertifikat DSN-MUI, Sertifikat LSP MUI, CV, dan Pernyataan Non-Pegawai) dinyatakan absah dan memenuhi syarat..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none font-medium"
                />
              </div>

              {/* Workflow Impact Notice */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-200 space-y-1 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-600" />
                  Kelanjutan Alur Permohonan:
                </div>
                <p>
                  Status berkas akan tervalidasi dan dinyatakan <strong>VALID</strong>. Status pengajuan di sistem dan web-public <strong>tetap berada pada tahap Validasi Dokumen (aktif)</strong>. Gunakan tombol <strong>"Buat Undangan Wawancara"</strong> untuk menerbitkan surat undangan resmi dan mengalihkan status ke tahap Wawancara.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Reject / Revision Process Section */}
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-900 dark:text-rose-200 space-y-1 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-rose-600" />
                  Dampak Penolakan / Permintaan Perbaikan:
                </div>
                <p>
                  Status pengajuan pemohon di web-public akan segera berstatus <strong>"Perlu Tindakan"</strong>. Pemohon akan menerima notifikasi dan dapat segera mengedit berkas untuk <strong>mengganti lampiran yang tidak valid atau menambah lampiran baru</strong> yang dibutuhkan.
                </p>
              </div>

              {/* Descriptive Reason Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 dark:text-white">
                  Alasan Penolakan / Permintaan Perbaikan (Wajib Deskriptif) *
                </label>
                <textarea
                  rows={4}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Jelaskan secara rinci dokumen apa yang belum memenuhi syarat dan apa yang harus diganti atau ditambahkan oleh pemohon..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-rose-500/20 resize-none font-medium text-slate-900 dark:text-white"
                />

                {/* Quick Suggestion Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    'Sertifikat Pelatihan Belum Format Terbaru',
                    'Surat Rekomendasi MUI Belum Terlampir',
                    'KTP / CV Kurang Jelas',
                    'Surat Non-Pegawai Belum Ditandatangani',
                    'Perlu Dokumen Tambahan Legalitas',
                  ].map((chip) => (
                    <button
                      type="button"
                      key={chip}
                      onClick={() => setRejectReason((prev) => (prev ? `${prev}. ${chip}` : chip))}
                      className="px-2.5 py-1 text-[10px] rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Document Checklist for Replacement / Addition */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-900 dark:text-white">
                    Pilih Dokumen yang Harus Diganti / Dilengkapi:
                  </label>
                  <span className="text-[10px] font-bold text-slate-500">
                    {selectedDocsToFix.length} Dokumen Dipilih
                  </span>
                </div>

                <div className="space-y-2">
                  {availableDocChecklist.map((item) => {
                    const isChecked = selectedDocsToFix.includes(item.key);
                    return (
                      <label
                        key={item.key}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                          isChecked
                            ? "bg-rose-50/60 border-rose-300 dark:bg-rose-950/30 dark:border-rose-800 text-rose-950 dark:text-rose-200"
                            : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 opacity-70"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleDocToFix(item.key)}
                          className="w-4 h-4 accent-rose-600 cursor-pointer"
                        />
                        <span className="text-xs font-semibold">{item.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Deadline */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Batas Waktu Respon Perbaikan (Deadline)
                </label>
                <input
                  type="date"
                  value={rejectDeadline}
                  onChange={(e) => setRejectDeadline(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "flex-[2] py-3 text-xs font-bold text-white rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60",
                actionTab === 'VALIDATE'
                  ? "hover:opacity-95"
                  : "bg-rose-600 hover:bg-rose-700"
              )}
              style={
                actionTab === 'VALIDATE'
                  ? { background: 'linear-gradient(135deg, #006633 0%, #1B7F4A 100%)' }
                  : undefined
              }
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : actionTab === 'VALIDATE' ? (
                <>
                  <Check size={16} /> Simpan Validasi Dokumen (Tetap Tahap Validasi)
                </>
              ) : (
                <>
                  <AlertTriangle size={16} /> Tolak Berkas & Kirim Permintaan Perbaikan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── STANDARD DSN-MUI CONSTANTS & DATE HELPERS ──
const DEFAULT_DSN_OFFICE_ADDRESS =
  'Kantor DSN MUI Jl. Dempo No. 19 Pegangsaan, Menteng, Jakarta Pusat 10320';
const DEFAULT_SIGNATORY_NAME = 'K.H. M. Cholil Nafis, Lc., Ph.D.';
const DEFAULT_SIGNATORY_ROLE = 'Ketua DSN MUI';

const sanitizeDsnVenue = (raw?: string): string => {
  if (!raw) return DEFAULT_DSN_OFFICE_ADDRESS;
  if (
    raw.includes('Proklamasi') ||
    raw.includes('Gedung MUI') ||
    raw.includes('MUI Pusat') ||
    raw.includes('Lt. 3') ||
    raw.includes('Lt. 2') ||
    raw.includes('Ruang Rapat Pleno')
  ) {
    return DEFAULT_DSN_OFFICE_ADDRESS;
  }
  return raw;
};

const sanitizeDsnSignatoryName = (raw?: string): string => {
  if (!raw || raw.includes('Hasanuddin') || raw.includes('hasanuddin')) {
    return DEFAULT_SIGNATORY_NAME;
  }
  return raw;
};

const sanitizeDsnSignatoryRole = (raw?: string): string => {
  if (!raw || raw.includes('Pengawasan') || raw.includes('DSN-MUI')) {
    return DEFAULT_SIGNATORY_ROLE;
  }
  return raw;
};

const formatIndonesianDate = (isoDateStr: string, includeWeekday: boolean = false): string => {
  if (!isoDateStr) return '';
  const d = new Date(isoDateStr + (isoDateStr.includes('T') ? '' : 'T00:00:00'));
  if (isNaN(d.getTime())) return isoDateStr;
  return d.toLocaleDateString('id-ID', {
    ...(includeWeekday ? { weekday: 'long' } : {}),
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const parseIndonesianDateToIso = (dateStr?: string): string => {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  const months: Record<string, string> = {
    januari: '01',
    februari: '02',
    maret: '03',
    april: '04',
    mei: '05',
    juni: '06',
    juli: '07',
    agustus: '08',
    september: '09',
    oktober: '10',
    november: '11',
    desember: '12',
  };
  const parts = dateStr.toLowerCase().replace(/,/g, '').split(' ');
  const year = parts.find((p) => /^\d{4}$/.test(p));
  const monthKey = parts.find((p) => months[p]);
  const day = parts.find((p) => /^\d{1,2}$/.test(p) && p !== year);
  if (year && monthKey && day) {
    return `${year}-${months[monthKey]}-${day.padStart(2, '0')}`;
  }
  return '';
};

const getTodayIso = (): string => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getDefaultInterviewDateIso = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// ── MODAL BUAT SURAT UNDANGAN WAWANCARA (MULTI-PUTARAN, RS & DPS) ──
interface CreateInterviewInvitationModalProps {
  documentId: string;
  submissionNumber?: string;
  companyName?: string;
  companyLetterNumber?: string;
  candidatesList: any[];
  existingInvitation?: any;
  round?: number;
  isHospital?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateInterviewInvitationModal: React.FC<CreateInterviewInvitationModalProps> = ({
  documentId,
  submissionNumber,
  companyName,
  companyLetterNumber,
  candidatesList,
  existingInvitation,
  round,
  isHospital,
  onClose,
  onSuccess,
}) => {
  const activeRound = round || existingInvitation?.round || 1;

  const [invitationNumber, setInvitationNumber] = useState<string>(
    existingInvitation?.invitationNumber ||
      `UND-WW/DSN-MUI/IX/2026/${Math.floor(100 + Math.random() * 900)}`
  );

  const [invitationDateIso, setInvitationDateIso] = useState<string>(() => {
    return parseIndonesianDateToIso(existingInvitation?.invitationDate) || getTodayIso();
  });
  const [invitationDate, setInvitationDate] = useState<string>(() => {
    return (
      existingInvitation?.invitationDate ||
      formatIndonesianDate(parseIndonesianDateToIso(existingInvitation?.invitationDate) || getTodayIso(), false)
    );
  });

  const [interviewDateIso, setInterviewDateIso] = useState<string>(() => {
    return parseIndonesianDateToIso(existingInvitation?.interviewDayDate) || getDefaultInterviewDateIso();
  });
  const [interviewDayDate, setInterviewDayDate] = useState<string>(() => {
    return (
      existingInvitation?.interviewDayDate ||
      formatIndonesianDate(
        parseIndonesianDateToIso(existingInvitation?.interviewDayDate) || getDefaultInterviewDateIso(),
        true
      )
    );
  });

  const [interviewTime, setInterviewTime] = useState<string>(
    existingInvitation?.interviewTime || '09:30 - 12:00'
  );
  const [format, setFormat] = useState<'OFFLINE' | 'ONLINE' | 'HYBRID'>(
    existingInvitation?.format || 'OFFLINE'
  );
  const [venue, setVenue] = useState<string>(() =>
    sanitizeDsnVenue(existingInvitation?.venue)
  );
  const [zoomUrl, setZoomUrl] = useState<string>(existingInvitation?.zoomUrl || '');
  const [zoomMeetingId, setZoomMeetingId] = useState<string>(existingInvitation?.zoomMeetingId || '');
  const [zoomPasscode, setZoomPasscode] = useState<string>(existingInvitation?.zoomPasscode || '');
  const [subject, setSubject] = useState<string>(
    existingInvitation?.subject ||
      (isHospital
        ? `Undangan Wawancara & Asesmen Sertifikasi Syariah Rumah Sakit (Putaran Ke-${activeRound}) Terkait Surat No. ${companyLetterNumber || submissionNumber || '-'}`
        : `Undangan Wawancara Uji Kepatutan dan Kelayakan Calon Anggota DPS (Putaran Ke-${activeRound}) Terkait Surat No. ${companyLetterNumber || submissionNumber || '-'}`)
  );

  const initialCandidates = useMemo(() => {
    if (existingInvitation?.candidates && Array.isArray(existingInvitation.candidates)) {
      return existingInvitation.candidates;
    }
    if (candidatesList.length > 0) {
      return candidatesList.map((c: any) => c.name || `Calon #${c.id}`);
    }
    return isHospital
      ? ['Direksi & Manajemen Rumah Sakit', 'Calon Dewan Pengawas Syariah']
      : ['Calon Anggota Dewan Pengawas Syariah'];
  }, [existingInvitation, candidatesList, isHospital]);

  const [selectedCandidates, setSelectedCandidates] = useState<string[]>(initialCandidates);
  const [candidateInput, setCandidateInput] = useState<string>('');

  const [dresscode, setDresscode] = useState<string>(
    existingInvitation?.dresscode || 'Pakaian Sipil Lengkap / Batik Lengan Panjang / Jas Rapi'
  );
  const [requirements, setRequirements] = useState<string>(
    existingInvitation?.requirements ||
      (isHospital
        ? 'Membawa berkas fisik legalitas RS, sertifikat MUKISI, kesiapan operasional syariah, serta dokumen calon DPS.'
        : 'Membawa berkas fisik asli, portofolio riwayat hidup, serta bahan pemaparan kesiapan kepengawasan syariah.')
  );
  const [contactPerson, setContactPerson] = useState<string>(
    existingInvitation?.contactPerson || 'Sekretariat DSN-MUI (021-3904141 / WhatsApp: 0812-3456-7890)'
  );
  const [notes, setNotes] = useState<string>(
    existingInvitation?.notes || 'Peserta dimohon hadir 15 menit sebelum waktu wawancara dimulai.'
  );
  const [signatoryName, setSignatoryName] = useState<string>(() =>
    sanitizeDsnSignatoryName(existingInvitation?.signatoryName)
  );
  const [signatoryRole, setSignatoryRole] = useState<string>(() =>
    sanitizeDsnSignatoryRole(existingInvitation?.signatoryRole)
  );

  // ── Surat Keluar Attachment & Search State ──
  const [outgoingLetters, setOutgoingLetters] = useState<any[]>([]);
  const [loadingLetters, setLoadingLetters] = useState<boolean>(false);
  const [letterSearchQuery, setLetterSearchQuery] = useState<string>('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState<boolean>(false);
  const [selectedLetter, setSelectedLetter] = useState<any | null>(() => {
    if (existingInvitation?.outgoingLetterNumber || existingInvitation?.outgoingLetterId) {
      return {
        id: existingInvitation.outgoingLetterId,
        documentNumber: existingInvitation.outgoingLetterNumber,
        title: existingInvitation.outgoingLetterTitle,
        fileUrl: existingInvitation.outgoingLetterFileUrl,
        fileName: existingInvitation.outgoingLetterFileName,
      };
    }
    return null;
  });

  useEffect(() => {
    let isMounted = true;
    const fetchOutgoingLetters = async () => {
      setLoadingLetters(true);
      try {
        const res = await api.get('/documents', {
          params: {
            documentType: 'OUTGOING',
            search: letterSearchQuery.trim() || undefined,
            limit: 25,
          },
        });
        if (isMounted) {
          setOutgoingLetters(res.data?.data || []);
        }
      } catch (err) {
        console.error('Error fetching outgoing letters:', err);
      } finally {
        if (isMounted) setLoadingLetters(false);
      }
    };

    const timer = setTimeout(fetchOutgoingLetters, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [letterSearchQuery]);

  const handleSelectLetter = (doc: any) => {
    setSelectedLetter(doc);
    setIsSearchDropdownOpen(false);
    if (doc.documentNumber) {
      setInvitationNumber(doc.documentNumber);
    }
    if (doc.title) {
      setSubject(doc.title);
    }
  };

  const handleClearSelectedLetter = () => {
    setSelectedLetter(null);
  };

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleToggleCandidate = (name: string) => {
    if (selectedCandidates.includes(name)) {
      if (selectedCandidates.length === 1) return; // Keep at least one
      setSelectedCandidates(selectedCandidates.filter((c) => c !== name));
    } else {
      setSelectedCandidates([...selectedCandidates, name]);
    }
  };

  const handleAddCandidate = () => {
    if (candidateInput.trim() && !selectedCandidates.includes(candidateInput.trim())) {
      setSelectedCandidates([...selectedCandidates, candidateInput.trim()]);
      setCandidateInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitationNumber || !interviewDayDate || !interviewTime || (format !== 'ONLINE' && !venue.trim())) {
      setErrorMessage('Nomor surat undangan, hari/tanggal, waktu, dan tempat pelaksanaan wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const effectiveVenue =
      format === 'ONLINE' ? 'Online via Zoom Meeting DSN-MUI' : venue.trim() || DEFAULT_DSN_OFFICE_ADDRESS;

    try {
      await api.post(`/documents/${documentId}/interview-invitation`, {
        round: activeRound,
        invitationNumber: invitationNumber.trim(),
        invitationDate: invitationDate.trim() || formatIndonesianDate(invitationDateIso, false),
        interviewDayDate: interviewDayDate.trim() || formatIndonesianDate(interviewDateIso, true),
        interviewTime: interviewTime.trim(),
        format,
        venue: effectiveVenue,
        zoomUrl: format !== 'OFFLINE' ? zoomUrl.trim() || undefined : undefined,
        zoomMeetingId: format !== 'OFFLINE' ? zoomMeetingId.trim() || undefined : undefined,
        zoomPasscode: format !== 'OFFLINE' ? zoomPasscode.trim() || undefined : undefined,
        subject: subject.trim(),
        candidates: selectedCandidates,
        dresscode: dresscode.trim(),
        requirements: requirements.trim(),
        contactPerson: contactPerson.trim(),
        notes: notes.trim() || undefined,
        signatoryName: signatoryName.trim() || DEFAULT_SIGNATORY_NAME,
        signatoryRole: signatoryRole.trim() || DEFAULT_SIGNATORY_ROLE,
        outgoingLetterId: selectedLetter?.id || undefined,
        outgoingLetterNumber: selectedLetter?.documentNumber || undefined,
        outgoingLetterTitle: selectedLetter?.title || undefined,
        outgoingLetterFileUrl: selectedLetter?.versions?.[0]?.fileUrl || selectedLetter?.fileUrl || undefined,
        outgoingLetterFileName: selectedLetter?.versions?.[0]?.fileName || selectedLetter?.fileName || undefined,
        syncMeetingAgenda: true,
      });
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || 'Gagal menerbitkan surat undangan wawancara.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 animate-in zoom-in-95 duration-200 space-y-6 custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 flex items-center justify-center font-black">
              <CalendarCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                  {isHospital
                    ? `Buat Surat Undangan Wawancara RS (Putaran Ke-${activeRound})`
                    : `Buat Surat Undangan Wawancara DPS (Putaran Ke-${activeRound})`}
                </h3>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 border border-amber-300 dark:border-amber-800">
                  Putaran Ke-{activeRound}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Penerbitan surat undangan resmi DSN-MUI lengkap dengan jadwal, tautan Zoom & agenda rapat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section 1: Lampiran Surat Keluar Resmi (Select Search) */}
          <div className="space-y-3.5 p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/90 dark:border-amber-800/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                <FileText size={16} className="text-amber-600" />
                1. Lampirkan Surat Undangan dari Surat Keluar
              </div>
              <a
                href="/surat-keluar/new"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-amber-800 hover:text-amber-950 dark:text-amber-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
              >
                + Buat Draf Surat Keluar Baru <ExternalLink size={12} />
              </a>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Cari dan pilih surat undangan yang telah dibuat di menu <strong>Surat Keluar</strong>. Berkas surat ini otomatis terlampir, dikirimkan ke email pemohon, dan tampil di dashboard pemohon.
            </p>

            {selectedLetter ? (
              <div className="p-3.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/80 rounded-xl shadow-xs space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Surat Keluar Terpilih
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {selectedLetter.documentNumber || 'Draft Tanpa Nomor'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">
                        {selectedLetter.title}
                      </p>
                      {selectedLetter.fileName && (
                        <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5 truncate">
                          <Paperclip size={11} className="text-slate-400 shrink-0" />
                          {selectedLetter.fileName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`/surat-keluar/${selectedLetter.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <Eye size={12} /> Buka
                    </a>
                    <button
                      type="button"
                      onClick={handleClearSelectedLetter}
                      className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Lepas
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <input
                    type="text"
                    value={letterSearchQuery}
                    onChange={(e) => {
                      setLetterSearchQuery(e.target.value);
                      setIsSearchDropdownOpen(true);
                    }}
                    onFocus={() => setIsSearchDropdownOpen(true)}
                    placeholder="Ketik untuk mencari nomor surat atau perihal surat keluar..."
                    className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <Search size={15} className="absolute left-3 top-3 text-slate-400" />
                  {loadingLetters && (
                    <div className="absolute right-3 top-3">
                      <Loader2 size={15} className="animate-spin text-amber-600" />
                    </div>
                  )}
                </div>

                {isSearchDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-56 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
                    {outgoingLetters.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-500">
                        {loadingLetters ? 'Mencari surat keluar...' : 'Tidak ada surat keluar ditemukan'}
                      </div>
                    ) : (
                      outgoingLetters.map((doc) => (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => handleSelectLetter(doc)}
                          className="w-full text-left p-2.5 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors flex items-start justify-between gap-2 group cursor-pointer"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-amber-800 dark:text-amber-300">
                                {doc.documentNumber || 'Draft Tanpa Nomor'}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                                {doc.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate mt-0.5">
                              {doc.title}
                            </p>
                          </div>
                          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 opacity-0 group-hover:opacity-100 shrink-0 self-center">
                            Pilih +
                          </span>
                        </button>
                      ))
                    )}
                    <div className="p-2 border-t border-slate-100 dark:border-slate-700 text-center">
                      <button
                        type="button"
                        onClick={() => setIsSearchDropdownOpen(false)}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                      >
                        Tutup Pencarian
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Identitas Surat Undangan */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              <FileText size={15} className="text-amber-600" />
              2. Identitas Surat Undangan Resmi
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nomor Surat Undangan *
                </label>
                <input
                  type="text"
                  required
                  value={invitationNumber}
                  onChange={(e) => setInvitationNumber(e.target.value)}
                  placeholder="Contoh: UND-WW/DSN-MUI/IX/2026/012"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tanggal Surat Diterbitkan *
                </label>
                <input
                  type="date"
                  required
                  value={invitationDateIso}
                  onChange={(e) => {
                    const val = e.target.value;
                    setInvitationDateIso(val);
                    setInvitationDate(formatIndonesianDate(val, false));
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                {invitationDate && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                    Format Resmi: {invitationDate}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Perihal Undangan *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>
          </div>

          {/* Section: Waktu & Lokasi Pelaksanaan */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              <Calendar size={15} className="text-amber-600" />
              3. Jadwal & Lokasi Pelaksanaan
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Hari & Tanggal Wawancara *
                </label>
                <input
                  type="date"
                  required
                  value={interviewDateIso}
                  onChange={(e) => {
                    const val = e.target.value;
                    setInterviewDateIso(val);
                    setInterviewDayDate(formatIndonesianDate(val, true));
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                {interviewDayDate && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                    Format Resmi: {interviewDayDate}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Waktu Pelaksanaan (WIB) *
                </label>
                <input
                  type="text"
                  required
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                  placeholder="Contoh: 09:30 - 12:00"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Format Pelaksanaan Wawancara *
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { key: 'OFFLINE', label: 'Tatap Muka (Offline)' },
                    { key: 'ONLINE', label: 'Daring (Zoom / Online)' },
                    { key: 'HYBRID', label: 'Hybrid (Campuran)' },
                  ].map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => {
                        setFormat(f.key as any);
                        if (f.key !== 'ONLINE' && (!venue || venue.includes('Zoom'))) {
                          setVenue(DEFAULT_DSN_OFFICE_ADDRESS);
                        }
                      }}
                      className={cn(
                        "py-2 px-3 rounded-xl border text-xs font-bold transition-all",
                        format === f.key
                          ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tempat / Ruangan Pelaksanaan (Disembunyikan jika metode Online/Daring) */}
              {format !== 'ONLINE' && (
                <div className="sm:col-span-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Tempat / Ruangan Pelaksanaan *
                    </label>
                    <button
                      type="button"
                      onClick={() => setVenue(DEFAULT_DSN_OFFICE_ADDRESS)}
                      className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold hover:underline"
                    >
                      Gunakan Alamat Kantor DSN-MUI
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    required
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder={`Contoh: ${DEFAULT_DSN_OFFICE_ADDRESS}`}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500/20 resize-none font-medium"
                  />
                </div>
              )}

              {format !== 'OFFLINE' && (
                <>
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Tautan Zoom Meeting (Opsional)
                    </label>
                    <input
                      type="text"
                      value={zoomUrl}
                      onChange={(e) => setZoomUrl(e.target.value)}
                      placeholder="https://zoom.us/j/..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Meeting ID
                    </label>
                    <input
                      type="text"
                      value={zoomMeetingId}
                      onChange={(e) => setZoomMeetingId(e.target.value)}
                      placeholder="Contoh: 891 2345 6789"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Passcode
                    </label>
                    <input
                      type="text"
                      value={zoomPasscode}
                      onChange={(e) => setZoomPasscode(e.target.value)}
                      placeholder="Contoh: DSN2026"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section: Peserta yang Diundang */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                <Users size={15} className="text-amber-600" />
                4. Peserta yang Diundang Wawancara
              </div>
              <span className="text-[10px] font-bold text-slate-500">
                {selectedCandidates.length} Terpilih
              </span>
            </div>

            <div className="space-y-2">
              {candidatesList.map((c: any, idx: number) => {
                const name = c.name || `Calon #${idx + 1}`;
                const isChecked = selectedCandidates.includes(name);
                return (
                  <label
                    key={idx}
                    className={cn(
                      "flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all",
                      isChecked
                        ? "bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200"
                        : "bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-500"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleCandidate(name)}
                      className="w-4 h-4 rounded text-amber-600 accent-amber-600 cursor-pointer"
                    />
                    <span className="font-bold flex-1">{name}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Calon #{idx + 1}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Input Tambah Peserta Custom */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={candidateInput}
                onChange={(e) => setCandidateInput(e.target.value)}
                placeholder="Tambah nama peserta lain (contoh: Direktur RS)..."
                className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              <button
                type="button"
                onClick={handleAddCandidate}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
              >
                + Tambah
              </button>
            </div>
          </div>

          {/* Section: Penandatangan Undangan */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              <ShieldCheck size={15} className="text-amber-600" />
              5. Penandatangan Surat Undangan Resmi
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nama Pejabat DSN-MUI
                </label>
                <input
                  type="text"
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Jabatan Penandatangan
                </label>
                <input
                  type="text"
                  value={signatoryRole}
                  onChange={(e) => setSignatoryRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>
          </div>

          {/* Workflow Impact Notice */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-1 leading-relaxed">
            <div className="font-bold flex items-center gap-1.5">
              <CalendarCheck size={14} className="text-amber-600" />
              Sinkronisasi Agenda Rapat, Email Pemohon & Portal Publik:
            </div>
            <p>
              Menerbitkan surat undangan ini akan <strong>mencatat jadwal ke tab Agenda Rapat internal</strong>, <strong>melampirkan surat keluar resmi</strong>, <strong>mengirimkan notifikasi email ke pihak pemohon</strong>, serta memperbarui jadwal dan berkas undangan di dashboard pemohon.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] py-3 text-xs font-bold text-white rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #996515 0%, #B8860B 45%, #D4AF37 100%)' }}
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <CalendarCheck size={16} /> Terbitkan Undangan Putaran Ke-{activeRound}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// ── MODAL INPUT PENILAIAN WAWANCARA (ASESMEN, DITERIMA / PERLU ULANG & JADWALKAN ULANG) ──
interface InterviewAssessmentModalProps {
  documentId: string;
  submissionNumber?: string;
  companyName?: string;
  companyLetterNumber?: string;
  round?: number;
  totalRounds?: number;
  candidatesList: any[];
  isHospital?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const InterviewAssessmentModal: React.FC<InterviewAssessmentModalProps> = ({
  documentId,
  submissionNumber,
  companyName,
  companyLetterNumber,
  round = 1,
  totalRounds = 1,
  candidatesList,
  isHospital,
  onClose,
  onSuccess,
}) => {
  const [selectedRound, setSelectedRound] = useState<number>(round);
  const [assessedByName, setAssessedByName] = useState<string>('Tim Asesor & Penguji DSN-MUI');
  const [score, setScore] = useState<number>(85);
  const [decision, setDecision] = useState<'DITERIMA' | 'DITOLAK'>('DITERIMA');
  const [notes, setNotes] = useState<string>(
    isHospital
      ? 'Kesiapan fasilitas, dokumen standar operasional syariah RS, komitmen direksi, dan pemahaman calon DPS dinyatakan memenuhi kualifikasi kesesuaian syariah DSN-MUI.'
      : 'Calon Dewan Pengawas Syariah menguasai materi fikih muamalah, regulasi industri, dan memiliki integritas pengawasan syariah yang baik.'
  );
  const [improvementNotes, setImprovementNotes] = useState<string>('');

  // Checklist & Data Form Undangan Wawancara Baru (Jika Ditolak)
  const nextRound = selectedRound + 1;
  const [scheduleNewInterview, setScheduleNewInterview] = useState<boolean>(true);

  const [newInvitationNumber, setNewInvitationNumber] = useState<string>(
    `UND-WW/DSN-MUI/IX/2026/${Math.floor(100 + Math.random() * 900)}`
  );
  const [newInvitationDateIso, setNewInvitationDateIso] = useState<string>(getTodayIso());
  const [newInvitationDate, setNewInvitationDate] = useState<string>(() =>
    formatIndonesianDate(getTodayIso(), false)
  );
  const [newInterviewDateIso, setNewInterviewDateIso] = useState<string>(getDefaultInterviewDateIso());
  const [newInterviewDayDate, setNewInterviewDayDate] = useState<string>(() =>
    formatIndonesianDate(getDefaultInterviewDateIso(), true)
  );
  const [newInterviewTime, setNewInterviewTime] = useState<string>('09:30 - 12:00');
  const [newFormat, setNewFormat] = useState<'OFFLINE' | 'ONLINE' | 'HYBRID'>('OFFLINE');
  const [newVenue, setNewVenue] = useState<string>(DEFAULT_DSN_OFFICE_ADDRESS);
  const [newZoomUrl, setNewZoomUrl] = useState<string>('');
  const [newZoomMeetingId, setNewZoomMeetingId] = useState<string>('');
  const [newZoomPasscode, setNewZoomPasscode] = useState<string>('');
  const [newSubject, setNewSubject] = useState<string>(
    isHospital
      ? `Undangan Wawancara & Asesmen Sertifikasi Syariah Rumah Sakit (Putaran Ke-${nextRound}) Terkait Surat No. ${companyLetterNumber || submissionNumber || '-'}`
      : `Undangan Wawancara Uji Kepatutan dan Kelayakan Calon Anggota DPS (Putaran Ke-${nextRound}) Terkait Surat No. ${companyLetterNumber || submissionNumber || '-'}`
  );

  const initialNewCandidates = useMemo(() => {
    if (candidatesList.length > 0) {
      return candidatesList.map((c: any) => c.name || `Calon #${c.id}`);
    }
    return isHospital
      ? ['Direksi & Manajemen Rumah Sakit', 'Calon Dewan Pengawas Syariah']
      : ['Calon Anggota Dewan Pengawas Syariah'];
  }, [candidatesList, isHospital]);

  const [newSelectedCandidates, setNewSelectedCandidates] = useState<string[]>(initialNewCandidates);
  const [newCandidateInput, setNewCandidateInput] = useState<string>('');
  const [newDresscode, setNewDresscode] = useState<string>(
    'Pakaian Sipil Lengkap / Batik Lengan Panjang / Jas Rapi'
  );
  const [newRequirements, setNewRequirements] = useState<string>(
    isHospital
      ? 'Membawa berkas fisik legalitas RS, sertifikat MUKISI, kesiapan operasional syariah, serta dokumen calon DPS yang telah diperbaiki.'
      : 'Membawa berkas fisik asli, portofolio riwayat hidup, serta bahan pemaparan kesiapan kepengawasan syariah yang telah diperbaiki.'
  );
  const [newContactPerson, setNewContactPerson] = useState<string>(
    'Sekretariat DSN-MUI (021-3904141 / WhatsApp: 0812-3456-7890)'
  );
  const [newNotes, setNewNotes] = useState<string>(
    'Peserta dimohon hadir 15 menit sebelum waktu wawancara dimulai dan membawa materi perbaikan sesuai arahan asesor.'
  );
  const [newSignatoryName, setNewSignatoryName] = useState<string>(DEFAULT_SIGNATORY_NAME);
  const [newSignatoryRole, setNewSignatoryRole] = useState<string>(DEFAULT_SIGNATORY_ROLE);

  // ── Surat Keluar Attachment for Retry Interview ──
  const [newOutgoingLetters, setNewOutgoingLetters] = useState<any[]>([]);
  const [newLoadingLetters, setNewLoadingLetters] = useState<boolean>(false);
  const [newLetterSearchQuery, setNewLetterSearchQuery] = useState<string>('');
  const [isNewSearchDropdownOpen, setIsNewSearchDropdownOpen] = useState<boolean>(false);
  const [newSelectedLetter, setNewSelectedLetter] = useState<any | null>(null);

  useEffect(() => {
    if (!scheduleNewInterview || decision !== 'DITOLAK') return;
    let isMounted = true;
    const fetchOutgoingLetters = async () => {
      setNewLoadingLetters(true);
      try {
        const res = await api.get('/documents', {
          params: {
            documentType: 'OUTGOING',
            search: newLetterSearchQuery.trim() || undefined,
            limit: 25,
          },
        });
        if (isMounted) {
          setNewOutgoingLetters(res.data?.data || []);
        }
      } catch (err) {
        console.error('Error fetching outgoing letters for retry interview:', err);
      } finally {
        if (isMounted) setNewLoadingLetters(false);
      }
    };

    const timer = setTimeout(fetchOutgoingLetters, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [newLetterSearchQuery, scheduleNewInterview, decision]);

  const handleSelectNewLetter = (doc: any) => {
    setNewSelectedLetter(doc);
    setIsNewSearchDropdownOpen(false);
    if (doc.documentNumber) {
      setNewInvitationNumber(doc.documentNumber);
    }
    if (doc.title) {
      setNewSubject(doc.title);
    }
  };

  const handleClearNewSelectedLetter = () => {
    setNewSelectedLetter(null);
  };

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleToggleNewCandidate = (name: string) => {
    if (newSelectedCandidates.includes(name)) {
      if (newSelectedCandidates.length === 1) return;
      setNewSelectedCandidates(newSelectedCandidates.filter((c) => c !== name));
    } else {
      setNewSelectedCandidates([...newSelectedCandidates, name]);
    }
  };

  const handleAddNewCandidate = () => {
    if (newCandidateInput.trim() && !newSelectedCandidates.includes(newCandidateInput.trim())) {
      setNewSelectedCandidates([...newSelectedCandidates, newCandidateInput.trim()]);
      setNewCandidateInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Simpan Penilaian Hasil Wawancara (Asesmen)
      await api.post(`/documents/${documentId}/interview-assessment`, {
        round: selectedRound,
        assessedByName: assessedByName.trim(),
        score,
        decision,
        notes: notes.trim(),
        improvementNotes: decision === 'DITOLAK' ? improvementNotes.trim() : null,
      });

      // 2. Jika Ditolak dan user mencentang pembuatan undangan wawancara baru, buatkan langsung
      if (decision === 'DITOLAK' && scheduleNewInterview) {
        const effectiveVenue =
          newFormat === 'ONLINE'
            ? 'Online via Zoom Meeting DSN-MUI'
            : newVenue.trim() || DEFAULT_DSN_OFFICE_ADDRESS;

        await api.post(`/documents/${documentId}/interview-invitation`, {
          round: nextRound,
          invitationNumber: newInvitationNumber.trim(),
          invitationDate: newInvitationDate.trim() || formatIndonesianDate(newInvitationDateIso, false),
          interviewDayDate:
            newInterviewDayDate.trim() || formatIndonesianDate(newInterviewDateIso, true),
          interviewTime: newInterviewTime.trim(),
          format: newFormat,
          venue: effectiveVenue,
          zoomUrl: newFormat !== 'OFFLINE' ? newZoomUrl.trim() || undefined : undefined,
          zoomMeetingId: newFormat !== 'OFFLINE' ? newZoomMeetingId.trim() || undefined : undefined,
          zoomPasscode: newFormat !== 'OFFLINE' ? newZoomPasscode.trim() || undefined : undefined,
          subject: newSubject.trim(),
          candidates: newSelectedCandidates,
          dresscode: newDresscode.trim(),
          requirements: newRequirements.trim(),
          contactPerson: newContactPerson.trim(),
          notes: newNotes.trim() || undefined,
          signatoryName: newSignatoryName.trim() || DEFAULT_SIGNATORY_NAME,
          signatoryRole: newSignatoryRole.trim() || DEFAULT_SIGNATORY_ROLE,
          outgoingLetterId: newSelectedLetter?.id || undefined,
          outgoingLetterNumber: newSelectedLetter?.documentNumber || undefined,
          outgoingLetterTitle: newSelectedLetter?.title || undefined,
          outgoingLetterFileUrl: newSelectedLetter?.versions?.[0]?.fileUrl || newSelectedLetter?.fileUrl || undefined,
          outgoingLetterFileName: newSelectedLetter?.versions?.[0]?.fileName || newSelectedLetter?.fileName || undefined,
          syncMeetingAgenda: true,
        });
      }

      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || 'Gagal menyimpan penilaian wawancara.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[165] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 animate-in zoom-in-95 duration-200 space-y-6 custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center font-black">
              <Award size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                  Penilaian Hasil Wawancara (Asesmen)
                </h3>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800">
                  Putaran Ke-{selectedRound}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Input evaluasi penguji, penetapan skor nilai, dan keputusan kelulusan / pengulangan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Radio Keputusan */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Keputusan Hasil Wawancara *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={cn(
                  "p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-2",
                  decision === 'DITERIMA'
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60"
                )}
                onClick={() => setDecision('DITERIMA')}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    DITERIMA / LULUS
                  </span>
                  <input
                    type="radio"
                    name="decision"
                    checked={decision === 'DITERIMA'}
                    onChange={() => setDecision('DITERIMA')}
                    className="accent-emerald-600"
                  />
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Lulus wawancara. Tahapan berlanjut ke Proses Internal & Persiapan Sertifikat.
                </p>
              </label>

              <label
                className={cn(
                  "p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-2",
                  decision === 'DITOLAK'
                    ? "bg-rose-50 dark:bg-rose-950/40 border-rose-600 shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60"
                )}
                onClick={() => setDecision('DITOLAK')}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-rose-800 dark:text-rose-200 flex items-center gap-1.5">
                    <AlertTriangle size={16} className="text-rose-600" />
                    DITOLAK / PERLU ULANG
                  </span>
                  <input
                    type="radio"
                    name="decision"
                    checked={decision === 'DITOLAK'}
                    onChange={() => setDecision('DITOLAK')}
                    className="accent-rose-600"
                  />
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Belum memenuhi standar. DSN dapat membuat jadwal wawancara ulang langsung.
                </p>
              </label>
            </div>
          </div>

          {/* Tim Penilai & Skor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Nama Asesor / Tim Penguji *
              </label>
              <input
                type="text"
                required
                value={assessedByName}
                onChange={(e) => setAssessedByName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nilai / Skor Wawancara (0 - 100) *
                </label>
                <span className="text-xs font-mono font-black text-emerald-700 dark:text-emerald-400">
                  {score} / 100
                </span>
              </div>
              <input
                type="number"
                min={0}
                max={100}
                required
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-black outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Catatan Evaluasi */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Catatan Evaluasi Wawancara *
            </label>
            <textarea
              rows={3}
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tuliskan catatan evaluasi hasil wawancara..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none font-medium"
            />
          </div>

          {/* Jika Ditolak: Catatan Perbaikan & Checklist Buat Undangan Wawancara Baru */}
          {decision === 'DITOLAK' && (
            <div className="space-y-4 animate-in fade-in duration-200 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-rose-700 dark:text-rose-400">
                  Arahan & Catatan Perbaikan untuk Wawancara Ulang
                </label>
                <textarea
                  rows={2}
                  value={improvementNotes}
                  onChange={(e) => setImprovementNotes(e.target.value)}
                  placeholder="Contoh: Pemohon diminta mempelajari kembali fatwa terkait dan melengkapi portofolio kesiapan pengawasan..."
                  className="w-full px-3.5 py-2.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500/20 resize-none font-medium"
                />
              </div>

              {/* Checklist & Form Undangan Wawancara Baru */}
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={scheduleNewInterview}
                    onChange={(e) => setScheduleNewInterview(e.target.checked)}
                    className="w-5 h-5 rounded text-amber-600 accent-amber-600 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-amber-950 dark:text-amber-200">
                        Buat & Jadwalkan Surat Undangan Wawancara Baru (Putaran Ke-{nextRound})
                      </span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                        Putaran Ke-{nextRound}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                      Centang untuk langsung menerbitkan surat undangan wawancara putaran berikutnya kepada pemohon.
                    </p>
                  </div>
                </label>

                {scheduleNewInterview && (
                  <div className="pt-4 border-t border-amber-200/80 dark:border-amber-800/60 space-y-4 animate-in fade-in duration-200">
                    {/* 1. Lampiran Dokumen Surat Keluar Resmi DSN-MUI (Opsional) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wider">
                          <Paperclip size={14} className="text-amber-600" />
                          1. Lampiran Surat Keluar Resmi DSN-MUI (Opsional)
                        </div>
                        {newSelectedLetter && (
                          <button
                            type="button"
                            onClick={handleClearNewSelectedLetter}
                            className="text-[10px] text-rose-600 hover:text-rose-700 font-bold hover:underline"
                          >
                            Lepas Lampiran
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                        Cari dan hubungkan draf / surat resmi dari modul <strong>Surat Keluar</strong> untuk dilampirkan langsung pada undangan wawancara putaran ini.
                      </p>

                      {newSelectedLetter ? (
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 flex items-center justify-between gap-3 shadow-xs">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                Terlampir
                              </span>
                              <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                {newSelectedLetter.documentNumber || 'Draf Surat'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate mt-0.5">
                              {newSelectedLetter.title}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleClearNewSelectedLetter}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Ganti surat"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="relative">
                            <input
                              type="text"
                              value={newLetterSearchQuery}
                              onChange={(e) => {
                                setNewLetterSearchQuery(e.target.value);
                                setIsNewSearchDropdownOpen(true);
                              }}
                              onFocus={() => setIsNewSearchDropdownOpen(true)}
                              placeholder="Ketik untuk mencari surat keluar (nomor / perihal)..."
                              className="w-full pl-8 pr-7 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                            {newLoadingLetters && (
                              <div className="absolute right-2.5 top-2.5">
                                <Loader2 size={14} className="animate-spin text-amber-600" />
                              </div>
                            )}
                          </div>

                          {isNewSearchDropdownOpen && (
                            <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto p-1 space-y-1 custom-scrollbar">
                              {newOutgoingLetters.length === 0 ? (
                                <div className="p-2.5 text-center text-xs text-slate-500">
                                  {newLoadingLetters ? 'Mencari surat keluar...' : 'Tidak ada surat keluar ditemukan'}
                                </div>
                              ) : (
                                newOutgoingLetters.map((doc: any) => (
                                  <button
                                    key={doc.id}
                                    type="button"
                                    onClick={() => handleSelectNewLetter(doc)}
                                    className="w-full text-left p-2 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors flex items-start justify-between gap-2 group cursor-pointer"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-mono text-xs font-bold text-amber-800 dark:text-amber-300">
                                          {doc.documentNumber || 'Draft Tanpa Nomor'}
                                        </span>
                                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                                          {doc.status}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate mt-0.5">
                                        {doc.title}
                                      </p>
                                    </div>
                                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 opacity-0 group-hover:opacity-100 shrink-0 self-center">
                                      Pilih +
                                    </span>
                                  </button>
                                ))
                              )}
                              <div className="p-1 border-t border-slate-100 dark:border-slate-700 text-center">
                                <button
                                  type="button"
                                  onClick={() => setIsNewSearchDropdownOpen(false)}
                                  className="text-[10px] font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                                >
                                  Tutup Pencarian
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 2. Identitas Surat Undangan Baru */}
                    <div className="space-y-3 pt-2 border-t border-amber-200/60 dark:border-amber-800/40">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wider">
                        <FileText size={14} className="text-amber-600" />
                        2. Identitas Surat Undangan Putaran Ke-{nextRound}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Nomor Surat Undangan *
                          </label>
                          <input
                            type="text"
                            required={scheduleNewInterview}
                            value={newInvitationNumber}
                            onChange={(e) => setNewInvitationNumber(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Tanggal Surat Diterbitkan *
                          </label>
                          <input
                            type="date"
                            required={scheduleNewInterview}
                            value={newInvitationDateIso}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNewInvitationDateIso(val);
                              setNewInvitationDate(formatIndonesianDate(val, false));
                            }}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                          {newInvitationDate && (
                            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                              Format: {newInvitationDate}
                            </p>
                          )}
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Perihal Undangan *
                          </label>
                          <input
                            type="text"
                            required={scheduleNewInterview}
                            value={newSubject}
                            onChange={(e) => setNewSubject(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 3. Jadwal & Lokasi Pelaksanaan Baru */}
                    <div className="space-y-3 pt-2 border-t border-amber-200/60 dark:border-amber-800/40">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wider">
                        <Calendar size={14} className="text-amber-600" />
                        3. Jadwal & Lokasi Pelaksanaan
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Hari & Tanggal Wawancara *
                          </label>
                          <input
                            type="date"
                            required={scheduleNewInterview}
                            value={newInterviewDateIso}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNewInterviewDateIso(val);
                              setNewInterviewDayDate(formatIndonesianDate(val, true));
                            }}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                          {newInterviewDayDate && (
                            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                              Format: {newInterviewDayDate}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Waktu Pelaksanaan (WIB) *
                          </label>
                          <input
                            type="text"
                            required={scheduleNewInterview}
                            value={newInterviewTime}
                            onChange={(e) => setNewInterviewTime(e.target.value)}
                            placeholder="Contoh: 09:30 - 12:00"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Format Pelaksanaan Wawancara *
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { key: 'OFFLINE', label: 'Tatap Muka (Offline)' },
                              { key: 'ONLINE', label: 'Daring (Zoom / Online)' },
                              { key: 'HYBRID', label: 'Hybrid (Campuran)' },
                            ].map((f) => (
                              <button
                                key={f.key}
                                type="button"
                                onClick={() => {
                                  setNewFormat(f.key as any);
                                  if (f.key !== 'ONLINE' && (!newVenue || newVenue.includes('Zoom'))) {
                                    setNewVenue(DEFAULT_DSN_OFFICE_ADDRESS);
                                  }
                                }}
                                className={cn(
                                  "py-1.5 px-2.5 rounded-xl border text-[11px] font-bold transition-all",
                                  newFormat === f.key
                                    ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                                )}
                              >
                                {f.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Tempat / Ruangan Pelaksanaan (Disembunyikan jika metode Online/Daring) */}
                        {newFormat !== 'ONLINE' && (
                          <div className="sm:col-span-2 space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                Tempat / Ruangan Pelaksanaan *
                              </label>
                              <button
                                type="button"
                                onClick={() => setNewVenue(DEFAULT_DSN_OFFICE_ADDRESS)}
                                className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold hover:underline"
                              >
                                Gunakan Alamat Kantor DSN-MUI
                              </button>
                            </div>
                            <textarea
                              rows={2}
                              required={scheduleNewInterview}
                              value={newVenue}
                              onChange={(e) => setNewVenue(e.target.value)}
                              placeholder={`Contoh: ${DEFAULT_DSN_OFFICE_ADDRESS}`}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500/20 resize-none font-medium"
                            />
                          </div>
                        )}

                        {newFormat !== 'OFFLINE' && (
                          <>
                            <div className="sm:col-span-2 space-y-1">
                              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                Tautan Zoom Meeting (Opsional)
                              </label>
                              <input
                                type="text"
                                value={newZoomUrl}
                                onChange={(e) => setNewZoomUrl(e.target.value)}
                                placeholder="https://zoom.us/j/..."
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-amber-500/20"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                Meeting ID
                              </label>
                              <input
                                type="text"
                                value={newZoomMeetingId}
                                onChange={(e) => setNewZoomMeetingId(e.target.value)}
                                placeholder="Contoh: 891 2345 6789"
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-amber-500/20"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                Passcode
                              </label>
                              <input
                                type="text"
                                value={newZoomPasscode}
                                onChange={(e) => setNewZoomPasscode(e.target.value)}
                                placeholder="Contoh: DSN2026"
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-amber-500/20"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 4. Peserta yang Diundang Baru */}
                    <div className="space-y-2 pt-2 border-t border-amber-200/60 dark:border-amber-800/40">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wider">
                          <Users size={14} className="text-amber-600" />
                          4. Peserta Wawancara Ulang ({newSelectedCandidates.length} Terpilih)
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {candidatesList.map((c: any, idx: number) => {
                          const name = c.name || `Calon #${idx + 1}`;
                          const isChecked = newSelectedCandidates.includes(name);
                          return (
                            <label
                              key={idx}
                              className={cn(
                                "flex items-center gap-2.5 p-2 rounded-xl border text-xs font-medium cursor-pointer transition-all",
                                isChecked
                                  ? "bg-amber-100/70 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200"
                                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleNewCandidate(name)}
                                className="w-4 h-4 rounded text-amber-600 accent-amber-600 cursor-pointer"
                              />
                              <span className="font-bold flex-1">{name}</span>
                              <span className="text-[10px] font-mono text-slate-400">Calon #{idx + 1}</span>
                            </label>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={newCandidateInput}
                          onChange={(e) => setNewCandidateInput(e.target.value)}
                          placeholder="Tambah nama peserta lain..."
                          className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                        <button
                          type="button"
                          onClick={handleAddNewCandidate}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
                        >
                          + Tambah
                        </button>
                      </div>
                    </div>

                    {/* 5. Penandatangan Undangan Baru */}
                    <div className="space-y-3 pt-2 border-t border-amber-200/60 dark:border-amber-800/40">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wider">
                        <ShieldCheck size={14} className="text-amber-600" />
                        5. Penandatangan Surat Undangan Resmi
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Nama Pejabat DSN-MUI
                          </label>
                          <input
                            type="text"
                            value={newSignatoryName}
                            onChange={(e) => setNewSignatoryName(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Jabatan Penandatangan
                          </label>
                          <input
                            type="text"
                            value={newSignatoryRole}
                            onChange={(e) => setNewSignatoryRole(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] py-3 text-xs font-bold text-white rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              style={{
                background:
                  decision === 'DITERIMA'
                    ? 'linear-gradient(135deg, #006633 0%, #1B7F4A 100%)'
                    : 'linear-gradient(135deg, #be123c 0%, #e11d48 100%)',
              }}
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Award size={16} /> Simpan Penilaian ({decision})
                  {decision === 'DITOLAK' && scheduleNewInterview && ` & Terbitkan Undangan Ke-${nextRound}`}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── MODAL UPLOAD SERTIFIKAT YANG SUDAH SIAP (PENYELESAIAN PROSES & HITUNG SLA) ──
interface UploadReadyCertificateModalProps {
  documentId: string;
  defaultCertNumber?: string;
  defaultTitle?: string;
  isHospital?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const UploadReadyCertificateModal: React.FC<UploadReadyCertificateModalProps> = ({
  documentId,
  defaultCertNumber,
  defaultTitle,
  isHospital,
  onClose,
  onSuccess,
}) => {
  const [certificateNumber, setCertificateNumber] = useState<string>(
    defaultCertNumber ||
      (isHospital
        ? `DSN-MUI/KS-RS/2026/${Math.floor(100 + Math.random() * 900)}`
        : `DSN-MUI/DPS/2026/${Math.floor(100 + Math.random() * 900)}`)
  );
  const [title, setTitle] = useState<string>(
    defaultTitle ||
      (isHospital
        ? 'Sertifikat Kesesuaian Syariah Rumah Sakit'
        : 'Surat Rekomendasi Dewan Pengawas Syariah DSN-MUI')
  );
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState<string>('Sertifikat resmi bertanda tangan sah pimpinan DSN-MUI.');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('Berkas PDF sertifikat resmi wajib dipilih.');
      return;
    }
    if (!certificateNumber.trim() || !title.trim()) {
      setErrorMessage('Nomor sertifikat dan judul sertifikat wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('certificateNumber', certificateNumber.trim());
      formData.append('title', title.trim());
      formData.append('issueDate', issueDate);
      formData.append('validUntil', validUntil);
      formData.append('notes', notes.trim());

      await api.post(`/documents/${documentId}/upload-certificate`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || 'Gagal mengunggah sertifikat resmi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[165] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 animate-in zoom-in-95 duration-200 space-y-6 custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center font-black">
              <FileBadge size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                  Upload Sertifikat yang Sudah Siap (PDF)
                </h3>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800">
                  Tahap Akhir (Selesai)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Penandatanganan terjadi di luar sistem. Unggah PDF final untuk menuntaskan SLA dan menerbitkan sertifikat ke portal pemohon.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* File Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              File PDF Sertifikat Bertanda Tangan Sah *
            </label>
            <div className="p-4 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 text-center space-y-2">
              <input
                type="file"
                accept="application/pdf"
                required
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="cert-file-upload"
              />
              <label htmlFor="cert-file-upload" className="cursor-pointer block space-y-1">
                <UploadCloud className="mx-auto text-emerald-600" size={32} />
                <p className="text-xs font-bold text-slate-800 dark:text-white">
                  {file ? file.name : 'Klik untuk memilih file PDF sertifikat'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB • Terpilih` : 'Format PDF maksimal 15MB'}
                </p>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Nomor Sertifikat Resmi *
              </label>
              <input
                type="text"
                required
                value={certificateNumber}
                onChange={(e) => setCertificateNumber(e.target.value)}
                placeholder="Contoh: DSN-MUI/KS-RS/2026/0019"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Judul Sertifikat *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tanggal Terbit *
              </label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Masa Berlaku Hingga *
              </label>
              <input
                type="date"
                required
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Catatan Tambahan Penerbitan
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Workflow Impact Notice */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 space-y-1 leading-relaxed">
            <div className="font-bold flex items-center gap-1.5">
              <Sparkles size={14} className="text-emerald-600" />
              Penyelesaian Permohonan & Kepatuhan SLA:
            </div>
            <p>
              Mengunggah sertifikat akan <strong>menuntaskan status pengajuan menjadi SELESAI</strong>, mencatat tanggal penyelesaian riil, menghitung kepatuhan SLA 14 hari kerja, serta langsung menerbitkan tombol unduh sertifikat resmi di portal pemohon.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] py-3 text-xs font-bold text-white rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #006633 0%, #1B7F4A 100%)' }}
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <FileBadge size={16} /> Terbitkan & Selesaikan Pengajuan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── MODAL BUAT AGENDA RAPAT DENGAN SEMUA DOKUMEN PENGAJUAN TERBAWA ────────
interface CreateMeetingAgendaModalProps {
  documentId: string;
  defaultTitle: string;
  submissionDocs: { title: string; fileName: string; fileUrl: string; group?: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

const CreateMeetingAgendaModal: React.FC<CreateMeetingAgendaModalProps> = ({
  documentId,
  defaultTitle,
  submissionDocs,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState<string>(`Rapat Pembahasan: ${defaultTitle}`);
  const [agendaNumber, setAgendaNumber] = useState<string>('');
  const [dateTime, setDateTime] = useState<string>('');
  const [endDateTime, setEndDateTime] = useState<string>('');
  const [location, setLocation] = useState<string>(DEFAULT_DSN_OFFICE_ADDRESS);
  const [targetType, setTargetType] = useState<string>('ALL_BOARD');
  const [description, setDescription] = useState<string>('');
  const [selectedDocs, setSelectedDocs] = useState<string[]>(submissionDocs.map((d) => d.title));
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Set default datetime to tomorrow at 09:30
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 30, 0, 0);
    setDateTime(tomorrow.toISOString().slice(0, 16));

    const end = new Date(tomorrow);
    end.setHours(12, 0, 0, 0);
    setEndDateTime(end.toISOString().slice(0, 16));
  }, []);

  const toggleDoc = (docTitle: string) => {
    setSelectedDocs((prev) =>
      prev.includes(docTitle) ? prev.filter((t) => t !== docTitle) : [...prev, docTitle]
    );
  };

  const handleSelectAllDocs = () => {
    if (selectedDocs.length === submissionDocs.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(submissionDocs.map((d) => d.title));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dateTime || !location) {
      setErrorMessage('Judul rapat, waktu, dan lokasi wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await api.post('/meetings', {
        documentId,
        title: title.trim(),
        agendaNumber: agendaNumber.trim() || undefined,
        dateTime,
        endDateTime: endDateTime || undefined,
        location: location.trim(),
        targetType,
        description: description.trim() || undefined,
        attachedDocTitles: selectedDocs,
      });
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || 'Gagal membuat agenda rapat.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
              <CalendarDays size={22} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                Buat Agenda Rapat Baru
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Setiap surat dapat memiliki multiple flow rapat. Seluruh dokumen pengajuan otomatis disertakan.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Judul Agenda Rapat *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Rapat Uji Kepatutan & Wawancara Calon DPS PT X"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Waktu Mulai Rapat *
              </label>
              <input
                type="datetime-local"
                required
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Waktu Selesai (Opsional)
              </label>
              <input
                type="datetime-local"
                value={endDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Lokasi / Link Pertemuan *
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={`Contoh: ${DEFAULT_DSN_OFFICE_ADDRESS} / Zoom`}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Sasaran Peserta Rapat *
              </label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="ALL_BOARD">Badan Pengurus Harian & Anggota Pleno</option>
                <option value="EXECUTIVE">Pimpinan Harian Saja</option>
                <option value="SECRETARIAT">Kesekretariatan DSN-MUI</option>
                <option value="DEPARTMENT">Komisi / Bidang Terkait</option>
                <option value="ALL">Seluruh Pengurus DSN-MUI</option>
              </select>
            </div>
          </div>

          {/* ── Bawa Semua Dokumen Pengajuan (Requirement Checkbox List) ── */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck2 size={16} className="text-emerald-600" />
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Dokumen Bawaan Rapat (Otomatis Disertakan)
                </label>
              </div>
              <button
                type="button"
                onClick={handleSelectAllDocs}
                className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                {selectedDocs.length === submissionDocs.length ? 'Batal Pilih Semua' : 'Pilih Semua Dokumen'}
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
              {submissionDocs.map((doc, idx) => {
                const isChecked = selectedDocs.includes(doc.title);
                return (
                  <label
                    key={idx}
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer",
                      isChecked
                        ? "bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800 text-slate-900 dark:text-white"
                        : "bg-transparent border-transparent text-slate-400 opacity-60"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleDoc(doc.title)}
                      className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer shrink-0"
                    />
                    <FileText size={15} className={isChecked ? "text-emerald-600 shrink-0" : "text-slate-400 shrink-0"} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{doc.title}</p>
                      {doc.fileName && (
                        <p className="text-[10px] text-slate-400 font-mono truncate">{doc.fileName}</p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Seluruh dokumen terpilih di atas akan otomatis disertakan sebagai materi pembahasan rapat bagi peserta.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Catatan / Pokok Bahasan Rapat
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan pokok agenda pembahasan yang akan diuji..."
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          {/* Footer Submit */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] py-3 text-xs font-bold text-white rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #006633 0%, #1B7F4A 100%)' }}
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <CalendarDays size={16} /> Terbitkan Agenda Rapat ({selectedDocs.length} Berkas)
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── MAIN COMPONENT: DOCUMENT DETAIL PAGE (RICH PERSURATAN UI) ─────────────
const DocumentDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTabParam = searchParams.get('tab');
  const initialCreateParam = searchParams.get('create') === 'true';

  const [activeTab, setActiveTab] = useState<'permohonan' | 'agenda' | 'evidence' | 'log'>(
    (initialTabParam as any) || 'permohonan'
  );

  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals
  const [isValidationModalOpen, setIsValidationModalOpen] = useState<boolean>(false);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState<boolean>(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState<boolean>(false);
  const [isUploadCertModalOpen, setIsUploadCertModalOpen] = useState<boolean>(false);
  const [interviewRoundToSchedule, setInterviewRoundToSchedule] = useState<number | null>(null);
  const [isCreateMeetingModalOpen, setIsCreateMeetingModalOpen] = useState<boolean>(initialCreateParam);
  const [readerDoc, setReaderDoc] = useState<{ title: string; fileUrl: string } | null>(null);

  // Workflow Dynamic Tools Modals
  const [isInvitePresentationModalOpen, setIsInvitePresentationModalOpen] = useState<boolean>(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState<boolean>(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState<boolean>(false);
  const [isSaveDpsModalOpen, setIsSaveDpsModalOpen] = useState<boolean>(false);
  const [isReplyEmailModalOpen, setIsReplyEmailModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  const user = useAuthStore((state) => state.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/documents/${params.id}`);
      setDoc(res.data.data);
    } catch (err: any) {
      setError("Gagal memuat detail dokumen persuratan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) fetchDetail();
  }, [params.id]);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-slate-400">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="font-semibold text-xs animate-pulse">Memuat informasi lengkap persuratan...</p>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-rose-500">
        <AlertCircle size={48} />
        <p className="font-bold text-sm">{error || "Dokumen tidak ditemukan"}</p>
        <button onClick={() => router.push('/surat-masuk')} className="text-xs font-bold underline">
          Kembali ke Surat Masuk
        </button>
      </div>
    );
  }

  const publicSub = doc.publicSubmissions?.[0];
  const isInternalDoc = !publicSub || doc.publicSubmissions?.length === 0;

  const totalEvidenceCount = (doc.versions?.length || 0) + (doc.evidenceFiles?.length || 0) + (doc.evidenceFolders?.reduce((acc: number, f: any) => acc + (f.files?.length || 0), 0) || 0);

  const isRsDoc = Boolean(
    doc.subCategory?.toLowerCase().includes('rumah sakit') ||
    publicSub?.submissionTypeName?.toLowerCase().includes('rumah sakit') ||
    doc.title?.toLowerCase().includes('rumah sakit') ||
    doc.category?.name?.toLowerCase().includes('rumah sakit')
  );

  const isDpsDoc = Boolean(
    !isRsDoc &&
    publicSub &&
      (publicSub.dpsStage ||
        publicSub.submissionTypeName?.toLowerCase().includes('dps') ||
        publicSub.submissionTypeName?.toLowerCase().includes('pengawas syariah') ||
        (publicSub.candidates && publicSub.candidates.length > 0))
  );

  const isDpsOrRsDoc = isDpsDoc || isRsDoc;

  const isApproved =
    doc.status === 'DISETUJUI' ||
    doc.status === 'SELESAI' ||
    publicSub?.status === 'DISETUJUI' ||
    publicSub?.status === 'SELESAI' ||
    publicSub?.dpsStage === 'LULUS';

  const hasCertificate = Boolean(doc.shariaCertificate || publicSub?.certificateUrl || doc.status === 'SELESAI');

  // 14 Working Days SLA Calculation (Senin - Jumat)
  const slaDateStart = publicSub?.submittedAt || doc.receivedDate || doc.createdAt;
  const slaDateEnd = publicSub?.completedAt || (doc.status === 'SELESAI' ? (publicSub?.updatedAt || doc.updatedAt) : null);
  const slaStatus = calculateSlaStatus(slaDateStart, slaDateEnd, 14);

  let candidatesList: any[] = [];
  if (publicSub?.candidates) {
    if (Array.isArray(publicSub.candidates)) {
      candidatesList = publicSub.candidates;
    } else {
      try {
        candidatesList = JSON.parse(publicSub.candidates);
      } catch {
        candidatesList = [];
      }
    }
  }

  // Total documents across all categories (Public, Candidates, Hospital, Versions, Folders, Files)
  let totalCandidateDocsCount = 0;
  candidatesList.forEach((c: any) => {
    if (Array.isArray(c.documents)) {
      totalCandidateDocsCount += c.documents.length;
    } else if (c.documents && typeof c.documents === 'object') {
      totalCandidateDocsCount += Object.values(c.documents).filter((d: any) => d && (d.fileUrl || d.fileName)).length;
    }
  });

  const totalPublicDocsCount = (publicSub?.documents?.length || 0) + (publicSub?.companyLetterUrl || publicSub?.coverLetterUrl ? 1 : 0);
  const totalAllDocumentsCount = totalEvidenceCount + totalCandidateDocsCount + totalPublicDocsCount;

  const dpsStages = [
    { key: 'PROSES_PENGAJUAN', step: 1, label: '1. Proses Pengajuan' },
    { key: 'VALIDASI_DOKUMEN', step: 2, label: '2. Validasi Dokumen' },
    { key: 'WAWANCARA', step: 3, label: '3. Wawancara' },
    { key: 'PROSES_INTERNAL', step: 4, label: '4. Proses Internal' },
    { key: 'LULUS', step: 5, label: '5. Lulus (Rekomendasi)' },
  ];

  const rsStages = [
    { key: 'PROSES_PENGAJUAN', step: 1, label: '1. Pengajuan RS' },
    { key: 'VALIDASI_DOKUMEN', step: 2, label: '2. Validasi Dokumen & SOP' },
    { key: 'WAWANCARA', step: 3, label: '3. Wawancara Asesmen' },
    { key: 'PROSES_INTERNAL', step: 4, label: '4. Proses Internal' },
    { key: 'LULUS', step: 5, label: '5. Selesai (Sertifikat)' },
  ];

  const flowStages = isRsDoc ? rsStages : dpsStages;
  const currentDpsStage = publicSub?.dpsStage || 'PROSES_PENGAJUAN';
  const getDpsStageIndex = (st: string) => {
    switch (st) {
      case 'PROSES_PENGAJUAN': return 0;
      case 'VALIDASI_DOKUMEN': return 1;
      case 'WAWANCARA': return 2;
      case 'PROSES_INTERNAL': return 3;
      case 'LULUS': return 4;
      case 'TIDAK_LULUS': return 4;
      default: return 0;
    }
  };
  const activeDpsStageIdx = getDpsStageIndex(currentDpsStage);

  // Compute elapsed days
  const dateForDays = doc.receivedDate || doc.documentDate || doc.createdAt;
  const daysElapsed = doc.daysElapsed !== undefined
    ? doc.daysElapsed
    : Math.max(0, Math.floor((Date.now() - new Date(dateForDays).getTime()) / (1000 * 60 * 60 * 24)));

  // Collect all submission documents for carrying into meetings
  const allSubmissionDocsForMeeting: { title: string; fileName: string; fileUrl: string; group?: string }[] = [];

  if (publicSub?.officialLetterUrl) {
    allSubmissionDocsForMeeting.push({
      title: 'Surat Permohonan / Pengantar Resmi Perusahaan',
      fileName: publicSub.officialLetterName || 'Surat_Pengantar.pdf',
      fileUrl: publicSub.officialLetterUrl,
      group: 'Perusahaan',
    });
  }

  candidatesList.forEach((cand: any, cIdx: number) => {
    const normDocs = getNormalizedCandidateDocs(cand.documents);
    normDocs.forEach((d: any) => {
      if (d.fileUrl) {
        allSubmissionDocsForMeeting.push({
          title: `[Calon #${cIdx + 1}: ${cand.name}] ${d.title}`,
          fileName: d.fileName || 'berkas.pdf',
          fileUrl: d.fileUrl,
          group: cand.name,
        });
      }
    });
  });

  // Supporting evidence files
  (doc.evidenceFiles || []).forEach((ef: any) => {
    if (ef.fileUrl) {
      allSubmissionDocsForMeeting.push({
        title: ef.name || 'Berkas Lampiran Evidence',
        fileName: ef.name || 'lampiran.pdf',
        fileUrl: ef.fileUrl,
        group: 'Evidence',
      });
    }
  });

  // Additional Dokumen Lain
  const additionalDoc = publicSub?.documents?.find(
    (d: any) =>
      d.requirementName?.toLowerCase().includes('dokumen lain') ||
      d.requirementName?.toLowerCase().includes('pendukung tambahan')
  );
  if (additionalDoc && additionalDoc.fileUrl) {
    allSubmissionDocsForMeeting.push({
      title: 'Dokumen Lain (Pendukung Tambahan)',
      fileName: additionalDoc.fileName,
      fileUrl: additionalDoc.fileUrl,
      group: 'Pendukung',
    });
  }

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto px-2 sm:px-4">
      {/* ── BREADCRUMB / TOP NAVIGATION ── */}
      <div className="flex items-center justify-between py-1">
        <button
          onClick={() => router.push('/surat-masuk')}
          className="flex items-center gap-2 text-slate-600 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400 font-bold transition-all group text-xs sm:text-sm whitespace-nowrap cursor-pointer"
        >
          <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>Kembali ke Daftar Surat Masuk</span>
        </button>
      </div>

      {/* ── RICH PERSURATAN HEADER CARD ── */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[32px] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 sm:space-y-4 max-w-4xl">
            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 uppercase tracking-tight">
                Surat Masuk Resmi
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {doc.category?.name || 'Surat Permohonan'}
              </span>
              {publicSub?.submissionNumber && (
                <span className="font-mono text-xs font-extrabold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                  Tiket: {publicSub.submissionNumber}
                </span>
              )}
            </div>

            {/* Document Title */}
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
              {doc.title}
            </h1>

            {/* Persistence Attributes Grid */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <span className="font-bold text-slate-400 uppercase text-[10px]">No. Surat Perusahaan:</span>
                <span className="font-mono font-extrabold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700">
                  {doc.documentNumber || publicSub?.companyLetterNumber || '—'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-500">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Klasifikasi:</span>
                <span className="font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {doc.classification?.name || 'Biasa'}
                </span>
              </div>

              {doc.documentDate && (
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Tgl Surat:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {new Date(doc.documentDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              )}

              {doc.receivedDate && (
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Tgl Diterima:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {new Date(doc.receivedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              )}
            </div>

            {/* Institution / Sender Profile */}
            {publicSub?.company && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-primary" />
                  <span className="font-bold text-slate-900 dark:text-white">
                    {publicSub.company.name || publicSub.company.companyName}
                  </span>
                </div>
                {publicSub.applicantUser && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <UserIcon size={14} />
                    <span>PIC: {publicSub.applicantUser.fullName} ({publicSub.applicantUser.email} • {publicSub.applicantUser.phone})</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── WORKFLOW TOOLS DYNAMIC TOOLBAR ── */}
      <WorkflowToolbar
        documentId={doc.id}
        doc={doc}
        publicSub={publicSub}
        isDpsDoc={isDpsDoc}
        isRsDoc={isRsDoc}
        isApproved={isApproved}
        hasCertificate={hasCertificate}
        candidatesCount={candidatesList.length}
        meetingsCount={doc.meetings?.length || 0}
        onOpenInvitePresentation={() => setIsInvitePresentationModalOpen(true)}
        onOpenInterview={() => {
          setInterviewRoundToSchedule(null);
          setIsInterviewModalOpen(true);
        }}
        onOpenMeetingAgenda={() => setIsCreateMeetingModalOpen(true)}
        onOpenApprove={() => setIsApproveModalOpen(true)}
        onOpenReject={() => setIsRejectModalOpen(true)}
        onOpenUploadCert={() => setIsUploadCertModalOpen(true)}
        onOpenReminder={() => setIsReminderModalOpen(true)}
        onOpenSaveDps={() => setIsSaveDpsModalOpen(true)}
        onOpenReplyEmail={() => setIsReplyEmailModalOpen(true)}
        onOpenDelete={() => setIsDeleteModalOpen(true)}
      />

      {/* ── PERSURATAN TAB NAVIGATION (RICH E-OFFICE TABS) ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('permohonan')}
          className={cn(
            "flex items-center gap-2.5 px-5 py-3.5 border-b-2 font-extrabold text-xs tracking-tight transition-all whitespace-nowrap cursor-pointer",
            activeTab === 'permohonan'
              ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-t-2xl"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          {isInternalDoc ? <FileText size={16} /> : <Activity size={16} />}
          <span>{isInternalDoc ? 'Informasi Dokumen' : 'Dashboard Proses'}</span>
          {!isInternalDoc && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black">
              {publicSub?.dpsStage || publicSub?.status || doc.status || 'PROSES'}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('agenda')}
          className={cn(
            "flex items-center gap-2.5 px-5 py-3.5 border-b-2 font-extrabold text-xs tracking-tight transition-all whitespace-nowrap cursor-pointer",
            activeTab === 'agenda'
              ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-t-2xl"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          <CalendarDays size={16} />
          <span>Agenda Rapat ({doc.meetings?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('evidence')}
          className={cn(
            "flex items-center gap-2.5 px-5 py-3.5 border-b-2 font-extrabold text-xs tracking-tight transition-all whitespace-nowrap cursor-pointer",
            activeTab === 'evidence'
              ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-t-2xl"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          <Paperclip size={16} />
          <span>Dokumen Lampiran (evidence){totalAllDocumentsCount > 0 ? ` (${totalAllDocumentsCount})` : ''}</span>
        </button>

        {!isInternalDoc && (
          <button
            onClick={() => setActiveTab('log')}
            className={cn(
              "flex items-center gap-2.5 px-5 py-3.5 border-b-2 font-extrabold text-xs tracking-tight transition-all whitespace-nowrap cursor-pointer",
              activeTab === 'log'
                ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-t-2xl"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <History size={16} />
            <span>Log Trail Aktivitas ({daysElapsed} Hari)</span>
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: DETAIL SURAT (INTERNAL) / BERKAS & USULAN PERMOHONAN (PUBLIC)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'permohonan' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {isInternalDoc ? (
            /* ── TAMPILAN INTERNAL: DETAIL INFORMASI & LEMBAR DISPOSISI ── */
            <div className="space-y-6">
              {/* Ringkasan Metadata Surat Masuk */}
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[32px] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText size={20} className="text-primary" />
                      Informasi Detail Surat Masuk
                    </h3>
                    <p className="text-xs text-slate-500">
                      Data administrasi persuratan dan rekaman lembar disposisi internal DSN-MUI
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('evidence')}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-bold border border-emerald-200/60 transition-all cursor-pointer"
                    >
                      <Paperclip size={14} />
                      <span>Buka Berkas Lampiran ({doc.versions?.length || 0})</span>
                    </button>
                  </div>
                </div>

                {/* Grid Informasi Persuratan */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nomor Surat</span>
                    <p className="text-sm font-mono font-extrabold text-slate-900 dark:text-white">
                      {doc.documentNumber || '—'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Klasifikasi & Kategori</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {doc.classification?.name || 'Biasa'} • {doc.category?.name || 'Surat Masuk'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status Persuratan</span>
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {doc.status === 'ARCHIVED' ? 'Diarsipkan' : (doc.status || 'Aktif')}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tanggal Dokumen</span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {doc.documentDate ? new Date(doc.documentDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tanggal Diterima</span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {doc.receivedDate ? new Date(doc.receivedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Penginput Dokumen</span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {doc.creator?.fullName || 'Admin / Petugas Internal'}
                    </p>
                  </div>
                </div>

                {/* Quick File Preview Callout */}
                {doc.versions && doc.versions.length > 0 && (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/20 dark:via-slate-900 dark:to-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm font-black text-xs">
                        {doc.versions[0].fileName?.toLowerCase().endsWith('.docx') ? 'DOCX' : 'PDF'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                            Berkas Utama Terunggah
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {(doc.versions[0].fileSize / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                          {doc.versions[0].fileName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setReaderDoc({ title: doc.versions[0].fileName, fileUrl: doc.versions[0].fileUrl })}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                      >
                        <Eye size={14} /> Lihat Berkas
                      </button>
                      <a
                        href={getFileDownloadUrl(doc.versions[0].fileUrl)}
                        download={doc.versions[0].fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all"
                        title="Unduh"
                      >
                        <Download size={15} />
                      </a>
                    </div>
                  </div>
                )}

                {/* Riwayat Disposisi / Tindakan Internal */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Mail size={16} className="text-emerald-600" />
                    Catatan & Riwayat Disposisi
                  </h4>
                  {doc.disposisiLogs && doc.disposisiLogs.length > 0 ? (
                    <div className="space-y-3">
                      {doc.disposisiLogs.map((log: any, lIdx: number) => (
                        <div
                          key={log.id || lIdx}
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-slate-900 dark:text-white">
                              {log.action ? `Disposisi: ${log.action}` : 'Instruksi Disposisi'}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {new Date(log.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {log.description && (
                            <p className="text-xs text-slate-600 dark:text-slate-300">{log.description}</p>
                          )}
                          <div className="text-[10px] text-slate-400 font-medium">
                            Oleh: {log.user?.fullName || 'Petugas Disposisi'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 text-xs text-slate-400 italic">
                      Belum ada instruksi disposisi lanjutan untuk surat masuk ini.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ── TAMPILAN PUBLIK: DASHBOARD PROSES TERPADU (VERTICAL PIPELINE) ── */
            <ProcessDashboardTab
              doc={doc}
              publicSub={publicSub}
              isRsDoc={isRsDoc}
              isDpsDoc={isDpsDoc}
              isDpsOrRsDoc={isDpsOrRsDoc}
              slaStatus={slaStatus}
              candidatesList={candidatesList}
              onOpenValidationModal={() => setIsValidationModalOpen(true)}
              onOpenInterviewModal={() => {
                setInterviewRoundToSchedule(null);
                setIsInterviewModalOpen(true);
              }}
              onOpenAssessmentModal={() => setIsAssessmentModalOpen(true)}
              onOpenUploadCertModal={() => setIsUploadCertModalOpen(true)}
              onOpenCreateMeetingModal={() => setIsCreateMeetingModalOpen(true)}
              onOpenInvitePresentationModal={() => setIsInvitePresentationModalOpen(true)}
              onOpenApproveModal={() => setIsApproveModalOpen(true)}
              onOpenRejectModal={() => setIsRejectModalOpen(true)}
              onOpenReminderModal={() => setIsReminderModalOpen(true)}
              onOpenReaderDoc={(docInfo) => setReaderDoc(docInfo)}
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: AGENDA RAPAT (MEETING FLOW WIDGET)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'agenda' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[32px] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <CalendarDays size={20} className="text-primary" />
                  Alur & Agenda Rapat Surat Masuk
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Setiap surat memiliki multiple flow rapat. Setiap membuat agenda baru, seluruh dokumen pengajuan otomatis disertakan.
                </p>
              </div>

              <button
                onClick={() => setIsCreateMeetingModalOpen(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl font-extrabold text-xs text-white shadow-md hover:opacity-95 transition-all self-start sm:self-auto shrink-0 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #006633 0%, #1B7F4A 100%)' }}
              >
                <Plus size={16} />
                <span>Buat Agenda Rapat Baru</span>
              </button>
            </div>

            {/* Meetings Cards Feed */}
            {doc.meetings && doc.meetings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doc.meetings.map((m: any, mIdx: number) => {
                  const attendeesList = Array.isArray(m.attendees) ? m.attendees : [];
                  return (
                    <div
                      key={m.id || mIdx}
                      className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3.5 hover:border-emerald-500 transition-all shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                          {m.agendaNumber || `RAPAT #${mIdx + 1}`}
                        </span>
                        <span className={cn(
                          "text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-tight",
                          m.status === 'SELESAI' ? "bg-emerald-100 text-emerald-700" :
                          m.status === 'AKTIF' ? "bg-blue-100 text-blue-700 animate-pulse" :
                          "bg-amber-100 text-amber-700"
                        )}>
                          {m.status}
                        </span>
                      </div>

                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                        {m.title}
                      </h4>

                      <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-emerald-600 shrink-0" />
                          <span className="font-semibold">
                            {new Date(m.dateTime).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}, {new Date(m.dateTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-emerald-600 shrink-0" />
                          <span className="truncate">{m.location}</span>
                        </div>
                      </div>

                      {m.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                          &ldquo;{m.description}&rdquo;
                        </p>
                      )}

                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Users size={14} className="text-slate-400" />
                          <span>{attendeesList.length} Peserta Diundang</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => router.push(`/notula?createFromMeetingId=${m.id}`)}
                            className="px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                            title="Buat / buka notulensi rapat di menu Notula"
                          >
                            <FileText size={12} />
                            <span>Notulensi Rapat</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (allSubmissionDocsForMeeting[0]) {
                                setReaderDoc({
                                  title: allSubmissionDocsForMeeting[0].title,
                                  fileUrl: allSubmissionDocsForMeeting[0].fileUrl,
                                });
                              }
                            }}
                            className="text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={12} /> Berkas
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                  <CalendarDays size={26} />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                    Belum Ada Agenda Rapat untuk Surat Ini
                  </h4>
                  <p className="text-xs text-slate-500">
                    Klik tombol di atas untuk menjadwalkan rapat pembahasan, uji wawancara, atau sidang pleno. Seluruh berkas otomatis disertakan.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateMeetingModalOpen(true)}
                  className="mt-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-95 transition-all"
                  style={{ background: 'linear-gradient(135deg, #006633 0%, #1B7F4A 100%)' }}
                >
                  + Buat Agenda Rapat Baru
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3: DOKUMEN LAMPIRAN (EVIDENCE FILES & FOLDERS)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'evidence' && (
        <EvidenceDocumentsTab
          doc={doc}
          publicSub={publicSub}
          candidatesList={candidatesList}
          isRsDoc={isRsDoc}
          onOpenReaderDoc={(docInfo) => setReaderDoc(docInfo)}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 4: LOG TRAIL AKTIVITAS & AUDIT DOKUMEN (HANYA PUBLIC)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'log' && !isInternalDoc && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[32px] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <History size={20} className="text-primary" />
                  Log Trail Aktivitas & Kronologi Surat
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Audit trail seluruh proses dan penghitung jumlah hari yang telah berjalan sejak surat diterima.
                </p>
              </div>

              {/* Prominent Elapsed Counter Banner */}
              <div className="p-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center gap-3 shadow-md shrink-0">
                <Clock size={20} />
                <div>
                  <div className="text-[10px] uppercase font-bold text-emerald-200">Waktu Pelayanan Berjalan</div>
                  <div className="text-sm font-black tracking-wide">{daysElapsed} Hari Kalender</div>
                </div>
              </div>
            </div>

            {/* Timeline Feed */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {/* Combine publicSub timeline and disposisiLogs */}
              {(() => {
                const logs: any[] = [];

                if (publicSub?.timeline) {
                  publicSub.timeline.forEach((item: any) => {
                    logs.push({
                      id: item.id,
                      type: 'PUBLIC',
                      title: item.title,
                      desc: item.description,
                      date: new Date(item.createdAt),
                      actor: item.performedByName || 'Sekretariat DSN-MUI',
                    });
                  });
                }

                if (doc.disposisiLogs) {
                  doc.disposisiLogs.forEach((item: any) => {
                    logs.push({
                      id: item.id,
                      type: 'INTERNAL',
                      title: item.action ? `Disposisi: ${item.action}` : 'Tindakan Disposisi',
                      desc: item.description || item.notes,
                      date: new Date(item.createdAt),
                      actor: item.user?.fullName || 'Petugas Internal',
                    });
                  });
                }

                // Initial Document Received
                logs.push({
                  id: 'doc-created',
                  type: 'INITIAL',
                  title: 'Surat Masuk Resmi Diterima & Teragenda',
                  desc: `Surat nomor ${doc.documentNumber || '—'} diterima di sistem Amanah DSN-MUI.`,
                  date: new Date(doc.receivedDate || doc.createdAt),
                  actor: doc.creator?.fullName || 'Front Office / Portal Pemohon',
                });

                logs.sort((a, b) => b.date.getTime() - a.date.getTime());

                return logs.map((log, lIdx) => (
                  <div key={log.id || lIdx} className="relative pl-4 space-y-1 text-xs">
                    <div className="absolute -left-[19px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-600 ring-4 ring-white dark:ring-slate-900 shadow-xs" />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {log.title}
                      </p>
                      <span className="text-[11px] font-mono text-slate-400">
                        {log.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB
                      </span>
                    </div>

                    {log.desc && (
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                        {log.desc}
                      </p>
                    )}

                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold pt-0.5">
                      Diproses oleh: {log.actor}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL VALIDASI DOKUMEN (3 PILIHAN) ── */}
      {isValidationModalOpen && (
        <ValidationModal
          documentId={doc.id}
          submissionNumber={publicSub?.submissionNumber}
          companyName={publicSub?.company?.name || publicSub?.company?.companyName}
          onClose={() => setIsValidationModalOpen(false)}
          onSuccess={() => {
            setIsValidationModalOpen(false);
            fetchDetail();
          }}
        />
      )}

      {/* ── MODAL BUAT / UBAH UNDANGAN WAWANCARA (MULTI-PUTARAN) ── */}
      {isInterviewModalOpen && (
        <CreateInterviewInvitationModal
          documentId={doc.id}
          submissionNumber={publicSub?.submissionNumber}
          companyName={publicSub?.company?.name || publicSub?.company?.companyName}
          companyLetterNumber={publicSub?.companyLetterNumber || doc.documentNumber}
          candidatesList={candidatesList}
          isHospital={isRsDoc}
          round={interviewRoundToSchedule || (publicSub?.interviewInvitation?.round || 1)}
          existingInvitation={interviewRoundToSchedule ? undefined : publicSub?.interviewInvitation}
          onClose={() => {
            setIsInterviewModalOpen(false);
            setInterviewRoundToSchedule(null);
          }}
          onSuccess={() => {
            setIsInterviewModalOpen(false);
            setInterviewRoundToSchedule(null);
            fetchDetail();
          }}
        />
      )}

      {/* ── MODAL INPUT PENILAIAN WAWANCARA (ASESMEN) ── */}
      {isAssessmentModalOpen && (
        <InterviewAssessmentModal
          documentId={doc.id}
          submissionNumber={publicSub?.submissionNumber}
          companyName={publicSub?.company?.name || publicSub?.company?.companyName}
          companyLetterNumber={publicSub?.companyLetterNumber || doc.documentNumber}
          round={publicSub?.interviewInvitation?.round || 1}
          candidatesList={candidatesList}
          isHospital={isRsDoc}
          onClose={() => setIsAssessmentModalOpen(false)}
          onSuccess={() => {
            setIsAssessmentModalOpen(false);
            fetchDetail();
          }}
        />
      )}

      {/* ── MODAL UPLOAD SERTIFIKAT YANG SUDAH SIAP (PENYELESAIAN PROSES) ── */}
      {isUploadCertModalOpen && (
        <UploadReadyCertificateModal
          documentId={doc.id}
          defaultCertNumber={doc.shariaCertificate?.certificateNumber}
          defaultTitle={doc.shariaCertificate?.title}
          isHospital={isRsDoc}
          onClose={() => setIsUploadCertModalOpen(false)}
          onSuccess={() => {
            setIsUploadCertModalOpen(false);
            fetchDetail();
          }}
        />
      )}

      {/* ── MODAL BUAT AGENDA RAPAT ── */}
      {isCreateMeetingModalOpen && (
        <CreateMeetingAgendaModal
          documentId={doc.id}
          defaultTitle={doc.title}
          submissionDocs={allSubmissionDocsForMeeting}
          onClose={() => setIsCreateMeetingModalOpen(false)}
          onSuccess={() => {
            setIsCreateMeetingModalOpen(false);
            setActiveTab('agenda');
            fetchDetail();
          }}
        />
      )}

      {/* ── WORKFLOW ACTION MODALS ── */}
      {isInvitePresentationModalOpen && (
        <InvitePresentationModal
          documentId={doc.id}
          submissionNumber={publicSub?.submissionNumber}
          companyName={publicSub?.company?.name || publicSub?.company?.companyName || doc.sender}
          onClose={() => setIsInvitePresentationModalOpen(false)}
          onSuccess={() => {
            setIsInvitePresentationModalOpen(false);
            fetchDetail();
          }}
        />
      )}

      {isApproveModalOpen && (
        <ApproveSubmissionModal
          documentId={doc.id}
          submissionTitle={doc.title}
          submissionNumber={publicSub?.submissionNumber}
          companyName={publicSub?.company?.name || publicSub?.company?.companyName || doc.sender}
          onClose={() => setIsApproveModalOpen(false)}
          onSuccess={() => {
            setIsApproveModalOpen(false);
            fetchDetail();
          }}
        />
      )}

      {isRejectModalOpen && (
        <RejectSubmissionModal
          documentId={doc.id}
          submissionTitle={doc.title}
          submissionNumber={publicSub?.submissionNumber}
          onClose={() => setIsRejectModalOpen(false)}
          onSuccess={() => {
            setIsRejectModalOpen(false);
            fetchDetail();
          }}
        />
      )}

      {isReminderModalOpen && (
        <SendReminderModal
          documentId={doc.id}
          submissionNumber={publicSub?.submissionNumber}
          companyName={publicSub?.company?.name || publicSub?.company?.companyName || doc.sender}
          onClose={() => setIsReminderModalOpen(false)}
          onSuccess={() => {
            setIsReminderModalOpen(false);
            fetchDetail();
          }}
        />
      )}

      {isSaveDpsModalOpen && (
        <SaveDpsToDatabaseModal
          documentId={doc.id}
          candidatesList={candidatesList}
          institutionName={publicSub?.company?.name || publicSub?.company?.companyName || doc.sender}
          isApproved={isApproved}
          onClose={() => setIsSaveDpsModalOpen(false)}
          onSuccess={() => {
            setIsSaveDpsModalOpen(false);
            fetchDetail();
          }}
        />
      )}

      {isReplyEmailModalOpen && (
        <ReplyEmailModal
          documentId={doc.id}
          defaultRecipientEmail={publicSub?.applicantUser?.email || publicSub?.company?.email || doc.senderEmail || ""}
          defaultRecipientName={publicSub?.applicantUser?.fullName || publicSub?.company?.name || doc.sender || ""}
          defaultSubject={doc.title}
          onClose={() => setIsReplyEmailModalOpen(false)}
          onSuccess={() => {
            setIsReplyEmailModalOpen(false);
            fetchDetail();
          }}
        />
      )}

      {isDeleteModalOpen && (
        <DeleteSubmissionModal
          documentId={doc.id}
          submissionTitle={doc.title}
          submissionNumber={publicSub?.submissionNumber}
          onClose={() => setIsDeleteModalOpen(false)}
          onSuccess={() => {
            setIsDeleteModalOpen(false);
            router.push('/surat-masuk');
          }}
        />
      )}

      {/* ── UNIVERSAL DOCUMENT READER MODAL ── */}
      <DocumentReader
        isOpen={!!readerDoc}
        onClose={() => setReaderDoc(null)}
        title={readerDoc?.title || ""}
        fileUrl={readerDoc?.fileUrl || ""}
      />
    </div>
  );
};

export default DocumentDetailPage;
