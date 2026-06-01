"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Mail,
  Lock,
  ShieldCheck,
  ArrowRight,
  Loader2,
  AlertCircle,
  QrCode,
  RefreshCw,
  Fingerprint,
  Check,
  Building,
  Globe
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";

// Step types: "credentials" | "setup_2fa" | "verify_otp"
type LoginStep = "credentials" | "setup_2fa" | "verify_otp";

const LoginPage = () => {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [step, setStep] = useState<LoginStep>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [userId, setUserId] = useState("");

  // 2FA Setup state
  const [qrCode, setQrCode] = useState(""); // base64 data url
  const [secret, setSecret] = useState("");
  const [setupOtp, setSetupOtp] = useState("");
  const [qrLoading, setQrLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const otpRef = useRef<HTMLInputElement>(null);

  // Auto-focus OTP when step changes
  useEffect(() => {
    if (step === "verify_otp" || step === "setup_2fa") {
      setTimeout(() => otpRef.current?.focus(), 200);
    }
  }, [step]);

  // Step 1: Email + Password
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", { email, password });
      const { data, requires2FA, requires_2fa_setup, userId: uid } = res.data;

      if (requires_2fa_setup) {
        // First time — must setup Google Authenticator
        setUserId(uid);
        await fetchQRCode(uid);
        setStep("setup_2fa");
      } else if (requires2FA) {
        // Already setup — just need OTP
        setUserId(uid);
        setStep("verify_otp");
      } else {
        setAuth(data.user, data.accessToken, data.refreshToken);
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Terjadi kesalahan saat login");
    } finally {
      setLoading(false);
    }
  };

  // Fetch QR code from backend (requires temp token-less session via userId)
  const fetchQRCode = async (uid: string) => {
    setQrLoading(true);
    try {
      // We use a special setup endpoint that accepts userId for first-time setup
      const res = await api.post("/auth/setup-2fa-public", { userId: uid });
      setQrCode(res.data.data.qrCode);
      setSecret(res.data.data.secret);
    } catch {
      setError("Gagal memuat QR Code. Silakan coba login kembali.");
    } finally {
      setQrLoading(false);
    }
  };

  // Step 2A: Verify setup OTP (first time)
  const handleSetup2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Enable 2FA by verifying the first OTP
      const res = await api.post("/auth/enable-2fa-public", {
        userId,
        token: setupOtp,
      });
      const { data } = res.data;
      setAuth(data.user, data.accessToken, data.refreshToken);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Kode OTP tidak valid. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2B: Verify OTP (returning user)
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/verify-2fa", { userId, token: otpToken });
      const { data } = res.data;
      setAuth(data.user, data.accessToken, data.refreshToken);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Token 2FA tidak valid. Pastikan waktu di perangkat Anda sudah sinkron (Automatic Time).");
    } finally {
      setLoading(false);
    }
  };

  const resetToLogin = () => {
    setStep("credentials");
    setError("");
    setOtpToken("");
    setSetupOtp("");
    setQrCode("");
    setSecret("");
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F7F5EC] overflow-x-hidden">
      {/* ── SISI KIRI: PANEL OTENTIKASI (LOGIN FORM) ── */}
      <div className="w-full lg:w-[45%] xl:w-[40%] min-h-screen flex flex-col justify-between p-6 sm:p-10 md:p-14 bg-white relative z-10 shadow-2xl shadow-slate-200/50">

        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-emerald-950/20 border border-[#D4AF37]/20">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
                <path d="M24 4L38 12V28L24 36L10 28V12L24 4Z" stroke="#D4AF37" strokeWidth="1.5" fill="none" />
                <circle cx="10" cy="20" r="1.5" fill="#D4AF37" />
                <circle cx="38" cy="20" r="1.5" fill="#D4AF37" />
                <circle cx="24" cy="4" r="1.5" fill="#D4AF37" />
                <path d="M24 13L28 22H20L24 13Z" fill="#D4AF37" />
                <path d="M24 22V32" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
                <path d="M21 26H27" stroke="#D4AF37" strokeWidth="1" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-800">Amanah</span>
              <span className="text-xs block font-bold text-[#D4AF37] tracking-wider uppercase">Manajemen Dokumen</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#E8F5EE] border border-[#006633]/15 text-[#006633]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>MUI Digital Initiative</span>
          </div>
        </div>

        {/* Form Container */}
        <div className="my-auto py-10 max-w-md w-full mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700">

          {/* Header text based on current step */}
          <div className="mb-8">
            {step === "credentials" && (
              <>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 mb-2">Selamat Datang</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Silakan masuk untuk mengelola dokumen legal, fatwa, dan tanda tangan digital instansi secara tersertifikasi.
                </p>
              </>
            )}
            {step === "setup_2fa" && (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-3 bg-[#E8F5EE] border border-[#006633]/15 text-[#006633]">
                  <ShieldCheck size={14} /> Wajib Pengamanan Tambahan
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 mb-2">Setup Google Authenticator</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Tingkatkan keamanan akun Anda dengan mengaktifkan otentikasi dua faktor (2FA).
                </p>
              </>
            )}
            {step === "verify_otp" && (
              <>
                <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-[#E8F5EE] border border-[#006633]/15">
                  <ShieldCheck size={24} className="text-[#006633]" />
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 mb-2">Otentikasi Dua Faktor</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Masukkan kode verifikasi 6 digit yang dihasilkan oleh aplikasi otentikator Anda.
                </p>
              </>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50/80 backdrop-blur-sm border border-red-100 flex items-start gap-3 text-red-600 text-sm animate-in fade-in zoom-in duration-300">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* ── STEP 1: EMAIL & PASSWORD ── */}
          {step === "credentials" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Organisasi</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#006633] transition-colors" size={18} />
                  <input
                    type="email" required autoFocus
                    placeholder="nama@mui.or.id"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-[#006633]/50 focus:bg-white focus:ring-4 focus:ring-[#006633]/5 transition-all text-sm text-slate-800 placeholder-slate-400"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Kata Sandi</label>
                  <a href="#" className="text-xs font-bold text-[#006633] hover:text-[#1B7F4A] transition-colors hover:underline">Lupa sandi?</a>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#006633] transition-colors" size={18} />
                  <input
                    type="password" required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-[#006633]/50 focus:bg-white focus:ring-4 focus:ring-[#006633]/5 transition-all text-sm text-slate-800 placeholder-slate-400"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full py-4 rounded-2xl font-bold text-white shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 group mt-6 disabled:opacity-70 disabled:scale-100 gradient-primary cursor-pointer"
                style={{ boxShadow: '0 6px 20px rgba(0,102,51,0.25)' }}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    <span>Masuk ke Dashboard</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── STEP 2A: SETUP 2FA ── */}
          {step === "setup_2fa" && (
            <form onSubmit={handleSetup2FA} className="space-y-6">
              <p className="text-xs text-slate-500 leading-relaxed text-center">
                Scan QR code berikut menggunakan aplikasi <strong>Google Authenticator</strong>, kemudian masukkan 6 digit kode yang tertera untuk memverifikasi.
              </p>

              {/* QR Code Container */}
              <div className="flex flex-col items-center gap-3 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                {qrLoading ? (
                  <div className="w-44 h-44 flex items-center justify-center">
                    <Loader2 className="animate-spin text-[#006633]/60" size={32} />
                  </div>
                ) : qrCode ? (
                  <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrCode} alt="QR Code 2FA" className="w-40 h-40" />
                  </div>
                ) : (
                  <div className="w-44 h-44 flex flex-col items-center justify-center gap-2 text-red-400">
                    <QrCode size={32} />
                    <span className="text-xs font-semibold">Gagal memuat QR</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => fetchQRCode(userId)}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#006633] transition-colors"
                >
                  <RefreshCw size={12} /> Muat ulang QR Code
                </button>
              </div>

              {/* Secret Key manual entry */}
              {secret && (
                <div className="p-3.5 bg-amber-50/50 border border-amber-200/50 rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-amber-800/80 uppercase tracking-widest mb-1">Kunci Manual (jika scan gagal)</p>
                  <p className="font-mono text-xs text-amber-900 select-all font-semibold break-all">{secret}</p>
                </div>
              )}

              {/* OTP Code Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-center block text-slate-500">Masukkan Kode Verifikasi 6-Digit</label>
                <div className="relative group max-w-[240px] mx-auto">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#006633] transition-colors" size={18} />
                  <input
                    ref={otpRef}
                    type="text" required maxLength={6}
                    placeholder="000000"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-[#006633]/50 focus:bg-white focus:ring-4 focus:ring-[#006633]/5 transition-all text-xl font-bold tracking-[0.5em] text-center text-slate-800"
                    value={setupOtp}
                    onChange={(e) => setSetupOtp(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || setupOtp.length < 6}
                className="w-full py-4 rounded-2xl font-bold text-white shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 gradient-primary cursor-pointer"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Aktifkan Keamanan & Masuk</span>
                  </>
                )}
              </button>

              <button type="button" onClick={resetToLogin} className="w-full text-slate-400 hover:text-slate-600 text-xs font-bold transition-colors py-1">
                ← Kembali ke Halaman Login
              </button>
            </form>
          )}

          {/* ── STEP 2B: VERIFY OTP (RETURNING USER) ── */}
          {step === "verify_otp" && (
            <form onSubmit={handleVerify2FA} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-center block text-slate-500">Kode Keamanan</label>
                <div className="relative group max-w-[240px] mx-auto">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#006633] transition-colors" size={18} />
                  <input
                    ref={otpRef}
                    type="text" required maxLength={6}
                    placeholder="000000"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-[#006633]/50 focus:bg-white focus:ring-4 focus:ring-[#006633]/5 transition-all text-xl font-bold tracking-[0.5em] text-center text-slate-800"
                    value={otpToken}
                    onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otpToken.length < 6}
                className="w-full py-4 rounded-2xl font-bold text-white shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 gradient-primary cursor-pointer"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : "Verifikasi & Masuk"}
              </button>

              <button type="button" onClick={resetToLogin} className="w-full text-slate-400 hover:text-slate-600 text-xs font-bold transition-colors py-1">
                ← Kembali ke Halaman Login
              </button>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="text-center lg:text-left">
          <p className="text-slate-400 text-xs font-medium">
            © 2026 Amanah — Sistem Manajemen Dokumen Digital & Tanda Tangan Tersertifikasi.
          </p>
          <p className="text-[10px] text-slate-350 mt-1 font-semibold">
            Dikembangkan untuk tata kelola model organisasi Majelis Ulama Indonesia.
          </p>
        </div>

      </div>

      {/* ── SISI KANAN: DYNAMIC SHOWCASE (PREVIEW PANEL) ── */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] relative flex-col justify-between p-12 xl:p-16 overflow-hidden bg-[#011a0c]">

        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/login-bg-real-hijab.png"
            alt="MUI Digital Organization Realistic Workspace"
            fill
            priority
            className="object-cover object-center scale-105"
          />
          {/* Dark Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#01140a] via-[#01140a]/80 to-[#01140a]/30" />
        </div>

        {/* Top Header Badge */}
        <div className="flex flex-col gap-2.5 relative z-10 self-start">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-emerald-100 bg-black/40 border border-white/20 backdrop-blur-md shadow-lg">
            <Fingerprint size={16} className="text-[#D4AF37]" />
            <span>Keamanan Kriptografi Tersertifikasi Standard ISO/IEC 27001</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-mono font-medium text-emerald-200/80 bg-black/30 border border-white/10 backdrop-blur-md shadow-sm w-fit">
            <Globe size={13} className="text-emerald-400" />
            <span>edocs.mui.or.id/dashboard</span>
          </div>
        </div>

        {/* Central spacer to push text to bottom */}
        <div className="flex-1" />

        {/* Bottom Highlights & Branding */}
        <div className="relative z-10 space-y-4 max-w-lg bg-black/40 p-6 rounded-3xl backdrop-blur-md border border-white/10 shadow-2xl">
          <h2 className="text-xl xl:text-2xl font-extrabold text-white tracking-tight leading-snug">
            Transformasi Organisasi Model Digital
            <span className="text-[#D4AF37] block mt-2 text-lg xl:text-xl font-bold">Dewan Syariah Nasional</span>
            <span className="text-emerald-400 text-[10px] xl:text-xs block font-extrabold tracking-[0.2em] uppercase mt-1">Majelis Ulama Indonesia</span>
          </h2>
          <p className="text-emerald-50/80 text-xs xl:text-sm leading-relaxed max-w-md font-medium">
            Integrasi penuh administrasi surat resmi, persetujuan fatwa secara online, dan tanda tangan digital terenkripsi yang memiliki keabsahan hukum legal dan aman.
          </p>

          {/* Highlights checklist (Horizontal Pills) */}
          <div className="flex flex-wrap gap-3 pt-3 border-t border-white/15">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <Check size={13} className="text-[#D4AF37]" />
              <span className="text-[11px] font-bold text-white tracking-wide">Otoritas Terpusat</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <Check size={13} className="text-[#D4AF37]" />
              <span className="text-[11px] font-bold text-white tracking-wide">E-Sign Tersertifikasi</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default LoginPage;
