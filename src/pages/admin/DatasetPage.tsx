import React, { useState } from 'react';
import { useAttendanceData } from '../../hooks/useAttendanceData';
import { useAttendanceStore } from '../../store/useAttendanceStore';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Plus, Trash2, Camera, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function DatasetPage() {
  const { data, isLoading } = useAttendanceData();
  const { addEmployee, deleteEmployee } = useAttendanceStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Form state
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'Guru' | 'Karyawan' | ''>('');

  const handleAddEmployee = () => {
    if (!newName || !newRole) return;
    addEmployee({
      name: newName,
      role: newRole as 'Guru' | 'Karyawan'
    });
    setNewName('');
    setNewRole('');
    setIsDrawerOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data pegawai ini?')) {
      deleteEmployee(id);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading data...</div>;
  }

  return (
    <div className="space-y-6 relative h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Master Data Pegawai</h2>
          <p className="text-sm text-slate-500 mt-1">Kelola data pegawai dan dataset wajah untuk presensi.</p>
        </div>
        <Button onClick={() => setIsDrawerOpen(true)} className="gap-2 shadow-md w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          Enroll Wajah Baru
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-600 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Pegawai</th>
                <th className="px-6 py-4 font-medium">ID Pegawai</th>
                <th className="px-6 py-4 font-medium">Kategori</th>
                <th className="px-6 py-4 font-medium text-center">Status Wajah</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((emp) => (
                <tr key={emp.id} className="bg-white hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img src={emp.photoUrl} alt={emp.name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div className="font-medium text-slate-900">{emp.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">{emp.id}</td>
                  <td className="px-6 py-4">
                    <Badge variant={emp.role === 'Guru' ? 'default' : 'secondary'}>
                      {emp.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant="success" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-transparent">
                      Terdaftar
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(emp.id)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Slide-out Drawer for Enrollment */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            />
            
            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900">Enroll Wajah Baru</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsDrawerOpen(false)} className="rounded-full">
                  <X className="w-5 h-5 text-slate-500" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Nama Lengkap</label>
                    <input 
                      type="text" 
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Masukkan nama lengkap" 
                      className="w-full h-10 px-3 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Jabatan / Kategori</label>
                    <select 
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="w-full h-10 px-3 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow bg-white appearance-none"
                    >
                      <option value="" disabled>Pilih kategori</option>
                      <option value="Guru">Guru</option>
                      <option value="Karyawan">Karyawan</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">ID Pegawai (Opsional)</label>
                    <input 
                      type="text" 
                      placeholder="Otomatis jika dikosongkan" 
                      className="w-full h-10 px-3 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow bg-slate-50"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <label className="text-sm font-medium text-slate-700 block mb-3">Pengambilan Data Wajah</label>
                  
                  <div className="relative w-full aspect-[3/4] bg-slate-900 rounded-xl overflow-hidden border-2 border-slate-200 shadow-inner group">
                    {/* Camera Placeholder */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                      <Camera className="w-12 h-12 mb-3 opacity-50 group-hover:scale-110 transition-transform duration-300" />
                      <p className="text-sm font-medium">Kamera Siap</p>
                      <p className="text-xs opacity-70 mt-1">Posisikan wajah di tengah</p>
                    </div>
                    
                    {/* Face Guide Overlay */}
                    <div className="absolute inset-0 border-[40px] border-slate-900/60 rounded-xl pointer-events-none">
                      <div className="w-full h-full border-2 border-dashed border-emerald-500/50 rounded-[100px]"></div>
                    </div>
                    
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                      <Button className="rounded-full shadow-lg bg-emerald-600 hover:bg-emerald-700 gap-2 px-6">
                        <Camera className="w-4 h-4" />
                        Ambil Foto
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-3 text-center">
                    Sistem akan mengambil 5 sampel foto secara otomatis untuk akurasi maksimal.
                  </p>
                </div>
              </div>
              
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>Batal</Button>
                <Button 
                  onClick={handleAddEmployee} 
                  disabled={!newName || !newRole}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                >
                  Simpan Data
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
