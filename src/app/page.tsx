"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();
  
  useEffect(() => {
    if (!hasHydrated) return;

    if (isAuthenticated) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [isAuthenticated, router, hasHydrated]);

  if (!hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white font-bold text-3xl shadow-xl animate-bounce">
          M
        </div>
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    </div>
  );
}
