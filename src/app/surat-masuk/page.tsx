"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Download,
  Eye,
  FileBadge,
  Loader2,
  AlertCircle,
  ChevronDown,
  X,
  Pencil,
  Archive,
  Trash2,
  Activity,
  CheckCircle2,
  Clock,
  MapPin,
  AlertTriangle,
  FileUp,
  Play,
  Send,
  User as UserIcon,
  ExternalLink,
  ShieldCheck,
  History,
  Info,
  Paperclip,
  Calendar,
  UploadCloud,
  File,
  Folder,
  FolderPlus,
  ChevronRight,
  Home,
  Check
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import Can from "@/components/auth/Can";
import DocumentReader from "@/components/documents/DocumentReader";

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002/api').replace('/api', '');

const getNearestMeeting = (meetings: any[]) => {
  if (!meetings || meetings.length === 0) return null;
  const now = new Date();
  
  // Find nearest future meeting (dateTime >= now)
  const futureMeetings = meetings
    .filter((m) => new Date(m.dateTime) >= now)
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    
  if (futureMeetings.length > 0) return futureMeetings[0];
  
  // If no future meetings, return the most recent past meeting (closest to now)
  const pastMeetings = meetings
    .filter((m) => new Date(m.dateTime) < now)
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    
  return pastMeetings[0] || null;
};

const statusClass = (status: string) => {
  const map: Record<string, string> = {
    SIGNED: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/50",
    PENDING_APPROVAL: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/50",
    REJECTED: "bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:border-red-900/50",
  };
  return map[status] ?? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
};

// ── Approval Submit Modal ──────────────────────────────────────────────────
const ApprovalSubmitModal = ({
  documentId,
  onClose,
  onSuccess,
}: {
  documentId: string;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [users, setUsers] = useState<any[]>([]);
  const [steps, setSteps] = useState<{ userId: string }[]>([{ userId: "" }]);
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(true);

  useEffect(() => {
    api.get("/users")
      .then((res) => setUsers(res.data.data))
      .catch((err) => console.error("Failed to fetch users", err))
      .finally(() => setFetchingUsers(false));
  }, []);

  const handleAddStep = () => setSteps([...steps, { userId: "" }]);
  const handleRemoveStep = (index: number) => setSteps(steps.filter((_, i) => i !== index));
  const handleUserChange = (index: number, val: string) => {
    const newSteps = [...steps];
    newSteps[index].userId = val;
    setSteps(newSteps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (steps.some((s) => !s.userId)) {
      alert("Harap pilih penandatangan untuk semua urutan.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/workflow/submit", {
        documentId,
        stepConfig: steps.map((s, i) => ({ stepNumber: i + 1, userId: s.userId })),
      });
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal mengajukan persetujuan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl w-full max-w-lg p-6 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Alur Persetujuan</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">Tentukan siapa saja yang harus menandatangani dokumen ini secara berurutan.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
            <X size={18} />
          </button>
        </div>

        {fetchingUsers ? (
          <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-3 items-center group">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                    {idx + 1}
                  </div>
                  <select
                    required
                    value={step.userId}
                    onChange={(e) => handleUserChange(idx, e.target.value)}
                    className="flex-1 px-4 py-3 bg-[#F7F5EC] border border-[#DDDBC9] rounded-xl outline-none focus:border-[#006633]/50 focus:bg-white text-sm appearance-none"
                  >
                    <option value="">— Pilih Penandatangan —</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.fullName} ({u.role.name})</option>
                    ))}
                  </select>
                  {steps.length > 1 && (
                    <button type="button" onClick={() => handleRemoveStep(idx)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button type="button" onClick={handleAddStep} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 font-bold text-sm hover:border-slate-300 hover:bg-slate-50 transition-all">
              <Plus size={16} /> Tambah Penandatangan
            </button>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-50 border border-slate-200 transition-all">
                Batal
              </button>
              <button type="submit" disabled={loading} className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #006633 0%, #1B7F4A 100%)' }}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Mulai Workflow</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ── Workflow Edit Modal ────────────────────────────────────────────────────
const WorkflowEditModal = ({
  documentId,
  onClose,
  onSuccess,
}: {
  documentId: string;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [users, setUsers] = useState<any[]>([]);
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    api.get("/users")
      .then((res) => setUsers(res.data.data))
      .catch((err) => console.error("Failed to fetch users", err));

    api.get(`/workflow/document/${documentId}`)
      .then((res) => {
        if (res.data.status === "success" && res.data.data.length > 0) {
          setSteps(res.data.data);
        } else {
          setSteps([{ userId: "" }]);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch current steps", err);
        setSteps([{ userId: "" }]);
      })
      .finally(() => setFetching(false));
  }, [documentId]);

  const handleAddStep = () => setSteps([...steps, { userId: "", status: "WAITING" }]);
  const handleRemoveStep = (index: number) => {
    if (steps[index].status === "APPROVED") return;
    setSteps(steps.filter((_, i) => i !== index));
  };
  const handleUserChange = (index: number, val: string) => {
    if (steps[index].status === "APPROVED") return;
    const newSteps = [...steps];
    newSteps[index].userId = val;
    setSteps(newSteps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (steps.some((s) => !s.userId)) {
      alert("Harap pilih penandatangan untuk semua urutan.");
      return;
    }
    setLoading(true);
    try {
      await api.put(`/workflow/document/${documentId}`, {
        stepConfig: steps.map((s, i) => ({ stepNumber: i + 1, userId: s.userId })),
      });
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal mengubah alur persetujuan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl w-full max-w-lg p-6 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ubah Alur Persetujuan</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">Langkah yang sudah disetujui terkunci dan tidak dapat diubah.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
            <X size={18} />
          </button>
        </div>

        {fetching ? (
          <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-2">
              {steps.map((step, idx) => {
                const isApproved = step.status === "APPROVED";
                return isApproved ? (
                  <div key={idx} className="flex gap-3 items-start group">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-2">
                      <CheckCircle2 size={12} />
                    </div>
                    <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-800 dark:text-white">{step.approver || "Approver " + (idx + 1)}</p>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                          APPROVED
                        </span>
                      </div>
                      {step.actionedAt && (
                        <p className="text-[9px] text-slate-400 font-mono">
                          {new Date(step.actionedAt).toLocaleString('id-ID')}
                        </p>
                      )}
                      {step.comment && (
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 italic mt-1 leading-relaxed bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                          &ldquo;{step.comment}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div key={idx} className="flex gap-3 items-center group">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                      {idx + 1}
                    </div>
                    <select
                      required
                      value={step.userId || ""}
                      onChange={(e) => handleUserChange(idx, e.target.value)}
                      className="flex-1 px-4 py-3 bg-[#F7F5EC] border border-[#DDDBC9] rounded-xl outline-none focus:border-[#006633]/50 focus:bg-white text-sm appearance-none"
                    >
                      <option value="">— Pilih Penandatangan —</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.fullName} ({u.role.name})</option>
                      ))}
                    </select>
                    {steps.length > 1 && (
                      <button type="button" onClick={() => handleRemoveStep(idx)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <button type="button" onClick={handleAddStep} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 font-bold text-sm hover:border-slate-300 hover:bg-slate-50 transition-all">
              <Plus size={16} /> Tambah Penandatangan
            </button>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-50 border border-slate-200 transition-all">
                Batal
              </button>
              <button type="submit" disabled={loading} className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #006633 0%, #1B7F4A 100%)' }}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Simpan Perubahan</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ── Revision Modal ──────────────────────────────────────────────────
const RevisionModal = ({
  documentId,
  onClose,
  onSuccess
}: {
  documentId: string;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert("Pilih file revisi terlebih dahulu");

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("changeNotes", notes || "Revisi Dokumen");

      await api.put(`/documents/${documentId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal mengunggah revisi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 p-8 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
              <Plus size={20} />
            </div>
            Upload Revisi Baru
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 ml-1">File Dokumen Baru</label>
            <div className="relative group">
              <input required type="file" onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div className="w-full px-4 py-8 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-2 group-hover:border-blue-500/50 group-hover:bg-blue-50/10 transition-all">
                <Download size={24} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-blue-500 truncate max-w-[200px]">
                  {file ? file.name : "Klik atau seret file revisi (PDF/Word)"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 ml-1">Catatan Perubahan (Opsional)</label>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Jelaskan apa saja yang diperbaiki..."
              className="w-full h-24 px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm outline-none ring-2 ring-transparent focus:ring-blue-500/20 transition-all resize-none"
            />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 size={20} className="animate-spin" /> : <><Send size={18} /> Kirim Revisi</>}
          </button>
        </form>
      </div>
    </div>
  );
};





// ── Document Detail Modal (Centralized & DB-Connected) ──────────────────────────────────
const DocumentDetailModal = ({
  sidebarDoc,
  initialTab,
  initialIsCreatingMeeting,
  onClose,
  setIsRevisionModalOpen,
  setIsApprovalModalOpen,
  setIsWorkflowEditModalOpen,
}: {
  sidebarDoc: any;
  initialTab?: 'detail' | 'evidence' | 'agenda';
  initialIsCreatingMeeting?: boolean;
  onClose: () => void;
  setIsRevisionModalOpen: (val: boolean) => void;
  setIsApprovalModalOpen: (val: boolean) => void;
  setIsWorkflowEditModalOpen: (val: boolean) => void;
}) => {
  const [activeTab, setActiveTab] = useState<'detail' | 'evidence' | 'agenda'>(initialTab || 'detail');
  
  // System users for user picker
  const [systemUsers, setSystemUsers] = useState<any[]>([]);

  // File Explorer States
  const [currentPath, setCurrentPath] = useState<{id: string, name: string}[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [isLoadingEvidence, setIsLoadingEvidence] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Agenda States
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [linkedMeetings, setLinkedMeetings] = useState<any[]>([]);
  const [availableMeetings, setAvailableMeetings] = useState<any[]>([]);
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(initialIsCreatingMeeting || false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
    if (initialIsCreatingMeeting !== undefined) {
      setIsCreatingMeeting(initialIsCreatingMeeting);
    }
  }, [sidebarDoc, initialTab, initialIsCreatingMeeting]);
  
  // New Meeting Form States
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingLocation, setMeetingLocation] = useState('');
  const [meetingTime, setMeetingTime] = useState('09:00');
  const [meetingEndTime, setMeetingEndTime] = useState('11:00');
  const [meetingDate, setMeetingDate] = useState('');

  useEffect(() => {
    if (isCreatingMeeting) {
      setMeetingDate(selectedDate || new Date().toISOString().split('T')[0]);
    }
  }, [isCreatingMeeting, selectedDate]);
  
  // User Search / Picking States
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [selectedAttendees, setSelectedAttendees] = useState<any[]>([]);

  const latestVersion = sidebarDoc?.versions?.[0] || sidebarDoc?.versions?.[sidebarDoc.versions.length - 1];
  const currentFolderId = currentPath.length > 0 ? currentPath[currentPath.length - 1].id : null;

  // Fetch system users on mount
  useEffect(() => {
    api.get("/users")
      .then(res => setSystemUsers(res.data.data || []))
      .catch(err => console.error("Failed to fetch system users", err));
  }, []);

  // Filter users based on query
  const filteredUsers = searchUserQuery.trim() === '' ? [] : systemUsers.filter(u => 
    u.fullName.toLowerCase().includes(searchUserQuery.toLowerCase()) || 
    (u.email && u.email.toLowerCase().includes(searchUserQuery.toLowerCase()))
  ).filter(u => !selectedAttendees.some(selected => selected.id === u.id));

  const handleAddAttendee = (user: any) => {
    setSelectedAttendees([...selectedAttendees, user]);
    setSearchUserQuery('');
  };

  const handleRemoveAttendee = (userId: string) => {
    setSelectedAttendees(selectedAttendees.filter(u => u.id !== userId));
  };

  // Load Evidence
  const loadEvidence = async (parentId: string | null) => {
    try {
      setIsLoadingEvidence(true);
      const res = await api.get(`/documents/${sidebarDoc.id}/evidence`, {
        params: { parentId }
      });
      if (res.data.status === 'success') {
        setFolders(res.data.data.folders);
        setFiles(res.data.data.files);
        if (res.data.data.breadcrumbs) {
          setCurrentPath(res.data.data.breadcrumbs);
        }
      }
    } catch (error) {
      console.error("Failed to load evidence", error);
    } finally {
      setIsLoadingEvidence(false);
    }
  };

  // Load Meetings
  const loadLinkedMeetings = async () => {
    try {
      const res = await api.get(`/documents/${sidebarDoc.id}/meetings`);
      if (res.data.status === 'success') {
        setLinkedMeetings(res.data.data);
      }
    } catch (error) {
      console.error("Failed to load linked meetings", error);
    }
  };

  const loadAvailableMeetings = async (dateStr: string) => {
    try {
      const res = await api.get(`/meeting`, { params: { date: dateStr } });
      if (res.data.status === 'success') {
        setAvailableMeetings(res.data.data.filter((m: any) => m.documentId !== sidebarDoc.id));
      }
    } catch (error) {
      console.error("Failed to load available meetings", error);
    }
  };

  useEffect(() => {
    if (activeTab === 'evidence') {
      loadEvidence(currentFolderId);
    } else if (activeTab === 'agenda') {
      loadLinkedMeetings();
      if (selectedDate) {
        loadAvailableMeetings(selectedDate);
      }
    }
  }, [activeTab, currentFolderId, selectedDate, sidebarDoc.id]);

  const handleNavigate = (folderId: string, folderName: string) => {
    setCurrentPath([...currentPath, { id: folderId, name: folderName }]);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setCurrentPath([]);
    } else {
      setCurrentPath(currentPath.slice(0, index + 1));
    }
  };

  const handleCreateFolder = async () => {
    const name = prompt('Nama folder baru:');
    if (!name) return;
    try {
      const res = await api.post(`/documents/${sidebarDoc.id}/evidence/folders`, {
        name,
        parentId: currentFolderId
      });
      if (res.data.status === 'success') {
        loadEvidence(currentFolderId);
      }
    } catch (error) {
      console.error("Failed to create folder", error);
      alert("Gagal membuat folder");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    setIsUploading(true);
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const formData = new FormData();
        formData.append('file', selectedFiles[i]);
        if (currentFolderId) {
          formData.append('folderId', currentFolderId);
        }
        await api.post(`/documents/${sidebarDoc.id}/evidence/files`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      loadEvidence(currentFolderId);
    } catch (error) {
      console.error("Failed to upload file", error);
      alert("Gagal mengunggah file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus file ini?")) return;
    try {
      await api.delete(`/documents/${sidebarDoc.id}/evidence/files/${fileId}`);
      loadEvidence(currentFolderId);
    } catch (error) {
      console.error("Failed to delete file", error);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus folder ini beserta isinya?")) return;
    try {
      await api.delete(`/documents/${sidebarDoc.id}/evidence/folders/${folderId}`);
      loadEvidence(currentFolderId);
    } catch (error) {
      console.error("Failed to delete folder", error);
    }
  };

  const handleLinkMeeting = async (meetingId: string) => {
    try {
      const res = await api.post(`/documents/${sidebarDoc.id}/meetings/${meetingId}/link`);
      if (res.data.status === 'success') {
        alert("Agenda rapat berhasil dikaitkan!");
        loadLinkedMeetings();
        if (selectedDate) {
          loadAvailableMeetings(selectedDate);
        }
      }
    } catch (error) {
      console.error("Failed to link meeting", error);
    }
  };

  const handleUnlinkMeeting = async (meetingId: string) => {
    if (!confirm("Apakah Anda yakin ingin memutus kaitan rapat ini dari surat masuk?")) return;
    try {
      const res = await api.delete(`/documents/${sidebarDoc.id}/meetings/${meetingId}/link`);
      if (res.data.status === 'success') {
        alert("Kaitan rapat berhasil dihapus!");
        loadLinkedMeetings();
        if (selectedDate) {
          loadAvailableMeetings(selectedDate);
        }
      }
    } catch (error) {
      console.error("Failed to unlink meeting", error);
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle || !meetingLocation || !meetingTime || !meetingEndTime || !meetingDate) {
      alert("Semua field wajib diisi");
      return;
    }

    try {
      const dateTimeStr = `${meetingDate}T${meetingTime}:00`;
      const endDateTimeStr = `${meetingDate}T${meetingEndTime}:00`;
      const res = await api.post(`/documents/${sidebarDoc.id}/meetings`, {
        title: meetingTitle,
        location: meetingLocation,
        dateTime: new Date(dateTimeStr).toISOString(),
        endDateTime: new Date(endDateTimeStr).toISOString(),
        targetType: 'CROSS_INTERNAL',
        customAttendeeIds: selectedAttendees.map(u => u.id)
      });
      if (res.data.status === 'success') {
        alert("Agenda rapat baru berhasil dibuat!");
        setMeetingTitle('');
        setMeetingLocation('');
        setMeetingTime('09:00');
        setMeetingEndTime('11:00');
        setSelectedAttendees([]);
        setIsCreatingMeeting(false);
        loadLinkedMeetings();
        if (selectedDate) {
          loadAvailableMeetings(selectedDate);
        }
      }
    } catch (error) {
      console.error("Failed to create meeting", error);
      alert("Gagal membuat agenda rapat");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-5xl h-[90vh] sm:h-[85vh] rounded-[24px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#006633]/10 text-[#006633] flex items-center justify-center shrink-0">
              <FileBadge size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">Detail Surat Masuk</h3>
              <p className="text-xs text-slate-500 font-medium font-mono mt-0.5">{sidebarDoc.documentNumber || "No Nomor"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Layout Body */}
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-56 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 shrink-0 p-4 space-y-1 overflow-x-auto flex md:flex-col">
            <button
              onClick={() => setActiveTab('detail')}
              className={cn("flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap", activeTab === 'detail' ? "bg-[#006633] text-white shadow-md shadow-[#006633]/20" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white")}
            >
              <Info size={18} /> Informasi & Alur
            </button>
            <button
              onClick={() => setActiveTab('evidence')}
              className={cn("flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap", activeTab === 'evidence' ? "bg-[#006633] text-white shadow-md shadow-[#006633]/20" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white")}
            >
              <Paperclip size={18} /> Dokumen Lampiran
            </button>
            <button
              onClick={() => setActiveTab('agenda')}
              className={cn("flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap", activeTab === 'agenda' ? "bg-[#006633] text-white shadow-md shadow-[#006633]/20" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white")}
            >
              <Calendar size={18} /> Agenda Rapat
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 relative">
            {activeTab === 'detail' && (
              <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-300">
                {/* Header Title & Status */}
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn("text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wide", statusClass(sidebarDoc.status))}>
                      {sidebarDoc.status}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded">
                      {sidebarDoc.category?.name}
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white leading-snug">{sidebarDoc.title}</h3>
                </div>

                {/* Metadata Card (At the top as requested) */}
                <div className="bg-slate-50 dark:bg-slate-800/20 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                    Informasi Metadata Surat Masuk
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-3">
                      <div>
                        <span className="text-slate-400 font-medium">Nomor Surat:</span>
                        <p className="text-slate-900 dark:text-slate-100 font-bold font-mono mt-0.5">{sidebarDoc.documentNumber || "—"}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Kategori Surat:</span>
                        <p className="text-slate-900 dark:text-slate-100 font-bold mt-0.5">{sidebarDoc.category?.name || "—"}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Sifat / Klasifikasi:</span>
                        <p className="text-slate-900 dark:text-slate-100 font-bold mt-0.5">{sidebarDoc.classification?.name || "—"}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-slate-400 font-medium">Tanggal Masuk:</span>
                        <p className="text-slate-900 dark:text-slate-100 font-bold mt-0.5">
                          {new Date(sidebarDoc.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Pembuat Dokumen:</span>
                        <p className="text-slate-900 dark:text-slate-100 font-bold mt-0.5">{sidebarDoc.creator?.fullName || "—"}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Keterangan Catatan Tambahan:</span>
                        <p className="text-slate-700 dark:text-slate-300 font-medium mt-0.5 italic">
                          {sidebarDoc.versions?.[0]?.changeNotes || "Tidak ada keterangan tambahan."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar inside Metadata */}
                  <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800 flex flex-wrap gap-2.5">
                    {latestVersion && (
                      <a
                        href={`${BASE_URL}/${latestVersion.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#006633] text-white font-bold rounded-xl text-xs hover:bg-[#00552b] transition-all shadow-sm"
                      >
                        <ExternalLink size={14} /> Lihat Surat (Tab Baru)
                      </a>
                    )}
                    {sidebarDoc.status === 'REVISION' && (
                      <button
                        onClick={() => setIsRevisionModalOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition-all shadow-sm"
                      >
                        <FileUp size={14} /> Kirim Revisi
                      </button>
                    )}
                    {sidebarDoc.status === 'DRAFT' && (
                      <button
                        onClick={() => setIsApprovalModalOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 transition-all shadow-sm"
                      >
                        <Play size={14} /> Mulai Workflow
                      </button>
                    )}
                  </div>
                </div>

                {/* Workflow Stepper Timeline */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-[#006633]" /> Alur Persetujuan
                    </h4>
                    {sidebarDoc.workflowInstances && sidebarDoc.workflowInstances.length > 0 &&
                      !['COMPLETED', 'REJECTED'].includes(sidebarDoc.workflowInstances[sidebarDoc.workflowInstances.length - 1].status) && (
                        <button
                          onClick={() => setIsWorkflowEditModalOpen(true)}
                          className="text-[10px] font-bold text-red-600 hover:text-red-700 hover:underline"
                        >
                          Ubah Alur
                        </button>
                      )}
                  </div>

                  {sidebarDoc.workflowInstances && sidebarDoc.workflowInstances.length > 0 ? (
                    <div className="relative pl-5 space-y-5 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800/80">
                      {sidebarDoc.workflowInstances[sidebarDoc.workflowInstances.length - 1].steps
                        .sort((a: any, b: any) => a.stepNumber - b.stepNumber)
                        .map((step: any) => {
                          const isApproved = step.status === 'APPROVED';
                          const isPending = step.status === 'PENDING';
                          const isRejected = step.status === 'REJECTED';
                          return (
                            <div key={step.id} className="relative">
                              <div className={cn(
                                "absolute -left-[25px] top-0.5 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center z-10 shadow-sm transition-all",
                                isApproved ? "bg-emerald-500 text-white" :
                                  isPending ? "bg-amber-400 text-white animate-pulse" :
                                    isRejected ? "bg-red-500 text-white" :
                                      "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
                              )}>
                                {isApproved ? <CheckCircle2 size={12} /> :
                                  isPending ? <Clock size={12} /> :
                                    isRejected ? <X size={12} /> :
                                      <span className="text-[8px] font-bold">{step.stepNumber}</span>}
                              </div>
                              <div className="text-xs leading-relaxed">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-bold text-slate-800 dark:text-slate-200">{step.user?.fullName || "User"}</p>
                                  <span className={cn(
                                    "text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border",
                                    isApproved ? "text-emerald-600 bg-emerald-50/50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/10 dark:border-emerald-900/50" :
                                      isPending ? "text-amber-600 bg-amber-50/50 border-amber-100 dark:text-amber-400 dark:bg-amber-950/10 dark:border-amber-900/50" :
                                        isRejected ? "text-red-600 bg-red-50/50 border-red-100 dark:text-red-400 dark:bg-red-950/10 dark:border-red-900/50" :
                                          "text-slate-400 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700/60"
                                  )}>
                                    {step.status}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium">{step.user?.jobTitle || "Penandatangan"}</p>
                                {step.comment && (
                                  <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/50 text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
                                    <span className="text-[#D4AF37] font-serif font-black text-base mr-1 leading-none">&ldquo;</span>
                                    <span className="italic">{step.comment}</span>
                                    <span className="text-[#D4AF37] font-serif font-black text-base ml-1 leading-none">&rdquo;</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic py-2">Belum ada alur workflow yang disubmit.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'evidence' && (
              <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto h-full flex flex-col">
                <div className="mb-2 shrink-0">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Paperclip className="text-[#006633]" size={20} /> File Lampiran (Evidence)
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Upload dan kelola dokumen pendukung selama proses pembahasan surat berjalan.</p>
                </div>

                <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                  {/* Explorer Toolbar */}
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    {/* Breadcrumbs */}
                    <div className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                      <button onClick={() => handleBreadcrumbClick(-1)} className="p-1 hover:text-[#006633] transition-colors rounded shrink-0">
                        <Home size={16} />
                      </button>
                      {currentPath.map((folder, idx) => (
                        <React.Fragment key={folder.id}>
                          <ChevronRight size={16} className="text-slate-400 shrink-0 mx-1" />
                          <button 
                            onClick={() => handleBreadcrumbClick(idx)} 
                            className={cn("px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap", idx === currentPath.length - 1 ? "text-slate-900 dark:text-white font-bold" : "hover:text-[#006633]")}
                          >
                            {folder.name}
                          </button>
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <button onClick={handleCreateFolder} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-lg hover:bg-slate-100 transition-colors shadow-sm">
                        <FolderPlus size={14} /> <span>Folder Baru</span>
                      </button>
                      <label className="flex items-center gap-1.5 px-3 py-1.5 bg-[#006633] text-white font-bold text-xs rounded-lg hover:bg-[#00552b] transition-colors shadow-sm cursor-pointer">
                        <UploadCloud size={14} /> <span>Upload File</span>
                        <input type="file" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </div>
                  </div>

                  {/* Explorer Content (Finder / Explorer Style: Large icons, text title below) */}
                  <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 dark:bg-slate-900/10">
                    {isLoadingEvidence ? (
                      <div className="h-full flex items-center justify-center text-slate-400 py-12">
                        <Loader2 className="animate-spin text-[#006633] mr-2" size={24} />
                        <span>Memuat lampiran...</span>
                      </div>
                    ) : isUploading ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                        <Loader2 className="animate-spin text-[#006633] mb-3" size={32} />
                        <span className="text-sm font-bold">Sedang mengunggah dokumen...</span>
                      </div>
                    ) : folders.length === 0 && files.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                        <Folder size={48} className="mb-3 opacity-20" />
                        <p className="text-sm font-medium">Folder ini kosong</p>
                        <p className="text-xs mt-1">Buat folder atau upload file baru</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-6">
                        {/* Render Folders */}
                        {folders.map((folder) => (
                          <div 
                            key={folder.id}
                            onDoubleClick={() => handleNavigate(folder.id, folder.name)}
                            className="group flex flex-col items-center p-3 rounded-xl border border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all cursor-pointer relative"
                          >
                            <Folder className="text-amber-500 fill-amber-500/20 w-16 h-16 shrink-0" />
                            <p className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-300 text-center truncate w-full px-1">{folder.name}</p>
                            
                            {/* Action overlay / open button on mobile */}
                            <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }} 
                                className="p-1 bg-red-50 text-red-500 hover:bg-red-100 rounded-md shadow-sm"
                                title="Hapus Folder"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Render Files */}
                        {files.map((file) => (
                          <div 
                            key={file.id}
                            className="group flex flex-col items-center p-3 rounded-xl border border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-[#006633]/30 hover:shadow-md transition-all relative"
                          >
                            <FileText className="text-emerald-600 fill-emerald-600/10 w-16 h-16 shrink-0" />
                            <p className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-300 text-center truncate w-full px-1" title={file.name}>{file.name}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">{(file.fileSize / (1024 * 1024)).toFixed(2)} MB</p>
                            
                            {/* Action overlays */}
                            <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <a 
                                href={`${BASE_URL}/${file.fileUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-md shadow-sm flex items-center justify-center"
                                title="Lihat File"
                              >
                                <Eye size={12} />
                              </a>
                              <button 
                                onClick={() => handleDeleteFile(file.id)} 
                                className="p-1 bg-red-50 text-red-500 hover:bg-red-100 rounded-md shadow-sm flex items-center justify-center"
                                title="Hapus File"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'agenda' && (
              <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
                <div className="mb-6 flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Calendar className="text-[#006633]" size={20} /> Agenda Rapat Pembahasan
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Jadwalkan rapat baru atau hubungkan rapat yang sudah ada dengan surat masuk ini.</p>
                  </div>
                  {!isCreatingMeeting && (
                    <button 
                      onClick={() => setIsCreatingMeeting(true)}
                      className="px-4 py-2 bg-[#006633] text-white font-bold rounded-xl text-xs hover:bg-[#00552b] transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Plus size={14} /> Buat Agenda Baru
                    </button>
                  )}
                </div>

                {isCreatingMeeting ? (
                  <form onSubmit={handleCreateMeeting} className="bg-slate-50 dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in slide-in-from-top duration-300">
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">Buat Agenda Rapat Baru</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Nama Rapat / Agenda</label>
                        <input 
                          type="text"
                          required
                          value={meetingTitle}
                          onChange={(e) => setMeetingTitle(e.target.value)}
                          placeholder="e.g. Pembahasan Fatwa Produk Syariah"
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-[#006633]/20 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Lokasi</label>
                        <input 
                          type="text"
                          required
                          value={meetingLocation}
                          onChange={(e) => setMeetingLocation(e.target.value)}
                          placeholder="e.g. Ruang Rapat Lt. 3 / Zoom"
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-[#006633]/20 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Tanggal Rapat</label>
                        <input 
                          type="date"
                          required
                          value={meetingDate}
                          onChange={(e) => setMeetingDate(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-[#006633]/20 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Jam Mulai</label>
                        <input 
                          type="time"
                          required
                          value={meetingTime}
                          onChange={(e) => setMeetingTime(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-[#006633]/20 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Jam Selesai</label>
                        <input 
                          type="time"
                          required
                          value={meetingEndTime}
                          onChange={(e) => setMeetingEndTime(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-[#006633]/20 text-xs"
                        />
                      </div>
                      
                      {/* Search & Pick system users */}
                      <div className="md:col-span-2 relative">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Peserta Rapat (Cari & Tambah)</label>
                        <input 
                          type="text"
                          placeholder="Cari nama atau email pengguna..."
                          value={searchUserQuery}
                          onChange={(e) => setSearchUserQuery(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-[#006633]/20 text-xs"
                        />
                        {/* Search results dropdown */}
                        {filteredUsers.length > 0 && (
                          <div className="absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg">
                            {filteredUsers.map((user) => (
                              <div 
                                key={user.id}
                                onClick={() => handleAddAttendee(user)}
                                className="px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-xs flex justify-between items-center"
                              >
                                <div>
                                  <p className="font-bold text-slate-800 dark:text-slate-200">{user.fullName}</p>
                                  <p className="text-[10px] text-slate-400 font-medium">{user.jobTitle || "Anggota"}</p>
                                </div>
                                <Plus size={14} className="text-[#006633]" />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Selected Attendees list (badges) */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {selectedAttendees.map((user) => (
                            <div key={user.id} className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-[#006633] dark:text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                              <span>{user.fullName}</span>
                              <button type="button" onClick={() => handleRemoveAttendee(user.id)} className="text-emerald-600 hover:text-red-500">
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2.5 pt-2">
                      <button 
                        type="button" 
                        onClick={() => setIsCreatingMeeting(false)}
                        className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        Batal
                      </button>
                      <button 
                        type="submit" 
                        className="px-4 py-2 bg-[#006633] text-white font-bold rounded-xl text-xs hover:bg-[#00552b] transition-colors"
                      >
                        Simpan Agenda
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Linked Meetings */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                        Rapat Terkait Surat Ini
                      </h4>
                      {linkedMeetings.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-4 text-center">Belum ada agenda rapat yang dikaitkan.</p>
                      ) : (
                        <div className="space-y-3">
                          {linkedMeetings.map((m) => (
                            <div key={m.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-emerald-50/10 dark:bg-emerald-950/5 border-emerald-100 dark:border-emerald-900/40 flex justify-between items-center gap-3">
                              <div>
                                <h5 className="font-bold text-slate-900 dark:text-white text-xs">{m.title}</h5>
                                {m.agendaNumber && (
                                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">No. Agenda: {m.agendaNumber}</p>
                                )}
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] text-slate-500 font-medium">
                                  <span className="flex items-center gap-1">
                                    <Clock size={12} /> 
                                    {new Date(m.dateTime).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})} · {new Date(m.dateTime).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}
                                    {m.endDateTime && ' - ' + new Date(m.endDateTime).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})} WIB
                                  </span>
                                  <span>📍 {m.location}</span>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleUnlinkMeeting(m.id)}
                                className="p-2 bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 rounded-md shadow-sm flex items-center justify-center shrink-0"
                                title="Hapus Kaitan Rapat"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Link Existing Meetings / Calendar selector */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                        Hubungkan Ke Agenda Rapat Lain
                      </h4>
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Pilih Tanggal Rapat</label>
                        <input 
                          type="date" 
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs text-slate-700 dark:text-slate-300 font-bold" 
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                        />
                        
                        {selectedDate && (
                          <div className="space-y-2.5 mt-4">
                            <label className="text-[10px] font-bold text-[#006633] uppercase tracking-wider block">
                              Agenda Tersedia Pada {new Date(selectedDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})} :
                            </label>
                            {availableMeetings.length === 0 ? (
                              <p className="text-xs text-slate-400 italic py-2 text-center">Tidak ada agenda lain di tanggal ini.</p>
                            ) : (
                              availableMeetings.map((m) => (
                                <div key={m.id} className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all bg-white dark:bg-slate-900 flex justify-between items-center gap-3">
                                  <div className="min-w-0">
                                    <h5 className="font-bold text-slate-900 dark:text-white text-xs truncate">{m.title}</h5>
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                      {new Date(m.dateTime).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}
                                      {m.endDateTime && ' - ' + new Date(m.endDateTime).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})} WIB
                                    </p>
                                  </div>
                                  <button 
                                    onClick={() => handleLinkMeeting(m.id)}
                                    className="px-2.5 py-1.5 bg-[#006633]/10 hover:bg-[#006633] text-[#006633] hover:text-white text-[10px] font-bold rounded-lg transition-all"
                                  >
                                    Hubungkan
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const DocumentsPage = () => {
  const router = useRouter();
  const [documents, setDocuments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [classifications, setClassifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [customStatusFilter, setCustomStatusFilter] = useState("");

  // Right Sidebar States
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [sidebarDoc, setSidebarDoc] = useState<any>(null);
  const [sidebarTab, setSidebarTab] = useState<'detail' | 'evidence' | 'agenda'>('detail');
  const [sidebarIsCreatingMeeting, setSidebarIsCreatingMeeting] = useState(false);
  const [fetchingSidebar, setFetchingSidebar] = useState(false);
  const [readerDoc, setReaderDoc] = useState<{ title: string, fileUrl: string } | null>(null);

  // Sidebar Modals
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isWorkflowEditModalOpen, setIsWorkflowEditModalOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);

  // Pagination & Header Column Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [colFilters, setColFilters] = useState({
    title: "",
    classification: "",
    status: "",
    creator: "",
    agenda: "",
  });

  const fetchSidebarDetail = async (id: string) => {
    try {
      setFetchingSidebar(true);
      const res = await api.get(`/documents/${id}`);
      setSidebarDoc(res.data.data);
    } catch (err) {
      console.error("Gagal memuat detail sidebar", err);
    } finally {
      setFetchingSidebar(false);
    }
  };

  useEffect(() => {
    if (selectedDocId) {
      fetchSidebarDetail(selectedDocId);
    } else {
      setSidebarDoc(null);
    }
  }, [selectedDocId]);

  const handleViewDocument = (doc: any) => {
    router.push(`/surat-masuk/${doc.id}`);
  };

  const handleAddAgendaFromTable = (doc: any) => {
    router.push(`/surat-masuk/${doc.id}?tab=agenda&create=true`);
  };

  const handleAddEvidenceFromTable = (doc: any) => {
    router.push(`/surat-masuk/${doc.id}?tab=evidence`);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [docsRes, metaRes] = await Promise.all([
        api.get("/documents", {
          params: { search, status: statusFilter, categoryId: categoryFilter, classificationId: classFilter, documentType: "INCOMING" },
        }),
        api.get("/documents/meta"),
      ]);
      setDocuments(docsRes.data.data);
      setCategories(metaRes.data.data.categories);
      setClassifications(metaRes.data.data.classifications);
    } catch {
      setError("Gagal memuat dokumen");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [statusFilter, categoryFilter, classFilter]);

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchData(); };
  const resetFilters = () => {
    setStatusFilter("");
    setCategoryFilter("");
    setClassFilter("");
    setStartDateFilter("");
    setEndDateFilter("");
    setCustomStatusFilter("");
  };

  const handleCloseDiscussion = async (id: string) => {
    if (!confirm("Tutup pembahasan untuk surat masuk ini? Status akan diubah menjadi 'Selesai'.")) return;
    try {
      setActionLoading(true);
      await api.put(`/documents/${id}`, { status: 'COMPLETED' });
      fetchData();
      if (selectedDocId === id) {
        fetchSidebarDetail(id);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menutup pembahasan");
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Arsip dokumen ini?")) return;
    try {
      setActionLoading(true);
      await api.patch(`/documents/${id}/archive`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal mengarsipkan dokumen");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setActionLoading(true);
      await api.delete(`/documents/${id}`);
      fetchData();
      setIsDeleteConfirmOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menghapus dokumen");
    } finally {
      setActionLoading(false);
    }
  };

  const FilterPanel = () => (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Status</label>
        <div className="relative">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm appearance-none outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">Semua Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="SIGNED">Signed</option>
            <option value="REJECTED">Rejected</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
        <div className="relative">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm appearance-none outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">Semua Kategori</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Klasifikasi</label>
        <div className="relative">
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
            className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm appearance-none outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">Semua Klasifikasi</option>
            {classifications.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>
      <button onClick={resetFilters} className="w-full py-3 text-xs font-bold text-slate-400 hover:text-primary transition-colors border-t border-slate-100 dark:border-slate-800 pt-4">
        Reset Semua Filter
      </button>
    </div>
  );

    const formatDateForInput = (dateStr: any) => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const EditDocumentModal = ({ doc }: { doc: any }) => {
      const [title, setTitle] = useState(doc?.title || "");
      const [catId, setCatId] = useState(doc?.categoryId || "");
      const [clsId, setClsId] = useState(doc?.classificationId || "");
      const [docNum, setDocNum] = useState(doc?.documentNumber || "");
      const [documentDate, setDocumentDate] = useState(formatDateForInput(doc?.documentDate));
      const [receivedDate, setReceivedDate] = useState(formatDateForInput(doc?.receivedDate));
      const [file, setFile] = useState<File | null>(null);

      useEffect(() => {
        // No need to fetch users or check workflow since Surat Masuk has no signatures
      }, [doc]);


    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        setActionLoading(true);
        const formData = new FormData();
        formData.append("title", title);
        formData.append("categoryId", catId);
        formData.append("classificationId", clsId);
        formData.append("documentNumber", docNum);
        formData.append("status", "SIGNED");
        formData.append("documentDate", documentDate);
        formData.append("receivedDate", receivedDate);
        
        if (file) formData.append("file", file);

        await api.put(`/documents/${doc.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });

        fetchData();
        setIsEditModalOpen(false);
      } catch (err: any) {
        alert(err.response?.data?.message || "Gagal memperbarui dokumen");
      } finally {
        setActionLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
        <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
          <div className="p-8 flex flex-col h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Pencil size={20} />
                </div>
                Edit Dokumen
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Judul Dokumen</label>
                <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none ring-2 ring-transparent focus:ring-primary/20 transition-all font-medium text-slate-800 dark:text-white" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Nomor Dokumen (Opsional)</label>
                <input type="text" value={docNum} onChange={(e) => setDocNum(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none ring-2 ring-transparent focus:ring-primary/20 transition-all font-medium text-slate-800 dark:text-white" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Kategori</label>
                  <select value={catId} onChange={(e) => setCatId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none ring-2 ring-transparent focus:ring-primary/20 transition-all font-medium text-slate-800 dark:text-white">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Klasifikasi</label>
                  <select value={clsId} onChange={(e) => setClsId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none ring-2 ring-transparent focus:ring-primary/20 transition-all font-medium text-slate-800 dark:text-white">
                    {classifications.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Tanggal Dokumen & Tanggal Diterima Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Tanggal Dokumen</label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none ring-2 ring-transparent focus:ring-primary/20 transition-all font-medium text-slate-800 dark:text-white"
                    value={documentDate}
                    onChange={(e) => setDocumentDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Tanggal Diterima</label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none ring-2 ring-transparent focus:ring-primary/20 transition-all font-medium text-slate-800 dark:text-white"
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Ganti File (Opsional)</label>
                <div className="relative group">
                  <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-2 group-hover:border-primary/50 group-hover:bg-primary/5 transition-all">
                    <FileUp size={24} className="text-slate-400 group-hover:text-primary transition-colors" />
                    <span className="text-xs font-bold text-slate-500 group-hover:text-primary truncate max-w-[200px]">
                      {file ? file.name : "Klik atau seret file baru ke sini"}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 italic font-medium ml-1">File yang diunggah akan tersimpan sebagai Versi Baru tanpa menghapus versi sebelumnya.</p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 transition-all text-xs">
                  Batal
                </button>
                <button type="submit" disabled={actionLoading}
                  className="flex-1 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 transition-all text-xs flex items-center justify-center gap-2">
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const DocumentFlowModal = ({ doc }: { doc: any }) => {
    const workflow = doc?.workflowInstances?.[0]; // Show active/latest
    const steps = workflow?.steps || [];

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsFlowModalOpen(false)} />
        <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-5 duration-200">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600">
                  <Activity size={20} />
                </div>
                Alur Persetujuan
              </h3>
              <button onClick={() => setIsFlowModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {!workflow ? (
                <div className="py-12 text-center space-y-3">
                  <Clock size={40} className="mx-auto text-slate-200" />
                  <p className="text-sm font-bold text-slate-400">Dokumen dalam tahap draft, belum ada alur persetujuan.</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800" />
                  <div className="space-y-8">
                    {steps.map((step: any, idx: number) => (
                      <div key={idx} className="relative flex items-start gap-5">
                        <div className={cn(
                          "w-10 h-10 rounded-xl border-4 border-white dark:border-slate-900 z-10 flex items-center justify-center shadow-sm shrink-0",
                          step.status === 'APPROVED' ? "bg-emerald-500 text-white" :
                            step.status === 'REJECTED' ? "bg-red-500 text-white" :
                              step.status === 'PENDING' ? "bg-amber-500 text-white animate-pulse" : "bg-slate-100 text-slate-400"
                        )}>
                          {step.status === 'APPROVED' ? <CheckCircle2 size={16} /> :
                            step.status === 'REJECTED' ? <X size={16} /> :
                              step.status === 'PENDING' ? <Clock size={16} /> : <span className="text-[10px] font-bold">{step.stepNumber}</span>}
                        </div>
                        <div className="flex-1 pt-0.5 pb-2 border-b border-slate-50 dark:border-slate-800/50">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{step.user?.fullName || "User"}</p>
                            <span className={cn(
                              "text-[9px] font-bold px-2 py-0.5 rounded-full border",
                              step.status === 'APPROVED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                step.status === 'REJECTED' ? "bg-red-50 text-red-600 border-red-100" :
                                  step.status === 'PENDING' && step.actionedAt ? "bg-blue-50 text-blue-600 border-blue-100" :
                                    step.status === 'PENDING' ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-slate-50 text-slate-400 border-slate-200"
                            )}>
                              {step.status === 'PENDING' && step.actionedAt ? 'PENDING - REVISI MASUK' : step.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">{step.user?.jobTitle || "Approval Step"}</p>
                          {step.comment && (
                            <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">"{step.comment}"</p>
                              {step.status === 'PENDING' && step.actionedAt && (
                                <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/50 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                  <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400">Telah direvisi oleh Admin. Silakan periksa kembali.</p>
                                </div>
                              )}
                            </div>
                          )}
                          {step.actionedAt && (
                            <p className="text-[9px] text-slate-400 mt-2 font-mono">{new Date(step.actionedAt).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => setIsFlowModalOpen(false)}
              className="mt-10 w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm">
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  };

  const DeleteConfirmationModal = ({ doc }: { doc: any }) => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsDeleteConfirmOpen(false)} />
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-8 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-500/10 rounded-3xl flex items-center justify-center text-red-600 dark:text-red-500 mx-auto mb-6">
          <Trash2 size={40} />
        </div>
        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Hapus Permanen?</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
          Dokumen <span className="font-bold text-slate-900 dark:text-white">"{doc?.title}"</span> dan seluruh filenya akan dihapus selamanya dari sistem. Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setIsDeleteConfirmOpen(false)}
            className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm">
            Batal
          </button>
          <button onClick={() => handleDelete(doc.id)} disabled={actionLoading}
            className="flex-1 py-3.5 bg-red-500 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all text-sm flex items-center justify-center gap-2">
            {actionLoading ? <Loader2 size={18} className="animate-spin" /> : "Ya, Hapus"}
          </button>
        </div>
      </div>
    </div>
  );

  const getComputedStatus = (doc: any) => {
    if (doc.status === 'COMPLETED') {
      return 'Selesai';
    }

    const hasMeetings = doc.meetings && doc.meetings.length > 0;
    const hasEvidence = doc.evidenceFiles && doc.evidenceFiles.length > 0;

    if (hasMeetings && hasEvidence) {
      return 'Dalam Proses Pembahasan';
    }

    const receivedDate = doc.receivedDate ? new Date(doc.receivedDate) : new Date(doc.createdAt);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    if (receivedDate < oneMonthAgo) {
      return 'Mohon Perhatian';
    }

    return 'Belum ada Respon';
  };

  // Client-side filtering logic
  const filteredDocuments = documents.filter((doc) => {
    // 1. Title & Number keyword filter
    if (colFilters.title) {
      const query = colFilters.title.toLowerCase();
      const titleMatch = doc.title?.toLowerCase().includes(query);
      const numberMatch = doc.documentNumber?.toLowerCase().includes(query);
      const categoryMatch = doc.category?.name?.toLowerCase().includes(query);
      if (!titleMatch && !numberMatch && !categoryMatch) return false;
    }
    // 2. Classification filter
    if (colFilters.classification) {
      const query = colFilters.classification.toLowerCase();
      const classMatch = doc.classification?.name?.toLowerCase().includes(query);
      if (!classMatch) return false;
    }
    // 3. Status select filter
    if (colFilters.status) {
      if (doc.status !== colFilters.status) return false;
    }
    // 4. Creator filter
    if (colFilters.creator) {
      const query = colFilters.creator.toLowerCase();
      const creatorMatch = doc.creator?.fullName?.toLowerCase().includes(query);
      if (!creatorMatch) return false;
    }
    // 5. Agenda filter
    if (colFilters.agenda) {
      const query = colFilters.agenda.toLowerCase();
      const nearestMeeting = getNearestMeeting(doc.meetings);
      if (!nearestMeeting) return false;
      const titleMatch = nearestMeeting.title?.toLowerCase().includes(query);
      const locationMatch = nearestMeeting.location?.toLowerCase().includes(query);
      if (!titleMatch && !locationMatch) return false;
    }
    // 6. Custom Status filter
    if (customStatusFilter) {
      if (getComputedStatus(doc) !== customStatusFilter) return false;
    }
    // 7. Date Range filter
    if (startDateFilter) {
      const docDate = doc.receivedDate ? new Date(doc.receivedDate) : new Date(doc.createdAt);
      docDate.setHours(0,0,0,0);
      const startDate = new Date(startDateFilter);
      startDate.setHours(0,0,0,0);
      if (docDate < startDate) return false;
    }
    if (endDateFilter) {
      const docDate = doc.receivedDate ? new Date(doc.receivedDate) : new Date(doc.createdAt);
      docDate.setHours(0,0,0,0);
      const endDate = new Date(endDateFilter);
      endDate.setHours(23,59,59,999);
      if (docDate > endDate) return false;
    }
    return true;
  });

  // Client-side pagination logic
  const totalItems = filteredDocuments.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

  // Reset page when search/filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [colFilters, statusFilter, categoryFilter, classFilter, search, startDateFilter, endDateFilter, customStatusFilter]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-1 sm:mb-2 leading-tight flex items-center gap-3">
            <FileBadge size={28} className="text-primary flex-shrink-0" />
            <span>Surat Masuk (Sertifikat)</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Manajemen surat pengajuan dan penerbitan sertifikat syariah secara terintegrasi.</p>
        </div>
        <Can perform="DOC_UPLOAD">
          <Link href="/surat-masuk/new" className="flex items-center gap-2 px-5 py-3 bg-[#006633] hover:bg-[#00552b] text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm w-full sm:w-auto justify-center">
            <Plus size={18} />
            <span>Input Surat Masuk</span>
          </Link>
        </Can>
      </div>

      {/* Search + Filter Button */}
      <div className="flex gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
          <input type="text" placeholder="Cari judul atau nomor dokumen..."
            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-primary/50 transition-all text-sm shadow-sm"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </form>
        {/* Filter button — always visible, opens modal */}
        <button onClick={() => setFilterOpen(true)}
          className={`flex items-center gap-2 px-4 py-3 border rounded-2xl font-bold shadow-sm transition-all flex-shrink-0 text-sm
            ${(statusFilter || categoryFilter || classFilter)
              ? 'bg-primary text-white border-primary hover:bg-primary/90'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}>
          <Filter size={18} />
          <span>Filter{(statusFilter || categoryFilter || classFilter) ? ' ●' : ''}</span>
        </button>
      </div>

      {/* Date Range and Status Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Tanggal Awal</label>
          <input
            type="date"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-slate-800 dark:text-white"
            value={startDateFilter}
            onChange={(e) => setStartDateFilter(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Tanggal Akhir</label>
          <input
            type="date"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-slate-800 dark:text-white"
            value={endDateFilter}
            onChange={(e) => setEndDateFilter(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Status Pembahasan</label>
          <div className="relative">
            <select
              value={customStatusFilter}
              onChange={(e) => setCustomStatusFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none appearance-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-slate-800 dark:text-white font-medium animate-none"
            >
              <option value="">Semua Status</option>
              <option value="Belum ada Respon">Belum ada Respon</option>
              <option value="Dalam Proses Pembahasan">Dalam Proses Pembahasan</option>
              <option value="Mohon Perhatian">Mohon Perhatian</option>
              <option value="Selesai">Selesai</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Filter Modal — centered, all screen sizes */}
      {filterOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setFilterOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[28px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-base">
                <Filter size={18} className="text-primary" /> Filter Dokumen
              </h3>
              <button onClick={() => setFilterOpen(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <FilterPanel />
            </div>
            <div className="px-6 pb-6">
              <button
                onClick={() => { resetFilters(); setFilterOpen(false); }}
                className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                Reset &amp; Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full">
        {/* Document List — full width */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm relative z-10 w-full overflow-hidden">
          {loading ? (
            <div className="py-24 sm:py-32 flex flex-col items-center justify-center gap-4 text-slate-400">
              <Loader2 className="animate-spin text-primary" size={40} />
              <p className="font-medium animate-pulse">Memuat dokumen...</p>
            </div>
          ) : error ? (
            <div className="py-24 sm:py-32 flex flex-col items-center justify-center gap-4 text-red-500">
              <AlertCircle size={40} />
              <p className="font-bold">{error}</p>
              <button onClick={fetchData} className="text-sm font-bold underline">Coba Lagi</button>
            </div>
          ) : (
            <>
              {/* Desktop Table - ERP SAP B1 Style */}
              <div className="hidden md:block relative overflow-x-auto w-full">
                <table className="w-full min-w-[900px] text-xs border-collapse">
                  <thead className="bg-[#006633]/8 text-[#006633] dark:bg-[#006633]/15 dark:text-emerald-400">
                    <tr className="border-b border-slate-300 dark:border-slate-700">
                      <th className="text-center py-2.5 px-3 font-extrabold w-12">No.</th>
                      <th className="text-left py-2.5 px-3 font-extrabold border-l border-slate-300 dark:border-slate-700 w-[25%]">Judul & Metadata</th>
                      <th className="text-left py-2.5 px-3 font-extrabold border-l border-slate-300 dark:border-slate-700">Klasifikasi & Versi</th>
                      <th className="text-left py-2.5 px-3 font-extrabold border-l border-slate-300 dark:border-slate-700 w-[15%]">Status Pembahasan</th>
                      <th className="text-left py-2.5 px-3 font-extrabold border-l border-slate-300 dark:border-slate-700 w-[18%]">Agenda Rapat Terdekat</th>
                      <th className="text-left py-2.5 px-3 font-extrabold border-l border-slate-300 dark:border-slate-700">Pembuat & Tanggal</th>
                      <th className="text-center py-2.5 px-3 font-extrabold border-l border-slate-300 dark:border-slate-700 w-[140px]">Aksi</th>
                    </tr>
                    {/* Column Header Filters */}
                    <tr className="bg-slate-100/80 dark:bg-slate-800/40 border-b border-slate-300 dark:border-slate-700">
                      <th className="py-1.5 px-2"></th>
                      <th className="py-1.5 px-2 border-l border-slate-300 dark:border-slate-700">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Cari judul/nomor..."
                            value={colFilters.title}
                            onChange={(e) => setColFilters(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full px-2 py-1 text-[11px] font-normal bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded outline-none focus:border-[#006633] focus:ring-1 focus:ring-[#006633]/20"
                          />
                          {colFilters.title && (
                            <button onClick={() => setColFilters(prev => ({ ...prev, title: "" }))} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-440 hover:text-slate-660">
                              <X size={10} />
                            </button>
                          )}
                        </div>
                      </th>
                      <th className="py-1.5 px-2 border-l border-slate-300 dark:border-slate-700">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Cari klasifikasi..."
                            value={colFilters.classification}
                            onChange={(e) => setColFilters(prev => ({ ...prev, classification: e.target.value }))}
                            className="w-full px-2 py-1 text-[11px] font-normal bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded outline-none focus:border-[#006633] focus:ring-1 focus:ring-[#006633]/20"
                          />
                          {colFilters.classification && (
                            <button onClick={() => setColFilters(prev => ({ ...prev, classification: "" }))} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-440 hover:text-slate-660">
                              <X size={10} />
                            </button>
                          )}
                        </div>
                      </th>
                      <th className="py-1.5 px-2 border-l border-slate-300 dark:border-slate-700">
                        <div className="h-6"></div>
                      </th>
                      <th className="py-1.5 px-2 border-l border-slate-300 dark:border-slate-700">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Cari agenda..."
                            value={colFilters.agenda}
                            onChange={(e) => setColFilters(prev => ({ ...prev, agenda: e.target.value }))}
                            className="w-full px-2 py-1 text-[11px] font-normal bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded outline-none focus:border-[#006633] focus:ring-1 focus:ring-[#006633]/20"
                          />
                          {colFilters.agenda && (
                            <button onClick={() => setColFilters(prev => ({ ...prev, agenda: "" }))} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-440 hover:text-slate-660">
                              <X size={10} />
                            </button>
                          )}
                        </div>
                      </th>

                      <th className="py-1.5 px-2 border-l border-slate-300 dark:border-slate-700">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Cari pembuat..."
                            value={colFilters.creator}
                            onChange={(e) => setColFilters(prev => ({ ...prev, creator: e.target.value }))}
                            className="w-full px-2 py-1 text-[11px] font-normal bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded outline-none focus:border-[#006633] focus:ring-1 focus:ring-[#006633]/20"
                          />
                          {colFilters.creator && (
                            <button onClick={() => setColFilters(prev => ({ ...prev, creator: "" }))} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-440 hover:text-slate-660">
                              <X size={10} />
                            </button>
                          )}
                        </div>
                      </th>
                      <th className="py-1.5 px-2 border-l border-slate-300 dark:border-slate-700 text-center">
                        {(colFilters.title || colFilters.classification || colFilters.status || colFilters.creator || colFilters.agenda) && (
                          <button
                            onClick={() => setColFilters({ title: "", classification: "", status: "", creator: "", agenda: "" })}
                            className="text-[10px] text-red-650 hover:text-red-850 font-bold transition-colors w-full flex items-center justify-center gap-0.5"
                          >
                            <X size={10} /> Clear
                          </button>
                        )}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {paginatedDocuments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 font-medium bg-white dark:bg-slate-900">
                          Tidak ada dokumen yang cocok dengan filter kolom.
                        </td>
                      </tr>
                    ) : (
                      paginatedDocuments.map((doc, index) => {
                        const wf = doc.workflowInstances?.[0];
                        const steps = wf?.steps ? [...wf.steps].sort((a: any, b: any) => a.stepNumber - b.stepNumber) : [];
                        const totalSteps = steps.length;
                        const doneSteps = steps.filter((s: any) => s.status === 'APPROVED').length;
                        const currentVersion = doc.versions?.[doc.versions.length - 1]?.versionNum ?? doc.currentVersion ?? 1;
                        const rowNumber = (currentPage - 1) * pageSize + index + 1;

                        return (
                          <tr key={doc.id} className="hover:bg-amber-50/60 even:bg-slate-50/50 dark:hover:bg-slate-800/40 dark:even:bg-slate-800/20 transition-colors group">
                            {/* ── No. ── */}
                            <td className="py-2.5 px-3 border-b border-slate-200 dark:border-slate-800 align-top text-center font-mono font-bold text-slate-400 dark:text-slate-500">
                              {rowNumber}
                            </td>

                            {/* ── Judul & Metadata ── */}
                            <td className="py-2.5 px-3 border-b border-l border-slate-200 dark:border-slate-800 align-top">
                              <div className="flex flex-col gap-1">
                                <button onClick={() => handleViewDocument(doc)} className="font-bold text-[#006633] hover:underline transition-colors text-[13px] line-clamp-2 leading-snug text-left">
                                  {doc.title}
                                </button>
                                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                  <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{doc.documentNumber || "No Nomor"}</span>
                                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{doc.category?.name ?? "—"}</span>
                                </div>
                                {doc.status === 'REVISION' && wf?.steps?.find((s: any) => s.status === 'REVISION') && (
                                  <div className="mt-1 px-2 py-1.5 bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                                    <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                                      <AlertCircle size={12} /> Revisi: {wf.steps.findLast((s: any) => s.status === 'REVISION')?.user?.fullName}
                                    </p>
                                  </div>
                                )}
                                {doc.status === 'REJECTED' && (
                                  <div className="mt-1 px-2 py-1.5 bg-red-50/80 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                                    <p className="text-[10px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                                      <X size={12} /> Ditolak: {wf?.steps?.findLast((s: any) => s.status === 'REJECTED')?.user?.fullName || "Approver"}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* ── Klasifikasi & Versi ── */}
                            <td className="py-2.5 px-3 border-b border-l border-slate-200 dark:border-slate-800 align-top">
                              <div className="flex flex-col gap-1.5">
                                {doc.classification?.name ? (
                                  <span className="inline-flex items-center text-[10px] font-bold text-violet-700 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 px-1.5 py-0.5 rounded w-fit">
                                    {doc.classification.name}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">—</span>
                                )}
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 w-fit">
                                  v{currentVersion}
                                  {currentVersion > 1 && <span className="text-[#006633] font-black">↑</span>}
                                </span>
                              </div>
                            </td>

                            {/* ── Status Pembahasan ── */}
                            <td className="py-2.5 px-3 border-b border-l border-slate-200 dark:border-slate-800 align-top">
                              {(() => {
                                const computedStatus = getComputedStatus(doc);
                                let badgeClass = "";
                                if (computedStatus === 'Selesai') {
                                  badgeClass = "bg-emerald-50 text-[#006633] border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-450 dark:border-emerald-900/50";
                                } else if (computedStatus === 'Dalam Proses Pembahasan') {
                                  badgeClass = "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50";
                                } else if (computedStatus === 'Mohon Perhatian') {
                                  badgeClass = "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/30 dark:text-rose-450 dark:border-rose-900/50 animate-pulse";
                                } else {
                                  badgeClass = "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
                                }
                                return (
                                  <span className={cn("inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap", badgeClass)}>
                                    {computedStatus}
                                  </span>
                                );
                              })()}
                            </td>

                            {/* ── Agenda Rapat Terdekat ── */}
                            <td className="py-2.5 px-3 border-b border-l border-slate-200 dark:border-slate-800 align-top">
                              {(() => {
                                const meeting = getNearestMeeting(doc.meetings);
                                if (!meeting) {
                                  return <span className="text-[10px] text-slate-400 italic font-medium">—</span>;
                                }

                                const isUpcoming = new Date(meeting.dateTime) >= new Date();
                                const mDate = new Date(meeting.dateTime);
                                const dateStr = mDate.toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                });
                                const timeStr = mDate.toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }) + " WIB";

                                return (
                                  <div className="flex flex-col gap-1 max-w-[200px]">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] truncate block max-w-[150px]" title={meeting.title}>
                                        {meeting.title}
                                      </span>
                                      <span className={cn(
                                        "text-[8px] font-extrabold px-1 rounded uppercase tracking-wider shrink-0",
                                        isUpcoming 
                                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50" 
                                          : "bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                      )}>
                                        {isUpcoming ? "Mendatang" : "Selesai"}
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400">
                                      <Clock size={10} className="shrink-0 text-slate-400" />
                                      <span>{dateStr} · {timeStr}</span>
                                    </div>
                                    
                                    {meeting.location && (
                                      <div className="flex items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400 truncate">
                                        <MapPin size={10} className="shrink-0 text-slate-400" />
                                        <span className="truncate" title={meeting.location}>{meeting.location}</span>
                                      </div>
                                    )}
                                    
                                    {doc.meetings && doc.meetings.length > 1 && (
                                      <span className="text-[8px] text-[#006633] dark:text-emerald-400 font-semibold mt-0.5">
                                        +{doc.meetings.length - 1} rapat lainnya
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>



                            {/* ── Pembuat & Tanggal ── */}
                            <td className="py-2.5 px-3 border-b border-l border-slate-200 dark:border-slate-800 align-top">
                              <div className="flex flex-col gap-0.5">
                                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">{doc.creator?.fullName}</p>
                                {doc.creator?.jobTitle && (
                                  <p className="text-[9px] text-slate-500 truncate max-w-[130px]">{doc.creator.jobTitle}</p>
                                )}
                                <p className="text-[9px] text-slate-500 mt-1">📅 {new Date(doc.createdAt).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                            </td>

                            {/* ── Aksi ── */}
                            <td className="py-2.5 px-3 border-b border-l border-slate-200 dark:border-slate-800 align-top text-center">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-[110px] mx-auto">
                                <button onClick={() => handleViewDocument(doc)} className="p-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors" title="Lihat Detail">
                                  <Eye size={14} />
                                </button>
                                <button className="p-1.5 rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-405 dark:hover:bg-indigo-900/30 transition-colors" title="Unduh">
                                  <Download size={14} />
                                </button>
                                <Can perform="DOC_EDIT">
                                  <button onClick={() => { setSelectedDoc(doc); setIsEditModalOpen(true); }} className="p-1.5 rounded-lg text-[#006633] bg-[#006633]/10 hover:bg-[#006633]/20 dark:bg-[#006633]/20 dark:hover:bg-[#006633]/30 transition-colors" title={doc.status === 'REVISION' ? "Upload Revisi Baru" : "Edit Dokumen"}>
                                    {doc.status === 'REVISION' ? <FileUp size={14} /> : <Pencil size={14} />}
                                  </button>
                                </Can>
                                {getComputedStatus(doc) !== 'Selesai' && (
                                  <button onClick={() => handleCloseDiscussion(doc.id)} className="p-1.5 rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30 transition-colors" title="Tutup Pembahasan">
                                    <Check size={14} />
                                  </button>
                                )}
                                <button onClick={() => handleAddAgendaFromTable(doc)} className="p-1.5 rounded-lg text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:hover:bg-amber-900/30 transition-colors" title="Tambah Agenda Rapat">
                                  <Calendar size={14} />
                                </button>
                                <button onClick={() => handleAddEvidenceFromTable(doc)} className="p-1.5 rounded-lg text-teal-600 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/20 dark:text-teal-400 dark:hover:bg-teal-900/30 transition-colors" title="Tambah File / Evidence">
                                  <Paperclip size={14} />
                                </button>
                                <button onClick={() => { handleArchive(doc.id); }} className="p-1.5 rounded-lg text-slate-650 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors" title="Arsipkan">
                                  <Archive size={14} />
                                </button>
                                <Can perform="DOC_DELETE">
                                  <button onClick={() => { setSelectedDoc(doc); setIsDeleteConfirmOpen(true); }} className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-450 dark:hover:bg-rose-900/30 transition-colors" title="Hapus Permanen">
                                    <Trash2 size={14} />
                                  </button>
                                </Can>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div className="md:hidden border-t border-slate-200 dark:border-slate-800">
                {paginatedDocuments.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 font-medium bg-white dark:bg-slate-900">
                    Tidak ada dokumen yang cocok dengan filter kolom.
                  </div>
                ) : (
                  paginatedDocuments.map((doc) => (
                    <div key={doc.id} className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <button onClick={() => handleViewDocument(doc)} className="font-bold text-[#006633] text-sm leading-tight line-clamp-2 hover:underline transition-colors text-left">
                          {doc.title}
                        </button>
                        <div className="flex items-center gap-2 shrink-0">
                          {(() => {
                            const computedStatus = getComputedStatus(doc);
                            let badgeClass = "";
                            if (computedStatus === 'Selesai') {
                              badgeClass = "bg-emerald-50 text-[#006633] border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50";
                            } else if (computedStatus === 'Dalam Proses Pembahasan') {
                              badgeClass = "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50";
                            } else if (computedStatus === 'Mohon Perhatian') {
                              badgeClass = "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/30 dark:text-rose-450 dark:border-rose-900/50 animate-pulse";
                            } else {
                              badgeClass = "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
                            }
                            return (
                              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap", badgeClass)}>
                                {computedStatus}
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 mb-2 mt-2">
                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{doc.documentNumber || "No Number"}</span>
                        <span>{doc.creator.fullName} · {new Date(doc.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>

                      {/* Agenda Rapat Terdekat (Mobile View) */}
                      {(() => {
                        const meeting = getNearestMeeting(doc.meetings);
                        if (!meeting) return null;
                        const isUpcoming = new Date(meeting.dateTime) >= new Date();
                        const mDate = new Date(meeting.dateTime);
                        const dateStr = mDate.toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        });
                        const timeStr = mDate.toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }) + " WIB";
                        
                        return (
                          <div className="mt-2.5 mb-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-500 uppercase text-[9px] tracking-wider">Agenda Rapat Terdekat</span>
                              <span className={cn(
                                "text-[8px] font-extrabold px-1 rounded uppercase tracking-wider",
                                isUpcoming 
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50" 
                                  : "bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                              )}>
                                {isUpcoming ? "Mendatang" : "Selesai"}
                              </span>
                            </div>
                            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <Calendar size={12} className="text-[#006633] shrink-0 animate-pulse" />
                              <span className="truncate">{meeting.title}</span>
                            </div>
                            <div className="flex flex-wrap gap-x-3 text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock size={11} className="shrink-0" />
                                {dateStr} · {timeStr}
                              </span>
                              {meeting.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin size={11} className="shrink-0" />
                                  <span className="truncate max-w-[120px]">{meeting.location}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {doc.status === 'REVISION' && doc.workflowInstances?.[0]?.steps?.find((s: any) => s.status === 'REVISION') && (
                        <div className="mb-3 p-3 bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <p className="text-[11px] font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5 mb-1">
                            <AlertCircle size={14} /> Revisi: {doc.workflowInstances[0].steps.findLast((s: any) => s.status === 'REVISION')?.user?.fullName}
                          </p>
                          <p className="text-[10px] text-blue-700 dark:text-blue-400 italic leading-snug pl-5">
                            &ldquo;{doc.workflowInstances[0].steps.findLast((s: any) => s.status === 'REVISION')?.comment || "Revisi diperlukan."}&rdquo;
                          </p>
                        </div>
                      )}

                      {doc.status === 'REJECTED' && (
                        <div className="mb-3 p-3 bg-red-50/80 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <p className="text-[11px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5 mb-1">
                            <X size={14} /> Ditolak oleh: {doc.workflowInstances?.[0]?.steps?.findLast((s: any) => s.status === 'REJECTED')?.user?.fullName || "Approver"}
                          </p>
                          <p className="text-[10px] text-red-700 dark:text-red-400 italic leading-snug pl-5">
                            &ldquo;{doc.workflowInstances?.[0]?.steps?.findLast((s: any) => s.status === 'REJECTED')?.comment || "Dokumen tidak disetujui."}&rdquo;
                          </p>
                        </div>
                      )}

                      {doc.status === 'SIGNED' && (
                        <div className="mb-3 p-3 bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                          <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
                            <CheckCircle2 size={14} /> Dokumen Selesai & Ditandatangani
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 overflow-x-auto pb-1">
                        <button onClick={() => handleViewDocument(doc)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-[#006633] hover:text-white transition-all whitespace-nowrap">
                          <Eye size={14} /> Detail
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all whitespace-nowrap">
                          <Download size={14} /> Unduh
                        </button>
                        <Can perform="DOC_EDIT">
                          <button onClick={() => { setSelectedDoc(doc); setIsEditModalOpen(true); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold text-[#006633] hover:bg-slate-200 transition-all whitespace-nowrap">
                            {doc.status === 'REVISION' ? <><FileUp size={14} /> Upload Revisi</> : <><Pencil size={14} /> Edit</>}
                          </button>
                        </Can>
                        <button onClick={() => handleAddAgendaFromTable(doc)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold text-amber-600 hover:bg-slate-200 transition-all whitespace-nowrap">
                          <Calendar size={14} /> Rapat
                        </button>
                        <button onClick={() => handleAddEvidenceFromTable(doc)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold text-teal-650 hover:bg-teal-200 transition-all whitespace-nowrap">
                          <Paperclip size={14} /> File
                        </button>
                        {getComputedStatus(doc) !== 'Selesai' && (
                          <button onClick={() => handleCloseDiscussion(doc.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/50 rounded text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition-all whitespace-nowrap">
                            <Check size={14} /> Selesai
                          </button>
                        )}
                        <Can perform="DOC_DELETE">
                          <button onClick={() => { setSelectedDoc(doc); setIsDeleteConfirmOpen(true); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded text-xs font-bold text-red-600 hover:bg-red-100 transition-all whitespace-nowrap">
                            <Trash2 size={14} /> Hapus
                          </button>
                        </Can>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination Footer */}
              <div className="bg-slate-50 dark:bg-slate-800/40 px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
                {/* Left: Range Info */}
                <div>
                  {totalItems > 0 ? (
                    <span>
                      Menampilkan <strong className="text-slate-800 dark:text-white">{startIndex + 1}</strong> - <strong className="text-slate-800 dark:text-white">{endIndex}</strong> dari <strong className="text-slate-800 dark:text-white">{totalItems}</strong> data
                    </span>
                  ) : (
                    <span>Tidak ada data untuk ditampilkan</span>
                  )}
                </div>

                {/* Center: Page Size Selector */}
                <div className="flex items-center gap-2">
                  <span>Tampilkan:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs outline-none focus:border-[#006633] focus:ring-1 focus:ring-[#006633]/20"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>per halaman</span>
                </div>

                {/* Right: Page Buttons */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1 select-none">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      &laquo;
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Sebelumnya
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                      .map((page, idx, arr) => {
                        const showEllipsisBefore = page > 1 && arr[idx - 1] !== page - 1;
                        return (
                          <React.Fragment key={page}>
                            {showEllipsisBefore && <span className="px-1 text-slate-400">...</span>}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={cn(
                                "px-2.5 py-1 rounded text-xs font-bold transition-all border",
                                currentPage === page
                                  ? "bg-[#006633] border-[#006633] text-white"
                                  : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                              )}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        );
                      })}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Selanjutnya
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      &raquo;
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

            {selectedDocId && sidebarDoc && (
        <DocumentDetailModal
          sidebarDoc={sidebarDoc}
          initialTab={sidebarTab}
          initialIsCreatingMeeting={sidebarIsCreatingMeeting}
          onClose={() => setSelectedDocId(null)}
          
          setIsRevisionModalOpen={setIsRevisionModalOpen}
          setIsApprovalModalOpen={setIsApprovalModalOpen}
          setIsWorkflowEditModalOpen={setIsWorkflowEditModalOpen}
        />
      )}

      {/* Modals placed optimally outside layout flows */}
      {isEditModalOpen && selectedDoc && <EditDocumentModal doc={selectedDoc} />}
      {isFlowModalOpen && selectedDoc && <DocumentFlowModal doc={selectedDoc} />}
      {isDeleteConfirmOpen && selectedDoc && <DeleteConfirmationModal doc={selectedDoc} />}

      {isApprovalModalOpen && selectedDocId && (
        <ApprovalSubmitModal
          documentId={selectedDocId}
          onClose={() => setIsApprovalModalOpen(false)}
          onSuccess={() => {
            setIsApprovalModalOpen(false);
            fetchData();
            fetchSidebarDetail(selectedDocId);
          }}
        />
      )}

      {isWorkflowEditModalOpen && selectedDocId && (
        <WorkflowEditModal
          documentId={selectedDocId}
          onClose={() => setIsWorkflowEditModalOpen(false)}
          onSuccess={() => {
            setIsWorkflowEditModalOpen(false);
            fetchData();
            fetchSidebarDetail(selectedDocId);
          }}
        />
      )}

      {isRevisionModalOpen && selectedDocId && (
        <RevisionModal
          documentId={selectedDocId}
          onClose={() => setIsRevisionModalOpen(false)}
          onSuccess={() => {
            setIsRevisionModalOpen(false);
            fetchData();
            fetchSidebarDetail(selectedDocId);
          }}
        />
      )}

      {readerDoc && (
        <DocumentReader
          isOpen={!!readerDoc}
          onClose={() => setReaderDoc(null)}
          title={readerDoc.title}
          fileUrl={readerDoc.fileUrl}
        />
      )}
    </div>
  );
};

export default DocumentsPage;
