#!/bin/bash

# SIP Grisa All-in-One Start Script for Linux/macOS
# Usage: chmod +x start.sh && ./start.sh

# Function to print headers
print_header() {
    echo -e "\n\033[1;36m========================================\033[0m"
    echo -e "\033[1;37m  $1\033[0m"
    echo -e "\033[1;36m========================================\033[0m\n"
}

print_header "PENGECEKAN DEPENDENSI SIP GRISA"

# 1. Check Python
if command -v python3 &>/dev/null; then
    echo -e "\033[0;32m[OK]\033[0m Python 3 ditemukan: $(python3 --version)"
else
    echo -e "\033[0;31m[ERROR]\033[0m Python 3 tidak ditemukan! Sila install Python 3.10+."
    exit 1
fi

# 2. Check Node.js
if command -v node &>/dev/null; then
    echo -e "\033[0;32m[OK]\033[0m Node.js ditemukan: $(node --version)"
else
    echo -e "\033[0;31m[ERROR]\033[0m Node.js tidak ditemukan! Sila install Node.js."
    exit 1
fi

# 3. Setup Backend
echo -e "\n\033[0;33m[1/2] Menyiapkan Backend (Python dependencies)...\033[0m"
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt

# 4. Setup Frontend
echo -e "\033[0;33m[2/2] Menyiapkan Frontend (Node dependencies)...\033[0m"
if [ ! -d "node_modules" ]; then
    echo "node_modules tidak ditemukan. Menjalankan npm install..."
    npm install
else
    echo "node_modules sudah ada. Lewati instalasi."
fi

print_header "MENJALANKAN SISTEM SIP GRISA"

# 5. Cleanup on exit
cleanup() {
    echo -e "\n\033[0;31m[INFO]\033[0m Menutup semua servis..."
    kill $BACKEND_PID
    exit
}
trap cleanup SIGINT

# 6. Run Backend
echo -e "\033[0;32m-> Menjalankan Backend (Port 8000)...\033[0m"
python3 -m uvicorn api:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# 7. Run Frontend
echo -e "\033[0;32m-> Menjalankan Frontend (Port 3001)...\033[0m"
echo -e "\033[0;90mTekan Ctrl+C untuk berhenti.\033[0m\n"
npm run dev
