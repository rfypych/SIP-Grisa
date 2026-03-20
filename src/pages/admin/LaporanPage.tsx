import React, { useMemo, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { useAttendanceData } from '../../hooks/useAttendanceData';
import { useAttendanceStore } from '../../store/useAttendanceStore';
import { useFilterStore } from '../../store/useFilterStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';
import { Download, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

export default function LaporanPage() {
  const { data, isLoading } = useAttendanceData();
  const { month, year, category, setMonth, setYear, setCategory } = useFilterStore();
  const { categories } = useSettingsStore();
  const { token } = useAuthStore();
  const [holidays, setHolidays] = React.useState<string[]>([]);
  const [selectedCell, setSelectedCell] = React.useState<{empId: string, empName: string, date: string, status: string} | null>(null);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const years = [2024, 2025, 2026];
  const liveSync = useAttendanceStore(state => state.liveSync);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    liveSync();
    
    const fetchHolidays = async () => {
      try {
        const res = await fetch('/api/holidays', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setHolidays(data.map((h: any) => h.date));
        }
      } catch (e) {
        console.error("Failed to fetch holidays", e);
      }
    };
    fetchHolidays();
  }, [liveSync, token]);

  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [month, year]);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleOpenCorrection = (emp: any, day: number) => {
    const cellDate = new Date(year, month - 1, day);
    const dateStr = cellDate.toLocaleDateString('en-CA');
    const record = emp.records.find((r: any) => r.date === day);
    
    setSelectedCell({
      empId: emp.id,
      empName: emp.name,
      date: dateStr,
      status: record ? record.status : 'alpha'
    });
  };

  const handleAction = async (action: 'sakit' | 'izin' | 'dinas' | 'hadir' | 'alfa' | 'delete') => {
    if (!selectedCell) return;
    setIsUpdating(true);
    try {
      if (action === 'delete') {
        const res = await fetch(`/api/attendance?employee_id=${selectedCell.empId}&date=${selectedCell.date}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          toast.success("Status berhasil dicopot");
          setSelectedCell(null);
          window.location.reload(); 
        }
      } else {
        const res = await fetch('/api/attendance/manual', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({
            employee_id: selectedCell.empId,
            date: selectedCell.date,
            status: action
          })
        });
        if (res.ok) {
          toast.success(`Berhasil mengubah ke ${action.toUpperCase()}`);
          setSelectedCell(null);
          window.location.reload();
        }
      }
    } catch (e) {
      toast.error("Gagal memperbarui status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGoToToday = () => {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (month !== currentMonth || year !== currentYear) {
      setMonth(currentMonth);
      setYear(currentYear);
      setTimeout(() => scrollToDay(currentDay), 300);
    } else {
      scrollToDay(currentDay);
    }
  };

  const scrollToDay = (day: number) => {
    const element = document.getElementById(`day-header-${day}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      element.classList.add('bg-emerald-200');
      setTimeout(() => element.classList.remove('bg-emerald-200'), 2000);
    }
  };

  const getDayName = (day: number) => {
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('id-ID', { weekday: 'short' });
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Laporan Absensi', {
      views: [{ showGridLines: false }],
      pageSetup: { orientation: 'landscape', paperSize: 9 }
    });

    // 1. KOP LAPORAN (TITLE)
    sheet.mergeCells('A1', 'AK1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'SISTEM INFORMASI PRESENSI GRISA (SIP GRISA)';
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }; // Emerald-500
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    sheet.mergeCells('A2', 'AK2');
    const subTitleCell = sheet.getCell('A2');
    subTitleCell.value = `REKAPITULASI KEHADIRAN PEGAWAI - ${months[month - 1].toUpperCase()} ${year}`;
    subTitleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF334155' } };
    subTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    sheet.mergeCells('A3', 'AK3');
    const metaCell = sheet.getCell('A3');
    metaCell.value = `Kategori: ${category} | Diekspor pada: ${new Date().toLocaleString('id-ID')}`;
    metaCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } };
    metaCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // 2. HEADER TABEL (2 Baris: Hari & Tanggal)
    const dayNamesRow = sheet.getRow(5);
    const dateRow = sheet.getRow(6);

    // Header untuk kolom statis
    dayNamesRow.getCell(1).value = "No";
    dateRow.getCell(1).value = "No";
    sheet.mergeCells('A5:A6');

    dayNamesRow.getCell(2).value = "Nama Pegawai";
    dateRow.getCell(2).value = "Nama Pegawai";
    sheet.mergeCells('B5:B6');

    dayNamesRow.getCell(3).value = "Role";
    dateRow.getCell(3).value = "Role";
    sheet.mergeCells('C5:C6');

    [1, 2, 3].forEach(colIndex => {
      const cell = dayNamesRow.getCell(colIndex);
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; // Slate-800
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // Header untuk hari & tanggal
    daysArray.forEach((day, i) => {
      const colIndex = 4 + i;
      const cellDate = new Date(year, month - 1, day);
      const isSunday = cellDate.getDay() === 0;
      const isSaturday = cellDate.getDay() === 6;
      const dayName = cellDate.toLocaleDateString('id-ID', { weekday: 'short' }).toUpperCase();
      
      dayNamesRow.getCell(colIndex).value = dayName;
      dateRow.getCell(colIndex).value = day;

      let fgColor = 'FF334155'; // Slate-700
      if (isSunday) fgColor = 'FFEF4444'; // Red-500
      else if (isSaturday) fgColor = 'FFF59E0B'; // Amber-500

      [dayNamesRow.getCell(colIndex), dateRow.getCell(colIndex)].forEach((cell, idx) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: idx === 0 ? 8 : 10 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fgColor } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
    });

    // Header untuk Rekapitulasi (H, S, I, D, A)
    const summaryStart = 4 + daysArray.length;
    const summaries = [
      { lbl: 'H', color: 'FF10B981' }, // Emerald-500
      { lbl: 'S', color: 'FFA855F7' }, // Purple-500
      { lbl: 'I', color: 'FF3B82F6' }, // Blue-500
      { lbl: 'D', color: 'FFF59E0B' }, // Amber-500
      { lbl: 'A', color: 'FFEF4444' }  // Red-500
    ];

    summaries.forEach((s, i) => {
      const colIndex = summaryStart + i;
      dayNamesRow.getCell(colIndex).value = s.lbl;
      dateRow.getCell(colIndex).value = s.lbl; // Required before merge, conceptually
      
      // ExcelJS merge format doesn't natively accept alpha-numeric for simple merging, so use numbers 
      // or simply column strings
      const startLetter = sheet.getColumn(colIndex).letter;
      sheet.mergeCells(`${startLetter}5:${startLetter}6`);

      const cell = sheet.getCell(`${startLetter}5`); // The merged cell instance
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: s.color } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // 3. DATA ROWS
    data.forEach((emp, index) => {
      const row = sheet.addRow([
        index + 1,
        emp.name,
        emp.role || 'Staff'
      ]);

      // Row styling for non-date elements
      [1, 2, 3].forEach(colIndex => {
        const cell = row.getCell(colIndex);
        if (colIndex === 1 || colIndex === 3) cell.alignment = { vertical: 'middle', horizontal: 'center' };
        else cell.alignment = { vertical: 'middle', horizontal: 'left' };
      });

      daysArray.forEach((day, i) => {
        const record = emp.records.find(r => r.date === day);
        const cellDate = new Date(year, month - 1, day);
        const isSunday = cellDate.getDay() === 0;
        const isSaturday = cellDate.getDay() === 6;
        const cell = row.getCell(4 + i);

        // Reset text alignment for data cells
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

        if (record && record.status !== 'Libur') {
          cell.value = record.checkIn ? `${record.checkIn}\n${record.checkOut || '-'}` : (record.status.toUpperCase().charAt(0));
          
          if (record.checkIn) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } }; // Emerald-100 (Lebih terlihat)
            cell.font = { color: { argb: 'FF065F46' }, size: 8, bold: true };
          } else if (record.status === 'sakit') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E8FF' } }; // Purple-100
            cell.font = { color: { argb: 'FF6B21A8' }, bold: true };
          } else if (record.status === 'izin') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }; // Blue-100
            cell.font = { color: { argb: 'FF1E3A8A' }, bold: true };
          } else if (record.status === 'dinas') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }; // Amber-100
            cell.font = { color: { argb: 'FF92400E' }, bold: true };
          }
        } else if (isSunday) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFACACA' } }; // Red-100 (Soft)
          cell.font = { color: { argb: 'FFEF4444' }, size: 9 };
          cell.value = 'L';
        } else if (isSaturday) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEDD5' } }; // Orange-50 (Soft)
          cell.font = { color: { argb: 'FFF97316' }, size: 9 };
          cell.value = 'L';
        } else {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }; // Slate-50 (Slightly grey for empty)
          cell.font = { color: { argb: 'FFCBD5E1' } }; // Slate-300
          cell.value = '-';
        }
      });

      const sColStart = 4 + daysArray.length;
      row.getCell(sColStart).value = emp.summary.hadir;
      row.getCell(sColStart).font = { bold: true, color: { argb: 'FF059669' } };
      
      row.getCell(sColStart+1).value = emp.summary.sakit;
      row.getCell(sColStart+2).value = emp.summary.izin;
      row.getCell(sColStart+3).value = emp.summary.cuti;
      row.getCell(sColStart+4).value = emp.summary.alpha;
      row.getCell(sColStart+4).font = { bold: true, color: { argb: 'FFDC2626' } };

      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },    // Slate-300 borders
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        };
      });
    });

    // 4. COLUMN WIDTHS
    sheet.getColumn(1).width = 5;
    sheet.getColumn(2).width = 30;
    sheet.getColumn(3).width = 15;
    daysArray.forEach((_, i) => {
      sheet.getColumn(4 + i).width = 7;
    });
    for(let i=0; i<5; i++) sheet.getColumn(summaryStart + i).width = 6;

    // 5. FOOTER
    const lastRowIndex = sheet.rowCount + 2;
    sheet.mergeCells(`A${lastRowIndex}`, `F${lastRowIndex}`);
    sheet.getCell(`A${lastRowIndex}`).value = 'Keterangan:';
    sheet.getCell(`A${lastRowIndex}`).font = { bold: true };

    sheet.getCell(`A${lastRowIndex+1}`).value = 'H : Hadir | S : Sakit | I : Izin | D : Dinas | A : Alpha';
    sheet.getCell(`A${lastRowIndex+1}`).font = { size: 9, italic: true };

    const { exportLocation, exportSignatureEnabled, exportSignatureName, exportSignatureRole } = useSettingsStore.getState();

    if (exportSignatureEnabled) {
      const signRow = lastRowIndex + 2;
      sheet.mergeCells(`AC${signRow}`, `AK${signRow}`);
      sheet.getCell(`AC${signRow}`).value = `${exportLocation}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
      sheet.getCell(`AC${signRow}`).alignment = { horizontal: 'center' };

      sheet.mergeCells(`AC${signRow+1}`, `AK${signRow+1}`);
      sheet.getCell(`AC${signRow+1}`).value = exportSignatureRole;
      sheet.getCell(`AC${signRow+1}`).alignment = { horizontal: 'center' };

      sheet.mergeCells(`AC${signRow+5}`, `AK${signRow+5}`);
      sheet.getCell(`AC${signRow+5}`).value = exportSignatureName;
      sheet.getCell(`AC${signRow+5}`).font = { bold: true };
      sheet.getCell(`AC${signRow+5}`).alignment = { horizontal: 'center' };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Laporan_Absensi_Grisa_${months[month - 1]}_${year}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
    toast.success("Laporan Excel berhasil diekspor!");
  };

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
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-slate-900">
      {/* Modal Koreksi */}
      {selectedCell && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
             <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">Koreksi Presensi</h3>
                <p className="text-sm text-slate-500">{selectedCell.empName} • {new Date(selectedCell.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
             </div>
             
             <div className="p-6 space-y-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pilih Status Baru</p>
                <div className="grid grid-cols-2 gap-3">
                   <button onClick={() => handleAction('sakit')} disabled={isUpdating} className="flex items-center justify-center p-3 rounded-xl border border-purple-100 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors font-semibold disabled:opacity-50">Sakit</button>
                   <button onClick={() => handleAction('izin')} disabled={isUpdating} className="flex items-center justify-center p-3 rounded-xl border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors font-semibold disabled:opacity-50">Izin</button>
                   <button onClick={() => handleAction('dinas')} disabled={isUpdating} className="flex items-center justify-center p-3 rounded-xl border border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors font-semibold disabled:opacity-50">Dinas</button>
                   <button onClick={() => handleAction('hadir')} disabled={isUpdating} className="flex items-center justify-center p-3 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors font-semibold disabled:opacity-50">Hadir</button>
                   <button onClick={() => handleAction('alfa')} disabled={isUpdating} className="col-span-2 flex items-center justify-center p-3 rounded-xl border border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors font-semibold disabled:opacity-50 text-center">Alfa (Tanpa Keterangan)</button>
                </div>
                
                <div className="pt-4 border-t border-slate-100">
                   <button 
                    onClick={() => handleAction('delete')}
                    disabled={isUpdating}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors font-bold border border-rose-100 disabled:opacity-50"
                   >
                      <Trash2 className="w-4 h-4" />
                      Copot Status (Hapus Data)
                   </button>
                </div>
             </div>
             
             <div className="px-6 py-4 bg-slate-50 flex justify-end">
                <button onClick={() => setSelectedCell(null)} className="px-4 py-2 text-slate-600 font-medium hover:text-slate-800 transition-colors">Tutup</button>
             </div>
          </div>
        </div>
      )}

      {/* Toolbar & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between p-4 border-b border-slate-200 bg-slate-50/50 gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Matriks Kehadiran</h2>
          <p className="text-sm text-slate-500">Periode {months[month - 1]} {year}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-28 sm:w-32 bg-white border-slate-200 focus:ring-emerald-500 shadow-sm">
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </Select>
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-20 sm:w-24 bg-white border-slate-200 focus:ring-emerald-500 shadow-sm">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </Select>
          <Select value={category} onChange={(e) => setCategory(e.target.value as any)} className="w-32 sm:w-36 bg-white border-slate-200 focus:ring-emerald-500 shadow-sm">
            <option value="Semua">Semua Kategori</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
          <div className="w-px h-8 bg-slate-200 hidden sm:block mx-1"></div>
          <Button variant="outline" size="sm" onClick={handleGoToToday} className="gap-2 shrink-0 border-emerald-100 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 transition-colors">
            <Calendar className="w-4 h-4" />
            Hari Ini
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-2 shrink-0">
            <Download className="w-4 h-4" />
            Export Excel
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto relative">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs text-slate-600 uppercase bg-slate-100 sticky top-0 z-20 shadow-sm">
            <tr>
              <th className="px-3 py-3 border-b border-r border-slate-200 sticky left-0 bg-slate-100 z-30 min-w-[40px] max-w-[40px] sm:min-w-[50px] sm:max-w-[50px]">No</th>
              <th className="px-4 py-3 border-b border-r border-slate-200 sticky left-[40px] sm:left-[50px] bg-slate-100 z-30 min-w-[180px] sm:min-w-[200px]">Nama Pegawai</th>
              <th className="px-4 py-3 border-b border-r border-slate-200 md:sticky md:left-[250px] bg-slate-100 z-20 md:z-30 min-w-[100px]">Role</th>
              {daysArray.map(day => {
                const cellDate = new Date(year, month - 1, day);
                const isSunday = cellDate.getDay() === 0;
                const isSaturday = cellDate.getDay() === 6;
                const isToday = new Date().getDate() === day && new Date().getMonth() + 1 === month && new Date().getFullYear() === year;
                
                return (
                  <th 
                    key={day} 
                    id={`day-header-${day}`}
                    className={cn(
                      "px-2 py-2 border-b border-r border-slate-200 text-center min-w-[65px] transition-colors",
                      isToday ? "bg-emerald-50 text-emerald-700 font-bold" : "",
                      isSunday ? "text-red-600" : "",
                      isSaturday ? "text-amber-600" : ""
                    )}
                  >
                    <div className={cn(
                      "text-[10px] opacity-70 mb-0.5",
                      isSunday ? "text-red-500 opacity-100 font-bold" : "",
                      isSaturday ? "text-amber-500 opacity-100 font-bold" : ""
                    )}>
                      {getDayName(day)}
                    </div>
                    <div className="text-sm">{day}</div>
                  </th>
                );
              })}
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
                <td className="px-3 py-3 border-r border-slate-200 sticky left-0 bg-white z-20 font-medium text-slate-500 text-center">{index + 1}</td>
                <td className="px-4 py-3 border-r border-slate-200 sticky left-[40px] sm:left-[50px] bg-white z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] md:shadow-none">
                  <div className="flex items-center gap-3">
                    <img src={emp.photoUrl} alt={emp.name} className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0" />
                    <span className="font-medium text-slate-900 whitespace-nowrap truncate max-w-[120px] sm:max-w-none">{emp.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 border-r border-slate-200 md:sticky md:left-[250px] bg-white z-10 md:z-20 md:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  <Badge variant={emp.role === 'Guru' ? 'default' : 'secondary'} className="whitespace-nowrap">{emp.role}</Badge>
                </td>
                {daysArray.map(day => {
                  const record = emp.records.find(r => r.date === day);
                  const cellDate = new Date(year, month - 1, day);
                  const isSunday = cellDate.getDay() === 0;
                  const isSaturday = cellDate.getDay() === 6;
                  const isWeekend = isSunday || isSaturday;
                  const dateStr = cellDate.toLocaleDateString('en-CA');
                  const isHoliday = holidays.includes(dateStr);
                  const isPast = cellDate < new Date(new Date().setHours(0,0,0,0));
                  const backendStartDate = useSettingsStore.getState().programStartDate || '2026-03-01';
                  const isAfterStart = cellDate >= new Date(backendStartDate);
                  const isAlpha = !record && !isWeekend && !isHoliday && isPast && isAfterStart;
                  
                  const getStatusStyles = (status: string) => {
                    switch(status.toLowerCase()) {
                      case 'hadir': return "bg-emerald-100 text-emerald-700";
                      case 'sakit': return "bg-purple-100 text-purple-700";
                      case 'izin': return "bg-blue-100 text-blue-700";
                      case 'dinas': return "bg-amber-100 text-amber-700";
                      default: return "bg-red-100 text-red-700";
                    }
                  };

                   const isToday = new Date().getDate() === day && new Date().getMonth() + 1 === month && new Date().getFullYear() === year;

                   return (
                    <td 
                      key={day} 
                      onClick={() => !isWeekend && !isHoliday && handleOpenCorrection(emp, day)}
                      className={cn(
                        "p-1 border-r border-slate-200 text-center text-xs transition-colors",
                        isSunday ? "bg-red-50/50" : (isSaturday ? "bg-amber-50/50" : "cursor-pointer hover:bg-slate-100"),
                        isHoliday ? "bg-blue-50/50" : "",
                        isToday ? "bg-emerald-50/30" : ""
                      )}
                    >
                      {record && record.status !== 'Libur' ? (
                        <div className="flex flex-col gap-1">
                          <div className={cn("px-1 py-0.5 rounded font-mono", record.checkIn ? "bg-emerald-100 text-emerald-700" : getStatusStyles(record.status))}>
                            {record.checkIn || (record.status === 'hadir' ? '-' : record.status.toUpperCase().charAt(0))}
                          </div>
                          <div className={cn("px-1 py-0.5 rounded font-mono", record.checkOut ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500")}>
                            {record.checkOut || '-'}
                          </div>
                        </div>
                      ) : isHoliday ? (
                        <div className="flex flex-col items-center justify-center h-full opacity-60">
                           <div className="px-1 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">LIBUR</div>
                        </div>
                      ) : isAlpha ? (
                        <div className="flex flex-col gap-1 opacity-80">
                          <div className="px-1 py-0.5 rounded font-mono bg-red-100 text-red-700">A</div>
                          <div className="px-1 py-0.5 rounded font-mono bg-slate-100 text-slate-400">-</div>
                        </div>
                      ) : (
                        <div className="text-slate-300">-</div>
                      )}
                    </td>
                  );
                })}
                <td className="px-4 py-3 border-l border-slate-200 md:sticky right-[200px] bg-white md:z-10 text-center font-semibold text-emerald-600">{emp.summary.hadir}</td>
                <td className="px-4 py-3 border-l border-slate-200 md:sticky right-[150px] bg-white md:z-10 text-center font-medium text-amber-500">{emp.summary.sakit}</td>
                <td className="px-4 py-3 border-l border-slate-200 md:sticky right-[100px] bg-white md:z-10 text-center font-medium text-blue-500">{emp.summary.izin}</td>
                <td className="px-4 py-3 border-l border-slate-200 md:sticky right-[50px] bg-white md:z-10 text-center font-medium text-purple-500">{emp.summary.cuti}</td>
                <td className="px-4 py-3 border-l border-slate-200 md:sticky right-0 bg-white md:z-10 text-center font-bold text-red-500">{emp.summary.alpha}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
