import React, { useMemo } from 'react';
import { useAttendanceData } from '../../hooks/useAttendanceData';
import { useFilterStore } from '../../store/useFilterStore';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Download } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function LaporanPage() {
  const { data, isLoading } = useAttendanceData();
  const { month, year } = useFilterStore();

  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [month, year]);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Memuat Matriks Laporan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50/50">
        <h2 className="text-lg font-semibold text-slate-800">Matriks Kehadiran</h2>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Export Excel
        </Button>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto relative">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs text-slate-600 uppercase bg-slate-100 sticky top-0 z-20 shadow-sm">
            <tr>
              {/* Sticky Left Header */}
              <th className="px-4 py-3 border-b border-r border-slate-200 md:sticky left-0 bg-slate-100 md:z-30 min-w-[50px]">No</th>
              <th className="px-4 py-3 border-b border-r border-slate-200 md:sticky left-[50px] bg-slate-100 md:z-30 min-w-[200px]">Nama Pegawai</th>
              <th className="px-4 py-3 border-b border-r border-slate-200 md:sticky left-[250px] bg-slate-100 md:z-30 min-w-[100px]">Role</th>
              
              {/* Scrollable Middle Header */}
              {daysArray.map(day => (
                <th key={day} className="px-2 py-3 border-b border-r border-slate-200 text-center min-w-[60px]">
                  {day}
                </th>
              ))}

              {/* Sticky Right Header */}
              <th className="px-4 py-3 border-b border-l border-slate-200 md:sticky right-[200px] bg-slate-100 md:z-30 text-center min-w-[50px]">H</th>
              <th className="px-4 py-3 border-b border-l border-slate-200 md:sticky right-[150px] bg-slate-100 md:z-30 text-center min-w-[50px]">S</th>
              <th className="px-4 py-3 border-b border-l border-slate-200 md:sticky right-[100px] bg-slate-100 md:z-30 text-center min-w-[50px]">I</th>
              <th className="px-4 py-3 border-b border-l border-slate-200 md:sticky right-[50px] bg-slate-100 md:z-30 text-center min-w-[50px]">C</th>
              <th className="px-4 py-3 border-b border-l border-slate-200 md:sticky right-0 bg-slate-100 md:z-30 text-center min-w-[50px]">A</th>
            </tr>
          </thead>
          <tbody>
            {data.map((emp, index) => (
              <tr key={emp.id} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                {/* Sticky Left Columns */}
                <td className="px-4 py-3 border-r border-slate-200 md:sticky left-0 bg-white md:z-10 font-medium text-slate-500">
                  {index + 1}
                </td>
                <td className="px-4 py-3 border-r border-slate-200 md:sticky left-[50px] bg-white md:z-10">
                  <div className="flex items-center gap-3">
                    <img src={emp.photoUrl} alt={emp.name} className="w-8 h-8 rounded-full border border-slate-200 object-cover" />
                    <span className="font-medium text-slate-900 whitespace-nowrap">{emp.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 border-r border-slate-200 md:sticky left-[250px] bg-white md:z-10">
                  <Badge variant={emp.role === 'Guru' ? 'default' : 'secondary'} className="whitespace-nowrap">
                    {emp.role}
                  </Badge>
                </td>

                {/* Scrollable Middle Columns */}
                {daysArray.map(day => {
                  const record = emp.records.find(r => r.date === day);
                  const isWeekend = new Date(year, month - 1, day).getDay() === 0 || new Date(year, month - 1, day).getDay() === 6;
                  
                  return (
                    <td key={day} className={cn(
                      "p-1 border-r border-slate-200 text-center text-xs",
                      isWeekend ? "bg-slate-50" : ""
                    )}>
                      {record && record.status !== 'Libur' ? (
                        <div className="flex flex-col gap-1">
                          <div className={cn(
                            "px-1 py-0.5 rounded font-mono",
                            record.checkIn ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                          )}>
                            {record.checkIn || '-'}
                          </div>
                          <div className={cn(
                            "px-1 py-0.5 rounded font-mono",
                            record.checkOut ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                          )}>
                            {record.checkOut || '-'}
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-300">-</div>
                      )}
                    </td>
                  );
                })}

                {/* Sticky Right Columns */}
                <td className="px-4 py-3 border-l border-slate-200 md:sticky right-[200px] bg-white md:z-10 text-center font-semibold text-emerald-600">
                  {emp.summary.hadir}
                </td>
                <td className="px-4 py-3 border-l border-slate-200 md:sticky right-[150px] bg-white md:z-10 text-center font-medium text-amber-500">
                  {emp.summary.sakit}
                </td>
                <td className="px-4 py-3 border-l border-slate-200 md:sticky right-[100px] bg-white md:z-10 text-center font-medium text-blue-500">
                  {emp.summary.izin}
                </td>
                <td className="px-4 py-3 border-l border-slate-200 md:sticky right-[50px] bg-white md:z-10 text-center font-medium text-purple-500">
                  {emp.summary.cuti}
                </td>
                <td className="px-4 py-3 border-l border-slate-200 md:sticky right-0 bg-white md:z-10 text-center font-bold text-red-500">
                  {emp.summary.alpha}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
