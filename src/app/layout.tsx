import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "MUI Naskah Digital",
  description: "Sistem Manajemen Dokumen & Tanda Tangan Digital DSN-MUI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full">
      <body className={`${inter.variable} font-sans min-h-full flex flex-col`}>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
