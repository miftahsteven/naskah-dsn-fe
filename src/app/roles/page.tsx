"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Lock, 
  CheckSquare, 
  Square, 
  Save, 
  Loader2, 
  ShieldAlert,
  Info,
  Users
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

const RolesPage = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        api.get("/roles"),
        api.get("/roles/permissions")
      ]);
      setRoles(rolesRes.data.data);
      setPermissions(permsRes.data.data);
      
      if (rolesRes.data.data.length > 0) {
        setSelectedRoleId(rolesRes.data.data[0].id);
      }
    } catch (err: any) {
      setError("Gagal memuat data role & permission");
    } finally {
      setLoading(false);
    }
  };

  const fetchRolePermissions = async (roleId: string) => {
    try {
      const res = await api.get(`/roles/${roleId}/permissions`);
      setRolePermissions(res.data.data.map((rp: any) => rp.permissionId));
    } catch (err: any) {
      console.error("Gagal memuat permission role");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedRoleId) {
      fetchRolePermissions(selectedRoleId);
    }
  }, [selectedRoleId]);

  const togglePermission = (permId: string) => {
    setRolePermissions(prev => 
      prev.includes(permId) 
        ? prev.filter(id => id !== permId) 
        : [...prev, permId]
    );
  };

  const handleSave = async () => {
    if (!selectedRoleId) return;
    try {
      setSaving(true);
      await api.post(`/roles/${selectedRoleId}/permissions`, {
        permissionIds: rolePermissions
      });
      // Show success feedback (optional: toast)
    } catch (err: any) {
      setError("Gagal menyimpan perubahan");
    } finally {
      setSaving(false);
    }
  };

  const selectedRole = roles.find(r => r.id === selectedRoleId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 leading-tight flex items-center gap-3">
            <ShieldCheck size={32} className="text-primary" />
            <span>Role & Permission</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Kelola matriks kewenangan dan hak akses untuk setiap tingkat jabatan.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Roles List Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2">Daftar Role</h3>
          <div className="flex flex-col gap-2">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRoleId(role.id)}
                className={cn(
                  "flex flex-col items-start gap-1 p-4 rounded-2xl transition-all text-left border",
                  selectedRoleId === role.id 
                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-primary/50"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold">{role.name}</span>
                  <div className={cn(
                    "flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                    selectedRoleId === role.id ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800"
                  )}>
                    <Users size={10} />
                    <span>{role._count?.users || 0}</span>
                  </div>
                </div>
                <span className={cn(
                  "text-[10px] leading-tight line-clamp-1",
                  selectedRoleId === role.id ? "text-white/70" : "text-slate-400"
                )}>
                  {role.description || "Tidak ada deskripsi"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Permission Matrix */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
             <div className="h-[500px] flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[32px] border border-dashed border-slate-200 dark:border-slate-800 gap-4">
               <Loader2 className="animate-spin text-primary" size={32} />
               <p className="text-sm font-medium text-slate-400">Menyiapkan matriks...</p>
             </div>
          ) : selectedRole ? (
            <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
              {/* Role Header */}
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center text-white shadow-lg shrink-0">
                    <Lock size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Permission Matrix: {selectedRole.name}</h2>
                    <p className="text-xs text-slate-500 font-medium">Centang untuk memberikan akses ke modul tertentu.</p>
                  </div>
                </div>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70"
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  <span>Simpan Perubahan</span>
                </button>
              </div>

              {/* Matrix Grid */}
              <div className="p-8">
                {permissions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                    <Info size={32} />
                    <p className="italic">Belum ada permission yang terdaftar di database.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {permissions.map((perm) => {
                      const isActive = rolePermissions.includes(perm.id);
                      return (
                        <button
                          key={perm.id}
                          onClick={() => togglePermission(perm.id)}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group",
                            isActive 
                              ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50" 
                              : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary/30"
                          )}
                        >
                          <div className={cn(
                            "shrink-0 transition-transform group-hover:scale-110",
                            isActive ? "text-emerald-600" : "text-slate-300 dark:text-slate-700"
                          )}>
                            {isActive ? <CheckSquare size={24} /> : <Square size={24} />}
                          </div>
                          <div>
                            <p className={cn(
                              "text-sm font-bold transition-colors",
                              isActive ? "text-emerald-900 dark:text-emerald-100" : "text-slate-700 dark:text-slate-300"
                            )}>
                              {perm.name}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5">{perm.code}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-[500px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px]">
               <ShieldAlert size={48} className="mb-4 opacity-20" />
               <p className="font-medium">Pilih role untuk mengelola permission.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RolesPage;
