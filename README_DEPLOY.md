# SIP-Grisa Deployment Guide (VPS Ubuntu)

Dokumen ini berisi daftar perintah lengkap yang digunakan untuk melakukan deployment aplikasi SIP-Grisa ke lingkungan produksi menggunakan Docker.

## 1. Persiapan Server
Lakukan koneksi ke VPS dan siapkan direktori proyek:

```bash
# Buat direktori dan clone repository
mkdir -p ~/sip-grisa && cd ~/sip-grisa
git clone -b feat/smart-logic-overhaul-v6 https://github.com/rfypych/SIP-Grisa.git .
```

## 2. Konfigurasi Environment
Buat file `.env` di dalam folder proyek. Gunakan perintah berikut atau edit manual menggunakan `nano .env`:

```bash
cat <<EOF > .env
GEMINI_API_KEY=""
DB_HOST="db"
DB_USER="root"
DB_PASS="prod_grisa_db_pass"
DB_NAME="sip_grisa"
MYSQL_ROOT_PASSWORD="prod_grisa_db_pass"
SECRET_KEY="$(openssl rand -hex 16)"
EOF
```

## 3. Eksekusi Deployment
Jalankan Docker Compose untuk membangun image dan menjalankan kontainer:

```bash
# Build dan jalankan di background
docker compose up -d --build
```

> [!NOTE]
> Proses build pertama kali mungkin memakan waktu **10-20 menit** karena kompilasi library `dlib` untuk pengenalan wajah.

## 4. Pemeliharaan & Monitoring

### Mengecek Status Kontainer
Pastikan semua kontainer berstatus `Up` dan database `healthy`:
```bash
docker compose ps
```

### Melihat Logs
Gunakan ini jika ada kendala saat startup:
```bash
# Log backend
docker compose logs -f backend

# Log database
docker compose logs -f db
```

### Restart Layanan
```bash
docker compose restart
```

## 5. Konfigurasi Firewall (PENTING)
Pastikan port berikut sudah dibuka di firewall VPS (misal: panel dashboard Cloud/VPS):
- **80** (HTTP - Frontend)
- **8000** (API - Backend/Swagger)

---
*Dokumen ini dibuat secara otomatis sebagai referensi deployment produksi.*
