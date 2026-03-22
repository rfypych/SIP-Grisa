import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { History, Search, RefreshCw, User, Shield, Clock, Info, Activity, FileText, Sparkles, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
  const [selectedLog, setSelectedLog] = useState<any>(null);
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
    if (action.includes('AI_AUTOMATION')) return 'text-purple-600 bg-purple-50 ring-purple-100';
    return 'text-slate-600 bg-slate-50 ring-slate-100';
  };

  const handleShowDetails = (log: SystemLog) => {
    try {
      const parsed = JSON.parse(log.details);
      setSelectedLog({ ...log, parsedDetails: parsed });
    } catch (e) {
      // Not JSON, just show as is
      setSelectedLog({ ...log, parsedDetails: null });
    }
  };

  return (
    <div className="space-y-6 relative">
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
                  <th className="px-6 py-4">Aksi</th>
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
                          {log.action === 'AI_AUTOMATION' ? 'Pendeteksi Otomatis' : log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2 max-w-md">
                          <Info className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                          <p className="text-slate-600 leading-relaxed line-clamp-1">
                            {log.action === 'AI_AUTOMATION' ? 'Otomasi kehadiran via foto' : log.details}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {log.action === 'AI_AUTOMATION' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleShowDetails(log)}
                            className="text-emerald-600 hover:bg-emerald-50 h-8 gap-1.5 font-bold"
                          >
                            <FileText className="w-3.5 h-3.5" /> Lihat Rincian
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Modal Detail AI */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 rounded-xl">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Rincian Otomasi</h3>
                    <p className="text-xs text-slate-500 font-medium">Log ID: #{selectedLog.id} • {format(new Date(selectedLog.timestamp), 'dd MMMM yyyy', { locale: id })}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {selectedLog.parsedDetails ? (
                   <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status Ringkasan</p>
                          <p className="text-lg font-black text-emerald-600">{selectedLog.parsedDetails.summary}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Entri</p>
                           <p className="text-lg font-black text-slate-900">{selectedLog.parsedDetails.items?.length || 0} Orang</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <User className="w-4 h-4 text-emerald-500" />
                          Daftar Personel Terdeteksi
                        </h4>
                        <div className="border border-slate-100 rounded-2xl overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase">
                              <tr>
                                <th className="px-4 py-3 text-left">Nama</th>
                                <th className="px-4 py-3 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {selectedLog.parsedDetails.items?.map((item: any, i: number) => (
                                <tr key={i} className="hover:bg-slate-50/50">
                                  <td className="px-4 py-3 font-semibold text-slate-700">{item.nama}</td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                      item.status === 'hadir' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                      {item.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {selectedLog.parsedDetails.errors?.length > 0 && (
                        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
                           <h4 className="text-sm font-bold text-rose-900 mb-2 flex items-center gap-2">
                             <AlertCircle className="w-4 h-4" /> Masalah Ditemukan
                           </h4>
                           <ul className="list-disc list-inside text-xs text-rose-700 space-y-1">
                             {selectedLog.parsedDetails.errors.map((err: string, i: number) => (
                               <li key={i}>{err}</li>
                             ))}
                           </ul>
                        </div>
                      )}
                   </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-mono text-xs break-all text-slate-600">
                    {selectedLog.details}
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                <Button 
                  onClick={() => setSelectedLog(null)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl"
                >
                  Tutup Rincian
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {!isLoading && filteredLogs.length > 0 && (
        <p className="text-[10px] text-center text-slate-400 uppercase font-bold tracking-widest">
          Menampilkan {filteredLogs.length} entri aktivitas terbaru
        </p>
      )}
    </div>
  );
}
