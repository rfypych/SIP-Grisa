import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ClipboardList, Search, RefreshCw, User, MapPin, Clock, ArrowRightLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface AttendanceLog {
  id: number;
  employee_id: string;
  employee_name: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  recorded_by: number | null;
  gate_name: string | null;
}

export default function LogKehadiranPage() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AttendanceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { token } = useAuthStore();

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/attendance/logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
        setFilteredLogs(data);
      } else {
        toast.error("Gagal memuat log kehadiran");
      }
    } catch (e) {
      toast.error("Kesalahan jaringan saat memuat log");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token]);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredLogs(logs);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = logs.filter(log => 
      log.employee_name.toLowerCase().includes(query) || 
      log.employee_id.toLowerCase().includes(query) || 
      (log.gate_name?.toLowerCase() || 'otomatis').includes(query)
    );
    setFilteredLogs(filtered);
  }, [searchQuery, logs]);

  const getStatusBadge = (status: string) => {
    const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ring-1 ";
    switch (status.toLowerCase()) {
      case 'hadir': return base + "text-emerald-600 bg-emerald-50 ring-emerald-100";
      case 'izin': return base + "text-blue-600 bg-blue-50 ring-blue-100";
      case 'sakit': return base + "text-amber-600 bg-amber-50 ring-amber-100";
      case 'alfa': return base + "text-red-600 bg-red-50 ring-red-100";
      default: return base + "text-slate-600 bg-slate-50 ring-slate-100";
    }
  };

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-blue-600" />
            Log Kehadiran (Riwayat Gerbang)
          </h2>
          <p className="text-sm text-slate-500 mt-1">Pantau siapa masuk lewat gerbang mana secara real-time.</p>
        </div>
        <Button 
          onClick={fetchLogs} 
          variant="outline" 
          disabled={isLoading}
          className="bg-white hover:bg-slate-50 border-slate-200"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Segarkan Data
        </Button>
      </div>

      <Card className="border-slate-200 overflow-hidden shadow-sm">
        <CardHeader className="bg-white border-b border-slate-100 py-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              placeholder="Cari nama pegawai, ID, atau nama gerbang..."
              className="w-full pl-10 pr-4 h-11 bg-slate-50/50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all rounded-xl text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Pegawai</th>
                  <th className="px-6 py-4 text-center">Rincian Waktu</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Dicatat Oleh (Gerbang)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={4} className="px-6 py-4">
                        <div className="h-4 bg-slate-100 rounded w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic font-medium">
                      Belum ada riwayat kehadiran yang tercatat.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 leading-none">{log.employee_name}</p>
                            <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold tracking-wide">{log.employee_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded shadow-sm">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {format(new Date(log.date), 'EEEE, dd MMM yyyy', { locale: id })}
                          </div>
                          <div className="flex items-center justify-center gap-3 w-full">
                            <div className="flex flex-col items-end">
                              <span className="text-[9px] uppercase font-bold text-slate-400">Masuk</span>
                              <span className="font-mono text-emerald-600 font-bold">{log.check_in || '--:--'}</span>
                            </div>
                            <ArrowRightLeft className="w-3.5 h-3.5 text-slate-300" />
                            <div className="flex flex-col items-start">
                              <span className="text-[9px] uppercase font-bold text-slate-400">Pulang</span>
                              <span className="font-mono text-blue-600 font-bold">{log.check_out || '--:--'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={getStatusBadge(log.status)}>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {log.status}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${log.gate_name ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                            <MapPin className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 leading-none">{log.gate_name || 'System Auto'}</p>
                            <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase tracking-wider italic">
                              {log.gate_name ? 'Akses Gerbang' : 'Sistem Otomatis'}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {!isLoading && filteredLogs.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest italic">
            * Menampilkan {filteredLogs.length} transaksi presensi terbaru
          </p>
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Live Audit Active</span>
          </div>
        </div>
      )}
    </div>
  );
}
