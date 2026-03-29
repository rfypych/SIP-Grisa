# GEMINI.md - Project Context: SIP Grisa

SIP Grisa is a high-performance, AI-powered Face Recognition Attendance System designed for schools or workplaces. It features a real-time Kiosk interface and a comprehensive Admin Dashboard.

## 🚀 Project Overview

- **Purpose**: Automate attendance tracking using face recognition, prevent fraud, and provide detailed reporting.
- **Architecture**: 
    - **Frontend**: Single Page Application (SPA) built with React 19 and Vite 6.
    - **Backend**: Asynchronous REST API and WebSocket server built with FastAPI (Python 3.10+).
    - **Database**: MySQL for persistent storage of employees, attendance, holidays, and settings.
    - **AI Engine**: `dlib` and `face-recognition` for biometric processing; Google Gemini Vision for manual sheet recovery.
- **Key Workflows**:
    - **Kiosk**: Captures camera frames -> sends via WebSocket -> Backend recognizes face -> logs Check-in/Check-out based on "Smart Logic" (cooldowns, time limits, min-gap).
    - **Admin**: Manage employee datasets (with auto-cropping), view real-time reports, sync national holidays, and use AI to digitize paper-based attendance.

## 🛠 Tech Stack

### Frontend
- **Framework**: React 19 (TypeScript)
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS 4 (Utility-first)
- **State Management**: Zustand 5
- **Animations**: Framer Motion (Motion)
- **Icons**: Lucide React
- **Routing**: React Router 7

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Server**: Uvicorn
- **Face Recognition**: `face-recognition` (dlib/OpenCV wrapper)
- **Database Driver**: `pymysql` (with a `WrappedConnection` for SQLite-like syntax compatibility)
- **Authentication**: JWT (jose) + Passlib (bcrypt)
- **AI Integration**: `google-genai` (Gemini Flash for Vision tasks)

## 🏗 Directory Structure

- `/api.py`: Main Backend entry point (REST + WebSocket).
- `/database.py`: Database schema and connection management.
- `/core_face_recognition.py`: Biometric engine and image processing logic.
- `/src/`: Frontend source code.
    - `/src/pages/KioskPage.tsx`: Core kiosk logic with WebSocket frame streaming.
    - `/src/store/`: Zustand stores for settings, auth, and data.
- `/data/`: Local storage for `encodings.pkl`, employee photos, and sounds.
- `/docker-compose.yml`: Container orchestration for DB, Backend, and Frontend.

## 🔧 Building and Running

### Docker (Recommended)
1. Copy `.env.example` to `.env` and configure `MYSQL_ROOT_PASSWORD` and `GEMINI_API_KEY`.
2. Run `docker compose up -d --build`.
   - Note: Initial build may take 10-15 minutes due to `dlib` compilation.

### Manual Development
**Backend:**
1. `pip install -r requirements.txt`
2. `uvicorn api:app --reload --port 8000`

**Frontend:**
1. `npm install`
2. `npm run dev` (Default: http://localhost:3001)

## 📏 Development Conventions

- **Surgical Edits**: When modifying `api.py` or `KioskPage.tsx`, be extremely careful as they are large and contain critical real-time logic.
- **Database**: Use `get_db_connection()` from `database.py`. It returns a wrapper that supports `.execute(query, params)`.
- **Face Recognition**: All biometric data is managed via the `FaceAttendanceSystem` class in `core_face_recognition.py`.
- **Styling**: Adhere to Tailwind 4 conventions. Use the `cn()` utility (clsx + tailwind-merge) for dynamic classes.
- **Naming**: 
    - Backend: `snake_case` for functions and variables.
    - Frontend: `PascalCase` for components, `camelCase` for hooks and variables.
- **Environment**: Secrets (JWT, DB pass, API keys) must stay in `.env`.

## 🧠 Smart Logic Rules
- **Cooldown**: Prevents duplicate logging for the same person within X seconds (default 60s).
- **Min Gap**: Required duration between Check-in and Check-out.
- **Presence Limit**: Time after which a Check-in is marked as 'Alfa' (Late).
- **Open Time**: Earliest time the Kiosk starts accepting Check-ins.
