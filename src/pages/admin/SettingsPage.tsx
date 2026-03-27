import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Camera, Save, CheckCircle2, Tags, Plus, Trash2, Clock, Zap, ShieldCheck, Calendar, Volume2, Play, RotateCcw, Upload, MapPin, FileText } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Badge } from '../../components/ui/badge';

export default function SettingsPage() {
  const { 
    cameraSource, setCameraSource, 
    categories, addCategory, removeCategory,
    cooldownSeconds, minGapMinutes, programStartDate, alphaLimitTime, checkInOpenTime, presenceLimitTime, successSoundUrl, successSoundEnabled,
    exportLocation, exportSignatureEnabled, exportSignatureName, exportSignatureRole, googleApiKey, testMode,
    fetchBackendSettings, updateBackendSettings
  } = useSettingsStore();
  const { token } = useAuthStore();

  const [localSource, setLocalSource] = useState(cameraSource);
  const [localCooldown, setLocalCooldown] = useState(cooldownSeconds);
  const [localMinGap, setLocalMinGap] = useState(minGapMinutes);
  const [localProgramStartDate, setLocalProgramStartDate] = useState(programStartDate);
  const [localAlphaLimitTime, setLocalAlphaLimitTime] = useState(alphaLimitTime);
  const [localCheckInOpenTime, setLocalCheckInOpenTime] = useState(checkInOpenTime);
  const [localPresenceLimitTime, setLocalPresenceLimitTime] = useState(presenceLimitTime);
  const [localSuccessSoundUrl, setLocalSuccessSoundUrl] = useState(successSoundUrl);
  const [localSoundEnabled, setLocalSoundEnabled] = useState(successSoundEnabled);
  const [localExportLocation, setLocalExportLocation] = useState(exportLocation);
  const [localExportSignatureEnabled, setLocalExportSignatureEnabled] = useState(exportSignatureEnabled);
  const [localExportSignatureName, setLocalExportSignatureName] = useState(exportSignatureName);
  const [localExportSignatureRole, setLocalExportSignatureRole] = useState(exportSignatureRole);
  const [localGoogleApiKey, setLocalGoogleApiKey] = useState(googleApiKey);
  const [localTestMode, setLocalTestMode] = useState(testMode);

  
  const [isSaved, setIsSaved] = useState(false);
  const [isBackendSaved, setIsBackendSaved] = useState(false);
  const [newCat, setNewCat] = useState('');

  // Initial Fetch
  useEffect(() => {
    if (token) fetchBackendSettings(token);
  }, [token, fetchBackendSettings]);

  // Sync local state if store changes (from fetch)
  useEffect(() => {
    setLocalSource(cameraSource);
    setLocalCooldown(cooldownSeconds);
    setLocalMinGap(minGapMinutes);
    setLocalProgramStartDate(programStartDate);
    setLocalAlphaLimitTime(alphaLimitTime);
    setLocalCheckInOpenTime(checkInOpenTime);
    setLocalPresenceLimitTime(presenceLimitTime);
    setLocalSuccessSoundUrl(successSoundUrl);
    setLocalSoundEnabled(successSoundEnabled);
    setLocalExportLocation(exportLocation);
    setLocalExportSignatureEnabled(exportSignatureEnabled);
    setLocalExportSignatureName(exportSignatureName);
    setLocalExportSignatureRole(exportSignatureRole);
    setLocalGoogleApiKey(googleApiKey);
    setLocalTestMode(testMode);
  }, [cameraSource, cooldownSeconds, minGapMinutes, programStartDate, alphaLimitTime, presenceLimitTime, successSoundUrl, successSoundEnabled, exportLocation, exportSignatureEnabled, exportSignatureName, exportSignatureRole, googleApiKey, testMode]);

  const handleSaveLocal = () => {
    setCameraSource(localSource);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSaveBackend = async () => {
    if (!token) return;
    const success = await updateBackendSettings(token, {
      cooldown_seconds: localCooldown,
      min_gap_minutes: localMinGap,
      program_start_date: localProgramStartDate,
      alpha_limit_time: localAlphaLimitTime,
      check_in_open_time: localCheckInOpenTime,
      presence_limit_time: localPresenceLimitTime,
      success_sound_url: localSuccessSoundUrl,
      success_sound_enabled: localSoundEnabled,
      export_location: localExportLocation,
      export_signature_enabled: localExportSignatureEnabled,
      export_signature_name: localExportSignatureName,
      export_signature_role: localExportSignatureRole,
      google_api_key: localGoogleApiKey,
      test_mode: localTestMode ? 1 : 0
    });
    if (success) {
      setIsBackendSaved(true);
      setTimeout(() => setIsBackendSaved(false), 3000);
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/settings/sound', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (data.status === 'success') {
        setLocalSuccessSoundUrl(data.url);
      } else {
        alert("Gagal mengunggah suara.");
      }
    } catch(err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan.");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-10">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Pengaturan Sistem</h2>
        <p className="text-sm text-slate-500 mt-1">Konfigurasi perangkat dan preferensi aplikasi.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-slate-200 shadow-sm h-full">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
              <Tags className="w-5 h-5 text-emerald-600" />
              Kategori Pegawai
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex gap-2">
               <input 
                 type="text" 
                 value={newCat}
                 onChange={e => setNewCat(e.target.value)}
                 className="flex-1 h-10 px-3 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                 placeholder="Tambah..."
               />
               <Button onClick={() => { if(newCat.trim()) { addCategory(newCat.trim()); setNewCat(''); } }} className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
                  <Plus className="w-4 h-4" />
               </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <Badge key={c} variant="secondary" className="pl-3 pr-1 py-1 flex items-center gap-1 bg-slate-100 text-slate-700 border-transparent">
                  {c}
                  <button onClick={() => removeCategory(c)} className="text-slate-400 hover:text-red-500 p-1">
                     <Trash2 className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-emerald-50/30 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
            <Zap className="w-5 h-5 text-emerald-600" />
            Konfigurasi Presensi Pintar (Smart Logic)
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">Penyetelan durasi dan logika otomatis untuk mencegah deteksi palsu.</p>
          <div className="flex items-center gap-3 mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
             <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-amber-600" />
             </div>
             <div className="flex-1">
                <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">Mode Pengujian (Global)</p>
                <p className="text-[10px] text-amber-700">Aktifkan untuk melihat data debug (confidence, cooldown) di Kiosk.</p>
             </div>
             <button 
               onClick={() => setLocalTestMode(!localTestMode)}
               className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${localTestMode ? 'bg-amber-500' : 'bg-slate-200'}`}
             >
               <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localTestMode ? 'translate-x-6' : 'translate-x-1'}`} />
             </button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                 <Clock className="w-4 h-4 text-emerald-600" /> Cooldown (Detik)
              </label>
              <input
                type="number"
                value={localCooldown}
                onChange={(e) => setLocalCooldown(parseInt(e.target.value) || 0)}
                className="w-full h-10 px-3 rounded-md border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />
              <p className="text-[10px] text-slate-500 italic">Jeda antar deteksi yg sama.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                 <ShieldCheck className="w-4 h-4 text-emerald-600" /> Jeda Plg. Min (Menit)
              </label>
              <input
                type="number"
                value={localMinGap}
                onChange={(e) => setLocalMinGap(parseInt(e.target.value) || 0)}
                className="w-full h-10 px-3 rounded-md border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />
              <p className="text-[10px] text-slate-500 italic">Menit min sebelum bisa Pulang.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                 <Calendar className="w-4 h-4 text-emerald-600" /> Mulai Program
              </label>
              <input
                type="date"
                value={localProgramStartDate}
                onChange={(e) => setLocalProgramStartDate(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />
              <p className="text-[10px] text-slate-500 italic">Alpha tak dihitung sblm ini.</p>
            </div>

             <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                 <Clock className="w-4 h-4 text-emerald-600" /> Jam Buka Presensi
              </label>
              <input
                type="time"
                value={localCheckInOpenTime}
                onChange={(e) => setLocalCheckInOpenTime(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />
              <p className="text-[10px] text-slate-500 italic">Sebelum jam ini = Belum waktunya presensi.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                 <Clock className="w-4 h-4 text-rose-600" /> Jam Tutup / Pulang
              </label>
              <input
                type="time"
                value={localPresenceLimitTime}
                onChange={(e) => setLocalPresenceLimitTime(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-slate-300 focus:ring-2 focus:ring-rose-500 text-slate-900"
              />
              <p className="text-[10px] text-slate-500 italic">Lewat jam ini = bisa Check-out / Alpha.</p>
            </div>
            
            <div className="space-y-2 col-span-full md:col-span-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                 <ShieldCheck className="w-4 h-4 text-emerald-600" /> Gemini API Key (Global)
              </label>
              <input
                type="password"
                value={localGoogleApiKey}
                onChange={(e) => setLocalGoogleApiKey(e.target.value)}
                placeholder="AIzaSyA..."
                className="w-full h-10 px-3 rounded-md border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-slate-900 font-mono"
              />
              <p className="text-[10px] text-slate-500 italic">Kunci ini bersifat global untuk seluruh fitur AI. Kosongkan jika ingin menggunakan .env.</p>
            </div>
          </div>

          <div className="pt-8 flex items-center gap-4 border-t border-slate-100 mt-6">
            <Button onClick={handleSaveBackend} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              <Save className="w-4 h-4" />
              Simpan Pengaturan Presensi
            </Button>
            {isBackendSaved && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 animate-in fade-in slide-in-from-left-2">
                <CheckCircle2 className="w-4 h-4" />
                Diterapkan ke Server!
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm mt-6">
        <CardHeader className="border-b border-slate-100 bg-emerald-50/30 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
            <Volume2 className="w-5 h-5 text-emerald-600" />
            Feedback Suara (Audio)
          </CardTitle>
          <div className="flex items-center gap-3">
             <span className={`text-xs font-bold uppercase tracking-wider ${localSoundEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                {localSoundEnabled ? 'Suara Aktif' : 'Suara Nonaktif'}
             </span>
             <button 
               onClick={() => setLocalSoundEnabled(!localSoundEnabled)}
               className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${localSoundEnabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
             >
               <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localSoundEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
             </button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-4">
               <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                 <Upload className="w-4 h-4 text-emerald-600" /> Ganti Suara Sukses (.mp3)
               </label>
               <div className="flex items-center gap-4">
                 <input 
                   type="file" 
                   accept="audio/mpeg"
                   onChange={handleAudioUpload}
                   className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                 />
               </div>
               <p className="text-[10px] text-slate-400 italic">File akan diunggah ke server dan digunakan sebagai notifikasi sukses.</p>
             </div>
             
             <div className="space-y-4">
               <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                 <Play className="w-4 h-4 text-emerald-600" /> Cek Suara Saat Ini
               </label>
               <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                 <Button 
                   variant="outline" 
                   size="sm"
                   onClick={() => {
                     const audio = new Audio(localSuccessSoundUrl);
                     audio.play();
                   }}
                   className="gap-2 bg-white"
                 >
                   <Play className="w-4 h-4" /> Tes Play
                 </Button>
                 <div className="text-[10px] font-mono text-slate-500 truncate flex-1">
                   {localSuccessSoundUrl.split('/').pop()}
                 </div>
                 <Button 
                   variant="ghost" 
                   size="sm"
                   onClick={() => setLocalSuccessSoundUrl('/api/sounds/applepay.mp3')}
                   className="text-slate-400 hover:text-orange-600"
                   title="Reset ke Default"
                 >
                   <RotateCcw className="w-3 h-3" />
                 </Button>
               </div>
             </div>
          </div>
          
          <div className="pt-6 flex items-center gap-4 border-t border-slate-100 mt-6">
            <Button onClick={handleSaveBackend} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              <Save className="w-4 h-4" />
              Simpan Pengaturan Suara
            </Button>
            {isBackendSaved && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                Tersimpan!
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm mt-6">
        <CardHeader className="border-b border-slate-100 bg-emerald-50/30 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
            <FileText className="w-5 h-5 text-emerald-600" />
            Pengaturan Laporan & Tanda Tangan (Excel)
          </CardTitle>
          <div className="flex items-center gap-3">
             <span className={`text-xs font-bold uppercase tracking-wider ${localExportSignatureEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                {localExportSignatureEnabled ? 'Tanda Tangan Aktif' : 'Tanda Tangan Nonaktif'}
             </span>
             <button 
               onClick={() => setLocalExportSignatureEnabled(!localExportSignatureEnabled)}
               className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${localExportSignatureEnabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
             >
               <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localExportSignatureEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
             </button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-sm text-slate-500 mb-6 font-medium">Kustomisasi informasi lokasi dan otorisasi pada dokumen laporan hasil ekspor.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="space-y-2">
               <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                 <MapPin className="w-4 h-4 text-emerald-600" /> Lokasi (Kota)
               </label>
               <input 
                 type="text" 
                 value={localExportLocation} 
                 onChange={(e) => setLocalExportLocation(e.target.value)}
                 className="w-full h-10 px-3 rounded-md border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-slate-900"
                 placeholder="Contoh: Grobogan"
               />
             </div>
             <div className="space-y-2">
               <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                 <ShieldCheck className="w-4 h-4 text-emerald-600" /> Jabatan/Role
               </label>
               <input 
                 type="text" 
                 value={localExportSignatureRole} 
                 onChange={(e) => setLocalExportSignatureRole(e.target.value)}
                 className="w-full h-10 px-3 rounded-md border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-slate-900" 
                 placeholder="Contoh: Mengetahui, atau Kepala Sekolah"
               />
             </div>
             <div className="space-y-2">
               <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Nama Penandatangan
               </label>
               <input 
                 type="text" 
                 value={localExportSignatureName} 
                 onChange={(e) => setLocalExportSignatureName(e.target.value)}
                 className="w-full h-10 px-3 rounded-md border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium" 
                 placeholder="Contoh: ( ..................... )"
               />
             </div>
          </div>
          
          <div className="pt-6 flex items-center gap-4 border-t border-slate-100 mt-6">
            <Button onClick={handleSaveBackend} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              <Save className="w-4 h-4" />
              Simpan Pengaturan Laporan
            </Button>
            {isBackendSaved && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
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
