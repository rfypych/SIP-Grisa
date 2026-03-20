import { useState, useEffect } from 'react';
import { useFilterStore } from '../store/useFilterStore';
import { useAttendanceStore, EmployeeAttendance } from '../store/useAttendanceStore';

export const useAttendanceData = () => {
  const { month, year, category } = useFilterStore();
  const { initialize, employees, isLoading: isStoreLoading } = useAttendanceStore();
  const [data, setData] = useState<EmployeeAttendance[]>([]);

  useEffect(() => {
    // Panggil initialize setiap kali bulan atau tahun di filter berubah
    initialize(month, year);
  }, [initialize, month, year]);

  useEffect(() => {
    let currentData = [...employees];
    
    if (category !== 'Semua') {
      currentData = currentData.filter(emp => emp.role === category);
    }
    
    setData(currentData);
  }, [category, employees]);

  return { data, isLoading: isStoreLoading };
};
