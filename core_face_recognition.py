import cv2
import face_recognition
import numpy as np
import json
import pickle
from pathlib import Path

class FaceAttendanceSystem:
    def __init__(self, config_path="config.json", data_dir="data"):
        self.config_path = Path(config_path)
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True, parents=True)
        self.encodings_file = self.data_dir / "encodings.pkl"
        
        self.known_face_encodings = []
        self.known_face_names = []
        
        self._load_config()
        self._load_encodings()

    def _load_config(self):
        if self.config_path.exists():
            with open(self.config_path, "r") as f:
                self.config = json.load(f)
        else:
            self.config = {"camera_source": 0, "tolerance": 0.6}
            with open(self.config_path, "w") as f:
                json.dump(self.config, f)

    def _load_encodings(self):
        if self.encodings_file.exists():
            with open(self.encodings_file, "rb") as f:
                data = pickle.load(f)
                self.known_face_encodings = data.get("encodings", [])
                self.known_face_names = data.get("names", [])
            print(f"[INFO] Loaded {len(self.known_face_names)} faces from {self.encodings_file}")
        else:
            print(f"[INFO] No encodings found at {self.encodings_file}")

    def save_encodings(self):
        with open(self.encodings_file, "wb") as f:
            pickle.dump({"encodings": self.known_face_encodings, "names": self.known_face_names}, f)
        print(f"[INFO] Saved {len(self.known_face_names)} faces to {self.encodings_file}")

    def enroll_face(self, image_path, user_id):
        path = Path(image_path)
        if not path.exists():
            print(f"[ERROR] Image not found at {path}")
            return False
            
        try:
            # Load menggunakan OpenCV untuk kemudahan cropping
            img = cv2.imread(str(path))
            if img is None:
                return False
                
            rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            # Deteksi lokasi wajah
            face_locations = face_recognition.face_locations(rgb_img, model="hog")
            
            if not face_locations:
                print(f"[ERROR] No face detected in {path}")
                return False
                
            # Ambil wajah pertama (asumsi 1 foto = 1 orang)
            top, right, bottom, left = face_locations[0]
            
            # --- LOGIKA SMART CROP (Square with Padding) ---
            h, w, _ = img.shape
            face_width = right - left
            face_height = bottom - top
            
            # Tambahkan padding 30% dari ukuran wajah
            padding_w = int(face_width * 0.35)
            padding_h = int(face_height * 0.35)
            
            # Tentukan batas krop baru (box lebih besar)
            n_top = max(0, top - padding_h)
            n_bottom = min(h, bottom + padding_h)
            n_left = max(0, left - padding_w)
            n_right = min(w, right + padding_w)
            
            # Pastikan jadi kotak (Square) agar tampilan di UI konsisten lingkaran/kotak
            cw = n_right - n_left
            ch = n_bottom - n_top
            
            if cw > ch: # Lebar > Tinggi, sesuaikan lebar
                diff = cw - ch
                n_left += diff // 2
                n_right -= diff // 2
            elif ch > cw: # Tinggi > Lebar
                diff = ch - cw
                n_top += diff // 2
                n_bottom -= diff // 2
                
            # Crop gambar
            cropped_img = img[n_top:n_bottom, n_left:n_right]
            
            # Resize ke standar (misal 500x500) agar storage hemat & cepat diolah
            final_img = cv2.resize(cropped_img, (500, 500), interpolation=cv2.INTER_AREA)
            
            # Timpa file asli dengan hasil krop
            cv2.imwrite(str(path), final_img)
            
            # Re-load untuk ambil encoding (dari gambar yang sudah bersih)
            image_to_encode = face_recognition.load_image_file(str(path))
            face_encodings = face_recognition.face_encodings(image_to_encode)
            
            if not face_encodings:
                return False
                
            self.known_face_encodings.append(face_encodings[0])
            self.known_face_names.append(user_id)
            self.save_encodings()
            print(f"[SUKSES] Auto-Crop Berhasil: {user_id}")
            return True
        except Exception as e:
            print(f"[ERROR] Failed to enroll face: {e}")
            return False

    def remove_face(self, user_id):
        """Menghapus encoding wajah berdasarkan user_id"""
        try:
            # Cari semua index yang cocok dengan user_id
            indices = [i for i, name in enumerate(self.known_face_names) if name == user_id]
            
            if not indices:
                print(f"[WARN] No face found for user: {user_id}")
                return False
                
            # Hapus dari belakang agar index tidak bergeser saat iterasi
            for index in sorted(indices, reverse=True):
                self.known_face_encodings.pop(index)
                self.known_face_names.pop(index)
                
            self.save_encodings()
            print(f"[SUKSES] Berhasil menghapus wajah user: {user_id}")
            return True
        except Exception as e:
            print(f"[ERROR] Failed to remove face: {e}")
            return False

    def recognize_single_frame(self, frame):
        """Mengenali wajah pada satu frame gambar (untuk API WebSocket)"""
        if not self.known_face_encodings:
            return "No Data", None

        # Perkecil frame sedikit untuk performa, tapi jangan terlalu kecil agar akurat (0.5x)
        small_frame = cv2.resize(frame, (0, 0), fx=0.5, fy=0.5)
        rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)

        face_locations = face_recognition.face_locations(rgb_small_frame, model="hog")
        face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)

        if not face_encodings:
            return None, None

        for face_encoding in face_encodings:
            matches = face_recognition.compare_faces(self.known_face_encodings, face_encoding, tolerance=self.config["tolerance"])
            name = "Unknown"
            face_id = "Unknown"

            face_distances = face_recognition.face_distance(self.known_face_encodings, face_encoding)
            best_match_index = np.argmin(face_distances)
            
            if matches[best_match_index]:
                face_id = self.known_face_names[best_match_index]
                name = face_id 
                print(f"[KIOSK] Terdeteksi: {name} (dist: {face_distances[best_match_index]:.2f})")

            return name, face_id
            
        return None, None
        camera_source = self.config.get("camera_source", 0)
        tolerance = self.config.get("tolerance", 0.6)
        
        print(f"[INFO] Membuka kamera dari sumber: {camera_source}")
        video_capture = cv2.VideoCapture(camera_source)
        
        if not video_capture.isOpened():
            print("[ERROR] Tidak dapat membuka kamera.")
            return

        print("[INFO] Memulai Face Recognition Stream (Tekan 'q' untuk keluar)...")

        # Inisialisasi variabel untuk optimasi (frame skipping)
        process_this_frame = True
        face_locations = []
        face_encodings_current = []
        face_names = []

        while True:
            ret, frame = video_capture.read()
            if not ret:
                print("[ERROR] Gagal membaca frame dari kamera.")
                break

            # Hanya proses setiap beberapa frame untuk menghemat CPU/GPU secara drastis
            if process_this_frame:
                # Resize frame to 1/4 size for faster face recognition processing
                small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
                
                # Convert BGR to RGB
                rgb_small_frame = np.ascontiguousarray(small_frame[:, :, ::-1])
                
                # Temukan lokasi wajah (gunakan model hog yang ringan dibanding cnn)
                face_locations = face_recognition.face_locations(rgb_small_frame, model="hog")
                face_encodings_current = face_recognition.face_encodings(rgb_small_frame, face_locations)

                face_names = []
                for face_encoding in face_encodings_current:
                    name = "Unknown"

                    # Cocokkan dengan data wajah yang dikenali
                    if self.known_face_encodings:
                        matches = face_recognition.compare_faces(self.known_face_encodings, face_encoding, tolerance=tolerance)
                        face_distances = face_recognition.face_distance(self.known_face_encodings, face_encoding)
                        
                        if len(face_distances) > 0:
                            best_match_index = np.argmin(face_distances)
                            if matches[best_match_index]:
                                name = self.known_face_names[best_match_index]
                    
                    face_names.append(name)

            process_this_frame = not process_this_frame

            # Gambar bounding box dari frame terakhir yang diproses
            for (top, right, bottom, left), name in zip(face_locations, face_names):
                # Scale back up face locations since the frame we detected in was scaled to 1/4 size
                top *= 4
                right *= 4
                bottom *= 4
                left *= 4

                color = (0, 255, 0) if name != "Unknown" else (0, 0, 255)
                
                # Gambar kotak di wajah
                cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
                
                # Tulis nama di bawah wajah
                cv2.rectangle(frame, (left, bottom - 35), (right, bottom), color, cv2.FILLED)
                font = cv2.FONT_HERSHEY_DUPLEX
                cv2.putText(frame, name, (left + 6, bottom - 6), font, 0.6, (255, 255, 255), 1)

            cv2.imshow("Face Recognition Stream", frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        video_capture.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Test FaceRecognition Core Module")
    parser.add_argument("--enroll", help="Path to image to enroll a face")
    parser.add_argument("--name", help="Name/User ID for enrollment")
    parser.add_argument("--stream", action="store_true", help="Start camera stream")
    
    args = parser.parse_args()
    system = FaceAttendanceSystem()
    
    if args.enroll and args.name:
        system.enroll_face(args.enroll, args.name)
    elif args.stream:
        system.start_recognition_stream()
    else:
        parser.print_help()
