import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Calendar as CalendarIcon, Plus, Trash2, Loader2, RotateCcw, RefreshCw, Info, Pencil, Check, X, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

interface Holiday {
  id: number;
  date: string;
  name: string;
  type: 'custom' | 'nasional';
}

export default function HolidayManagementPage() {
  const { token, user } = useAuthStore();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newDate, setNewDate] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editName, setEditName] = useState('');

  const fetchHolidays = async () => {
    try {
      const res = await fetch('/api/holidays', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setHolidays(await res.json());
    } catch (e) {
      toast.error("Gagal memuat data hari libur");
    } finally {
      setIsLoading(false); // Renamed from 'setLoading'
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [token]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/holidays', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ holiday_date: newDate, description: newDesc })
      });

      if (res.ok) {
        toast.success("Hari libur ditambahkan");
        setNewDate('');
        setNewDesc('');
        fetchHolidays();
      } else {
        const error = await res.json();
        toast.error(error.detail || "Gagal menambahkan hari libur");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncNationals = async () => {
    if (!window.confirm("Sinkronisasi akan menarik data hari libur nasional terbaru ke database. Lanjutkan?")) return;
    setIsSyncing(true);
    try {
      const res = await fetch('/api/holidays/sync', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchHolidays();
      } else {
        toast.error(data.detail || "Gagal sinkronisasi");
      }
    } catch (e) {
      toast.error("Kesalahan jaringan");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm("PERINGATAN: Ini akan MENGHAPUS SEMUA hari libur kustom dan nasional, lalu menyinkronkan ulang data nasional default. Lanjutkan?")) return;
    setIsSyncing(true);
    try {
      const res = await fetch('/api/holidays/reset', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchHolidays();
      } else {
        toast.error(data.detail || "Gagal reset");
      }
    } catch (e) {
      toast.error("Kesalahan jaringan");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus hari libur ini?")) return;

    try {
      const res = await fetch(`/api/holidays/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Hari libur dihapus");
        fetchHolidays();
      }
    } catch (e) {
      toast.error("Gagal menghapus");
    }
  };

  const startEdit = (h: Holiday) => {
    setEditingId(h.id);
    setEditDate(h.date);
    setEditName(h.name);
  };

  const handleUpdate = async (id: number) => {
    if (!editDate) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/holidays/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ holiday_date: editDate, description: editName })
      });
      if (res.ok) {
        toast.success("Hari libur diperbarui");
        setEditingId(null);
        fetchHolidays();
      }
    } catch (e) {
      toast.error("Gagal memperbarui");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevert = async (id: number) => {
    if (!confirm("Kembalikan nama hari libur ini ke default nasional?")) return;
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/holidays/${id}/revert`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        fetchHolidays();
      }
    } catch (e) {
      toast.error("Gagal revert");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("PERINGATAN: Ini akan menghapus SELURUH hari libur tanpa sisa (Nasional & Kustom). Lanjutkan?")) return;
    setIsSyncing(true);
    try {
      const res = await fetch('/api/holidays/all', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Semua hari libur dikosongkan");
        fetchHolidays();
      }
    } catch (e) {
      toast.error("Gagal mengosongkan data");
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Hari Libur</h1>
          <p className="text-slate-500 text-sm">Kelola tanggal merah dan hari libur khusus sekolah.</p>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === 'superadmin' && (
            <>
              <button 
                onClick={handleClearAll}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2 text-rose-600 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Hapus Semua
              </button>
              <button 
                onClick={handleResetDefaults}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <RotateCcw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
                {isSyncing ? 'Processing...' : 'Reset Ke Default'}
              </button>
              <button 
                onClick={handleSyncNationals}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
                Sinkronisasi Nasional
              </button>
            </>
          )}
        </div>
      </div>

      {user?.role === 'superadmin' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-600" />
            Tambah Hari Libur
          </h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Tanggal</label>
              <input 
                type="date" 
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700">Keterangan (Opsional)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Misal: Libur Idul Fitri"
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
                <button 
                  disabled={isSubmitting}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  Simpan
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full border-collapse text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-600">No</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-600">Tanggal</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-600">Keterangan</th>
              {user?.role === 'superadmin' && (
                <th className="px-6 py-4 text-xs font-bold text-slate-600 text-right">Aksi</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {holidays.length > 0 ? (
              holidays.map((h, idx) => (
                <tr key={`${h.type}-${h.id || h.date}`} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-500">{idx + 1}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">
                    {editingId === h.id ? (
                      <input 
                        type="date"
                        className="px-2 py-1 border rounded"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                      />
                    ) : (
                      <>
                        {new Date(h.date).toLocaleDateString('id-ID', { 
                          day: 'numeric', month: 'long', year: 'numeric' 
                        })}
                        {h.type === 'nasional' && (
                          <span className="ml-2 text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase">Nasional</span>
                        )}
                      </>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {editingId === h.id ? (
                      <input 
                        type="text"
                        className="w-full px-2 py-1 border rounded"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    ) : (
                      h.name || '-'
                    )}
                  </td>
                  {user?.role === 'superadmin' && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {editingId === h.id ? (
                          <>
                            <button 
                              onClick={() => handleUpdate(h.id)}
                              className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setEditingId(null)}
                              className="text-slate-400 hover:bg-slate-50 p-2 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            {h.type === 'nasional' && (
                              <button 
                                onClick={() => handleRevert(h.id)}
                                title="Kembalikan ke default"
                                className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                              >
                                <Undo2 className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              onClick={() => startEdit(h)}
                              className="text-amber-500 hover:bg-amber-50 p-2 rounded-lg transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(h.id)}
                              className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={user?.role === 'superadmin' ? 4 : 3} className="px-6 py-12 text-center text-slate-400">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>Belum ada hari libur terdaftar</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex gap-3 text-emerald-800">
        <Info className="w-5 h-5 shrink-0" />
        <div className="text-sm">
          <strong>Perhatian:</strong> Hari Sabtu dan Minggu tidak perlu didaftarkan di sini karena sudah otomatis diabaikan oleh sistem dalam perhitungan Alpha.
        </div>
      </div>
    </div>
  );
}
