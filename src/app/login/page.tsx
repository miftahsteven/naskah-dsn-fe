"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Mail, Lock, ShieldCheck, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";

const LoginPage = () => {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(""); // For 2FA OTP
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [userId, setUserId] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", { email, password });
      const { data, requires2FA: r2fa, userId: uid } = res.data;

      if (r2fa) {
        setRequires2FA(true);
        setUserId(uid);
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

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/verify-2fa", { userId, token });
      const { data } = res.data;

      setAuth(data.user, data.accessToken, data.refreshToken);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Token 2FA tidak valid");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-slate-950 p-6 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl shadow-slate-200/50 dark:shadow-black/50 p-8 border border-white dark:border-slate-800 relative z-10">
          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white font-bold text-3xl shadow-xl mb-6">
              M
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">MUI Naskah Digital</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Masuk ke sistem manajemen dokumen</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 flex items-start gap-3 text-red-600 dark:text-red-400 text-sm animate-in fade-in zoom-in duration-300">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!requires2FA ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    type="email"
                    required
                    placeholder="nama@mui.or.id"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:border-primary/50 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Password</label>
                  <a href="#" className="text-xs text-primary font-bold hover:underline">Lupa?</a>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:border-primary/50 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full gradient-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group mt-4 disabled:opacity-70 disabled:scale-100"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    <span>Masuk</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* 2FA Verification Form */
            <form onSubmit={handleVerify2FA} className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Verifikasi 2FA</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Masukkan 6 digit kode dari Google Authenticator Anda</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 text-center block">Kode OTP</label>
                <div className="relative group max-w-[200px] mx-auto">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="000000"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:border-primary/50 focus:bg-white dark:focus:bg-slate-800 transition-all text-lg font-bold tracking-[0.5em] text-center"
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full gradient-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : "Verifikasi"}
              </button>
              
              <button 
                type="button" 
                onClick={() => setRequires2FA(false)}
                className="w-full text-slate-400 hover:text-slate-600 text-xs font-bold transition-colors"
              >
                Kembali ke Login
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-slate-400 dark:text-slate-600 text-xs font-medium">
          &copy; 2026 Dewan Syariah Nasional - MUI. Seluruh hak cipta dilindungi.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
