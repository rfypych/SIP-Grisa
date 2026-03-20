import React, { useState, useRef, useCallback } from 'react';
import { useAttendanceData } from '../../hooks/useAttendanceData';
import { useAttendanceStore } from '../../store/useAttendanceStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Plus, Trash2, Camera, X, Search, Upload, Monitor, Smartphone, Zap, BadgeCheck, AlertCircle, CalendarDays, ClipboardCheck, Plane } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Webcam from 'react-webcam';
import { toast } from 'sonner';
import { Skeleton } from '../../components/ui/skeleton';
import { useSettingsStore } from '../../store/useSettingsStore';
import { cn } from '../../lib/utils';

// Versi React 19 seringkali butuh shim sederhana untuk legacy ref jika library belum update
// Tapi react-image-crop versi terbaru biasanya aman.

export default function DatasetPage() {
  const { data, isLoading } = useAttendanceData();
  const { initialize } = useAttendanceStore();
  const { token } = useAuthStore();
  const { categories } = useSettingsStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'Guru' | 'Karyawan' | ''>('');
  const [newId, setNewId] = useState('');
  
  // Camera & Image state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, name: string} | null>(null);

  // Manual Attendance State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [itemForAttendance, setItemForAttendance] = useState<{id: string, name: string} | null>(null);
  const [manualStatus, setManualStatus] = useState<'hadir' | 'sakit' | 'izin' | 'dinas' | 'alfa' | ''>('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);

  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const capture = useCallback(() => {
    if (webcamRef.current && webcamRef.current.video) {
        const video = webcamRef.current.video;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Dimensi asli video stream
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        
        // Target 16:9 (sesuai box aspect-video di UI)
        const targetAspect = 16/9;
        const currentAspect = vw / vh;

        let sx = 0, sy = 0, sw = vw, sh = vh;

        // Logika matematis CENTER CROP untuk menyamai kelakuan CSS 'object-cover'
        if (currentAspect > targetAspect) {
            // Video lebih lebar dari kontainer (misal: 21:9 vs 16:9) -> Potong samping
            sw = vh * targetAspect;
            sx = (vw - sw) / 2;
        } else {
            // Video lebih tinggi dari kontainer (misal: 4:3 vs 16:9) -> Potong atas-bawah
            sh = vw / targetAspect;
            sy = (vh - sh) / 2;
        }

        // Set ukuran canvas tepat 16:9 berdasarkan porsi yang terlihat di UI
        canvas.width = sw;
        canvas.height = sh;

        // Mirroring hasil (baked-in mirror agar sesuai preview visual user)
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        
        // Render porsi video yang tepat ke canvas
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);

        const imageSrcBase64 = canvas.toDataURL('image/jpeg', 0.95);
        setImageSrc(imageSrcBase64);
        setIsCameraActive(false);
    }
  }, [webcamRef]);

  const handleAutoCrop = async () => {
    if (!imageSrc || !token) return;
    setIsDetecting(true);
    try {
        const response = await fetch('/api/detect_crop', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ image: imageSrc })
        });
        
        const data = await response.json();
        if (response.ok && data.image) {
            setImageSrc(data.image);
            toast.success("Wajah berhasil dideteksi dan dipotong!");
        } else {
            toast.error(data.detail || "Gagal mendeteksi wajah.");
        }
    } catch (error) {
        console.error(error);
        toast.error("Terjadi kesalahan koneksi.");
    } finally {
        setIsDetecting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      setFilesToUpload(files);
      
      // Preview foto pertama saja
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
      };
      reader.readAsDataURL(files[0]);
      
      if (files.length > 1) {
        toast.info(`${files.length} foto dipilih untuk akurasi ganda.`);
      }
    }
  };

  const handleAddEmployee = async () => {
    if (!newName || !newRole || (!imageSrc && filesToUpload.length === 0)) return;
    setIsSubmitting(true);
    
    // Generate ID dummy kalau kosong
    const employeeId = newId || `EMP-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    try {
        const formData = new FormData();
        formData.append("id", employeeId);
        formData.append("name", newName);
        formData.append("role", newRole);
        formData.append("photoUrl", `/api/images/${employeeId}.jpg`);
        
        // Handle Multiple Files
        if (imageSrc && filesToUpload.length === 0) {
            // Jika ambil dari kamera (Base64)
            const byteString = atob(imageSrc.split(',')[1]);
            const mimeString = imageSrc.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: mimeString });
            formData.append("files", blob, `${employeeId}.jpg`);
        } else {
            // Jika upload file (berpotensi multiple)
            filesToUpload.forEach(file => {
                formData.append("files", file);
            });
        }

        const res = await fetch("/api/enroll", {
            method: "POST",
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        if (res.ok) {
            const result = await res.json();
            toast.success(result.message);
            setIsDrawerOpen(false);
            setNewName(''); setNewRole(''); setNewId(''); setImageSrc(null); setFilesToUpload([]);
            
            // Reload tabel dari backend
            const t = new Date();
            initialize(t.getMonth() + 1, t.getFullYear());
        } else {
            const err = await res.json();
            toast.error("Gagal: " + (err.detail || "Tidak dapat mendeteksi wajah di foto."));
        }
    } catch (e) {
        console.error(e);
        toast.error("Terjadi kesalahan jaringan.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setItemToDelete({ id, name });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
        const res = await fetch(`/api/employees/${itemToDelete.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
            toast.success(`Pegawai ${itemToDelete.name} berhasil dihapus.`);
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
            // Refresh data
            const t = new Date();
            initialize(t.getMonth() + 1, t.getFullYear());
        } else {
            const err = await res.json();
            toast.error("Gagal menghapus: " + (err.detail || "Terjadi kesalahan."));
        }
    } catch (e) {
        console.error(e);
        toast.error("Terjadi kesalahan jaringan.");
    } finally {
        setIsDeleting(false);
    }
  };

  const handleManualAttendance = (id: string, name: string) => {
    setItemForAttendance({ id, name });
    setManualStatus('');
    setManualDate(new Date().toISOString().split('T')[0]);
    setIsManualModalOpen(true);
  };

  const confirmManualAttendance = async () => {
    if (!itemForAttendance || !manualStatus || !manualDate) return;
    setIsSubmitting(true);
    try {
        const res = await fetch('/api/attendance/manual', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                employee_id: itemForAttendance.id,
                date: manualDate,
                status: manualStatus
            })
        });
        
        if (res.ok) {
            toast.success(`Berhasil mencatat ${itemForAttendance.name} sebagai ${manualStatus.toUpperCase()}.`);
            setIsManualModalOpen(false);
            // Refresh dashboard stats if needed
            const t = new Date();
            initialize(t.getMonth() + 1, t.getFullYear());
        } else {
            const err = await res.json();
            toast.error("Gagal mencatat: " + (err.detail || "Terjadi kesalahan."));
        }
    } catch (e) {
        console.error(e);
        toast.error("Terjadi kesalahan jaringan.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const clearManualStatus = async () => {
    if (!itemForAttendance || !manualDate) return;
    setIsSubmitting(true);
    try {
        const res = await fetch(`/api/attendance?employee_id=${itemForAttendance.id}&date=${manualDate}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
            toast.success(`Berhasil mencopot status presensi ${itemForAttendance.name}.`);
            setIsManualModalOpen(false);
            const t = new Date();
            initialize(t.getMonth() + 1, t.getFullYear());
        } else {
            const err = await res.json();
            toast.error("Gagal mencopot status: " + (err.detail || "Terjadi kesalahan."));
        }
    } catch (e) {
        console.error(e);
        toast.error("Terjadi kesalahan jaringan.");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 relative h-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div><Skeleton className="h-8 w-64 mb-2" /><Skeleton className="h-4 w-96" /></div>
          <div className="flex w-full sm:w-auto items-center gap-3">
            <Skeleton className="h-10 w-full sm:w-64" /><Skeleton className="h-10 w-32 shrink-0" />
          </div>
        </div>
        <Card className="border-slate-200 shadow-sm overflow-hidden p-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full bg-slate-100" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-6 w-24 shrink-0" />
                <Skeleton className="h-6 w-20 shrink-0 ml-auto" />
                <Skeleton className="h-8 w-8 rounded-md shrink-0" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Master Data Pegawai</h2>
          <p className="text-sm text-slate-500 mt-1">Kelola data pegawai dan dataset wajah untuk presensi.</p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nama atau ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <Button onClick={() => setIsDrawerOpen(true)} className="gap-2 shadow-md shrink-0">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Enroll Baru</span>
          </Button>
        </div>
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
              {data.filter(emp => emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || emp.id.toLowerCase().includes(searchQuery.toLowerCase())).map((emp) => (
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
                      onClick={() => handleManualAttendance(emp.id, emp.name)}
                      className="text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 mr-1"
                      title="Input Kehadiran Manual"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(emp.id, emp.name)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50"
                      title="Hapus Pegawai"
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

      {/* Enrollment Modal */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900/90 backdrop-blur-md"
            />
            
            {/* Modal Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl h-full sm:h-auto max-h-[100dvh] sm:max-h-[85vh] bg-white sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">Enrollment Pegawai</h3>
                  <p className="text-xs sm:text-sm text-slate-500">Lengkapi data presensi wajah</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsDrawerOpen(false)} className="rounded-full h-8 w-8">
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                {/* Section 1: Data Diri */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">1</div>
                    <h4 className="font-bold text-sm sm:text-base text-slate-800 uppercase tracking-wide">Informasi Dasar</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nama Lengkap</label>
                      <input 
                        type="text" 
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Masukkan nama" 
                        className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-slate-50/50 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Kategori</label>
                      <select 
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as any)}
                        className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 appearance-none text-sm"
                      >
                        <option value="" disabled>Pilih kategori</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Foto/Kamera */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">2</div>
                      <h4 className="font-bold text-sm sm:text-base text-slate-800 uppercase tracking-wide">Data Visual (Wajah)</h4>
                    </div>
                  </div>

                  <div className="relative aspect-video w-full bg-slate-900 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-200 group">
                    {imageSrc ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black">
                         <img src={imageSrc} alt="Preview" className="w-full h-full object-cover" />
                         
                         {/* AI Auto-Crop Overlay Button */}
                         <div className="absolute bottom-3 right-3">
                            <Button 
                                size="sm" 
                                onClick={handleAutoCrop}
                                disabled={isDetecting}
                                className="bg-emerald-600/80 hover:bg-emerald-600 backdrop-blur-md text-white border-white/20 shadow-xl h-9 px-3 text-[10px] font-bold uppercase tracking-wider"
                            >
                                <Zap className={cn("w-3.5 h-3.5 mr-1.5", isDetecting && "animate-spin")} />
                                {isDetecting ? 'Memproses...' : 'AI Auto-Crop'}
                            </Button>
                         </div>

                         <div className="absolute top-3 left-3 px-3 py-1 bg-emerald-500/90 backdrop-blur-md rounded-lg text-[10px] font-bold text-white flex items-center gap-1.5 shadow-lg border border-white/20 uppercase tracking-wider">
                            <BadgeCheck className="w-3 h-3" /> Siap Daftar
                         </div>
                      </div>
                    ) : isCameraActive ? (
                      <div className="relative w-full h-full">
                        <Webcam
                          audio={false}
                          ref={webcamRef}
                          screenshotFormat="image/jpeg"
                          videoConstraints={{ facingMode: "user", aspectRatio: 16/9 }}
                          className="w-full h-full object-cover scale-x-[-1]"
                          mirrored={false} // Mirroring ditangani oleh scale-x-[-1] CSS untuk kontrol layout lebih baik
                          disablePictureInPicture={true}
                          forceScreenshotSourceSize={false}
                          imageSmoothing={true}
                          onUserMedia={() => {}}
                          onUserMediaError={() => {}}
                          screenshotQuality={0.9}
                        />
                        
                        {/* Smart Face Guide Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-[160px] h-[220px] sm:w-[200px] sm:h-[280px] border-2 border-dashed border-emerald-400/50 rounded-[100px] relative shadow-[0_0_0_9999px_rgba(15,23,42,0.6)]">
                                <div className="absolute inset-0 border-2 border-emerald-400 rounded-[100px] animate-pulse opacity-50"></div>
                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[9px] sm:text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap shadow-lg uppercase tracking-tight">
                                    Posisikan Wajah Di Sini
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-4 left-0 right-0 px-4 text-center pointer-events-none">
                            <p className="inline-block bg-slate-900/80 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-lg border border-slate-700 font-medium">
                                AI akan otomatis mendeteksi & memotong wajah
                            </p>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-50">
                        <Camera className="w-10 h-10 mb-2 opacity-10" />
                        <p className="text-xs font-medium opacity-40">Kamera Nonaktif</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 sm:gap-3 mt-3">
                    {isCameraActive ? (
                      <Button onClick={capture} className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold shadow-lg shadow-emerald-600/20 text-sm">
                        Ambil Foto
                      </Button>
                    ) : imageSrc ? (
                      <Button 
                        variant="outline" 
                        onClick={() => { setImageSrc(null); setFilesToUpload([]); }} 
                        className="flex-1 h-11 rounded-xl border-slate-200 font-bold text-sm"
                      >
                        Ulangi / Ganti Foto
                      </Button>
                    ) : (
                      <div className="flex w-full gap-2">
                        <Button 
                          onClick={() => setIsCameraActive(true)} 
                          className="flex-[4] h-11 bg-slate-900 hover:bg-slate-800 rounded-xl font-bold shadow-xl text-sm"
                        >
                          <Camera className="w-4 h-4 mr-2" /> Aktifkan Kamera
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => fileInputRef.current?.click()} 
                          className="flex-1 h-11 rounded-xl border-slate-200 hover:bg-slate-50 transition-colors"
                          title="Upload Foto dari Device"
                        >
                          <Upload className="w-5 h-5 text-slate-400" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0">
                <Button variant="ghost" onClick={() => setIsDrawerOpen(false)} className="w-full sm:w-auto px-6 h-10 font-bold text-slate-500 text-sm">Batal</Button>
                <Button 
                  onClick={handleAddEmployee} 
                  disabled={!newName || !newRole || (!imageSrc && filesToUpload.length === 0) || isSubmitting}
                  className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 h-10 sm:h-12 rounded-xl sm:rounded-2xl font-bold shadow-lg shadow-emerald-600/20 text-sm sm:text-base"
                >
                  {isSubmitting ? 'Mendaftarkan...' : 'Konfirmasi & Simpan'}
                </Button>
              </div>

              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Hapus Pegawai?</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Anda akan menghapus data <span className="font-bold text-slate-900">{itemToDelete?.name}</span> secara permanen. Tindakan ini tidak dapat dibatalkan.
                </p>
                
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-red-200"
                  >
                    {isDeleting ? "Menghapus..." : "Ya, Hapus Sekarang"}
                  </Button>
                  <Button 
                    variant="ghost" 
                    disabled={isDeleting}
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="w-full h-11 font-bold text-slate-500 rounded-xl"
                  >
                    Batal
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Attendance Modal */}
      <AnimatePresence>
        {isManualModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setIsManualModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between bg-emerald-50/30">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                      <CalendarDays className="w-6 h-6" />
                   </div>
                   <div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">Presensi Manual</h3>
                      <p className="text-xs text-slate-500 font-medium">{itemForAttendance?.name}</p>
                   </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsManualModalOpen(false)} className="rounded-full h-8 w-8">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-widest">Pilih Tanggal</label>
                  <input 
                    type="date" 
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-slate-50/50 font-medium text-slate-700"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-widest">Status Kehadiran</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'hadir', label: 'Hadir', icon: BadgeCheck, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                      { id: 'sakit', label: 'Sakit', icon: AlertCircle, color: 'text-purple-600 bg-purple-50 border-purple-100' },
                      { id: 'izin', label: 'Izin', icon: CalendarDays, color: 'text-blue-600 bg-blue-50 border-blue-100' },
                      { id: 'dinas', label: 'Dinas', icon: Plane, color: 'text-amber-600 bg-amber-50 border-amber-100' },
                      { id: 'alfa', label: 'Alfa', icon: X, color: 'text-rose-600 bg-rose-50 border-rose-100' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setManualStatus(s.id as any)}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${
                            manualStatus === s.id 
                            ? `${s.color} border-current ring-2 ring-offset-2 ring-slate-100 bg-white shadow-md` 
                            : 'border-slate-50 bg-slate-50/50 hover:bg-white hover:border-slate-200'
                        }`}
                      >
                         <s.icon className={`w-6 h-6 ${manualStatus === s.id ? s.color.split(' ')[0] : 'text-slate-400'}`} />
                         <span className="text-[10px] font-extrabold uppercase tracking-tighter">{s.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2">
                    <Button 
                      variant="ghost" 
                      onClick={clearManualStatus}
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 p-3 h-auto rounded-xl bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 border border-transparent transition-all font-bold text-xs"
                    >
                      <Trash2 className="w-4 h-4" />
                      Copot Status (Hapus Record)
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex gap-3">
                <Button variant="ghost" onClick={() => setIsManualModalOpen(false)} className="flex-1 h-12 font-bold text-slate-500">Batal</Button>
                <Button 
                   onClick={confirmManualAttendance}
                   disabled={!manualStatus || !manualDate || isSubmitting}
                   className="flex-[2] bg-emerald-600 hover:bg-emerald-700 h-12 rounded-2xl font-bold shadow-lg shadow-emerald-200"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Presensi'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
