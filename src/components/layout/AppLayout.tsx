"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAuthStore } from "@/stores/auth.store";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, hasHydrated } = useAuthStore();

  // Protected Routes Check
  useEffect(() => {
    if (!hasHydrated) return;

    const publicPaths = ["/login", "/register", "/forgot-password"];
    if (!isAuthenticated && !publicPaths.includes(pathname)) {
      router.push("/login");
    }
    
    // Redirect authenticated users away from public paths
    if (isAuthenticated && publicPaths.includes(pathname)) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, pathname, router, hasHydrated]);

  // Don't show layout for login/public pages
  const isPublicPage = ["/login", "/register", "/forgot-password"].includes(pathname);

  if (isPublicPage) {
    return <>{children}</>;
  }

  // Loading state or unauthorized
  if (!hasHydrated || (!isAuthenticated && !isPublicPage)) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
