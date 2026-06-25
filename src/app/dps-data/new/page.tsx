"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  ArrowRight,
  ChevronRight, 
  Save, 
  Upload, 
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  FileText, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { useDpsStore, DPSMember } from "@/stores/dps.store";

export default function NewDpsPage() {
  const router = useRouter();
  const { addDPS, loading } = useDpsStore();
  const [mounted, setMounted] = useState(false);

  // Active Tab: 1 to 5
  const [activeTab, setActiveTab] = useState(1);

  // Form Fields State
  const [formData, setFormData] = useState({
    status: "Calon DPS",
    jenisPenugasan: "Penuh Waktu",
    tanggalPengajuan: new Date().toISOString().split("T")[0],
    namaLengkap: "",
    tempatLahir: "",
    tanggalLahir: "",
    jenisKelamin: "Laki-laki",
    kewarganegaraan: "Indonesia",
    agama: "Islam",
    npwp: "",
    alamatDomisili: "",
    rtRw: "",
    kelurahan: "",
    kecamatan: "",
    kotaKabupaten: "",
    provinsi: "DKI Jakarta",
    kodePos: "",
    noTelepon: "",
    noHp: "",
    email: "",
    pendidikanTerakhir: "S3 - Ekonomi Islam",
    perguruanTinggi: "",
    tahunLulus: "",
    fotoFileName: "",

    // Tab 2: Jabatan
    lembagaPenempatan: "",
    jabatanDps: "Anggota",
    skPengangkatan: "",
    tanggalSk: "",
    masaJabatanMulai: "",
    masaJabatanSelesai: "",

    // Tab 3: Kompetensi
    pengalamanProfesional: "",
    bidangKeahlianString: "Fikih Muamalah, Perbankan Syariah",
  });

  // Tab 2 lists
  const [riwayatJabatan, setRiwayatJabatan] = useState<Array<{ lembaga: string; jabatan: string; periode: string }>>([
    { lembaga: "", jabatan: "", periode: "" }
  ]);

  // Tab 3 lists
  const [sertifikatPelatihan, setSertifikatPelatihan] = useState<Array<{ nama: string; lembaga: string; tahun: string }>>([
    { nama: "", lembaga: "", tahun: "" }
  ]);

  // Tab 4 uploads
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({
    ktp: "",
    npwp: "",
    ijazah: "",
    sk: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Handle standard changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Add/remove items for list fields
  const addRiwayat = () => setRiwayatJabatan(prev => [...prev, { lembaga: "", jabatan: "", periode: "" }]);
  const removeRiwayat = (idx: number) => setRiwayatJabatan(prev => prev.filter((_, i) => i !== idx));
  const handleRiwayatChange = (idx: number, field: string, value: string) => {
    setRiwayatJabatan(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const addSertifikat = () => setSertifikatPelatihan(prev => [...prev, { nama: "", lembaga: "", tahun: "" }]);
  const removeSertifikat = (idx: number) => setSertifikatPelatihan(prev => prev.filter((_, i) => i !== idx));
  const handleSertifikatChange = (idx: number, field: string, value: string) => {
    setSertifikatPelatihan(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  // File Upload Helper
  const handleFileUpload = (field: string, name: string) => {
    setUploadedFiles(prev => ({ ...prev, [field]: name }));
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare complete schema
    const newMember: Omit<DPSMember, 'id'> = {
      status: formData.status,
      jenisPenugasan: formData.jenisPenugasan,
      tanggalPengajuan: formData.tanggalPengajuan,
      namaLengkap: formData.namaLengkap || "Belum Bernama",
      tempatLahir: formData.tempatLahir,
      tanggalLahir: formData.tanggalLahir,
      jenisKelamin: formData.jenisKelamin,
      kewarganegaraan: formData.kewarganegaraan,
      agama: formData.agama,
      npwp: formData.npwp,
      alamatDomisili: formData.alamatDomisili,
      rtRw: formData.rtRw,
      kelurahan: formData.kelurahan,
      kecamatan: formData.kecamatan,
      kotaKabupaten: formData.kotaKabupaten,
      provinsi: formData.provinsi,
      kodePos: formData.kodePos,
      noTelepon: formData.noTelepon,
      noHp: formData.noHp,
      email: formData.email,
      pendidikanTerakhir: formData.pendidikanTerakhir,
      perguruanTinggi: formData.perguruanTinggi,
      tahunLulus: formData.tahunLulus,
      fotoUrl: formData.fotoFileName ? `/uploads/${formData.fotoFileName}` : undefined,

      lembagaPenempatan: formData.lembagaPenempatan,
      jabatanDps: formData.jabatanDps,
      skPengangkatan: formData.skPengangkatan,
      tanggalSk: formData.tanggalSk,
      masaJabatanMulai: formData.masaJabatanMulai,
      masaJabatanSelesai: formData.masaJabatanSelesai,
      riwayatJabatan: riwayatJabatan.filter(r => r.lembaga !== ""),

      sertifikatPelatihan: sertifikatPelatihan.filter(s => s.nama !== ""),
      bidangKeahlian: formData.bidangKeahlianString.split(",").map(t => t.trim()).filter(t => t !== ""),
      pengalamanProfesional: formData.pengalamanProfesional,

      dokumenFiles: Object.keys(uploadedFiles)
        .filter(key => uploadedFiles[key] !== "")
        .map(key => ({ tipe: key.toUpperCase(), namaFile: uploadedFiles[key] }))
    };

    const success = await addDPS(newMember);
    if (success) {
      alert("Data DPS Baru berhasil disimpan!");
      router.push("/dps-data");
    } else {
      alert("Gagal menyimpan data DPS baru.");
    }
  };

  const handleNext = () => {
    setActiveTab(prev => Math.min(5, prev + 1));
  };

  const handlePrev = () => {
    setActiveTab(prev => Math.max(1, prev - 1));
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300">
      
      {/* ── HEADER & BREADCRUMBS ── */}
      <div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
          <span>Dashboard</span>
          <ChevronRight size={10} />
          <span>DPS</span>
          <ChevronRight size={10} />
          <span className="text-[#006633] dark:text-[#D4AF37]">Input DPS Baru</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight mt-1">
          Input DPS Baru
        </h1>
        <p className="text-slate-500 dark:text-slate-405 text-xs font-semibold mt-1">
          Lengkapi semua formulir multi-tab di bawah ini untuk menambahkan anggota Dewan Pengawas Syariah baru.
        </p>
      </div>

      {/* ── FORM CONTAINER ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        
        {/* Form Inner Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-850">
          <h2 className="text-xs uppercase font-extrabold tracking-widest text-[#006633] dark:text-[#D4AF37]">
            Form Input DPS Baru
          </h2>
          <Link 
            href="/dps-data" 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-850 text-slate-650 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider transition-colors"
          >
            <ArrowLeft size={13} /> Kembali
          </Link>
        </div>

        {/* ── MULTI-TAB HEADERS ── */}
        <div className="flex border-b border-slate-100 dark:border-slate-850 overflow-x-auto">
          {[
            { id: 1, label: "Data Pribadi" },
            { id: 2, label: "Data Jabatan & Penugasan" },
            { id: 3, label: "Kompetensi & Sertifikasi" },
            { id: 4, label: "Dokumen Pendukung" },
            { id: 5, label: "Ringkasan" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[150px] py-4 text-center text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === tab.id 
                  ? "border-[#006633] text-[#006633] dark:border-[#D4AF37] dark:text-[#D4AF37]" 
                  : "border-transparent text-slate-450 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* ── TAB 1: DATA PRIBADI ── */}
          {activeTab === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Form Column (8 Cols) */}
              <div className="lg:col-span-8 space-y-5">
                
                {/* Row 1: Status DPS, Jenis Penugasan, Tanggal Pengajuan */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider mb-1.5">
                      Status DPS <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                        <User size={14} />
                      </span>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full pl-8 pr-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] text-slate-800 dark:text-slate-200 cursor-pointer"
                      >
                        <option value="Calon DPS">Calon DPS</option>
                        <option value="Aktif">Aktif</option>
                        <option value="Nonaktif">Nonaktif</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider mb-1.5">
                      Jenis Penugasan <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="jenisPenugasan"
                      value={formData.jenisPenugasan}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <option value="Penuh Waktu">Penuh Waktu</option>
                      <option value="Paruh Waktu">Paruh Waktu</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider mb-1.5">
                      Tanggal Pengajuan <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="tanggalPengajuan"
                        value={formData.tanggalPengajuan}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Nama Lengkap */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider mb-1.5">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="namaLengkap"
                    placeholder="Nama Lengkap beserta Gelar"
                    value={formData.namaLengkap}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] text-slate-800 dark:text-slate-200"
                  />
                </div>

                {/* Row 3: Tempat & Tanggal Lahir, Jenis Kelamin */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider mb-1.5">
                      Tempat Lahir <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="tempatLahir"
                      placeholder="Contoh: Jakarta"
                      value={formData.tempatLahir}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider mb-1.5">
                      Tanggal Lahir <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="tanggalLahir"
                      value={formData.tanggalLahir}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider mb-1.5">
                      Jenis Kelamin <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="jenisKelamin"
                      value={formData.jenisKelamin}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                </div>

                {/* Row 4: Kewarganegaraan, Agama, NPWP */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider mb-1.5">
                      Kewarganegaraan <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="kewarganegaraan"
                      value={formData.kewarganegaraan}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <option value="Indonesia">Indonesia</option>
                      <option value="WNA">WNA</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider mb-1.5">
                      Agama <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="agama"
                      value={formData.agama}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider mb-1.5">
                      NPWP
                    </label>
                    <input
                      type="text"
                      name="npwp"
                      placeholder="00.000.000.0-000.000"
                      value={formData.npwp}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* Row 5: Alamat Domisili, RT/RW, Kelurahan, Kecamatan */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider mb-1.5">
                      Alamat Domisili <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="alamatDomisili"
                      placeholder="Jalan, No. Rumah, Perumahan"
                      value={formData.alamatDomisili}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider mb-1.5">
                      RT/RW
                    </label>
                    <input
                      type="text"
                      name="rtRw"
                      placeholder="000 / 000"
                      value={formData.rtRw}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider mb-1.5">
                      Kelurahan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="kelurahan"
                      value={formData.kelurahan}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* Row 6: Kecamatan, Kota, Provinsi, Kode Pos */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider mb-1.5">
                      Kecamatan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="kecamatan"
                      value={formData.kecamatan}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider mb-1.5">
                      Kota/Kabupaten <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="kotaKabupaten"
                      value={formData.kotaKabupaten}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider mb-1.5">
                      Provinsi <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="provinsi"
                      value={formData.provinsi}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <option value="DKI Jakarta">DKI Jakarta</option>
                      <option value="Jawa Barat">Jawa Barat</option>
                      <option value="Banten">Banten</option>
                      <option value="Jawa Tengah">Jawa Tengah</option>
                      <option value="DI Yogyakarta">DI Yogyakarta</option>
                      <option value="Jawa Timur">Jawa Timur</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider mb-1.5">
                      Kode Pos <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="kodePos"
                      placeholder="12345"
                      value={formData.kodePos}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* Row 7: Telepon, HP, Email */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider mb-1.5">
                      No. Telepon
                    </label>
                    <input
                      type="text"
                      name="noTelepon"
                      placeholder="021-xxxxxxxx"
                      value={formData.noTelepon}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider mb-1.5">
                      No. HP <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="noHp"
                      placeholder="08xxxxxxxxxx"
                      value={formData.noHp}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider mb-1.5">
                      Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="zaki@dsnmui.or.id"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* Row 8: Pendidikan, Kampus, Lulus */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider mb-1.5">
                      Pendidikan Terakhir <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="pendidikanTerakhir"
                      value={formData.pendidikanTerakhir}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <option value="S1 - Ekonomi Islam">S1 - Ekonomi Islam</option>
                      <option value="S1 - Hukum Islam (Syariah)">S1 - Hukum Islam (Syariah)</option>
                      <option value="S2 - Keuangan Syariah">S2 - Keuangan Syariah</option>
                      <option value="S3 - Ekonomi Islam">S3 - Ekonomi Islam</option>
                      <option value="S3 - Syariah Kontemporer">S3 - Syariah Kontemporer</option>
                      <option value="Profesor">Profesor / Guru Besar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider mb-1.5">
                      Perguruan Tinggi <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="perguruanTinggi"
                      placeholder="Contoh: Universitas Indonesia"
                      value={formData.perguruanTinggi}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider mb-1.5">
                      Tahun Lulus <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="tahunLulus"
                      placeholder="Contoh: 2010"
                      value={formData.tahunLulus}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

              </div>

              {/* Right Sidebar: Foto Upload (4 Cols) */}
              <div className="lg:col-span-4 space-y-3">
                <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider">
                  Foto Profil
                </label>
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-850 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3 bg-slate-50/40 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer min-h-[220px]">
                  <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-[#006633] flex items-center justify-center">
                    <Upload size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-850 dark:text-white">Klik untuk upload foto</p>
                    <p className="text-[10px] text-slate-450 mt-1">PNG / JPG maks. 2MB</p>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setFormData(prev => ({ ...prev, fotoFileName: e.target.files![0].name }));
                      }
                    }} 
                    className="hidden" 
                    id="foto-profile-upload"
                  />
                  <label htmlFor="foto-profile-upload" className="px-3 py-1.5 bg-white dark:bg-slate-950 hover:bg-slate-50 border border-slate-200 dark:border-slate-800 rounded-md text-[11px] font-bold text-slate-650 cursor-pointer shadow-xs">
                    Pilih File
                  </label>
                  {formData.fotoFileName && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 mt-1 font-mono">
                      ✓ {formData.fotoFileName}
                    </span>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ── TAB 2: DATA JABATAN & PENUGASAN ── */}
          {activeTab === 2 && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider mb-1.5">
                    Lembaga Penempatan
                  </label>
                  <input
                    type="text"
                    name="lembagaPenempatan"
                    placeholder="Contoh: Bank Syariah Indonesia"
                    value={formData.lembagaPenempatan}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider mb-1.5">
                    Jabatan di DPS
                  </label>
                  <select
                    name="jabatanDps"
                    value={formData.jabatanDps}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="Ketua">Ketua</option>
                    <option value="Anggota">Anggota</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider mb-1.5">
                    No. SK Pengangkatan
                  </label>
                  <input
                    type="text"
                    name="skPengangkatan"
                    placeholder="SK-DSN-MUI/X/2026/xxx"
                    value={formData.skPengangkatan}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider mb-1.5">
                    Tanggal SK
                  </label>
                  <input
                    type="date"
                    name="tanggalSk"
                    value={formData.tanggalSk}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider mb-1.5">
                    Masa Jabatan Mulai
                  </label>
                  <input
                    type="date"
                    name="masaJabatanMulai"
                    value={formData.masaJabatanMulai}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider mb-1.5">
                    Masa Jabatan Selesai
                  </label>
                  <input
                    type="date"
                    name="masaJabatanSelesai"
                    value={formData.masaJabatanSelesai}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Repeatable List: Riwayat Jabatan Sebelumnya */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-850">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs uppercase font-extrabold text-slate-500 dark:text-slate-400 tracking-wider">
                    Riwayat Jabatan Pengawasan Sebelumnya
                  </h3>
                  <button
                    type="button"
                    onClick={addRiwayat}
                    className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-[#006633] bg-[#006633]/10 hover:bg-[#006633]/15 rounded border border-[#006633]/20 transition-all uppercase tracking-wider cursor-pointer"
                  >
                    <Plus size={12} /> Tambah Riwayat
                  </button>
                </div>

                {riwayatJabatan.map((r, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-slate-50/50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-850">
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-450 tracking-wider mb-1">Lembaga Keuangan Syariah</label>
                      <input
                        type="text"
                        placeholder="Contoh: BNI Syariah"
                        value={r.lembaga}
                        onChange={(e) => handleRiwayatChange(idx, "lembaga", e.target.value)}
                        className="w-full px-3 py-1.5 text-xs font-semibold rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-450 tracking-wider mb-1">Jabatan</label>
                      <input
                        type="text"
                        placeholder="Contoh: Ketua DPS / Anggota"
                        value={r.jabatan}
                        onChange={(e) => handleRiwayatChange(idx, "jabatan", e.target.value)}
                        className="w-full px-3 py-1.5 text-xs font-semibold rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div className="flex gap-3 items-center">
                      <div className="flex-1">
                        <label className="block text-[9px] uppercase font-bold text-slate-450 tracking-wider mb-1">Periode</label>
                        <input
                          type="text"
                          placeholder="Contoh: 2018 - 2021"
                          value={r.periode}
                          onChange={(e) => handleRiwayatChange(idx, "periode", e.target.value)}
                          className="w-full px-3 py-1.5 text-xs font-semibold rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      {riwayatJabatan.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRiwayat(idx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded cursor-pointer self-end mb-0.5"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ── TAB 3: KOMPETENSI & SERTIFIKASI ── */}
          {activeTab === 3 && (
            <div className="space-y-6">
              
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider mb-1.5">
                  Bidang Keahlian / Kompetensi (Dipisah Koma)
                </label>
                <input
                  type="text"
                  name="bidangKeahlianString"
                  value={formData.bidangKeahlianString}
                  onChange={handleChange}
                  placeholder="Fikih Muamalah, Pasar Modal Syariah, Lembaga Keuangan Mikro Syariah"
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 tracking-wider mb-1.5">
                  Ringkasan Pengalaman Profesional / Bio Singkat
                </label>
                <textarea
                  name="pengalamanProfesional"
                  rows={4}
                  value={formData.pengalamanProfesional}
                  onChange={handleChange}
                  placeholder="Tuliskan riwayat karir pengawasan syariah, pengajaran, atau riset..."
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#006633]/20 focus:border-[#006633] text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Repeatable List: Sertifikat Pelatihan */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-850">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs uppercase font-extrabold text-slate-500 dark:text-slate-400 tracking-wider">
                    Sertifikat Pelatihan Keuangan Syariah
                  </h3>
                  <button
                    type="button"
                    onClick={addSertifikat}
                    className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-[#006633] bg-[#006633]/10 hover:bg-[#006633]/15 rounded border border-[#006633]/20 transition-all uppercase tracking-wider cursor-pointer"
                  >
                    <Plus size={12} /> Tambah Sertifikat
                  </button>
                </div>

                {sertifikatPelatihan.map((s, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-slate-50/50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-850">
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-450 tracking-wider mb-1">Nama Sertifikasi / Pelatihan</label>
                      <input
                        type="text"
                        placeholder="Contoh: Sertifikasi Pengawas Syariah Utama"
                        value={s.nama}
                        onChange={(e) => handleSertifikatChange(idx, "nama", e.target.value)}
                        className="w-full px-3 py-1.5 text-xs font-semibold rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-450 tracking-wider mb-1">Lembaga Penyelenggara</label>
                      <input
                        type="text"
                        placeholder="Contoh: DSN-MUI Institute"
                        value={s.lembaga}
                        onChange={(e) => handleSertifikatChange(idx, "lembaga", e.target.value)}
                        className="w-full px-3 py-1.5 text-xs font-semibold rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div className="flex gap-3 items-center">
                      <div className="flex-1">
                        <label className="block text-[9px] uppercase font-bold text-slate-450 tracking-wider mb-1">Tahun Kelulusan</label>
                        <input
                          type="text"
                          placeholder="Contoh: 2018"
                          value={s.tahun}
                          onChange={(e) => handleSertifikatChange(idx, "tahun", e.target.value)}
                          className="w-full px-3 py-1.5 text-xs font-semibold rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      {sertifikatPelatihan.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSertifikat(idx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded cursor-pointer self-end mb-0.5"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ── TAB 4: DOKUMEN PENDUKUNG ── */}
          {activeTab === 4 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { key: "ktp", label: "Kartu Tanda Penduduk (KTP)" },
                { key: "npwp", label: "Kartu NPWP Pribadi" },
                { key: "ijazah", label: "Ijazah Pendidikan Terakhir" },
                { key: "sk", label: "Salinan SK Pengangkatan Terakhir" }
              ].map(doc => (
                <div key={doc.key} className="border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col justify-between gap-3 bg-slate-50/10 dark:bg-slate-950/40">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="text-[11px] uppercase font-bold text-slate-700 dark:text-slate-350">{doc.label}</h4>
                      <p className="text-[10px] text-slate-450">Format PDF / JPEG, Maksimum 5MB</p>
                    </div>
                    <FileText className="text-slate-400 size-5" />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      id={`file-${doc.key}`}
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileUpload(doc.key, e.target.files[0].name);
                        }
                      }}
                    />
                    <label htmlFor={`file-${doc.key}`} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-[11px] font-bold text-slate-650 rounded-md cursor-pointer transition-colors shadow-2xs uppercase tracking-wider">
                      <Upload size={12} /> Pilih Dokumen
                    </label>
                    {uploadedFiles[doc.key] ? (
                      <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 truncate max-w-[200px]" title={uploadedFiles[doc.key]}>
                        ✓ {uploadedFiles[doc.key]}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Belum ada file diunggah</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── TAB 5: RINGKASAN ── */}
          {activeTab === 5 && (
            <div className="space-y-6">
              
              <div className="bg-[#006633]/5 border border-[#006633]/15 rounded-lg p-4 flex gap-2.5 items-start">
                <CheckCircle2 className="text-[#006633] size-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-[#006633] uppercase tracking-wider">Ringkasan Validasi Formulir</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Harap tinjau kembali seluruh informasi di bawah ini sebelum menekan tombol "Simpan Data". Data akan tersimpan secara lokal dan tercantum dalam database.
                  </p>
                </div>
              </div>

              {/* Grid Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 dark:bg-slate-950 p-6 rounded-lg border border-slate-200 dark:border-slate-850">
                
                {/* Section A: Identitas */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase text-slate-450 dark:text-slate-500 tracking-wider border-b border-slate-200/55 dark:border-slate-800 pb-1">
                    Identitas Pribadi & Kontak
                  </h4>
                  <div className="grid grid-cols-3 gap-y-2 text-[11px]">
                    <div className="font-bold text-slate-450">Nama Lengkap:</div>
                    <div className="col-span-2 font-bold text-slate-800 dark:text-white">{formData.namaLengkap || "-"}</div>

                    <div className="font-bold text-slate-450">Tempat, Tgl Lahir:</div>
                    <div className="col-span-2 font-semibold text-slate-700 dark:text-slate-350">
                      {formData.tempatLahir && formData.tanggalLahir ? `${formData.tempatLahir}, ${formData.tanggalLahir}` : "-"}
                    </div>

                    <div className="font-bold text-slate-450">Jenis Kelamin:</div>
                    <div className="col-span-2 font-semibold text-slate-700 dark:text-slate-350">{formData.jenisKelamin}</div>

                    <div className="font-bold text-slate-450">Kewarganegaraan:</div>
                    <div className="col-span-2 font-semibold text-slate-700 dark:text-slate-350">{formData.kewarganegaraan}</div>

                    <div className="font-bold text-slate-450">Email / Kontak:</div>
                    <div className="col-span-2 font-semibold text-slate-700 dark:text-slate-350 font-mono">
                      {formData.email} {formData.noHp ? `/ ${formData.noHp}` : ""}
                    </div>

                    <div className="font-bold text-slate-450">Alamat Lengkap:</div>
                    <div className="col-span-2 font-semibold text-slate-750 dark:text-slate-350">
                      {formData.alamatDomisili ? `${formData.alamatDomisili}, RT/RW: ${formData.rtRw || "-"}, Kel. ${formData.kelurahan || "-"}, Kec. ${formData.kecamatan || "-"}, ${formData.kotaKabupaten || "-"}, ${formData.provinsi}` : "-"}
                    </div>

                    <div className="font-bold text-slate-450">Pendidikan:</div>
                    <div className="col-span-2 font-semibold text-slate-750 dark:text-slate-350">
                      {formData.pendidikanTerakhir} dari {formData.perguruanTinggi || "-"} ({formData.tahunLulus || "-"})
                    </div>
                  </div>
                </div>

                {/* Section B: Penugasan & Berkas */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase text-slate-450 dark:text-slate-500 tracking-wider border-b border-slate-200/55 dark:border-slate-800 pb-1">
                    Detail Jabatan & Dokumen
                  </h4>
                  <div className="grid grid-cols-3 gap-y-2 text-[11px]">
                    <div className="font-bold text-slate-450">Status Anggota:</div>
                    <div className="col-span-2 font-bold text-slate-800 dark:text-white uppercase tracking-wider">{formData.status}</div>

                    <div className="font-bold text-slate-450">Jenis Penugasan:</div>
                    <div className="col-span-2 font-semibold text-slate-700 dark:text-slate-350">{formData.jenisPenugasan}</div>

                    <div className="font-bold text-slate-450">Lembaga Penempatan:</div>
                    <div className="col-span-2 font-bold text-[#006633] dark:text-[#D4AF37]">{formData.lembagaPenempatan || "-"}</div>

                    <div className="font-bold text-slate-450">Jabatan di DPS:</div>
                    <div className="col-span-2 font-semibold text-slate-700 dark:text-slate-350">{formData.jabatanDps}</div>

                    <div className="font-bold text-slate-450">SK Pengangkatan:</div>
                    <div className="col-span-2 font-mono text-slate-700 dark:text-slate-350">{formData.skPengangkatan || "-"}</div>

                    <div className="font-bold text-slate-450">Dokumen Upload:</div>
                    <div className="col-span-2 space-y-1">
                      {Object.keys(uploadedFiles).map(key => (
                        <div key={key} className="flex items-center gap-1 font-mono text-[9.5px]">
                          <span className="font-bold uppercase">{key}:</span>
                          {uploadedFiles[key] ? (
                            <span className="text-emerald-600 font-bold truncate max-w-[150px]">✓ {uploadedFiles[key]}</span>
                          ) : (
                            <span className="text-rose-500">❌ Kosong</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ── BUTTON CONTROLS ── */}
          <div className="flex justify-between items-center pt-5 border-t border-slate-100 dark:border-slate-850">
            {/* Left Button: Cancel or Prev */}
            {activeTab === 1 ? (
              <Link
                href="/dps-data"
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-650 hover:bg-slate-50 dark:hover:bg-slate-850 dark:text-slate-350 transition-colors uppercase tracking-wider"
              >
                Batal
              </Link>
            ) : (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-650 hover:bg-slate-50 dark:hover:bg-slate-850 dark:text-slate-350 transition-colors uppercase tracking-wider cursor-pointer"
              >
                <ArrowLeft size={14} /> Kembali
              </button>
            )}

            {/* Right Button: Next or Submit */}
            {activeTab < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2 bg-[#006633] hover:bg-[#00552b] text-white rounded-lg text-xs font-bold transition-all uppercase tracking-wider shadow-sm cursor-pointer"
              >
                Simpan & Lanjutkan <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="submit"
                className="flex items-center gap-1.5 px-6 py-2.5 bg-[#006633] hover:bg-[#00552b] text-white rounded-lg text-xs font-extrabold transition-all uppercase tracking-wider shadow-md cursor-pointer"
              >
                <Save size={14} /> Simpan Data Anggota
              </button>
            )}
          </div>

        </form>

      </div>

    </div>
  );
}
