import { create } from 'zustand';
import api from '@/lib/api';

export interface Notula {
  id: string;
  meetingId?: string | null;
  title: string;
  agendaNumber?: string | null;
  dateTime: string;
  location: string;
  content?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  decisions?: string | null;
  notes?: string | null;
  creatorId: string;
  creatorName: string;
  attendees: any[];
  sharedWithIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface NotulaState {
  notulaList: Notula[];
  loading: boolean;
  error: string | null;
  fetchNotulaList: () => Promise<void>;
  addNotula: (formData: FormData) => Promise<boolean>;
  updateNotula: (id: string, formData: FormData) => Promise<boolean>;
  deleteNotula: (id: string) => Promise<boolean>;
  shareNotula: (id: string, sharedWithIds: string[]) => Promise<boolean>;
}

export const useNotulaStore = create<NotulaState>((set, get) => ({
  notulaList: [],
  loading: false,
  error: null,
  fetchNotulaList: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/notula');
      set({ notulaList: res.data.data || [], loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
    }
  },
  addNotula: async (formData) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/notula', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.status === 'success') {
        const newList = [res.data.data, ...get().notulaList];
        set({ notulaList: newList, loading: false });
        return true;
      }
      return false;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return false;
    }
  },
  updateNotula: async (id, formData) => {
    set({ loading: true, error: null });
    try {
      const res = await api.patch(`/notula/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.status === 'success') {
        const updatedList = get().notulaList.map((n) => n.id === id ? { ...n, ...res.data.data } : n);
        set({ notulaList: updatedList, loading: false });
        return true;
      }
      return false;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return false;
    }
  },
  deleteNotula: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await api.delete(`/notula/${id}`);
      if (res.data.status === 'success') {
        const updatedList = get().notulaList.filter((n) => n.id !== id);
        set({ notulaList: updatedList, loading: false });
        return true;
      }
      return false;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return false;
    }
  },
  shareNotula: async (id, sharedWithIds) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post(`/notula/${id}/share`, { sharedWithIds });
      if (res.data.status === 'success') {
        const updatedList = get().notulaList.map((n) => n.id === id ? { ...n, ...res.data.data } : n);
        set({ notulaList: updatedList, loading: false });
        return true;
      }
      return false;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return false;
    }
  }
}));
