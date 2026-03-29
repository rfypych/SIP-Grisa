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
  Zap,
  Sparkles
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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-4">
        {[
          { id: 'intro', label: 'Pengantar', icon: Info },
          { id: 'master', label: 'Master', icon: Users },
          { id: 'ai', label: 'AI Asisten', icon: Sparkles },
          { id: 'laporan', label: 'Laporan', icon: ClipboardList },
          { id: 'roles', label: 'Peran & Akses', icon: ShieldCheck },
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
            <span className="text-[10px] font-black text-slate-500 group-hover:text-emerald-900 uppercase tracking-[0.2em] text-center">{nav.label}</span>
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

        {/* AI Assistant */}
        <DocSection id="ai" title="3. Pendeteksi Absen (AI Recovery)" icon={Sparkles}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DocCard title="Otomasi dari Foto">
              <div className="space-y-4">
                <p className="text-xs">Fitur pemulihan data jika sistem kiosk mengalami kendala. Admin cukup memotret lembar absen manual.</p>
                <Step num={1} text="Unggah foto daftar hadir manual di menu Pendeteksi Absen." />
                <Step num={2} text="Klik 'Mulai Deteksi Otomatis' dan tunggu Asisten Digital bekerja." />
                <Step num={3} text="Tunjau hasil pembacaan pada tabel di sebelah kanan." />
                <Step num={4} text="Klik 'Simpan Semua Data' untuk memasukkan hasil ke buku pusat." />
              </div>
            </DocCard>
            <DocCard title="Teknologi Vision" icon={Zap}>
              <div className="space-y-4 text-xs">
                <p>Menggunakan model <b>Gemini 2.0 Flash</b> yang mampu mengenali teks (OCR) dan konteks visual secara cerdas.</p>
                <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                  <h5 className="font-bold text-orange-900 mb-2 flex items-center gap-2">
                    <History className="w-4 h-4" /> Audit Log & Transparansi
                  </h5>
                  <p className="text-orange-700">Setiap aksi penyimpanan data oleh AI akan dicatat dengan detail di <b>Log Sistem</b>. Admin bisa melihat siapa saja yang diproses dalam satu sesi foto tersebut.</p>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <h5 className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Konfigurasi Fleksibel
                  </h5>
                  <p className="text-emerald-700 font-medium">Sekarang kunci API Gemini dapat diatur langsung melalui menu <b>Pengaturan</b> di Dashboard. Sistem akan memprioritaskan kunci di database sebelum menggunakan <code>.env</code>.</p>
                </div>
              </div>
            </DocCard>
          </div>
        </DocSection>

        {/* Laporan */}
        <DocSection id="laporan" title="4. Manajemen Laporan" icon={ClipboardList}>
           <DocCard title="Matriks Laporan Bulanan">
             <p className="text-xs mb-4">Laporan dalam format grid 31 hari memudahkan pemantauan kehadiran secara visual.</p>
             <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                   <div className="w-3 h-3 bg-emerald-500 rounded" /> <span>Hadir tepat waktu</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                   <div className="w-3 h-3 bg-amber-500 rounded" /> <span>Izin / Sakit / Dinas</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                   <div className="w-3 h-3 bg-rose-500 rounded" /> <span>Alfa (Tidak Hadir)</span>
                </div>
             </div>
           </DocCard>
        </DocSection>

        {/* Roles & Access Control */}
        <DocSection id="roles" title="5. Hak Akses & Peran (RBAC)" icon={ShieldCheck}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DocCard title="Super Admin" icon={ShieldCheck}>
              <div className="space-y-2 text-xs">
                <p className="font-bold text-emerald-600">Akses Penuh (Full Control)</p>
                <ul className="list-disc list-inside space-y-1 text-slate-500">
                  <li>Seluruh Dashboard & Laporan</li>
                  <li>Manajemen Akun Admin</li>
                  <li>Log Sistem & Audit Trail</li>
                  <li>Pengaturan Inti Sistem</li>
                  <li>Dokumentasi Teknis</li>
                  <li>Pendeteksi Absen (AI)</li>
                </ul>
              </div>
            </DocCard>
            
            <DocCard title="Admin" icon={Users}>
              <div className="space-y-2 text-xs">
                <p className="font-bold text-blue-600">Akses Operasional</p>
                <ul className="list-disc list-inside space-y-1 text-slate-500">
                  <li>Dashboard & Laporan</li>
                  <li>Master Data & Wajah</li>
                  <li>Manajemen Hari Libur</li>
                  <li>Pendeteksi Absen (AI)</li>
                  <li>Pengaturan Dasar</li>
                  <li className="line-through opacity-50">Log & Manajemen Admin</li>
                </ul>
              </div>
            </DocCard>

            <DocCard title="Kiosk / Terminal" icon={Monitor}>
              <div className="space-y-2 text-xs">
                <p className="font-bold text-slate-600">Mode Presensi Saja</p>
                <ul className="list-disc list-inside space-y-1 text-slate-500">
                  <li>Halaman Scan Wajah</li>
                  <li>Feedback Suara & Visual</li>
                  <li className="line-through opacity-50">Menu Administrasi</li>
                  <li className="line-through opacity-50">Laporan & Database</li>
                </ul>
              </div>
            </DocCard>
          </div>
        </DocSection>

        {/* API Docs Section */}
        <DocSection id="api" title="6. Dokumentasi API (Technical)" icon={Globe}>
          <DocCard title="Endpoint Keamanan & Autentikasi">
            <div className="space-y-3">
              <ApiEndpoint method="POST" path="/api/auth/login" desc="Login dan dapatkan JWT Token." />
              <ApiEndpoint method="GET" path="/api/auth/me" desc="Cek profil & role user saat ini." />
            </div>
          </DocCard>

          <DocCard title="Pendeteksi Absen (AI)">
            <div className="space-y-3">
              <ApiEndpoint method="POST" path="/api/ai/process_attendance" desc="Analisis gambar menggunakan AI Vision." />
              <ApiEndpoint method="POST" path="/api/ai/commit_attendance" desc="Simpan hasil deteksi ke database (Bulk)." />
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
                <div className="justify-between flex items-center mb-2">
                  <span className="font-black text-[10px] text-emerald-700 uppercase tracking-widest">Nasional Holidays API</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
                </div>
                <code className="text-[10px] text-emerald-900 break-all font-mono">https://libur.deno.dev/api</code>
                <p className="text-[10px] text-emerald-600 mt-2 font-medium">Digunakan untuk sinkronisasi otomatis kalender libur Indonesia setiap tahunnya.</p>
              </div>
            </div>
          </DocCard>
        </DocSection>

        {/* Smart Logic */}
        <DocSection id="logic" title="7. Konfigurasi Sistem & Smart Logic" icon={Settings}>
          <div className="grid grid-cols-1 gap-8">
            <DocCard title="Pemisahan Lingkungan: Normal vs Mode Pengujian" icon={Zap}>
              <div className="space-y-4 text-xs">
                <p>Sistem memiliki dua lapisan pengaturan yang bekerja secara independen untuk menjaga stabilitas operasional:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <h5 className="font-bold text-emerald-800 mb-2">Mode Normal (Operasional)</h5>
                    <p className="text-emerald-700">Digunakan untuk presensi harian asli. Pengaturan ini sangat krusial dan tidak boleh sering diubah.</p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <h5 className="font-bold text-amber-800 mb-2">Mode Pengujian (Debug)</h5>
                    <p className="text-amber-700">Lingkungan simulasi. Saat aktif, Kiosk akan menggunakan setelan khusus (Cooldown, Jeda, Jam) yang terpisah dari data asli.</p>
                  </div>
                </div>
              </div>
            </DocCard>

            <DocCard title="Logika Presensi Pintar (Smart Logic)" icon={Monitor}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-emerald-500" /> Cooldown</h5>
                  <p className="text-[10px] text-slate-500">Jeda (detik) agar sistem tidak mencatat wajah yang sama berulang kali dalam waktu singkat (Anti-Spam).</p>
                </div>
                <div className="space-y-2">
                  <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Jeda Plg. Min</h5>
                  <p className="text-[10px] text-slate-500">Durasi wajib (menit) bagi pegawai untuk berada di lingkungan kerja sebelum fungsi <b>Check-out</b> aktif.</p>
                </div>
                <div className="space-y-2">
                  <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-amber-500" /> Wajib Jeda (Enforce)</h5>
                  <p className="text-[10px] text-slate-500">Jika <b>AKTIF</b>, pegawai yang terlambat datang TETAP WAJIB memenuhi <i>Jeda Min</i> meskipun waktu sudah melewati Jam Pulang.</p>
                </div>
                <div className="space-y-2">
                  <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2"><Monitor className="w-3.5 h-3.5 text-blue-500" /> Jam Buka Presensi</h5>
                  <p className="text-[10px] text-slate-500">Batas waktu paling awal Kiosk menerima presensi masuk. Sebelum jam ini, wajah akan diabaikan/ditolak.</p>
                </div>
                <div className="space-y-2">
                  <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-rose-500" /> Jam Tutup / Pulang</h5>
                  <p className="text-[10px] text-slate-500">Waktu dimulainya kepulangan massal. Bisa dinonaktifkan jika ingin hanya menggunakan <i>Jeda Min</i> sebagai syarat pulang.</p>
                </div>
                <div className="space-y-2">
                  <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-purple-500" /> Mulai Program</h5>
                  <p className="text-[10px] text-slate-500">Tanggal awal sistem dihitung aktif. Absen di luar (sebelum) tanggal ini tidak akan dihitung Alpha.</p>
                </div>
              </div>
            </DocCard>

            <DocCard title="Integrasi AI & Keamanan" icon={Key}>
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h5 className="font-bold text-slate-800 mb-2">Gemini API Key (Global)</h5>
                  <p className="text-slate-600 mb-3">Kunci akses untuk fitur <b>AI Recovery</b> dan analisis foto daftar hadir. Keamanan kunci ini dijamin:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-500">
                    <li>Disimpan terenkripsi di database MySQL (System Settings).</li>
                    <li>Sistem memprioritaskan kunci di database daripada file <code>.env</code>.</li>
                    <li>Input di dashboard disembunyikan (type password) untuk keamanan visual.</li>
                  </ul>
                </div>
              </div>
            </DocCard>
          </div>
        </DocSection>

        {/* Technical */}
        <DocSection id="tech" title="8. Pemeliharaan & Troubleshooting" icon={Terminal}>
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
