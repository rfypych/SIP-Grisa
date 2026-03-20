import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { History, Search, RefreshCw, User, Shield, Clock, Info, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface SystemLog {
  id: number;
  admin_id: number | null;
  admin_name: string | null;
  action: string;
  details: string;
  ip_address: string;
  timestamp: string;
}

export default function LogSistemPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { token } = useAuthStore();

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
        setFilteredLogs(data);
      } else {
        toast.error("Gagal memuat log sistem");
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
      log.action.toLowerCase().includes(query) || 
      log.details.toLowerCase().includes(query) || 
      (log.admin_name?.toLowerCase().includes(query) || 'sistem').includes(query)
    );
    setFilteredLogs(filtered);
  }, [searchQuery, logs]);

  const getActionColor = (action: string) => {
    if (action.includes('DELETE')) return 'text-red-600 bg-red-50 ring-red-100';
    if (action.includes('CREATE') || action.includes('ENROLL')) return 'text-emerald-600 bg-emerald-50 ring-emerald-100';
    if (action.includes('UPDATE')) return 'text-blue-600 bg-blue-50 ring-blue-100';
    return 'text-slate-600 bg-slate-50 ring-slate-100';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-7 h-7 text-emerald-600" />
            Log Aktivitas Sistem
          </h2>
          <p className="text-sm text-slate-500 mt-1">Audit trail lengkap dari seluruh aksi administratif dalam sistem.</p>
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <Input 
              placeholder="Cari aksi, detail, atau pengelola..."
              className="pl-10 h-11 bg-slate-50/50 border-slate-200 focus:ring-2 focus:ring-emerald-500 transition-all rounded-xl"
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
                  <th className="px-6 py-4">Waktu</th>
                  <th className="px-6 py-4">Pengelola</th>
                  <th className="px-6 py-4">Aksi</th>
                  <th className="px-6 py-4">Detail</th>
                  <th className="px-6 py-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="h-4 bg-slate-100 rounded w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                      Tidak ada catatan log yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium">
                            {format(new Date(log.timestamp), 'dd MMM yyyy, HH:mm', { locale: id })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${log.admin_name ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                            {log.admin_name ? <Shield className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 leading-none">{log.admin_name || 'System'}</p>
                            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tight">
                              {log.admin_name ? 'Administrator' : 'Automated'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ring-1 ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2 max-w-md">
                          <Info className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                          <p className="text-slate-600 leading-relaxed">{log.details}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-400 font-mono text-xs">
                        {log.ip_address}
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
        <p className="text-[10px] text-center text-slate-400 uppercase font-bold tracking-widest">
          Menampilkan {filteredLogs.length} entri aktivitas terbaru
        </p>
      )}
    </div>
  );
}
