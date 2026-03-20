# GEMINI.md - Project Context: SIP Grisa (Grisa Presence)

## Project Overview
**SIP Grisa** (Sistem Informasi Presensi Grisa) is a face-recognition-based attendance system designed for efficient and secure employee tracking. It consists of a Python-based FastAPI backend and a modern React frontend.

### Core Technologies
- **Backend:**
    - **Language:** Python 3.x
    - **Framework:** FastAPI
    - **Face Recognition:** `face-recognition` library (built on `dlib`), `opencv-python`
    - **Database:** SQLite (default `grisa_presence.db`) with support for MySQL.
    - **Authentication:** JWT (JSON Web Tokens)
- **Frontend:**
    - **Framework:** React 19 (TypeScript)
    - **Build Tool:** Vite
    - **Styling:** Tailwind CSS 4.x
    - **State Management:** Zustand
    - **Routing:** React Router 7.x
    - **Components:** Custom UI components using Radix-like patterns (Sonner, Lucide-React).

## Architecture
The project is split into two main parts:
1.  **Backend (Root Directory):**
    - `api.py`: Main entry point for the FastAPI server. Handles REST endpoints for authentication, attendance records, and administrator management.
    - `core_face_recognition.py`: Encapsulates the logic for face detection, encoding generation, and matching. Uses a `pickle` file (`data/encodings.pkl`) to store known face data.
    - `database.py`: Manages database connections and initializations.
    - `data/`: Contains processed encodings, raw photos for dataset building, and audio feedback files.
2.  **Frontend (`SIP-Grisa/`):**
    - `src/pages/KioskPage.tsx`: The primary interface for users to perform face-based check-ins/outs.
    - `src/pages/admin/`: Contains management pages for dashboards, reports (Laporan), dataset management, and system settings.
    - `src/store/`: Centralized state management using Zustand (Auth, Attendance, Settings).

## Building and Running

### Backend Setup
1.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
2.  **Run the Server:**
    ```bash
    uvicorn api:app --reload --host 0.0.0.0 --port 8000
    ```
    *Note: Ensure `config.json` is present in the root directory.*

### Frontend Setup
1.  **Navigate to Directory:**
    ```bash
    cd SIP-Grisa
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    *Starts the frontend on `http://localhost:3001`.*
4.  **Build for Production:**
    ```bash
    npm run build
    ```

## Development Conventions
- **API Communication:** The frontend communicates with the backend via REST. Authentication is handled via Bearer tokens in the `Authorization` header.
- **Face Dataset:** Photos for the dataset should be placed in `data/photos/`. The backend processes these into `encodings.pkl`.
- **Styling:** Adheres to Tailwind CSS conventions. Use utility classes for most styling.
- **Routing:** New pages should be added to `SIP-Grisa/src/App.tsx`.
- **Real-time Feedback:** The system is designed to provide immediate audio and visual feedback upon successful recognition.

## Key Files
- `api.py`: Primary API logic and route definitions.
- `core_face_recognition.py`: Face recognition engine.
- `SIP-Grisa/src/pages/KioskPage.tsx`: Main kiosk attendance UI.
- `SIP-Grisa/src/services/mockData.ts`: (If used) Contains mock data for frontend testing.
- `config.json`: Hardware/Threshold settings (Camera source, tolerance).
