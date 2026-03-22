import pymysql
import pymysql.cursors
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
import warnings

# Mengabaikan warning jika table/DB sudah ada
warnings.filterwarnings('ignore', category=pymysql.Warning)

DB_HOST = "172.24.0.1"
DB_USER = "root"
DB_PASS = ""
DB_NAME = "sip_grisa"

def init_db():
    try:
        # Koneksi awal untuk buat DB
        conn = pymysql.connect(host=DB_HOST, user=DB_USER, password=DB_PASS, cursorclass=pymysql.cursors.DictCursor)
        with conn.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
        conn.commit()
        conn.close()

        # Koneksi ke DB untuk buat tabel
        conn = pymysql.connect(host=DB_HOST, user=DB_USER, password=DB_PASS, database=DB_NAME, cursorclass=pymysql.cursors.DictCursor)
        with conn.cursor() as cursor:
            # Buat tabel Pegawai
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS employees (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                role VARCHAR(50) NOT NULL,
                photoUrl TEXT
            )
            ''')
            
            # Buat tabel Absensi
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS attendance (
                id INT AUTO_INCREMENT PRIMARY KEY,
                employee_id VARCHAR(50) NOT NULL,
                date VARCHAR(20) NOT NULL,
                check_in VARCHAR(20),
                check_out VARCHAR(20),
                status VARCHAR(20) NOT NULL,
                recorded_by INT,
                FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE,
                FOREIGN KEY(recorded_by) REFERENCES admins(id) ON DELETE SET NULL
            )
            ''')

            # --- TABEL LOG SISTEM ---
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS system_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                admin_id INT,
                action VARCHAR(100) NOT NULL,
                details TEXT,
                ip_address VARCHAR(50),
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(admin_id) REFERENCES admins(id) ON DELETE SET NULL
            )
            ''')
            
            # --- TABEL ADMIN ---
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role VARCHAR(20) DEFAULT 'admin'
            )
            ''')

            # --- TABEL HARI LIBUR ---
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS holidays (
                id INT AUTO_INCREMENT PRIMARY KEY,
                holiday_date VARCHAR(20) UNIQUE NOT NULL,
                description VARCHAR(255),
                type VARCHAR(20) DEFAULT 'custom'
            )
            ''')
            
            # --- TABEL SETTINGS ---
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS system_settings (
                id INT PRIMARY KEY,
                cooldown_seconds INT DEFAULT 60,
                min_gap_minutes INT DEFAULT 60,
                checkout_start_hour INT DEFAULT 11,
                program_start_date VARCHAR(20) DEFAULT '2026-03-01',
                success_sound_url VARCHAR(255) DEFAULT '/api/sounds/applepay.mp3',
                success_sound_enabled TINYINT(1) DEFAULT 1,
                export_location VARCHAR(100) DEFAULT 'Grobogan',
                export_signature_enabled TINYINT(1) DEFAULT 1,
                export_signature_name VARCHAR(150) DEFAULT '( ......................................... )',
                export_signature_role VARCHAR(150) DEFAULT 'Mengetahui,',
                google_api_key VARCHAR(255),
                test_mode TINYINT(1) DEFAULT 0
            )
            ''')
            
            # Migrasi: Tambahkan kolom baru jika belum ada (untuk database yang sudah jalan)
            new_columns = [
                ("export_location", "VARCHAR(100) DEFAULT 'Grobogan'"),
                ("export_signature_enabled", "TINYINT(1) DEFAULT 1"),
                ("export_signature_name", "VARCHAR(150) DEFAULT '( ......................................... )'"),
                ("export_signature_role", "VARCHAR(150) DEFAULT 'Mengetahui,'"),
                ("alpha_limit_time", "VARCHAR(10) DEFAULT '07:30'"),
                ("google_api_key", "VARCHAR(255)"),
                ("test_mode", "TINYINT(1) DEFAULT 0"),
                ("presence_limit_time", "VARCHAR(10) DEFAULT '14:00'")
            ]
            
            for col_name, col_def in new_columns:
                cursor.execute(f"SHOW COLUMNS FROM system_settings LIKE '{col_name}'")
                if not cursor.fetchone():
                    cursor.execute(f"ALTER TABLE system_settings ADD COLUMN {col_name} {col_def}")
                    print(f"[DB INFO] Added column {col_name} to system_settings.")

            # Migrasi tabel attendance: recorded_by
            cursor.execute("SHOW COLUMNS FROM attendance LIKE 'recorded_by'")
            if not cursor.fetchone():
                cursor.execute("ALTER TABLE attendance ADD COLUMN recorded_by INT")
                cursor.execute("ALTER TABLE attendance ADD FOREIGN KEY (recorded_by) REFERENCES admins(id) ON DELETE SET NULL")
                print("[DB INFO] Added column recorded_by to attendance.")

            # Seed System Settings jika kosong
            cursor.execute("SELECT COUNT(*) as count FROM system_settings")
            if cursor.fetchone()['count'] == 0:
                cursor.execute("""
                    INSERT INTO system_settings 
                    (id, cooldown_seconds, min_gap_minutes, checkout_start_hour, program_start_date, success_sound_url, success_sound_enabled, 
                     export_location, export_signature_enabled, export_signature_name, export_signature_role, alpha_limit_time, presence_limit_time) 
                    VALUES (1, 60, 60, 11, '2026-03-01', '/api/sounds/applepay.mp3', 1, 'Grobogan', 1, '( ......................................... )', 'Mengetahui,', '07:30', '14:00')
                """)
                print("[DB INFO] System Settings initialized with defaults.")

            # Buat Super Admin pertama jika kosong
            cursor.execute("SELECT COUNT(*) as count FROM admins")
            if cursor.fetchone()['count'] == 0:
                # Kredensial super rumit sesuai request
                user = "grisa_super_admin_2026"
                raw_pass = "Grisa@Secure#Auth!2026*"
                hashed = pwd_context.hash(raw_pass)
                cursor.execute("INSERT INTO admins (username, password, role) VALUES (%s, %s, %s)", (user, hashed, "superadmin"))
                print(f"[DB INFO] Super Admin created: {user}")
            
        conn.commit()
        conn.close()
        print(f"[DB INFO] Database {DB_NAME} initialized successfully.")
    except Exception as e:
        print(f"[DB ERROR] Gagal inisialisasi MySQL: {e}")

class WrappedConnection:
    """Wrapper ringan agar syntax conn.execute() dari SQLite tetap jalan tanpa refactor besar"""
    def __init__(self, conn):
        self.conn = conn
        
    def execute(self, query, params=None):
        cursor = self.conn.cursor()
        cursor.execute(query, params)
        return cursor
        
    def commit(self):
        self.conn.commit()
        
    def close(self):
        self.conn.close()

def get_db_connection():
    conn = pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASS,
        database=DB_NAME,
        cursorclass=pymysql.cursors.DictCursor
    )
    return WrappedConnection(conn)

# Inisialisasi DB saat file ini di-import
init_db()
