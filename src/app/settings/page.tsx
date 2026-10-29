"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings, 
  User as UserIcon, 
  ShieldCheck, 
  Key, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Lock,
  Mail,
  Building2,
  ChevronRight,
  QrCode,
  Shield,
  Save
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";

const SettingsPage = () => {
  const user = useAuthStore((state) => state.user);
  const [qrCode, setQrCode] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Pengaturan Khusus Aplikasi Mobile Amanah (Global 2FA Config)
  const [mobile2FAEnabled, setMobile2FAEnabled] = useState<boolean>(false);
  const [mobile2FAMethod, setMobile2FAMethod] = useState<"GOOGLE_AUTH" | "EMAIL">("GOOGLE_AUTH");
  const [configLoading, setConfigLoading] = useState<boolean>(true);
  const [savingConfig, setSavingConfig] = useState<boolean>(false);
  const [configSuccess, setConfigSuccess] = useState<string>("");
  const [configError, setConfigError] = useState<string>("");

  useEffect(() => {
    const fetchMobile2FAConfig = async () => {
      try {
        setConfigLoading(true);
        const res = await api.get("/auth/mobile-2fa-config");
        if (res.data?.data) {
          setMobile2FAEnabled(Boolean(res.data.data.twoFactorEnabled));
          setMobile2FAMethod(res.data.data.twoFactorMethod === "EMAIL" ? "EMAIL" : "GOOGLE_AUTH");
        }
      } catch (err) {
        console.error("Failed to fetch mobile 2FA config:", err);
      } finally {
        setConfigLoading(false);
      }
    };
    fetchMobile2FAConfig();
  }, []);

  const saveMobile2FAConfig = async () => {
    try {
      setSavingConfig(true);
      setConfigError("");
      setConfigSuccess("");
      const res = await api.put("/auth/mobile-2fa-config", {
        twoFactorEnabled: mobile2FAEnabled,
        twoFactorMethod: mobile2FAMethod,
      });
      setConfigSuccess(
        res.data?.message ||
          (mobile2FAEnabled
            ? `Mode 2FA (${mobile2FAMethod === "EMAIL" ? "2FA Email" : "Google Authenticator"}) berhasil diaktifkan untuk semua user.`
            : "Mode 2FA berhasil dinonaktifkan untuk semua user.")
      );
      setTimeout(() => setConfigSuccess(""), 5000);
    } catch (err: any) {
      setConfigError(err.response?.data?.message || "Gagal menyimpan pengaturan aplikasi mobile Amanah");
    } finally {
      setSavingConfig(false);
    }
  };

  const setup2FA = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.post("/auth/setup-2fa");
      setQrCode(res.data.data.qrCode);
      setIsEnabling2FA(true);
    } catch (err: any) {
      setError("Gagal menyiapkan 2FA");
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async () => {
    try {
      setLoading(true);
      setError("");
      await api.post("/auth/enable-2fa", { token: otpToken });
      setSuccess("2FA berhasil diaktifkan!");
      setIsEnabling2FA(false);
      // Wait for re-fetch profile if needed, or just update store
    } catch (err: any) {
      setError("Token OTP tidak valid");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-1 sm:mb-2 leading-tight flex items-center gap-3">
          <Settings size={28} className="text-primary flex-shrink-0" />
          <span>Pengaturan Sistem & Akun</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
          Kelola konfigurasi aplikasi mobile Amanah, keamanan login (2FA), serta informasi profil akun Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column: Profile Overview */}
        <div className="lg:col-span-1 space-y-5">
           <div className="bg-white dark:bg-slate-900 rounded-[24px] sm:rounded-[32px] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col items-center text-center shadow-sm">
              <div className="w-24 h-24 rounded-3xl gradient-primary flex items-center justify-center text-white text-3xl font-bold shadow-xl mb-6">
                 {user?.fullName?.charAt(0) || "U"}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{user?.fullName}</h3>
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-6">{user?.role}</p>
              
              <div className="w-full space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                 <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                    <Mail size={16} />
                    <span className="text-xs font-medium truncate">{user?.email}</span>
                 </div>
                 <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                    <Building2 size={16} />
                    <span className="text-xs font-medium">DSN-MUI Pusat</span>
                 </div>
              </div>
           </div>

           <div className="bg-emerald-500 rounded-[32px] p-8 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden group">
              <div className="relative z-10 space-y-4">
                 <ShieldCheck size={32} />
                 <h4 className="font-bold">Akun Terverifikasi</h4>
                 <p className="text-xs text-white/80 leading-relaxed">
                   Akun Anda memiliki akses penuh ke fitur tanda tangan digital resmi MUI.
                 </p>
              </div>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-1000"></div>
           </div>
        </div>

        {/* Right Column: Security & Preferences */}
        <div className="lg:col-span-2 space-y-8">
           {/* ── PENGATURAN KHUSUS APLIKASI MOBILE AMANAH (GLOBAL 2FA CONFIG) ── */}
           <div className="bg-white dark:bg-slate-900 rounded-[24px] sm:rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-8 space-y-6">
              <div className="flex items-start justify-between gap-4">
                 <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800 flex items-center justify-center text-primary shrink-0 mt-0.5">
                       <Smartphone size={22} />
                    </div>
                    <div>
                       <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Pengaturan Khusus Aplikasi Mobile Amanah</h3>
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                             Semua User
                          </span>
                       </div>
                       <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">
                          Konfigurasi mode keamanan Autentikasi Dua Faktor (2FA) saat login untuk seluruh pengguna aplikasi Amanah.
                       </p>
                    </div>
                 </div>
              </div>

              {configError && (
                <div className="p-4 rounded-xl bg-red-50 text-red-600 text-xs font-bold border border-red-100 flex items-center gap-2">
                   <AlertCircle size={16} className="shrink-0" />
                   <span>{configError}</span>
                </div>
              )}

              {configSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-2">
                   <CheckCircle2 size={16} className="shrink-0" />
                   <span>{configSuccess}</span>
                </div>
              )}

              {/* Toggle Switch On / Off */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-4">
                 <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-bold text-slate-900 dark:text-white">
                          Mode Autentikasi 2FA Saat Login
                       </span>
                       <span
                         className={cn(
                           "text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider",
                           mobile2FAEnabled
                             ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                             : "bg-slate-200 text-slate-600 border border-slate-300"
                         )}
                       >
                          {mobile2FAEnabled ? "AKTIF (ON)" : "NONAKTIF (OFF)"}
                       </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                       {mobile2FAEnabled
                         ? "Seluruh pengguna wajib melewati verifikasi 2FA terlebih dahulu saat login."
                         : "Seluruh pengguna (termasuk Pimpinan/Pejabat DSN-MUI) dapat langsung login tanpa verifikasi 2FA demi kenyamanan."}
                    </p>
                 </div>

                 <button
                    type="button"
                    role="switch"
                    aria-checked={mobile2FAEnabled}
                    disabled={configLoading}
                    onClick={() => setMobile2FAEnabled((prev) => !prev)}
                    className={cn(
                      "relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      mobile2FAEnabled ? "bg-primary" : "bg-slate-300 dark:bg-slate-700"
                    )}
                 >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                        mobile2FAEnabled ? "translate-x-7" : "translate-x-0"
                      )}
                    />
                 </button>
              </div>

              {/* Pilihan Metode 2FA (Muncul jika Toggle ON) */}
              {mobile2FAEnabled && (
                <div className="space-y-3 pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                   <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                      Pilih Metode Verifikasi 2FA (Berlaku untuk Semua User)
                   </label>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Option 1: Google Authenticator */}
                      <button
                         type="button"
                         onClick={() => setMobile2FAMethod("GOOGLE_AUTH")}
                         className={cn(
                           "flex items-start gap-3.5 p-4 rounded-2xl border-2 text-left transition-all cursor-pointer",
                           mobile2FAMethod === "GOOGLE_AUTH"
                             ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm"
                             : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:border-slate-300"
                         )}
                      >
                         <div
                           className={cn(
                             "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                             mobile2FAMethod === "GOOGLE_AUTH"
                               ? "bg-primary text-white"
                               : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                           )}
                         >
                            <QrCode size={20} />
                         </div>
                         <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                               <p className="text-sm font-bold text-slate-900 dark:text-white">Google Authenticator</p>
                               <div
                                 className={cn(
                                   "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                                   mobile2FAMethod === "GOOGLE_AUTH" ? "border-primary" : "border-slate-300"
                                 )}
                               >
                                  {mobile2FAMethod === "GOOGLE_AUTH" && (
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                  )}
                               </div>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                               Verifikasi menggunakan kode 6 digit dari aplikasi Google Authenticator di ponsel.
                            </p>
                         </div>
                      </button>

                      {/* Option 2: 2FA Email */}
                      <button
                         type="button"
                         onClick={() => setMobile2FAMethod("EMAIL")}
                         className={cn(
                           "flex items-start gap-3.5 p-4 rounded-2xl border-2 text-left transition-all cursor-pointer",
                           mobile2FAMethod === "EMAIL"
                             ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm"
                             : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:border-slate-300"
                         )}
                      >
                         <div
                           className={cn(
                             "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                             mobile2FAMethod === "EMAIL"
                               ? "bg-primary text-white"
                               : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                           )}
                         >
                            <Mail size={20} />
                         </div>
                         <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                               <p className="text-sm font-bold text-slate-900 dark:text-white">2FA Email (Kode OTP)</p>
                               <div
                                 className={cn(
                                   "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                                   mobile2FAMethod === "EMAIL" ? "border-primary" : "border-slate-300"
                                 )}
                               >
                                  {mobile2FAMethod === "EMAIL" && (
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                  )}
                               </div>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                               Verifikasi menggunakan kode OTP 6 digit yang dikirim otomatis ke email terdaftar user.
                            </p>
                         </div>
                      </button>
                   </div>
                </div>
              )}

              {/* Tombol Simpan Konfigurasi */}
              <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                 <button
                    type="button"
                    onClick={saveMobile2FAConfig}
                    disabled={savingConfig || configLoading}
                    className="px-5 py-2.5 bg-primary text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 flex items-center gap-2 cursor-pointer"
                 >
                    {savingConfig ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>Simpan Pengaturan 2FA</span>
                      </>
                    )}
                 </button>
              </div>
           </div>

           {/* 2FA Per-Account Section */}
           <div className="bg-white dark:bg-slate-900 rounded-[24px] sm:rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-8 space-y-5 sm:space-y-6">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <Shield size={24} className="text-primary" />
                    <div>
                       <h3 className="text-lg font-bold text-slate-900 dark:text-white">Perangkat Google Authenticator Saya</h3>
                       <p className="text-xs text-slate-500 font-medium tracking-tight">Tautkan aplikasi Google Authenticator untuk akun Anda saat mode Google Auth diaktifkan.</p>
                    </div>
                 </div>
                 {!isEnabling2FA && (
                   <span className={cn(
                     "text-[10px] font-bold px-2.5 py-0.5 rounded-full border",
                     mobile2FAEnabled ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-500 border-slate-200"
                   )}>
                     {mobile2FAEnabled ? "2FA AKTIF" : "OPSIONAL"}
                   </span>
                 )}
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 text-red-600 text-xs font-bold border border-red-100 flex items-center gap-2">
                   <AlertCircle size={16} />
                   <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-4 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100 flex items-center gap-2">
                   <CheckCircle2 size={16} />
                   <span>{success}</span>
                </div>
              )}

              {isEnabling2FA ? (
                <div className="space-y-6 p-6 border-2 border-dashed border-primary/20 rounded-3xl bg-primary/5 animate-in zoom-in-95 duration-300">
                   <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-8">
                      {qrCode && (
                        <div className="bg-white p-2 rounded-2xl shadow-inner shrink-0">
                           <img src={qrCode} alt="2FA QR Code" className="w-32 h-32" />
                        </div>
                      )}
                      <div className="space-y-3">
                         <h4 className="font-bold text-slate-900 dark:text-white">Pindai QR Code</h4>
                         <p className="text-xs text-slate-500 leading-relaxed">
                           Gunakan aplikasi Google Authenticator atau sejenisnya untuk memindai kode di samping dan masukkan 6 digit angka yang muncul.
                         </p>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Kode Verifikasi</label>
                      <div className="flex gap-3">
                        <input 
                          type="text" 
                          maxLength={6}
                          placeholder="000000"
                          className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-bold tracking-widest"
                          value={otpToken}
                          onChange={(e) => setOtpToken(e.target.value)}
                        />
                        <button 
                          onClick={verify2FA}
                          disabled={loading}
                          className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70"
                        >
                          {loading ? <Loader2 className="animate-spin" size={20} /> : "Verifikasi"}
                        </button>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                   <button 
                     onClick={setup2FA}
                     disabled={loading}
                     className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl transition-all group"
                   >
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-primary shadow-sm">
                            <QrCode size={20} />
                         </div>
                         <div className="text-left">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">Siapkan Authenticator</p>
                            <p className="text-[10px] text-slate-500">Mulai pengaktifan 2FA untuk keamanan akun.</p>
                         </div>
                      </div>
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-primary transition-all group-hover:translate-x-1" />
                   </button>
                </div>
              )}
           </div>

           {/* Password Section */}
           <div className="bg-white dark:bg-slate-900 rounded-[24px] sm:rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-8 space-y-5 sm:space-y-6 opacity-60">
              <div className="flex items-center gap-3">
                 <Lock size={24} className="text-primary" />
                 <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ubah Password</h3>
                    <p className="text-xs text-slate-500 font-medium tracking-tight">Perbarui kata sandi Anda secara berkala.</p>
                 </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center gap-3 text-slate-400 italic text-xs">
                 <AlertCircle size={16} />
                 <span>Fitur pengubahan password mandiri akan tersedia di Phase 2.</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
