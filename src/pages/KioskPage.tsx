import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScanFace, CheckCircle2, Clock, Calendar, Settings, Camera, Save, X, Zap, PartyPopper } from 'lucide-react';
import { Badge } from '../components/ui/badge';
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
    minGapMinutes,
    presenceLimitTime,
    checkinStartTime,
    checkoutStartTime,
    testMode,
    fetchBackendSettings,
    updateBackendSettings
  } = useSettingsStore();
  const { token } = useAuthStore();
  const [time, setTime] = useState(new Date());
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'already-done' | 'warning'>('idle');
  const [warningMessage, setWarningMessage] = useState('');
  const [scannedName, setScannedName] = useState('');
  const [doneMessage, setDoneMessage] = useState('');
  const [showLocalSettings, setShowLocalSettings] = useState(false);
  const [kioskName, setKioskName] = useState(() => localStorage.getItem('sip-grisa-kiosk-name') || 'Gerbang Utama');
  const [tempCamera, setTempCamera] = useState(cameraSource);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [debugData, setDebugData] = useState<any>(null);
  const [simulatedTime, setSimulatedTime] = useState('');
  const [simHour, setSimHour] = useState(7);
  const [simMin, setSimMin] = useState(0);
  const [useSimTime, setUseSimTime] = useState(false);

  // Local states for sliders to make them smooth
  const [localCooldown, setLocalCooldown] = useState(cooldownSeconds);
  const [localMinGap, setLocalMinGap] = useState(minGapMinutes);
  const [localPresenceHour, setLocalPresenceHour] = useState(14);
  const [localPresenceMin, setLocalPresenceMin] = useState(0);
  const [localCheckinHour, setLocalCheckinHour] = useState(6);
  const [localCheckinMin, setLocalCheckinMin] = useState(0);
  const [localCheckoutHour, setLocalCheckoutHour] = useState(14);
  const [localCheckoutMin, setLocalCheckoutMin] = useState(0);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const handleUpdateSetting = (key: string, value: any) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      if (token) await updateBackendSettings(token, { [key]: value });
    }, 500);
  };
  
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

  useEffect(() => {
    if (useSimTime) {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      setSimulatedTime(`${dateStr} ${simHour.toString().padStart(2, '0')}:${simMin.toString().padStart(2, '0')}:00`);
    } else {
      setSimulatedTime('');
    }
  }, [simHour, simMin, useSimTime]);

  // Sync local sliders with store (initial/fetch)
  useEffect(() => {
    setLocalCooldown(cooldownSeconds);
    setLocalMinGap(minGapMinutes);
    const [h, m] = presenceLimitTime.split(':').map(Number);
    setLocalPresenceHour(h || 0);
    setLocalPresenceMin(m || 0);

    const [ciH, ciM] = (checkinStartTime || '06:00').split(':').map(Number);
    setLocalCheckinHour(ciH || 0);
    setLocalCheckinMin(ciM || 0);

    const [coH, coM] = (checkoutStartTime || '14:00').split(':').map(Number);
    setLocalCheckoutHour(coH || 0);
    setLocalCheckoutMin(coM || 0);
  }, [cooldownSeconds, minGapMinutes, presenceLimitTime, checkinStartTime, checkoutStartTime]);

  const saveLocalConfig = () => {
    setCameraSource(tempCamera);
    localStorage.setItem('sip-grisa-kiosk-name', kioskName);
    setShowLocalSettings(false);
    window.location.reload(); // Refresh to apply cam & websocket changes if needed
  };

  // WebSocket Connection & Frame Capture (Optimized Request-Response)
  const simulatedTimeRef = useRef<string | null>(null);
  useEffect(() => {
    simulatedTimeRef.current = simulatedTime;
  }, [simulatedTime]);

  const captureAndSend = () => {
    if (!webcamRef.current || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    
    // We can use a ref or local closure here, but since it's an interval 
    // we use the ref to always get the latest simulated time.
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
       ws.current.send(JSON.stringify({
          type: 'frame',
          image: imageSrc,
          simulate_time: simulatedTimeRef.current,
          kiosk_name: kioskName
       }));
    }
  };

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/kiosk`;
    
    ws.current = new WebSocket(wsUrl);
    let isProcessing = false;
    let lastRequestTime = Date.now();

    ws.current.onopen = () => {
      if (token) {
        ws.current?.send(JSON.stringify({
          type: 'auth',
          token: token
        }));
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

        // Durasi tampilan sukses
        const displayDuration = 3000; 
        
        setTimeout(() => {
          setScanStatus('scanning');
        }, displayDuration);
      } else if (data.event === 'already_done') {
        setScannedName(data.name);
        setDoneMessage(data.message || 'Anda sudah melakukan presensi.');
        setScanStatus('already-done');
        
        setTimeout(() => {
          setScanStatus('scanning');
        }, 3000);
      } else if (data.event === 'searching' || data.event === 'on_cooldown') {
        setScanStatus(prev => (prev === 'success' || prev === 'already-done' || prev === 'warning') ? prev : 'scanning');
      } else if (data.event === 'early_warning') {
        setWarningMessage(data.message);
        setScanStatus('warning');
        setTimeout(() => {
          setScanStatus('scanning');
        }, 4000);
      }

      if (data.debug) {
        setDebugData(data.debug);
      }
    };

    const sendLoop = setInterval(() => {
      // Safety guard: if stuck isProcessing for more than 5s, reset it
      if (isProcessing && Date.now() - lastRequestTime > 5000) {
        isProcessing = false;
      }

      if (!isProcessing) {
        isProcessing = true;
        lastRequestTime = Date.now();
        captureAndSend();
      }
    }, testMode ? 400 : 1000);

    return () => {
      clearInterval(sendLoop);
      ws.current?.close();
    };
  }, [testMode, token, successSoundEnabled, successSoundUrl, kioskName]); 

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

      {/* Already Done Modal - Celebration Theme */}
      <AnimatePresence>
        {scanStatus === 'already-done' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-500/10 backdrop-blur-3xl p-6"
          >
            {/* Confetti-like floating particles */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{ 
                  opacity: [0, 1, 0], 
                  scale: [0, 1.5, 0.5],
                  x: (i % 2 === 0 ? 1 : -1) * (Math.random() * 300 + 100),
                  y: (i % 3 === 0 ? 1 : -1) * (Math.random() * 300 + 100),
                }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
                className={`absolute w-3 h-3 rounded-full ${i % 3 === 0 ? 'bg-amber-400' : i % 3 === 1 ? 'bg-emerald-400' : 'bg-blue-400'}`}
              />
            ))}

            <motion.div
              initial={{ scale: 0.9, y: 30, rotate: -2 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              className="bg-white rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(16,185,129,0.2)] p-16 flex flex-col items-center max-w-2xl w-full border border-white relative overflow-hidden"
            >
              {/* Decorative Background Glow */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-100 rounded-full blur-3xl opacity-50" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-amber-100 rounded-full blur-3xl opacity-50" />

              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                className="w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-2xl shadow-emerald-200 relative z-10"
              >
                <PartyPopper className="w-16 h-16 text-white" />
              </motion.div>

              <p className="text-emerald-600 text-sm font-black uppercase tracking-[0.4em] mb-4 relative z-10">Sudah Absensi</p>
              
              <div className="text-center mb-12 relative z-10">
                <span className="text-slate-400 text-xl font-medium block mb-2 font-serif italic">Mantap,</span>
                <h3 className="text-slate-900 text-6xl font-black uppercase tracking-tight leading-tight">
                   {scannedName}
                </h3>
                <p className="text-slate-500 mt-6 font-bold text-lg max-w-sm mx-auto">
                  Anda sudah melakukan absensi hari ini. 
                  <span className="text-emerald-500 block">Terima kasih atas kedisiplinannya!</span>
                </p>
              </div>

              <div className="flex items-center gap-6 bg-emerald-50 px-10 py-5 rounded-[2rem] border border-emerald-100 relative z-10">
                 <span className="text-emerald-700 font-black text-xs uppercase tracking-widest">Ayo Semangat Beraktivitas! 🚀</span>
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

      {/* Logic Debugger Panel (Only in Test Mode) */}
      {testMode && (
        <motion.div 
          initial={{ x: 300 }}
          animate={{ x: 0 }}
          className="fixed top-32 right-6 z-[60] w-72 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-2xl text-white overflow-hidden"
        >
          <div className="flex items-center gap-2 mb-6 border-b border-slate-700 pb-4">
             <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-slate-900" />
             </div>
             <div>
               <h4 className="text-sm font-black uppercase tracking-widest text-amber-400">Logic Debugger</h4>
               <p className="text-[10px] text-slate-400 font-bold uppercase">Mode Pengujian Aktif</p>
             </div>
          </div>

          <div className="space-y-5">
             <div className="space-y-3 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/30">
               <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Simulasi Waktu</label>
                  <button 
                    onClick={() => setUseSimTime(!useSimTime)}
                    className={`text-[9px] font-black px-2 py-0.5 rounded-full border transition-all ${useSimTime ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' : 'bg-slate-700/50 border-slate-600 text-slate-400'}`}
                  >
                    {useSimTime ? 'ON' : 'OFF'}
                  </button>
               </div>
               
               {useSimTime && (
                 <div className="space-y-4 pt-2">
                    <div className="space-y-1">
                       <div className="flex justify-between text-[10px] font-mono text-slate-400">
                          <span>Jam</span>
                          <span className="text-amber-400 font-bold">{simHour.toString().padStart(2, '0')}</span>
                       </div>
                       <input 
                         type="range" min="0" max="23" value={simHour} 
                         onChange={(e) => setSimHour(parseInt(e.target.value))}
                         className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                       />
                    </div>
                    <div className="space-y-1">
                       <div className="flex justify-between text-[10px] font-mono text-slate-400">
                          <span>Menit</span>
                          <span className="text-amber-400 font-bold">{simMin.toString().padStart(2, '0')}</span>
                       </div>
                       <input 
                         type="range" min="0" max="59" value={simMin} 
                         onChange={(e) => setSimMin(parseInt(e.target.value))}
                         className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                       />
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700/50 text-center">
                       <p className="text-[10px] font-mono text-slate-300">{simulatedTime}</p>
                    </div>
                 </div>
               )}
                {!useSimTime && (
                 <p className="text-[9px] text-slate-500 italic py-2 text-center">Menggunakan waktu sistem secara real-time.</p>
               )}
             </div>

             <div className="space-y-4 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/30">
                <div className="flex items-center gap-2 mb-1">
                   <Zap className="w-3 h-3 text-amber-500" />
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Global Smart Logic</label>
                </div>

                <div className="space-y-3">
                   {/* Cooldown */}
                   <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                         <span className="text-slate-400">Cooldown</span>
                         <span className="text-amber-400">{localCooldown}s</span>
                      </div>
                      <input 
                        type="range" min="0" max="300" step="5" value={localCooldown} 
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setLocalCooldown(val);
                          handleUpdateSetting('cooldown_seconds', val);
                        }}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                   </div>

                   {/* Min Gap */}
                   <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                         <span className="text-slate-400">Min Gap Pulang</span>
                         <span className="text-emerald-400">{localMinGap}m</span>
                      </div>
                      <input 
                        type="range" min="0" max="240" step="10" value={localMinGap} 
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setLocalMinGap(val);
                          handleUpdateSetting('min_gap_minutes', val);
                        }}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                   </div>

                   {/* Check-in Start Sliders */}
                   <div className="space-y-2 pt-1 border-t border-slate-700/50">
                      <div className="flex justify-between text-[10px] font-mono mb-1">
                         <span className="text-slate-400">Jam Mulai Masuk</span>
                         <span className="text-blue-400 font-bold">{localCheckinHour.toString().padStart(2, '0')}:{localCheckinMin.toString().padStart(2, '0')}</span>
                      </div>
                      <div className="flex gap-4">
                         <div className="flex-1 space-y-1">
                            <span className="text-[8px] text-slate-500 uppercase font-black">Jam</span>
                            <input
                              type="range" min="0" max="23" value={localCheckinHour}
                              onChange={(e) => {
                                 const val = parseInt(e.target.value);
                                 setLocalCheckinHour(val);
                                 handleUpdateSetting('checkin_start_time', `${val.toString().padStart(2, '0')}:${localCheckinMin.toString().padStart(2, '0')}`);
                              }}
                              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                         </div>
                         <div className="flex-1 space-y-1">
                            <span className="text-[8px] text-slate-500 uppercase font-black">Min</span>
                            <input
                              type="range" min="0" max="59" step="5" value={localCheckinMin}
                              onChange={(e) => {
                                 const val = parseInt(e.target.value);
                                 setLocalCheckinMin(val);
                                 handleUpdateSetting('checkin_start_time', `${localCheckinHour.toString().padStart(2, '0')}:${val.toString().padStart(2, '0')}`);
                              }}
                              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                         </div>
                      </div>
                   </div>

                   {/* Check-out Start Sliders */}
                   <div className="space-y-2 pt-1 border-t border-slate-700/50">
                      <div className="flex justify-between text-[10px] font-mono mb-1">
                         <span className="text-slate-400">Jam Mulai Pulang</span>
                         <span className="text-emerald-400 font-bold">{localCheckoutHour.toString().padStart(2, '0')}:{localCheckoutMin.toString().padStart(2, '0')}</span>
                      </div>
                      <div className="flex gap-4">
                         <div className="flex-1 space-y-1">
                            <span className="text-[8px] text-slate-500 uppercase font-black">Jam</span>
                            <input
                              type="range" min="0" max="23" value={localCheckoutHour}
                              onChange={(e) => {
                                 const val = parseInt(e.target.value);
                                 setLocalCheckoutHour(val);
                                 handleUpdateSetting('checkout_start_time', `${val.toString().padStart(2, '0')}:${localCheckoutMin.toString().padStart(2, '0')}`);
                              }}
                              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                         </div>
                         <div className="flex-1 space-y-1">
                            <span className="text-[8px] text-slate-500 uppercase font-black">Min</span>
                            <input
                              type="range" min="0" max="59" step="5" value={localCheckoutMin}
                              onChange={(e) => {
                                 const val = parseInt(e.target.value);
                                 setLocalCheckoutMin(val);
                                 handleUpdateSetting('checkout_start_time', `${localCheckoutHour.toString().padStart(2, '0')}:${val.toString().padStart(2, '0')}`);
                              }}
                              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                         </div>
                      </div>
                   </div>

                   {/* Boundary Time Sliders */}
                   <div className="space-y-2 pt-1 border-t border-slate-700/50">
                      <div className="flex justify-between text-[10px] font-mono mb-1">
                         <span className="text-slate-400">Jam Batas (Limit)</span>
                         <span className="text-rose-400 font-bold">{localPresenceHour.toString().padStart(2, '0')}:{localPresenceMin.toString().padStart(2, '0')}</span>
                      </div>
                      <div className="flex gap-4">
                         <div className="flex-1 space-y-1">
                            <span className="text-[8px] text-slate-500 uppercase font-black">Jam</span>
                            <input 
                              type="range" min="0" max="23" value={localPresenceHour} 
                              onChange={(e) => {
                                 const val = parseInt(e.target.value);
                                 setLocalPresenceHour(val);
                                 handleUpdateSetting('presence_limit_time', `${val.toString().padStart(2, '0')}:${localPresenceMin.toString().padStart(2, '0')}`);
                              }}
                              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                            />
                         </div>
                         <div className="flex-1 space-y-1">
                            <span className="text-[8px] text-slate-500 uppercase font-black">Min</span>
                            <input 
                              type="range" min="0" max="59" step="5" value={localPresenceMin} 
                              onChange={(e) => {
                                 const val = parseInt(e.target.value);
                                 setLocalPresenceMin(val);
                                 handleUpdateSetting('presence_limit_time', `${localPresenceHour.toString().padStart(2, '0')}:${val.toString().padStart(2, '0')}`);
                              }}
                              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                            />
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/30 space-y-4">
                <div className="flex justify-between items-center">
                   <span className="text-[10px] font-bold uppercase text-slate-400">Status</span>
                   <Badge className={
                      scanStatus === 'success' ? 'bg-emerald-500' :
                      scanStatus === 'warning' ? 'bg-amber-500 text-amber-950 font-black' :
                      'bg-slate-700'
                   }>
                      {scanStatus}
                   </Badge>
                </div>
                
                {debugData && (
                  <>
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-bold uppercase text-slate-400">Confidence</span>
                       <span className={`font-mono text-sm ${debugData.confidence > 70 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {debugData.confidence}%
                       </span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-bold uppercase text-slate-400">Cooldown</span>
                       <span className="font-mono text-sm text-amber-400">
                          {debugData.cooldown_remains}s
                       </span>
                    </div>

                    <div className="pt-2 border-t border-slate-700/50 space-y-2">
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Mulai Masuk</span>
                          <span className="font-mono text-xs text-blue-400 font-bold">{checkinStartTime}</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Mulai Pulang</span>
                          <span className="font-mono text-xs text-emerald-400 font-bold">{checkoutStartTime}</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Boundary (Limit)</span>
                          <span className="font-mono text-xs text-rose-400 font-bold">{presenceLimitTime}</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Logic Time</span>
                          <span className="font-mono text-xs text-slate-300">{debugData.current_logic_time}</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Will Be</span>
                          <Badge className={debugData.current_logic_time >= presenceLimitTime ? 'bg-blue-500' : 'bg-emerald-500'}>
                             {debugData.current_logic_time >= presenceLimitTime ? 'CHECK-OUT' : 'CHECK-IN'}
                          </Badge>
                       </div>
                    </div>

                    {/* Fitur Sudah Absensi Info */}
                    {(debugData.last_check_in || debugData.last_check_out) && (
                      <div className="pt-2 border-t border-slate-700/50 space-y-2">
                         <p className="text-[9px] font-bold text-slate-500 uppercase">Data Hari Ini:</p>
                         <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-400">Check-In</span>
                            <span className="text-[10px] font-mono text-emerald-400">{debugData.last_check_in || '-'}</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-400">Check-Out</span>
                            <span className="text-[10px] font-mono text-blue-400">{debugData.last_check_out || '-'}</span>
                         </div>
                         
                         {/* Action Reset */}
                         <button 
                           onClick={() => {
                              ws.current?.send(JSON.stringify({
                                type: 'reset_attendance',
                                face_id: debugData.face_id || scannedName // Assuming face_id is passed or we use current detection
                              }));
                           }}
                           className="w-full mt-2 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-[9px] font-black uppercase transition-all"
                         >
                           Reset Kehadiran Orang Ini
                         </button>
                      </div>
                    )}
                  </>
                )}
                {!debugData && (
                   <p className="text-[10px] text-slate-500 text-center py-4">Menunggu deteksi...</p>
                )}
             </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-700 flex justify-center">
             <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">Backend Connected: {debugData ? 'OK' : 'WAIT'}</span>
             </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
