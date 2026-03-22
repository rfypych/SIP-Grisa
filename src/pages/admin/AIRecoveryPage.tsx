import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Trash2, 
  Save,
  FileText,
  Calendar,
  Clock,
  User,
  ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'sonner';

interface AIResult {
  name: string;
  date: string;
  status: 'hadir' | 'sakit' | 'izin' | 'alfa' | 'dinas';
  time: string | null;
}

const AIRecoveryPage = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<AIResult[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  const { token } = useAuthStore();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file terlalu besar (Maksimal 5MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processWithAI = async () => {
    if (!image) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/ai/process_attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ image })
      });

      if (response.status === 401) {
        toast.error('Sesi berakhir. Silakan masuk kembali.');
        return;
      }

      const result = await response.json();
      if (result.status === 'success') {
        setResults(result.data);
        toast.success(`Berhasil mendeteksi ${result.data.length} data absensi!`);
      } else {
        toast.error(result.message || 'Gagal memproses gambar');
      }
    } catch (error) {
      toast.error('Gagal menghubungi Asisten Digital');
    } finally {
      setIsProcessing(false);
    }
  };

  const commitToDB = async () => {
    if (results.length === 0) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/ai/commit_attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items: results })
      });

      const result = await response.json();
      if (result.status === 'success') {
        toast.success('Data berhasil disimpan ke buku absensi pusat');
        setResults([]);
        setImage(null);
      } else {
        toast.error('Beberapa data gagal disimpan');
      }
    } catch (error) {
      toast.error('Gagal menyimpan data ke sistem');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Emerald Theme */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden relative">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 rounded-xl ring-1 ring-emerald-100">
                <Sparkles className="w-6 h-6 text-emerald-600" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pendeteksi Absen</h1>
            </div>
            <p className="text-slate-500 font-medium max-w-lg">
              Solusi cerdas untuk mencatat daftar hadir manual ke dalam sistem secara otomatis.
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
            <div className="p-3 bg-white rounded-xl shadow-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Akses</p>
                <p className="text-sm font-black text-slate-900">Admin Terverifikasi</p>
            </div>
          </div>
        </div>
        
        {/* Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Upload & Action (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm transition-all"
          >
            {!image ? (
              <label className="cursor-pointer block group">
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                />
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 transition-all group-hover:border-emerald-500 group-hover:bg-emerald-50/30 flex flex-col items-center gap-4 text-center">
                  <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-white shadow-sm transition-all group-hover:scale-110">
                    <Upload className="w-8 h-8 text-slate-400 group-hover:text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-slate-900 font-bold mb-1">Unggah Foto Absensi</p>
                    <p className="text-xs text-slate-500">Klik untuk memilih foto dari perangkat</p>
                  </div>
                </div>
              </label>
            ) : (
              <div className="space-y-4">
                <div className="relative group">
                  <img 
                    src={image} 
                    alt="Pratinjau" 
                    className="w-full h-auto rounded-2xl border border-slate-200 shadow-inner max-h-[350px] object-contain bg-slate-50"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center backdrop-blur-[2px]">
                    <button 
                      onClick={() => { setImage(null); setResults([]); }}
                      className="p-3 bg-white hover:bg-rose-50 rounded-full text-rose-600 shadow-xl scale-90 group-hover:scale-100 transition-all font-bold flex items-center gap-2"
                    >
                      <Trash2 className="w-5 h-5" /> Ganti Foto
                    </button>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={processWithAI}
                  disabled={isProcessing}
                  className={`w-full py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-lg text-sm tracking-widest uppercase ${
                    isProcessing 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                    : 'bg-slate-900 text-white hover:bg-emerald-700 shadow-emerald-500/10'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Membaca Data...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Mulai Deteksi Otomatis
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </motion.div>

          {/* Tips Card */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                    <h4 className="text-sm font-bold text-emerald-900 mb-1">Panduan Foto</h4>
                    <p className="text-xs text-emerald-700/80 leading-relaxed">Pastikan tulisan di kertas terbaca jelas dan tidak tertutup bayangan agar hasil maksimal.</p>
                </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex gap-4">
                <AlertCircle className="w-6 h-6 text-slate-400 shrink-0" />
                <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">Penting</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Selalu tinjau tabel hasil di samping sebelum menyimpan data secara permanen ke sistem.</p>
                </div>
            </div>
          </div>
        </div>

        {/* Right Side: Results (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col h-full">
          <AnimatePresence mode="wait">
            {results.length > 0 ? (
              <motion.div 
                key="results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col h-full ring-1 ring-slate-100"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-900 rounded-lg">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900">Hasil Pembacaan</h2>
                      <p className="text-xs text-slate-500">Data yang berhasil dikenali otomastis</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full border border-emerald-100">
                    {results.length} DATA DITEMUKAN
                  </div>
                </div>
                
                <div className="overflow-y-auto max-h-[500px] bg-white">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-4 border-b border-slate-100">Nama Personel</th>
                        <th className="px-6 py-4 border-b border-slate-100">Waktu Absen</th>
                        <th className="px-6 py-4 border-b border-slate-100 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {results.map((res, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                                <User className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-bold text-slate-700">{res.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                <Calendar className="w-3 h-3 text-slate-300" /> {res.date}
                              </div>
                              {res.time && (
                                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                                  <Clock className="w-3 h-3 text-emerald-400" /> {res.time}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              res.status === 'hadir' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                              res.status === 'alfa' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                              'bg-amber-100 text-amber-700 border border-amber-200'
                            }`}>
                              {res.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-200">
                  <button
                    onClick={commitToDB}
                    disabled={isSaving}
                    className="w-full py-4 bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-300 font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20 uppercase tracking-widest text-sm"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sinkronisasi Sistem...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Simpan Semua Data
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[450px] bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-12 transition-colors hover:border-slate-300"
              >
                <div className="p-6 bg-slate-50 rounded-3xl mb-6 ring-1 ring-slate-100">
                  <Sparkles className="w-12 h-12 text-slate-200" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Belum Ada Data</h3>
                <p className="max-w-[240px] text-sm text-slate-500 leading-relaxed font-medium">
                  Gunakan Asisten Digital untuk mempercepat input data absensi dari foto manual.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AIRecoveryPage;
