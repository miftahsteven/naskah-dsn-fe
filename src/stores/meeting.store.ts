import { create } from 'zustand';
import api from '@/lib/api';

export interface Attendee {
  userId: string | null;
  name: string;
  email: string;
  phone: string;
  department: string;
  jabatan: string;
  isExternal: boolean;
  status: 'UNDANGAN' | 'HADIR' | 'TIDAK_HADIR' | 'IZIN' | 'HADIR_OFFLINE' | 'HADIR_ONLINE';
  invitationSent?: boolean;
}

export interface Meeting {
  id: string;
  title: string;
  agendaNumber?: string;
  dateTime: string;
  endDateTime?: string | null;
  location: string;
  description?: string;
  targetType: 'ALL' | 'EXECUTIVE' | 'ALL_BOARD' | 'SECRETARIAT' | 'FINANCE' | 'DEPARTMENT' | 'CROSS_AGENCY' | 'CROSS_INTERNAL';
  departmentId?: string;
  status: 'DRAFT' | 'AKTIF' | 'SELESAI' | 'BATAL' | 'ARSIP';
  attendees: Attendee[];
  invitationSent: boolean;
  discussedDocs?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface MinimalUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  department?: { id: string; name: string };
  jabatan?: { id: string; name: string };
}

export interface Department {
  id: string;
  name: string;
  code: string;
}

interface MeetingState {
  meetingList: Meeting[];
  usersList: MinimalUser[];
  departmentsList: Department[];
  loading: boolean;
  error: string | null;
  fetchMeetingList: () => Promise<void>;
  fetchUsersList: () => Promise<void>;
  fetchDepartmentsList: () => Promise<void>;
  addMeeting: (meeting: {
    title: string;
    agendaNumber?: string;
    dateTime: string;
    endDateTime?: string | null;
    location: string;
    description?: string;
    targetType: string;
    departmentId?: string;
    customAttendeeIds?: string[];
    externalEmails?: string[];
    discussedDocIds?: string[];
  }) => Promise<boolean>;
  updateMeeting: (id: string, meeting: Partial<Meeting> & {
    customAttendeeIds?: string[];
    externalEmails?: string[];
    discussedDocIds?: string[];
  }) => Promise<boolean>;
  deleteMeeting: (id: string) => Promise<boolean>;
  sendInvitations: (id: string) => Promise<boolean>;
  sendInvitationSingle: (id: string, email: string) => Promise<boolean>;
}

export const useMeetingStore = create<MeetingState>((set, get) => ({
  meetingList: [],
  usersList: [],
  departmentsList: [],
  loading: false,
  error: null,
  fetchMeetingList: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/meeting');
      set({ meetingList: res.data.data || [], loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
    }
  },
  fetchUsersList: async () => {
    try {
      const res = await api.get('/users');
      set({ usersList: res.data.data || [] });
    } catch (err: any) {
      console.error('Gagal mengambil daftar user:', err.message);
    }
  },
  fetchDepartmentsList: async () => {
    try {
      // In Amanah, divisions/departments can be retrieved from master data.
      // Let's call /users/departments or fetch from DB if there's a master endpoint,
      // or we can fetch them via a generic endpoint. Wait, is there a department list API?
      // If not, we can query users and map their unique departments, or fetch /users/departments.
      // Let's check how departments are fetched elsewhere, or write a fallback.
      // To be safe, let's fetch /users/departments or fallback to mapping unique departments from usersList.
      const res = await api.get('/users/departments');
      set({ departmentsList: res.data.data || [] });
    } catch (err: any) {
      // Fallback: extract departments from users list if endpoint fails
      const users = get().usersList;
      const deptMap: Record<string, Department> = {};
      users.forEach((u) => {
        if (u.department) {
          deptMap[u.department.id] = {
            id: u.department.id,
            name: u.department.name,
            code: u.department.name.toUpperCase().replace(/\s+/g, '_')
          };
        }
      });
      set({ departmentsList: Object.values(deptMap) });
    }
  },
  addMeeting: async (meeting) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/meeting', meeting);
      if (res.data.status === 'success') {
        const newList = [res.data.data, ...get().meetingList];
        set({ meetingList: newList, loading: false });
        return true;
      }
      return false;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return false;
    }
  },
  updateMeeting: async (id, updatedFields) => {
    set({ loading: true, error: null });
    try {
      const res = await api.patch(`/meeting/${id}`, updatedFields);
      if (res.data.status === 'success') {
        const updatedList = get().meetingList.map((m) => m.id === id ? { ...m, ...res.data.data } : m);
        set({ meetingList: updatedList, loading: false });
        return true;
      }
      return false;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return false;
    }
  },
  deleteMeeting: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await api.delete(`/meeting/${id}`);
      if (res.data.status === 'success') {
        const updatedList = get().meetingList.filter((m) => m.id !== id);
        set({ meetingList: updatedList, loading: false });
        return true;
      }
      return false;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return false;
    }
  },
  sendInvitations: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post(`/meeting/${id}/send-invitation`);
      if (res.data.status === 'success') {
        const updatedList = get().meetingList.map((m) => m.id === id ? { ...m, ...res.data.data } : m);
        set({ meetingList: updatedList, loading: false });
        return true;
      }
      return false;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return false;
    }
  },
  sendInvitationSingle: async (id, email) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post(`/meeting/${id}/send-invitation-single`, { email });
      if (res.data.status === 'success') {
        const updatedList = get().meetingList.map((m) => m.id === id ? { ...m, ...res.data.data } : m);
        set({ meetingList: updatedList, loading: false });
        return true;
      }
      return false;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return false;
    }
  }
}));
