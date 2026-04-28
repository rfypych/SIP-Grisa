import os
from fastapi import FastAPI, UploadFile, File, Form, WebSocket, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from database import pwd_context
import shutil
import asyncio
import uuid
import json
from google import genai
from dotenv import load_dotenv
from PIL import Image
import io

load_dotenv()

# JWT Configuration
SECRET_KEY = "grisa-presence-super-secret-key-2026-xyz" # Sebaiknya di .env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 jam

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")
import database
import pymysql
import httpx

class ManualAttendance(BaseModel):
    employee_id: str
    date: str
    status: str

class AISettings(BaseModel):
    tolerance: float

class SystemSettings(BaseModel):
    cooldown_seconds: int
    min_gap_minutes: int
    checkout_start_hour: Optional[int] = 8
    program_start_date: str
    success_sound_url: str
    success_sound_enabled: bool
    export_location: str
    export_signature_enabled: bool
    export_signature_name: str
    export_signature_role: str
    alpha_limit_time: str
    presence_limit_time: str
    check_in_open_time: Optional[str] = '07:00'
    google_api_key: Optional[str] = None
    test_mode: Optional[int] = 0
    test_cooldown_seconds: Optional[int] = 0
    test_min_gap_minutes: Optional[int] = 0
    test_presence_limit_time: Optional[str] = '14:00'
    test_check_in_open_time: Optional[str] = '07:00'
    presence_limit_enabled: Optional[int] = 1
    test_presence_limit_enabled: Optional[int] = 1
    enforce_min_gap: Optional[int] = 0
    test_enforce_min_gap: Optional[int] = 0

class FaceCropRequest(BaseModel):
    image: str

class AdminUser(BaseModel):
    id: Optional[int] = None
    username: str
    role: str # superadmin, admin, kiosk
    password: Optional[str] = None

class Holiday(BaseModel):
    id: Optional[int] = None
    holiday_date: str
    description: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class AIProcessRequest(BaseModel):
    image: str # Base64 string

class AIAttendanceItem(BaseModel):
    name: str
    date: str
    status: str # hadir, sakit, izin, dlibur, dinas, alfa
    time: Optional[str] = None # HH:MM

class AICommitRequest(BaseModel):
    items: List[AIAttendanceItem]

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_external_holidays(year: int, month: Optional[int] = None):
    url = f"https://libur.deno.dev/api"
    params = {"year": year}
    if month:
        params["month"] = month
        
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, timeout=5.0)
            if response.status_code == 200:
                data = response.json()
                # API mengembalikan list of objects {date, name}
                return data
        except Exception as e:
            print(f"[ERROR] Gagal sinkronisasi API Libur: {e}")
    return []

# --- DEPENDENCIES ---
async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    conn = database.get_db_connection()
    try:
        # Assuming conn.execute().fetchone() returns a dict-like object
        admin = conn.execute("SELECT id, username, role FROM admins WHERE username = %s", (username,)).fetchone()
        if admin is None:
            raise credentials_exception
        return AdminUser(id=admin['id'], username=admin['username'], role=admin['role'])
    finally:
        conn.close()

async def get_superadmin(current_user: AdminUser = Depends(get_current_user)):
    if current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Hanya Super Admin yang diizinkan")
    return current_user

async def get_admin(current_user: AdminUser = Depends(get_current_user)):
    # Admin atau SuperAdmin diperbolehkan
    if current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(status_code=403, detail="Hanya Admin yang diizinkan")
    return current_user

async def get_kiosk(current_user: AdminUser = Depends(get_current_user)):
    # Kiosk, Admin, atau SuperAdmin diperbolehkan (biasanya Kiosk di gerbang khusus)
    if current_user.role not in ["superadmin", "admin", "kiosk"]:
        raise HTTPException(status_code=403, detail="Akses ditolak")
    return current_user

# --- LOGGING HELPER ---
async def log_system_action(admin_id: Optional[int], action: str, details: str, request: Request = None):
    ip = request.client.host if request else "system"
    conn = database.get_db_connection()
    try:
        conn.execute(
            "INSERT INTO system_logs (admin_id, action, details, ip_address) VALUES (%s, %s, %s, %s)",
            (admin_id, action, details, ip)
        )
        conn.commit()
    except Exception as e:
        print(f"[LOG ERROR] {e}")
    finally:
        conn.close()

# Import core pengenal wajah kita
from core_face_recognition import FaceAttendanceSystem

app = FastAPI(title="Backend API SIP Grisa")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("data/photos", exist_ok=True)
os.makedirs("data/sounds", exist_ok=True)
photo_dir = "data/photos"
# Menggunakan /api/images agar tidak merusak frontend yang memanggil /api/images/
app.mount("/api/images", StaticFiles(directory="data/photos"), name="images")
app.mount("/api/sounds", StaticFiles(directory="data/sounds"), name="sounds")

face_system = FaceAttendanceSystem()

@app.get("/")
def read_root():
    return {"status": "ok", "message": "SIP Grisa Backend with SQLite is Running!"}

@app.get("/api/employees")
def get_employees(current_user: AdminUser = Depends(get_kiosk)):
    conn = database.get_db_connection()
    employees = conn.execute("SELECT * FROM employees").fetchall()
    conn.close()
    return [dict(ix) for ix in employees]

# --- AUTH ENDPOINTS ---

@app.post("/api/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = database.get_db_connection()
    user = conn.execute("SELECT * FROM admins WHERE username = %s", (form_data.username,)).fetchone()
    conn.close()
    
    if not user or not pwd_context.verify(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"], "role": user["role"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user["role"]}

@app.get("/api/auth/me")
async def get_me(current_user: AdminUser = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "role": current_user.role
    }

# --- ADMIN MANAGEMENT (Super Admin Only) ---

@app.get("/api/admin/users")
async def list_admins(current_user: AdminUser = Depends(get_superadmin)):
    conn = database.get_db_connection()
    admins = conn.execute("SELECT id, username, role FROM admins").fetchall()
    conn.close()
    return admins

@app.post("/api/admin/users")
async def create_admin(user_data: AdminUser, request: Request, current_user: AdminUser = Depends(get_superadmin)):
    conn = database.get_db_connection()
    try:
        hashed = pwd_context.hash(user_data.password)
        conn.execute(
            "INSERT INTO admins (username, password, role) VALUES (%s, %s, %s)",
            (user_data.username, hashed, user_data.role)
        )
        conn.commit()
        
        await log_system_action(
            current_user.id, 
            "CREATE_ADMIN", 
            f"Membuat akun {user_data.username} dengan role {user_data.role}", 
            request
        )
        
        return {"status": "success", "message": f"Admin {user_data.username} berhasil dibuat"}
    except Exception as e:
        if "Duplicate entry" in str(e):
            raise HTTPException(status_code=400, detail="Username sudah digunakan")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.delete("/api/admin/users/{admin_id}")
async def delete_admin(admin_id: int, request: Request, current_user: AdminUser = Depends(get_superadmin)):
    conn = database.get_db_connection()
    try:
        if admin_id == current_user.id:
            raise HTTPException(status_code=400, detail="Tidak dapat menghapus akun sendiri")
        
        # Ambil username sebelum dihapus untuk log
        adr = conn.execute("SELECT username FROM admins WHERE id=%s", (admin_id,)).fetchone()
        if not adr:
            raise HTTPException(status_code=404, detail="Akun tidak ditemukan")
            
        target_username = adr['username']
        
        # Proteksi Admin Default
        if target_username == "grisa_super_admin_2026":
            raise HTTPException(status_code=400, detail="Tidak dapat menghapus Akun Utama Sistem")

        conn.execute("DELETE FROM admins WHERE id = %s", (admin_id,))
        conn.commit()
        
        await log_system_action(
            current_user.id, 
            "DELETE_ADMIN", 
            f"Menghapus akun {target_username}", 
            request
        )
        
        return {"status": "success", "message": "Akun administrator berhasil dihapus"}
    finally:
        conn.close()

@app.put("/api/admin/users/{admin_id}")
async def update_admin(admin_id: int, user_data: AdminUser, request: Request, current_user: AdminUser = Depends(get_superadmin)):
    conn = database.get_db_connection()
    try:
        # Cek eksistensi
        existing = conn.execute("SELECT username, role FROM admins WHERE id=%s", (admin_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Akun tidak ditemukan")
            
        # Proteksi Role Admin Default
        if existing['username'] == "grisa_super_admin_2026" and user_data.role != "superadmin":
            raise HTTPException(status_code=400, detail="Role Akun Utama Sistem tidak dapat diubah")

        # Update Dasar
        if user_data.password:
            hashed = pwd_context.hash(user_data.password)
            conn.execute(
                "UPDATE admins SET username=%s, password=%s, role=%s WHERE id=%s",
                (user_data.username, hashed, user_data.role, admin_id)
            )
        else:
            conn.execute(
                "UPDATE admins SET username=%s, role=%s WHERE id=%s",
                (user_data.username, user_data.role, admin_id)
            )
            
        conn.commit()
        
        await log_system_action(
            current_user.id, 
            "UPDATE_ADMIN", 
            f"Memperbarui akun {user_data.username} (Role: {user_data.role})", 
            request
        )
        
        return {"status": "success", "message": "Akun administrator berhasil diperbarui"}
    except Exception as e:
        if "Duplicate entry" in str(e):
            raise HTTPException(status_code=400, detail="Username sudah digunakan")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# --- PROTECTED CORE ENDPOINTS ---

@app.post("/api/enroll")
async def enroll_new_face(
    id: str = Form(...),
    name: str = Form(...),
    role: str = Form(...),
    photoUrl: str = Form(...), 
    files: List[UploadFile] = File(...),
    request: Request = None,
    current_user: AdminUser = Depends(get_admin)
):
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    
    success_count = 0
    errors = []
    temp_file_path = None
    
    try:
        for file in files:
            temp_file_path = f"{temp_dir}/{uuid.uuid4().hex}_{id}.jpg" # Selalu .jpg
            with open(temp_file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
                
            # core_face_recognition.py akan melakukan resize dan overwrite temp_file_path
            # Karena path berakhir .jpg, cv2.imwrite akan menyimpannya sebagai JPEG
            success = face_system.enroll_face(temp_file_path, id)
            
            if success:
                success_count += 1
                # Simpan foto terakhir sebagai foto profil utama di UI
                final_file_name = f"{id}.jpg"
                final_file_path = os.path.join(photo_dir, final_file_name)
                # Overwrite foto lama dengan yang terbaru
                shutil.copy2(temp_file_path, final_file_path)
                
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path) # Bersihkan temp
            temp_file_path = None

        if success_count > 0:
            # Upsert biodata pegawai di Database
            conn = database.get_db_connection()
            try:
                # Cek apakah id sudah ada
                existing = conn.execute("SELECT id FROM employees WHERE id=%s", (id,)).fetchone()
                if not existing:
                    conn.execute(
                        "INSERT INTO employees (id, name, role, photoUrl) VALUES (%s, %s, %s, %s)",
                        (id, name, role, f"/api/images/{id}.jpg") # Pakai path local
                    )
                else:
                    conn.execute(
                        "UPDATE employees SET name=%s, role=%s, photoUrl=%s WHERE id=%s",
                        (name, role, f"/api/images/{id}.jpg", id)
                    )
                conn.commit()
            finally:
                conn.close()
            
            return {"status": "success", "message": f"Berhasil mendaftarkan {success_count} foto untuk {name}"}
        else:
            raise Exception("Gagal mengenali wajah dalam foto yang diunggah.")
            
    except Exception as outer_e:
        print(f"[CRITICAL ERROR] enroll_new_face crashed: {outer_e}")
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=str(outer_e))

@app.delete("/api/employees/{employee_id}")
async def delete_employee(employee_id: str, request: Request, current_user: AdminUser = Depends(get_admin)):
    print(f"[DEBUG] Menghapus pegawai ID: {employee_id}")
    conn = database.get_db_connection()
    try:
        # Cek eksistensi secara eksplisit
        emp = conn.execute("SELECT id, name FROM employees WHERE id=%s", (employee_id,)).fetchone()
        if not emp:
            print(f"[DEBUG] Pegawai {employee_id} tidak ditemukan di database.")
            raise HTTPException(status_code=404, detail=f"Pegawai dengan ID {employee_id} tidak ditemukan.")
            
        name = emp["name"]
        
        # 1. Hapus dari Database employees
        conn.execute("DELETE FROM employees WHERE id=%s", (employee_id,))
        # 2. Hapus dari Database attendance
        conn.execute("DELETE FROM attendance WHERE employee_id=%s", (employee_id,))
        conn.commit()
        
        # 3. Hapus dari Face Recognition System (Memory & Disk pkl)
        face_system.remove_face(employee_id)
        
        # 4. Hapus File Foto dari Disk
        photo_path = os.path.join(photo_dir, f"{employee_id}.jpg")
        if os.path.exists(photo_path):
            os.remove(photo_path)
            print(f"[DEBUG] File foto {photo_path} dihapus.")
            
        await log_system_action(current_user.id, "DELETE_EMPLOYEE", f"Menghapus pegawai: {name} ({employee_id})", request)
            
        return {"status": "success", "message": f"Pegawai {name} ({employee_id}) berhasil dihapus."}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Delete Failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()



@app.get("/api/reports")
async def get_live_reports(month: int, year: int, current_user: AdminUser = Depends(get_admin)):
    conn = database.get_db_connection()
    try:
        employees = conn.execute("SELECT * FROM employees").fetchall()
        
        report_data = []
        for emp in employees:
            # Pastikan emp adalah dict (karena DictCursor)
            emp_id = str(emp['id'])
            
            records_query = conn.execute(
                "SELECT * FROM attendance WHERE employee_id=%s AND date LIKE %s", 
                (emp_id, f"{year}-{str(month).zfill(2)}-%")
            ).fetchall()
            
            # Format records dictionary harian
            records_dict = {}
            for r in records_query:
                try:
                    # Kadang MySQL mengembalikan string, kadang objek date tergantung driver/as_string
                    # r['date'] kita VARCHAR, jadi harusnya string %Y-%m-%d
                    date_str = str(r['date'])
                    day = int(date_str.split('-')[2])
                    records_dict[str(day)] = {"masuk": r['check_in'], "pulang": r['check_out'], "status": r['status']}
                except Exception as e_row:
                    print(f"[DEBUG] Error parsing row {r}: {e_row}")
                    continue

            # Hitung ringkasan status
            hadir_count = sum(1 for r in records_query if r['status'] == 'hadir')
            sakit_count = sum(1 for r in records_query if r['status'] == 'sakit')
            izin_count = sum(1 for r in records_query if r['status'] == 'izin')
            dinas_count = sum(1 for r in records_query if r['status'] == 'dinas')
            
            # Alpha = Total Hari Kerja - (Hadir + Sakit + Izin + Dinas)
            alfa_count = sum(1 for r in records_query if r['status'] == 'alfa')
            
            report_data.append({
                "id": emp['id'],
                "nama": emp['name'],
                "role": emp['role'],
                "photoUrl": emp['photoUrl'],
                "kehadiran": records_dict,
                "summary": {
                    "hadir": hadir_count, 
                    "sakit": sakit_count, 
                    "izin": izin_count + dinas_count, 
                    "cuti": 0, 
                    "alpha": alfa_count
                }
            })
        
        return {"status": "success", "data": report_data}
    except Exception as e:
        print(f"[ERROR] API Reports Failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/api/attendance/manual")
async def record_manual_attendance(data: ManualAttendance, request: Request, current_user: AdminUser = Depends(get_admin)):
    conn = database.get_db_connection()
    try:
        # Cek apakah sudah ada absen di tanggal tersebut
        existing = conn.execute(
            "SELECT id FROM attendance WHERE employee_id=%s AND date=%s", 
            (data.employee_id, data.date)
        ).fetchone()
        
        if existing:
            # Update status (misal tadinya Alfa atau Hadir, diubah ke Sakit/Izin)
            conn.execute(
                "UPDATE attendance SET status=%s, check_in=NULL, check_out=NULL WHERE employee_id=%s AND date=%s",
                (data.status, data.employee_id, data.date)
            )
        else:
            # Insert baru (Sakit/Izin/Dinas)
            conn.execute(
                "INSERT INTO attendance (employee_id, date, status) VALUES (%s, %s, %s)",
                (data.employee_id, data.date, data.status)
            )
        conn.commit()
        
        # Broadcast ke dashboard biar grafik terupdate real-time
        await manager.broadcast({"event": "MANUAL_ATTENDANCE_UPDATE"})
        
        await log_system_action(
            current_user.id, 
            "MANUAL_ATTENDANCE", 
            f"Setel status {data.status} untuk ID {data.employee_id} pada {data.date}", 
            request
        )
        
        return {"status": "success", "message": f"Kehadiran berhasil dicatat sebagai {data.status}."}
    except Exception as e:
        print(f"[ERROR] Manual Attendance Failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.delete("/api/attendance")
async def delete_attendance(employee_id: str, date: str, request: Request, current_user: AdminUser = Depends(get_admin)):
    conn = database.get_db_connection()
    try:
        # Hapus record presensi untuk karyawan dan tanggal tertentu
        conn.execute(
            "DELETE FROM attendance WHERE employee_id=%s AND date=%s",
            (employee_id, date)
        )
        conn.commit()
        
        # Broadcast agar dashboard update
        await manager.broadcast({"event": "MANUAL_ATTENDANCE_UPDATE"})
        
        await log_system_action(
            current_user.id, 
            "DELETE_ATTENDANCE", 
            f"Mencopot status presensi ID {employee_id} pada tanggal {date}", 
            request
        )
        
        return {"status": "success", "message": "Status presensi berhasil dicopot."}
    except Exception as e:
        print(f"[ERROR] Delete Attendance Failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# --- SYSTEM SETTINGS ENDPOINTS ---

@app.get("/api/settings")
async def get_system_settings(current_user: AdminUser = Depends(get_kiosk)):
    conn = database.get_db_connection()
    try:
        settings = conn.execute("SELECT * FROM system_settings WHERE id = 1").fetchone()
        return settings
    finally:
        conn.close()

@app.post("/api/settings")
async def update_settings(settings: SystemSettings, request: Request, current_user: AdminUser = Depends(get_current_user)):
    conn = database.get_db_connection()
    try:
        settings_dict = settings.dict()
        print(f"DEBUG: Updating settings: {settings_dict}")
        
        # Check if cooldown_seconds is being updated and broadcast if so
        if "cooldown_seconds" in settings_dict:
            await manager.broadcast({"event": "SETTINGS_UPDATE", "setting": "cooldown_seconds", "value": settings.cooldown_seconds})
            print(f"DEBUG: Broadcasted cooldown_seconds update: {settings.cooldown_seconds}")

        conn.execute(
            """
            UPDATE system_settings SET 
            cooldown_seconds=%s, min_gap_minutes=%s, checkout_start_hour=%s, program_start_date=%s, 
            success_sound_url=%s, success_sound_enabled=%s,
            export_location=%s, export_signature_enabled=%s, export_signature_name=%s, export_signature_role=%s,
            alpha_limit_time=%s, presence_limit_time=%s, check_in_open_time=%s, google_api_key=%s, test_mode=%s,
            test_cooldown_seconds=%s, test_min_gap_minutes=%s, test_presence_limit_time=%s, test_check_in_open_time=%s,
            presence_limit_enabled=%s, test_presence_limit_enabled=%s, enforce_min_gap=%s, test_enforce_min_gap=%s
            WHERE id=1
            """,
            (
                settings.cooldown_seconds, settings.min_gap_minutes, settings.checkout_start_hour, settings.program_start_date, 
                settings.success_sound_url, 1 if settings.success_sound_enabled else 0,
                settings.export_location, 1 if settings.export_signature_enabled else 0, settings.export_signature_name, settings.export_signature_role,
                settings.alpha_limit_time, settings.presence_limit_time, settings.check_in_open_time or '07:00',
                settings.google_api_key, settings.test_mode,
                settings.test_cooldown_seconds, settings.test_min_gap_minutes, settings.test_presence_limit_time, settings.test_check_in_open_time,
                1 if settings.presence_limit_enabled else 0, 1 if settings.test_presence_limit_enabled else 0,
                1 if settings.enforce_min_gap else 0, 1 if settings.test_enforce_min_gap else 0
            )
        )
        conn.commit()
        
        await log_system_action(current_user.id, "UPDATE_SETTINGS", "Memperbarui pengaturan sistem/ekspor", request)
        
        return {"status": "success", "message": "Pengaturan sistem berhasil diperbarui"}
    finally:
        conn.close()

@app.post("/api/settings/sound")
async def upload_success_sound(file: UploadFile = File(...), current_user: AdminUser = Depends(get_admin)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    file_extension = file.filename.split('.')[-1].lower()
    if file_extension not in ['mp3', 'wav', 'ogg']:
        raise HTTPException(status_code=400, detail="Invalid file type. Only MP3, WAV, OGG allowed.")
        
    filename = f"custom_sound_{uuid.uuid4().hex[:8]}.{file_extension}"
    filepath = os.path.join("data/sounds", filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    url = f"/api/sounds/{filename}"
    return {"status": "success", "url": url}

@app.get("/api/settings/ai")
async def get_ai_settings(current_user: AdminUser = Depends(get_admin)):
    tolerance = face_system.config.get("tolerance", 0.6)
    return {"status": "success", "tolerance": tolerance}

@app.post("/api/settings/ai")
async def update_ai_settings(settings: AISettings, request: Request, current_user: AdminUser = Depends(get_admin)):
    face_system.config["tolerance"] = settings.tolerance
    import json
    with open(face_system.config_path, "w") as f:
        json.dump(face_system.config, f)
    await log_system_action(current_user.id, "UPDATE_AI_SETTINGS", f"Mengubah AI Tolerance ke {settings.tolerance}", request)
    return {"status": "success", "message": "Pengaturan AI berhasil diperbarui", "tolerance": settings.tolerance}

import face_recognition
import numpy as np
import cv2
import base64

@app.post("/api/detect_crop")
async def detect_and_crop_face(request: FaceCropRequest, current_user: AdminUser = Depends(get_admin)):
    try:
        # Decode base64
        header, encoded = request.image.split(",", 1)
        image_data = base64.b64decode(encoded)
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Convert to RGB for face_recognition
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Find face
        face_locations = face_recognition.face_locations(rgb_img)
        
        if not face_locations:
            raise HTTPException(status_code=400, detail="Wajah tidak ditemukan dalam foto.")
            
        # Ambil wajah pertama
        top, right, bottom, left = face_locations[0]
        
        # Tambahkan padding (e.g. 20% dari tinggi/lebar)
        padding_h = int((bottom - top) * 0.4)
        padding_w = int((right - left) * 0.4)
        
        new_top = max(0, top - padding_h)
        new_bottom = min(img.shape[0], bottom + padding_h)
        new_left = max(0, left - padding_w)
        new_right = min(img.shape[1], right + padding_w)
        
        crop_img = img[new_top:new_bottom, new_left:new_right]
        
        # Encode back to base64
        _, buffer = cv2.imencode('.jpg', crop_img, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
        crop_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return {
            "status": "success",
            "image": f"data:image/jpeg;base64,{crop_base64}"
        }
    except Exception as e:
        print(f"[CROP ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard/stats")
async def get_dashboard_stats(current_user: AdminUser = Depends(get_admin)):
    conn = database.get_db_connection()
    try:
        now = datetime.now()
        month = now.month
        year = now.year
        
        # Helper untuk hitung total status per bulan
        def get_monthly_count(m, y):
            q = f"{y}-{str(m).zfill(2)}-%"
            res = conn.execute("SELECT status, COUNT(*) as count FROM attendance WHERE date LIKE %s GROUP BY status", (q,)).fetchall()
            counts = {"hadir": 0, "sakit": 0, "izin": 0, "dinas": 0}
            for row in res:
                counts[row['status'].lower()] = row['count']
            return counts

        # Bulan Ini
        curr_counts = get_monthly_count(month, year)
        # Bulan Lalu
        prev_month = 12 if month == 1 else month - 1
        prev_year = year - 1 if month == 1 else year
        prev_counts = get_monthly_count(prev_month, prev_year)

        # Hitung Tren (%)
        def calc_trend(curr, prev):
            if prev == 0: return 0 if curr == 0 else 100
            return round(((curr - prev) / prev) * 100, 1)

        trends = {
            "hadir": calc_trend(curr_counts['hadir'], prev_counts['hadir']),
            "sakit": calc_trend(curr_counts['sakit'], prev_counts['sakit']),
            "izin": calc_trend(curr_counts['izin'] + curr_counts['dinas'], prev_counts['izin'] + prev_counts['dinas']),
            # Alpha dihitung sederhana harian (opsional, sementara 0)
            "alpha": 0
        }

        # Summary Hari Ini (tetap pakai data hari ini untuk angka utama)
        today = now.strftime("%Y-%m-%d")
        employees_count = conn.execute("SELECT COUNT(*) as count FROM employees").fetchone()["count"]
        today_res = conn.execute("SELECT status, COUNT(*) as count FROM attendance WHERE date=%s GROUP BY status", (today,)).fetchall()
        t_counts = {"hadir": 0, "sakit": 0, "izin": 0, "dinas": 0}
        for row in today_res:
            t_counts[row['status'].lower()] = row['count']
            
        hadir_today = t_counts['hadir']
        sakit_today = t_counts['sakit']
        izin_today = t_counts['izin'] + t_counts['dinas']
        alpha_today = max(0, employees_count - (hadir_today + sakit_today + izin_today))

        return {
            "status": "success",
            "summary": { "hadir": hadir_today, "sakit": sakit_today, "izin": izin_today, "alpha": alpha_today },
            "trends": trends
        }
    except Exception as e:
        print(f"[ERROR] Stats Failed: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        conn.close()

# --- AI ASSISTANT ENDPOINTS (Gemini Vision) ---

@app.post("/api/ai/process_attendance")
async def process_ai_attendance(request: AIProcessRequest, current_user: AdminUser = Depends(get_admin)):
    try:
        # 1. Setup Gemini Client - Priority: Database -> .env
        conn = database.get_db_connection()
        settings = conn.execute("SELECT google_api_key FROM system_settings WHERE id=1").fetchone()
        conn.close()
        
        api_key = settings['google_api_key'] if settings and settings['google_api_key'] else os.getenv("GEMINI_API_KEY")
        
        if not api_key:
            raise HTTPException(status_code=500, detail="Gemini API Key tidak ditemukan. Silakan setel di Pengaturan.")
            
        client = genai.Client(api_key=api_key)
        
        # 2. Decode Base64 Image
        header, encoded = request.image.split(",", 1)
        image_data = base64.b64decode(encoded)
        image_pil = Image.open(io.BytesIO(image_data))
        
        # 3. Prompt Strategis
        prompt = """
        Analyze this photo of a manual attendance sheet. 
        Extract a list of attendance records in JSON format.
        
        Rules:
        1. Identify the 'Name' or 'Nama' of each person.
        2. Identify the 'Date' (format it as YYYY-MM-DD). If year/month is missing, use current year/month.
        3. Identify the 'Status' (map it to: 'hadir', 'sakit', 'izin', or 'alfa').
        4. Extract the 'Time' (Clock-in time) if available in format HH:MM.
        
        Output format:
        [
          {"name": "Budi Santoso", "date": "2026-03-21", "status": "hadir", "time": "07:15"},
          ...
        ]
        Only return the JSON array string.
        """
        
        # 4. Call Gemini
        # Menggunakan gemini-flash-latest karena sudah terverifikasi sukses di test
        response = client.models.generate_content(
            model="gemini-flash-latest", 
            contents=[prompt, image_pil]
        )
        
        # 5. Parse Response
        try:
            # Clean response text (remove ```json ... ```)
            clean_text = response.text.strip().replace("```json", "").replace("```", "").strip()
            parsed_data = json.loads(clean_text)
            return {"status": "success", "data": parsed_data}
        except Exception as parse_e:
            print(f"[AI PARSE ERROR] {parse_e}\nRaw Output: {response.text}")
            return {"status": "partial_success", "raw_text": response.text, "message": "Gagal parsing JSON otomatis."}
            
    except Exception as e:
        print(f"[AI ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/commit_attendance")
async def commit_ai_attendance(data: AICommitRequest, request: Request, current_user: AdminUser = Depends(get_admin)):
    conn = database.get_db_connection()
    success_count = 0
    errors = []
    
    try:
        for item in data.items:
            # 1. Cari employee_id berdasarkan nama (pencarian fuzzy ringan atau exact)
            emp = conn.execute("SELECT id FROM employees WHERE name LIKE %s", (f"%{item.name}%",)).fetchone()
            
            if not emp:
                errors.append(f"Pegawai '{item.name}' tidak ditemukan di database.")
                continue
            
            emp_id = emp['id']
            
            # 2. Update/Insert ke attendance
            existing = conn.execute(
                "SELECT id FROM attendance WHERE employee_id=%s AND date=%s", 
                (emp_id, item.date)
            ).fetchone()
            
            if existing:
                conn.execute(
                    "UPDATE attendance SET status=%s, check_in=%s WHERE employee_id=%s AND date=%s" ,
                    (item.status, item.time, emp_id, item.date)
                )
            else:
                conn.execute(
                    "INSERT INTO attendance (employee_id, date, status, check_in) VALUES (%s, %s, %s, %s)",
                    (emp_id, item.date, item.status, item.time)
                )
            success_count += 1
            
        conn.commit()
        
        # Simpan rincian perubahan ke log sistem dalam format yang bisa dilihat nanti
        log_details = {
            "summary": f"Proses otomatis {success_count} data kehadiran",
            "items": [
                {"nama": item.name, "tanggal": item.date, "status": item.status} 
                for item in data.items
            ],
            "errors": errors
        }
        
        await log_system_action(
            current_user.id, 
            "AI_AUTOMATION", 
            json.dumps(log_details), 
            request
        )
        
        return {
            "status": "success", 
            "message": f"Berhasil memproses {success_count} data.",
            "errors": errors
        }
        
    except Exception as e:
        print(f"[AI COMMIT ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

import base64
import cv2
import numpy as np

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()
# Simpan waktu deteksi terakhir per ID untuk cooldown (mencegah spam/accidental)
kiosk_cooldowns = {}

@app.websocket("/ws/kiosk")
async def websocket_kiosk_endpoint(websocket: WebSocket):
    # Dapatkan token dari kueri parameter jika ada (opsional untuk sekarang, atau gunakan auth di dlm loop)
    # Untuk sementara kita asumsikan device sudah login via HTTP dan store token di localStorage
    # Tapi WebSocket di App.tsx saat ini tidak mengirim token.
    # Namun, kita mau mencatat 'recorded_by'.
    # Kita bisa asumsikan setiap gerbang punya ID unik yang dikirim saat connect atau via pesan pertama.
    
    await manager.connect(websocket)
    gate_admin_id = None
    
    try:
        while True:
            data = await websocket.receive_json()
            
            # Mendukung pesan 'auth' pertama kali dari Kiosk
            if data.get("type") == "auth":
                token = data.get("token")
                try:
                    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                    username = payload.get("sub")
                    conn = database.get_db_connection()
                    admin = conn.execute("SELECT id FROM admins WHERE username = %s", (username,)).fetchone()
                    if admin:
                        gate_admin_id = admin['id']
                    conn.close()
                except:
                    pass
                continue

            # Mendukung pesan 'reset_attendance' di Test Mode
            if data.get("type") == "reset_attendance":
                conn = database.get_db_connection()
                try:
                    sys_settings = conn.execute("SELECT test_mode FROM system_settings WHERE id=1").fetchone()
                    if sys_settings and sys_settings['test_mode']:
                        target_id = data.get("face_id")
                        today = datetime.now().strftime("%Y-%m-%d")
                        conn.execute("DELETE FROM attendance WHERE employee_id=%s AND date=%s", (target_id, today))
                        conn.commit()
                        if target_id in kiosk_cooldowns:
                            del kiosk_cooldowns[target_id]
                        await websocket.send_json({"event": "searching", "message": f"Data hari ini untuk {target_id} telah di-reset (Test Mode)"})
                finally:
                    conn.close()
                continue

            if data.get("type") == "frame":
                # print(f"DEBUG: Received frame from {data.get('kiosk_name')}")
                payload = data.get("image")
                # Decode base64 ke OpenCV frame
                encoded_data = payload.split(',')[1]
                nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                # Gunakan face_system untuk mendeteksi (dengan to_thread agar tidak memblokir event loop)
                name, face_id, confidence = await asyncio.to_thread(
                    face_system.recognize_single_frame, frame, return_confidence=True
                )
                if face_id and face_id != "Unknown":
                    conn = database.get_db_connection()
                    try:
                        # ── Ambil pengaturan sekali ──────────────────────────────
                        sys_settings = conn.execute("SELECT * FROM system_settings WHERE id=1").fetchone()
                        test_enabled  = sys_settings['test_mode'] if sys_settings else 0
                        
                        if test_enabled:
                            cooldown_val  = sys_settings['test_cooldown_seconds']
                            min_gap_val   = sys_settings['test_min_gap_minutes']
                            open_time_val = (sys_settings['test_check_in_open_time'] or '07:00')
                            limit_val     = (sys_settings['test_presence_limit_time'] or '14:00')
                            limit_enabled = sys_settings['test_presence_limit_enabled']
                            enforce_gap   = sys_settings['test_enforce_min_gap']
                        else:
                            cooldown_val  = sys_settings['cooldown_seconds']
                            min_gap_val   = sys_settings['min_gap_minutes']
                            open_time_val = (sys_settings['check_in_open_time'] or '07:00')
                            limit_val     = (sys_settings['presence_limit_time'] or '14:00')
                            limit_enabled = sys_settings['presence_limit_enabled']
                            enforce_gap   = sys_settings['enforce_min_gap']

                        # ── Waktu referensi (real / simulasi) ────────────────────
                        now = datetime.now()
                        if test_enabled and data.get("simulate_time"):
                            try:
                                now = datetime.strptime(data.get("simulate_time"), "%Y-%m-%d %H:%M:%S")
                            except:
                                pass

                        today    = now.strftime("%Y-%m-%d")
                        time_now = now.strftime("%H:%M")

                        # ── Ambil data karyawan, absensi, & hari libur ────────────────
                        emp_data  = conn.execute("SELECT name FROM employees WHERE id=%s", (face_id,)).fetchone()
                        real_name = emp_data['name'] if emp_data else face_id
                        existing  = conn.execute("SELECT * FROM attendance WHERE employee_id=%s AND date=%s", (face_id, today)).fetchone()
                        
                        # Cek hari libur
                        holiday = conn.execute("SELECT description FROM holidays WHERE holiday_date=%s", (today,)).fetchone()

                        # ── Cooldown per-orang ────────────────────────────────
                        last_seen = kiosk_cooldowns.get(face_id)
                        # Auto-expire: buang entry cooldown yang sudah kadaluarsa
                        if last_seen and (now - last_seen).total_seconds() >= cooldown_val:
                            del kiosk_cooldowns[face_id]
                            last_seen = None
                        remains = cooldown_val - (now - last_seen).total_seconds() if last_seen else 0

                        debug_info = {
                            "confidence": confidence,
                            "cooldown_remains": round(max(0, remains), 1),
                            "test_mode": test_enabled,
                            "simulated": bool(data.get("simulate_time")),
                            "check_in_open_time": open_time_val,
                            "presence_limit_time": limit_val,
                            "presence_limit_enabled": limit_enabled,
                            "enforce_min_gap": enforce_gap,
                            "current_logic_time": time_now,
                            "face_id": face_id,
                            "last_check_in": existing['check_in'] if existing else None,
                            "last_check_out": existing['check_out'] if existing else None,
                        }

                        # ══ COOLDOWN ═════════════════════════════════════════
                        if cooldown_val > 0 and last_seen and remains > 0:
                            await websocket.send_json({"event": "on_cooldown", "face_id": face_id, "debug": debug_info})

                        # ══ HARI LIBUR / AKHIR PEKAN ══════════════════════════
                        elif (holiday or now.weekday() >= 6) and not existing:
                            # 6 = Minggu (Sunday). Jika ingin Sabtu juga: >= 5
                            desc = holiday['description'] if holiday else "Hari Minggu (Libur Akhir Pekan)"
                            await websocket.send_json({
                                "event": "info_holiday", 
                                "name": real_name, 
                                "holiday": desc,
                                "debug": debug_info
                            })
                            pass 

                        # ══ SKENARIO UTAMA ════════════════════════════════════
                        else:
                            kiosk_cooldowns[face_id] = now  # reset cooldown timer

                            # Status khusus (Sakit / Izin / Dinas) — abaikan presensi
                            if existing and existing['status'].lower() in ['sakit', 'izin', 'dinas']:
                                await websocket.send_json({
                                    "event": "blocked_status",
                                    "name": real_name,
                                    "status": existing['status'],
                                    "debug": debug_info
                                })

                            # ── Sudah check-in DAN check-out ──────────────────
                            elif existing and existing['check_in'] and existing['check_out']:
                                await websocket.send_json({
                                    "event": "already_checked_out",
                                    "name": real_name,
                                    "id": face_id,
                                    "check_out": existing['check_out'],
                                    "debug": debug_info
                                })

                            # ── Sudah check-in, belum check-out ───────────────
                            elif existing and existing['check_in'] and not existing['check_out']:
                                check_in_hm = existing['check_in'][:5]  # "HH:MM"
                                # Cek apakah sudah waktunya pulang
                                can_checkout = False
                                try:
                                    # Gunakan helper parsing yang lebih fleksibel
                                    c_time = existing['check_in']
                                    if len(c_time.split(':')) == 2: # HH:MM
                                        check_in_dt = datetime.strptime(f"{today} {c_time}", "%Y-%m-%d %H:%M")
                                    else: # HH:MM:SS atau lainnya
                                        check_in_dt = datetime.strptime(f"{today} {c_time}", "%Y-%m-%d %H:%M:%S")
                                    
                                    minutes_diff = (now - check_in_dt).total_seconds() / 60
                                    
                                    # Logika Cerdas:
                                    # 1. Selalu boleh pulang jika sudah penuhi min_gap
                                    if minutes_diff >= min_gap_val:
                                        can_checkout = True
                                    # 2. Boleh pulang jika sudah jam tutup, KECUALI 'enforce_gap' aktif
                                    elif limit_enabled and time_now >= limit_val:
                                        if not enforce_gap:
                                            can_checkout = True
                                except:
                                    # Fallback sederhana jika parsing gagal
                                    if limit_enabled and time_now >= limit_val and not enforce_gap:
                                        can_checkout = True

                                if can_checkout:
                                    # CHECK-OUT BERHASIL
                                    conn.execute(
                                        "UPDATE attendance SET check_out=%s, recorded_by=%s WHERE employee_id=%s AND date=%s",
                                        (now.strftime("%H:%M:%S"), gate_admin_id, face_id, today)
                                    )
                                    conn.commit()
                                    await manager.broadcast({"event": "NEW_ATTENDANCE", "name": real_name, "id": face_id, "type": "checkout"})
                                    await websocket.send_json({
                                        "event": "checkout_success",
                                        "name": real_name,
                                        "id": face_id,
                                        "check_out": now.strftime("%H:%M:%S"),
                                        "debug": debug_info
                                    })
                                else:
                                    # Sudah masuk tapi belum waktunya pulang
                                    await websocket.send_json({
                                        "event": "already_checkin",
                                        "name": real_name,
                                        "id": face_id,
                                        "check_in": existing['check_in'],
                                        "presence_limit": limit_val,
                                        "debug": debug_info
                                    })

                            # ── Belum ada record hari ini ──────────────────────
                            else:
                                # Jika terlalu awal (sebelum jam buka)
                                if time_now < open_time_val:
                                    await websocket.send_json({
                                        "event": "too_early",
                                        "name": real_name,
                                        "id": face_id,
                                        "open_time": open_time_val,
                                        "debug": debug_info
                                    })
                                # Jika terlalu lambat (lewat jam tutup / batas presensi)
                                elif limit_enabled and time_now > limit_val:
                                    await websocket.send_json({
                                        "event": "too_late",
                                        "name": real_name,
                                        "id": face_id,
                                        "limit_time": limit_val,
                                        "debug": debug_info
                                    })
                                else:
                                    # CHECK-IN BERHASIL
                                    status = "hadir"
                                    try:
                                        conn.execute(
                                            "INSERT INTO attendance (employee_id, date, check_in, status, recorded_by) VALUES (%s, %s, %s, %s, %s)",
                                            (face_id, today, now.strftime("%H:%M:%S"), status, gate_admin_id)
                                        )
                                        conn.commit()
                                        await manager.broadcast({"event": "NEW_ATTENDANCE", "name": real_name, "id": face_id, "type": "checkin", "status": status})
                                        await websocket.send_json({
                                            "event": "checkin_success",
                                            "name": real_name,
                                            "id": face_id,
                                            "type": "checkin",
                                            "status": status,
                                            "check_in": now.strftime("%H:%M:%S"),
                                            "debug": debug_info
                                        })
                                    except Exception as dup_err:
                                        # Race condition: device lain sudah insert duluan (UNIQUE constraint)
                                        # Baca ulang data yang sudah ada dan kirim sebagai already_checkin
                                        print(f"[RACE CONDITION] Duplicate insert for {face_id} on {today}: {dup_err}")
                                        existing_now = conn.execute("SELECT * FROM attendance WHERE employee_id=%s AND date=%s", (face_id, today)).fetchone()
                                        await websocket.send_json({
                                            "event": "already_checkin",
                                            "name": real_name,
                                            "id": face_id,
                                            "check_in": existing_now['check_in'] if existing_now else now.strftime("%H:%M:%S"),
                                            "presence_limit": limit_val,
                                            "debug": debug_info
                                        })
                    finally:
                        conn.close()
                else:
                    await websocket.send_json({"event": "searching"})
                    
            await asyncio.sleep(0.1)
    except Exception as e:
        print(f"Kiosk Error: {e}")
    finally:
        manager.disconnect(websocket)

# --- ENDPOINTS HARI LIBUR ---
@app.get("/api/holidays")
async def get_holidays(year: Optional[int] = None, month: Optional[int] = None, current_user: AdminUser = Depends(get_current_user)):
    conn = database.get_db_connection()
    try:
        query = "SELECT id, holiday_date as date, description as name, type FROM holidays"
        params = []
        if year and month:
            query += " WHERE holiday_date LIKE %s"
            params.append(f"{year}-{str(month).zfill(2)}-%")
        elif year:
            query += " WHERE holiday_date LIKE %s"
            params.append(f"{year}-%")
        
        holidays = conn.execute(query + " ORDER BY holiday_date ASC", tuple(params)).fetchall()
        return holidays
    finally:
        conn.close()

@app.post("/api/holidays/sync")
async def sync_national_holidays(year: Optional[int] = None, current_user: AdminUser = Depends(get_superadmin)):
    target_year = year or datetime.now().year
    external_holidays = await get_external_holidays(target_year)
    
    if not external_holidays:
        raise HTTPException(status_code=500, detail="Gagal mengambil data dari API Hari Libur Nasional.")
        
    conn = database.get_db_connection()
    try:
        count = 0
        for h in external_holidays:
            # Check if date already exists
            exists = conn.execute("SELECT id FROM holidays WHERE holiday_date=%s", (h['date'],)).fetchone()
            if not exists:
                conn.execute(
                    "INSERT INTO holidays (holiday_date, description, type) VALUES (%s, %s, %s)",
                    (h['date'], h['name'], 'nasional')
                )
                count += 1
        conn.commit()
        return {"status": "success", "message": f"Berhasil sinkronisasi {count} hari libur nasional baru."}
    finally:
        conn.close()

@app.delete("/api/holidays/reset")
async def reset_holidays(current_user: AdminUser = Depends(get_superadmin)):
        
    conn = database.get_db_connection()
    try:
        # Hapus semua hari libur (atau hanya nasional? User bilang 'reset semua ke default')
        # Kita hapus semua agar bersih, lalu admin bisa sync ulang nasional.
        conn.execute("DELETE FROM holidays")
        conn.commit()
        
        # Otomatis sync ulang untuk tahun ini biar tidak kosong melompong
        await sync_national_holidays(datetime.now().year, current_user)
        
        return {"status": "success", "message": "Konfigurasi hari libur telah di-reset ke default nasional."}
    finally:
        conn.close()

@app.delete("/api/holidays/all")
async def clear_all_holidays(current_user: AdminUser = Depends(get_superadmin)):
    conn = database.get_db_connection()
    try:
        conn.execute("DELETE FROM holidays")
        conn.commit()
        return {"status": "success", "message": "Semua data hari libur telah dikosongkan."}
    finally:
        conn.close()

@app.post("/api/holidays")
async def add_holiday(data: Holiday, current_user: AdminUser = Depends(get_superadmin)):
    conn = database.get_db_connection()
    try:
        conn.execute("INSERT INTO holidays (holiday_date, description) VALUES (%s, %s)", (data.holiday_date, data.description))
        conn.commit()
        return {"status": "success", "message": "Hari libur berhasil ditambahkan"}
    except Exception as e:
        if "Duplicate entry" in str(e):
             raise HTTPException(status_code=400, detail="Tanggal libur tersebut sudah terdaftar")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.delete("/api/holidays/{holiday_id}")
async def delete_holiday(holiday_id: int, current_user: dict = Depends(get_superadmin)):
    conn = database.get_db_connection()
    try:
        conn.execute("DELETE FROM holidays WHERE id=%s", (holiday_id,))
        conn.commit()
        return {"status": "success", "message": "Hari libur berhasil dihapus"}
    finally:
        conn.close()

@app.put("/api/holidays/{holiday_id}")
async def update_holiday(holiday_id: int, data: Holiday, current_user: dict = Depends(get_superadmin)):
    conn = database.get_db_connection()
    try:
        conn.execute(
            "UPDATE holidays SET holiday_date=%s, description=%s WHERE id=%s",
            (data.holiday_date, data.description, holiday_id)
        )
        conn.commit()
        return {"status": "success", "message": "Hari libur berhasil diperbarui"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/api/holidays/{holiday_id}/revert")
async def revert_holiday(holiday_id: int, request: Request, current_user: AdminUser = Depends(get_superadmin)):
    conn = database.get_db_connection()
    try:
        # 1. Ambil data saat ini
        h = conn.execute("SELECT holiday_date FROM holidays WHERE id=%s", (holiday_id,)).fetchone()
        if not h:
            raise HTTPException(status_code=404, detail="Hari libur tidak ditemukan")
            
        date_str = h['holiday_date']
        year = int(date_str.split('-')[0])
        
        # 2. Ambil dari API Nasional
        external_hols = await get_external_holidays(year)
        match = next((item for item in external_hols if item["date"] == date_str), None)
        
        if not match:
            raise HTTPException(status_code=400, detail="Tidak ada data default nasional untuk tanggal ini.")
            
        # 3. Update kembali ke default
        conn.execute(
            "UPDATE holidays SET description=%s WHERE id=%s",
            (match['name'], holiday_id)
        )
        conn.commit()
        
        await log_system_action(current_user.id, "REVERT_HOLIDAY", f"Mengembalikan hari libur {date_str} ke default: {match['name']}", request)
        
        return {"status": "success", "message": f"Berhasil mengembalikan ke default: {match['name']}"}
    finally:
        conn.close()

# --- SYSTEM LOGS ENDPOINT ---
@app.get("/api/admin/logs")
async def get_system_logs(current_user: AdminUser = Depends(get_superadmin)):
    conn = database.get_db_connection()
    try:
        logs = conn.execute("""
            SELECT l.*, a.username as admin_name 
            FROM system_logs l 
            LEFT JOIN admins a ON l.admin_id = a.id 
            ORDER BY l.timestamp DESC 
            LIMIT 500
        """).fetchall()
        return logs
    finally:
        conn.close()

# --- ATTENDANCE LOGS ENDPOINT ---
@app.get("/api/admin/attendance/logs")
async def get_attendance_logs(current_user: AdminUser = Depends(get_superadmin)):
    conn = database.get_db_connection()
    try:
        # Mengambil riwayat detail presensi dengan join pegawai & gerbang
        logs = conn.execute("""
            SELECT 
                att.id, 
                att.employee_id, 
                e.name as employee_name, 
                att.date, 
                att.check_in, 
                att.check_out, 
                att.status, 
                att.recorded_by,
                adm.username as gate_name
            FROM attendance att
            JOIN employees e ON att.employee_id = e.id
            LEFT JOIN admins adm ON att.recorded_by = adm.id
            ORDER BY att.date DESC, att.check_in DESC
            LIMIT 1000
        """).fetchall()
        return logs
    finally:
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)

