"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, 
  Trash2, 
  Eye, 
  Edit,
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Download,
  X,
  FileText,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Calendar
} from "lucide-react";
import { useDpsStore, DPSMember } from "@/stores/dps.store";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";

export default function DpsDataPage() {
  const { dpsList, fetchDpsList, deleteDPS, loading, error } = useDpsStore();
  const [mounted, setMounted] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // Detail Modal State
  const [selectedMember, setSelectedMember] = useState<DPSMember | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchDpsList();
  }, [fetchDpsList]);

  if (!mounted) {
    return null;
  }

  // Delete Action Handler
  const handleDelete = async (id: string) => {
    const success = await deleteDPS(id);
    if (success) {
      setShowDeleteConfirm(null);
    } else {
      alert("Gagal menghapus data DPS");
    }
  };

  // Define Columns
  const columns: ColumnDef<DPSMember>[] = [
    {
      key: "no",
      label: "No.",
      width: "50px",
      render: (value, row, index) => (
        <div className="text-center font-mono font-bold text-slate-400 dark:text-slate-500 text-xs">
          {index}
        </div>
      )
    },
    {
      key: "namaLengkap",
      label: "Nama & Identitas DPS",
      sortable: true,
      render: (value, row) => (
        <div className="flex items-start gap-2.5 py-1">
          <div className="w-8 h-8 rounded-full bg-[#006633]/10 border border-[#006633]/25 flex items-center justify-center text-[#006633] font-bold text-xs select-none shrink-0 mt-0.5">
            {row.namaLengkap.replace(/^(Dr\.|Prof\.|H\.|KH\.|Drs\.|Ir\.)\s+/g, "").charAt(0)}
          </div>
          <div>
            <div className="font-bold text-slate-850 dark:text-white leading-tight text-xs flex items-center gap-1.5 flex-wrap">
              <span>{row.namaLengkap}</span>
              {row.externalId && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded border border-slate-250 dark:border-slate-700">
                  #{row.externalId}
                </span>
              )}
            </div>
            {row.namaNonGelar && (
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Nama asli: <span className="font-medium text-slate-700 dark:text-slate-300">{row.namaNonGelar}</span>
              </div>
            )}
            {row.statusDiMui && !row.statusDiMui.toLowerCase().includes("bukan pengurus") && (
              <div className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5 inline-block bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-200/50">
                {row.statusDiMui}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: "status",
      label: "Status DPS",
      sortable: true,
      filterable: true,
      filterOptions: ["Aktif", "Calon DPS", "Nonaktif"],
      width: "110px",
      render: (value) => {
        const valStr = String(value);
        let badgeClass = "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700";
        if (valStr === "Aktif") {
          badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30";
        } else if (valStr === "Calon DPS") {
          badgeClass = "bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30";
        } else if (valStr === "Nonaktif") {
          badgeClass = "bg-rose-50 text-rose-700 border-rose-250 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30";
        }
        return (
          <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${badgeClass}`}>
            <span className={`w-1 h-1 rounded-full ${valStr === "Aktif" ? "bg-emerald-500" : valStr === "Calon DPS" ? "bg-amber-500" : "bg-rose-500"}`} />
            {valStr}
          </span>
        );
      }
    },
    {
      key: "lembagaPenempatan",
      label: "Perusahaan / Lembaga",
      sortable: true,
      filterable: true,
      render: (value, row) => {
        const companyName = row.company?.name || row.lembagaPenempatan;
        if (companyName) {
          return (
            <div className="space-y-0.5 max-w-[200px]">
              <div className="font-bold text-xs text-[#006633] dark:text-[#D4AF37] truncate" title={companyName}>
                {companyName}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {row.jabatanDps || "Dewan Pengawas Syariah"}
              </div>
            </div>
          );
        }
        return (
          <span className="text-[10px] italic text-slate-400 dark:text-slate-500">
            Belum ditugaskan
          </span>
        );
      }
    },
    {
      key: "nomorSertifikatLsp",
      label: "Sertifikasi & VA",
      render: (value, row) => (
        <div className="space-y-0.5 text-xs font-mono">
          <div className="text-[10px] text-slate-700 dark:text-slate-300">
            <span className="text-slate-400 text-[9px]">LSP:</span> {row.nomorSertifikatLsp && row.nomorSertifikatLsp !== "Tidak ada" ? (
              row.linkSertifikatLsp ? (
                <a href={row.linkSertifikatLsp} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-0.5">
                  {row.nomorSertifikatLsp.substring(0, 14)}...
                </a>
              ) : row.nomorSertifikatLsp.substring(0, 14) + "..."
            ) : "-"}
          </div>
          <div className="text-[9px] text-slate-500 dark:text-slate-400">
            <span className="text-slate-400">VA:</span> {row.nomorVirtualAccount || "-"}
          </div>
        </div>
      )
    },
    {
      key: "tanggalPaktaIntegritas",
      label: "Tgl Pakta Integritas",
      sortable: true,
      width: "140px",
      render: (value, row) => {
        const val = row.tanggalPaktaIntegritas || row.tanggalPengajuan;
        if (!val || val.toLowerCase() === "tidak ada") return <span className="text-slate-400 font-mono text-[10px]">-</span>;
        return (
          <span className="text-[11px] text-slate-700 dark:text-slate-300 font-mono font-medium">
            {val}
          </span>
        );
      }
    },
    {
      key: "noHp",
      label: "Kontak",
      render: (value, row) => (
        <div className="space-y-0.5">
          <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 font-mono">{row.noHp || "-"}</div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono lowercase truncate max-w-[140px]" title={row.email}>{row.email || "-"}</div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300">
      
      {/* ── BREADCRUMBS & PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
            <span>Dashboard</span>
            <ChevronRight size={10} />
            <span>DPS</span>
            <ChevronRight size={10} />
            <span className="text-[#006633] dark:text-[#D4AF37]">Data DPS</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight mt-1">
            Data Dewan Pengawas Syariah (DPS)
          </h1>
          <p className="text-slate-500 dark:text-slate-405 text-xs font-semibold mt-1">
            Manajemen dan monitoring 832 data anggota Dewan Pengawas Syariah DSN-MUI yang terintegrasi dengan data perusahaan pemohon.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => alert(`Total data DPS saat ini: ${dpsList.length} orang.`)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 text-slate-750 dark:text-slate-300 font-bold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-all text-xs uppercase tracking-wider"
          >
            <Download size={14} /> Total: {dpsList.length} DPS
          </button>
          <Link 
            href="/dps-data/new" 
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#006633] hover:bg-[#00552b] text-white font-bold rounded-lg transition-all text-xs uppercase tracking-wider shadow-sm"
          >
            <Plus size={16} /> Tambah Data DPS
          </Link>
        </div>
      </div>

      {/* ── ERROR MESSAGE ── */}
      {error && (
        <div className="bg-rose-50 border border-rose-250 p-4 rounded-lg flex items-start gap-2.5 text-rose-800 text-xs">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Gagal sinkronisasi data:</span> {error}
          </div>
        </div>
      )}

      {/* ── MAIN DATA TABLE ── */}
      <div className="space-y-4">
        {loading && dpsList.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-20 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006633]"></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Syncing Database...</p>
          </div>
        ) : (
          <DataTable
            data={dpsList}
            columns={columns}
            searchPlaceholder="Cari nama, nama non-gelar, email, lembaga, LSP, VA..."
            initialRowsPerPage={10}
            actions={(row) => (
              <>
                <button
                  onClick={() => setSelectedMember(row)}
                  className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer"
                  title="Lihat Detail Lengkap"
                >
                  <Eye size={14} />
                </button>
                <Link
                  href={`/dps-data/edit/${row.id}`}
                  className="p-1.5 text-[#D4AF37] bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 dark:bg-[#D4AF37]/20 dark:hover:bg-[#D4AF37]/30 rounded-lg transition-colors inline-flex items-center justify-center"
                  title="Edit Data"
                >
                  <Edit size={14} />
                </Link>
                <button
                  onClick={() => setShowDeleteConfirm(row.id)}
                  className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-450 dark:hover:bg-rose-900/30 rounded-lg transition-colors cursor-pointer"
                  title="Hapus Data"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          />
        )}
      </div>

      {/* ── DETAIL MODAL (SIDEBAR DRAWER) ── */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-350">
            
            {/* Drawer Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-850">
              <div>
                <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#006633] dark:text-[#D4AF37]">
                  Detail Lengkap Anggota DPS
                </h3>
                <p className="text-[10px] text-slate-450 font-mono mt-0.5">
                  ID Sistem: {selectedMember.id} {selectedMember.externalId && `(Excel ID: #${selectedMember.externalId})`}
                </p>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Profile Card Summary */}
              <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950">
                <div className="w-16 h-16 rounded-full bg-[#006633]/10 border-2 border-[#006633]/20 flex items-center justify-center text-[#006633] font-bold text-xl select-none shrink-0">
                  {selectedMember.namaLengkap.replace(/^(Dr\.|Prof\.|H\.|KH\.|Drs\.|Ir\.)\s+/g, "").charAt(0)}
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                    {selectedMember.namaLengkap}
                  </h4>
                  {selectedMember.namaNonGelar && (
                    <p className="text-xs text-slate-500 font-semibold">
                      Nama (non-gelar): <span className="text-slate-700 dark:text-slate-300">{selectedMember.namaNonGelar}</span>
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="inline-flex items-center text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider bg-emerald-50 text-emerald-700 border-emerald-250">
                      {selectedMember.status}
                    </span>
                    <span className="inline-flex items-center text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider bg-slate-100 text-slate-700 border-slate-350">
                      {selectedMember.jenisPenugasan}
                    </span>
                    {selectedMember.statusDiMui && !selectedMember.statusDiMui.toLowerCase().includes("bukan pengurus") && (
                      <span className="inline-flex items-center text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider bg-blue-50 text-blue-700 border-blue-200">
                        {selectedMember.statusDiMui}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid 1: Personal Data */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-[#006633] dark:text-[#D4AF37] border-b border-slate-100 dark:border-slate-850 pb-1.5">
                  1. Data Pribadi, Identitas & Kontak
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-450">NIK (Nomor Induk Kependudukan)</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                      {selectedMember.nik || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-450">Tempat, Tanggal Lahir</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {[selectedMember.tempatLahir, selectedMember.tanggalLahir].filter(Boolean).join(", ") || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-450">Nomor Virtual Account (VA)</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 font-mono">
                      {selectedMember.nomorVirtualAccount && selectedMember.nomorVirtualAccount.toLowerCase() !== "tidak ada"
                        ? selectedMember.nomorVirtualAccount 
                        : "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-450">Tgl Pakta Integritas</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                      {selectedMember.tanggalPaktaIntegritas || selectedMember.tanggalPengajuan || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-450">No. HP / WhatsApp</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                      {selectedMember.noHp || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-450">Telp (Fixed)</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                      {selectedMember.noTelepon || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 md:col-span-2">
                    <span className="text-[10px] uppercase font-bold text-slate-450">Email</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{selectedMember.email || "-"}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 md:col-span-2">
                    <span className="text-[10px] uppercase font-bold text-slate-450">Alamat Domisili</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 whitespace-pre-line">
                      {selectedMember.alamatDomisili || "-"}
                    </span>
                    {(selectedMember.kotaKabupaten || selectedMember.provinsi || selectedMember.kodePos) && (
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        Wilayah: {[selectedMember.kotaKabupaten, selectedMember.provinsi, selectedMember.kodePos ? `(${selectedMember.kodePos})` : ''].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </div>
                  {selectedMember.statusDiMui && !selectedMember.statusDiMui.toLowerCase().includes("bukan pengurus") && (
                    <div className="flex flex-col gap-0.5 md:col-span-2">
                      <span className="text-[10px] uppercase font-bold text-slate-450">Jabatan di MUI</span>
                      <span className="font-semibold text-blue-700 dark:text-blue-300">{selectedMember.statusDiMui}</span>
                    </div>
                  )}
                  {selectedMember.pendidikanTerakhir && (
                    <div className="flex flex-col gap-0.5 md:col-span-2">
                      <span className="text-[10px] uppercase font-bold text-slate-450">Pendidikan Terakhir</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {[selectedMember.pendidikanTerakhir, selectedMember.perguruanTinggi, selectedMember.tahunLulus ? `(Lulus ${selectedMember.tahunLulus})` : ''].filter(Boolean).join(' — ')}
                      </span>
                    </div>
                  )}
                  {selectedMember.npwp && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-450">NPWP</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{selectedMember.npwp}</span>
                    </div>
                  )}
                  {selectedMember.jenisKelamin && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-450">Jenis Kelamin</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedMember.jenisKelamin}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Grid 2: Penugasan & Perusahaan Pemohon */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-[#006633] dark:text-[#D4AF37] border-b border-slate-100 dark:border-slate-850 pb-1.5">
                  2. Relasi Perusahaan & Penugasan DPS
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
                  <div className="flex flex-col gap-0.5 md:col-span-2">
                    <span className="text-[10px] uppercase font-bold text-slate-450">Perusahaan Pemohon / Terkait</span>
                    {selectedMember.company ? (
                      <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-800/40 rounded-lg flex items-center justify-between">
                        <div>
                          <div className="font-extrabold text-sm text-[#006633] dark:text-[#D4AF37]">
                            {selectedMember.company.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            ID Perusahaan: {selectedMember.company.id}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-350">
                          Terhubung
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 italic text-xs">
                        Belum dikaitkan dengan entitas perusahaan pemohon.
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-450">Lembaga Penempatan</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{selectedMember.lembagaPenempatan || "-"}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-450">Jabatan di DPS</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedMember.jabatanDps || "-"}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-450">No. SK Pengangkatan</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{selectedMember.skPengangkatan || "-"}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-450">Masa Jabatan</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                      {selectedMember.masaJabatanMulai || "-"} s/d {selectedMember.masaJabatanSelesai || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid 3: Sertifikasi & Pelatihan DSN */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-[#006633] dark:text-[#D4AF37] border-b border-slate-100 dark:border-slate-850 pb-1.5">
                  3. Sertifikasi, Pelatihan & Pakta Integritas
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-450">Status ASPM</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedMember.aspm || "-"}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-450">Wajib Ikut Pelatihan DSN</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedMember.wajibIkutPelatihan || "-"}</span>
                  </div>

                  <div className="flex flex-col gap-0.5 md:col-span-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200/60 dark:border-slate-800">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-450 block">Sertifikat Pelatihan DSN</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-xs">
                          {selectedMember.nomorSertifikatPelatihan || "-"}
                        </span>
                      </div>
                      {selectedMember.linkSertifikatPelatihan && (
                        <a
                          href={selectedMember.linkSertifikatPelatihan}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400 rounded text-[11px] font-bold flex items-center gap-1"
                        >
                          <FileText size={12} /> Buka Sertifikat
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-0.5 md:col-span-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200/60 dark:border-slate-800">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-450 block">Sertifikat LSP DSN-MUI</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-xs">
                          {selectedMember.nomorSertifikatLsp || "-"}
                        </span>
                      </div>
                      {selectedMember.linkSertifikatLsp && (
                        <a
                          href={selectedMember.linkSertifikatLsp}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 rounded text-[11px] font-bold flex items-center gap-1"
                        >
                          <FileText size={12} /> Buka Sertifikat LSP
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-0.5 md:col-span-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200/60 dark:border-slate-800">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-450 block">Pakta Integritas & Khidmah DPS</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                          Tanggal: {selectedMember.tanggalPaktaIntegritas || "-"}
                        </span>
                      </div>
                      {selectedMember.linkPaktaIntegritas && (
                        <a
                          href={selectedMember.linkPaktaIntegritas}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 rounded text-[11px] font-bold flex items-center gap-1"
                        >
                          <FileText size={12} /> Buka Dokumen Pakta
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 4: Keterangan & Catatan Khusus */}
              {selectedMember.keterangan && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-[#006633] dark:text-[#D4AF37] border-b border-slate-100 dark:border-slate-850 pb-1.5">
                    4. Keterangan Tambahan
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-amber-50/50 dark:bg-amber-950/20 p-3.5 rounded-lg border border-amber-250/60 dark:border-amber-900/40 whitespace-pre-line font-mono">
                    {selectedMember.keterangan}
                  </p>
                </div>
              )}

            </div>
            
            {/* Drawer Footer */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/40 flex justify-between items-center">
              <Link
                href={`/dps-data/edit/${selectedMember.id}`}
                className="px-4 py-2 bg-[#006633] hover:bg-[#00552b] text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5"
              >
                <Edit size={13} /> Edit Data Anggota
              </Link>
              <button
                onClick={() => setSelectedMember(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-650 hover:bg-slate-50 dark:text-slate-300 cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 shrink-0">
                <AlertCircle size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Hapus Data Anggota DPS
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                  Apakah Anda yakin ingin menghapus data anggota DPS ini? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-650 hover:bg-slate-50 dark:hover:bg-slate-850 dark:text-slate-350 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
