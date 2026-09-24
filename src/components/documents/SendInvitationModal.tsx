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

export type RecipientRole = 'TO' | 'CC' | 'BCC';

export interface RecipientItem {
  id?: string;
  userId?: string | null;
  name: string;
  email: string;
  jobTitle?: string;
  department?: string;
  isExternal?: boolean;
  role: RecipientRole;
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
  const [activeTargetRole, setActiveTargetRole] = useState<RecipientRole>('TO');
  
  // External Guest Form
  const [showAddExternal, setShowAddExternal] = useState(false);
  const [extName, setExtName] = useState('');
  const [extEmail, setExtEmail] = useState('');
  const [extRole, setExtRole] = useState<RecipientRole>('TO');

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

  // Grouped recipients by role
  const toRecipients = useMemo(
    () => selectedRecipients.filter((r) => r.role === 'TO'),
    [selectedRecipients]
  );
  const ccRecipients = useMemo(
    () => selectedRecipients.filter((r) => r.role === 'CC'),
    [selectedRecipients]
  );
  const bccRecipients = useMemo(
    () => selectedRecipients.filter((r) => r.role === 'BCC'),
    [selectedRecipients]
  );

  // Initialize values when modal opens
  useEffect(() => {
    if (isOpen && doc) {
      setInvitationTitle(doc.title || '');
      setSendResults(null);
      setErrorMsg(null);
      setActiveTargetRole('TO');
      
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
        // Prefer previewing a TO recipient first
        const firstTo = toRecipients[0];
        setPreviewRecipientEmail(firstTo ? firstTo.email : selectedRecipients[0].email);
      }
    } else {
      setPreviewRecipientEmail('');
    }
  }, [selectedRecipients, previewRecipientEmail, toRecipients]);

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

  // Helper to format/shorten overly long jabatan so user name is never hidden
  const formatShortJabatan = (jabatanName?: string | null, maxChars = 20): string => {
    if (!jabatanName) return '';
    // Strip English translation after slash (e.g. "Ketua/Chairman" -> "Ketua")
    let text = jabatanName.split('/')[0].trim();
    
    // Abbreviate common long organizational terms
    text = text
      .replace(/Koordinator/gi, 'Koord.')
      .replace(/Wakil/gi, 'Wk.')
      .replace(/Sekretaris/gi, 'Sekr.')
      .replace(/Bendahara/gi, 'Bend.')
      .replace(/Anggota/gi, 'Angg.')
      .replace(/Kepala/gi, 'Ka.')
      .replace(/Kesekretariatan/gi, 'Sekretariat')
      .replace(/Bidang Layanan, Literasi, Relasi Industri dan Regulasi/gi, 'Bid. Layanan & Regulasi')
      .replace(/Bidang Layanan, Literasi, Relasi lndustri dan Regulasi/gi, 'Bid. Layanan & Regulasi')
      .replace(/Bidang Fatwa/gi, 'Bid. Fatwa')
      .replace(/Badan Pengawas DSN-MUI/gi, 'Pengawas DSN')
      .replace(/Badan Pengurus DSN-MUI/gi, 'Pengurus DSN')
      .replace(/Administrasi/gi, 'Admin.');

    if (text.length > maxChars) {
      return text.slice(0, maxChars - 1).trim() + '…';
    }
    return text;
  };

  const getRecipientByEmail = (userEmail?: string | null) => {
    if (!userEmail) return undefined;
    const target = userEmail.trim().toLowerCase();
    return selectedRecipients.find((r) => r.email && r.email.trim().toLowerCase() === target);
  };

  const getRecipientByUser = (user: any) => {
    if (!user) return undefined;
    if (user.id) {
      const byId = selectedRecipients.find((r) => r.userId === user.id);
      if (byId) return byId;
    }
    if (user.email) {
      const target = user.email.trim().toLowerCase();
      return selectedRecipients.find((r) => r.email && r.email.trim().toLowerCase() === target);
    }
    return undefined;
  };

  const handleToggleUserWithRole = (user: any, targetRole: RecipientRole) => {
    if (!user.email) {
      alert(`Pengguna "${user.fullName || user.name || 'Pengguna'}" belum memiliki alamat email yang terdaftar sehingga tidak dapat ditambahkan sebagai penerima email undangan.`);
      return;
    }
    const existing = getRecipientByUser(user);
    if (existing) {
      if (existing.role === targetRole) {
        // Toggle off
        setSelectedRecipients(
          selectedRecipients.filter((r) =>
            user.id && r.userId ? r.userId !== user.id : (r.email || '').toLowerCase() !== (user.email || '').toLowerCase()
          )
        );
      } else {
        // Switch role
        setSelectedRecipients(
          selectedRecipients.map((r) => {
            const isMatch = (user.id && r.userId && r.userId === user.id) || ((r.email || '').toLowerCase() === (user.email || '').toLowerCase());
            return isMatch ? { ...r, role: targetRole } : r;
          })
        );
      }
    } else {
      const newRec: RecipientItem = {
        userId: user.id || null,
        name: user.fullName || user.name || user.email,
        email: user.email,
        jobTitle: user.jobTitle || user.jabatan?.name || '',
        department: user.department?.name || user.department || '',
        isExternal: false,
        role: targetRole,
      };
      setSelectedRecipients([...selectedRecipients, newRec]);
    }
  };

  const handleSwitchRole = (email: string, newRole: RecipientRole) => {
    if (!email) return;
    const target = email.trim().toLowerCase();
    setSelectedRecipients(
      selectedRecipients.map((r) =>
        (r.email || '').trim().toLowerCase() === target ? { ...r, role: newRole } : r
      )
    );
  };

  const handleRemoveRecipient = (email?: string | null, userId?: string | null) => {
    setSelectedRecipients(
      selectedRecipients.filter((r) => {
        if (userId && r.userId) return r.userId !== userId;
        if (email && r.email) return r.email.trim().toLowerCase() !== email.trim().toLowerCase();
        return true;
      })
    );
  };

  const handleAddExternalGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extName.trim() || !extEmail.trim()) {
      alert('Nama dan email tamu eksternal wajib diisi.');
      return;
    }
    if (getRecipientByEmail(extEmail)) {
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
      role: extRole,
    };
    setSelectedRecipients([...selectedRecipients, newGuest]);
    setExtName('');
    setExtEmail('');
    setShowAddExternal(false);
  };

  const handleSelectAllFiltered = () => {
    const newItems = [...selectedRecipients];
    let skippedWithoutEmail = 0;
    filteredUsers.forEach((u) => {
      if (!u.email) {
        skippedWithoutEmail++;
        return;
      }
      const targetEmail = u.email.trim().toLowerCase();
      const exists = newItems.find((r) => 
        (u.id && r.userId && r.userId === u.id) || (r.email && r.email.trim().toLowerCase() === targetEmail)
      );
      if (!exists) {
        newItems.push({
          userId: u.id,
          name: u.fullName || u.name,
          email: u.email,
          jobTitle: u.jobTitle || u.jabatan?.name || '',
          department: u.department?.name || '',
          isExternal: false,
          role: activeTargetRole,
        });
      }
    });
    setSelectedRecipients(newItems);
    if (skippedWithoutEmail > 0) {
      alert(`${skippedWithoutEmail} pengguna tidak ditambahkan karena belum memiliki alamat email terdaftar.`);
    }
  };

  const handleClearRole = (role: RecipientRole) => {
    setSelectedRecipients(selectedRecipients.filter((r) => r.role !== role));
  };

  // Preview helper
  const activePreviewRecipient = useMemo(() => {
    return (
      selectedRecipients.find((r) => r.email === previewRecipientEmail) ||
      toRecipients[0] ||
      selectedRecipients[0] || { name: '[Nama Terundang]', email: 'penerima@email.com', role: 'TO' as RecipientRole }
    );
  }, [selectedRecipients, previewRecipientEmail, toRecipients]);

  // Handle Send to All
  const handleSendToAll = async () => {
    if (toRecipients.length === 0) {
      alert('Harap pilih minimal 1 penerima utama (Kepada / To).');
      return;
    }

    if (!invitationTitle.trim()) {
      alert('Judul undangan wajib diisi.');
      return;
    }

    const ccText = ccRecipients.length > 0 ? `\n• ${ccRecipients.length} Tembusan (CC)` : '';
    const bccText = bccRecipients.length > 0 ? `\n• ${bccRecipients.length} BCC` : '';
    const confirmMsg = `Kirim undangan resmi via SMTP DSN-MUI ke:\n• ${toRecipients.length} Penerima Utama (Kepada)${ccText}${bccText}\n\nSurat keluar akan otomatis dilampirkan dalam format PDF dengan body yang dipersonalisasi per penerima. Lanjutkan?`;
    
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
        recipients: toRecipients.map((r) => ({
          userId: r.userId || null,
          name: r.name,
          email: r.email,
          jobTitle: r.jobTitle,
          department: r.department,
        })),
        cc: ccRecipients.map((r) => ({
          userId: r.userId || null,
          name: r.name,
          email: r.email,
          jobTitle: r.jobTitle,
          department: r.department,
        })),
        bcc: bccRecipients.map((r) => ({
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
          <div className="lg:col-span-6 p-5 sm:p-6 space-y-4 overflow-y-auto max-h-full">
            
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

            {/* Recipient Role Switcher & Unified Search */}
            <div>
              <div className="flex items-center justify-between mb-2">
                {/* Target Role Segmented Tabs */}
                <div className="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveTargetRole('TO')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTargetRole === 'TO'
                        ? 'bg-[#006633] text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>Kepada (To)</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeTargetRole === 'TO'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {toRecipients.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTargetRole('CC')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTargetRole === 'CC'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>Tembusan (CC)</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeTargetRole === 'CC'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {ccRecipients.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTargetRole('BCC')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTargetRole === 'BCC'
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>BCC</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeTargetRole === 'BCC'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {bccRecipients.length}
                    </span>
                  </button>
                </div>

                {/* External Guest Button */}
                <button
                  type="button"
                  disabled={isSending}
                  onClick={() => {
                    setExtRole(activeTargetRole);
                    setShowAddExternal(!showAddExternal);
                  }}
                  className="text-[#006633] dark:text-emerald-400 text-xs font-bold hover:underline flex items-center gap-1"
                >
                  <UserPlus size={13} />
                  + Tamu Luar
                </button>
              </div>

              {/* External Guest Collapsible Form */}
              {showAddExternal && (
                <form
                  onSubmit={handleAddExternalGuest}
                  className="mb-3 p-3 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/90 dark:border-amber-900/40 rounded-xl space-y-2.5 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1">
                      <UserPlus size={13} /> Tambah Peserta Eksternal (Luar DSN-MUI):
                    </p>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400">
                      Target: <strong>{extRole}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                    <select
                      value={extRole}
                      onChange={(e) => setExtRole(e.target.value as RecipientRole)}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-lg text-xs font-bold outline-none text-slate-800 dark:text-white"
                    >
                      <option value="TO">Peran: Kepada (To)</option>
                      <option value="CC">Peran: Tembusan (CC)</option>
                      <option value="BCC">Peran: BCC</option>
                    </select>
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
                      className="px-3.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold shadow-xs cursor-pointer"
                    >
                      Tambahkan Tamu
                    </button>
                  </div>
                </form>
              )}

              {/* Single Unified Search Box */}
              <div className="relative mb-2">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  disabled={isSending}
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder={
                    activeTargetRole === 'TO'
                      ? 'Cari nama/email untuk ditambahkan ke Kepada (To)...'
                      : activeTargetRole === 'CC'
                      ? 'Cari nama/email untuk ditambahkan ke Tembusan (CC)...'
                      : 'Cari nama/email untuk ditambahkan ke BCC...'
                  }
                  className="w-full pl-9 pr-24 py-2 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-[#006633] transition-all"
                />
                {filteredUsers.length > 0 && userSearch && (
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#006633] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-2 py-0.5 rounded cursor-pointer"
                  >
                    + Semua ({filteredUsers.length}) ke {activeTargetRole}
                  </button>
                )}
              </div>

              {/* Directory User Result List */}
              <div className="border border-slate-200 dark:border-slate-700/80 rounded-2xl p-2 max-h-44 overflow-y-auto bg-slate-50/40 dark:bg-slate-900/40 space-y-1">
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
                    const existingRecipient = getRecipientByUser(user);
                    const hasEmail = Boolean(user.email);
                    return (
                      <div
                        key={user.id || user.email}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs transition-all ${
                          existingRecipient
                            ? existingRecipient.role === 'TO'
                              ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 font-semibold'
                              : existingRecipient.role === 'CC'
                              ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 font-semibold'
                              : 'bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold'
                            : 'hover:bg-white dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-transparent'
                        }`}
                      >
                        <div
                          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer mr-2"
                          onClick={() => !isSending && handleToggleUserWithRole(user, activeTargetRole)}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-slate-800 dark:text-white font-semibold text-xs leading-tight">
                              {user.fullName || user.name}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {user.email ? (
                                <span>{user.email}</span>
                              ) : (
                                <span className="text-amber-600 dark:text-amber-400 font-medium italic">(Tanpa Email)</span>
                              )}
                              {user.department?.name ? ` • ${user.department.name}` : ''}
                            </p>
                          </div>
                        </div>

                        {/* Quick Action or Status */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {user.jabatan?.name && (
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700/70 text-slate-600 dark:text-slate-350 max-w-[100px] sm:max-w-[130px] truncate inline-block shrink-0 font-medium"
                              title={user.jabatan.name}
                            >
                              {formatShortJabatan(user.jabatan.name, 18)}
                            </span>
                          )}

                          {existingRecipient ? (
                            <div className="flex items-center gap-1">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                existingRecipient.role === 'TO'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                                  : existingRecipient.role === 'CC'
                                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300'
                                  : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                              }`}>
                                {existingRecipient.role === 'TO' ? 'Kepada' : existingRecipient.role}
                              </span>
                              <button
                                type="button"
                                disabled={isSending}
                                onClick={() => handleRemoveRecipient(user.email, user.id)}
                                className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                                title="Hapus dari daftar"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : hasEmail ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={isSending}
                                onClick={() => handleToggleUserWithRole(user, 'TO')}
                                className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 hover:bg-[#006633] text-[#006633] hover:text-white transition-all border border-emerald-200 cursor-pointer"
                                title="Tambahkan ke Kepada (To)"
                              >
                                + To
                              </button>
                              <button
                                type="button"
                                disabled={isSending}
                                onClick={() => handleToggleUserWithRole(user, 'CC')}
                                className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white transition-all border border-indigo-200 cursor-pointer"
                                title="Tambahkan ke Tembusan (CC)"
                              >
                                + CC
                              </button>
                              <button
                                type="button"
                                disabled={isSending}
                                onClick={() => handleToggleUserWithRole(user, 'BCC')}
                                className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-700 text-slate-600 hover:text-white transition-all border border-slate-300 cursor-pointer"
                                title="Tambahkan ke BCC"
                              >
                                + BCC
                              </button>
                            </div>
                          ) : (
                            <span
                              className="text-[9px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-1.5 py-0.5 rounded"
                              title="Pengguna belum memiliki email terdaftar"
                            >
                              Tanpa Email
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ── 3 RECIPIENT CATEGORIES: KEPADA, CC, BCC ── */}
            <div className="space-y-3 pt-1">
              
              {/* 1. KEPADA (TO) */}
              <div className="p-3 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <label className="text-xs font-bold text-slate-800 dark:text-white">
                      Kepada (To) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-normal">
                      ({toRecipients.length} Penerima Utama • <span className="text-rose-600 font-semibold">Wajib min. 1</span>)
                    </span>
                  </div>
                  {toRecipients.length > 0 && !isSending && (
                    <button
                      type="button"
                      onClick={() => handleClearRole('TO')}
                      className="text-[10px] text-rose-500 hover:underline font-semibold cursor-pointer"
                    >
                      Kosongkan
                    </button>
                  )}
                </div>

                {toRecipients.length === 0 ? (
                  <div className="py-2.5 px-3 border border-dashed border-emerald-200 dark:border-emerald-900/40 rounded-xl text-center text-xs text-slate-400 bg-emerald-50/30 dark:bg-emerald-950/10">
                    Belum ada penerima utama dipilih. Klik nama di daftar atas untuk menambahkan ke <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">Kepada (To)</strong>.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {toRecipients.map((rec) => (
                      <RecipientChip
                        key={rec.userId || rec.email}
                        rec={rec}
                        isSending={isSending}
                        onSwitchRole={handleSwitchRole}
                        onRemove={handleRemoveRecipient}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* 2. TEMBUSAN (CC) */}
              <div className="p-3 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <label className="text-xs font-bold text-slate-800 dark:text-white">
                      Tembusan (CC)
                    </label>
                    <span className="text-[11px] text-slate-400 font-normal">
                      ({ccRecipients.length} Penerima • <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Opsional</span>)
                    </span>
                  </div>
                  {ccRecipients.length > 0 && !isSending && (
                    <button
                      type="button"
                      onClick={() => handleClearRole('CC')}
                      className="text-[10px] text-rose-500 hover:underline font-semibold cursor-pointer"
                    >
                      Kosongkan
                    </button>
                  )}
                </div>

                {ccRecipients.length === 0 ? (
                  <div className="py-2 px-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400 italic bg-slate-50/50 dark:bg-slate-800/20">
                    Tidak ada tembusan (opsional). Nama yang di-CC akan tercantum dalam surat resmi dan menerima tembusan.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {ccRecipients.map((rec) => (
                      <RecipientChip
                        key={rec.userId || rec.email}
                        rec={rec}
                        isSending={isSending}
                        onSwitchRole={handleSwitchRole}
                        onRemove={handleRemoveRecipient}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* 3. BCC */}
              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <label className="text-xs font-bold text-slate-800 dark:text-white">
                      BCC (Blind Carbon Copy)
                    </label>
                    <span className="text-[11px] text-slate-400 font-normal">
                      ({bccRecipients.length} Penerima • <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Opsional</span>)
                    </span>
                  </div>
                  {bccRecipients.length > 0 && !isSending && (
                    <button
                      type="button"
                      onClick={() => handleClearRole('BCC')}
                      className="text-[10px] text-rose-500 hover:underline font-semibold cursor-pointer"
                    >
                      Kosongkan
                    </button>
                  )}
                </div>

                {bccRecipients.length === 0 ? (
                  <div className="py-2 px-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400 italic bg-slate-50/50 dark:bg-slate-800/20">
                    Tidak ada BCC (opsional). Akun penerima BCC tidak akan terlihat oleh penerima lainnya.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {bccRecipients.map((rec) => (
                      <RecipientChip
                        key={rec.userId || rec.email}
                        rec={rec}
                        isSending={isSending}
                        onSwitchRole={handleSwitchRole}
                        onRemove={handleRemoveRecipient}
                      />
                    ))}
                  </div>
                )}
              </div>

            </div>

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
            
            <div className="space-y-3.5">
              {/* Preview Header & Recipient Switcher */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                    <FileText size={14} className="text-[#006633]" />
                    Pratinjau Pesan Personal Email
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Setiap email dikirim personal dengan PDF resmi terlampir
                  </p>
                </div>

                {selectedRecipients.length > 1 && (
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-[10px] text-slate-500">Tinjau:</span>
                    <select
                      value={previewRecipientEmail}
                      onChange={(e) => setPreviewRecipientEmail(e.target.value)}
                      className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-[#006633] outline-none max-w-[150px] truncate"
                    >
                      {toRecipients.length > 0 && (
                        <optgroup label="Kepada (To)">
                          {toRecipients.map((r) => (
                            <option key={r.email} value={r.email}>
                              {r.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {ccRecipients.length > 0 && (
                        <optgroup label="Tembusan (CC)">
                          {ccRecipients.map((r) => (
                            <option key={r.email} value={r.email}>
                              [CC] {r.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {bccRecipients.length > 0 && (
                        <optgroup label="BCC">
                          {bccRecipients.map((r) => (
                            <option key={r.email} value={r.email}>
                              [BCC] {r.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                )}
              </div>

              {/* Distribution Summary Card */}
              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Rincian Distribusi Email:</span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    Total {selectedRecipients.length} Penerima ({toRecipients.length} To, {ccRecipients.length} CC, {bccRecipients.length} BCC)
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1 text-[11px]">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 min-w-[70px]">Kepada:</span>
                    <span className="text-slate-700 dark:text-slate-300 truncate">
                      {toRecipients.length > 0 ? (
                        toRecipients.map((r) => r.name).join(', ')
                      ) : (
                        <span className="text-rose-500 font-semibold italic">Belum dipilih (Wajib min. 1)</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-indigo-700 dark:text-indigo-400 min-w-[70px]">Tembusan:</span>
                    <span className="text-slate-600 dark:text-slate-400 truncate">
                      {ccRecipients.length > 0 ? (
                        ccRecipients.map((r) => r.name).join(', ')
                      ) : (
                        <span className="italic text-slate-400">– (Opsional)</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-slate-600 dark:text-slate-400 min-w-[70px]">BCC:</span>
                    <span className="text-slate-600 dark:text-slate-400 truncate">
                      {bccRecipients.length > 0 ? (
                        `${bccRecipients.length} penerima tersembunyi (${bccRecipients.map((r) => r.name).join(', ')})`
                      ) : (
                        <span className="italic text-slate-400">– (Opsional)</span>
                      )}
                    </span>
                  </div>
                </div>

                {(ccRecipients.length > 0 || bccRecipients.length > 0) && (
                  <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10.5px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ 1 Surat Khusus:</span>
                    <span>
                      {toRecipients.length > 1
                        ? 'Penerima CC & BCC dikirimi 1 surat khusus rekap (tidak dikirim berulang per penerima utama).'
                        : 'Penerima CC & BCC disertakan pada 1 surat resmi ini.'}
                    </span>
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

                {/* Signature Area */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                  <p className="font-semibold">Ttd,</p>
                  <p className="font-bold text-[#006633] dark:text-emerald-400">Sekretariat DSN-MUI</p>
                  <p className="text-[10px]">Dewan Syariah Nasional – Majelis Ulama Indonesia</p>
                </div>

                {/* Formal Tembusan Section in letter body (if CC present) */}
                {ccRecipients.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-dashed border-slate-200 dark:border-slate-800 text-[11px]">
                    <p className="font-bold text-slate-700 dark:text-slate-300">
                      Tembusan disampaikan kepada Yth.:
                    </p>
                    <ol className="list-decimal pl-4 space-y-0.5 mt-1 text-slate-600 dark:text-slate-400">
                      {ccRecipients.map((c, i) => (
                        <li key={c.email || i}>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{c.name}</span>
                          {c.department && <span className="text-[10px] text-slate-400"> ({c.department})</span>}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
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
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl transition-all cursor-pointer"
              >
                {sendResults ? 'Selesai / Tutup' : 'Batal'}
              </button>

              <button
                type="button"
                disabled={isSending || toRecipients.length === 0}
                onClick={handleSendToAll}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#006633] to-[#004d26] hover:from-[#004d26] hover:to-[#003319] text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-[#006633]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Mengirim ke {toRecipients.length} Penerima...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>
                      Kirim Undangan ({toRecipients.length} Kepada{ccRecipients.length > 0 ? ` + ${ccRecipients.length} CC` : ''})
                    </span>
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

/**
 * Helper Sub-Component: RecipientChip
 * Renders individual recipient pill with role badge, 1-click role switcher, and remove button.
 */
const RecipientChip: React.FC<{
  rec: RecipientItem;
  isSending: boolean;
  onSwitchRole: (email: string, role: RecipientRole) => void;
  onRemove: (email?: string | null, userId?: string | null) => void;
}> = ({ rec, isSending, onSwitchRole, onRemove }) => {
  const isTo = rec.role === 'TO';
  const isCc = rec.role === 'CC';

  return (
    <span
      className={`inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-semibold border transition-all ${
        isTo
          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-[#006633] dark:text-emerald-300'
          : isCc
          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
          : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
      }`}
    >
      <span className="truncate max-w-[130px]" title={`${rec.name} (${rec.email})`}>
        {rec.name}
      </span>
      {rec.isExternal && (
        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-200 text-amber-900 font-bold">
          Luar
        </span>
      )}

      {/* Role Switcher Select */}
      {!isSending && (
        <select
          value={rec.role}
          onChange={(e) => onSwitchRole(rec.email, e.target.value as RecipientRole)}
          className={`text-[9px] font-bold uppercase rounded px-1 py-0.5 border cursor-pointer outline-none ${
            isTo
              ? 'bg-emerald-100 dark:bg-emerald-900 border-emerald-300 text-emerald-800 dark:text-emerald-200'
              : isCc
              ? 'bg-indigo-100 dark:bg-indigo-900 border-indigo-300 text-indigo-800 dark:text-indigo-200'
              : 'bg-slate-200 dark:bg-slate-700 border-slate-400 text-slate-800 dark:text-slate-200'
          }`}
          title="Ubah peran penerima"
        >
          <option value="TO">TO</option>
          <option value="CC">CC</option>
          <option value="BCC">BCC</option>
        </select>
      )}

      {!isSending && (
        <button
          type="button"
          onClick={() => onRemove(rec.email, rec.userId)}
          className="text-slate-400 hover:text-rose-500 transition-colors p-0.5 cursor-pointer"
          title="Hapus"
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
};

export default SendInvitationModal;
