# ================================================================
# STAGE 1: Builder
# ================================================================
FROM python:3.11-slim-bullseye AS builder

WORKDIR /build

# Install system dependencies needed for building dlib
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

# Install Python dependencies into a temporary directory
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --prefix=/install -r requirements.txt

# ================================================================
# STAGE 2: Production
# ================================================================
FROM python:3.11-slim-bullseye

WORKDIR /app

# Install ONLY runtime dependencies (libraries needed by opencv/dlib)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libopenblas0 \
    liblapack3 \
    libx11-6 \
    libgtk-3-0 \
    libboost-python1.74.0 \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed python packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY api.py .
COPY database.py .
COPY core_face_recognition.py .

# Create necessary directories and set permissions
RUN mkdir -p data/photos data/sounds temp_uploads && \
    chmod -R 777 data temp_uploads

# Expose port
EXPOSE 8000

# Production-ready Uvicorn command (multiple workers for concurrency)
# Note: Face recognition is CPU intensive, so we limit workers to avoid overloading
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--no-access-log"]
