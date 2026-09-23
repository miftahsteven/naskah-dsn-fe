'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Send,
  Users,
  Search,
  UserPlus,
  Calendar,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Mail,
  Loader2,
  Trash2,
  ChevronDown,
  Building2,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import api from '@/lib/api';

export interface RecipientItem {
  id?: string;
  userId?: string | null;
  name: string;
  email: string;
  jobTitle?: string;
  department?: string;
  isExternal?: boolean;
}

interface SendInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: any;
  onSuccess?: () => void;
}

export const SendInvitationModal: React.FC<SendInvitationModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  onSuccess,
}) => {
  // Directory & Selection
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<RecipientItem[]>([]);
  
  // External Guest Form
  const [showAddExternal, setShowAddExternal] = useState(false);
  const [extName, setExtName] = useState('');
  const [extEmail, setExtEmail] = useState('');

  // Invitation Content & Meeting
  const [invitationTitle, setInvitationTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [location, setLocation] = useState('Ruang Rapat Pleno DSN-MUI Lt. 3 / Zoom Cloud Meeting');
  const [syncAgenda, setSyncAgenda] = useState(true);
  const [customNote, setCustomNote] = useState('');

  // Preview target
  const [previewRecipientEmail, setPreviewRecipientEmail] = useState<string>('');

  // Sending progress & status
  const [isSending, setIsSending] = useState(false);
  const [sendResults, setSendResults] = useState<{
    total: number;
    sent: number;
    failed: number;
    meetingId?: string;
    agendaNumber?: string;
    results: Array<{
      email: string;
      name: string;
      status: 'SUCCESS' | 'FAILED';
      messageId?: string;
      error?: string;
      sentAt: string;
    }>;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize values when modal opens
  useEffect(() => {
    if (isOpen && doc) {
      setInvitationTitle(doc.title || '');
      setSendResults(null);
      setErrorMsg(null);
      
      // Default meeting date: tomorrow at 09:00 WIB
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      const isoLocal = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setMeetingDate(isoLocal);

      // Fetch users
      setLoadingUsers(true);
      api.get('/users/directory')
        .catch(() => api.get('/users'))
        .then((res) => {
          const raw = res.data?.data || [];
          setUsers(raw);
        })
        .catch((err) => {
          console.error('Failed to fetch user directory:', err);
        })
        .finally(() => setLoadingUsers(false));
    }
  }, [isOpen, doc]);

  // Keep preview target updated
  useEffect(() => {
    if (selectedRecipients.length > 0) {
      if (!previewRecipientEmail || !selectedRecipients.some((r) => r.email === previewRecipientEmail)) {
        setPreviewRecipientEmail(selectedRecipients[0].email);
      }
    } else {
      setPreviewRecipientEmail('');
    }
  }, [selectedRecipients, previewRecipientEmail]);

  // Filtered users for search
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase();
    return users.filter((u) => {
      const name = (u.fullName || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const title = (u.jobTitle || u.jabatan?.name || '').toLowerCase();
      const dept = (u.department?.name || '').toLowerCase();
      return name.includes(q) || email.includes(q) || title.includes(q) || dept.includes(q);
    });
  }, [users, userSearch]);

  const isUserSelected = (userEmail: string) => {
    return selectedRecipients.some((r) => r.email.toLowerCase() === userEmail.toLowerCase());
  };

  const handleToggleUser = (user: any) => {
    if (isUserSelected(user.email)) {
      setSelectedRecipients(selectedRecipients.filter((r) => r.email.toLowerCase() !== user.email.toLowerCase()));
    } else {
      const newRec: RecipientItem = {
        userId: user.id,
        name: user.fullName,
        email: user.email,
        jobTitle: user.jobTitle || user.jabatan?.name || '',
        department: user.department?.name || '',
        isExternal: false,
      };
      setSelectedRecipients([...selectedRecipients, newRec]);
    }
  };

  const handleAddExternalGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extName.trim() || !extEmail.trim()) {
      alert('Nama dan email tamu eksternal wajib diisi.');
      return;
    }
    if (isUserSelected(extEmail)) {
      alert('Email ini sudah ada dalam daftar penerima.');
      return;
    }
    const newGuest: RecipientItem = {
      userId: null,
      name: extName.trim(),
      email: extEmail.trim(),
      department: 'Eksternal',
      jobTitle: 'Tamu / Undangan Luar',
      isExternal: true,
    };
    setSelectedRecipients([...selectedRecipients, newGuest]);
    setExtName('');
    setExtEmail('');
    setShowAddExternal(false);
  };

  const handleRemoveRecipient = (email: string) => {
    setSelectedRecipients(selectedRecipients.filter((r) => r.email.toLowerCase() !== email.toLowerCase()));
  };

  const handleSelectAllFiltered = () => {
    const newItems = [...selectedRecipients];
    filteredUsers.forEach((u) => {
      if (!newItems.some((r) => r.email.toLowerCase() === u.email.toLowerCase())) {
        newItems.push({
          userId: u.id,
          name: u.fullName,
          email: u.email,
          jobTitle: u.jobTitle || u.jabatan?.name || '',
          department: u.department?.name || '',
          isExternal: false,
        });
      }
    });
    setSelectedRecipients(newItems);
  };

  const handleClearAllRecipients = () => {
    setSelectedRecipients([]);
  };

  // Preview helper
  const activePreviewRecipient = useMemo(() => {
    return (
      selectedRecipients.find((r) => r.email === previewRecipientEmail) ||
      selectedRecipients[0] || { name: '[Nama Terundang]', email: 'penerima@email.com' }
    );
  }, [selectedRecipients, previewRecipientEmail]);

  // Handle Send to All
  const handleSendToAll = async () => {
    if (selectedRecipients.length === 0) {
      alert('Harap pilih minimal 1 penerima undangan.');
      return;
    }

    if (!invitationTitle.trim()) {
      alert('Judul undangan wajib diisi.');
      return;
    }

    const confirmMsg = `Kirim undangan resmi via SMTP DSN-MUI ke ${selectedRecipients.length} orang penerima?\n\nSurat keluar akan otomatis dilampirkan dalam format PDF dengan body yang dipersonalisasi per penerima.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setIsSending(true);
      setErrorMsg(null);
      setSendResults(null);

      const payload = {
        invitationTitle: invitationTitle.trim(),
        meetingDate: syncAgenda && meetingDate ? new Date(meetingDate).toISOString() : undefined,
        location: syncAgenda ? location.trim() : undefined,
        syncAgenda,
        customNote: customNote.trim() || undefined,
        recipients: selectedRecipients.map((r) => ({
          userId: r.userId || null,
          name: r.name,
          email: r.email,
          jobTitle: r.jobTitle,
          department: r.department,
        })),
      };

      const res = await api.post(`/documents/${doc.id}/send-invitations`, payload);
      if (res.data?.status === 'success') {
        setSendResults(res.data.data);
        if (onSuccess) onSuccess();
      } else {
        throw new Error(res.data?.message || 'Gagal mengirim undangan');
      }
    } catch (err: any) {
      console.error('Error sending invitations:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Terjadi kesalahan saat pengiriman email undangan.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen || !doc) return null;

  const pdfFileName = `${(doc.documentNumber || doc.title || 'surat_keluar').replace(/[\/\\?%*:|"<>]/g, '_')}.pdf`;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => !isSending && onClose()}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white dark:bg-[#101913] rounded-3xl shadow-2xl w-full max-w-5xl h-[92vh] max-h-[880px] flex flex-col border border-slate-200 dark:border-emerald-950/60 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Gold-Green Ribbon */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#006633] via-[#D4AF37] to-[#006633]" />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-emerald-950/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-[#006633] dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <Mail size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Draft & Kirim Undangan Surat Keluar
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold text-[#006633] dark:text-emerald-300">
                  SMTP DSN-MUI
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md sm:max-w-xl">
                No: <strong className="font-mono text-slate-700 dark:text-slate-200">{doc.documentNumber || '-'}</strong> • {doc.title}
              </p>
            </div>
          </div>

          <button
            disabled={isSending}
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50"
            title="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body - 2 Columns */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800/80">
          
          {/* ── LEFT COLUMN: Recipient Selection & Meeting Settings ── */}
          <div className="lg:col-span-6 p-5 sm:p-6 space-y-5 overflow-y-auto max-h-full">
            
            {/* Title / Perihal */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Perihal / Judul Undangan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={isSending}
                value={invitationTitle}
                onChange={(e) => setInvitationTitle(e.target.value)}
                placeholder="Contoh: Undangan Rapat Pleno Pembahasan..."
                className="w-full px-3.5 py-2.5 bg-[#FBFBF8] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-white outline-none focus:border-[#006633] focus:ring-2 focus:ring-[#006633]/15 transition-all"
              />
            </div>

            {/* Recipients Header & Search */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Users size={14} className="text-[#006633]" />
                  Pilih Nama-Nama Terundang ({selectedRecipients.length} Terpilih)
                </label>
                <div className="flex items-center gap-1.5 text-[11px]">
                  {selectedRecipients.length > 0 && (
                    <button
                      type="button"
                      disabled={isSending}
                      onClick={handleClearAllRecipients}
                      className="text-rose-500 hover:underline font-semibold"
                    >
                      Hapus Semua
                    </button>
                  )}
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    disabled={isSending}
                    onClick={() => setShowAddExternal(!showAddExternal)}
                    className="text-[#006633] dark:text-emerald-400 font-bold hover:underline flex items-center gap-0.5"
                  >
                    <UserPlus size={12} />
                    + Tamu Luar
                  </button>
                </div>
              </div>

              {/* External Guest Collapsible Form */}
              {showAddExternal && (
                <form
                  onSubmit={handleAddExternalGuest}
                  className="mb-3 p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-xl space-y-2 animate-in fade-in"
                >
                  <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                    Tambah Peserta Eksternal (Luar DSN-MUI):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nama Lengkap & Gelar"
                      value={extName}
                      onChange={(e) => setExtName(e.target.value)}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-lg text-xs outline-none focus:border-amber-500"
                    />
                    <input
                      type="email"
                      placeholder="Alamat Email"
                      value={extEmail}
                      onChange={(e) => setExtEmail(e.target.value)}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-lg text-xs outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddExternal(false)}
                      className="px-2.5 py-1 text-[11px] text-slate-500 hover:bg-slate-200/50 rounded"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold shadow-xs"
                    >
                      Tambahkan Tamu
                    </button>
                  </div>
                </form>
              )}

              {/* Search Box */}
              <div className="relative mb-2">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  disabled={isSending}
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Ketik nama, email, jabatan, atau divisi..."
                  className="w-full pl-9 pr-20 py-2 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-[#006633] transition-all"
                />
                {filteredUsers.length > 0 && userSearch && (
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#006633] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-2 py-0.5 rounded"
                  >
                    + Semua ({filteredUsers.length})
                  </button>
                )}
              </div>

              {/* User Selection List Container */}
              <div className="border border-slate-200 dark:border-slate-700/80 rounded-2xl p-2 max-h-48 overflow-y-auto bg-slate-50/40 dark:bg-slate-900/40 space-y-1">
                {loadingUsers ? (
                  <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                    <Loader2 size={16} className="animate-spin text-[#006633]" />
                    Memuat daftar pengguna...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    Tidak ditemukan pengguna yang sesuai &quot;{userSearch}&quot;
                  </div>
                ) : (
                  filteredUsers.map((user) => {
                    const selected = isUserSelected(user.email);
                    return (
                      <div
                        key={user.id || user.email}
                        onClick={() => !isSending && handleToggleUser(user)}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all ${
                          selected
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 font-semibold'
                            : 'hover:bg-white dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <input
                            type="checkbox"
                            checked={selected}
                            readOnly
                            className="rounded border-slate-300 text-[#006633] focus:ring-[#006633]"
                          />
                          <div className="truncate">
                            <p className="truncate text-slate-800 dark:text-white font-medium">
                              {user.fullName}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {user.email} {user.department?.name ? `• ${user.department.name}` : ''}
                            </p>
                          </div>
                        </div>
                        {user.jabatan?.name && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-350 shrink-0 ml-2">
                            {user.jabatan.name}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Selected Recipients Tag Cloud */}
            {selectedRecipients.length > 0 && (
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5">
                  Penerima Terpilih ({selectedRecipients.length}):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                  {selectedRecipients.map((rec) => (
                    <span
                      key={rec.email}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-[#006633] dark:text-emerald-300"
                    >
                      <span className="truncate max-w-[130px]">{rec.name}</span>
                      {rec.isExternal && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-200 text-amber-900 font-bold">
                          Luar
                        </span>
                      )}
                      {!isSending && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRecipient(rec.email)}
                          className="text-emerald-600 hover:text-rose-500"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Meeting & Agenda Integration */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  disabled={isSending}
                  checked={syncAgenda}
                  onChange={(e) => setSyncAgenda(e.target.checked)}
                  className="rounded text-[#006633] focus:ring-[#006633]"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Sinkronkan ke Daftar Agenda & Rapat Resmi (/agenda)
                </span>
              </label>

              {syncAgenda && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                      <Calendar size={12} className="text-[#006633]" /> Waktu Pelaksanaan
                    </label>
                    <input
                      type="datetime-local"
                      disabled={isSending}
                      value={meetingDate}
                      onChange={(e) => setMeetingDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-[#006633]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                      <MapPin size={12} className="text-[#006633]" /> Lokasi / Media
                    </label>
                    <input
                      type="text"
                      disabled={isSending}
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Ruang Rapat / Zoom"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-[#006633]"
                    />
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* ── RIGHT COLUMN: Dynamic Preview & Delivery Status ── */}
          <div className="lg:col-span-6 p-5 sm:p-6 flex flex-col justify-between space-y-4 bg-[#FBFBF8] dark:bg-[#0E1510] overflow-y-auto max-h-full">
            
            <div className="space-y-4">
              {/* Preview Header & Recipient Switcher */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                    <FileText size={14} className="text-[#006633]" />
                    Pratinjau Pesan Personal Email
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Setiap email dikirim terpisah dengan nama yang otomatis disesuaikan
                  </p>
                </div>

                {selectedRecipients.length > 1 && (
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-[10px] text-slate-500">Tinjau:</span>
                    <select
                      value={previewRecipientEmail}
                      onChange={(e) => setPreviewRecipientEmail(e.target.value)}
                      className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-[#006633] outline-none"
                    >
                      {selectedRecipients.map((r) => (
                        <option key={r.email} value={r.email}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Dynamic Body Card */}
              <div className="p-4 sm:p-5 bg-white dark:bg-[#131F17] rounded-2xl border border-slate-200/90 dark:border-emerald-950/60 shadow-xs space-y-3 font-sans text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed">
                
                <div className="pb-2 border-b border-slate-100 dark:border-slate-800 text-[#006633] dark:text-emerald-400 font-extrabold text-sm uppercase">
                  Penyampaian {invitationTitle || doc.title || '[Judul Undangan]'}
                </div>

                <div className="py-1">
                  <p className="font-semibold text-slate-600 dark:text-slate-400">Kepada Yth.</p>
                  <p className="font-black text-slate-900 dark:text-white text-sm">
                    {activePreviewRecipient.name}
                  </p>
                  <p className="italic text-[11px] text-slate-400">di TEMPAT</p>
                </div>

                <p className="italic font-medium text-slate-600 dark:text-slate-350">
                  Assalamu&apos;alaykum Wr. Wb.,
                </p>

                <p>
                  Bersama ini Sekretariat Dewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI) mengirimkan <em>softcopy</em> (dalam format .pdf){' '}
                  <strong className="text-slate-900 dark:text-white">
                    {doc.title || invitationTitle || 'Surat Keluar'}
                  </strong>
                  , sebagaimana terlampir.
                </p>

                <p>Silakan diterima dengan baik.</p>

                {syncAgenda && (meetingDate || location) && (
                  <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border-l-4 border-[#006633] text-[11px] space-y-1">
                    <p className="font-bold text-[#006633] dark:text-emerald-400">
                      🗓 Informasi Pelaksanaan Agenda:
                    </p>
                    {meetingDate && (
                      <p>
                        <strong>Waktu:</strong>{' '}
                        {new Date(meetingDate).toLocaleString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        WIB
                      </p>
                    )}
                    {location && (
                      <p>
                        <strong>Tempat/Media:</strong> {location}
                      </p>
                    )}
                  </div>
                )}

                <p>Demikian kami sampaikan.</p>
                <p className="italic font-medium text-slate-600 dark:text-slate-350">
                  Wassalamu&apos;alaykum Wr. Wb.
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                  <p className="font-semibold">Ttd,</p>
                  <p className="font-bold text-[#006633] dark:text-emerald-400">Sekretariat DSN-MUI</p>
                  <p className="text-[10px]">Dewan Syariah Nasional – Majelis Ulama Indonesia</p>
                </div>
              </div>

              {/* Automatic PDF Attachment Badge */}
              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">📄</span>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Lampiran Otomatis (.pdf)
                    </p>
                    <p className="text-[11px] font-mono text-emerald-800 dark:text-emerald-400 truncate max-w-xs">
                      {pdfFileName}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#006633] text-white text-[10px] font-bold">
                  PDF ATTACHED
                </span>
              </div>

              {/* Live Status Result Display (If any) */}
              {sendResults && (
                <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <CheckCircle2 size={15} className="text-emerald-500" />
                      Status Pengiriman ({sendResults.sent}/{sendResults.total} Berhasil)
                    </span>
                    {sendResults.agendaNumber && (
                      <span className="text-[10px] font-mono text-[#006633] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                        Agenda: {sendResults.agendaNumber}
                      </span>
                    )}
                  </div>

                  <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {sendResults.results.map((res, i) => (
                      <div key={i} className="py-1.5 flex items-center justify-between">
                        <div className="truncate pr-2">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{res.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{res.email}</p>
                        </div>
                        {res.status === 'SUCCESS' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 size={12} /> Terkirim
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500" title={res.error}>
                            <XCircle size={12} /> Gagal
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={isSending}
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl transition-all"
              >
                {sendResults ? 'Selesai / Tutup' : 'Batal'}
              </button>

              <button
                type="button"
                disabled={isSending || selectedRecipients.length === 0}
                onClick={handleSendToAll}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#006633] to-[#004d26] hover:from-[#004d26] hover:to-[#003319] text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-[#006633]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Mengirim ke {selectedRecipients.length} Email...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Kirim Undangan ke Semua ({selectedRecipients.length})</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default SendInvitationModal;
