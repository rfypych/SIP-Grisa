import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './useAuthStore';

interface DailyAttendance {
  date: number;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' | 'Libur';
  checkIn?: string;
  checkOut?: string;
}

interface EmployeeAttendance {
  id: string;
  name: string;
  avatar: string;
  department: string;
  role: string;
  records: DailyAttendance[];
  summary: {
    hadir: number;
    sakit: number;
    izin: number;
    cuti: number;
    alpha: number;
  };
  photoUrl: string;
}

interface DashboardStats {
  summary: { hadir: number; sakit: number; izin: number; alpha: number };
  trends: { hadir: number; sakit: number; izin: number; alpha: number };
}

interface AttendanceStore {
  employees: any[];
  recordsByMonth: Record<string, Record<string, DailyAttendance[]>>; 
  isInitialized: boolean;
  isLoading: boolean;
  dashboardStats: DashboardStats | null;
  syncSocket: WebSocket | null;
  initialize: (month?: number, year?: number) => Promise<void>;
  fetchDashboardStats: () => Promise<void>;
  getOrGenerateRecords: (month: number, year: number) => EmployeeAttendance[];
  liveSync: () => void;
}

// Menggunakan path relatif agar proxy Vite otomatis mengarahkan ke Backend (8000)
// Ini memungkinkan akses dari HP via IP lokal tanpa mengubah variabel manual.
const API_BASE_URL = ''; 
const WS_BASE_URL = `ws://${window.location.host}/ws/kiosk`;

export const useAttendanceStore = create<AttendanceStore>((set, get) => ({
  employees: [],
  recordsByMonth: {},
  isInitialized: false,
  isLoading: false,
  dashboardStats: null,
  syncSocket: null,

  initialize: async (month?: number, year?: number) => {
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();
    
    const token = useAuthStore.getState().token;
    const logout = useAuthStore.getState().logout;
    set({ isLoading: true });
    try {
        const response = await fetch(`${API_BASE_URL}/api/reports?month=${currentMonth}&year=${currentYear}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            const employees = data.data.map((item: any) => {
                // Konversi objek 'kehadiran' ({ "1": {...}, "2": {...} }) menjadi array records
                const recordsArray = Object.entries(item.kehadiran || {}).map(([day, details]: [string, any]) => ({
                    date: parseInt(day),
                    status: (details.status || 'Alpha').charAt(0).toUpperCase() + (details.status || 'Alpha').slice(1),
                    checkIn: details.masuk,
                    checkOut: details.pulang
                }));

                return {
                    id: item.id ? item.id.toString() : 'unknown',
                    name: item.nama || 'Tanpa Nama',
                    photoUrl: item.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.nama || 'User'}`,
                    avatar: item.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.nama || 'User'}`, // Jaga kompatibilitas
                    department: item.role || 'Staff',
                    role: item.role || 'Staff',
                    summary: item.summary || { hadir: 0, sakit: 0, izin: 0, cuti: 0, alpha: 0 },
                    records: recordsArray
                };
            });
            
            set({ employees, isInitialized: true });
        }
    } catch (error) {
        console.error("Gagal menarik data absensi dari Backend:", error);
    } finally {
        set({ isLoading: false });
    }
  },

  fetchDashboardStats: async () => {
    const token = useAuthStore.getState().token;
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.status === 'success') {
            set({ dashboardStats: data });
        }
    } catch (e) {
        console.error("Gagal fetch statistik dashboard:", e);
    }
  },

  liveSync: () => {
    const state = get();
    if (state.syncSocket && state.syncSocket.readyState === WebSocket.OPEN) return;

    console.log("[LIVE-SYNC] Menghubungkan ke server untuk update real-time...");
    const ws = new WebSocket(WS_BASE_URL);
    set({ syncSocket: ws });

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.event === 'NEW_ATTENDANCE' || data.event === 'MANUAL_ATTENDANCE_UPDATE') {
            console.log("[LIVE-SYNC] Update absensi terdeteksi! Refreshing dashboard...");
            get().initialize();
            get().fetchDashboardStats();
        }
    };
    
    ws.onclose = () => {
        console.log("[LIVE-SYNC] Koneksi terputus. Mencoba menghubungkan kembali dalam 5 detik...");
        set({ syncSocket: null });
        setTimeout(() => get().liveSync(), 5000);
    };
  },

  getOrGenerateRecords: (month, year) => {
    const { employees } = get();
    return employees;
  }
}));
