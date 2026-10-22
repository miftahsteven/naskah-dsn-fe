import { create } from 'zustand';
import api from '@/lib/api';

export interface Fatwa {
  id: string;
  title: string;
  agendaNumber: string;
  status: 'PERMOHONAN' | 'KAJIAN' | 'BPH' | 'PLENO' | 'TTE' | 'PUBLIKASI' | string;
  applicant: string;
  tanggal: string;
  keterangan?: string | null;
  nomorFatwa?: string | null;
  pleno?: string | number | null;
  tahun?: number | null;
  penandatangan1?: string | null;
  penandatangan2?: string | null;
  noUrut?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface FatwaStats {
  total: number;
  published: number;
  inProgress: number;
  totalPleno: number;
  years: number[];
  recent: Fatwa[];
}

interface FatwaState {
  fatwaList: Fatwa[];
  stats: FatwaStats | null;
  loading: boolean;
  error: string | null;
  fetchFatwaList: (params?: Record<string, any>) => Promise<void>;
  fetchStats: () => Promise<FatwaStats | null>;
  addFatwa: (fatwa: Partial<Fatwa>) => Promise<boolean>;
  updateFatwa: (id: string, fatwa: Partial<Fatwa>) => Promise<boolean>;
  deleteFatwa: (id: string) => Promise<boolean>;
}

export const useFatwaStore = create<FatwaState>((set, get) => ({
  fatwaList: [],
  stats: null,
  loading: false,
  error: null,

  fetchFatwaList: async (params?: Record<string, any>) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/fatwa', { params });
      set({ fatwaList: res.data.data || [], loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
    }
  },

  fetchStats: async () => {
    try {
      const res = await api.get('/fatwa/stats');
      if (res.data.status === 'success') {
        set({ stats: res.data.data });
        return res.data.data;
      }
      return null;
    } catch (err: any) {
      console.error('Error fetching fatwa stats:', err);
      return null;
    }
  },

  addFatwa: async (fatwa) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/fatwa', fatwa);
      if (res.data.status === 'success') {
        const created = res.data.data;
        const newList = [created, ...get().fatwaList];
        set({ fatwaList: newList, loading: false });
        get().fetchStats();
        return true;
      }
      return false;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      set({ error: msg, loading: false });
      return false;
    }
  },

  updateFatwa: async (id, updatedFields) => {
    set({ loading: true, error: null });
    try {
      const res = await api.patch(`/fatwa/${id}`, updatedFields);
      if (res.data.status === 'success') {
        const updated = res.data.data;
        const updatedList = get().fatwaList.map((f) => (f.id === id ? { ...f, ...updated } : f));
        set({ fatwaList: updatedList, loading: false });
        get().fetchStats();
        return true;
      }
      return false;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      set({ error: msg, loading: false });
      return false;
    }
  },

  deleteFatwa: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await api.delete(`/fatwa/${id}`);
      if (res.data.status === 'success') {
        const updatedList = get().fatwaList.filter((f) => f.id !== id);
        set({ fatwaList: updatedList, loading: false });
        get().fetchStats();
        return true;
      }
      return false;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      set({ error: msg, loading: false });
      return false;
    }
  },
}));
