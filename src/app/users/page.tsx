"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Users, UserPlus, Search, MoreVertical, Edit2, Trash2,
  ShieldAlert, ShieldCheck, ShieldX, CheckCircle2, XCircle,
  Loader2, Mail, Briefcase, Phone, Building2, X, Eye, EyeOff,
  RefreshCw, KeyRound,
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import Can from "@/components/auth/Can";

// ── Types ────────────────────────────────────────────────────────────────────
interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  isActive: boolean;
  twoFactorEnabled: boolean;
  role: { id: string; name: string };
  department?: { id: string; name: string };
  jabatan?: { id: string; name: string };
}

interface Meta {
  departments: { id: string; name: string }[];
  jabatanList: { id: string; name: string }[];
  roles: { id: string; name: string }[];
}

// ── Reusable form field ───────────────────────────────────────────────────────
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full px-4 py-3 bg-[#F7F5EC] border border-[#DDDBC9] rounded-xl outline-none focus:border-[#006633]/50 focus:bg-white transition-all text-sm";
const selectCls = inputCls + " appearance-none";

// ── Add/Edit User Modal ───────────────────────────────────────────────────────
const UserFormModal = ({
  mode, user, meta, onClose, onSuccess,
}: {
  mode: "add" | "edit";
  user?: User;
  meta: Meta;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [form, setForm] = useState({
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    jobTitle: user?.jobTitle ?? "",
    roleId: user?.role?.id ?? "",
    departmentId: user?.department?.id ?? "",
    jabatanId: user?.jabatan?.id ?? "",
    password: "",
    isActive: user?.isActive ?? true,
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "add") {
        await api.post("/users", {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone || undefined,
          jobTitle: form.jobTitle || undefined,
          roleId: form.roleId,
          departmentId: form.departmentId || undefined,
          jabatanId: form.jabatanId || undefined,
          password: form.password,
        });
      } else {
        await api.patch(`/users/${user!.id}`, {
          fullName: form.fullName,
          phone: form.phone || undefined,
          jobTitle: form.jobTitle || undefined,
          roleId: form.roleId,
          departmentId: form.departmentId || undefined,
          jabatanId: form.jabatanId || undefined,
          isActive: form.isActive,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[28px] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="font-extrabold text-lg" style={{ color: '#1C1C1C' }}>
              {mode === "add" ? "Tambah User Baru" : "Edit User"}
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {mode === "add" ? "Buat akun baru untuk anggota tim" : `Edit data — ${user?.email}`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
              <ShieldX size={16} /> {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Nama Lengkap *">
              <input required className={inputCls} value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)} placeholder="Ahmad Fauzi" />
            </Field>
            <Field label="No. Handphone">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input className={inputCls + " pl-9"} value={form.phone}
                  onChange={(e) => set("phone", e.target.value)} placeholder="08xx-xxxx-xxxx" />
              </div>
            </Field>
          </div>

          {mode === "add" && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email *">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input required type="email" className={inputCls + " pl-9"} value={form.email}
                    onChange={(e) => set("email", e.target.value)} placeholder="nama@org.or.id" />
                </div>
              </Field>
              <Field label="Password *">
                <div className="relative">
                  <input required type={showPwd ? "text" : "password"} minLength={8}
                    className={inputCls + " pr-10"} value={form.password}
                    onChange={(e) => set("password", e.target.value)} placeholder="Min. 8 karakter" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Role *">
              <select required className={selectCls} value={form.roleId}
                onChange={(e) => set("roleId", e.target.value)}>
                <option value="">— Pilih Role —</option>
                {meta.roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Jabatan">
              <select className={selectCls} value={form.jabatanId}
                onChange={(e) => set("jabatanId", e.target.value)}>
                <option value="">— Pilih Jabatan —</option>
                {meta.jabatanList.map((j) => (
                  <option key={j.id} value={j.id}>{j.name}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Department">
              <select className={selectCls} value={form.departmentId}
                onChange={(e) => set("departmentId", e.target.value)}>
                <option value="">— Pilih Department —</option>
                {meta.departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Judul / Job Title">
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input className={inputCls + " pl-9"} value={form.jobTitle}
                  onChange={(e) => set("jobTitle", e.target.value)} placeholder="Opsional" />
              </div>
            </Field>
          </div>

          {mode === "edit" && (
            <Field label="Status Akun">
              <div className="flex gap-3">
                {[true, false].map((val) => (
                  <button key={String(val)} type="button"
                    onClick={() => set("isActive", val)}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all",
                      form.isActive === val
                        ? val ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"
                        : "bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200"
                    )}>
                    {val ? "✓ Aktif" : "✕ Nonaktif"}
                  </button>
                ))}
              </div>
            </Field>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-2xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #006633 0%, #1B7F4A 100%)' }}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {mode === "add" ? "Buat Akun" : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Confirm Modal ─────────────────────────────────────────────────────────────
const ConfirmModal = ({
  title, message, confirmLabel, danger, loading,
  onConfirm, onClose,
}: {
  title: string; message: string; confirmLabel: string;
  danger?: boolean; loading: boolean;
  onConfirm: () => void; onClose: () => void;
}) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
      <h3 className="font-extrabold text-lg mb-2" style={{ color: '#1C1C1C' }}>{title}</h3>
      <p className="text-sm text-slate-500 mb-6 leading-relaxed">{message}</p>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all">
          Batal
        </button>
        <button onClick={onConfirm} disabled={loading}
          className={cn(
            "flex-1 py-3 rounded-2xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60",
            danger ? "bg-red-500 hover:bg-red-600" : ""
          )}
          style={!danger ? { background: 'linear-gradient(135deg, #006633 0%, #1B7F4A 100%)' } : {}}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

// ── Change Password Modal ──────────────────────────────────────────────────────
const ChangePasswordModal = ({
  user, onClose, onSuccess,
}: {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const strength = (() => {
    if (newPassword.length === 0) return 0;
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    return score;
  })();

  const strengthLabel = ['', 'Lemah', 'Cukup', 'Kuat', 'Sangat Kuat'][strength];
  const strengthColor = ['', '#EF4444', '#F59E0B', '#10B981', '#006633'][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword.length < 8) { setError("Password minimal 8 karakter"); return; }
    if (newPassword !== confirmPassword) { setError("Konfirmasi password tidak cocok"); return; }
    setLoading(true);
    try {
      await api.patch(`/users/${user.id}/change-password`, { newPassword });
      setSuccess("Password berhasil diubah!");
      setTimeout(() => { onSuccess(); onClose(); }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[28px] shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #006633 0%, #1B7F4A 100%)' }}>
              <KeyRound size={18} className="text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg" style={{ color: '#1C1C1C' }}>Ubah Password</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{user.fullName} · {user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
              <ShieldX size={16} /> {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm flex items-center gap-2">
              <CheckCircle2 size={16} /> {success}
            </div>
          )}

          {/* New Password */}
          <Field label="Password Baru *">
            <div className="relative">
              <input
                required
                type={showNew ? "text" : "password"}
                minLength={8}
                className={inputCls + " pr-10"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 karakter"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Strength meter */}
            {newPassword.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
                      style={{ background: i <= strength ? strengthColor : '#E2E8F0' }} />
                  ))}
                </div>
                <p className="text-[11px] font-bold" style={{ color: strengthColor }}>{strengthLabel}</p>
              </div>
            )}
          </Field>

          {/* Confirm Password */}
          <Field label="Konfirmasi Password *">
            <div className="relative">
              <input
                required
                type={showConfirm ? "text" : "password"}
                className={inputCls + " pr-10"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <p className="text-[11px] text-red-500 font-medium mt-1">Password tidak cocok</p>
            )}
            {confirmPassword.length > 0 && newPassword === confirmPassword && (
              <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <CheckCircle2 size={11} /> Password cocok
              </p>
            )}
          </Field>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all">
              Batal
            </button>
            <button type="submit" disabled={loading || !!success}
              className="flex-1 py-3 rounded-2xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #006633 0%, #1B7F4A 100%)' }}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={15} />}
              Simpan Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Action Dropdown ───────────────────────────────────────────────────────────
const ActionDropdown = ({
  user, onEdit, onDelete, onReset2FA, onChangePassword,
}: {
  user: User;
  onEdit: () => void;
  onDelete: () => void;
  onReset2FA: () => void;
  onChangePassword: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg transition-all"
      >
        <MoreVertical size={17} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <Can perform="USER_EDIT">
            <button
              onClick={() => { setOpen(false); onEdit(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Edit2 size={14} className="text-[#006633]" /> Edit Data User
            </button>
            <button
              onClick={() => { setOpen(false); onChangePassword(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-blue-50 transition-colors"
            >
              <KeyRound size={14} className="text-blue-500" /> Ubah Password
            </button>
            {user.twoFactorEnabled && (
              <button
                onClick={() => { setOpen(false); onReset2FA(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-amber-50 transition-colors"
              >
                <RefreshCw size={14} className="text-amber-500" /> Reset 2FA
              </button>
            )}
          </Can>
          <Can perform="USER_DELETE">
            <div className="h-px bg-slate-50 my-1" />
            <button
              onClick={() => { setOpen(false); onDelete(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} /> Nonaktifkan User
            </button>
          </Can>
        </div>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const UserManagementPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<Meta>({ departments: [], jabatanList: [], roles: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Modal state
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [reset2FAUser, setReset2FAUser] = useState<User | null>(null);
  const [changePasswordUser, setChangePasswordUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, metaRes] = await Promise.all([
        api.get("/users"),
        api.get("/users/meta"),
      ]);
      setUsers(usersRes.data.data);
      setMeta(metaRes.data.data);
    } catch {
      setError("Gagal memuat data user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.department?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteUser) return;
    setActionLoading(true);
    try {
      await api.delete(`/users/${deleteUser.id}`);
      await fetchData();
      setDeleteUser(null);
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menonaktifkan user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReset2FA = async () => {
    if (!reset2FAUser) return;
    setActionLoading(true);
    try {
      await api.post(`/users/${reset2FAUser.id}/reset-2fa`);
      await fetchData();
      setReset2FAUser(null);
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal mereset 2FA");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Modals */}
      {showAdd && <UserFormModal mode="add" meta={meta} onClose={() => setShowAdd(false)} onSuccess={fetchData} />}
      {editUser && <UserFormModal mode="edit" user={editUser} meta={meta} onClose={() => setEditUser(null)} onSuccess={fetchData} />}
      {changePasswordUser && (
        <ChangePasswordModal
          user={changePasswordUser}
          onClose={() => setChangePasswordUser(null)}
          onSuccess={fetchData}
        />
      )}
      {deleteUser && (
        <ConfirmModal
          title="Nonaktifkan User?"
          message={`Akun "${deleteUser.fullName}" akan dinonaktifkan. User tidak dapat login, tetapi data historis tetap terjaga.`}
          confirmLabel="Ya, Nonaktifkan"
          danger loading={actionLoading}
          onConfirm={handleDelete}
          onClose={() => setDeleteUser(null)}
        />
      )}
      {reset2FAUser && (
        <ConfirmModal
          title="Reset 2FA?"
          message={`2FA untuk "${reset2FAUser.fullName}" akan direset. User harus scan QR code baru saat login berikutnya.`}
          confirmLabel="Ya, Reset 2FA"
          loading={actionLoading}
          onConfirm={handleReset2FA}
          onClose={() => setReset2FAUser(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-1 sm:mb-2 leading-tight flex items-center gap-3">
            <Users size={28} className="text-primary flex-shrink-0" />
            <span>Manajemen User</span>
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            Kelola akses, role, department, dan keamanan akun staff.
          </p>
        </div>
        <Can perform="USER_ADD">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-5 py-3 font-bold rounded-2xl shadow-lg text-white text-sm w-full sm:w-auto justify-center hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            style={{ background: 'linear-gradient(135deg, #006633 0%, #1B7F4A 100%)', boxShadow: '0 4px 16px rgba(0,102,51,0.3)' }}
          >
            <UserPlus size={18} />
            <span>Tambah User</span>
          </button>
        </Can>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#006633] transition-colors" size={18} />
          <input
            type="text"
            placeholder="Cari nama, email, atau department..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#006633]/50 transition-all text-sm shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-slate-200 shadow-sm relative z-10">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4 text-slate-400">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="font-medium animate-pulse">Memuat data user...</p>
          </div>
        ) : error ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4 text-red-500">
            <ShieldAlert size={40} />
            <p className="font-bold">{error}</p>
            <button onClick={fetchData} className="text-sm font-bold underline">Coba Lagi</button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-24 text-center text-slate-400 font-medium italic">
            {search ? "Tidak ada user yang cocok dengan pencarian." : "Belum ada user terdaftar."}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="rounded-tl-[24px] text-left py-5 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100">User</th>
                    <th className="text-left py-5 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100">Role & Department</th>
                    <th className="text-left py-5 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100">Jabatan</th>
                    <th className="text-left py-5 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100">2FA</th>
                    <th className="text-left py-5 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100">Status</th>
                    <th className="rounded-tr-[24px] text-right py-5 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-white text-sm uppercase flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #006633 0%, #1B7F4A 100%)' }}>
                            {u.fullName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 leading-tight truncate">{u.fullName}</p>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                              <Mail size={10} />
                              <span className="truncate">{u.email}</span>
                            </div>
                            {u.phone && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                                <Phone size={10} />
                                <span>{u.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-tight" style={{ background: '#E8F5EE', color: '#006633' }}>
                          {u.role.name}
                        </span>
                        {u.department && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1.5 font-medium">
                            <Building2 size={11} />
                            <span className="truncate max-w-[150px]">{u.department.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-[11px] text-slate-600 font-medium">
                          {u.jabatan?.name || <span className="text-slate-300 italic">—</span>}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          <div className={cn("w-2 h-2 rounded-full", u.twoFactorEnabled ? "bg-emerald-500" : "bg-slate-300")} />
                          <span className={cn("text-[10px] font-bold uppercase tracking-tighter", u.twoFactorEnabled ? "text-emerald-600" : "text-slate-400")}>
                            {u.twoFactorEnabled ? "Aktif" : "Belum"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {u.isActive ? (
                          <div className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                            <CheckCircle2 size={12} /> Aktif
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 font-bold bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                            <XCircle size={12} /> Nonaktif
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditUser(u)}
                            className="p-2 hover:bg-[#006633]/10 hover:text-[#006633] text-slate-400 rounded-lg transition-all"
                            title="Edit user"
                          >
                            <Edit2 size={16} />
                          </button>
                          <ActionDropdown
                            user={u}
                            onEdit={() => setEditUser(u)}
                            onDelete={() => setDeleteUser(u)}
                            onReset2FA={() => setReset2FAUser(u)}
                            onChangePassword={() => setChangePasswordUser(u)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <div key={u.id} className="p-4 hover:bg-slate-50/50 transition-all">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-white text-sm uppercase flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #006633 0%, #1B7F4A 100%)' }}>
                        {u.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{u.fullName}</p>
                        <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {u.isActive ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Aktif</span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border">Nonaktif</span>
                      )}
                      <ActionDropdown
                        user={u}
                        onEdit={() => setEditUser(u)}
                        onDelete={() => setDeleteUser(u)}
                        onReset2FA={() => setReset2FAUser(u)}
                        onChangePassword={() => setChangePasswordUser(u)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase" style={{ background: '#E8F5EE', color: '#006633' }}>{u.role.name}</span>
                    {u.department && (
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Building2 size={10} /> {u.department.name}
                      </span>
                    )}
                    <span className={cn("text-[10px] font-bold flex items-center gap-1", u.twoFactorEnabled ? "text-emerald-600" : "text-slate-400")}>
                      {u.twoFactorEnabled ? <ShieldCheck size={11} /> : <ShieldX size={11} />}
                      2FA {u.twoFactorEnabled ? "On" : "Off"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserManagementPage;
