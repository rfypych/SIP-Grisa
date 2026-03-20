import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScanFace, CheckCircle2, Clock, Calendar, Settings, Camera, Save, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import Webcam from 'react-webcam';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';

export default function KioskPage() {
  const { 
    cameraSource, 
    setCameraSource, 
    successSoundUrl, 
    successSoundEnabled,
    cooldownSeconds,
    fetchBackendSettings 
  } = useSettingsStore();
  const { token } = useAuthStore();
  const [time, setTime] = useState(new Date());
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'already-done'>('idle');
  const [scannedName, setScannedName] = useState('');
  const [showLocalSettings, setShowLocalSettings] = useState(false);
  const [kioskName, setKioskName] = useState(() => localStorage.getItem('sip-grisa-kiosk-name') || 'Gerbang Utama');
  const [tempCamera, setTempCamera] = useState(cameraSource);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  
  const webcamRef = useRef<Webcam>(null);
  const ws = useRef<WebSocket | null>(null);


  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    // Antolasi list kamera
    navigator.mediaDevices.enumerateDevices().then(devices => {
        const videoDevices = devices.filter(i => i.kind === 'videoinput');
        setDevices(videoDevices);
    });

    // Fetch backend settings to get cooldownSeconds
    if (token) {
        fetchBackendSettings(token);
    }

    return () => clearInterval(timer);
  }, [token, fetchBackendSettings]);

  const saveLocalConfig = () => {
    setCameraSource(tempCamera);
    localStorage.setItem('sip-grisa-kiosk-name', kioskName);
    setShowLocalSettings(false);
    window.location.reload(); // Refresh to apply cam & websocket changes if needed
  };

  // WebSocket Connection & Frame Capture (Optimized Request-Response)
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/kiosk`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      if (token) {
        ws.current?.send(JSON.stringify({
          type: 'auth',
          token: token
        }));
      }
    };

    let isProcessing = false;

    const captureAndSend = () => {
      if (ws.current?.readyState === WebSocket.OPEN && webcamRef.current && !isProcessing) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          isProcessing = true;
          ws.current.send(JSON.stringify({
            type: 'frame',
            image: imageSrc
          }));
        }
      }
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      isProcessing = false;

      if (data.event === 'success') {
        setScannedName(data.name);
        setScanStatus('success');
        
        // Putar suara berhasil (jika diaktifkan secara global)
        if (successSoundEnabled) {
          const soundUrl = successSoundUrl || '/api/sounds/applepay.mp3';
          const audio = new Audio(soundUrl);
          audio.play().catch(e => console.error("Auto-play prevented:", e));
        }

        // Durasi tampilan sukses: gunakan durasi tetap singkat (3 detik) agar kios siap untuk orang berikutnya.
        // Cooldown tetap berjalan di backend untuk mencegah dobel absen orang yg sama.
        const displayDuration = 3000; 
        
        setTimeout(() => {
          setScanStatus('scanning');
        }, displayDuration);
      } else if (data.event === 'already_done') {
        setScannedName(data.name);
        setScanStatus('already-done');
        
        setTimeout(() => {
          setScanStatus('scanning');
        }, 3000);
      } else if (data.event === 'searching' || data.event === 'on_cooldown') {
        // Hanya set scanning jika tidak sedang menampilkan modal sukses
        setScanStatus(prev => (prev === 'success' || prev === 'already-done') ? prev : 'scanning');
      }
    };

    const sendLoop = setInterval(captureAndSend, 1000);

    return () => {
      clearInterval(sendLoop);
      ws.current?.close();
    };
  }, []);

  const formattedTime = time.toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  const formattedDate = time.toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#f8fafc] flex flex-col font-sans">
      {/* Soft Background Accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100/50 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50/50 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />
      
      {/* Fixed Layout Container */}
      <div className="relative z-10 flex-1 flex flex-col p-8 md:p-12">
        
        {/* Header - Clean & Minimal like Dashboard */}
        <header className="flex justify-between items-center mb-12">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
               <ScanFace className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">SIP Grisa</h1>
              <p className="text-[10px] text-emerald-600 font-black tracking-widest uppercase">{kioskName}</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-12"
          >
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-slate-600" />
               </div>
               <div>
                  <div className="text-2xl font-bold text-slate-900 tabular-nums leading-none">
                    {formattedTime}
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Waktu Sekarang</p>
               </div>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-slate-600" />
               </div>
               <div>
                  <div className="text-sm font-bold text-slate-700 leading-none">
                    {formattedDate}
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Tanggal Hari Ini</p>
               </div>
            </div>
          </motion.div>
        </header>

        {/* Main Viewport Container */}
        <main className="flex-1 flex flex-col items-center justify-center">
          <motion.div 
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-4xl aspect-video rounded-[3rem] bg-white border border-slate-200 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.1)] overflow-hidden p-3"
          >
            <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden bg-slate-100">
              {/* Corner Indicators */}
              <div className="absolute top-10 left-10 w-20 h-20 border-t-4 border-l-4 border-emerald-500/30 rounded-tl-3xl z-20 pointer-events-none" />
              <div className="absolute top-10 right-10 w-20 h-20 border-t-4 border-r-4 border-emerald-500/30 rounded-tr-3xl z-20 pointer-events-none" />
              <div className="absolute bottom-10 left-10 w-20 h-20 border-b-4 border-l-4 border-emerald-500/30 rounded-bl-3xl z-20 pointer-events-none" />
              <div className="absolute bottom-10 right-10 w-20 h-20 border-b-4 border-r-4 border-emerald-500/30 rounded-br-3xl z-20 pointer-events-none" />



              {/* Camera Rendering */}
              <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ 
                      width: 1280, 
                      height: 720, 
                      facingMode: cameraSource === '0' || cameraSource === '' ? "user" : undefined,
                      deviceId: cameraSource !== '0' && cameraSource !== '' && !cameraSource.startsWith('http') ? cameraSource : undefined
                  }}
                  className="w-full h-full object-cover"
                  mirrored={true}
                  screenshotQuality={0.9}
                  disablePictureInPicture={true}
                  forceScreenshotSourceSize={false}
                  imageSmoothing={true}
                  onUserMedia={() => {}}
                  onUserMediaError={() => {}}
              />

              {/* Scanning Ray Effect */}
              <AnimatePresence>
                {scanStatus === 'scanning' && (
                  <motion.div
                    initial={{ top: '0%' }}
                    animate={{ top: '100%' }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-0 h-1.5 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)] z-20 pointer-events-none"
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12 text-center"
          >
             <p className="text-slate-400 text-sm font-medium tracking-[0.4em] uppercase">Posisikan wajah Anda pada area bingkai</p>
          </motion.div>
        </main>
      </div>

      {/* Success Modal - Matching Dashboard Green Colors */}
      <AnimatePresence>
        {scanStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-500/20 backdrop-blur-3xl p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] p-16 flex flex-col items-center max-w-2xl w-full border border-white"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 10, stiffness: 100 }}
                className="w-32 h-32 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-xl shadow-emerald-200"
              >
                <CheckCircle2 className="w-16 h-16 text-white" />
              </motion.div>

              <p className="text-emerald-500 text-sm font-black uppercase tracking-[0.4em] mb-4">Absensi Berhasil</p>
              
              <div className="text-center mb-12">
                <span className="text-slate-400 text-xl font-medium block mb-2 font-serif italic">Halo, Selamat Datang</span>
                <h3 className="text-slate-900 text-6xl font-black uppercase tracking-tight">
                   {scannedName}
                </h3>
              </div>

              <div className="flex items-center gap-6 bg-slate-50 px-10 py-5 rounded-[2rem] border border-slate-100">
                <span className="text-slate-900 font-bold text-2xl tabular-nums tracking-tighter">
                  {formattedTime}
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest text-center">
                  Sistem Informasi Presensi Grisa
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Already Done Modal - Blue/Amber Theme */}
      <AnimatePresence>
        {scanStatus === 'already-done' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-blue-500/20 backdrop-blur-3xl p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] p-16 flex flex-col items-center max-w-2xl w-full border border-white"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 10, stiffness: 100 }}
                className="w-32 h-32 bg-blue-500 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-xl shadow-blue-200"
              >
                <Clock className="w-16 h-16 text-white" />
              </motion.div>

              <p className="text-blue-500 text-sm font-black uppercase tracking-[0.4em] mb-4">Sudah Presensi</p>
              
              <div className="text-center mb-12">
                <span className="text-slate-400 text-xl font-medium block mb-2 font-serif italic">Terima Kasih,</span>
                <h3 className="text-slate-900 text-6xl font-black uppercase tracking-tight">
                   {scannedName}
                </h3>
                <p className="text-slate-500 mt-4 font-bold text-lg">Bapak/Ibu sudah melakukan presensi hari ini.</p>
              </div>

              <div className="flex items-center gap-6 bg-slate-50 px-10 py-5 rounded-[2rem] border border-slate-100">
                 <span className="text-blue-600 font-black text-xs uppercase tracking-widest">Semangat Beraktivitas!</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Settings Toggle (Bottom Left for technicians) */}
      <button 
        onClick={() => setShowLocalSettings(true)}
        className="fixed bottom-6 left-6 z-40 p-4 bg-white/50 backdrop-blur-md rounded-full opacity-0 hover:opacity-100 transition-opacity border border-slate-200"
      >
        <Settings className="w-5 h-5 text-slate-400" />
      </button>

      {/* Local Kiosk Settings Modal */}
      <AnimatePresence>
        {showLocalSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">Konfigurasi Kios Unit</h3>
                <button onClick={() => setShowLocalSettings(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Nama Gerbang/Unit</label>
                  <input 
                    type="text" 
                    value={kioskName}
                    onChange={e => setKioskName(e.target.value)}
                    placeholder="Misal: Gerbang Depan"
                    className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 focus:border-emerald-500 focus:outline-none font-bold text-slate-700"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Webcam Perangkat</label>
                  <select 
                    value={tempCamera}
                    onChange={e => setTempCamera(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 focus:border-emerald-500 focus:outline-none font-bold text-slate-700 bg-white"
                  >
                    <option value="0">Default (System 0)</option>
                    {devices.map(device => (
                        <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Camera ${device.deviceId.hex?.slice(0,5)}`}
                        </option>
                    ))}
                    <option value="url">Stream URL (Set di Admin)</option>
                  </select>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                  <button 
                    onClick={saveLocalConfig}
                    className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Save className="w-5 h-5" /> Terapkan & Restart
                  </button>
                  <p className="text-[10px] text-slate-400 text-center uppercase font-bold">Pengaturan ini hanya disimpan di PC ini saja.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Admin Link Area */}
      <Link to="/admin/dashboard" className="fixed bottom-6 right-6 z-40 p-4 bg-slate-100 rounded-full opacity-0 hover:opacity-100 transition-opacity">
        <ScanFace className="w-6 h-6 text-slate-300" />
      </Link>
    </div>
  );
}
