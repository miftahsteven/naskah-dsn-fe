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
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import DocumentReader from "@/components/documents/DocumentReader";
import { useAuthStore } from "@/stores/auth.store";
import Can from "@/components/auth/Can";

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002/api').replace('/api', '');

const getFileDownloadUrl = (rawUrl?: string) => {
  if (!rawUrl) return '#';
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;
  return `${BASE_URL}/${rawUrl.replace(/^\//, '')}`;
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

// ── MODAL BUAT SURAT UNDANGAN WAWANCARA CALON DPS (DILUAR AGENDA RAPAT) ──
interface CreateInterviewInvitationModalProps {
  documentId: string;
  submissionNumber?: string;
  companyName?: string;
  companyLetterNumber?: string;
  candidatesList: any[];
  existingInvitation?: any;
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
  onClose,
  onSuccess,
}) => {
  const [invitationNumber, setInvitationNumber] = useState<string>(
    existingInvitation?.invitationNumber ||
      `UND-WW/DSN-MUI/IX/2026/${Math.floor(100 + Math.random() * 900)}`
  );
  const [invitationDate, setInvitationDate] = useState<string>(
    existingInvitation?.invitationDate ||
      new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  );
  const [interviewDayDate, setInterviewDayDate] = useState<string>(
    existingInvitation?.interviewDayDate || 'Kamis, 17 September 2026'
  );
  const [interviewTime, setInterviewTime] = useState<string>(
    existingInvitation?.interviewTime || '09:30 - 12:00'
  );
  const [format, setFormat] = useState<'OFFLINE' | 'ONLINE' | 'HYBRID'>(
    existingInvitation?.format || 'OFFLINE'
  );
  const [venue, setVenue] = useState<string>(
    existingInvitation?.venue ||
      'Ruang Rapat Pleno DSN-MUI Lt. 3, Gedung MUI Pusat, Jl. Proklamasi No. 51, Menteng, Jakarta Pusat'
  );
  const [zoomUrl, setZoomUrl] = useState<string>(existingInvitation?.zoomUrl || '');
  const [zoomMeetingId, setZoomMeetingId] = useState<string>(existingInvitation?.zoomMeetingId || '');
  const [zoomPasscode, setZoomPasscode] = useState<string>(existingInvitation?.zoomPasscode || '');
  const [subject, setSubject] = useState<string>(
    existingInvitation?.subject ||
      `Undangan Wawancara Uji Kepatutan dan Kelayakan Calon Anggota DPS Terkait Surat No. ${companyLetterNumber || submissionNumber || '-'}`
  );

  const initialCandidates = useMemo(() => {
    if (existingInvitation?.candidates && Array.isArray(existingInvitation.candidates)) {
      return existingInvitation.candidates;
    }
    if (candidatesList.length > 0) {
      return candidatesList.map((c: any) => c.name || `Calon #${c.id}`);
    }
    return ['Calon Anggota Dewan Pengawas Syariah'];
  }, [existingInvitation, candidatesList]);

  const [selectedCandidates, setSelectedCandidates] = useState<string[]>(initialCandidates);
  const [candidateInput, setCandidateInput] = useState<string>('');

  const [dresscode, setDresscode] = useState<string>(
    existingInvitation?.dresscode || 'Pakaian Sipil Lengkap / Batik Lengan Panjang / Jas Rapi'
  );
  const [requirements, setRequirements] = useState<string>(
    existingInvitation?.requirements ||
      'Membawa berkas fisik asli, portofolio riwayat hidup, serta bahan pemaparan kesiapan kepengawasan syariah.'
  );
  const [contactPerson, setContactPerson] = useState<string>(
    existingInvitation?.contactPerson || 'Sekretariat DSN-MUI (021-3904141 / WhatsApp: 0812-3456-7890)'
  );
  const [notes, setNotes] = useState<string>(
    existingInvitation?.notes || 'Calon DPS dimohon hadir 15 menit sebelum waktu wawancara dimulai.'
  );
  const [signatoryName, setSignatoryName] = useState<string>(
    existingInvitation?.signatoryName || 'Prof. Dr. KH. Hasanuddin, M.Ag'
  );
  const [signatoryRole, setSignatoryRole] = useState<string>(
    existingInvitation?.signatoryRole || 'Ketua Bidang Pengawasan Syariah DSN-MUI'
  );

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

  const handleAddCustomCandidate = () => {
    if (candidateInput.trim() && !selectedCandidates.includes(candidateInput.trim())) {
      setSelectedCandidates([...selectedCandidates, candidateInput.trim()]);
      setCandidateInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitationNumber || !interviewDayDate || !interviewTime || !venue) {
      setErrorMessage('Nomor surat undangan, hari/tanggal, waktu, dan tempat pelaksanaan wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await api.post(`/documents/${documentId}/interview-invitation`, {
        invitationNumber: invitationNumber.trim(),
        invitationDate: invitationDate.trim(),
        interviewDayDate: interviewDayDate.trim(),
        interviewTime: interviewTime.trim(),
        format,
        venue: venue.trim(),
        zoomUrl: format !== 'OFFLINE' ? zoomUrl.trim() || undefined : undefined,
        zoomMeetingId: format !== 'OFFLINE' ? zoomMeetingId.trim() || undefined : undefined,
        zoomPasscode: format !== 'OFFLINE' ? zoomPasscode.trim() || undefined : undefined,
        subject: subject.trim(),
        candidates: selectedCandidates,
        dresscode: dresscode.trim(),
        requirements: requirements.trim(),
        contactPerson: contactPerson.trim(),
        notes: notes.trim() || undefined,
        signatoryName: signatoryName.trim(),
        signatoryRole: signatoryRole.trim(),
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
            <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 flex items-center justify-center font-black">
              <CalendarCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                  Buat Surat Undangan Wawancara Calon DPS
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Agenda Khusus
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {submissionNumber ? `Tiket: ${submissionNumber}` : 'Surat Masuk Permohonan'} {companyName ? `• ${companyName}` : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400">
            <X size={20} />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section: Identitas Surat Undangan */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              <FileText size={15} className="text-blue-600" />
              1. Identitas Surat Undangan Resmi
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tanggal Surat Diterbitkan *
                </label>
                <input
                  type="text"
                  required
                  value={invitationDate}
                  onChange={(e) => setInvitationDate(e.target.value)}
                  placeholder="Contoh: 10 September 2026"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                />
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          {/* Section: Jadwal & Lokasi Wawancara */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              <Calendar size={15} className="text-blue-600" />
              2. Jadwal & Tempat Pelaksanaan Wawancara
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Hari & Tanggal Wawancara *
                </label>
                <input
                  type="text"
                  required
                  value={interviewDayDate}
                  onChange={(e) => setInterviewDayDate(e.target.value)}
                  placeholder="Contoh: Kamis, 17 September 2026"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Waktu / Jam Pelaksanaan *
                </label>
                <input
                  type="text"
                  required
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                  placeholder="Contoh: 09:30 - 12:00 WIB"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Format Wawancara *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'OFFLINE', label: 'Tatap Muka (Offline)' },
                    { key: 'ONLINE', label: 'Daring (Zoom Online)' },
                    { key: 'HYBRID', label: 'Hybrid' },
                  ].map((fmt) => (
                    <button
                      type="button"
                      key={fmt.key}
                      onClick={() => setFormat(fmt.key as any)}
                      className={cn(
                        "py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center",
                        format === fmt.key
                          ? "bg-blue-50 border-blue-600 text-blue-700 dark:bg-blue-950/40 dark:border-blue-400 dark:text-blue-200 shadow-xs"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tempat / Ruangan Pelaksanaan *
                </label>
                <input
                  type="text"
                  required
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="Nama ruangan, lantai, gedung, dan alamat"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

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
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500/20"
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
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500/20"
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
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section: Calon DPS yang Diundang */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                <Users size={15} className="text-blue-600" />
                3. Calon DPS yang Diundang Wawancara
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
                    key={c.id || idx}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                      isChecked
                        ? "bg-blue-50/70 border-blue-300 dark:bg-blue-950/30 dark:border-blue-700"
                        : "border-slate-200 dark:border-slate-700 opacity-60"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleCandidate(name)}
                      className="w-4 h-4 accent-blue-600 cursor-pointer"
                    />
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {name}
                      {c.nik && <span className="ml-2 font-mono font-normal text-slate-500">({c.nik})</span>}
                    </div>
                  </label>
                );
              })}

              {/* Freeform input candidate if not in list */}
              {candidatesList.length === 0 && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={candidateInput}
                    onChange={(e) => setCandidateInput(e.target.value)}
                    placeholder="Ketik nama calon DPS..."
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomCandidate}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
                  >
                    + Tambah
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Section: Ketentuan & Narahubung */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              <ShieldCheck size={15} className="text-blue-600" />
              4. Ketentuan, Penandatangan & Narahubung
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Ketentuan Busana / Dresscode
                </label>
                <input
                  type="text"
                  value={dresscode}
                  onChange={(e) => setDresscode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Narahubung / Kontak Sekretariat
                </label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nama Pejabat Penandatangan
                </label>
                <input
                  type="text"
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          {/* Workflow Impact Notice */}
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200 space-y-1 leading-relaxed">
            <div className="font-bold flex items-center gap-1.5">
              <CalendarCheck size={14} className="text-blue-600" />
              Perubahan Alur Status Permohonan:
            </div>
            <p>
              Menerbitkan surat undangan wawancara ini akan <strong>secara resmi mengalihkan status tahapan di sistem dan web-public menjadi "Wawancara" (Tahap 3)</strong>. Pemohon akan menerima notifikasi dan kartu surat undangan resmi di portal web public.
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
                  <CalendarCheck size={16} /> Terbitkan Undangan & Alihkan ke Tahap Wawancara
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
  const [location, setLocation] = useState<string>('Ruang Rapat Pleno DSN-MUI (Lt. 2) / Hybrid Zoom Meeting');
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
                placeholder="Ruang Rapat Pleno DSN-MUI / Zoom"
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
  const [isCreateMeetingModalOpen, setIsCreateMeetingModalOpen] = useState<boolean>(initialCreateParam);
  const [readerDoc, setReaderDoc] = useState<{ title: string; fileUrl: string } | null>(null);

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
  const isDpsDoc = Boolean(
    publicSub &&
      (publicSub.dpsStage ||
        publicSub.submissionTypeName?.toLowerCase().includes('dps') ||
        publicSub.submissionTypeName?.toLowerCase().includes('pengawas syariah') ||
        (publicSub.candidates && publicSub.candidates.length > 0))
  );

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

  const dpsStages = [
    { key: 'PROSES_PENGAJUAN', step: 1, label: '1. Proses Pengajuan' },
    { key: 'VALIDASI_DOKUMEN', step: 2, label: '2. Validasi Dokumen' },
    { key: 'WAWANCARA', step: 3, label: '3. Wawancara' },
    { key: 'PROSES_INTERNAL', step: 4, label: '4. Proses Internal' },
    { key: 'LULUS', step: 5, label: '5. Lulus (Rekomendasi)' },
  ];

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
      {/* ── BREADCRUMB & TOP CONTROLS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => router.push('/surat-masuk')}
          className="flex items-center gap-2 text-slate-500 hover:text-primary font-bold transition-colors group w-fit text-xs"
        >
          <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>Kembali ke Daftar Surat Masuk</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Days Elapsed Counter Badge */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 shadow-xs">
            <Clock size={15} className="text-amber-600 animate-pulse" />
            <span className="text-xs font-black">
              {daysElapsed === 0 ? 'Hari Pertama Diterima' : `⏱️ ${daysElapsed} Hari Proses Berjalan`}
            </span>
          </div>

          {/* Quick Validate Button (Button 1) */}
          {isDpsDoc && (
            <button
              onClick={() => setIsValidationModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold text-white shadow-md hover:opacity-95 transition-all"
              style={{ background: 'linear-gradient(135deg, #006633 0%, #1B7F4A 100%)' }}
            >
              <ShieldCheck size={16} />
              <span>
                {publicSub?.validationType
                  ? `✓ Validasi (${publicSub.validationType})`
                  : 'Validasi Dokumen (3 Opsi)'}
              </span>
            </button>
          )}

          {/* Quick Interview Invitation Button (Button 2: di luar agenda rapat) */}
          {isDpsDoc && (
            <button
              onClick={() => setIsInterviewModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold text-white shadow-md hover:opacity-95 transition-all"
              style={{ background: 'linear-gradient(135deg, #996515 0%, #B8860B 45%, #D4AF37 100%)' }}
            >
              <CalendarCheck size={16} />
              <span>
                {publicSub?.interviewInvitation
                  ? 'Ubah Undangan Wawancara'
                  : 'Buat Undangan Wawancara'}
              </span>
            </button>
          )}

          {/* Quick Add Meeting Agenda */}
          <button
            onClick={() => setIsCreateMeetingModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-200 shadow-xs transition-all"
          >
            <CalendarDays size={15} className="text-emerald-600" />
            <span>+ Agenda Rapat</span>
          </button>
        </div>
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
          <FileText size={16} />
          <span>Berkas & Usulan Permohonan</span>
          {candidatesList.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black">
              {candidatesList.length} Calon
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
          <span>Dokumen Lampiran (Evidence)</span>
        </button>

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
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: BERKAS & USULAN PERMOHONAN
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'permohonan' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 5-Stage Stepper Roadmap for DPS */}
          {isDpsDoc && (
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[32px] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck size={18} className="text-emerald-600" />
                    Alur 5 Tahapan Permohonan Rekomendasi DPS
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Proses verifikasi resmi oleh Sekretariat & Dewan Syariah Nasional MUI
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Tahap Saat Ini:</span>
                  <span className={`text-xs font-black px-3 py-1 rounded-full ${
                    currentDpsStage === 'LULUS'
                      ? 'bg-emerald-500 text-white'
                      : currentDpsStage === 'TIDAK_LULUS'
                      ? 'bg-rose-500 text-white'
                      : 'bg-primary text-white'
                  }`}>
                    {dpsStages.find((s) => s.key === currentDpsStage)?.label || currentDpsStage}
                  </span>
                </div>
              </div>

              {/* Stepper Track */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {dpsStages.map((stage, idx) => {
                  const isPast = idx < activeDpsStageIdx;
                  const isCurrent = idx === activeDpsStageIdx;

                  return (
                    <div
                      key={stage.key}
                      className={cn(
                        "p-3 rounded-2xl border text-left space-y-1 transition-all",
                        isCurrent
                          ? "bg-primary/5 dark:bg-primary/10 border-primary text-primary shadow-sm ring-2 ring-primary/20"
                          : isPast
                          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-slate-700 dark:text-slate-300"
                          : "bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black",
                          isCurrent ? "bg-primary text-white" : isPast ? "bg-emerald-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                        )}>
                          {isPast ? <Check size={12} /> : stage.step}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold leading-tight truncate">{stage.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Action bar for 2 Buttons: Validasi Dokumen & Buatkan Undangan Wawancara */}
              <div className="pt-2 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {currentDpsStage === 'VALIDASI_DOKUMEN' ? (
                    <span>
                      Berkas persyaratan telah divalidasi sebagai <strong>{publicSub?.validationType || 'Lengkap & Valid'}</strong>. Status pengajuan saat ini <strong>tetap pada tahap Validasi Dokumen (aktif)</strong>. Gunakan tombol "Buat Undangan Wawancara" untuk menjadwalkan fit & proper test calon DPS dan beralih ke tahap Wawancara.
                    </span>
                  ) : currentDpsStage === 'WAWANCARA' ? (
                    <span>
                      Tahap saat ini adalah <strong>Wawancara</strong>. Surat Undangan Wawancara resmi telah diterbitkan untuk calon DPS.
                    </span>
                  ) : (
                    <span>
                      Lakukan validasi keabsahan dokumen untuk mengonfirmasi kelayakan kualifikasi (Baru / PAW / Penetapan Keberlanjutan), kemudian buat undangan wawancara calon DPS.
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {/* Button 1: Validasi Dokumen */}
                  <button
                    onClick={() => setIsValidationModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-95 transition-all shrink-0 flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #006633 0%, #1B7F4A 100%)' }}
                  >
                    <ShieldCheck size={16} />
                    <span>
                      {publicSub?.validationType
                        ? `Ubah Validasi (${publicSub.validationType})`
                        : '1. Validasi Dokumen (3 Opsi)'}
                    </span>
                  </button>

                  {/* Button 2: Buatkan Undangan Wawancara (diluar agenda rapat) */}
                  <button
                    onClick={() => setIsInterviewModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-95 transition-all shrink-0 flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #996515 0%, #B8860B 45%, #D4AF37 100%)' }}
                  >
                    <CalendarCheck size={16} />
                    <span>
                      {publicSub?.interviewInvitation
                        ? '2. Ubah Undangan Wawancara'
                        : '2. Buat Undangan Wawancara'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── CARD KHUSUS: SURAT UNDANGAN WAWANCARA RESMI (DILUAR AGENDA RAPAT) ── */}
          {publicSub?.interviewInvitation && (
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-[32px] border-2 border-amber-500/70 shadow-sm space-y-4 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-xs flex items-center gap-1">
                      <CalendarCheck size={12} />
                      Agenda Khusus Wawancara Calon DPS (Diluar Agenda Rapat)
                    </span>
                    <span className="font-mono text-xs font-bold text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
                      {publicSub.interviewInvitation.invitationNumber}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white pt-1">
                    Surat Undangan Wawancara Calon Dewan Pengawas Syariah Telah Diterbitkan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sesuai Surat Permohonan Perusahaan No. <strong className="text-slate-700 dark:text-slate-300 font-mono">{publicSub.companyLetterNumber || doc.documentNumber}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setIsInterviewModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-all"
                  >
                    Ubah Data Undangan
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="text-slate-500 font-bold flex items-center gap-1.5">
                    <Calendar size={14} className="text-amber-600" />
                    Hari & Tanggal
                  </div>
                  <p className="font-extrabold text-slate-900 dark:text-white">
                    {publicSub.interviewInvitation.interviewDayDate}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="text-slate-500 font-bold flex items-center gap-1.5">
                    <Clock size={14} className="text-amber-600" />
                    Waktu Pelaksanaan
                  </div>
                  <p className="font-extrabold text-slate-900 dark:text-white">
                    {publicSub.interviewInvitation.interviewTime} WIB
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1 sm:col-span-2">
                  <div className="text-slate-500 font-bold flex items-center gap-1.5">
                    <MapPin size={14} className="text-amber-600" />
                    Tempat / Ruangan Wawancara
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    {publicSub.interviewInvitation.venue}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-slate-500 font-bold mr-2">Calon DPS yang Diundang:</span>
                  <span className="font-black text-amber-950 dark:text-amber-200">
                    {Array.isArray(publicSub.interviewInvitation.candidates)
                      ? publicSub.interviewInvitation.candidates.join(', ')
                      : publicSub.interviewInvitation.candidates}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Narahubung: {publicSub.interviewInvitation.contactPerson}
                </div>
              </div>
            </div>
          )}

          {/* Requirement #1: Surat Pengantar Resmi Perusahaan */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[32px] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="text-primary" size={18} />
                  1. Surat Permohonan / Pengantar Resmi dari Perusahaan
                </h3>
                <p className="text-[11px] text-slate-500">
                  Surat pengantar resmi berkop perusahaan pemohon (berlaku untuk seluruh kandidat DPS)
                </p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50">
                Syarat Utama (1 Dokumen)
              </span>
            </div>

            {publicSub?.officialLetterUrl ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-white truncate flex items-center gap-2">
                    <FileText size={16} className="text-primary shrink-0" />
                    {publicSub.officialLetterName || 'Surat_Permohonan_Perusahaan.pdf'}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Ukuran: {publicSub.officialLetterSize ? (publicSub.officialLetterSize / 1024 / 1024).toFixed(2) + ' MB' : 'Tersedia'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setReaderDoc({
                        title: publicSub.officialLetterName || 'Surat Permohonan Perusahaan',
                        fileUrl: publicSub.officialLetterUrl,
                      })
                    }
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90 shadow-sm transition-all"
                  >
                    <Eye size={14} /> Lihat Dokumen
                  </button>
                  <a
                    href={`${BASE_URL}/${publicSub.officialLetterUrl.replace(/^\//, '')}`}
                    download={publicSub.officialLetterName || 'Surat_Pengantar.pdf'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    <Download size={14} /> Unduh
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-xs text-amber-700 dark:text-amber-300">
                Berkas surat pengantar belum terunggah.
              </div>
            )}
          </div>

          {/* Requirement #2-6: Candidates & 5 Requirements per Candidate */}
          {candidatesList.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[32px] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="text-primary" size={18} />
                    Daftar Calon DPS & 5 Berkas Persyaratan Khusus
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Setiap calon Dewan Pengawas Syariah melampirkan berkas persyaratan resmi
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 self-start sm:self-auto">
                  Total: {candidatesList.length} Kandidat Calon DPS
                </span>
              </div>

              <div className="space-y-6">
                {candidatesList.map((cand: any, cIdx: number) => {
                  const docs = getNormalizedCandidateDocs(cand.documents);
                  return (
                    <div
                      key={cand.id || cIdx}
                      className="p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 space-y-4"
                    >
                      {/* Candidate Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700/60 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary font-extrabold flex items-center justify-center text-xs">
                            #{cIdx + 1}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{cand.name}</h4>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                              {cand.nik && <span>NIK: {cand.nik}</span>}
                              {cand.email && <span>Email: {cand.email}</span>}
                              {cand.phone && <span>Telp: {cand.phone}</span>}
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-0.5 rounded-lg border border-emerald-200/50 self-start sm:self-auto">
                          {docs.filter((d: any) => d.fileUrl).length} dari {docs.length} Berkas Tersedia
                        </span>
                      </div>

                      {/* Documents Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {docs.map((docItem: any, dIdx: number) => {
                          const hasFile = Boolean(docItem.fileUrl);
                          return (
                            <div
                              key={dIdx}
                              className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-2.5 shadow-xs"
                            >
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white">
                                  <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] shrink-0 font-bold">
                                    {dIdx + 1}
                                  </span>
                                  <span className="truncate" title={docItem.title}>
                                    {docItem.title}
                                  </span>
                                </div>
                                <p className="text-[11px] font-mono text-slate-400 truncate">
                                  {hasFile
                                    ? `${docItem.fileName || 'berkas.pdf'} (${docItem.fileSize ? (docItem.fileSize / 1024 / 1024).toFixed(2) + ' MB' : 'Tersedia'})`
                                    : 'Belum diunggah'}
                                </p>
                              </div>

                              {hasFile ? (
                                <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setReaderDoc({
                                        title: `${cand.name} - ${docItem.title}`,
                                        fileUrl: docItem.fileUrl,
                                      })
                                    }
                                    className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg text-xs font-bold transition-all"
                                  >
                                    <Eye size={13} /> Lihat
                                  </button>
                                  <a
                                    href={`${BASE_URL}/${docItem.fileUrl.replace(/^\//, '')}`}
                                    download={docItem.fileName || 'dokumen.pdf'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs transition-all"
                                    title="Unduh"
                                  >
                                    <Download size={14} />
                                  </a>
                                </div>
                              ) : (
                                <div className="text-[10px] text-amber-600 font-medium">
                                  Belum Diunggah
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dokumen Lain (Pendukung Tambahan) */}
          {additionalDoc && (
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[32px] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText size={18} className="text-emerald-600" />
                    Dokumen Lain (Pendukung Tambahan)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Berkas pendukung tambahan yang dilampirkan oleh pemohon
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50">
                  Dokumen Pendukung
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-white truncate flex items-center gap-2">
                    <FileText size={16} className="text-emerald-600 shrink-0" />
                    {additionalDoc.fileName}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Ukuran: {(additionalDoc.fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setReaderDoc({
                        title: additionalDoc.fileName,
                        fileUrl: additionalDoc.fileUrl,
                      })
                    }
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90 shadow-sm transition-all"
                  >
                    <Eye size={14} /> Lihat Dokumen
                  </button>
                  <a
                    href={`${BASE_URL}/${additionalDoc.fileUrl.replace(/^\//, '')}`}
                    download={additionalDoc.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    <Download size={14} /> Unduh
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Versions History */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[32px] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History size={18} className="text-primary" />
              Riwayat Versi Berkas Surat Masuk
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
              {doc.versions?.map((v: any) => (
                <div key={v.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-extrabold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                      v{v.versionNum}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{v.fileName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {(v.fileSize / 1024 / 1024).toFixed(2)} MB • {new Date(v.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setReaderDoc({ title: v.fileName, fileUrl: v.fileUrl })}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-primary rounded-lg transition-all"
                      title="Lihat Dokumen"
                    >
                      <Eye size={16} />
                    </button>
                    <a
                      href={`${BASE_URL}/${v.fileUrl}`}
                      download={v.fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-primary rounded-lg transition-all"
                      title="Unduh"
                    >
                      <Download size={16} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
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

                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Users size={14} className="text-slate-400" />
                          <span>{attendeesList.length} Peserta Diundang</span>
                        </div>

                        <button
                          onClick={() => {
                            if (allSubmissionDocsForMeeting[0]) {
                              setReaderDoc({
                                title: allSubmissionDocsForMeeting[0].title,
                                fileUrl: allSubmissionDocsForMeeting[0].fileUrl,
                              });
                            }
                          }}
                          className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <Eye size={12} /> Buka Berkas Terbawa
                        </button>
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
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[32px] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Paperclip size={20} className="text-primary" />
                  File Lampiran (Evidence)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Seluruh berkas bukti pengajuan dan dokumen pendukung pembahasan surat. Klik berkas untuk melihat langsung (*Preview PDF / Image*).
                </p>
              </div>
            </div>

            {/* Folders & Files Grid matching User Screenshot */}
            <div className="space-y-6">
              {doc.evidenceFolders && doc.evidenceFolders.length > 0 ? (
                doc.evidenceFolders.map((folder: any) => (
                  <div key={folder.id} className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700">
                      <Folder size={16} className="text-emerald-600" />
                      <span>{folder.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({folder.files?.length || 0} berkas)</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {(folder.files || []).map((file: any) => (
                        <div
                          key={file.id}
                          className="group p-3 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 flex flex-col items-center justify-between text-center gap-2 transition-all shadow-xs relative"
                        >
                          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mt-1">
                            <FileText size={24} />
                          </div>

                          <div className="w-full min-w-0 px-1">
                            <p className="text-xs font-bold text-slate-800 dark:text-white truncate" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 w-full pt-1">
                            <button
                              onClick={() => setReaderDoc({ title: file.name, fileUrl: file.fileUrl })}
                              className="flex-1 py-1 px-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold transition-colors flex items-center justify-center gap-1"
                            >
                              <Eye size={12} /> Lihat
                            </button>
                            <a
                              href={getFileDownloadUrl(file.fileUrl)}
                              download={file.name}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                              title="Unduh"
                            >
                              <Download size={13} />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                /* Flat Evidence Files */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {(doc.evidenceFiles || []).map((file: any) => (
                    <div
                      key={file.id}
                      className="group p-3.5 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 flex flex-col items-center justify-between text-center gap-2 transition-all shadow-xs"
                    >
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mt-1">
                        <FileText size={24} />
                      </div>

                      <div className="w-full min-w-0 px-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-white truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 w-full pt-1">
                        <button
                          onClick={() => setReaderDoc({ title: file.name, fileUrl: file.fileUrl })}
                          className="flex-1 py-1 px-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold transition-colors flex items-center justify-center gap-1"
                        >
                          <Eye size={12} /> Lihat
                        </button>
                        <a
                          href={getFileDownloadUrl(file.fileUrl)}
                          download={file.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                          title="Unduh"
                        >
                          <Download size={13} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 4: LOG TRAIL AKTIVITAS & AUDIT DOKUMEN
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'log' && (
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

      {/* ── MODAL BUAT UNDANGAN WAWANCARA (AGENDA KHUSUS DILUAR AGENDA RAPAT) ── */}
      {isInterviewModalOpen && (
        <CreateInterviewInvitationModal
          documentId={doc.id}
          submissionNumber={publicSub?.submissionNumber}
          companyName={publicSub?.company?.name || publicSub?.company?.companyName}
          companyLetterNumber={publicSub?.companyLetterNumber || doc.documentNumber}
          candidatesList={candidatesList}
          existingInvitation={publicSub?.interviewInvitation}
          onClose={() => setIsInterviewModalOpen(false)}
          onSuccess={() => {
            setIsInterviewModalOpen(false);
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
