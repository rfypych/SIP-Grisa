import { create } from 'zustand';
import { EmployeeAttendance, DailyAttendance, generateMockRecords, names } from '../services/mockData';

export interface Employee {
  id: string;
  name: string;
  role: 'Guru' | 'Karyawan';
  photoUrl: string;
}

interface AttendanceStore {
  employees: Employee[];
  recordsByMonth: Record<string, Record<string, DailyAttendance[]>>; // "YYYY-MM" -> empId -> records
  isInitialized: boolean;
  initialize: () => void;
  addEmployee: (employee: Omit<Employee, 'id' | 'photoUrl'>) => void;
  deleteEmployee: (id: string) => void;
  updateEmployee: (id: string, data: Partial<Employee>) => void;
  getOrGenerateRecords: (month: number, year: number) => EmployeeAttendance[];
}

export const useAttendanceStore = create<AttendanceStore>((set, get) => ({
  employees: [],
  recordsByMonth: {},
  isInitialized: false,
  
  initialize: () => {
    if (get().isInitialized) return;
    
    // Generate initial employees
    const initialEmployees: Employee[] = names.map((name, index) => ({
      id: `EMP-${(index + 1).toString().padStart(3, '0')}`,
      name,
      role: index % 3 === 0 ? 'Karyawan' : 'Guru',
      photoUrl: `https://i.pravatar.cc/150?u=${index}`,
    }));
    
    set({ employees: initialEmployees, isInitialized: true });
  },
  
  addEmployee: (employeeData) => {
    set((state) => {
      const newId = `EMP-${(state.employees.length + 1).toString().padStart(3, '0')}`;
      const newEmployee: Employee = {
        ...employeeData,
        id: newId,
        photoUrl: `https://i.pravatar.cc/150?u=${newId}`,
      };
      return { employees: [...state.employees, newEmployee] };
    });
  },
  
  deleteEmployee: (id) => {
    set((state) => ({
      employees: state.employees.filter((emp) => emp.id !== id)
    }));
  },
  
  updateEmployee: (id, data) => {
    set((state) => ({
      employees: state.employees.map((emp) => 
        emp.id === id ? { ...emp, ...data } : emp
      )
    }));
  },
  
  getOrGenerateRecords: (month, year) => {
    const state = get();
    const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
    let currentMonthRecords = state.recordsByMonth[monthKey];
    
    // If records for this month don't exist at all, or we have new employees
    let needsUpdate = false;
    const newMonthRecords = { ...(currentMonthRecords || {}) };
    
    state.employees.forEach(emp => {
      if (!newMonthRecords[emp.id]) {
        newMonthRecords[emp.id] = generateMockRecords(month, year);
        needsUpdate = true;
      }
    });
    
    if (needsUpdate) {
      set(s => ({
        recordsByMonth: {
          ...s.recordsByMonth,
          [monthKey]: newMonthRecords
        }
      }));
    }
    
    // Combine employees with their records and summary
    return state.employees.map(emp => {
      const records = newMonthRecords[emp.id] || [];
      const summary = records.reduce((acc, curr) => {
        if (curr.status === 'Hadir') acc.hadir++;
        if (curr.status === 'Sakit') acc.sakit++;
        if (curr.status === 'Izin') acc.izin++;
        if (curr.status === 'Cuti') acc.cuti++;
        if (curr.status === 'Alpha') acc.alpha++;
        return acc;
      }, { hadir: 0, sakit: 0, izin: 0, cuti: 0, alpha: 0 });
      
      return {
        ...emp,
        records,
        summary
      };
    });
  }
}));

