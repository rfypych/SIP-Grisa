# Panduan Deployment SIP-Grisa di Proxmox LXC (Ubuntu)

Panduan ini menjelaskan langkah-langkah mendeploy SIP-Grisa ke dalam Proxmox Container (LXC) menggunakan Docker, mulai dari pembuatan CT hingga aplikasi berjalan.

## 1. Persiapan di Proxmox (Host)

### Unduh Template
1. Buka Proxmox Web UI.
2. Pilih storage (misal: `local`).
3. Klik **CT Templates** > **Templates**.
4. Cari dan unduh `ubuntu-24.04-standard` (atau versi 22.04).

### Buat Container (CT)
1. Klik **Create CT** di pojok kanan atas.
2. **General**: Isi Hostname (misal: `sip-grisa-prod`) dan Password root.
3. **Template**: Pilih template Ubuntu yang sudah diunduh.
4. **Disks**: Alokasikan minimal **20GB - 40GB** (Build Docker dlib membutuhkan ruang cukup besar).
5. **CPU**: Alokasikan minimal **2 Core** (Saran: 4 Core untuk build lebih cepat).
6. **Memory**: Minimal **2GB - 4GB** RAM.
7. **Network**: Sesuaikan dengan network lokal/VLAN Anda.
8. **Confirm**: Jangan langsung klik Finish.

### Konfigurasi Khusus (PENTING untuk Docker)
Agar Docker bisa berjalan di dalam LXC, Anda harus mengaktifkan **Nesting**:
1. Setelah CT dibuat (jangan di-start dulu), pilih CT tersebut.
2. Buka tab **Options** > **Features**.
3. Klik **Edit** dan centang:
   - [x] **Nesting** (Wajib)
   - [x] **FUSE** (Opsional, disarankan untuk storage driver tertentu)
   - [x] **keyctl** (Sering dibutuhkan oleh Docker/Kubernetes)
4. Klik **OK**.
5. Sekarang **Start** container tersebut.

---

## 2. Persiapan di Dalam Container (LXC)

Masuk ke console CT dan jalankan perintah berikut:

### Update Sistem & Install Docker
```bash
apt update && apt upgrade -y
apt install -y ca-certificates curl gnupg git

# Tambah GPG key resmi Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Tambah Repository Docker
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

---

## 3. Deployment SIP-Grisa

Langkah selanjutnya sama dengan deployment VPS standar:

```bash
# Persiapan Folder
mkdir -p ~/sip-grisa && cd ~/sip-grisa
git clone -b feat/smart-logic-overhaul-v6 https://github.com/rfypych/SIP-Grisa.git .

# Konfigurasi Env (Sesuaikan Password)
cat <<EOF > .env
GEMINI_API_KEY="ISI_JIKA_ADA"
DB_HOST="db"
DB_USER="root"
DB_PASS="grisa_lxc_2026"
DB_NAME="sip_grisa"
MYSQL_ROOT_PASSWORD="grisa_lxc_2026"
SECRET_KEY="$(openssl rand -hex 16)"
EOF

# Jalankan Deployment
docker compose up -d --build
```

---

## 4. Tips & Troubleshooting (LXC)

- **Build Gagal/Stuck**: Membangun image backend (dlib) di LXC terkadang membutuhkan `SWAP`. Jika RAM LXC penuh, pastikan host Proxmox memiliki swap yang cukup atau naikkan alokasi RAM CT.
- **Privileged vs Unprivileged**: Disarankan menggunakan **Unprivileged Container** (default Proxmox) demi keamanan. Nesting tetap akan bekerja selama fitur tersebut diaktifkan di tab Options.
- **Storage Driver**: Jika Docker gagal start, pastikan storage driver LXC menggunakan `overlay2`. Anda bisa mengeceknya dengan `docker info | grep Storage`.

Akses aplikasi melalui: `http://[IP_LXC_ANDA]`
