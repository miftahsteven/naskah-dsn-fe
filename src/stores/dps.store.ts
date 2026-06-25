import { create } from 'zustand';
import api from '@/lib/api';

export interface DPSMember {
  id: string;
  status: string; // 'Calon DPS' | 'Aktif' | 'Nonaktif'
  jenisPenugasan: string; // 'Penuh Waktu' | 'Paruh Waktu'
  tanggalPengajuan: string;
  namaLengkap: string;
  fotoUrl?: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;
  kewarganegaraan: string;
  agama: string;
  npwp: string;
  alamatDomisili: string;
  rtRw: string;
  kelurahan: string;
  kecamatan: string;
  kotaKabupaten: string;
  provinsi: string;
  kodePos: string;
  noTelepon: string;
  noHp: string;
  email: string;
  pendidikanTerakhir: string;
  perguruanTinggi: string;
  tahunLulus: string;

  // Tab 2 fields
  lembagaPenempatan?: string;
  jabatanDps?: string;
  skPengangkatan?: string;
  tanggalSk?: string;
  masaJabatanMulai?: string;
  masaJabatanSelesai?: string;
  riwayatJabatan?: Array<{ lembaga: string; jabatan: string; periode: string }>;

  // Tab 3 fields
  sertifikatPelatihan?: Array<{ nama: string; lembaga: string; tahun: string }>;
  bidangKeahlian?: string[];
  pengalamanProfesional?: string;

  // Tab 4 fields
  dokumenFiles?: Array<{ tipe: string; namaFile: string }>;
}

interface DPSState {
  dpsList: DPSMember[];
  loading: boolean;
  error: string | null;
  fetchDpsList: () => Promise<void>;
  addDPS: (member: Omit<DPSMember, 'id'>) => Promise<boolean>;
  updateDPS: (id: string, member: Partial<DPSMember>) => Promise<boolean>;
  deleteDPS: (id: string) => Promise<boolean>;
}

export const useDpsStore = create<DPSState>((set, get) => ({
  dpsList: [],
  loading: false,
  error: null,
  fetchDpsList: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/dps');
      set({ dpsList: res.data.data || [], loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
    }
  },
  addDPS: async (member) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/dps', member);
      if (res.data.status === 'success') {
        const newList = [res.data.data, ...get().dpsList];
        set({ dpsList: newList, loading: false });
        return true;
      }
      return false;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return false;
    }
  },
  updateDPS: async (id, updatedFields) => {
    set({ loading: true, error: null });
    try {
      const res = await api.patch(`/dps/${id}`, updatedFields);
      if (res.data.status === 'success') {
        const updatedList = get().dpsList.map((m) => m.id === id ? { ...m, ...res.data.data } : m);
        set({ dpsList: updatedList, loading: false });
        return true;
      }
      return false;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return false;
    }
  },
  deleteDPS: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await api.delete(`/dps/${id}`);
      if (res.data.status === 'success') {
        const updatedList = get().dpsList.filter((m) => m.id !== id);
        set({ dpsList: updatedList, loading: false });
        return true;
      }
      return false;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return false;
    }
  }
}));
