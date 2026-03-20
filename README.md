# 🏢 SIP Grisa - Sistem Informasi Presensi Grisa

<div align="center">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Tailwind_CSS_4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" />
  <br />
  <p align="center">
    <b>Sistem Presensi Berbasis Pengenalan Wajah (Face Recognition) yang Cepat, Akurat, dan Modern.</b>
    <br />
    <i>Didesain untuk efisiensi operasional dan kenyamanan pengalaman pengguna.</i>
  </p>
</div>

---

## ✨ Fitur Unggulan

- 🤖 **Face Recognition Real-time**: Deteksi dan pencocokan wajah super cepat menggunakan library `dlib`.
- 📊 **Matriks Laporan Matang**: Visualisasi kehadiran bulanan dengan status otomatis (Masuk, Pulang, Sakit, Izin, Alfa).
- 🧠 **Smart Logic Implementation**: 
  - *Auto-Alpha*: Menandai karyawan secara otomatis jika melewati jam batas kedatangan.
  - *Adaptive Cooldown*: Mencegah dobel absen dalam waktu singkat di Kiosk.
  - *Checkout Grace Period*: Logika pintar untuk menentukan waktu pulang karyawan.
- 📸 **Multi-Pattern Accuracy**: Mendukung banyak foto per ID untuk meningkatkan ketangguhan pengenalan.
- 🔊 **Audio & Visual Feedback**: Respon instan pada Kiosk dengan notifikasi suara dan modal animasi.
- 📄 **Export Excel Profesional**: Laporan siap cetak dengan tanda tangan otomatis dan rekapulasi lengkap.

---

## 🛠️ Arsitektur Teknologi

### Backend & Frontend (./)
- **FastAPI**: Engine API asinkron dengan performa tinggi.
- **MySQL**: Penyimpanan data relasional yang tangguh dan skalabel.
- **Dlib & Face Recognition**: Otak di balik biometrik wajah.
- **React 19 & Vite**: Interface yang responsif dan modern.
- **Tailwind CSS 4 & Zustand**: Desain elegan dan state management efisien.

---

## 🚀 Cara Menjalankan (All-in-One)

Sistem ini sekarang dilengkapi dengan skrip otomatisasi untuk setup dan menjalankan aplikasi sekaligus:

1.  **Gunakan Shortcut**:
    - **Windows**: Klik dua kali file **`run.bat`**.
    - **Linux/macOS**: Jalankan `chmod +x start.sh && ./start.sh`.
    - *Skrip ini akan otomatis mengecek dependensi (Python/Node.js), menginstall yang kurang, dan menjalankan Backend + Frontend sekaligus.*

---

### 🛠️ Mode Manual (Alternatif)

Jika ingin menjalankan secara terpisah di dalam folder `SIP-Grisa`:

**Backend:**
```bash
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
npm run dev
```

---

## ⚙️ Logika Operasional (Smart Logic)

Sistem ini dilengkapi dengan **Smart Logic** yang dapat dikonfigurasi melalui Dashboard Admin:
- **Jam Batas Alpha**: Batas toleransi masuk (Misal: 05:30).
- **Mulai Program**: Tanggal awal sistem aktif (Alpha tidak dihitung sebelum ini).
- **Jeda Pulang**: Minimal durasi kerja sebelum bisa melakukan Check-out.
- **Jam Bebas Pulang**: Jam di mana karyawan diizinkan pulang instan tanpa melihat jeda minimal.

---

## 🤝 Kontribusi & Dukungan

Proyek ini dikembangkan untuk kebutuhan internal **Grisa**. Untuk kendala teknis atau saran pengembangan, silakan hubungi tim IT.

<div align="center">
  <p><b>IT Department &copy; 2026 - SIP Grisa Project</b></p>
</div>
