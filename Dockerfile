# ================================================================
# Dockerfile — SIP Grisa Backend (FastAPI + Face Recognition)
# ================================================================
# Menggunakan image Ubuntu yang kompatibel dengan dlib/cmake
FROM python:3.11-slim-bullseye

WORKDIR /app

# Install system dependencies (dlib & face-recognition membutuhkan cmake + compiler)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    libgtk-3-dev \
    libboost-all-dev \
    libjpeg-dev \
    libpng-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Salin seluruh kode backend
COPY api.py .
COPY database.py .
COPY core_face_recognition.py .

# Buat folder data yang diperlukan
RUN mkdir -p data/sounds data/faces temp_uploads

# Expose port API
EXPOSE 8000

# Jalankan FastAPI dengan Uvicorn
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
