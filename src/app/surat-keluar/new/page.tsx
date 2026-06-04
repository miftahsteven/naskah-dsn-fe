"use client";

import React, { useState, useEffect, useRef } from "react";
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
  UserCheck
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

// List of available templates
const templatesList = [
  { id: "rutin", name: "Surat Rutin Internal" },
  { id: "pengantar", name: "Surat Pengantar Internal" },
  { id: "keputusan", name: "Surat Keputusan" },
  { id: "mandat", name: "Surat Mandat" },
  { id: "tugas", name: "Surat Tugas" },
  { id: "informasi", name: "Surat Informasi" },
];

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
        <p>Dengan hormat,</p>
        <p>Dalam rangka implementasi program digitalisasi administrasi di lingkungan Pengurus Besar Nahdlatul Ulama, dengan ini menugaskan kepada:</p>
        <table style="width: 100%; margin: 12px 0; border-collapse: collapse;">
          <tbody>
            <tr><td style="width: 25%; padding: 4px 0; font-weight: bold;">Nama</td><td>: Dr. Miftahul Ulum</td></tr>
            <tr><td style="padding: 4px 0; font-weight: bold;">Jabatan</td><td>: Direktur TI & Sistem Informasi</td></tr>
            <tr><td style="padding: 4px 0; font-weight: bold;">Tugas</td><td>: Melakukan sosialisasi & pendampingan teknis penggunaan aplikasi persuratan digital di kantor wilayah Jawa Barat.</td></tr>
            <tr><td style="padding: 4px 0; font-weight: bold;">Durasi Tugas</td><td>: 8 Juni s.d 12 Juni 2026</td></tr>
          </tbody>
        </table>
        <p>Setelah melaksanakan tugas tersebut, penerima tugas wajib memberikan laporan tertulis hasil pelaksanaan kegiatan kepada pimpinan organisasi. Atas perhatian dan dukungannya, diucapkan terima kasih.</p>
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

  useEffect(() => {
    toDataURL("/images/logo-dsn.png")
      .then(base64 => setLogoBase64(base64))
      .catch(err => console.error("Failed to convert logo to base64", err));
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
  const [classificationId, setClassificationId] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Mode 2: Template States
  const [selectedTemplate, setSelectedTemplate] = useState("rutin");
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
  const [steps, setSteps] = useState<{ userId: string }[]>([{ userId: "" }]);

  // Upload/Processing States
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Fetch Meta & Users
  useEffect(() => {
    const fetchMetaAndUsers = async () => {
      try {
        const [metaRes, usersRes] = await Promise.all([
          api.get("/documents/meta"),
          api.get("/users"),
        ]);
        setCategories(metaRes.data.data.categories);
        setClassifications(metaRes.data.data.classifications);
        setUsers(usersRes.data.data || []);
        
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
    if (editorRef.current && creationMode === "template") {
      editorRef.current.innerHTML = getDefaultTemplateBody(selectedTemplate);
    }
  }, [selectedTemplate, creationMode]);

  // Date Change Handler
  const handleDateChange = (val: string) => {
    setTanggalMasehi(val);
    setTanggalHijriah(getEstimatedHijriah(val));
  };

  // Workflow steps handlers
  const handleAddStep = () => setSteps([...steps, { userId: "" }]);
  const handleRemoveStep = (index: number) => {
    if (steps.length === 1) return;
    setSteps(steps.filter((_, i) => i !== index));
  };
  const handleUserChange = (index: number, val: string) => {
    const newSteps = [...steps];
    newSteps[index].userId = val;
    setSteps(newSteps);
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

    setSubmitting(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("documentNumber", docNumber);
    formData.append("categoryId", categoryId);
    formData.append("classificationId", classificationId);
    formData.append("documentType", "OUTGOING");

    try {
      await api.post("/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
          setProgress(percentCompleted);
        },
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/surat-keluar");
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal mengunggah dokumen");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perihal) {
      setError("Perihal wajib diisi karena digunakan sebagai judul surat");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    
    // Check workflow steps
    if (steps.some(s => !s.userId)) {
      setError("Harap tentukan semua penandatangan alur kerja atau hapus langkah kosong.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    setError("");

    // Generate Full HTML content
    const bodyHtml = editorRef.current?.innerHTML || "";
    const selectedTemplateObj = templatesList.find(t => t.id === selectedTemplate);
    const templateTitle = selectedTemplateObj ? selectedTemplateObj.name : "Surat Keluar";

    const resolvedSteps = steps.map((step, idx) => {
      const u = users.find(user => user.id === step.userId);
      return {
        name: u ? u.fullName : `Penandatangan ${idx + 1}`,
        title: u ? u.jobTitle || u.role?.name || "Pejabat Organisasi" : ""
      };
    });

    let signatureHtml = "";
    if (resolvedSteps.length > 0) {
      signatureHtml += `<div style="display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 40px; margin-top: 60px; page-break-inside: avoid; border-top: 1px dashed #e2e8f0; padding-top: 20px;">`;
      resolvedSteps.forEach((s) => {
        signatureHtml += `
          <div style="text-align: center; min-width: 180px;">
            <div style="font-size: 11px; color: #4b5563; margin-bottom: 45px;">Mengetahui/Menyetujui,</div>
            <div style="font-size: 12px; font-weight: bold; text-decoration: underline; color: #111827;">${s.name}</div>
            <div style="font-size: 10px; color: #6b7280; margin-top: 2px;">${s.title}</div>
          </div>
        `;
      });
      signatureHtml += `</div>`;
    }

    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${perihal}</title>
        <style>
          body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            color: #1f2937;
            line-height: 1.6;
            margin: 40px;
            font-size: 12px;
          }
          .kop-surat {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          .kop-title {
            font-size: 16px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #111827;
          }
          .kop-subtitle {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: #4b5563;
            margin-top: 2px;
          }
          .kop-address {
            font-size: 9px;
            color: #6b7280;
            margin-top: 4px;
          }
          .meta-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 24px;
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
          }
          .letter-title {
            text-align: center;
            font-size: 14px;
            font-weight: 800;
            text-decoration: underline;
            text-transform: uppercase;
            margin-top: 10px;
            margin-bottom: 20px;
            color: #111827;
          }
          .letter-body {
            font-size: 12px;
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
              <span>: [Nomor Resmi akan di-generate]</span>
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

    // Convert HTML string to File object
    const htmlFile = new File([fullHtml], `${selectedTemplateObj?.name}_${perihal}.html`, {
      type: "text/html",
    });

    const formData = new FormData();
    formData.append("file", htmlFile);
    formData.append("title", perihal);
    formData.append("documentNumber", ""); // Generated on submission approvals
    formData.append("categoryId", categoryId);
    formData.append("classificationId", classificationId);
    formData.append("documentType", "OUTGOING");

    // Optional supporting document metadata in catatan if needed
    if (catatan) {
      // Custom notes are sent as part of the document if supported, or we just put it in title or logs
    }

    try {
      // 1. Create the Document
      const docRes = await api.post("/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const documentId = docRes.data.data.id;

      // 2. Submit the Workflow config
      await api.post("/workflow/submit", {
        documentId,
        stepConfig: steps.map((s, i) => ({ stepNumber: i + 1, userId: s.userId })),
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
                      {/* Category */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                        <select
                          required
                          className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none"
                          value={categoryId}
                          onChange={(e) => setCategoryId(e.target.value)}
                        >
                          <option value="">Pilih Kategori</option>
                          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                      </div>

                      {/* Classification */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Klasifikasi</label>
                        <select
                          required
                          className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none"
                          value={classificationId}
                          onChange={(e) => setClassificationId(e.target.value)}
                        >
                          <option value="">Pilih Klasifikasi</option>
                          {classifications.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                        </select>
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
                              className="mt-4 text-xs font-bold text-red-500 hover:underline"
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
                            <p className="text-xs text-slate-400">PDF, DOC, DOCX maksimal 10MB</p>
                          </div>
                        )}
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
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              {/* LEFT: Live Interactive Preview Card */}
              <div className="xl:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">A4 Live Letter Preview & Editor</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full uppercase tracking-tight flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span>Real-time Binding</span>
                  </span>
                </div>

                {/* Letter Sheet */}
                <div className="bg-slate-100 dark:bg-slate-800/40 p-4 sm:p-8 rounded-[32px] border border-slate-200/60 dark:border-slate-800/80 shadow-inner max-h-[90vh] overflow-y-auto">
                  
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
                  <div className="bg-white text-slate-800 p-6 sm:p-10 shadow-2xl rounded-2xl min-h-[900px] border border-slate-100 flex flex-col font-sans overflow-hidden">
                    
                    {/* Kop Surat Header */}
                    <div className="border-b-[3px] border-double border-slate-900 pb-2 mb-3">
                      <div className="flex items-center justify-between gap-3">
                        {/* Left: Logo */}
                        <div className="w-[55px] h-[55px] flex-shrink-0">
                          <img
                            src="/images/logo-dsn.png"
                            alt="Logo DSN-MUI"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        
                        {/* Center: Organization info */}
                        <div className="text-left flex-1 min-w-0">
                          <h2 className="text-slate-900 font-extrabold text-[10.5px] sm:text-[11.5px] uppercase tracking-tight leading-snug whitespace-nowrap">
                            DEWAN SYARIAH NASIONAL - MAJELIS ULAMA INDONESIA
                          </h2>
                          <p className="text-slate-800 font-bold text-[8px] sm:text-[8.5px] leading-normal whitespace-nowrap">
                            National Sharia Board - Indonesian Council of Ulama
                          </p>
                          <p className="text-slate-600 text-[7px] mt-0.5 leading-normal whitespace-nowrap">
                            SEKRETARIAT : Jl. Dempo No.19 Pegangsaan - Jakarta Pusat 10320
                          </p>
                          <p className="text-slate-600 text-[7px] leading-normal whitespace-nowrap">
                            Telp. (021) 3904146 &nbsp; Email: sekretariat@dsnmui.or.id &nbsp; Web: www.dsnmui.or.id
                          </p>
                        </div>
                        
                        {/* Right: Certification Box */}
                        <div className="w-[65px] border border-slate-900 p-0.5 flex-shrink-0 text-center font-sans text-[6px] leading-tight font-bold text-slate-800">
                          <div className="border-b border-slate-900 pb-0.5 mb-0.5 text-[5px]">REGISTERED</div>
                          <div className="font-extrabold text-[7.5px] tracking-wide">WQA</div>
                          <div className="text-[6px] my-0.5">ISO 9001:2015</div>
                          <div className="border-t border-dashed border-slate-900 pt-0.5 mt-0.5 text-[4.5px]">UKAS 134</div>
                        </div>
                      </div>
                    </div>

                    {/* Bismillah Calligraphy */}
                    <div className="text-center text-lg font-serif text-slate-900 mb-4 tracking-wide font-medium">
                      بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
                    </div>

                    {/* Letter Title */}
                    <div className="text-center font-extrabold text-sm underline uppercase tracking-wide text-slate-900 mb-6">
                      {templatesList.find(t => t.id === selectedTemplate)?.name}
                    </div>

                    {/* Letter Metadata Info block */}
                    <div className="flex justify-between items-start text-xs mb-6 text-slate-700">
                      <div className="space-y-1">
                        <div className="flex gap-2">
                          <span className="font-bold w-[75px]">Nomor</span>
                          <span>: [Nomor Resmi akan di-generate]</span>
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
                    <div className="text-xs mb-6 text-slate-700 space-y-1">
                      <p>Kepada Yang Terhormat,</p>
                      <p className="font-bold text-slate-900">Pimpinan / Anggota Organisasi</p>
                      <p>di — Tempat</p>
                    </div>

                    {/* Rich text Body editor */}
                    <div className="flex-1 text-xs leading-relaxed text-slate-800 pr-2">
                      <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        className="outline-none min-h-[300px] border-none py-1 focus:ring-1 focus:ring-primary/20 rounded-xl px-2 transition-all"
                      />
                    </div>

                    {/* Signature workflow names visual display */}
                    {steps.length > 0 && steps.some(s => s.userId) && (
                      <div className="mt-12 pt-6 border-t border-dashed border-slate-100 flex flex-wrap justify-end gap-6 text-center">
                        {steps.map((step, idx) => {
                          const u = users.find(user => user.id === step.userId);
                          if (!u) return null;
                          return (
                            <div key={idx} className="min-w-[150px] text-slate-800 animate-in fade-in duration-300">
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-10">Menyetujui,</p>
                              <p className="text-xs font-extrabold underline text-slate-900">{u.fullName}</p>
                              <p className="text-[9px] text-slate-500 font-semibold">{u.jobTitle || u.role?.name || "Pejabat Organisasi"}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>
                </div>
              </div>

              {/* RIGHT: Form & Workflow Section */}
              <div className="xl:col-span-5">
                <form onSubmit={handleSaveTemplate} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-md rounded-[28px] p-6 space-y-6">
                  
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Formulir Pembuatan Surat</h3>
                    <p className="text-xs text-slate-400 mt-1">Lengkapi data di bawah ini untuk mengisi surat di sebelah kiri.</p>
                  </div>

                  {/* Template selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Template Surat Keluar</label>
                    <select
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none font-bold text-primary"
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                    >
                      {templatesList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Category */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                      <select
                        required
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none"
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                      >
                        <option value="">Pilih Kategori</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                      </select>
                    </div>

                    {/* Classification */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Klasifikasi</label>
                      <select
                        required
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none"
                        value={classificationId}
                        onChange={(e) => setClassificationId(e.target.value)}
                      >
                        <option value="">Pilih Klasifikasi</option>
                        {classifications.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Tempat Dibuat */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tempat Dibuat</label>
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Jakarta"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                        value={tempatDibuat}
                        onChange={(e) => setTempatDibuat(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Tanggal Masehi */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tanggal Terbit (Masehi)</label>
                      <input
                        type="date"
                        required
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                        value={tanggalMasehi}
                        onChange={(e) => handleDateChange(e.target.value)}
                      />
                    </div>

                    {/* Tanggal Hijriah */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tanggal Terbit (Hijriah)</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: 19 Dzulhijjah 1447 H"
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-mono"
                        value={tanggalHijriah}
                        onChange={(e) => setTanggalHijriah(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Perihal */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Perihal</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Undangan Rapat Koordinasi Program"
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                      value={perihal}
                      onChange={(e) => setPerihal(e.target.value)}
                    />
                  </div>

                  {/* Lampiran */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Jumlah Lampiran (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Contoh: 1 Berkas / 2 Lembar"
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                      value={lampiran}
                      onChange={(e) => setLampiran(e.target.value)}
                    />
                  </div>

                  {/* Dokumen Pendukung */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Dokumen Pendukung (Upload)</label>
                    <div className={cn(
                      "border border-dashed rounded-2xl p-4 flex flex-col items-center justify-center transition-all cursor-pointer relative min-h-[100px]",
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
                        <div className="flex flex-col items-center text-center">
                          <Check className="text-primary mb-1" size={16} />
                          <p className="text-xs font-bold text-slate-800 dark:text-white max-w-[200px] truncate">{dokumenPendukung.name}</p>
                          <button
                            type="button"
                            onClick={() => setDokumenPendukung(null)}
                            className="mt-2 text-[10px] font-bold text-red-500 hover:underline"
                          >
                            Hapus File
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center">
                          <Upload className="text-slate-400 mb-1" size={18} />
                          <p className="text-[11px] font-bold text-slate-800 dark:text-white">Pilih Lampiran Pendukung</p>
                          <p className="text-[10px] text-slate-400">PDF, DOC, DOCX maks 5MB</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Catatan */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Catatan Dokumen</label>
                    <textarea
                      placeholder="Masukkan catatan pendukung administrasi..."
                      className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm resize-none h-20"
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                    />
                  </div>

                  {/* Pejabat Penandatangan / Workflow selection */}
                  <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Alur Penandatangan Surat</label>
                      <button
                        type="button"
                        onClick={handleAddStep}
                        className="text-xs font-extrabold text-primary hover:underline flex items-center gap-1"
                      >
                        <Plus size={14} />
                        <span>Tambah Urutan</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {steps.map((step, idx) => (
                        <div key={idx} className="flex gap-2 items-center group animate-in slide-in-from-top-2 duration-200">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20 shrink-0">
                            {idx + 1}
                          </div>
                          
                          <select
                            required
                            value={step.userId}
                            onChange={(e) => handleUserChange(idx, e.target.value)}
                            className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-xs appearance-none"
                          >
                            <option value="">— Pilih Penandatangan —</option>
                            {users.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.fullName} ({u.role?.name || u.jobTitle})
                              </option>
                            ))}
                          </select>

                          {steps.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveStep(idx)}
                              className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
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
