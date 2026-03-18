import { create } from 'zustand';

interface FilterState {
  month: number; // 1-12
  year: number;
  category: 'Semua' | 'Guru' | 'Karyawan';
  setMonth: (month: number) => void;
  setYear: (year: number) => void;
  setCategory: (category: 'Semua' | 'Guru' | 'Karyawan') => void;
}

const currentDate = new Date();

export const useFilterStore = create<FilterState>((set) => ({
  month: currentDate.getMonth() + 1,
  year: currentDate.getFullYear(),
  category: 'Semua',
  setMonth: (month) => set({ month }),
  setYear: (year) => set({ year }),
  setCategory: (category) => set({ category }),
}));
