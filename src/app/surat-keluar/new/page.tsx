"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FilePlus,
  Upload,
  X,
  Check,
  Loader2,
  AlertCircle,
  FileText,
  ChevronLeft,
  ChevronDown,
  Info,
  MapPin,
  Calendar,
  Layers,
  Plus,
  Trash2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  FileCheck,
  UserCheck,
  Hash,
  RefreshCw
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import SimpleRichEditor from "@/components/SimpleRichEditor";

// List of available templates
const templatesList = [
  { id: "rutin", name: "Surat Rutin Internal" },
  { id: "pengantar", name: "Surat Pengantar Internal" },
  { id: "keputusan", name: "Surat Keputusan" },
  { id: "mandat", name: "Surat Mandat" },
  { id: "tugas", name: "Surat Tugas" },
  { id: "informasi", name: "Surat Informasi" },
];

const CATEGORY_SUBCATEGORIES: Record<string, string[]> = {
  "Rekomendasi DPS": [
    "Rekomendasi DPS (Baru)",
    "Rekomendasi DPS (PAW)",
    "Rekomendasi DPS (Perpanjangan)"
  ],
  "Sertifikat Kesesuaian Syariah": [
    "Penjualan Langsung Berjenjang",
    "Teknologi Informasi",
    "Bank Kustodian",
    "Wisata",
    "Rumah Sakit",
    "Inovasi Keuangan Digital",
    "Klinik dan Lab"
  ],
  "Pernyataan Kesesuaian Syariah": [
    "Bank Indonesia",
    "Kementerian Keuangan",
    "Ikatan Akuntan Indonesia",
    "LKS, LBS dan LPS",
    "Lainnya"
  ],
  "Rekomendasi TAS": [
    "Sukuk Mudharabah",
    "Sukuk Ijarah",
    "TAS SCF",
    "Lainnya"
  ],
  "Silaturahim Stakeholders": [
    "Otoritas",
    "Asosiasi",
    "Industri LKS - Perbankan",
    "Industri LKS - Pasar Modal",
    "Industri LKS - IKNB",
    "Industri LBS",
    "Industri LPS",
    "Lainnya"
  ],
  "Surat Lainnya": [
    "Tidak Berkategori",
    "Surat Perintah Kerja",
    "Penjelasan atas Pengaduan",
    "Konsolidasi MUI dan KBL",
    "Undangan SW Calon DPS",
    "Ucapan Terima Kasih"
  ],
  "Bagian Keuangan DSN-MUI": [
    "Tagihan LKS-LBS-LPS",
    "Tagihan Kontribusi DPS",
    "Tagihan Invoice",
    "Surat Lainnya"
  ]
};

export const DEFAULT_ISI_PERMOHONAN_PKL = `<ol style="margin-top: 4px; margin-bottom: 6px; padding-left: 24px; line-height: 1.35; text-align: justify;">
  <li style="margin-bottom: 6px; text-align: justify;">Sebagai persyaratan kelulusan, setiap peserta diminta melakukan Praktik Kerja Lapangan (PKL) ke Lembaga Keuangan Syariah/Rumah Sakit Syariah 2026.</li>
  <li style="margin-bottom: 6px; text-align: justify;">Dalam kegiatan PKL, peserta akan diminta membuat review terhadap beberapa dokumen pengawasan asli yang menjadi tugas Dewan Pengawas Syariah (DPS) diantaranya : (1) Kontrak Akad, (2) SOP, (3) Laporan Keuangan, (4) Opini DPS dan (5) Dokumen Pemasaran.</li>
</ol>
<p style="text-align: justify; margin-top: 6px; margin-bottom: 6px; text-indent: 0; line-height: 1.35;">
  Sehubungan dengan kegiatan diatas, kami mohon dengan hormat kiranya Bapak/Ibu berkenan memberikan berkas-berkas yang diperlukan untuk peserta berikut melakukan PKL di Lembaga yang Bapak/Ibu pimpin. Adapun identitas peserta adalah:
</p>
<table style="margin-left: 20px; border-collapse: collapse; margin-top: 4px; margin-bottom: 6px; font-size: 10.5pt; line-height: 1.35;">
  <tr>
    <td style="width: 80px; vertical-align: top; padding: 2px 0;">Nama</td>
    <td style="width: 15px; vertical-align: top; padding: 2px 0;">:</td>
    <td style="font-weight: bold; padding: 2px 0;">Nama Peserta</td>
  </tr>
  <tr>
    <td style="vertical-align: top; padding: 2px 0;">Alamat</td>
    <td style="vertical-align: top; padding: 2px 0;">:</td>
    <td style="padding: 2px 0;">Alamat Peserta<br>Alamat Peserta</td>
  </tr>
  <tr>
    <td style="vertical-align: top; padding: 2px 0;">No. Telp</td>
    <td style="vertical-align: top; padding: 2px 0;">:</td>
    <td style="padding: 2px 0;">08xx........</td>
  </tr>
  <tr>
    <td style="vertical-align: top; padding: 2px 0;">E-Mail</td>
    <td style="vertical-align: top; padding: 2px 0;">:</td>
    <td style="padding: 2px 0;">fulan@.....</td>
  </tr>
</table>
<p style="text-align: justify; margin-top: 6px; margin-bottom: 6px; text-indent: 0; line-height: 1.35;">
  Seluruh dokumen yang diberikan ke peserta hanya akan digunakan untuk kepentingan pelatihan dan tidak akan berpengaruh terhadap laporan pengawasan DPS kepada DSN-MUI.
</p>`;

export const DEFAULT_ISI_INFORMASI_PELATIHAN = `<p style="text-align: justify; margin-top: 6px; margin-bottom: 6px; text-indent: 0; line-height: 1.35;">
  Berdasarkan Pelatihan Dasar Muamalah Maliyah dan Fatwa DSN-MUI (PDMMF) Privat yang sudah diikuti oleh Bpk Abdullah Syamsul Arifin, Dewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI) mengadakan Pelatihan Dasar Pengawas Syariah (PDPS) di Lembaga Keuangan Syariah (LKS). Sertifikat pelatihan ini dapat digunakan sebagai syarat mengajukan permohonan Surat Rekomendasi DPS dari DSN-MUI dan/atau mengikuti sertifikasi profesi DPS di Lembaga Sertifikasi Profesi (LSP-MUI). Berikut ini adalah teknis penyelenggaraanya:
</p>
<ol style="margin-top: 4px; margin-bottom: 6px; padding-left: 24px; line-height: 1.35; text-align: justify;">
  <li style="margin-bottom: 6px; text-align: justify;">Pelatihan Privat dilaksanakan dengan minimal 1 orang dan maksimal 5 orang peserta yang mengikuti pelatihan;</li>
  <li style="margin-bottom: 6px; text-align: justify;">Pelatihan dilaksanakan secara daring dengan menggunakan media Google ClassRoom dan Zoom Cloud Meeting (agenda terlampir);</li>
  <li style="margin-bottom: 6px; text-align: justify;">Biaya kontribusi pelatihan adalah Rp. 7.500.000 (Tujuh Juta Lima Ratus Ribu Rupiah/orang/pelatihan;</li>
  <li style="margin-bottom: 6px; text-align: justify;">Jadwal Pelatihan akan diberikan jika peserta sudah mengkonfirmasi keikutsertaan dengan membayar biaya pelatihan;</li>
  <li style="margin-bottom: 6px; text-align: justify;">Dalam pelatihan ini terdapat post-test dan ujian wawancara dimana hanya yang lulus post-test dan wawancara yang mendapatkan sertifikat pelatihan dari DSN-MUI.</li>
  <li style="margin-bottom: 6px; text-align: justify;">Pendaftaran dapat dilakukan dengan menghubungi Sdri. Heny di 0813-1564-5752, Hotline DSN-MUI (HP: 0822 6000 4146)</li>
</ol>`;

export const DEFAULT_LAMPIRAN_INFORMASI_PELATIHAN = `<div style="text-align: center; font-weight: bold; font-size: 11pt; margin-bottom: 12px; letter-spacing: 0.5px;">
  RUNDOWN PDPS
</div>
<table style="width: 100%; border-collapse: collapse; font-size: 9pt; line-height: 1.25; font-family: Arial, sans-serif;">
  <thead>
    <tr style="background-color: #000000; color: #ffffff; text-align: center; font-weight: bold;">
      <th style="border: 1px solid #333; padding: 6px 4px; width: 15%;">Hari, Tanggal</th>
      <th style="border: 1px solid #333; padding: 6px 4px; width: 15%;">Pukul</th>
      <th style="border: 1px solid #333; padding: 6px 4px; width: 12%;">Durasi</th>
      <th style="border: 1px solid #333; padding: 6px 4px; width: 38%;">Materi</th>
      <th style="border: 1px solid #333; padding: 6px 4px; width: 20%;">Media</th>
    </tr>
  </thead>
  <tbody>
    <!-- HARI 1 -->
    <tr>
      <td rowspan="3" style="border: 1px solid #333; padding: 6px; text-align: center; font-weight: bold; background-color: #ffff00; vertical-align: middle;">Hari-1</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #ffff00;">09.00 - 10.00</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #ffff00;"></td>
      <td style="border: 1px solid #333; padding: 4px 6px; font-weight: bold; text-align: center; background-color: #ffff00;">ORIENTASI PELATIHAN</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; font-weight: bold; background-color: #ffff00;">ZOOM CLOUD MEETING</td>
    </tr>
    <tr>
      <td colspan="2" style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #cfe2f3; font-style: italic;">Akses Kelas Online Materi Pengantar &amp; Regulasi Perbankan Syariah</td>
      <td style="border: 1px solid #333; padding: 4px 6px; background-color: #cfe2f3;">Pengantar &amp; Regulasi Perbankan Syariah</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #cfe2f3;">Google Classroom</td>
    </tr>
    <tr>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">19.00 - 21.00</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">90 menit</td>
      <td style="border: 1px solid #333; padding: 4px 6px;">Kuis Materi Pengantar dan Regulasi Perbankan Syariah</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">Google Classroom</td>
    </tr>

    <!-- HARI 2 -->
    <tr>
      <td rowspan="2" style="border: 1px solid #333; padding: 6px; text-align: center; font-weight: bold; vertical-align: middle;">Hari-2</td>
      <td colspan="2" style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #cfe2f3; font-style: italic;">Akses Kelas Online Materi Akuntansi Syariah</td>
      <td style="border: 1px solid #333; padding: 4px 6px; background-color: #cfe2f3;">Materi Akuntansi Syariah</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #cfe2f3;">Google Classroom</td>
    </tr>
    <tr>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">09.00 - 24.00</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">Google Classroom</td>
      <td style="border: 1px solid #333; padding: 4px 6px;">Simulasi Materi Akuntansi Syariah</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">Google Classroom</td>
    </tr>

    <!-- HARI 3 -->
    <tr>
      <td rowspan="2" style="border: 1px solid #333; padding: 6px; text-align: center; font-weight: bold; vertical-align: middle;">Hari-3</td>
      <td colspan="2" style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #cfe2f3; font-style: italic;">Akses Kelas Online Materi Akta Perjanjian &amp; Opini Syariah</td>
      <td style="border: 1px solid #333; padding: 4px 6px; background-color: #cfe2f3;">Materi Akta Perjanjian &amp; Opini Syariah</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #cfe2f3;">Google Classroom</td>
    </tr>
    <tr>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">09.00 - 24.00</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">Google Classroom</td>
      <td style="border: 1px solid #333; padding: 4px 6px;">Simulasi Materi Akta Perjanjian dan Opini Syariah</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">Google Classroom</td>
    </tr>

    <!-- HARI 4 -->
    <tr>
      <td rowspan="3" style="border: 1px solid #333; padding: 6px; text-align: center; font-weight: bold; vertical-align: middle;">Hari-4</td>
      <td colspan="2" style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #cfe2f3; font-style: italic;">Akses Kelas Online SOP &amp; Pemasaran Syariah</td>
      <td style="border: 1px solid #333; padding: 4px 6px; background-color: #cfe2f3;">Materi SOP &amp; Pemasaran Syariah</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #cfe2f3;">Google Classroom</td>
    </tr>
    <tr>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">09.00 - 24.00</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">Google Classroom</td>
      <td style="border: 1px solid #333; padding: 4px 6px;">Simulasi Materi SOP &amp; Pemasaran Syariah</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">Google Classroom</td>
    </tr>
    <tr>
      <td colspan="2" style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #cfe2f3; font-style: italic;">Akses Kelas Online Simulasi Produk Baru dan Evaluasi Uji Petik</td>
      <td style="border: 1px solid #333; padding: 4px 6px; background-color: #cfe2f3;">Simulasi Produk Baru &amp; Evaluasi Uji Petik</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #cfe2f3;">Google Classroom</td>
    </tr>

    <!-- HARI 5 -->
    <tr>
      <td style="border: 1px solid #333; padding: 6px; text-align: center; font-weight: bold;">Hari-5</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">09.00 - 12.00</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">120 menit</td>
      <td style="border: 1px solid #333; padding: 4px 6px; font-weight: bold;">Live Tanya Jawab Materi</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">Zoom Cloud Meeting</td>
    </tr>

    <!-- UJIAN -->
    <tr>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #d9d2e9;">Sesuai kesepakatan</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #d9d2e9;">20.00 - 20.45</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #d9d2e9;">45 menit</td>
      <td style="border: 1px solid #333; padding: 4px 6px; background-color: #d9d2e9;">Ujian Post test</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #d9d2e9;">Zoom Cloud Meeting &amp; G-Form</td>
    </tr>
    <tr>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #d9d2e9;">Sesuai kesepakatan</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #d9d2e9;">20.00 - 20.45</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #d9d2e9;">45 menit</td>
      <td style="border: 1px solid #333; padding: 4px 6px; background-color: #d9d2e9;">Ujian Online HER 1**</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #d9d2e9;">Zoom Cloud Meeting &amp; G-Form</td>
    </tr>
    <tr>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #d9d2e9;">Sesuai kesepakatan</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #d9d2e9;">20.00 - 20.45</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #d9d2e9;">45 menit</td>
      <td style="border: 1px solid #333; padding: 4px 6px; background-color: #d9d2e9;">Ujian Online HER 2**</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #d9d2e9;">Zoom Cloud Meeting &amp; G-Form</td>
    </tr>

    <!-- PKL SECTION -->
    <tr style="background-color: #ffff00; font-weight: bold; text-align: center;">
      <td colspan="5" style="border: 1px solid #333; padding: 5px;">PKL</td>
    </tr>
    <tr>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">***</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">***</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">***</td>
      <td style="border: 1px solid #333; padding: 4px 6px;">Ujian Wawancara</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">Zoom Cloud Meeting</td>
    </tr>
    <tr>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">***</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">***</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">***</td>
      <td style="border: 1px solid #333; padding: 4px 6px;">Ujian HER Wawancara</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">Zoom Cloud Meeting</td>
    </tr>
  </tbody>
</table>`;

export const DEFAULT_ISI_KETERANGAN_WAWANCARA = `<p style="text-align: justify; margin-top: 0; margin-bottom: 6px; line-height: 1.4;">Dewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI) dengan ini menerangkan bahwa pada tanggal 29 April 2026 telah dilakukan wawancara melalui <em>video conference</em> atas nama:</p><table style="margin-left: 20px; border-collapse: collapse; margin-top: 4px; margin-bottom: 10px; font-size: 10.5pt; line-height: 1.35;"><tr><td style="width: 130px; vertical-align: top; padding: 2px 0;">Nama</td><td style="width: 20px; vertical-align: top; padding: 2px 0;">:</td><td style="font-weight: bold; padding: 2px 0;">Ahmad Munif</td></tr><tr><td style="vertical-align: top; padding: 2px 0;">Nomor Pokok</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="font-weight: bold; padding: 2px 0;">24090290001</td></tr><tr><td style="vertical-align: top; padding: 2px 0;">Program Studi</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="font-weight: bold; padding: 2px 0;">Studi Islam (Konsentrasi Hukum Islam)</td></tr><tr><td style="vertical-align: top; padding: 2px 0;">University</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="font-weight: bold; padding: 2px 0;">UIN Walisongo Semarang</td></tr><tr><td style="vertical-align: top; padding: 2px 0;">Keperluan</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="font-weight: bold; padding: 2px 0; text-align: justify;">Penyusunan penelitian Disertasi dengan judul <em>Ijtihad Dalam Fatwa Dewan Syariah Nasional Majelis Ulama Indonesia (DSN-MUI) tentang Transaksi Ekonomi Berbasis Teknologi Digital Perspektif Metodologis</em></td></tr></table><p style="text-align: justify; margin-top: 8px; margin-bottom: 10px; line-height: 1.4;">Demikian Surat Keterangan ini dibuat untuk digunakan sebagaimana mestinya.</p>`;

export const DEFAULT_ISI_KETERANGAN_PELATIHAN = `<p style="text-align: justify; margin-top: 0; margin-bottom: 6px; line-height: 1.4;">Dewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI) dengan ini menerangkan bahwa pada tanggal 10-25 April 2026, telah mengikuti Pelatihan Dasar Muamalah Maliyah dan Fatwa (PDMMF) dan Pelatihan Dasar Pengawas Syariah (PDPS) untuk Lembaga Keuangan Syariah bidang Perbankan peserta atas nama :</p><table style="margin-left: 20px; border-collapse: collapse; margin-top: 4px; margin-bottom: 10px; font-size: 10.5pt; line-height: 1.35;"><tr><td style="width: 110px; vertical-align: top; padding: 2px 0;">Nama</td><td style="width: 20px; vertical-align: top; padding: 2px 0;">:</td><td style="font-weight: bold; padding: 2px 0;">Purmansyah Ariadi</td></tr><tr><td style="vertical-align: top; padding: 2px 0;">Lembaga</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="font-weight: bold; padding: 2px 0;">PT. BPR Syariah Al Falah Banyuasin</td></tr><tr><td style="vertical-align: top; padding: 2px 0;">Alamat</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="font-weight: bold; padding: 2px 0; text-align: justify;">LR.Pasma Putra II NO.43 RT.023 RW.005 Kelurahan 3 Ilir Kecamatan Ilir Timur II Palembang</td></tr><tr><td style="vertical-align: top; padding: 2px 0;">No. HP</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="font-weight: bold; padding: 2px 0;">08163295721</td></tr><tr><td style="vertical-align: top; padding: 2px 0;">Tempat</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="font-weight: bold; padding: 2px 0;">Google Classroom dan Kantor DSN-MUI, Jl. Dempo No. 19 Jakarta</td></tr></table><p style="text-align: justify; margin-top: 8px; margin-bottom: 8px; line-height: 1.4;">Dan berdasarkan ujian pada tahap PDMMF yang telah dilaksanakan pada tanggal 23 April 2026, peserta di atas dinyatakan <strong>TIDAK LULUS</strong> sehingga tidak dapat melanjutkan ujian pada tahap PDPS.</p><p style="text-align: justify; margin-top: 8px; margin-bottom: 10px; line-height: 1.4;">Demikian Surat Keterangan ini diberikan kepada yang bersangkutan untuk dipergunakan sebagaimana mestinya.</p>`;

export const DEFAULT_DAFTAR_UNDANGAN_BPH = `<div style="font-size: 10.5pt; line-height: 1.35;">
  <div style="font-weight: bold; margin-bottom: 4px;">1. Unsur Pimpinan:</div>
  <table style="margin-left: 16px; border-collapse: collapse; font-size: 10.5pt; line-height: 1.35; margin-bottom: 12px;">
    <tr><td style="width: 140px; vertical-align: top; padding: 2px 0;">Ketua</td><td style="width: 15px; vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">K.H. M. Cholil Nafis, Lc., Ph.D.</td></tr>
    <tr><td style="vertical-align: top; padding: 2px 0;">Wakil Ketua</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">Prof. Dr. K.H. Hasanudin, M.Ag.</td></tr>
    <tr><td style="vertical-align: top; padding: 2px 0;">Wakil Ketua</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">K.H. Sholahudin Al Aiyub, M.Si.</td></tr>
    <tr><td style="vertical-align: top; padding: 2px 0;">Wakil Ketua</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">Prof. Dr. K.H. M. Asrorun Ni’am Sholeh, S.H., M.A.</td></tr>
    <tr><td style="vertical-align: top; padding: 2px 0;">Wakil Ketua</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">Ir. H. Adiwarman A. Karim, S.E., M.B.A., M.A.E.P.</td></tr>
    <tr><td style="vertical-align: top; padding: 2px 0;">Sekretaris</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">Dr. H. Amirsyah Tambunan, M.A</td></tr>
    <tr><td style="vertical-align: top; padding: 2px 0;">Wakil Sekretaris</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">Dr. K.H. Moch. Bukhori Muslim, Lc., M.A.</td></tr>
    <tr><td style="vertical-align: top; padding: 2px 0;">Wakil Sekretaris</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">Kanny Hidaya, S.E., M.A.</td></tr>
    <tr><td style="vertical-align: top; padding: 2px 0;">Wakil Sekretaris</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">Dr. Asrori S. Karni, S.Ag., M.H.</td></tr>
    <tr><td style="vertical-align: top; padding: 2px 0;">Wakil Sekretaris</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">Drs. H. Muhammad Ziyad, M.A.</td></tr>
    <tr><td style="vertical-align: top; padding: 2px 0;">Bendahara</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">Hj. Trisna Ningsih Yulati Djuwaeli, S.E., M.M.</td></tr>
    <tr><td style="vertical-align: top; padding: 2px 0;">Wakil Bendahara</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">M. Gunawan Yasni, S.E., Ak., M.M., C.I.F.A., F.I.I.S., C.R.P., C.A.</td></tr>
    <tr><td style="vertical-align: top; padding: 2px 0;">Wakil Bendahara</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">Dr. M. Dawud Arif Khan, S.E., Ak., M.Si., C.P.A. QIA, QGIA.</td></tr>
  </table>
  <div style="font-weight: bold; margin-bottom: 2px;">2. Koordinator Bidang Fatwa</div>
  <div style="margin-left: 16px; margin-bottom: 12px;">Prof. Dr. H. Jaih Mubarok, S.E., M.H., M.Ag.</div>
  <div style="font-weight: bold; margin-bottom: 2px;">3. Koordinator Bidang Layanan, Literasi, Relasi Industri dan Regulasi</div>
  <div style="margin-left: 16px;">Dr. H. Asep Supyadillah, M.Ag.</div>
</div>`;

export const DEFAULT_AGENDA_DETAIL_BPH = `<div style="font-size: 10.5pt; line-height: 1.35; text-align: justify;">
  <div style="font-weight: bold; margin-bottom: 6px;">Pukul 13.00 - 15.00 WIB:</div>
  <ol style="margin-top: 0; margin-bottom: 10px; padding-left: 20px;">
    <li style="margin-bottom: 6px; padding-left: 6px;">Laporan Hasil Pertemuan Silaturahmi DSN-MUI dengan PT. Bank Syariah Indonesia Tbk terkait Permohonan Fatwa DSN-MUI terkait Pengenaan Mu'nah pada Gadai Tabungan Emas BSI oleh PT. Bank Syariah Indonesia dilaporkan oleh Kyai Bukhori Muslim.</li>
    <li style="margin-bottom: 6px; padding-left: 6px;">Laporan Menerima Kunjungan Komisi III DPRD Provinsi Nusa Tenggara Barat dilaporkan oleh Kyai Sholahudin Al Aiyub.</li>
    <li style="margin-bottom: 6px; padding-left: 6px;">Laporan hasil menerima Silaturahim Direksi PT BPD Kalimantan Selatan (Bank Kalsel) pada Jumat, 31 Juli 2026 terkait Permohonan Rekomendasi DPS dilaporkan oleh Ust Adiwarman Karim.</li>
    <li style="margin-bottom: 6px; padding-left: 6px;">Laporan terkait tindaklanjut Permohonan Rekomendasi DPS, TAS, dan Sertifikasi Syariah dan surat masuk (oleh Ust Asep):
      <ol type="a" style="margin-top: 4px; margin-bottom: 4px; padding-left: 18px;">
        <li style="margin-bottom: 4px; padding-left: 4px;">Permohonan Rekomendasi Tim Ahli Syariah Penerbitan Sukuk Mudharabah Berkelanjutan V Tahap III Tahun 2026 dari PT Indah Kiat Pulp & Paper Tbk.</li>
        <li style="margin-bottom: 4px; padding-left: 4px;">Permohonan Rekomendasi Tim Ahli Syariah untuk Penerbitan Sukuk Wakalah bi al-Istitsmar Jangka Menengah I PT Mitra Tekno Madani Tahun 2026 dari PT PNM Investment Management.</li>
        <li style="margin-bottom: 4px; padding-left: 4px;">Invitation to the 7th Centralized Shari’ah Authorities Forum (CSAF) & Islamic Finance Events dari Central Bank of The U.A.E.</li>
        <li style="margin-bottom: 4px; padding-left: 4px;">Laporan Hasil Pelatihan Dasar Muamalah Maliyah dan Fatwa (PDMMF) tanggal 30-31 Juli 2026 di MUI Pusat.</li>
      </ol>
    </li>
    <li style="margin-bottom: 6px; padding-left: 6px;">Dan lain-lain.</li>
  </ol>
  <div style="font-weight: bold; margin-top: 10px; margin-bottom: 4px;">Pukul 15.00 – 15.30 WIB:</div>
  <div style="font-style: italic; margin-left: 20px; margin-bottom: 10px;">Break Sholat Ashar</div>
  <div style="font-weight: bold; margin-top: 10px; margin-bottom: 6px;">Pukul 15.30 – 16.30 WIB:</div>
  <ol start="6" style="margin-top: 0; margin-bottom: 10px; padding-left: 20px;">
    <li style="margin-bottom: 6px; padding-left: 6px;">Silaturahim dan Diskusi Permohonan Pernyataan Kesesuaian Syariah SBSN CWLS Seri SWR007 Tahun 2026 dengan DJPPR Kementerian Keuangan RI.</li>
  </ol>
</div>`;

const DEFAULT_DAFTAR_UNDANGAN_KESEKRETARISAN = `<table style="border-collapse: collapse; font-size: 10.5pt; line-height: 1.35;">
  <tr><td style="width: 140px; vertical-align: top; padding: 2px 0;">Sekretaris</td><td style="width: 15px; vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">Dr. H. Amirsyah Tambunan, M.A</td></tr>
  <tr><td style="vertical-align: top; padding: 2px 0;">Wakil Sekretaris</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">Dr. K.H. Moch. Bukhori Muslim, Lc., M.A.</td></tr>
  <tr><td style="vertical-align: top; padding: 2px 0;">Wakil Sekretaris</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">Kanny Hidaya, S.E., M.A.</td></tr>
  <tr><td style="vertical-align: top; padding: 2px 0;">Wakil Sekretaris</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">Dr. Asrori S. Karni, S.Ag., M.H.</td></tr>
  <tr><td style="vertical-align: top; padding: 2px 0;">Wakil Sekretaris</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">Drs. H. Muhammad Ziyad, M.A.</td></tr>
</table>`;

const DEFAULT_AGENDA_DETAIL_KESEKRETARISAN = `<ol style="margin-top: 0; margin-bottom: 10px; padding-left: 20px; font-size: 10.5pt; line-height: 1.35;">
  <li style="margin-bottom: 6px; padding-left: 6px;">Tindak Lanjut Keputusan Rapat Pimpinan.</li>
  <li style="margin-bottom: 6px; padding-left: 6px;">Pembahasan surat-surat Masuk</li>
  <li style="margin-bottom: 6px; padding-left: 6px;">Dan lain-lain.</li>
</ol>`;

const DEFAULT_ISI_KONTRIBUSI_DPS = `<ol style="margin-top: 0; margin-bottom: 8px; padding-left: 24px; text-align: justify; line-height: 1.35;">
  <li style="margin-bottom: 8px; padding-left: 6px;">
    Rapat Pimpinan DSN-MUI Tanggal 4 Februari 2026 telah menetapkan bahwa setiap DPS memberikan iuran bulanan kepada DSN-MUI, paling sedikit 5% dari penerimaan honor/gaji sebagai DPS. Untuk mendukung pelaksanaan kegiatan dan program DSN-MUI.
  </li>
  <li style="margin-bottom: 8px; padding-left: 6px;">
    Nomor rekening untuk kontribusi DPS dapat menggunakan Virtual Account di PT Bank Syariah Indonesia Tbk. <strong>8316480000000007</strong> atas nama <strong>KH SHOLAHUDIN AL AIYUB MSI</strong>. Jika Virtual Account tersebut bermasalah maka kontribusi dapat transfer ke No. Rek. <strong>1983863270</strong> atas nama <strong>Dewan Syariah Nasional MUI</strong> di Bank Syariah Indonesia dengan memberikan keterangan nama DPS yang bersangkutan.
  </li>
  <li style="margin-bottom: 8px; padding-left: 6px;">
    Untuk memudahkan pencatatan kami di bagian keuangan mohon kiranya, Bapak/Ibu menyampaikan bukti transfernya. Yaitu melalui email <strong>keuangan@dsnmui.or.id</strong> dan <strong>datakeuangandsnmui@gmail.com</strong> atau bisa menghubungi Whastapp Hotline Bagian Keuangan DSN-MUI di <strong>+62 811-9000-3456</strong>.
  </li>
</ol>`;

const DEFAULT_NAMA_TIM_SURAT_TUGAS = `<div style="line-height: 1.25;">
  <div style="font-weight: bold;">1. Penanggung Jawab:</div>
  <div style="margin-left: 16px; margin-bottom: 2px;">
    1) K.H. M. Cholil Nafis, Lc., Ph.D.<br>
    2) Dr. H. Amisyah Tambunan, M.A.<br>
    3) Hj. Trisna Ningsih Yuliati Djuwaeli, S.E., M.M.
  </div>
  <div style="font-weight: bold;">2. Pengarah:</div>
  <div style="margin-left: 16px; margin-bottom: 2px;">
    1) Prof. Dr. K.H. Hasanudin, M.Ag.<br>
    2) Prof. Dr. K.H. M. Asrorun Niam Sholeh, S.H., M.A.<br>
    3) Drs. H. Muhammad Ziyad, M.A.<br>
    4) Prof. Dr. H. Jaih Mubarok, S.E., M.H., M.Ag.
  </div>
  <div style="font-weight: bold;">3. Pelaksana:</div>
  <div style="margin-left: 16px;">
    1) Dr. K.H. Moch. Bukhori Muslim, Lc., M.A.<br>
    2) Dr. Yulizar Djamaluddin Sanrego, M.Ec.<br>
    3) K.H. Mahbub Ma’afi Ramdlan, S.H.I., M.Hum.<br>
    4) K.H. Muhammad Faishol, Lc., M.A.<br>
    5) Ibnu Wazi<br>
    6) Dr. Asep Supyadillah, M.Ag.
  </div>
</div>`;

const DEFAULT_KEPERLUAN_SURAT_TUGAS_TIM = `<p style="margin: 0; line-height: 1.25; text-align: justify;">
  Tim DSN-MUI untuk melakukan kajian permohonan Fatwa terkait Pengenaan Mu’nah Gadai Tabungan Emas BSI dari PT Bank Syariah Indonesia Tbk.
</p>`;

const DEFAULT_KETERANGAN_SURAT_TUGAS_TIM = `<div style="line-height: 1.25;">
  <div>Narahubung</div>
  <div style="font-weight: bold; margin-bottom: 1px;">❖ Sekretariat DSN-MUI</div>
  <table style="border-collapse: collapse; font-size: 9.5pt; line-height: 1.25;">
    <tr>
      <td style="width: 44px; vertical-align: top; padding: 1px 0;">Telp</td>
      <td style="width: 14px; vertical-align: top; padding: 1px 0;">:</td>
      <td style="padding: 1px 0;">0818 404 852 (Kepala Sekretariat, Abdul Wasik, M.Si)</td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 1px 0;">WA</td>
      <td style="vertical-align: top; padding: 1px 0;">:</td>
      <td style="padding: 1px 0;">0822 6000 4146 (Hotline DSN-MUI)</td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 1px 0;">Email</td>
      <td style="vertical-align: top; padding: 1px 0;">:</td>
      <td style="padding: 1px 0;">sekretariat@dsnmui.or.id dan dsnmui@gmail.com</td>
    </tr>
  </table>
</div>`;

// Gregorian to Hijriah date approximation
function getEstimatedHijriah(gregorianDateString: string): string {
  if (!gregorianDateString) return "";
  const date = new Date(gregorianDateString);
  if (isNaN(date.getTime())) return "";

  let m = date.getMonth() + 1;
  let d = date.getDate();
  let y = date.getFullYear();
  if (m < 3) {
    y -= 1;
    m += 12;
  }
  let a = Math.floor(y / 100);
  let b = Math.floor(a / 4);
  let c = 2 - a + b;
  let e = Math.floor(365.25 * (y + 4716));
  let f = Math.floor(30.6001 * (m + 1));
  let jd = c + d + e + f - 1524.5;

  let epoch = 1948439.5;
  let diff = jd - epoch;
  let cyc = Math.floor(diff / 10631);
  diff = diff % 10631;
  let yoffset = Math.floor((diff * 30 + 11) / 10631);
  let hy = cyc * 30 + yoffset + 1;
  let dayoffset = Math.floor(diff - Math.floor((yoffset * 10631 + 14) / 30) + 354);

  let months = [
    "Muharram", "Safar", "Rabi'ul Awwal", "Rabi'ul Akhir",
    "Jumadil Awwal", "Jumadil Akhir", "Rajab", "Sya'ban",
    "Ramadhan", "Syawwal", "Dzulqa'dah", "Dzulhijjah"
  ];
  let hm = 0;
  let hd = 0;
  let sum = 0;

  for (let i = 0; i < 12; i++) {
    let isLeap = ((hy * 11 + 14) % 30) < 11;
    let length = (i % 2 === 0) ? 30 : 29;
    if (i === 11 && isLeap) length = 30;

    if (dayoffset < sum + length) {
      hm = i;
      hd = Math.floor(dayoffset - sum + 1);
      break;
    }
    sum += length;
  }

  return `${hd} ${months[hm]} ${hy} H`;
}

const getDefaultTemplateBody = (id: string): string => {
  switch (id) {
    case "rutin":
      return `
        <p>Dengan hormat,</p>
        <p>Sehubungan dengan kelancaran koordinasi program kerja antar unit, kami mengharapkan kehadiran seluruh Kepala Bidang dan staff terkait pada pertemuan koordinasi rutin yang akan diselenggarakan pada:</p>
        <table style="width: 100%; margin: 12px 0; border-collapse: collapse;">
          <tbody>
            <tr><td style="width: 25%; padding: 4px 0; font-weight: bold;">Hari, Tanggal</td><td>: Senin, 8 Juni 2026</td></tr>
            <tr><td style="padding: 4px 0; font-weight: bold;">Waktu</td><td>: 09.00 WIB - Selesai</td></tr>
            <tr><td style="padding: 4px 0; font-weight: bold;">Tempat</td><td>: Ruang Rapat Utama Lt. 2</td></tr>
            <tr><td style="padding: 4px 0; font-weight: bold;">Agenda</td><td>: Koordinasi Kerja & Evaluasi Bulanan</td></tr>
          </tbody>
        </table>
        <p>Demikian undangan ini kami sampaikan. Mengingat pentingnya agenda tersebut, kehadiran dan partisipasi aktif Bapak/Ibu sangat diharapkan. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.</p>
      `;
    case "pengantar":
      return `
        <p>Dengan hormat,</p>
        <p>Bersama ini kami kirimkan dokumen-dokumen internal organisasi berikut untuk dapat dipergunakan sebagaimana mestinya:</p>
        <table style="width: 100%; margin: 12px 0; border: 1px solid #cbd5e1; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f8fafc;">
              <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; width: 8%;">No</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Nama Dokumen</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; width: 15%;">Jumlah</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">1</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px;">Laporan Keuangan Kuartal I</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">1 Rangkap</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px;">Mohon ditandatangani</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">2</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px;">Proposal Program Pelatihan</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">2 Bundel</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px;">Arsip Unit Kerja</td>
            </tr>
          </tbody>
        </table>
        <p>Demikian pengantar ini disampaikan, mohon penerimaan dokumen dapat dikonfirmasi kembali kepada sekretariat kami. Atas perhatian dan kerjasamanya kami ucapkan terima kasih.</p>
      `;
    case "keputusan":
      return `
        <p style="text-align: center; font-weight: bold; margin-bottom: 16px;">TENTANG<br>PENGANGKATAN PENGURUS UNIT KERJA DIGITALISASI</p>
        <p style="font-weight: bold; text-decoration: underline; margin-top: 12px;">Menimbang:</p>
        <ol style="margin-left: 20px; list-style-type: lower-alpha; padding-left: 0;">
          <li>Bahwa demi kelancaran administrasi persuratan digital, dipandang perlu untuk membentuk unit kerja khusus;</li>
          <li>Bahwa nama yang tercantum di bawah ini dinilai cakap untuk melaksanakan tugas pengurus unit kerja digitalisasi.</li>
        </ol>
        <p style="font-weight: bold; text-decoration: underline; margin-top: 12px;">Mengingat:</p>
        <ol style="margin-left: 20px; list-style-type: decimal; padding-left: 0;">
          <li>Anggaran Dasar dan Anggaran Rumah Tangga organisasi;</li>
          <li>Peraturan Organisasi tentang Tata Kelola Surat Digital Tahun 2026.</li>
        </ol>
        <p style="text-align: center; font-weight: bold; margin-top: 20px; text-transform: uppercase;">MEMUTUSKAN</p>
        <p style="font-weight: bold; text-decoration: underline; margin-top: 12px;">Menetapkan:</p>
        <ol style="margin-left: 20px; list-style-type: decimal; padding-left: 0;">
          <li>Mengangkat saudara yang namanya tertera pada lampiran keputusan ini sebagai Pengurus Unit Kerja Digitalisasi;</li>
          <li>Keputusan ini berlaku sejak tanggal ditetapkan dengan ketentuan apabila terdapat kekeliruan akan diperbaiki sebagaimana mestinya.</li>
        </ol>
      `;
    case "mandat":
      return `
        <p>Dengan hormat,</p>
        <p>Yang bertanda tangan di bawah ini memberikan mandat sepenuhnya kepada:</p>
        <table style="width: 100%; margin: 12px 0; border-collapse: collapse;">
          <tbody>
            <tr><td style="width: 25%; padding: 4px 0; font-weight: bold;">Nama</td><td>: Ahmad Syaifuddin, M.Si.</td></tr>
            <tr><td style="padding: 4px 0; font-weight: bold;">Jabatan</td><td>: Kepala Hubungan Masyarakat</td></tr>
            <tr><td style="padding: 4px 0; font-weight: bold;">Alamat</td><td>: Jl. Kramat Raya No. 164, Jakarta Pusat</td></tr>
          </tbody>
        </table>
        <p>Untuk bertindak selaku perwakilan organisasi dalam menghadiri rapat koordinasi nasional dan mengambil keputusan-keputusan strategis administratif yang berkaitan dengan integrasi layanan publik digital.</p>
        <p>Demikian surat mandat ini dibuat untuk dipergunakan dengan penuh tanggung jawab oleh penerima mandat.</p>
      `;
    case "tugas":
      return `
        <p style="text-align: justify; text-indent: 30px; margin-bottom: 8px;">Menunjuk surat dari Lembaga Penggerak Ekonomi Umat (LPEU) Majelis Ulama Indonesia No. A-120/LPEU MUI/VII/2026 tertanggal 28 Juli 2026, dan berdasarkan keputusan Rapat Kesekretarisan Dewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI) tanggal 6 Agustus 2026, DSN-MUI dengan ini <strong>menugaskan</strong> kepada:</p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
          <tbody>
            <tr>
              <td style="width: 100px; vertical-align: top; padding: 2px 0;">Nama</td>
              <td style="width: 15px; vertical-align: top; padding: 2px 0;">:</td>
              <td style="padding: 2px 0;">
                <div>1. Ibnu Wazi<br/>&nbsp;&nbsp;&nbsp;(Anggota Bidang Fatwa)</div>
                <div style="margin-top: 4px;">2. Dr. Nofrianto, M.Ag., CM.<br/>&nbsp;&nbsp;&nbsp;(Anggota Bidang Layanan, Literasi, Relasi Industri, dan Regulasi)</div>
              </td>
            </tr>
            <tr>
              <td style="vertical-align: top; padding: 4px 0 2px 0;">Keperluan</td>
              <td style="vertical-align: top; padding: 4px 0 2px 0;">:</td>
              <td style="padding: 4px 0 2px 0;">
                menghadiri kegiatan <em>Risk Based Performance Management Training</em>, yang diselenggarakan oleh LPEU MUI, yang insyaAllah dilaksanakan pada:
                <table style="width: 100%; border-collapse: collapse; margin-top: 4px;">
                  <tr><td style="width: 100px; font-weight: bold; padding: 2px 0;">Hari, tanggal</td><td style="width: 15px; font-weight: bold; padding: 2px 0;">:</td><td style="font-weight: bold; padding: 2px 0;">Jumat-Sabtu, 7-8 Agustus 2026</td></tr>
                  <tr><td style="font-weight: bold; padding: 2px 0;">Waktu</td><td style="font-weight: bold; padding: 2px 0;">:</td><td style="font-weight: bold; padding: 2px 0;">08.00 WIB - selesai (<em>Rundown</em> acara terlampir)</td></tr>
                  <tr><td style="font-weight: bold; padding: 2px 0;">Tempat</td><td style="font-weight: bold; padding: 2px 0;">:</td><td style="font-weight: bold; padding: 2px 0;">Aula Buya Hamka Gedung MUI Pusat<br/>Jl. Proklamasi 51, Menteng, Jakarta Pusat</td></tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="vertical-align: top; padding: 4px 0 2px 0;">Keterangan</td>
              <td style="vertical-align: top; padding: 4px 0 2px 0;">:</td>
              <td style="padding: 4px 0 2px 0;">
                <div>Narahubung:</div>
                <div style="margin-top: 2px;">
                  <strong>❖ Sekretariat DSN-MUI</strong><br/>
                  Telp./WA: 0818 404 852 (Sdr. Abdul Wasik, M.Si) | Hotline: 0822 6000 4146<br/>
                  Email: sekretariat@dsnmui.or.id / dsnmui@gmail.com
                </div>
                <div style="margin-top: 4px;">
                  <strong>❖ LPEU MUI</strong><br/>
                  Telp.: 0812 1569 7070 (Admin WA LPEU MUI)<br/>
                  Email: lpeu.mui.pusat@gmail.com
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <p style="text-align: justify; text-indent: 30px; margin-top: 6px; margin-bottom: 6px;">Demikian Surat Tugas ini diberikan kepada yang bersangkutan untuk dilaksanakan sebagaimana mestinya dan melaporkan hasilnya kepada Pimpinan DSN-MUI.</p>
        <p style="text-align: justify; text-indent: 30px; margin-top: 0; margin-bottom: 8px;">Apabila dalam penugasan ini terdapat kekeliruan, atau ada kebutuhan organisasi, akan diperbaiki sebagaimana mestinya.</p>
      `;
    case "informasi":
      return `
        <p>Kepada Yth. Seluruh Anggota dan Mitra Kerja,</p>
        <p>Diberitahukan bahwa dalam rangka libur nasional dan cuti bersama Hari Raya Idul Adha 1447 H, aktivitas pelayanan kesekretariatan dan administrasi kantor pusat akan diliburkan sementara pada:</p>
        <table style="width: 100%; margin: 12px 0; border-collapse: collapse;">
          <tbody>
            <tr><td style="width: 25%; padding: 4px 0; font-weight: bold;">Hari/Tanggal</td><td>: Kamis s.d. Minggu, 28 s.d. 31 Mei 2026</td></tr>
            <tr><td style="padding: 4px 0; font-weight: bold;">Pelayanan Kembali</td><td>: Senin, 1 Juni 2026</td></tr>
          </tbody>
        </table>
        <p>Selama masa libur tersebut, koordinasi penting darurat dapat dilakukan secara online melalui perwakilan bidang masing-masing. Demikian pengumuman ini disampaikan untuk diketahui bersama.</p>
      `;
    default:
      return "<p>Silakan isi detail isi surat di sini...</p>";
  }
};

const toDataURL = (url: string): Promise<string> =>
  fetch(url)
    .then(response => response.blob())
    .then(blob => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    }));

const CreateDocumentPage = () => {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);

  const [logoBase64, setLogoBase64] = useState<string>("");
  const [kopSuratBase64, setKopSuratBase64] = useState<string>("");
  const [bismillahBase64, setBismillahBase64] = useState<string>("");
  const [wqaUkasBase64, setWqaUkasBase64] = useState<string>("");

  useEffect(() => {
    toDataURL("/images/logo-dsn.png")
      .then(base64 => setLogoBase64(base64))
      .catch(err => console.warn("Failed to convert logo to base64", err));
    toDataURL("/images/kop-surat.png")
      .then(base64 => setKopSuratBase64(base64))
      .catch(err => console.warn("Failed to convert kop surat to base64", err));
    toDataURL("/images/bismillah.svg")
      .then(base64 => setBismillahBase64(base64))
      .catch(err => console.warn("Failed to convert bismillah to base64", err));
    toDataURL("/images/wqa-ukas.png")
      .then(base64 => setWqaUkasBase64(base64))
      .catch(err => console.warn("Failed to convert wqa-ukas to base64", err));
  }, []);

  // Core Metadata States
  const [categories, setCategories] = useState<any[]>([]);
  const [classifications, setClassifications] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // Mode Selection State
  const [creationMode, setCreationMode] = useState<"upload" | "template">("upload");

  // Mode 1: Upload States
  const [title, setTitle] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [classificationId, setClassificationId] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Mode 2: Template States
  const [dbTemplates, setDbTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("SK-RUTIN");
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});

  const EDITOR_TEMPLATES = ["SK-RUTIN", "SK-PENGANTAR", "SK-KEPUTUSAN", "SK-MANDAT", "SK-TUGAS", "SK-INFORMASI", "rutin", "pengantar", "keputusan", "mandat", "tugas", "informasi"];

  const getLegacyId = (val: string) => {
    const mapping: Record<string, string> = {
      "SK-RUTIN": "rutin",
      "SK-PENGANTAR": "pengantar",
      "SK-KEPUTUSAN": "keputusan",
      "SK-MANDAT": "mandat",
      "SK-TUGAS": "tugas",
      "SK-INFORMASI": "informasi"
    };
    return mapping[val] || val;
  };

  const selectedTemplateObj = React.useMemo(() => {
    const found = dbTemplates.find(t => t.code === selectedTemplate);
    if (!found) return null;
    let vars = found.variables;
    if (typeof vars === "string") {
      try {
        vars = JSON.parse(vars);
      } catch {
        vars = [];
      }
    }
    return {
      ...found,
      variables: Array.isArray(vars) ? vars : []
    };
  }, [dbTemplates, selectedTemplate]);
  const isEditorMode = selectedTemplateObj ? EDITOR_TEMPLATES.includes(selectedTemplateObj.code) : true;

  const [tempatDibuat, setTempatDibuat] = useState("Jakarta");
  const [tanggalMasehi, setTanggalMasehi] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [tanggalHijriah, setTanggalHijriah] = useState(() => {
    const today = new Date();
    return getEstimatedHijriah(today.toISOString().split("T")[0]);
  });
  const [perihal, setPerihal] = useState("");
  const [lampiran, setLampiran] = useState("");
  const [dokumenPendukung, setDokumenPendukung] = useState<File | null>(null);
  const [catatan, setCatatan] = useState("");
  
  // Nested Workflow states: Pemparaf, Approver, Penandatangan
  const [pemparafList, setPemparafList] = useState<{ userId: string }[]>([]);
  const [approverList, setApproverList] = useState<{ userId: string }[]>([]);
  const [penandatanganList, setPenandatanganList] = useState<{ userId: string }[]>([{ userId: "" }]);

  // Workflow Helper Handlers
  const handleAddPemparaf = () => setPemparafList(prev => [...prev, { userId: "" }]);
  const handleRemovePemparaf = (index: number) => setPemparafList(prev => prev.filter((_, i) => i !== index));
  const handlePemparafChange = (index: number, val: string) => {
    setPemparafList(prev => {
      const next = [...prev];
      next[index] = { ...next[index], userId: val };
      return next;
    });
    clearFieldError("steps");
  };

  const handleAddApprover = () => setApproverList(prev => [...prev, { userId: "" }]);
  const handleRemoveApprover = (index: number) => setApproverList(prev => prev.filter((_, i) => i !== index));
  const handleApproverChange = (index: number, val: string) => {
    setApproverList(prev => {
      const next = [...prev];
      next[index] = { ...next[index], userId: val };
      return next;
    });
    clearFieldError("steps");
  };

  const handleAddPenandatangan = () => setPenandatanganList(prev => [...prev, { userId: "" }]);
  const handleRemovePenandatangan = (index: number) => {
    if (penandatanganList.length === 1) return;
    setPenandatanganList(prev => prev.filter((_, i) => i !== index));
  };
  const handlePenandatanganChange = (index: number, val: string) => {
    setPenandatanganList(prev => {
      const next = [...prev];
      next[index] = { ...next[index], userId: val };
      return next;
    });
    clearFieldError("steps");
  };

  const getAllWorkflowSteps = useCallback(() => {
    const all: { userId: string; role: "PEMPARAF" | "APPROVER" | "PENANDATANGAN" }[] = [];
    pemparafList.forEach(p => {
      if (p.userId) all.push({ userId: p.userId, role: "PEMPARAF" });
    });
    approverList.forEach(a => {
      if (a.userId) all.push({ userId: a.userId, role: "APPROVER" });
    });
    penandatanganList.forEach(s => {
      if (s.userId) all.push({ userId: s.userId, role: "PENANDATANGAN" });
    });
    return all;
  }, [pemparafList, approverList, penandatanganList]);

  const [activeTab, setActiveTab] = useState<"info" | "detail" | "variables" | "signers">("info");

  // Reset activeTab if selected template is standard editor template
  useEffect(() => {
    if (isEditorMode && activeTab === "variables") {
      setActiveTab("info");
    }
  }, [isEditorMode, activeTab]);

  const tabs = [
    { id: "info", label: "Informasi Utama", icon: FileText },
    { id: "detail", label: "Detail & Lampiran", icon: MapPin },
    ...(!isEditorMode ? [{ id: "variables", label: "Variabel Konten", icon: Layers }] : []),
    { id: "signers", label: "Alur Penandatangan", icon: UserCheck }
  ];


  // Generated Document Number State
  const [generatedDocNumber, setGeneratedDocNumber] = useState("");
  const [loadingDocNumber, setLoadingDocNumber] = useState(false);

  // Upload/Processing States
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Fetch Meta & Users
  useEffect(() => {
    const fetchMetaAndUsers = async () => {
      try {
        const [metaRes, usersRes, templatesRes] = await Promise.all([
          api.get("/documents/meta"),
          api.get("/users"),
          api.get("/letter-templates"),
        ]);
        setCategories(metaRes.data.data.categories);
        setClassifications(metaRes.data.data.classifications);
        setUsers(usersRes.data.data || []);

        const templatesData = templatesRes.data.data || [];
        setDbTemplates(templatesData);
        const defaultTpl = templatesData.find((t: any) => t.code === "SK-RUTIN") || templatesData[0];
        if (defaultTpl) {
          setSelectedTemplate(defaultTpl.code);
        }

        // Auto select first Category and Classification in state
        if (metaRes.data.data.categories?.length > 0) {
          setCategoryId(metaRes.data.data.categories[0].id);
        }
        if (metaRes.data.data.classifications?.length > 0) {
          setClassificationId(metaRes.data.data.classifications[0].id);
        }
      } catch (err) {
        setError("Gagal memuat metadata dokumen atau daftar user");
      } finally {
        setLoadingMeta(false);
      }
    };
    fetchMetaAndUsers();
  }, []);

  // Update default letter body when template changes
  useEffect(() => {
    if (editorRef.current && creationMode === "template" && isEditorMode) {
      editorRef.current.innerHTML = getDefaultTemplateBody(getLegacyId(selectedTemplate));
    }
  }, [selectedTemplate, creationMode, isEditorMode]);

  // Auto-generate document number when template changes or mode switches to template
  const fetchDocNumber = useCallback(async (templateCode: string) => {
    setLoadingDocNumber(true);
    try {
      const legacyMap: Record<string, string> = {
        "SK-RUTIN": "rutin",
        "SK-PENGANTAR": "pengantar",
        "SK-KEPUTUSAN": "keputusan",
        "SK-MANDAT": "mandat",
        "SK-TUGAS": "tugas",
        "SK-INFORMASI": "informasi"
      };
      const apiCode = legacyMap[templateCode] || templateCode;
      const res = await api.get("/documents/generate-number", { params: { templateCode: apiCode } });
      
      const monthRoman = res.data.data.month || "VIII";
      const currentYear = res.data.data.year || new Date().getFullYear();
      const systemSequence = res.data.data.sequenceNumber || "001";
      
      const match = templateCode.match(/^([A-Za-z])-(\d+)/);
      if (match) {
        const prefix = match[1].toUpperCase();
        const seq = match[2];
        setGeneratedDocNumber(`${prefix}-${seq}/DSN-MUI/${monthRoman}/${currentYear}`);
      } else {
        const seqPadded = systemSequence.toString().padStart(4, "0");
        setGeneratedDocNumber(`U-${seqPadded}/DSN-MUI/${monthRoman}/${currentYear}`);
      }
    } catch (err) {
      console.error("Gagal generate nomor surat:", err);
      // Fallback: generate client-side
      const now = new Date();
      const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
      const monthRoman = romanMonths[now.getMonth()];
      const currentYear = now.getFullYear();
      
      const match = templateCode.match(/^([A-Za-z])-(\d+)/);
      if (match) {
        const prefix = match[1].toUpperCase();
        const seq = match[2];
        setGeneratedDocNumber(`${prefix}-${seq}/DSN-MUI/${monthRoman}/${currentYear}`);
      } else {
        setGeneratedDocNumber(`U-0001/DSN-MUI/${monthRoman}/${currentYear}`);
      }
    } finally {
      setLoadingDocNumber(false);
    }
  }, []);

  useEffect(() => {
    if (creationMode === "template") {
      fetchDocNumber(selectedTemplate);
    }
  }, [selectedTemplate, creationMode, fetchDocNumber]);

  // Auto-populate default perihal when selectedTemplate changes
  useEffect(() => {
    if (selectedTemplate) {
      if (selectedTemplate === "UNDANGAN-FATWA") {
        setPerihal("Undangan Rapat Bidang Fatwa DSN-MUI");
      } else if (selectedTemplate === "U-0643-UNDANGAN-KESEKRETARISAN") {
        setPerihal("Undangan Rapat Kesekretarisan Badan Pengurus DSN-MUI");
        setLampiran("1 (satu) berkas");
      } else if (selectedTemplate === "U-0638-UNDANGAN-BPH") {
        setPerihal("Undangan Rapat Pimpinan Badan Pengurus DSN-MUI");
        setLampiran("1 (satu) berkas");
      } else if (selectedTemplate === "U-0667-UNDANGAN-LAYANAN") {
        setPerihal("Undangan Rapat Bidang Layanan, Literasi, Relasi Industri, dan Regulasi DSN-MUI");
      } else if (selectedTemplate === "U-0000-PERMOHONAN-PKL") {
        setPerihal("Permohonan Dokumen Untuk Praktik Kerja Lapangan (PKL)");
        setLampiran("-----");
      } else if (selectedTemplate === "U-0617-INFORMASI-PELATIHAN") {
        setPerihal("Penyampaian Informasi terkait Pelatihan PDPS Privat");
        setLampiran("1 (satu) lembar");
      } else if (selectedTemplate === "U-0541-KETERANGAN-WAWANCARA") {
        setPerihal("Surat Keterangan Wawancara");
        setLampiran("-----");
      } else if (selectedTemplate === "U-0563-KETERANGAN-PELATIHAN") {
        setPerihal("Surat Keterangan Mengikuti Pelatihan");
        setLampiran("-----");
      } else if (selectedTemplate === "ST-0663-TUGAS-TIM") {
        setPerihal("Surat Tugas Tim");
        setLampiran("-----");
      } else if (selectedTemplate === "ST-0650-TUGAS") {
        setPerihal("Surat Tugas DSN-MUI");
        setLampiran("-----");
      } else if (selectedTemplate === "U-0477-KONTRIBUSI-DPS") {
        setPerihal("Surat Edaran Iuran Bulanan Dewan Pengawas Syariah (DPS)");
        setLampiran("----");
      }
    }
  }, [selectedTemplate]);

  // When selectedTemplate changes, reset template variables to the new template defaults
  const prevTemplateRef = useRef(selectedTemplate);
  useEffect(() => {
    if (prevTemplateRef.current !== selectedTemplate) {
      prevTemplateRef.current = selectedTemplate;
      if (selectedTemplateObj && Array.isArray(selectedTemplateObj.variables)) {
        setTemplateVariables((prev) => {
          const updated: Record<string, string> = { ...prev };
          for (const v of selectedTemplateObj.variables) {
            if (v.defaultValue) {
              updated[v.key] = v.defaultValue;
            }
          }
          return updated;
        });
      }
    }
  }, [selectedTemplate, selectedTemplateObj]);

  // Sync template variables when selectedTemplateObj or metadata fields change
  useEffect(() => {
    if (!selectedTemplateObj) return;

    const newVars = { ...templateVariables };
    let updated = false;

    const setVar = (key: string, val: string) => {
      if (newVars[key] !== val) {
        newVars[key] = val;
        updated = true;
      }
    };

    if (selectedTemplateObj.variables?.some((v: any) => v.key === "nomorSurat")) {
      setVar("nomorSurat", generatedDocNumber);
    }
    if (selectedTemplateObj.variables?.some((v: any) => v.key === "perihal")) {
      setVar("perihal", perihal);
    }
    if (selectedTemplateObj.variables?.some((v: any) => v.key === "lampiran")) {
      setVar("lampiran", lampiran || "—");
    }
    if (selectedTemplateObj.variables?.some((v: any) => v.key === "tempatDibuat")) {
      setVar("tempatDibuat", tempatDibuat);
    }
    if (selectedTemplateObj.variables?.some((v: any) => v.key === "tanggalSurat")) {
      const formattedDate = new Date(tanggalMasehi).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const withM = formattedDate.endsWith(" M") ? formattedDate : `${formattedDate} M`;
      setVar("tanggalSurat", withM);
    }
    if (selectedTemplateObj.variables?.some((v: any) => v.key === "tanggalMasehi")) {
      const formattedDate = new Date(tanggalMasehi).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const withM = formattedDate.endsWith(" M") ? formattedDate : `${formattedDate} M`;
      setVar("tanggalMasehi", withM);
    }
    if (selectedTemplateObj.variables?.some((v: any) => v.key === "tanggalHijriah")) {
      setVar("tanggalHijriah", tanggalHijriah);
    }

    // Default template variables for signers and standard fields
    if (selectedTemplateObj.variables?.some((v: any) => v.key === "tempatPenerima")) {
      if (!newVars.tempatPenerima || newVars.tempatPenerima.trim() === "") {
        setVar("tempatPenerima", "TEMPAT");
      }
    }
    if (selectedTemplateObj.variables?.some((v: any) => v.key === "alamatLembaga")) {
      if (!newVars.alamatLembaga || newVars.alamatLembaga.trim() === "") {
        setVar("alamatLembaga", "TEMPAT");
      }
    }
    if (selectedTemplateObj.variables?.some((v: any) => v.key === "kota_tujuan")) {
      if (!newVars.kota_tujuan || newVars.kota_tujuan.trim() === "") {
        setVar("kota_tujuan", "TEMPAT");
      }
    }
    if (selectedTemplateObj.variables?.some((v: any) => v.key === "headerTtd")) {
      if (!newVars.headerTtd || newVars.headerTtd.trim() === "") {
        setVar("headerTtd", "BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA");
      }
    }
    if (selectedTemplate === "U-0000-PERMOHONAN-PKL") {
      if (!newVars.jabatanKiri || newVars.jabatanKiri === "Ketua") {
        setVar("jabatanKiri", "Wakil Ketua");
      }
      if (!newVars.namaKiri || newVars.namaKiri === "K.H. M. CHOLIL NAFIS, Lc., Ph.D." || newVars.namaKiri.includes("M.A.E.P.")) {
        setVar("namaKiri", "Ir. H. ADIWARMAN A. KARIM, S.E., M.B.A.");
      }
      if (!newVars.jabatanKanan || newVars.jabatanKanan === "Sekretaris") {
        setVar("jabatanKanan", "Wakil Sekretaris");
      }
      if (!newVars.namaKanan || newVars.namaKanan === "Dr. H. AMIRSYAH TAMBUNAN, M.A.") {
        setVar("namaKanan", "Dr. ASRORI S. KARNI, S.Ag., M.H.");
      }
      const isBlankIsiSurat =
        !newVars.isiSurat ||
        newVars.isiSurat.trim() === "" ||
        newVars.isiSurat === "<p></p>" ||
        newVars.isiSurat === "<p><br></p>" ||
        newVars.isiSurat === "<p>&nbsp;</p>" ||
        newVars.isiSurat.trim() === "<br>";
      if (isBlankIsiSurat) {
        setVar("isiSurat", DEFAULT_ISI_PERMOHONAN_PKL);
      }
    } else if (selectedTemplate === "U-0617-INFORMASI-PELATIHAN") {
      if (!newVars.jabatanKiri || newVars.jabatanKiri === "Ketua") {
        setVar("jabatanKiri", "Wakil Ketua");
      }
      if (!newVars.namaKiri || newVars.namaKiri === "K.H. M. CHOLIL NAFIS, Lc., Ph.D.") {
        setVar("namaKiri", "Ir. H. ADIWARMAN A. KARIM, S.E., M.B.A., M.A.E.P.");
      }
      if (!newVars.jabatanKanan || newVars.jabatanKanan === "Sekretaris") {
        setVar("jabatanKanan", "Wakil Sekretaris");
      }
      if (!newVars.namaKanan || newVars.namaKanan === "Dr. H. AMIRSYAH TAMBUNAN, M.A.") {
        setVar("namaKanan", "Dr. ASRORI S. KARNI, S.Ag., M.H.");
      }
      if (!newVars.penerimaSurat || newVars.penerimaSurat === "Jabatan\nNama Lembaga") {
        setVar("penerimaSurat", "VP Unit Usaha Syariah\nPT. Bank Jatim");
      }
      const isBlankIsiSurat =
        !newVars.isiSurat ||
        newVars.isiSurat.trim() === "" ||
        newVars.isiSurat === "<p></p>" ||
        newVars.isiSurat === "<p><br></p>" ||
        newVars.isiSurat === "<p>&nbsp;</p>" ||
        newVars.isiSurat.trim() === "<br>";
      if (isBlankIsiSurat) {
        setVar("isiSurat", DEFAULT_ISI_INFORMASI_PELATIHAN);
      }
      if (!newVars.lampiranKonten || newVars.lampiranKonten.trim() === "") {
        setVar("lampiranKonten", DEFAULT_LAMPIRAN_INFORMASI_PELATIHAN);
      }
      if (!newVars.lampiranDisplay) {
        setVar("lampiranDisplay", "block");
      }
    } else if (selectedTemplate === "U-0541-KETERANGAN-WAWANCARA") {
      if (!newVars.jabatanKiri || newVars.jabatanKiri === "Ketua") {
        setVar("jabatanKiri", "Wakil Ketua");
      }
      if (!newVars.namaKiri || newVars.namaKiri === "K.H. M. CHOLIL NAFIS, Lc., Ph.D.") {
        setVar("namaKiri", "Ir. H. ADIWARMAN A. KARIM, S.E., M.B.A., M.A.E.P.");
      }
      if (!newVars.jabatanKanan || newVars.jabatanKanan === "Sekretaris") {
        setVar("jabatanKanan", "Wakil Sekretaris");
      }
      if (!newVars.namaKanan || newVars.namaKanan === "Dr. H. AMIRSYAH TAMBUNAN, M.A.") {
        setVar("namaKanan", "Dr. ASRORI S. KARNI, S.Ag., M.H.");
      }
      if (!newVars.headerTtd || newVars.headerTtd.trim() === "" || newVars.headerTtd.includes("-")) {
        setVar("headerTtd", "BADAN PENGURUS\nDEWAN SYARIAH NASIONAL\nMAJELIS ULAMA INDONESIA");
      }
      const isBlankIsiSurat =
        !newVars.isiSurat ||
        newVars.isiSurat.trim() === "" ||
        newVars.isiSurat === "<p></p>" ||
        newVars.isiSurat === "<p><br></p>" ||
        newVars.isiSurat === "<p>&nbsp;</p>" ||
        newVars.isiSurat.trim() === "<br>";
      if (isBlankIsiSurat) {
        setVar("isiSurat", DEFAULT_ISI_KETERANGAN_WAWANCARA);
      }
      if (!newVars.lampiranDisplay) {
        setVar("lampiranDisplay", "none");
      }
    } else if (selectedTemplate === "U-0563-KETERANGAN-PELATIHAN") {
      if (!newVars.jabatanKiri || newVars.jabatanKiri === "Ketua") {
        setVar("jabatanKiri", "Wakil Ketua");
      }
      if (!newVars.namaKiri || newVars.namaKiri === "K.H. M. CHOLIL NAFIS, Lc., Ph.D.") {
        setVar("namaKiri", "Ir. H. ADIWARMAN A. KARIM, S.E., M.B.A., M.A.E.P.");
      }
      if (!newVars.jabatanKanan || newVars.jabatanKanan === "Sekretaris") {
        setVar("jabatanKanan", "Wakil Sekretaris");
      }
      if (!newVars.namaKanan || newVars.namaKanan === "Dr. H. AMIRSYAH TAMBUNAN, M.A.") {
        setVar("namaKanan", "Dr. ASRORI S. KARNI, S.Ag., M.H.");
      }
      if (!newVars.headerTtd || newVars.headerTtd.trim() === "") {
        setVar("headerTtd", "BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA");
      }
      const isBlankIsiSurat =
        !newVars.isiSurat ||
        newVars.isiSurat.trim() === "" ||
        newVars.isiSurat === "<p></p>" ||
        newVars.isiSurat === "<p><br></p>" ||
        newVars.isiSurat === "<p>&nbsp;</p>" ||
        newVars.isiSurat.trim() === "<br>";
      if (isBlankIsiSurat) {
        setVar("isiSurat", DEFAULT_ISI_KETERANGAN_PELATIHAN);
      }
      if (!newVars.lampiranDisplay) {
        setVar("lampiranDisplay", "none");
      }
    } else if (selectedTemplate === "ST-0663-TUGAS-TIM") {
      if (!newVars.tanggalRapatPimpinan || newVars.tanggalRapatPimpinan.trim() === "") {
        setVar("tanggalRapatPimpinan", "5 Agustus 2026");
      }
      if (!newVars.jabatan || newVars.jabatan.trim() === "") {
        setVar("jabatan", "Pengurus DSN-MUI");
      }
      if (!newVars.waktuTugas || newVars.waktuTugas.trim() === "") {
        setVar("waktuTugas", "12 Agustus 2026 – 12 September 2026");
      }
      if (!newVars.waktuTugasMulai) {
        setVar("waktuTugasMulai", "2026-08-12");
      }
      if (!newVars.waktuTugasSelesai) {
        setVar("waktuTugasSelesai", "2026-09-12");
      }
      const isBlankNamaTim =
        !newVars.namaTim ||
        newVars.namaTim.trim() === "" ||
        newVars.namaTim === "<p></p>" ||
        newVars.namaTim === "<p><br></p>" ||
        newVars.namaTim === "<p>&nbsp;</p>" ||
        newVars.namaTim.trim() === "<br>";
      if (isBlankNamaTim) {
        setVar("namaTim", DEFAULT_NAMA_TIM_SURAT_TUGAS);
      }
      const isBlankKeperluan =
        !newVars.keperluan ||
        newVars.keperluan.trim() === "" ||
        newVars.keperluan === "<p></p>" ||
        newVars.keperluan === "<p><br></p>" ||
        newVars.keperluan === "<p>&nbsp;</p>" ||
        newVars.keperluan.trim() === "<br>";
      if (isBlankKeperluan) {
        setVar("keperluan", DEFAULT_KEPERLUAN_SURAT_TUGAS_TIM);
      }
      const isBlankKeterangan =
        !newVars.keterangan ||
        newVars.keterangan.trim() === "" ||
        newVars.keterangan === "<p></p>" ||
        newVars.keterangan === "<p><br></p>" ||
        newVars.keterangan === "<p>&nbsp;</p>" ||
        newVars.keterangan.trim() === "<br>";
      if (isBlankKeterangan) {
        setVar("keterangan", DEFAULT_KETERANGAN_SURAT_TUGAS_TIM);
      }
      if (!newVars.headerTtd || newVars.headerTtd.trim() === "") {
        setVar("headerTtd", "BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA");
      }
      if (!newVars.jabatanKiri || newVars.jabatanKiri.trim() === "") {
        setVar("jabatanKiri", "Ketua");
      }
      if (!newVars.namaKiri || newVars.namaKiri.trim() === "") {
        setVar("namaKiri", "K.H. M. CHOLIL NAFIS, Lc., Ph.D.");
      }
      if (!newVars.jabatanKanan || newVars.jabatanKanan.trim() === "") {
        setVar("jabatanKanan", "Sekretaris");
      }
      if (!newVars.namaKanan || newVars.namaKanan.trim() === "") {
        setVar("namaKanan", "Dr. H. AMIRSYAH TAMBUNAN, M.A.");
      }
      if (!newVars.lampiranDisplay) {
        setVar("lampiranDisplay", "none");
      }
    } else if (selectedTemplate === "ST-0650-TUGAS") {
      if (!newVars.jabatan || newVars.jabatan.trim() === "" || newVars.jabatan === "Pengurus DSN-MUI") {
        setVar("jabatan", "1. Koordinator Bidang Layanan, Literasi, Relasi Industri dan Regulasi\n2. Anggota Bidang Fatwa");
      }
      if (!newVars.daftarNamaPenugasan || newVars.daftarNamaPenugasan.trim() === "" || newVars.daftarNamaPenugasan === "1. Ibnu Wazi\n2. Dr. Nofrianto, M.Ag., CM.") {
        setVar("daftarNamaPenugasan", "1. Dr. Asep Supyadillah, M.Ag.\n2. Dr. Yulizar Djamaluddin Sanrego, M.Ec.");
      }
      if (!newVars.headerTtd || newVars.headerTtd.trim() === "") {
        setVar("headerTtd", "BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA");
      }
      if (!newVars.jabatanKiri || newVars.jabatanKiri.trim() === "") {
        setVar("jabatanKiri", "Ketua");
      }
      if (!newVars.namaKetua || newVars.namaKetua.trim() === "") {
        setVar("namaKetua", "K.H. M. CHOLIL NAFIS, Lc., Ph.D.");
      }
      if (!newVars.jabatanKanan || newVars.jabatanKanan.trim() === "") {
        setVar("jabatanKanan", "Sekretaris");
      }
      if (!newVars.namaSekretaris || newVars.namaSekretaris.trim() === "") {
        setVar("namaSekretaris", "Dr. H. AMIRSYAH TAMBUNAN, M.A.");
      }
    } else if (selectedTemplate === "U-0638-UNDANGAN-BPH") {
      if (!newVars.jabatanKiri || newVars.jabatanKiri.trim() === "") {
        setVar("jabatanKiri", "Ketua");
      }
      if (!newVars.namaKetua || newVars.namaKetua.trim() === "") {
        setVar("namaKetua", "K.H. M. CHOLIL NAFIS, Lc., Ph.D.");
      }
      if (!newVars.jabatanKanan || newVars.jabatanKanan.trim() === "") {
        setVar("jabatanKanan", "Sekretaris");
      }
      if (!newVars.namaSekretaris || newVars.namaSekretaris.trim() === "") {
        setVar("namaSekretaris", "Dr. H. AMIRSYAH TAMBUNAN, M.A.");
      }
      if (!newVars.namaRapat || newVars.namaRapat.trim() === "") {
        setVar("namaRapat", "Rapat Pimpinan Badan Pengurus DSN-MUI");
      }
      if (!newVars.hariTanggalRapat || newVars.hariTanggalRapat.trim() === "") {
        setVar("hariTanggalRapat", "Rabu, 5 Agustus 2026");
      }
      if (!newVars.waktuRapat || newVars.waktuRapat.trim() === "") {
        setVar("waktuRapat", "13.00 – 15.00 WIB");
      }
      if (!newVars.tempatRapat || newVars.tempatRapat.trim() === "") {
        setVar("tempatRapat", "Kantor DSN-MUI\nJl. Dempo No. 19, Pegangsaan, Jakarta Pusat 10320");
      }
      if (!newVars.agendaRapat || newVars.agendaRapat.trim() === "") {
        setVar("agendaRapat", "Terlampir");
      }
      if (!newVars.daftarPenerima || newVars.daftarPenerima.trim() === "") {
        setVar(
          "daftarPenerima",
          "1. Pimpinan Badan Pengurus DSN-MUI\n2. Koordinator Bidang Fatwa DSN-MUI\n3. Koordinator Bidang Layanan, Literasi, Relasi Industri dan Regulasi DSN-MUI"
        );
      }
      const isBlankDaftar =
        !newVars.daftarUndangan ||
        newVars.daftarUndangan.trim() === "" ||
        newVars.daftarUndangan === "<p></p>" ||
        newVars.daftarUndangan === "<p><br></p>" ||
        newVars.daftarUndangan.trim() === "<br>";
      if (isBlankDaftar) {
        setVar("daftarUndangan", DEFAULT_DAFTAR_UNDANGAN_BPH);
      }
      const isBlankAgenda =
        !newVars.agendaDetail ||
        newVars.agendaDetail.trim() === "" ||
        newVars.agendaDetail === "<p></p>" ||
        newVars.agendaDetail === "<p><br></p>" ||
        newVars.agendaDetail.trim() === "<br>";
      if (isBlankAgenda) {
        setVar("agendaDetail", DEFAULT_AGENDA_DETAIL_BPH);
      }
    } else if (selectedTemplate === "U-0643-UNDANGAN-KESEKRETARISAN") {
      if (!newVars.jabatanKiri || newVars.jabatanKiri.trim() === "") {
        setVar("jabatanKiri", "Ketua");
      }
      if (!newVars.namaKetua || newVars.namaKetua.trim() === "") {
        setVar("namaKetua", "K.H. M. CHOLIL NAFIS, Lc., Ph.D.");
      }
      if (!newVars.jabatanKanan || newVars.jabatanKanan.trim() === "") {
        setVar("jabatanKanan", "Sekretaris");
      }
      if (!newVars.namaSekretaris || newVars.namaSekretaris.trim() === "") {
        setVar("namaSekretaris", "Dr. H. AMIRSYAH TAMBUNAN, M.A.");
      }
      if (!newVars.namaRapat || newVars.namaRapat.trim() === "") {
        setVar("namaRapat", "Rapat Kesekretarisan Badan Pengurus DSN-MUI");
      }
      if (!newVars.hariTanggalRapat || newVars.hariTanggalRapat.trim() === "") {
        setVar("hariTanggalRapat", "Kamis, 6 Agustus 2026");
      }
      if (!newVars.waktuRapat || newVars.waktuRapat.trim() === "") {
        setVar("waktuRapat", "13.00 – 14.30 WIB");
      }
      if (!newVars.mediaRapat || newVars.mediaRapat.trim() === "") {
        setVar("mediaRapat", "Zoom Cloud Meeting\n(Meeting ID: 859 4470 8501 | Passcode: DSNMUI26)");
      }
      if (!newVars.agendaRapat || newVars.agendaRapat.trim() === "") {
        setVar("agendaRapat", "Terlampir");
      }
      if (!newVars.daftarPenerima || newVars.daftarPenerima.trim() === "") {
        setVar("daftarPenerima", "Unsur Sekretaris Badan Pengurus DSN-MUI");
      }
      if (!newVars.tempatPenerima || newVars.tempatPenerima.trim() === "") {
        setVar("tempatPenerima", "TEMPAT");
      }
      const isBlankDaftar =
        !newVars.daftarUndangan ||
        newVars.daftarUndangan.trim() === "" ||
        newVars.daftarUndangan === "<p></p>" ||
        newVars.daftarUndangan === "<p><br></p>" ||
        newVars.daftarUndangan.trim() === "<br>";
      if (isBlankDaftar) {
        setVar("daftarUndangan", DEFAULT_DAFTAR_UNDANGAN_KESEKRETARISAN);
      }
      const isBlankAgenda =
        !newVars.agendaDetail ||
        newVars.agendaDetail.trim() === "" ||
        newVars.agendaDetail === "<p></p>" ||
        newVars.agendaDetail === "<p><br></p>" ||
        newVars.agendaDetail.trim() === "<br>";
      if (isBlankAgenda) {
        setVar("agendaDetail", DEFAULT_AGENDA_DETAIL_KESEKRETARISAN);
      }
    } else if (selectedTemplate === "U-0477-KONTRIBUSI-DPS") {
      if (!newVars.jabatanKiri || newVars.jabatanKiri.trim() === "") {
        setVar("jabatanKiri", "Ketua");
      }
      if (!newVars.namaKetua || newVars.namaKetua.trim() === "") {
        setVar("namaKetua", "K.H. M. CHOLIL NAFIS, Lc., Ph.D.");
      }
      if (!newVars.jabatanKanan || newVars.jabatanKanan.trim() === "") {
        setVar("jabatanKanan", "Sekretaris");
      }
      if (!newVars.namaSekretaris || newVars.namaSekretaris.trim() === "") {
        setVar("namaSekretaris", "Dr. H. AMIRSYAH TAMBUNAN, M.A.");
      }
      if (!newVars.penerimaSurat || newVars.penerimaSurat.trim() === "") {
        setVar("penerimaSurat", "Bapak/Ibu Dewan Pengawas Syariah\nK.H. Sholahudin Al Aiyub, M.Si.");
      }
      if (!newVars.tempatPenerima || newVars.tempatPenerima.trim() === "") {
        setVar("tempatPenerima", "TEMPAT");
      }
      if (!newVars.paragrafPembuka || newVars.paragrafPembuka.trim() === "") {
        setVar("paragrafPembuka", "Bersama ini Dewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI) menyampaikan hal-hal berikut:");
      }
      const isBlankIsi =
        !newVars.isiSurat ||
        newVars.isiSurat.trim() === "" ||
        newVars.isiSurat === "<p></p>" ||
        newVars.isiSurat === "<p><br></p>" ||
        newVars.isiSurat.trim() === "<br>";
      if (isBlankIsi) {
        setVar("isiSurat", DEFAULT_ISI_KONTRIBUSI_DPS);
      }
      if (!newVars.paragrafPenutup || newVars.paragrafPenutup.trim() === "") {
        setVar("paragrafPenutup", "Demikian informasi ini kami sampaikan. Atas perhatian Bapak/Ibu, kami ucapkan terima kasih.");
      }
    } else {
      if (selectedTemplateObj.variables?.some((v: any) => v.key === "jabatanKiri")) {
        if (!newVars.jabatanKiri || newVars.jabatanKiri.trim() === "") {
          setVar("jabatanKiri", "Ketua");
        }
      }
      if (selectedTemplateObj.variables?.some((v: any) => v.key === "jabatanKanan")) {
        if (!newVars.jabatanKanan || newVars.jabatanKanan.trim() === "") {
          setVar("jabatanKanan", "Sekretaris");
        }
      }
      if (selectedTemplateObj.variables?.some((v: any) => v.key === "namaKetua")) {
        if (!newVars.namaKetua || newVars.namaKetua.trim() === "") {
          setVar("namaKetua", "K.H. M. CHOLIL NAFIS, Lc., Ph.D.");
        }
      }
      if (selectedTemplateObj.variables?.some((v: any) => v.key === "namaSekretaris")) {
        if (!newVars.namaSekretaris || newVars.namaSekretaris.trim() === "") {
          setVar("namaSekretaris", "Dr. H. AMIRSYAH TAMBUNAN, M.A.");
        }
      }
    }

    if (selectedTemplateObj.variables?.some((v: any) => v.key === "lampiranDisplay")) {
      if (!newVars.lampiranDisplay) {
        setVar("lampiranDisplay", "none");
      }
    }

    // Generic fallback for any template variable with defaultValue
    if (selectedTemplateObj.variables) {
      for (const v of selectedTemplateObj.variables) {
        if (v.defaultValue && (!newVars[v.key] || newVars[v.key].trim() === "")) {
          setVar(v.key, v.defaultValue);
        }
      }
    }

    if (updated) {
      setTemplateVariables(newVars);
    }
  }, [
    selectedTemplateObj,
    generatedDocNumber,
    perihal,
    lampiran,
    tempatDibuat,
    tanggalMasehi,
    tanggalHijriah,
  ]);

  // Auto-select category based on template category
  useEffect(() => {
    if (selectedTemplateObj && selectedTemplateObj.category && categories.length > 0) {
      const matchedCat = categories.find(
        (c: any) => c.name.toLowerCase() === selectedTemplateObj.category.toLowerCase()
      );
      if (matchedCat) {
        setCategoryId(matchedCat.id);
      }
    }
  }, [selectedTemplateObj, categories]);

  // Date Change Handler
  const handleDateChange = (val: string) => {
    setTanggalMasehi(val);
    setTanggalHijriah(getEstimatedHijriah(val));
  };

  // Editor Command Handler
  const handleEditorCommand = (command: string, value: string = "") => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
    }
  };

  // Submit Handlers
  const handleSubmitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Silakan pilih file dokumen terlebih dahulu");
      return;
    }

    const steps = getAllWorkflowSteps();
    const hasEmptyPemparaf = pemparafList.some(p => !p.userId);
    const hasEmptyApprover = approverList.some(a => !a.userId);
    const hasEmptyPenandatangan = penandatanganList.some(s => !s.userId);
    const hasNoPenandatangan = !penandatanganList.some(s => !!s.userId);

    if (hasEmptyPemparaf || hasEmptyApprover || hasEmptyPenandatangan || hasNoPenandatangan) {
      if (hasNoPenandatangan) {
        setError("Harap tentukan minimal 1 pejabat Penandatangan pada alur penandatanganan.");
      } else {
        setError("Harap pilih nama pada seluruh urutan alur penandatanganan atau hapus pilihan yang kosong.");
      }
      return;
    }

    setSubmitting(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("documentNumber", docNumber);
    formData.append("categoryId", categoryId);
    if (subCategory) {
      formData.append("subCategory", subCategory);
    }
    formData.append("classificationId", classificationId);
    formData.append("documentType", "OUTGOING");

    if (dokumenPendukung) {
      formData.append("dokumenPendukung", dokumenPendukung);
    }

    try {
      const docRes = await api.post("/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
          setProgress(percentCompleted);
        },
      });

      const documentId = docRes.data.data.id;

      // Fallback: upload evidence file if not already created
      if (dokumenPendukung && (!docRes.data.data.evidenceFiles || docRes.data.data.evidenceFiles.length === 0)) {
        const evidenceFormData = new FormData();
        evidenceFormData.append("file", dokumenPendukung);
        try {
          await api.post(`/documents/${documentId}/evidence/files`, evidenceFormData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } catch (evErr) {
          console.warn("Evidence file fallback upload:", evErr);
        }
      }

      // Submit Workflow Config
      await api.post("/workflow/submit", {
        documentId,
        stepConfig: steps.map((s, i) => ({ stepNumber: i + 1, userId: s.userId, role: s.role })),
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/surat-keluar");
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal mengunggah dokumen & alur penandatanganan");
    } finally {
      setSubmitting(false);
    }
  };

  // Validation state and helper functions
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const clearFieldError = (fieldName: string) => {
    if (formErrors[fieldName]) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  const hasTabError = (tabId: string) => {
    if (tabId === "info") return !!(formErrors.generatedDocNumber || formErrors.selectedTemplate || formErrors.perihal || formErrors.categoryId || formErrors.subCategory || formErrors.classificationId);
    if (tabId === "detail") return !!(formErrors.tempatDibuat || formErrors.tanggalMasehi || formErrors.tanggalHijriah);
    if (tabId === "variables") return Object.keys(formErrors).some(k => k.startsWith("var_"));
    if (tabId === "signers") return !!formErrors.steps;
    return false;
  };

  const validateTemplateForm = (): boolean => {
    const errors: Record<string, string> = {};
    let firstInvalidTab: "info" | "detail" | "variables" | "signers" | null = null;

    if (!generatedDocNumber || !generatedDocNumber.trim()) {
      errors.generatedDocNumber = "Nomor surat wajib diisi";
      if (!firstInvalidTab) firstInvalidTab = "info";
    }
    if (!selectedTemplate) {
      errors.selectedTemplate = "Template surat wajib dipilih";
      if (!firstInvalidTab) firstInvalidTab = "info";
    }
    if (!perihal || !perihal.trim()) {
      errors.perihal = "Perihal surat wajib diisi";
      if (!firstInvalidTab) firstInvalidTab = "info";
    }
    if (!categoryId) {
      errors.categoryId = "Kategori surat wajib dipilih";
      if (!firstInvalidTab) firstInvalidTab = "info";
    } else {
      const selectedCatName = categories.find(c => c.id === categoryId)?.name;
      const subCats = selectedCatName ? CATEGORY_SUBCATEGORIES[selectedCatName] : undefined;
      if (subCats && subCats.length > 0 && !subCategory) {
        errors.subCategory = "Subkategori surat wajib dipilih";
        if (!firstInvalidTab) firstInvalidTab = "info";
      }
    }
    if (!classificationId) {
      errors.classificationId = "Klasifikasi surat wajib dipilih";
      if (!firstInvalidTab) firstInvalidTab = "info";
    }

    if (!tempatDibuat || !tempatDibuat.trim()) {
      errors.tempatDibuat = "Tempat dibuat surat wajib diisi";
      if (!firstInvalidTab) firstInvalidTab = "detail";
    }
    if (!tanggalMasehi) {
      errors.tanggalMasehi = "Tanggal (Masehi) wajib diisi";
      if (!firstInvalidTab) firstInvalidTab = "detail";
    }
    if (!tanggalHijriah || !tanggalHijriah.trim()) {
      errors.tanggalHijriah = "Tanggal (Hijriah) wajib diisi";
      if (!firstInvalidTab) firstInvalidTab = "detail";
    }

    if (!isEditorMode && selectedTemplateObj?.variables) {
      for (const v of selectedTemplateObj.variables) {
        if (
          v.required &&
          !["nomorSurat", "perihal", "lampiran", "tempatDibuat", "tanggalSurat", "tanggalMasehi", "tanggalHijriah", "showAgendaDetail", "lampiranDisplay"].includes(v.key)
        ) {
          if (v.key === "agendaDetail" && templateVariables.showAgendaDetail !== "block") {
            continue;
          }
          if (v.key === "lampiranKonten" && templateVariables.lampiranDisplay !== "block") {
            continue;
          }
          const val = templateVariables[v.key];
          const textContent = typeof val === "string" ? val.replace(/<[^>]*>/g, "").trim() : "";
          if (!val || (!val.trim() && !textContent)) {
            errors[`var_${v.key}`] = `${v.label} wajib diisi`;
            if (!firstInvalidTab) firstInvalidTab = "variables";
          }
        }
      }
    }

    const hasEmptyPemparaf = pemparafList.some(p => !p.userId);
    const hasEmptyApprover = approverList.some(a => !a.userId);
    const hasEmptyPenandatangan = penandatanganList.some(s => !s.userId);
    const hasNoPenandatangan = !penandatanganList.some(s => !!s.userId);

    if (hasEmptyPemparaf || hasEmptyApprover || hasEmptyPenandatangan || hasNoPenandatangan) {
      if (hasNoPenandatangan) {
        errors.steps = "Harap tentukan minimal 1 pejabat Penandatangan.";
      } else {
        errors.steps = "Harap pilih nama pada seluruh urutan alur penandatanganan atau hapus pilihan yang kosong.";
      }
      if (!firstInvalidTab) firstInvalidTab = "signers";
    }

    setFormErrors(errors);

    if (firstInvalidTab) {
      setActiveTab(firstInvalidTab);
      const tabNames: Record<string, string> = {
        info: "Informasi Utama",
        detail: "Detail & Lampiran",
        variables: "Variabel Konten",
        signers: "Alur Penandatangan"
      };
      setError(`Mohon lengkapi seluruh kolom wajib (*) yang belum diisi pada tab "${tabNames[firstInvalidTab]}".`);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return false;
    }

    return true;
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateTemplateForm()) {
      return;
    }

    setSubmitting(true);
    setError("");

    const steps = getAllWorkflowSteps();
    let finalHtml = "";
    const templateTitle = selectedTemplateObj ? selectedTemplateObj.name : "Surat Keluar";

    if (isEditorMode) {
      // 1. EDITOR MODE: Generate Full HTML content using legacy layout
      const bodyHtml = editorRef.current?.innerHTML || "";
      // Only Penandatangan should be rendered in the document signature block
      const signersOnly = penandatanganList.filter(s => s.userId);
      const resolvedSteps = signersOnly.map((step, idx) => {
        const u = users.find(user => user.id === step.userId);
        return {
          name: u ? u.fullName : `Penandatangan ${idx + 1}`,
          title: u ? u.jobTitle || u.role?.name || "Pejabat Organisasi" : ""
        };
      });

      let signatureHtml = "";
      if (resolvedSteps.length > 0) {
        if (resolvedSteps.length === 1) {
          signatureHtml += `
            <div style="display: flex; justify-content: flex-end; margin-top: 60px; page-break-inside: avoid; border-top: 1px dashed #e2e8f0; padding-top: 20px;">
              <div style="text-align: center; min-width: 180px;">
                <div style="font-size: 11px; color: #4b5563; margin-bottom: 45px;">Menyetujui,</div>
                <div style="font-size: 12px; font-weight: bold; text-decoration: underline; color: #111827;">${resolvedSteps[0].name}</div>
                <div style="font-size: 10px; color: #6b7280; margin-top: 2px;">${resolvedSteps[0].title}</div>
              </div>
            </div>
          `;
        } else {
          signatureHtml += `<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px 20px; margin-top: 60px; page-break-inside: avoid; border-top: 1px dashed #e2e8f0; padding-top: 20px;">`;
          resolvedSteps.forEach((s, idx) => {
            const isLastOdd = idx === resolvedSteps.length - 1 && resolvedSteps.length % 2 !== 0;
            const label = idx === resolvedSteps.length - 1 ? "Menyetujui," : "Mengetahui,";

            if (isLastOdd) {
              signatureHtml += `
                <div style="grid-column: span 2; display: flex; justify-content: center;">
                  <div style="text-align: center; min-width: 180px;">
                    <div style="font-size: 11px; color: #4b5563; margin-bottom: 45px;">${label}</div>
                    <div style="font-size: 12px; font-weight: bold; text-decoration: underline; color: #111827;">${s.name}</div>
                    <div style="font-size: 10px; color: #6b7280; margin-top: 2px;">${s.title}</div>
                  </div>
                </div>
              `;
            } else {
              const justify = idx % 2 === 0 ? "flex-start" : "flex-end";
              signatureHtml += `
                <div style="display: flex; justify-content: ${justify};">
                  <div style="text-align: center; min-width: 180px;">
                    <div style="font-size: 11px; color: #4b5563; margin-bottom: 45px;">${label}</div>
                    <div style="font-size: 12px; font-weight: bold; text-decoration: underline; color: #111827;">${s.name}</div>
                    <div style="font-size: 10px; color: #6b7280; margin-top: 2px;">${s.title}</div>
                  </div>
                </div>
              `;
            }
          });
          signatureHtml += `</div>`;
        }
      }

      const metadataStr = JSON.stringify({
        selectedTemplate,
        tempatDibuat,
        tanggalMasehi,
        tanggalHijriah,
        perihal,
        lampiran,
        catatan,
        steps,
        pemparafList,
        approverList,
        penandatanganList,
        bodyHtml,
        categoryId,
        classificationId,
        documentNumber: generatedDocNumber
      }).replace(/<\/script>/g, '<\\/script>');

      finalHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${perihal}</title>
          <script id="template-metadata" type="application/json">
            ${metadataStr}
          </script>
          <style>
            @page {
              size: A4 portrait;
              margin-top: 4.2cm;
              margin-bottom: 0.5cm;
              margin-right: 3.17cm;
              margin-left: 2.82cm;
            }
            body {
              font-family: Arial, sans-serif;
              color: #111827;
              line-height: 1.5;
              font-size: 10.5pt;
              margin: 0;
              padding-top: 4.2cm;
              padding-bottom: 0.5cm;
              padding-right: 3.17cm;
              padding-left: 2.82cm;
              box-sizing: border-box;
              text-align: left;
            }
            .header-edge {
              position: absolute;
              top: 1.27cm;
              left: 2.82cm;
              right: 3.17cm;
            }
            .footer-edge {
              position: absolute;
              bottom: 1.27cm;
              left: 2.82cm;
              right: 3.17cm;
            }
            .kop-surat {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 12px;
              margin-bottom: 20px;
            }
            .kop-title {
              font-size: 14pt;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #111827;
            }
            .kop-subtitle {
              font-size: 10pt;
              font-weight: 700;
              text-transform: uppercase;
              color: #4b5563;
              margin-top: 2px;
            }
            .kop-address {
              font-size: 8.5pt;
              color: #4b5563;
              margin-top: 4px;
            }
            .meta-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 24px;
              font-size: 10.5pt;
            }
            .meta-col {
              display: flex;
              flex-direction: column;
              gap: 2px;
            }
            .meta-row {
              display: flex;
              gap: 6px;
            }
            .meta-label {
              font-weight: bold;
              width: 80px;
            }
            .recipient-block {
              margin-bottom: 24px;
              font-size: 10.5pt;
            }
            .letter-title {
              text-align: center;
              font-size: 12pt;
              font-weight: 800;
              text-decoration: underline;
              text-transform: uppercase;
              margin-top: 10px;
              margin-bottom: 20px;
              color: #111827;
            }
            .letter-body {
              font-size: 10.5pt;
              min-height: 250px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 12px 0;
            }
            td, th {
              padding: 6px 8px;
              vertical-align: top;
              font-size: 10.5pt;
            }
          </style>
        </head>
        <body>
          <table style="width: 100%; border-collapse: collapse; border-bottom: 3px double #000000; padding-bottom: 8px; margin-bottom: 12px;">
            <tr>
              <td style="width: 65px; vertical-align: middle; padding: 0 8px 0 0;">
                <img src="${logoBase64 || (window.location.origin + '/images/logo-dsn.png')}" alt="Logo DSN-MUI" style="width: 55px; height: 55px; object-fit: contain;" />
              </td>
              <td style="text-align: left; vertical-align: middle; padding: 0;">
                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #111827; letter-spacing: -0.2px; margin-bottom: 1px; line-height: 1.2; white-space: nowrap;">
                  DEWAN SYARIAH NASIONAL - MAJELIS ULAMA INDONESIA
                </div>
                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 8.5px; font-weight: bold; color: #111827; margin-bottom: 3px; line-height: 1.2; white-space: nowrap;">
                  National Sharia Board - Indonesian Council of Ulama
                </div>
                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 7.5px; color: #374151; margin-bottom: 1px; line-height: 1.2; white-space: nowrap;">
                  SEKRETARIAT : Jl. Dempo No.19 Pegangsaan - Jakarta Pusat 10320
                </div>
                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 7.5px; color: #374151; line-height: 1.2; white-space: nowrap;">
                  Telp. (021) 3904146 &nbsp; Email: sekretariat@dsnmui.or.id &nbsp; Web: www.dsnmui.or.id
                </div>
              </td>
              <td style="width: 70px; vertical-align: middle; text-align: right; padding: 0 0 0 8px;">
                <div style="border: 1px solid #000000; padding: 3px; font-family: Arial, Helvetica, sans-serif; font-size: 6px; text-align: center; line-height: 1.1; font-weight: bold; color: #111827;">
                  <div style="border-bottom: 1px solid #000000; padding-bottom: 1px; margin-bottom: 1.5px; font-size: 5px;">REGISTERED</div>
                  <div style="font-weight: 800; font-size: 8px; letter-spacing: 0.5px; margin-bottom: 0.5px;">WQA</div>
                  <div style="font-size: 5px; margin: 1px 0;">ISO 9001:2015</div>
                  <div style="border-top: 1px dashed #000000; padding-top: 1px; margin-top: 1.5px; font-size: 4.5px;">UKAS 134</div>
                </div>
              </td>
            </tr>
          </table>
          
          <div style="text-align: center; font-size: 20px; font-family: 'Times New Roman', serif; margin-top: 12px; margin-bottom: 18px; color: #111827;">
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
          </div>

          <div class="letter-title">${templateTitle}</div>

          <div class="meta-section">
            <div class="meta-col">
              <div class="meta-row">
                <span class="meta-label">Nomor</span>
                <span>: ${generatedDocNumber || '[Nomor Resmi akan di-generate]'}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Lampiran</span>
                <span>: ${lampiran || '—'}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Perihal</span>
                <span>: ${perihal}</span>
              </div>
            </div>
            <div class="meta-col" style="text-align: right; align-items: flex-end;">
              <div>${tempatDibuat}, ${new Date(tanggalMasehi).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} M</div>
              <div>${tanggalHijriah}</div>
            </div>
          </div>

          <div class="recipient-block">
            <p style="margin-bottom: 2px;">Kepada Yang Terhormat,</p>
            <p style="font-weight: bold; margin-bottom: 2px;">Pimpinan / Anggota Organisasi</p>
            <p>di — Tempat</p>
          </div>

          <div class="letter-body">
            ${bodyHtml}
          </div>

          ${signatureHtml}
        </body>
        </html>
      `;
    } else {
      // 2. VARIABLE MODE: Compile template HTML by replacing variables, and inject metadata Str
      if (!selectedTemplateObj) {
        setError("Template tidak valid");
        setSubmitting(false);
        return;
      }

      const metadataStr = JSON.stringify({
        selectedTemplate,
        tempatDibuat,
        tanggalMasehi,
        tanggalHijriah,
        perihal,
        lampiran,
        catatan,
        steps,
        bodyHtml: "",
        categoryId,
        subCategory,
        classificationId,
        documentNumber: generatedDocNumber,
        templateVariables
      }).replace(/<\/script>/g, '<\\/script>');

      const replacedHtml = selectedTemplateObj.htmlContent.replace(
        /\{\{(\w+)\}\}/g,
        (_: string, key: string) => {
          let val = templateVariables[key] || "";
          if (
            key === "agendaDetail" ||
            key === "daftarUndangan" ||
            key === "daftarUndanganLampiran" ||
            key === "agendaRapatLampiran" ||
            key === "keteranganNarahubung" ||
            key === "keterangan" ||
            key === "deskripsiTransaksi" ||
            key === "isiSurat" ||
            key === "lampiranKonten" ||
            key.toLowerCase().includes("lampiran") ||
            key.toLowerCase().includes("wysiwyg") ||
            key.toLowerCase().includes("isisurat")
          ) {
            const hasHtmlTags = /<\s*(?:p|div|table|tbody|tr|td|th|ul|ol|li|br|h[1-6]|span)\b[^>]*>/i.test(val);
            if (!hasHtmlTags) {
              val = val.replace(/\n/g, "<br>");
            } else {
              val = val.replace(/>\s*\r?\n\s*</g, "><");
            }
            // Strip any accidental <br> directly inside <table>, <thead>, <tbody>, <tfoot>, <tr>
            val = val.replace(/(<table\b[^>]*>[\s\S]*?<\/table>)/gi, (tbl: string) => {
              return tbl.replace(/<br\s*\/?>/gi, "");
            });
          }
          return val;
        }
      );

      if (replacedHtml.includes("<head>")) {
        finalHtml = replacedHtml.replace(
          "<head>",
          `<head>\n  <script id="template-metadata" type="application/json">\n    ${metadataStr}\n  </script>`
        );
      } else {
        finalHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <script id="template-metadata" type="application/json">
              ${metadataStr}
            </script>
          </head>
          <body>
            ${replacedHtml}
          </body>
          </html>
        `;
      }
    }

    // Ensure all images (kop surat, bismillah, logo, wqa) are fully inlined as Base64 in finalHtml
    const FOOTER_HTML = `<table class="amanah-letter-footer" style="display: table; width: 100%; border-collapse: collapse; margin-top: 20px; page-break-inside: avoid; font-family: Arial, sans-serif;">
    <tr>
      <td style="vertical-align: middle; text-align: left; padding: 4px 10px 4px 0; font-size: 7.5pt; line-height: 1.25; font-style: italic; color: #1f2937; border-top: 1px solid #e5e7eb;">
        Dokumen ini telah ditandatangani secara elektronik oleh Sistem Digital Amanah dibawah otoritas Dewan Syariah Nasional-Majelis Ulama Indonesia. Untuk memastikan keaslian tanda tangan elektronik, silakan pindai QR-Code
      </td>
      <td style="vertical-align: middle; text-align: right; width: 32px; padding: 4px 0; border-top: 1px solid #e5e7eb;">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle;">
          <path d="M16 2L5 6.5V14.5C5 21.2 9.7 27.5 16 29.5C22.3 27.5 27 21.2 27 14.5V6.5L16 2Z" fill="#006633" stroke="#004D26" stroke-width="1.5" stroke-linejoin="round"/>
          <circle cx="16" cy="16" r="8.5" fill="#006633" stroke="#ffffff" stroke-width="1" stroke-dasharray="2 1.5"/>
          <path d="M12 16L14.8 18.8L20.5 13" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </td>
    </tr>
  </table>`;

    if (kopSuratBase64) {
      finalHtml = finalHtml.replace(/src=["'][^"']*kop-surat\.png["']/gi, `src="${kopSuratBase64}" class="kop-surat-img"`);
      finalHtml = finalHtml.replace(/(\\?\${HEADER_HTML}|\${HEADER_HTML})/g, `<div style="text-align: center; margin-bottom: 4px; margin-left: 0; margin-right: 0; padding-top: 0;">
    <img src="${kopSuratBase64}" alt="Kop Surat DSN-MUI" class="kop-surat-img" style="width: 100%; max-width: 100%; height: auto; display: block; margin: 0 auto;" />
  </div>
  <div style="text-align: center; margin-top: 8px; margin-bottom: 14px;">
    <img src="${bismillahBase64 || '/images/bismillah.svg'}" alt="Bismillah" style="width: 260px; max-width: 45%; height: auto; max-height: 48px; object-fit: contain; filter: brightness(0); display: block; margin: 8px auto 14px auto;" />
  </div>`);
    }
    finalHtml = finalHtml.replace(/(\\?\${FOOTER_HTML}|\${FOOTER_HTML})/g, FOOTER_HTML);
    if (bismillahBase64) {
      finalHtml = finalHtml.replace(/src=["'][^"']*bismillah\.svg["']/gi, `src="${bismillahBase64}"`);
    }
    if (logoBase64) {
      finalHtml = finalHtml.replace(/src=["'][^"']*logo-dsn\.png["']/gi, `src="${logoBase64}"`);
    }
    if (wqaUkasBase64) {
      finalHtml = finalHtml.replace(/src=["'][^"']*wqa-ukas\.png["']/gi, `src="${wqaUkasBase64}"`);
    }

    // Convert HTML string to File object
    const htmlFile = new File([finalHtml], `${selectedTemplateObj?.name || 'document'}_${perihal}.html`, {
      type: "text/html",
    });

    const formData = new FormData();
    formData.append("file", htmlFile);
    formData.append("title", perihal);
    formData.append("documentNumber", generatedDocNumber);
    formData.append("categoryId", categoryId);
    if (subCategory) {
      formData.append("subCategory", subCategory);
    }
    formData.append("classificationId", classificationId);
    formData.append("documentType", "OUTGOING");

    if (dokumenPendukung) {
      formData.append("dokumenPendukung", dokumenPendukung);
    }

    try {
      // 1. Create the Document
      const docRes = await api.post("/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const documentId = docRes.data.data.id;

      // Fallback: upload evidence file if not already created in initial creation
      if (dokumenPendukung && (!docRes.data.data.evidenceFiles || docRes.data.data.evidenceFiles.length === 0)) {
        const evidenceFormData = new FormData();
        evidenceFormData.append("file", dokumenPendukung);
        try {
          await api.post(`/documents/${documentId}/evidence/files`, evidenceFormData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } catch (evErr) {
          console.warn("Evidence file fallback upload:", evErr);
        }
      }

      // 2. Submit the Workflow config
      await api.post("/workflow/submit", {
        documentId,
        stepConfig: steps.map((s, i) => ({ stepNumber: i + 1, userId: s.userId, role: s.role })),
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/surat-keluar");
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal menyimpan dokumen & alur penandatanganan");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 px-4">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-500 hover:text-primary font-bold transition-colors group"
      >
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span>Kembali ke Daftar</span>
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-1 flex items-center gap-3">
            <FilePlus size={28} className="text-primary flex-shrink-0" />
            <span>Buat Surat Keluar</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
            Pilih metode pembuatan dokumen persuratan di bawah ini.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl flex items-center gap-1 shrink-0 self-start sm:self-auto border border-slate-200/50 dark:border-slate-700/50">
          <button
            onClick={() => {
              setCreationMode("upload");
              setError("");
            }}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
              creationMode === "upload"
                ? "bg-white dark:bg-slate-900 text-primary shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <Upload size={14} />
            <span>Unggah Dokumen</span>
          </button>
          <button
            onClick={() => {
              setCreationMode("template");
              setError("");
            }}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
              creationMode === "template"
                ? "bg-white dark:bg-slate-900 text-primary shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <FileCheck size={14} />
            <span>Buat dari Template</span>
          </button>
        </div>
      </div>

      {/* Global Errors / Success Feedbacks */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 flex items-start gap-3 text-red-600 dark:text-red-400 text-sm animate-in fade-in zoom-in duration-300">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 flex items-start gap-3 text-emerald-600 dark:text-emerald-400 text-sm animate-in fade-in zoom-in duration-300">
          <Check size={18} className="shrink-0 mt-0.5" />
          <span>Dokumen & alur berhasil diproses! Mengalihkan ke daftar surat...</span>
        </div>
      )}

      {loadingMeta ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Memuat Konfigurasi Organisasi...</p>
        </div>
      ) : (
        <>
          {/* MODE 1: UPLOAD FLOW */}
          {creationMode === "upload" && (
            <div className="max-w-6xl mx-auto animate-in fade-in duration-300">
              <form onSubmit={handleSubmitUpload} className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800/80 shadow-md p-6 sm:p-8 space-y-6">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">
                  Detail Metadata & Pengunggahan Berkas
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Metadata Inputs */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Category and Subcategory Wrapper */}
                      <div className="space-y-4 col-span-1">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                          <div className="relative">
                            <select
                              required
                              className="w-full pl-5 pr-10 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none"
                              value={categoryId}
                              onChange={(e) => {
                                setCategoryId(e.target.value);
                                setSubCategory("");
                              }}
                            >
                              <option value="">Pilih Kategori</option>
                              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </select>
                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          </div>
                        </div>

                        {(() => {
                          const selectedCatName = categories.find(c => c.id === categoryId)?.name;
                          const subCats = selectedCatName ? CATEGORY_SUBCATEGORIES[selectedCatName] : undefined;
                          if (!subCats || subCats.length === 0) return null;
                          
                          return (
                            <div className="space-y-2 animate-in fade-in duration-300">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                Subkategori <span className="text-red-500 font-bold ml-0.5">*</span>
                              </label>
                              <div className="relative">
                                <select
                                  required
                                  className="w-full pl-5 pr-10 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none"
                                  value={subCategory}
                                  onChange={(e) => setSubCategory(e.target.value)}
                                >
                                  <option value="">Pilih Subkategori</option>
                                  {subCats.map((sub, idx) => (
                                    <option key={idx} value={sub}>{sub}</option>
                                  ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Classification */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Klasifikasi</label>
                        <div className="relative">
                          <select
                            required
                            className="w-full pl-5 pr-10 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none"
                            value={classificationId}
                            onChange={(e) => setClassificationId(e.target.value)}
                          >
                            <option value="">Pilih Klasifikasi</option>
                            {classifications.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                          </select>
                          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Judul Dokumen</label>
                      <div className="relative group">
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input
                          type="text"
                          required
                          placeholder="Judul Dokumen"
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Document Number */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nomor Dokumen (Opsional)</label>
                      <input
                        type="text"
                        placeholder="Contoh: 001/DSN-MUI/IV/2026"
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                        value={docNumber}
                        onChange={(e) => setDocNumber(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Right Column: File Upload Dropzone */}
                  <div className="flex flex-col justify-between">
                    <div className="space-y-2 flex-1 flex flex-col">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">File Dokumen (PDF/DOCX)</label>
                      <div className={cn(
                        "border-2 border-dashed rounded-[24px] p-6 flex flex-col items-center justify-center transition-all cursor-pointer relative flex-1 min-h-[220px]",
                        file ? "border-primary/50 bg-primary/5" : "border-slate-200 dark:border-slate-800 hover:border-primary/30"
                      )}>
                        <input
                          type="file"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setFile(e.target.files[0]);
                            }
                          }}
                        />
                        {file ? (
                          <div className="flex flex-col items-center animate-in zoom-in duration-300">
                            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-primary shadow-sm mb-4">
                              <Check size={32} />
                            </div>
                            <p className="text-sm font-bold text-slate-800 dark:text-white mb-1">{file.name}</p>
                            <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            <button
                              type="button"
                              onClick={() => setFile(null)}
                              className="mt-4 text-xs font-bold text-yellow-500 hover:underline"
                            >
                              Ganti File
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
                              <Upload size={32} />
                            </div>
                            <p className="text-sm font-bold text-slate-800 dark:text-white mb-1">Pilih atau Seret File ke Sini</p>
                            <p className="text-xs text-slate-400">PDF, DOC, DOCX maksimal 100MB</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section Alur Penandatanganan & Persetujuan Surat */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <UserCheck size={14} className="text-primary" />
                      Alur Penandatanganan & Persetujuan Surat <span className="text-red-500 font-bold ml-0.5">*</span>
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Tentukan daftar Pemparaf, Approver, dan Penandatangan secara berurutan.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 1. PEMPARAF */}
                    <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-[11px]">
                            1
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">Pemparaf</h5>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddPemparaf}
                          className="text-[11px] font-extrabold text-primary hover:underline flex items-center gap-1 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                        >
                          <Plus size={12} />
                          <span>Tambah</span>
                        </button>
                      </div>

                      {pemparafList.length === 0 ? (
                        <p className="text-[10px] italic text-slate-400 text-center py-3 border border-dashed border-slate-200/80 dark:border-slate-800 rounded-xl">
                          Belum ada pemparaf
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {pemparafList.map((item, idx) => (
                            <div key={idx} className="flex gap-1.5 items-center">
                              <select
                                value={item.userId}
                                onChange={(e) => handlePemparafChange(idx, e.target.value)}
                                className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-xs appearance-none"
                              >
                                <option value="">— Pilih Pemparaf —</option>
                                {users.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.fullName}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => handleRemovePemparaf(idx)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 2. APPROVER */}
                    <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[11px]">
                            2
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">Approver</h5>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddApprover}
                          className="text-[11px] font-extrabold text-primary hover:underline flex items-center gap-1 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                        >
                          <Plus size={12} />
                          <span>Tambah</span>
                        </button>
                      </div>

                      {approverList.length === 0 ? (
                        <p className="text-[10px] italic text-slate-400 text-center py-3 border border-dashed border-slate-200/80 dark:border-slate-800 rounded-xl">
                          Belum ada approver
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {approverList.map((item, idx) => (
                            <div key={idx} className="flex gap-1.5 items-center">
                              <select
                                value={item.userId}
                                onChange={(e) => handleApproverChange(idx, e.target.value)}
                                className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-xs appearance-none"
                              >
                                <option value="">— Pilih Approver —</option>
                                {users.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.fullName}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => handleRemoveApprover(idx)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 3. PENANDATANGAN */}
                    <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[11px]">
                            3
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              Penandatangan <span className="text-red-500 font-bold ml-0.5">*</span>
                            </h5>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddPenandatangan}
                          className="text-[11px] font-extrabold text-primary hover:underline flex items-center gap-1 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                        >
                          <Plus size={12} />
                          <span>Tambah</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {penandatanganList.map((item, idx) => (
                          <div key={idx} className="flex gap-1.5 items-center">
                            <select
                              required
                              value={item.userId}
                              onChange={(e) => handlePenandatanganChange(idx, e.target.value)}
                              className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-xs appearance-none"
                            >
                              <option value="">— Pilih Penandatangan —</option>
                              {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.fullName}
                                </option>
                              ))}
                            </select>
                            {penandatanganList.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemovePenandatangan(idx)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="submit"
                    disabled={submitting || success}
                    className="flex-1 gradient-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Mengunggah {progress}%</span>
                      </>
                    ) : (
                      <>
                        <Upload size={20} />
                        <span>Unggah Dokumen</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-8 py-4 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-slate-800"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* MODE 2: INTERACTIVE TEMPLATE BUILDER */}
          {creationMode === "template" && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
              {/* TOP SECTION: A4 Live Letter Preview & Editor */}
              <div className="flex flex-col min-h-0 bg-slate-100 dark:bg-slate-800/40 p-4 sm:p-6 rounded-[32px] border border-slate-200/60 dark:border-slate-800/80 shadow-inner">
                <div className="flex items-center justify-between shrink-0 mb-3 px-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">A4 Live Letter Preview & Editor</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full uppercase tracking-tight flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span>Real-time Binding (A4 Format)</span>
                  </span>
                </div>

                {/* Scrollable container with half-screen height */}
                <div className="h-[450px] overflow-y-auto custom-scrollbar p-4 flex justify-center">
                  <div className="w-full max-w-[950px]">
                    {isEditorMode ? (
                      <>
                        {/* Editor Formatting Controls */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl mb-4 flex flex-wrap gap-1 items-center shadow-sm shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEditorCommand("bold")}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-all"
                            title="Bold"
                          >
                            <Bold size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditorCommand("italic")}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-all"
                            title="Italic"
                          >
                            <Italic size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditorCommand("underline")}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-all"
                            title="Underline"
                          >
                            <Underline size={15} />
                          </button>
                          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
                          <button
                            type="button"
                            onClick={() => handleEditorCommand("justifyLeft")}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-all"
                            title="Align Left"
                          >
                            <AlignLeft size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditorCommand("justifyCenter")}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-all"
                            title="Align Center"
                          >
                            <AlignCenter size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditorCommand("justifyRight")}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-all"
                            title="Align Right"
                          >
                            <AlignRight size={15} />
                          </button>
                          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
                          <button
                            type="button"
                            onClick={() => handleEditorCommand("insertUnorderedList")}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-all"
                            title="Bullet List"
                          >
                            <List size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditorCommand("insertOrderedList")}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-all"
                            title="Numbered List"
                          >
                            <ListOrdered size={15} />
                          </button>
                        </div>

                        {/* Physical A4 Visual Paper */}
                        <div className="bg-slate-100 dark:bg-slate-900/60 p-2 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-center overflow-x-auto">
                          <div
                            className="bg-white text-slate-800 shadow-2xl rounded-sm min-h-[1050px] border border-slate-200/80 flex flex-col text-left relative w-[794px] max-w-full"
                            style={{
                              fontSize: "10.5pt",
                              fontFamily: "Arial, sans-serif",
                              lineHeight: "1.45",
                              padding: "20mm 20mm 20mm 20mm",
                              boxSizing: "border-box"
                            }}
                          >

                            {/* Kop Surat Header */}
                            <div className="mb-2">
                              <img
                                src="/images/kop-surat.png"
                                alt="Kop Surat DSN-MUI"
                                className="w-full h-auto block"
                              />
                            </div>

                            {/* Bismillah Calligraphy */}
                            <div className="flex justify-center mb-4 mt-2">
                              <img 
                                src={bismillahBase64 || "/images/bismillah.svg"} 
                                alt="Bismillah" 
                                style={{ 
                                  width: "260px", 
                                  maxWidth: "45%", 
                                  height: "auto", 
                                  maxHeight: "48px", 
                                  objectFit: "contain", 
                                  filter: "brightness(0)",
                                  display: "block",
                                  margin: "0 auto"
                                }} 
                              />
                            </div>

                          {/* Letter Title */}
                          <div className="text-center font-extrabold underline uppercase tracking-wide text-slate-900 mb-6" style={{ fontSize: "12pt" }}>
                            {selectedTemplateObj?.name || "Surat Keluar"}
                          </div>

                          {/* Letter Metadata Info block */}
                          <div className="flex justify-between items-start mb-6 text-slate-700" style={{ fontSize: "10.5pt" }}>
                            <div className="space-y-1">
                              <div className="flex gap-2">
                                <span className="font-bold w-[75px]">Nomor</span>
                                <span className={generatedDocNumber ? 'font-medium text-slate-900' : 'italic text-slate-400'}>: {generatedDocNumber || '[Nomor Resmi akan di-generate]'}</span>
                              </div>
                              <div className="flex gap-2">
                                <span className="font-bold w-[75px]">Lampiran</span>
                                <span>: {lampiran || "—"}</span>
                              </div>
                              <div className="flex gap-2">
                                <span className="font-bold w-[75px]">Perihal</span>
                                <span className="font-medium text-slate-900">: {perihal || "—"}</span>
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end">
                              <p>{tempatDibuat}, {new Date(tanggalMasehi).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} M</p>
                              <p className="font-mono text-[10px] text-slate-500">{tanggalHijriah || "— H"}</p>
                            </div>
                          </div>

                          {/* Recipient Address */}
                          <div className="mb-6 text-slate-700 space-y-1" style={{ fontSize: "10.5pt" }}>
                            <p>Kepada Yang Terhormat,</p>
                            <p className="font-bold text-slate-900">Pimpinan / Anggota Organisasi</p>
                            <p>di — Tempat</p>
                          </div>

                          {/* Rich text Body editor */}
                          <div className="flex-1 text-slate-850 pr-2">
                            <div
                              ref={editorRef}
                              contentEditable
                              suppressContentEditableWarning
                              className="outline-none min-h-[300px] border-none py-1 focus:ring-1 focus:ring-primary/20 rounded-xl px-2 transition-all"
                              style={{ fontSize: "10.5pt", fontFamily: "Arial, sans-serif", lineHeight: "1.5" }}
                            />
                          </div>

                          {/* Signature workflow names visual display */}
                          {(() => {
                            const validSteps = getAllWorkflowSteps();
                            if (validSteps.length === 0) return null;

                            const renderSigner = (step: { userId: string }, idx: number, total: number) => {
                              const u = users.find(user => user.id === step.userId);
                              if (!u) return null;

                              let label = "Mengetahui,";
                              if (total === 1) label = "Menyetujui,";
                              else if (idx === total - 1) label = "Menyetujui,";

                              return (
                                <div key={idx} className="min-w-[150px] text-slate-800 animate-in fade-in duration-300 text-center">
                                  <p className="font-bold uppercase tracking-widest mb-16 text-slate-500" style={{ fontSize: "10pt" }}>
                                    {label}
                                  </p>
                                  <p className="font-extrabold underline text-slate-900" style={{ fontSize: "10.5pt" }}>{u.fullName}</p>
                                  <p className="font-semibold text-slate-500" style={{ fontSize: "10pt" }}>{u.jobTitle || u.role?.name || "Pejabat Organisasi"}</p>
                                </div>
                              );
                            };

                            return (
                              <div className="mt-16 pt-8 mb-12 border-t border-dashed border-slate-100">
                                {validSteps.length === 1 && (
                                  <div className="flex justify-end">
                                    {renderSigner(validSteps[0], 0, 1)}
                                  </div>
                                )}
                                {validSteps.length >= 2 && (
                                  <div className="grid grid-cols-2 gap-y-12 gap-x-8">
                                    {validSteps.map((step, idx) => {
                                      const isLastOdd = idx === validSteps.length - 1 && validSteps.length % 2 !== 0;
                                      return (
                                        <div key={idx} className={cn(
                                          isLastOdd ? "col-span-2 flex justify-center" : (idx % 2 === 0 ? "flex justify-start" : "flex justify-end")
                                        )}>
                                          {renderSigner(step, idx, validSteps.length)}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          </div>
                        </div>
                      </>
                    ) : (
                      /* iframe dynamic preview mode for DB templates */
                      <div className="bg-slate-100 dark:bg-slate-900/60 p-2 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-center overflow-x-auto">
                        <iframe
                          srcDoc={selectedTemplateObj ? (
                            '<!DOCTYPE html><html><head><meta charset="utf-8">' +
                            '<style>' +
                            '* { box-sizing: border-box; }' +
                            'html, body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: Arial, sans-serif; color: #111827; -webkit-font-smoothing: antialiased; }' +
                            'body { padding: 16px 8px; display: flex; flex-direction: column; align-items: center; min-height: 100vh; }' +
                            '.a4-page-sheet { width: 794px; max-width: 100%; min-height: 1123px; background: #ffffff; padding: 20mm 20mm 20mm 20mm; box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04); border-radius: 3px; box-sizing: border-box; font-size: 10.5pt; line-height: 1.45; position: relative; }' +
                            '.kop-surat-img, img[alt*="Kop Surat"] { width: 100% !important; max-width: 100% !important; height: auto !important; display: block !important; margin: 0 auto 6px auto !important; }' +
                            'img[src*="bismillah"], img[alt*="Bismillah"], .bismillah-img { width: 260px !important; max-width: 45% !important; height: auto !important; max-height: 48px !important; display: block !important; margin: 8px auto 14px auto !important; object-fit: contain !important; filter: brightness(0) !important; }' +
                            'p, td, li, span { font-size: 10.5pt; line-height: 1.45; }' +
                            'table { font-size: 10.5pt; }' +
                            'table td { vertical-align: top; }' +
                            '.page-break { page-break-before: always; margin-top: 30px; padding-top: 20px; border-top: 2px dashed #cbd5e1; position: relative; }' +
                            '.page-break::before { content: "📄 HALAMAN BERIKUTNYA (LAMPIRAN)"; display: block; text-align: center; font-size: 9pt; font-weight: bold; color: #64748b; margin-bottom: 20px; letter-spacing: 0.5px; }' +
                            '</style></head><body><div class="a4-page-sheet">' +
                            (bismillahBase64
                              ? (selectedTemplateObj.htmlContent || '')
                                  .replace(/src=["'][^"']*bismillah\.svg["']/gi, 'src="' + bismillahBase64 + '"')
                                  .replace(/src=["']data:image\/svg\+xml;base64,[^"']*["']/gi, 'src="' + bismillahBase64 + '"')
                              : (selectedTemplateObj.htmlContent || '')
                            ).replace(
                              /\{\{(\w+)\}\}/g,
                              (_: string, key: string) => {
                                let val = templateVariables[key];
                                if (val !== undefined && val !== "") {
                                  if (typeof val === "string" && val.includes("<table")) {
                                    val = val.replace(/(<table\b[^>]*>[\s\S]*?<\/table>)/gi, (tbl: string) => {
                                      return tbl.replace(/<br\s*\/?>/gi, "");
                                    });
                                  }
                                  return val;
                                }
                                return '<span style="background:#fef3c7;padding:0 2px;">{{' + key + '}}</span>';
                              }
                            ) +
                            '</div></body></html>'
                          ) : ""}
                          className="w-full min-h-[1150px] border-0 rounded-2xl bg-transparent"
                          title="preview"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* BOTTOM SECTION: Form & Tabs */}
              <div>
                <form onSubmit={handleSaveTemplate} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-md rounded-[28px] p-6 space-y-6">

                  <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Formulir Pembuatan Surat</h3>
                      <p className="text-xs text-slate-400 mt-1">Lengkapi data di bawah ini untuk mengisi surat di atas.</p>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto scrollbar-thin max-w-full">
                      {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        const hasErr = hasTabError(tab.id);
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                              "flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap relative",
                              isActive
                                ? "border-primary text-primary"
                                : hasErr
                                  ? "border-red-400 text-red-500"
                                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                          >
                            <Icon size={14} />
                            <span>{tab.label}</span>
                            {hasErr && (
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-0.5" title="Ada isian wajib yang belum diisi" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tab Content Panel */}
                  <div className="min-h-[220px]">
                    {activeTab === "info" && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        {/* Row 1: Nomor Surat & Template selector */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                              <Hash size={10} />
                              Nomor Surat <span className="text-red-500 font-bold ml-0.5">*</span>
                            </label>
                            <div className="relative group">
                              <input
                                type="text"
                                required
                                placeholder="Generate otomatis"
                                className={cn(
                                  "w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 transition-all text-sm font-mono tracking-wide pr-12",
                                  formErrors.generatedDocNumber
                                    ? "border-2 border-red-500 focus:ring-red-200 dark:focus:ring-red-900/40"
                                    : "border-none focus:ring-primary/20"
                                )}
                                value={generatedDocNumber}
                                onChange={(e) => {
                                  setGeneratedDocNumber(e.target.value);
                                  clearFieldError("generatedDocNumber");
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => fetchDocNumber(selectedTemplate)}
                                disabled={loadingDocNumber}
                                title="Generate ulang nomor"
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-all disabled:opacity-50"
                              >
                                <RefreshCw size={14} className={loadingDocNumber ? 'animate-spin' : ''} />
                              </button>
                            </div>
                            {formErrors.generatedDocNumber ? (
                              <p className="text-[10px] text-red-500 font-semibold ml-1 flex items-center gap-1 mt-1">
                                <AlertCircle size={10} />
                                {formErrors.generatedDocNumber}
                              </p>
                            ) : (
                              <p className="text-[9px] text-slate-400 ml-1">Format: Nomor/Kode/DSN-MUI/Bulan/Tahun</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                              Template Surat Keluar <span className="text-red-500 font-bold ml-0.5">*</span>
                            </label>
                            <div className="relative">
                              <select
                                className={cn(
                                  "w-full pl-5 pr-10 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 transition-all text-sm appearance-none font-bold text-primary",
                                  formErrors.selectedTemplate
                                    ? "border-2 border-red-500 focus:ring-red-200 dark:focus:ring-red-900/40"
                                    : "border-none focus:ring-primary/20"
                                )}
                                value={selectedTemplate}
                                onChange={(e) => {
                                  setSelectedTemplate(e.target.value);
                                  clearFieldError("selectedTemplate");
                                }}
                              >
                                <optgroup label="Template Standar (Rich Text)">
                                  {dbTemplates.filter(t => t.code && EDITOR_TEMPLATES.includes(t.code)).map(t => (
                                    <option key={t.id} value={t.code}>{t.name}</option>
                                  ))}
                                </optgroup>
                                <optgroup label="Template DSN-MUI (Isian)">
                                  {dbTemplates.filter(t => t.code && !EDITOR_TEMPLATES.includes(t.code)).map(t => (
                                    <option key={t.id} value={t.code}>{t.name}</option>
                                  ))}
                                </optgroup>
                              </select>
                              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                            {formErrors.selectedTemplate && (
                              <p className="text-[10px] text-red-500 font-semibold ml-1 flex items-center gap-1 mt-1">
                                <AlertCircle size={10} />
                                {formErrors.selectedTemplate}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Row 2: Perihal */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                            Perihal <span className="text-red-500 font-bold ml-0.5">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Contoh: Undangan Rapat Koordinasi Program"
                            className={cn(
                              "w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 transition-all text-sm",
                              formErrors.perihal
                                ? "border-2 border-red-500 focus:ring-red-200 dark:focus:ring-red-900/40"
                                : "border-none focus:ring-primary/20"
                            )}
                            value={perihal}
                            onChange={(e) => {
                              setPerihal(e.target.value);
                              clearFieldError("perihal");
                            }}
                          />
                          {formErrors.perihal && (
                            <p className="text-[10px] text-red-500 font-semibold ml-1 flex items-center gap-1 mt-1">
                              <AlertCircle size={10} />
                              {formErrors.perihal}
                            </p>
                          )}
                        </div>

                        {/* Row 3: Kategori & Klasifikasi */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Category and Subcategory Wrapper */}
                          <div className="space-y-4 col-span-1">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                Kategori <span className="text-red-500 font-bold ml-0.5">*</span>
                              </label>
                              <div className="relative">
                                <select
                                  required
                                  className={cn(
                                    "w-full pl-5 pr-10 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 transition-all text-sm appearance-none",
                                    formErrors.categoryId
                                      ? "border-2 border-red-500 focus:ring-red-200 dark:focus:ring-red-900/40"
                                      : "border-none focus:ring-primary/20"
                                  )}
                                  value={categoryId}
                                  onChange={(e) => {
                                    setCategoryId(e.target.value);
                                    clearFieldError("categoryId");
                                    setSubCategory("");
                                    clearFieldError("subCategory");
                                  }}
                                >
                                  <option value="">Pilih Kategori</option>
                                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                              </div>
                              {formErrors.categoryId && (
                                <p className="text-[10px] text-red-500 font-semibold ml-1 flex items-center gap-1 mt-1">
                                  <AlertCircle size={10} />
                                  {formErrors.categoryId}
                                </p>
                              )}
                            </div>

                            {/* Subcategory */}
                            {(() => {
                              const selectedCatName = categories.find(c => c.id === categoryId)?.name;
                              const subCats = selectedCatName ? CATEGORY_SUBCATEGORIES[selectedCatName] : undefined;
                              if (!subCats || subCats.length === 0) return null;
                              
                              return (
                                <div className="space-y-2 animate-in fade-in duration-300">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                    Subkategori <span className="text-red-500 font-bold ml-0.5">*</span>
                                  </label>
                                  <div className="relative">
                                    <select
                                      required
                                      className={cn(
                                        "w-full pl-5 pr-10 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 transition-all text-sm appearance-none",
                                        formErrors.subCategory
                                          ? "border-2 border-red-500 focus:ring-red-200 dark:focus:ring-red-900/40"
                                          : "border-none focus:ring-primary/20"
                                      )}
                                      value={subCategory}
                                      onChange={(e) => {
                                        setSubCategory(e.target.value);
                                        clearFieldError("subCategory");
                                      }}
                                    >
                                      <option value="">Pilih Subkategori</option>
                                      {subCats.map((sub, idx) => (
                                        <option key={idx} value={sub}>{sub}</option>
                                      ))}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                  </div>
                                  {formErrors.subCategory && (
                                    <p className="text-[10px] text-red-500 font-semibold ml-1 flex items-center gap-1 mt-1">
                                      <AlertCircle size={10} />
                                      {formErrors.subCategory}
                                    </p>
                                  )}
                                </div>
                              );
                            })()}
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                              Klasifikasi <span className="text-red-500 font-bold ml-0.5">*</span>
                            </label>
                            <div className="relative">
                              <select
                                required
                                className={cn(
                                  "w-full pl-5 pr-10 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 transition-all text-sm appearance-none",
                                  formErrors.classificationId
                                    ? "border-2 border-red-500 focus:ring-red-200 dark:focus:ring-red-900/40"
                                    : "border-none focus:ring-primary/20"
                                )}
                                value={classificationId}
                                onChange={(e) => {
                                  setClassificationId(e.target.value);
                                  clearFieldError("classificationId");
                                }}
                              >
                                <option value="">Pilih Klasifikasi</option>
                                {classifications.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                              </select>
                              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                            {formErrors.classificationId && (
                              <p className="text-[10px] text-red-500 font-semibold ml-1 flex items-center gap-1 mt-1">
                                <AlertCircle size={10} />
                                {formErrors.classificationId}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "detail" && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        {/* Row 4: Tempat, Tgl Masehi, Tgl Hijriah */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                              Tempat Dibuat <span className="text-red-500 font-bold ml-0.5">*</span>
                            </label>
                            <div className="relative group">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={16} />
                              <input
                                type="text"
                                required
                                placeholder="Contoh: Jakarta"
                                className={cn(
                                  "w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 transition-all text-sm",
                                  formErrors.tempatDibuat
                                    ? "border-2 border-red-500 focus:ring-red-200 dark:focus:ring-red-900/40"
                                    : "border-none focus:ring-primary/20"
                                )}
                                value={tempatDibuat}
                                onChange={(e) => {
                                  setTempatDibuat(e.target.value);
                                  clearFieldError("tempatDibuat");
                                }}
                              />
                            </div>
                            {formErrors.tempatDibuat && (
                              <p className="text-[10px] text-red-500 font-semibold ml-1 flex items-center gap-1 mt-1">
                                <AlertCircle size={10} />
                                {formErrors.tempatDibuat}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                              Tanggal (Masehi) <span className="text-red-500 font-bold ml-0.5">*</span>
                            </label>
                            <input
                              type="date"
                              required
                              className={cn(
                                "w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 transition-all text-sm",
                                formErrors.tanggalMasehi
                                  ? "border-2 border-red-500 focus:ring-red-200 dark:focus:ring-red-900/40"
                                  : "border-none focus:ring-primary/20"
                              )}
                              value={tanggalMasehi}
                              onChange={(e) => {
                                handleDateChange(e.target.value);
                                clearFieldError("tanggalMasehi");
                              }}
                            />
                            {formErrors.tanggalMasehi && (
                              <p className="text-[10px] text-red-500 font-semibold ml-1 flex items-center gap-1 mt-1">
                                <AlertCircle size={10} />
                                {formErrors.tanggalMasehi}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                              Tanggal (Hijriah) <span className="text-red-500 font-bold ml-0.5">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="19 Dzulhijjah 1447 H"
                              className={cn(
                                "w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 transition-all text-sm font-mono",
                                formErrors.tanggalHijriah
                                  ? "border-2 border-red-500 focus:ring-red-200 dark:focus:ring-red-900/40"
                                  : "border-none focus:ring-primary/20"
                              )}
                              value={tanggalHijriah}
                              onChange={(e) => {
                                setTanggalHijriah(e.target.value);
                                clearFieldError("tanggalHijriah");
                              }}
                            />
                            {formErrors.tanggalHijriah && (
                              <p className="text-[10px] text-red-500 font-semibold ml-1 flex items-center gap-1 mt-1">
                                <AlertCircle size={10} />
                                {formErrors.tanggalHijriah}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Row 5: Lampiran & Catatan & Dokumen Pendukung */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                Jumlah Lampiran <span className="text-slate-400 font-normal lowercase">(opsional)</span>
                              </label>
                              <input
                                type="text"
                                placeholder="Contoh: 1 Berkas / 2 Lembar"
                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                                value={lampiran}
                                onChange={(e) => setLampiran(e.target.value)}
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                Catatan Dokumen <span className="text-slate-400 font-normal lowercase">(opsional)</span>
                              </label>
                              <textarea
                                placeholder="Catatan pendukung administrasi..."
                                className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm resize-none h-[80px]"
                                value={catatan}
                                onChange={(e) => setCatatan(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                              Dokumen Pendukung <span className="text-slate-400 font-normal lowercase">(upload opsional)</span>
                            </label>
                            <div className={cn(
                              "border border-dashed rounded-2xl p-4 flex flex-col items-center justify-center transition-all cursor-pointer relative h-[162px]",
                              dokumenPendukung ? "border-primary/50 bg-primary/5" : "border-slate-200 dark:border-slate-800 hover:border-primary/20"
                            )}>
                              <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    setDokumenPendukung(e.target.files[0]);
                                  }
                                }}
                              />
                              {dokumenPendukung ? (
                                <div className="flex flex-col items-center text-center animate-in zoom-in duration-200">
                                  <Check className="text-primary mb-1" size={20} />
                                  <p className="text-xs font-bold text-slate-800 dark:text-white max-w-[200px] truncate">{dokumenPendukung.name}</p>
                                  <button
                                    type="button"
                                    onClick={() => setDokumenPendukung(null)}
                                    className="mt-2 px-3 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors"
                                  >
                                    Hapus File
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center text-center">
                                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                                    <Upload className="text-slate-400" size={18} />
                                  </div>
                                  <p className="text-xs font-bold text-slate-800 dark:text-white">Pilih Lampiran Pendukung</p>
                                  <p className="text-[10px] text-slate-400 mt-1">PDF, DOC, DOCX maks 5MB</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "variables" && !isEditorMode && selectedTemplateObj?.variables && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="border-b border-slate-100 dark:border-slate-850 pb-2">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Isian Variabel Template</h4>
                          <p className="text-[10px] text-slate-400">Isi variabel khusus untuk konten template surat ini.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                          {selectedTemplateObj.variables
                            .filter((v: any) => {
                              if (["nomorSurat", "perihal", "lampiran", "tempatDibuat", "tanggalSurat", "tanggalMasehi", "tanggalHijriah", "showAgendaDetail", "lampiranDisplay"].includes(v.key)) {
                                return false;
                              }
                              if (v.key === "agendaDetail" && templateVariables.showAgendaDetail !== "block") {
                                return false;
                              }
                              return true;
                            })
                            .map((v: any) => {
                              const errKey = `var_${v.key}`;
                              const hasErr = !!formErrors[errKey];
                              const isRichText =
                                v.type === "wysiwyg" ||
                                v.key === "agendaDetail" ||
                                v.key === "daftarUndangan" ||
                                v.key === "daftarUndanganLampiran" ||
                                v.key === "agendaRapatLampiran" ||
                                v.key === "keteranganNarahubung" ||
                                v.key === "keterangan" ||
                                v.key === "deskripsiTransaksi" ||
                                v.key === "isiSurat" ||
                                v.key === "lampiranKonten" ||
                                v.key === "namaTim" ||
                                v.key === "keperluan" ||
                                v.key.toLowerCase().includes("lampiran") ||
                                v.key.toLowerCase().includes("wysiwyg") ||
                                v.key.toLowerCase().includes("isisurat");

                              return (
                                <div
                                  key={v.key}
                                  className={cn(
                                    "space-y-2",
                                    (v.key === "headerTtd" ||
                                      v.key === "daftarNamaPenugasan" ||
                                      v.key === "jabatan" ||
                                      v.key === "tempatKegiatan" ||
                                      v.key === "keperluan" ||
                                      v.key === "waktuTugas" ||
                                      isRichText) &&
                                      "md:col-span-2"
                                  )}
                                >
                                  {v.key === "agendaRapat" && (
                                    <div className="flex items-center gap-2 mb-1.5 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 md:col-span-2">
                                      <input
                                        type="checkbox"
                                        id="toggle-agenda-terlampir"
                                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer"
                                        checked={templateVariables.showAgendaDetail === "block"}
                                        onChange={(e) => {
                                          const isChecked = e.target.checked;
                                          setTemplateVariables({
                                            ...templateVariables,
                                            agendaRapat: isChecked ? "Terlampir" : "",
                                            showAgendaDetail: isChecked ? "block" : "none",
                                            ...(isChecked ? {} : { agendaDetail: "" }),
                                          });
                                          // clear errors
                                          const newErrs = { ...formErrors };
                                          delete newErrs.var_agendaRapat;
                                          delete newErrs.var_agendaDetail;
                                          setFormErrors(newErrs);
                                        }}
                                      />
                                      <label htmlFor="toggle-agenda-terlampir" className="text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                        Agenda Rapat Terlampir (Detail Agenda di Halaman Ketiga)
                                      </label>
                                    </div>
                                  )}

                                  {v.key === "lampiranKonten" && (
                                    <div className="flex items-center gap-2 mb-1.5 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 md:col-span-2">
                                      <input
                                        type="checkbox"
                                        id="toggle-lampiran-konten"
                                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer"
                                        checked={templateVariables.lampiranDisplay === "block"}
                                        onChange={(e) => {
                                          const isChecked = e.target.checked;
                                          setTemplateVariables({
                                            ...templateVariables,
                                            lampiranDisplay: isChecked ? "block" : "none",
                                          });
                                          if (isChecked && (!lampiran || lampiran === "-----" || lampiran === "—")) {
                                            setLampiran("1 (satu) berkas");
                                          } else if (!isChecked && lampiran === "1 (satu) berkas") {
                                            setLampiran("-----");
                                          }
                                        }}
                                      />
                                      <label htmlFor="toggle-lampiran-konten" className="text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                        Sertakan Halaman Lampiran (Halaman Berikutnya dengan Editor WYSIWYG)
                                      </label>
                                    </div>
                                  )}

                                  {v.key === "lampiranKonten" && templateVariables.lampiranDisplay !== "block" ? null : (
                                    <>
                                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
                                        {v.label}
                                        {v.required && <span className="text-red-500 ml-0.5">*</span>}
                                      </label>

                                      {v.key === "waktuTugas" ? (
                                        <div className="space-y-2">
                                          <div className="grid grid-cols-2 gap-2">
                                            <div>
                                              <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Tanggal Mulai:</label>
                                              <input
                                                type="date"
                                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs outline-none border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20"
                                                value={templateVariables.waktuTugasMulai || "2026-08-12"}
                                                onChange={(e) => {
                                                  const mulai = e.target.value;
                                                  const selesai = templateVariables.waktuTugasSelesai || "2026-09-12";
                                                  const fmtMulai = mulai ? new Date(mulai + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "";
                                                  const fmtSelesai = selesai ? new Date(selesai + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "";
                                                  const formatted = fmtMulai && fmtSelesai ? `${fmtMulai} – ${fmtSelesai}` : fmtMulai || fmtSelesai;
                                                  setTemplateVariables({
                                                    ...templateVariables,
                                                    waktuTugasMulai: mulai,
                                                    waktuTugas: formatted,
                                                  });
                                                  clearFieldError(errKey);
                                                }}
                                              />
                                            </div>
                                            <div>
                                              <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Tanggal Selesai:</label>
                                              <input
                                                type="date"
                                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs outline-none border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20"
                                                value={templateVariables.waktuTugasSelesai || "2026-09-12"}
                                                onChange={(e) => {
                                                  const selesai = e.target.value;
                                                  const mulai = templateVariables.waktuTugasMulai || "2026-08-12";
                                                  const fmtMulai = mulai ? new Date(mulai + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "";
                                                  const fmtSelesai = selesai ? new Date(selesai + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "";
                                                  const formatted = fmtMulai && fmtSelesai ? `${fmtMulai} – ${fmtSelesai}` : fmtMulai || fmtSelesai;
                                                  setTemplateVariables({
                                                    ...templateVariables,
                                                    waktuTugasSelesai: selesai,
                                                    waktuTugas: formatted,
                                                  });
                                                  clearFieldError(errKey);
                                                }}
                                              />
                                            </div>
                                          </div>
                                          <div>
                                            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Penyajian Format di Surat:</label>
                                            <input
                                              type="text"
                                              placeholder="12 Agustus 2026 – 12 September 2026"
                                              value={templateVariables.waktuTugas || ""}
                                              onChange={(e) => {
                                                setTemplateVariables({ ...templateVariables, waktuTugas: e.target.value });
                                                clearFieldError(errKey);
                                              }}
                                              className={cn(
                                                "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs outline-none border transition-all font-medium",
                                                hasErr ? "border-red-500 focus:ring-red-200" : "border-slate-200 dark:border-slate-700 focus:ring-primary/20"
                                              )}
                                            />
                                          </div>
                                        </div>
                                      ) : isRichText ? (
                                        <SimpleRichEditor
                                          value={templateVariables[v.key] || ""}
                                          placeholder={v.placeholder || `Masukkan ${v.label}`}
                                          hasError={hasErr}
                                          onChange={(val) => {
                                            setTemplateVariables({ ...templateVariables, [v.key]: val });
                                            clearFieldError(errKey);
                                          }}
                                        />
                                      ) : v.type === "textarea" ? (
                                    <textarea
                                      required={v.required}
                                      placeholder={v.placeholder || `Masukkan ${v.label}`}
                                      className={cn(
                                        "w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 transition-all text-sm resize-none",
                                        v.key.toLowerCase().includes("lampiran") || v.key.toLowerCase().includes("undangan") || v.key.toLowerCase().includes("agenda") || v.key.toLowerCase().includes("nama") || v.key.toLowerCase().includes("jabatan") ? "h-[100px]" : "h-[80px]",
                                        hasErr ? "border-2 border-red-500 focus:ring-red-200" : "border-none focus:ring-primary/20"
                                      )}
                                      value={templateVariables[v.key] || ""}
                                      onChange={(e) => {
                                        setTemplateVariables({ ...templateVariables, [v.key]: e.target.value });
                                        clearFieldError(errKey);
                                      }}
                                    />
                                  ) : v.type === "date" ? (
                                    <input
                                      type="date"
                                      required={v.required}
                                      className={cn(
                                        "w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 transition-all text-sm",
                                        hasErr ? "border-2 border-red-500 focus:ring-red-200" : "border-none focus:ring-primary/20"
                                      )}
                                      value={templateVariables[v.key] || ""}
                                      onChange={(e) => {
                                        const d = new Date(e.target.value);
                                        const formatted = !isNaN(d.getTime()) ? d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "";
                                        setTemplateVariables({ ...templateVariables, [v.key]: formatted });
                                        clearFieldError(errKey);
                                      }}
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      required={v.required}
                                      disabled={v.key === "agendaRapat" && templateVariables.showAgendaDetail === "block"}
                                      placeholder={v.placeholder || `Masukkan ${v.label}`}
                                      className={cn(
                                        "w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 transition-all text-sm",
                                        hasErr ? "border-2 border-red-500 focus:ring-red-200" : "border-none focus:ring-primary/20",
                                        v.key === "agendaRapat" && templateVariables.showAgendaDetail === "block" && "opacity-75 cursor-not-allowed bg-slate-100 dark:bg-slate-850"
                                      )}
                                      value={templateVariables[v.key] || ""}
                                      onChange={(e) => {
                                        setTemplateVariables({ ...templateVariables, [v.key]: e.target.value });
                                        clearFieldError(errKey);
                                      }}
                                    />
                                  )}
                                  {hasErr && (
                                    <p className="text-[10px] text-red-500 font-semibold ml-1 flex items-center gap-1 mt-1">
                                      <AlertCircle size={10} />
                                      {formErrors[errKey]}
                                    </p>
                                  )}
                                    </>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {activeTab === "signers" && (
                      <div className="space-y-5 animate-in fade-in duration-200">
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <UserCheck size={14} className="text-primary" />
                            Alur Penandatanganan & Persetujuan Surat <span className="text-red-500 font-bold ml-0.5">*</span>
                          </h4>
                          <p className="text-[10px] text-slate-400">
                            Tentukan daftar Pemparaf, Approver, dan Penandatangan secara berurutan.
                          </p>
                        </div>

                        {formErrors.steps && (
                          <p className="text-[10px] text-red-500 font-semibold ml-1 flex items-center gap-1 bg-red-50 dark:bg-red-950/30 p-2.5 rounded-xl border border-red-200 dark:border-red-900/50">
                            <AlertCircle size={12} />
                            {formErrors.steps}
                          </p>
                        )}

                        <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                          {/* 1. PEMPARAF */}
                          <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                                  1
                                </div>
                                <div>
                                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">Pemparaf</h5>
                                  <p className="text-[10px] text-slate-400">Petugas / Pejabat yang membubuhkan paraf awal (opsional)</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={handleAddPemparaf}
                                className="text-xs font-extrabold text-primary hover:underline flex items-center gap-1 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                              >
                                <Plus size={13} />
                                <span>Tambah Pemparaf</span>
                              </button>
                            </div>

                            {pemparafList.length === 0 ? (
                              <p className="text-[11px] italic text-slate-400 text-center py-2 border border-dashed border-slate-200/80 dark:border-slate-800 rounded-xl">
                                Belum ada pemparaf ditambahkan
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {pemparafList.map((item, idx) => (
                                  <div key={idx} className="flex gap-2 items-center">
                                    <span className="text-[10px] font-mono text-slate-400 w-6 text-center">#{idx + 1}</span>
                                    <select
                                      value={item.userId}
                                      onChange={(e) => handlePemparafChange(idx, e.target.value)}
                                      className={cn(
                                        "flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 rounded-xl outline-none focus:ring-2 text-xs appearance-none",
                                        !item.userId && formErrors.steps
                                          ? "border-2 border-red-500 focus:ring-red-200"
                                          : "border border-slate-200 dark:border-slate-700 focus:ring-primary/20"
                                      )}
                                    >
                                      <option value="">— Pilih Pemparaf —</option>
                                      {users.map((u) => (
                                        <option key={u.id} value={u.id}>
                                          {u.fullName} ({u.role?.name || u.jobTitle || 'Staff'})
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      type="button"
                                      onClick={() => handleRemovePemparaf(idx)}
                                      className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* 2. APPROVER */}
                          <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                                  2
                                </div>
                                <div>
                                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">Approver</h5>
                                  <p className="text-[10px] text-slate-400">Pemeriksa / Penyelia yang mengesahkan draft (opsional)</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={handleAddApprover}
                                className="text-xs font-extrabold text-primary hover:underline flex items-center gap-1 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                              >
                                <Plus size={13} />
                                <span>Tambah Approver</span>
                              </button>
                            </div>

                            {approverList.length === 0 ? (
                              <p className="text-[11px] italic text-slate-400 text-center py-2 border border-dashed border-slate-200/80 dark:border-slate-800 rounded-xl">
                                Belum ada approver ditambahkan
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {approverList.map((item, idx) => (
                                  <div key={idx} className="flex gap-2 items-center">
                                    <span className="text-[10px] font-mono text-slate-400 w-6 text-center">#{idx + 1}</span>
                                    <select
                                      value={item.userId}
                                      onChange={(e) => handleApproverChange(idx, e.target.value)}
                                      className={cn(
                                        "flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 rounded-xl outline-none focus:ring-2 text-xs appearance-none",
                                        !item.userId && formErrors.steps
                                          ? "border-2 border-red-500 focus:ring-red-200"
                                          : "border border-slate-200 dark:border-slate-700 focus:ring-primary/20"
                                      )}
                                    >
                                      <option value="">— Pilih Approver —</option>
                                      {users.map((u) => (
                                        <option key={u.id} value={u.id}>
                                          {u.fullName} ({u.role?.name || u.jobTitle || 'Pejabat'})
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveApprover(idx)}
                                      className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* 3. PENANDATANGAN */}
                          <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                                  3
                                </div>
                                <div>
                                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    Penandatangan <span className="text-red-500 font-bold ml-0.5">*</span>
                                  </h5>
                                  <p className="text-[10px] text-slate-400">Pejabat utama penandatangan surat keluar resmi</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={handleAddPenandatangan}
                                className="text-xs font-extrabold text-primary hover:underline flex items-center gap-1 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                              >
                                <Plus size={13} />
                                <span>Tambah Penandatangan</span>
                              </button>
                            </div>

                            <div className="space-y-2">
                              {penandatanganList.map((item, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                  <span className="text-[10px] font-mono text-slate-400 w-6 text-center">#{idx + 1}</span>
                                  <select
                                    required
                                    value={item.userId}
                                    onChange={(e) => handlePenandatanganChange(idx, e.target.value)}
                                    className={cn(
                                      "flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 rounded-xl outline-none focus:ring-2 text-xs appearance-none",
                                      !item.userId && formErrors.steps
                                        ? "border-2 border-red-500 focus:ring-red-200"
                                        : "border border-slate-200 dark:border-slate-700 focus:ring-primary/20"
                                    )}
                                  >
                                    <option value="">— Pilih Penandatangan —</option>
                                    {users.map((u) => (
                                      <option key={u.id} value={u.id}>
                                        {u.fullName} ({u.role?.name || u.jobTitle || 'Pejabat'})
                                      </option>
                                    ))}
                                  </select>
                                  {penandatanganList.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemovePenandatangan(idx)}
                                      className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-5">
                    <button
                      type="submit"
                      disabled={submitting || success}
                      className="flex-1 gradient-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <UserCheck size={18} />
                          <span>Simpan & Kirim</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="px-6 py-4 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-slate-800"
                    >
                      Batal
                    </button>
                  </div>

                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CreateDocumentPage;
