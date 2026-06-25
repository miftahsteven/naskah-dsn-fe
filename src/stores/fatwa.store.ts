import { create } from 'zustand';
import api from '@/lib/api';

export interface Fatwa {
  id: string;
  title: string;
  agendaNumber: string;
  status: 'PERMOHONAN' | 'KAJIAN' | 'BPH' | 'PLENO' | 'TTE' | 'PUBLIKASI';
  applicant: string;
  tanggal: string;
  keterangan?: string;
  createdAt: string;
  updatedAt: string;
}

interface FatwaState {
  fatwaList: Fatwa[];
  loading: boolean;
  error: string | null;
  fetchFatwaList: () => Promise<void>;
  addFatwa: (fatwa: Omit<Fatwa, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateFatwa: (id: string, fatwa: Partial<Fatwa>) => Promise<boolean>;
  deleteFatwa: (id: string) => Promise<boolean>;
}

export const useFatwaStore = create<FatwaState>((set, get) => ({
  fatwaList: [],
  loading: false,
  error: null,
  fetchFatwaList: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/fatwa');
      set({ fatwaList: res.data.data || [], loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
    }
  },
  addFatwa: async (fatwa) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/fatwa', fatwa);
      if (res.data.status === 'success') {
        const newList = [res.data.data, ...get().fatwaList];
        set({ fatwaList: newList, loading: false });
        return true;
      }
      return false;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return false;
    }
  },
  updateFatwa: async (id, updatedFields) => {
    set({ loading: true, error: null });
    try {
      const res = await api.patch(`/fatwa/${id}`, updatedFields);
      if (res.data.status === 'success') {
        const updatedList = get().fatwaList.map((f) => f.id === id ? { ...f, ...res.data.data } : f);
        set({ fatwaList: updatedList, loading: false });
        return true;
      }
      return false;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
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
        return true;
      }
      return false;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return false;
    }
  }
}));
