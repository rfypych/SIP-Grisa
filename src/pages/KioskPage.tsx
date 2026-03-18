import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScanFace, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function KioskPage() {
  const [time, setTime] = useState(new Date());
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success'>('idle');
  const [scannedName, setScannedName] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate scanning process
  useEffect(() => {
    const simulateScan = () => {
      setScanStatus('scanning');
      setTimeout(() => {
        setScannedName('Budi Santoso');
        setScanStatus('success');
        
        setTimeout(() => {
          setScanStatus('idle');
        }, 3000);
      }, 2000);
    };

    const interval = setInterval(simulateScan, 8000);
    return () => clearInterval(interval);
  }, []);

  const formattedTime = time.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedDate = time.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="relative min-h-screen w-full overflow-y-auto bg-slate-900 flex items-center justify-center font-sans p-4 sm:p-8">
      {/* Blurred Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40 blur-md scale-105 fixed"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop)' }}
      />
      
      {/* Overlay Gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-slate-900/50 to-slate-900/80" />

      {/* Main Glassmorphism Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-4xl rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
      >
        {/* Left Side: Time & Info */}
        <div className="flex-1 p-6 md:p-12 flex flex-col justify-center border-b md:border-b-0 md:border-r border-white/10">
          <div className="flex items-center gap-3 text-emerald-400 mb-8">
            <ScanFace className="w-8 h-8" />
            <h1 className="text-2xl font-bold tracking-tight">SIP Grisa Terminal</h1>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-5xl md:text-6xl font-mono font-bold text-white tracking-tighter">
              {formattedTime}
            </h2>
            <p className="text-lg md:text-xl text-slate-300 font-medium">
              {formattedDate}
            </p>
          </div>

          <div className="mt-8 md:mt-12 text-slate-400 text-sm">
            <p>Silakan posisikan wajah Anda di dalam area kotak.</p>
            <p>Sistem akan memindai secara otomatis.</p>
          </div>
          
          <Link to="/admin/dashboard" className="mt-8 md:mt-auto pt-4 md:pt-8 text-xs text-slate-500 hover:text-slate-300 transition-colors">
            Masuk ke Admin Dashboard
          </Link>
        </div>

        {/* Right Side: Camera Viewfinder */}
        <div className="flex-1 p-6 md:p-12 flex items-center justify-center bg-black/20 relative">
          <div className="relative w-full aspect-square max-w-sm rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-800">
            {/* Corner Markers */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg z-20" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg z-20" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg z-20" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-lg z-20" />

            {/* Camera Placeholder */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
              <ScanFace className="w-16 h-16 mb-4 opacity-50" />
              <p className="font-medium">Kamera Aktif</p>
            </div>

            {/* Scanning Animation Overlay */}
            <AnimatePresence>
              {scanStatus === 'scanning' && (
                <motion.div
                  initial={{ top: '0%' }}
                  animate={{ top: '100%' }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] z-30"
                />
              )}
            </AnimatePresence>
          </div>

          {/* Success Popup */}
          <AnimatePresence>
            {scanStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                className="absolute inset-0 z-40 flex items-center justify-center bg-emerald-900/90 backdrop-blur-sm p-8 text-center"
              >
                <div className="flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                  >
                    <CheckCircle2 className="w-24 h-24 text-emerald-400 mb-6" />
                  </motion.div>
                  <h3 className="text-3xl font-bold text-white mb-2">Absen Sukses!</h3>
                  <p className="text-xl text-emerald-200">Selamat Pagi,</p>
                  <p className="text-2xl font-semibold text-white mt-1">{scannedName}</p>
                  <p className="text-emerald-400 mt-4 font-mono">{formattedTime}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
