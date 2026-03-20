import React from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  ShieldCheck,
  Users,
  ScanFace,
  Calendar,
  Settings,
  ClipboardList,
  History,
  Info,
  ChevronRight,
  Database,
  Terminal,
  AlertCircle,
  Globe,
  Key,
  DatabaseZap,
  Clock,
  Monitor,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const DocSection = ({
  title,
  icon: Icon,
  children,
  id
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
  id: string
}) => (
  <motion.section
    id={id}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    className="scroll-mt-24 mb-16"
  >
    <div className="flex items-center gap-3 mb-8">
      <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-200">
        <Icon className="w-6 h-6" />
      </div>
      <h2 className="text-3xl font-black text-slate-800 tracking-tight">{title}</h2>
    </div>
    <div className="space-y-6">
      {children}
    </div>
  </motion.section>
);

const DocCard = ({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon?: any }) => (
  <Card className="border-slate-200 shadow-sm overflow-hidden bg-white hover:shadow-md transition-all duration-300">
    <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 px-6">
      <CardTitle className="text-sm font-black text-slate-700 uppercase tracking-[0.2em] flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-emerald-500" />}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-6 text-slate-600 leading-relaxed text-sm">
      {children}
    </CardContent>
  </Card>
);

const ApiEndpoint = ({ method, path, desc }: { method: 'GET' | 'POST' | 'DELETE' | 'PUT', path: string, desc: string }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-emerald-200 transition-colors group">
    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest sm:w-20 text-center ${method === 'GET' ? 'bg-blue-100 text-blue-700' :
        method === 'POST' ? 'bg-emerald-100 text-emerald-700' :
          method === 'DELETE' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
      }`}>
      {method}
    </span>
    <code className="text-xs font-mono font-bold text-slate-800 bg-white px-2 py-1 rounded border border-slate-200 group-hover:bg-emerald-50 transition-colors">
      {path}
    </code>
    <span className="text-xs text-slate-500 sm:ml-auto font-medium">{desc}</span>
  </div>
);

const Step = ({ num, text }: { num: number; text: string }) => (
  <div className="flex items-start gap-3">
    <span className="flex-shrink-0 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">
      {num}
    </span>
    <p className="text-slate-600 font-medium">{text}</p>
  </div>
);

export default function DocumentationPage() {
  const scrollTo = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-16 pb-32 font-sans selection:bg-emerald-200">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-[3rem] bg-slate-900 p-12 md:p-20 text-white shadow-2xl shadow-slate-200"
      >
        <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-500/10 blur-[120px] rounded-full translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-blue-500/5 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <motion.div
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            className="p-8 bg-emerald-500 rounded-[2.5rem] shadow-2xl shadow-emerald-500/20"
          >
            <BookOpen className="w-16 h-16" />
          </motion.div>
          <div className="text-center md:text-left">
            <h1 className="text-5xl font-black tracking-tight mb-4 leading-tight">Pusat Dokumentasi <br /><span className="text-emerald-400">SIP Grisa</span></h1>
            <p className="text-slate-400 text-xl max-w-2xl font-medium leading-relaxed">
              Panduan integrasi API, logika operasional, dan pemeliharaan teknis sistem presensi masa depan.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Modern Navigation Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[
          { id: 'intro', label: 'Pengantar', icon: Info },
          { id: 'master', label: 'Master', icon: Users },
          { id: 'laporan', label: 'Laporan', icon: ClipboardList },
          { id: 'logic', label: 'Smart Logic', icon: Settings },
          { id: 'holiday', label: 'Libur', icon: Calendar },
          { id: 'api', label: 'API Docs', icon: Globe },
          { id: 'tech', label: 'Teknis', icon: Terminal },
        ].map(nav => (
          <motion.a
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.95 }}
            key={nav.id}
            href={`#${nav.id}`}
            onClick={(e) => scrollTo(nav.id, e)}
            className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-[2rem] hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/5 transition-all group lg:aspect-square"
          >
            <nav.icon className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 mb-3 transition-colors" />
            <span className="text-[10px] font-black text-slate-500 group-hover:text-emerald-900 uppercase tracking-[0.2em]">{nav.label}</span>
          </motion.a>
        ))}
      </div>

      <div className="space-y-4">
        {/* Intro */}
        <DocSection id="intro" title="1. Pengantar Sistem" icon={Info}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DocCard title="Fundamental SIP Grisa" icon={DatabaseZap}>
              Sistem Informasi Presensi Grisa mengalihkan metode absensi manual/kartu menjadi berbasis biometrik wajah. Menggunakan library <i>dlib</i> untuk akurasi tinggi dan <i>FastAPI</i> untuk komunikasi data asinkron yang sangat cepat.
            </DocCard>
            <DocCard title="Keamanan Role" icon={Key}>
              Setiap endpoint diproteksi dengan <b>JWT Bearer Token</b>. Hak akses Super Admin mencakup log sistem dan manajemen admin, sementara Admin biasa fokus pada data operasional pegawai.
            </DocCard>
          </div>
        </DocSection>

        {/* Master Data */}
        <DocSection id="master" title="2. Manajemen Master Data" icon={Users}>
          <DocCard title="Daftar & Registrasi Wajah">
            <div className="space-y-4">
              <Step num={1} text="Tambahkan biodata karyawan melalui menu Master Data." />
              <Step num={2} text="Klik ikon kamera pada baris karyawan." />
              <Step num={3} text="Ambil foto atau upload foto JPEG/PNG." />
              <Step num={4} text="Tunggu sistem memproses 'Face Encoding' hingga muncul tanda sukses." />
              <p className="mt-4 p-4 bg-emerald-50 text-emerald-700 rounded-3xl text-sm border border-emerald-100 leading-relaxed font-medium">
                <b>Penting:</b> Proses registrasi wajah akan menghasilkan file <code>encodings.pkl</code> baru. Pastikan tidak menghapus file ini saat sistem sedang berjalan (Reloading).
              </p>
            </div>
          </DocCard>

          <DocCard title="Fitur: Multi-Pattern Accuracy" icon={ScanFace}>
             <div className="space-y-4">
               <p className="text-xs">Sistem mendukung akumulasi pola wajah (encoding) untuk satu ID yang sama guna memperkuat akurasi deteksi.</p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <h5 className="font-bold text-[10px] uppercase mb-1 text-slate-800 tracking-tight">Cara Kerja</h5>
                    <p className="text-[10px] text-slate-500">Setiap kali Bapak meng-upload foto baru untuk ID yang sudah ada, sistem <b>tidak menghapus</b> pola lama, melainkan <b>menambahkan</b> pola baru ke database biometrik.</p>
                 </div>
                 <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <h5 className="font-bold text-[10px] uppercase mb-1 text-slate-800 tracking-tight">Tips Akurasi</h5>
                    <p className="text-[10px] text-slate-500">Daftarkan wajah dari beberapa sudut (depan, sedikit samping, kacamata/tanpa kacamata) untuk hasil pengenalan yang jauh lebih tangguh.</p>
                 </div>
               </div>
             </div>
          </DocCard>
        </DocSection>

        {/* API Docs Section */}
        <DocSection id="api" title="3. Dokumentasi API (Technical)" icon={Globe}>
          <DocCard title="Endpoint Keamanan & Autentikasi">
            <div className="space-y-3">
              <ApiEndpoint method="POST" path="/api/auth/login" desc="Login dan dapatkan JWT Token." />
              <ApiEndpoint method="GET" path="/api/auth/me" desc="Cek profil & role user saat ini." />
            </div>
          </DocCard>

          <DocCard title="Manajemen Kehadiran">
            <div className="space-y-3">
              <ApiEndpoint method="GET" path="/api/reports" desc="Ambil matriks kehadiran bulanan." />
              <ApiEndpoint method="POST" path="/api/attendance/manual" desc="Koreksi status (Hadir/Sakit/Izin/Alfa)." />
              <ApiEndpoint method="GET" path="/api/dashboard/stats" desc="Statistik dashboard (Tren & Rasio)." />
            </div>
          </DocCard>

          <DocCard title="Real-time Kiosk (WebSocket)">
            <div className="p-4 bg-slate-900 rounded-2xl text-emerald-400 font-mono text-[11px] leading-relaxed">
              <div className="flex gap-2 border-b border-slate-800 pb-2 mb-2">
                <Terminal className="w-3 h-3" />
                <span>WS /ws/kiosk</span>
              </div>
              <p className="text-slate-400 italic mb-2">Payload Frame:</p>
              <code>{`{ "type": "frame", "image": "base64_string" }`}</code>
              <p className="text-slate-400 italic mt-3 mb-2">Response:</p>
              <code>{`{ "event": "success", "name": "Budi Santoso", "id": "EMP01" }`}</code>
            </div>
          </DocCard>

          <DocCard title="Sumber & API Eksternal" icon={DatabaseZap}>
            <div className="space-y-4">
              <p className="text-xs">Sistem menggunakan API pihak ketiga untuk menjaga akurasi data kalender secara otomatis:</p>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-black text-[10px] text-emerald-700 uppercase tracking-widest">Nasional Holidays API</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
                </div>
                <code className="text-[10px] text-emerald-900 break-all font-mono">https://libur.deno.dev/api</code>
                <p className="text-[10px] text-emerald-600 mt-2 font-medium">Digunakan untuk sinkronisasi otomatis kalender libur Indonesia setiap tahunnya.</p>
              </div>
            </div>
          </DocCard>

          <DocCard title="Sistem & Konfigurasi">
            <div className="space-y-3">
              <ApiEndpoint method="GET" path="/api/settings" desc="Load konfigurasi Smart Logic." />
              <ApiEndpoint method="POST" path="/api/settings" desc="Simpan perubahan jam alpha/cooldown." />
              <ApiEndpoint method="POST" path="/api/holidays/sync" desc="Tarik data Libur Nasional terbaru." />
            </div>
          </DocCard>
        </DocSection>

        {/* Smart Logic */}
        <DocSection id="logic" title="4. Smart Logic Definitions" icon={Settings}>
          <DocCard title="Konfigurasi Presensi Pintar (Smart Logic)" icon={Zap}>
            <div className="space-y-6">
              <p className="text-xs text-slate-500">Logika otomatis untuk menjamin validitas data dan kenyamanan antrean di Kiosk.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <h5 className="font-bold text-xs text-emerald-800 mb-2 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> Cooldown (Detik)
                  </h5>
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    Mencegah deteksi ganda untuk orang yang sama. Jika diatur <b>60 detik</b>, maka setelah absen, wajah karyawan tersebut akan diabaikan oleh sistem selama 1 menit ke depan.
                  </p>
                </div>

                <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
                  <h5 className="font-bold text-xs text-purple-800 mb-2 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> Mulai Program
                  </h5>
                  <p className="text-[10px] text-slate-600 leading-relaxed" title="Berdasarkan Konfigurasi Bapak">
                    Tanggal efektif sistem mulai bekerja (<b>12/03/2026</b>). Perhitungan <b>Alpha</b> tidak akan dihitung sebelum tanggal ini.
                  </p>
                </div>

                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <h5 className="font-bold text-xs text-blue-800 mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> Jeda Plg. Min (Menit)
                  </h5>
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    Durasi minimal kerja sebelum fungsi <b>Check-out</b> aktif (<b>60 menit</b>). Mencegah salah absen sesaat setelah masuk.
                  </p>
                </div>

                <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                  <h5 className="font-bold text-xs text-orange-800 mb-2 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5" /> Jam Bebas Pulang
                  </h5>
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    "Golden Hour" (<b>11:00</b>). Setelah jam ini, batasan <i>Jeda Plg. Min</i> tidak berlaku lagi dan sistem mengizinkan Check-out instan.
                  </p>
                </div>

                <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
                  <h5 className="font-bold text-xs text-rose-800 mb-2 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> Jam Batas Alpha
                  </h5>
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    Batas toleransi (<b>05:30</b>). Karyawan yang absen melewati jam ini akan otomatis ditandai sebagai <b>Alfa</b>.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-900 rounded-3xl text-white">
                <h5 className="font-bold text-xs mb-2 flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5 text-emerald-400" /> Respon Visual Kiosk
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-2 border border-white/10 rounded-xl bg-white/5">
                    <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Pop-up Hijau</p>
                    <p className="text-[9px] opacity-70">Berhasil Absen (Masuk/Pulang).</p>
                  </div>
                  <div className="p-2 border border-white/10 rounded-xl bg-white/5">
                    <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Pop-up Biru</p>
                    <p className="text-[9px] opacity-70">Sudah Absen (Deteksi berulang).</p>
                  </div>
                  <div className="p-2 border border-white/10 rounded-xl bg-white/5">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Scanning Grid</p>
                    <p className="text-[9px] opacity-70">Sedang mencari wajah (Idle).</p>
                  </div>
                </div>
              </div>
            </div>
          </DocCard>
        </DocSection>

        {/* Technical */}
        <DocSection id="tech" title="5. Pemeliharaan & Troubleshooting" icon={Terminal}>
          <DocCard title="Daftar Error Umum">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-rose-50 rounded-2xl border border-rose-100">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-rose-800">500 Internal Server Error</p>
                  <p className="text-rose-600 mt-1">Sering terjadi jika file <code>encodings.pkl</code> korup atau tidak ditemukan. Solusi: Hapus file tersebut dan re-generate melalui master data.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-2xl border border-amber-100">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-amber-800">Wajah Tidak Terdeteksi</p>
                  <p className="text-amber-600 mt-1">Masalah pencahayaan (Backlight). Solusi: Pastikan area kamera terang dan latar belakang wajah netral.</p>
                </div>
              </div>
            </div>
          </DocCard>
        </DocSection>
      </div>

      {/* Footer Wrap */}
      <div className="flex flex-col items-center justify-center pt-12 border-t border-slate-200">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">
          SIP Grisa Documentation
        </p>
      </div>
    </div>
  );
}
