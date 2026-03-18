import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Camera, Save, CheckCircle2 } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';

export default function SettingsPage() {
  const { cameraSource, setCameraSource } = useSettingsStore();
  const [localSource, setLocalSource] = useState(cameraSource);
  const [isSaved, setIsSaved] = useState(false);

  // Sync local state if store changes
  useEffect(() => {
    setLocalSource(cameraSource);
  }, [cameraSource]);

  const handleSave = () => {
    setCameraSource(localSource);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Pengaturan Sistem</h2>
        <p className="text-sm text-slate-500 mt-1">Konfigurasi perangkat dan preferensi aplikasi.</p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
            <Camera className="w-5 h-5 text-emerald-600" />
            Sumber Kamera (Webcam Input)
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1.5">
            Tentukan input kamera yang akan digunakan oleh backend (misal: Python OpenCV) untuk memindai wajah.
          </p>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              ID Kamera / URL Stream
            </label>
            <input
              type="text"
              value={localSource}
              onChange={(e) => setLocalSource(e.target.value)}
              placeholder="Contoh: 0, 1, atau http://192.168.1.100:8080/video"
              className="w-full h-10 px-3 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow text-slate-900"
            />
            <p className="text-xs text-slate-500 mt-1">
              Gunakan angka (0, 1, 2) untuk webcam USB/Internal. Gunakan URL (http://...) untuk IP Camera.
            </p>
          </div>

          <div className="pt-4 flex items-center gap-4">
            <Button onClick={handleSave} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Save className="w-4 h-4" />
              Simpan Konfigurasi
            </Button>
            {isSaved && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 animate-in fade-in slide-in-from-left-2">
                <CheckCircle2 className="w-4 h-4" />
                Tersimpan!
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
