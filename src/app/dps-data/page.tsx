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
        <div className="text-center font-mono font-bold text-slate-400 dark:text-slate-500">
          {index}
        </div>
      )
    },
    {
      key: "namaLengkap",
      label: "Nama Lengkap",
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#006633]/10 border border-[#006633]/25 flex items-center justify-center text-[#006633] font-bold text-xs select-none">
            {row.namaLengkap.replace(/^(Dr\.|Prof\.|H\.|KH\.)\s+/g, "").charAt(0)}
          </div>
          <div>
            <div className="font-bold text-slate-850 dark:text-white leading-tight">{row.namaLengkap}</div>
            <div className="text-[10px] text-slate-450 dark:text-slate-400 font-mono mt-0.5">{row.id}</div>
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
      width: "120px",
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
      key: "jenisPenugasan",
      label: "Penugasan",
      sortable: true,
      filterable: true,
      filterOptions: ["Penuh Waktu", "Paruh Waktu"],
      width: "130px",
      render: (value) => (
        <span className="text-[11px] font-bold text-slate-650 dark:text-slate-400">
          {value || "-"}
        </span>
      )
    },
    {
      key: "lembagaPenempatan",
      label: "Lembaga",
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="max-w-[150px] truncate font-bold text-slate-800 dark:text-slate-300">
          {value || "-"}
        </div>
      )
    },
    {
      key: "noHp",
      label: "No. HP / Kontak",
      render: (value, row) => (
        <div className="space-y-0.5">
          <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 font-mono">{row.noHp || "-"}</div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono lowercase">{row.email || "-"}</div>
        </div>
      )
    },
    {
      key: "tanggalPengajuan",
      label: "Tgl Pengajuan",
      sortable: true,
      width: "120px",
      render: (value) => {
        if (!value) return "-";
        const date = new Date(value);
        return (
          <span className="text-[10px] text-slate-550 dark:text-slate-400 font-mono">
            {isNaN(date.getTime()) ? value : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        );
      }
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
            Manajemen dan monitoring seluruh data penugasan anggota Dewan Pengawas Syariah DSN-MUI.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => alert("Ekspor data DPS dalam format XLSX / PDF")}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 text-slate-750 dark:text-slate-300 font-bold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-all text-xs uppercase tracking-wider"
          >
            <Download size={14} /> Ekspor
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
            searchPlaceholder="Cari nama, email, lembaga, npwp..."
            initialRowsPerPage={10}
            actions={(row) => (
              <>
                <button
                  onClick={() => setSelectedMember(row)}
                  className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer"
                  title="Lihat Detail"
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
                  Detail Anggota DPS
                </h3>
                <p className="text-[10px] text-slate-450 font-mono mt-0.5">ID: {selectedMember.id}</p>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Profile Card Summary */}
              <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950">
                <div className="w-16 h-16 rounded-full bg-[#006633]/10 border-2 border-[#006633]/20 flex items-center justify-center text-[#006633] font-bold text-xl select-none">
                  {selectedMember.namaLengkap.replace(/^(Dr\.|Prof\.|H\.|KH\.)\s+/g, "").charAt(0)}
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                    {selectedMember.namaLengkap}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider bg-emerald-50 text-emerald-700 border-emerald-250">
                      {selectedMember.status}
                    </span>
                    <span className="inline-flex items-center text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider bg-slate-100 text-slate-700 border-slate-350">
                      {selectedMember.jenisPenugasan}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid 1: Personal Data */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-[#006633] dark:text-[#D4AF37] border-b border-slate-100 dark:border-slate-850 pb-1.5">
                  1. Data Pribadi & Kontak
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-450">Tempat, Tanggal Lahir</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedMember.tempatLahir}, {selectedMember.tanggalLahir}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-450">Jenis Kelamin</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedMember.jenisKelamin}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-450">Kewarganegaraan / Agama</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedMember.kewarganegaraan} / {selectedMember.agama}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-450">NPWP</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{selectedMember.npwp || "-"}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 md:col-span-2">
                    <span className="text-[10px] uppercase font-bold text-slate-450">Alamat Domisili</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedMember.alamatDomisili}, RT/RW: {selectedMember.rtRw}, Kel. {selectedMember.kelurahan}, Kec. {selectedMember.kecamatan}, {selectedMember.kotaKabupaten}, {selectedMember.provinsi} {selectedMember.kodePos}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-450">Kontak Telepon/HP</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                      {selectedMember.noHp} {selectedMember.noTelepon ? `(Telp: ${selectedMember.noTelepon})` : ""}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-450">Email</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{selectedMember.email}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 md:col-span-2">
                    <span className="text-[10px] uppercase font-bold text-slate-450">Pendidikan Terakhir</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedMember.pendidikanTerakhir} — {selectedMember.perguruanTinggi} (Lulus {selectedMember.tahunLulus})
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid 2: Penugasan */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-[#006633] dark:text-[#D4AF37] border-b border-slate-100 dark:border-slate-850 pb-1.5">
                  2. Lembaga & Jabatan DPS
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-450">Lembaga Penempatan</span>
                    <span className="font-extrabold text-[#006633] dark:text-[#D4AF37]">{selectedMember.lembagaPenempatan || "-"}</span>
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

                {/* Riwayat Jabatan Previous */}
                {selectedMember.riwayatJabatan && (selectedMember.riwayatJabatan as Array<any>).length > 0 && (
                  <div className="pt-2">
                    <span className="text-[9px] uppercase font-bold text-slate-450 block mb-1">Riwayat Jabatan Sebelumnya</span>
                    <div className="space-y-1.5">
                      {(selectedMember.riwayatJabatan as Array<any>).map((r, i) => (
                        <div key={i} className="text-xs bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-lg border border-slate-200/60 dark:border-slate-850 flex justify-between">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{r.lembaga}</span>
                          <span className="text-slate-500">{r.jabatan} ({r.periode})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Grid 3: Kompetensi */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-[#006633] dark:text-[#D4AF37] border-b border-slate-100 dark:border-slate-850 pb-1.5">
                  3. Bidang Kompetensi & Sertifikasi
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-450">Bidang Keahlian</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedMember.bidangKeahlian && (selectedMember.bidangKeahlian as string[]).map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-[#006633] border border-[#006633]/20 rounded font-bold text-[9px] uppercase">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-0.5 pt-1">
                    <span className="text-[10px] uppercase font-bold text-slate-450">Bio / Pengalaman Profesional</span>
                    <p className="text-slate-700 dark:text-slate-350 leading-relaxed bg-slate-50/50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200/50">
                      {selectedMember.pengalamanProfesional || "-"}
                    </p>
                  </div>

                  {selectedMember.sertifikatPelatihan && (selectedMember.sertifikatPelatihan as Array<any>).length > 0 && (
                    <div className="pt-2">
                      <span className="text-[9px] uppercase font-bold text-slate-450 block mb-1">Pelatihan & Sertifikasi</span>
                      <div className="space-y-1.5">
                        {(selectedMember.sertifikatPelatihan as Array<any>).map((s, i) => (
                          <div key={i} className="text-xs bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-lg border border-slate-200/60 dark:border-slate-850 flex justify-between">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{s.nama}</span>
                            <span className="text-slate-500">{s.lembaga} ({s.tahun})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
            
            {/* Drawer Footer */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/40 flex justify-end">
              <button
                onClick={() => setSelectedMember(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-650 hover:bg-slate-50 dark:text-slate-300"
              >
                Tutup Detail
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
