# SIP Grisa All-in-One Start Script
# Dibuat untuk Windows (PowerShell)

$ErrorActionPreference = "Stop"

function Write-Header($text) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  $text" -ForegroundColor White -Bold
    Write-Host "========================================`n" -ForegroundColor Cyan
}

Write-Header "PENGECEKAN DEPENDENSI SIP GRISA"

# 1. Cek Python
try {
    $pythonVer = python --version 2>&1
    Write-Host "[OK] Python ditemukan: $pythonVer" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Python tidak ditemukan! Sila install Python 3.10+ terlebih dahulu." -ForegroundColor Red
    exit
}

# 2. Cek Node.js
try {
    $nodeVer = node --version 2>&1
    Write-Host "[OK] Node.js ditemukan: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js tidak ditemukan! Sila install Node.js (LTS recommended) terlebih dahulu." -ForegroundColor Red
    exit
}

# 3. Install/Update Python Dependencies
Write-Host "`n[1/2] Menyiapkan Backend (Python dependencies)..." -ForegroundColor Yellow
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

# 4. Install Frontend Dependencies (jika belum ada)
Write-Host "[2/2] Menyiapkan Frontend (Node dependencies)..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "node_modules tidak ditemukan. Menjalankan npm install..." -ForegroundColor Gray
    npm install
} else {
    Write-Host "node_modules sudah ada. Lewati instalasi." -ForegroundColor Gray
}

Write-Header "MENJALANKAN SISTEM SIP GRISA"

# 5. Jalankan Backend di Window Terpisah
Write-Host "-> Menjalankan Backend di window baru (Port 8000)..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/c title SIP-GRISA-BACKEND & uvicorn api:app --host 0.0.0.0 --port 8000"

# 6. Jalankan Frontend di Window Ini
Write-Host "-> Menjalankan Frontend di window ini (Port 3001)..." -ForegroundColor Green
Write-Host "Silahkan tunggu sebentar hingga server Vite aktif...`n" -ForegroundColor Gray

npm run dev
