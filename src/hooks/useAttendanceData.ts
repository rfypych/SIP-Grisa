import { useState, useEffect } from 'react';
import { useFilterStore } from '../store/useFilterStore';
import { useAttendanceStore } from '../store/useAttendanceStore';
import { EmployeeAttendance } from '../services/mockData';

export const useAttendanceData = () => {
  const { month, year, category } = useFilterStore();
  const { initialize, getOrGenerateRecords, employees, recordsByMonth } = useAttendanceStore();
  const [data, setData] = useState<EmployeeAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    const timer = setTimeout(() => {
      let currentData = getOrGenerateRecords(month, year);
      
      if (category !== 'Semua') {
        currentData = currentData.filter(emp => emp.role === category);
      }
      
      setData(currentData);
      setIsLoading(false);
    }, 300); // reduced delay for snappier feel

    return () => clearTimeout(timer);
  }, [month, year, category, employees, recordsByMonth, getOrGenerateRecords]);

  return { data, isLoading };
};
