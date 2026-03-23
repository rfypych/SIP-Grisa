import re

with open("README.md", "r") as f:
    content = f.read()

# Fix mermaid shapes containing parenthesis inside conditions/shapes
old_mermaid = """```mermaid
flowchart TD
    Start([Kamera Kiosk Menangkap Wajah]) --> CekWajah{Apakah Wajah Dikenali?}
    CekWajah -- Tidak --> Drop([Abaikan Frame])
    CekWajah -- Ya --> DapatkanData[Ambil Face ID & Waktu Saat Ini Time_Now]

    DapatkanData --> CekCooldown{Apakah Face ID<br>dalam Cooldown 1 Menit?}
    CekCooldown -- Ya --> DropCooldown([Kirim Event: on_cooldown])
    CekCooldown -- Tidak --> CekStatusDB{Sudah ada data absen hari ini?}

    %% --- CABANG BELUM ADA DATA HARI INI (CHECK-IN) ---
    CekStatusDB -- Belum --> CekWaktuMasuk{Time_Now < Check-in Start?}
    CekWaktuMasuk -- Ya --> TolakMasuk([Kirim Peringatan:<br>Belum Waktunya Presensi Masuk])
    CekWaktuMasuk -- Tidak --> CekWajibGap{Wajib Min Gap (Enforce) = OFF<br>DAN<br>Time_Now >= Check-out Start?}

    CekWajibGap -- Ya --> SkipMasuk[Tandai Status Alfa<br>Hanya Catat Check-out] --> BerhasilCheckout([Kirim Event Sukses Check-out])
    CekWajibGap -- Tidak --> CekLimitMasuk{Time_Now > Presence Limit?}

    CekLimitMasuk -- Ya --> SetAlfa[Set Status = Alfa]
    CekLimitMasuk -- Tidak --> SetHadir[Set Status = Hadir]

    SetAlfa --> SimpanCheckin[Catat Jam Check-in]
    SetHadir --> SimpanCheckin
    SimpanCheckin --> BerhasilCheckin([Kirim Event Sukses Check-in])

    %% --- CABANG SUDAH ADA DATA HARI INI (CHECK-OUT) ---
    CekStatusDB -- Sudah --> CekSudahPulang{Kolom Check-out<br>Sudah Terisi?}
    CekSudahPulang -- Ya --> SudahSelesai([Kirim Peringatan:<br>Anda Sudah Presensi Pulang])
    CekSudahPulang -- Tidak --> CekWaktuPulang{Time_Now < Check-out Start?}

    CekWaktuPulang -- Ya --> TolakPulangWaktu([Kirim Peringatan:<br>Sudah Absen Masuk.<br>Belum Waktunya Pulang])
    CekWaktuPulang -- Tidak --> CekMinGap{Apakah Waktu Kerja<br>>= Min Gap?}

    CekMinGap -- Ya --> SimpanCheckout[Catat Jam Check-out] --> BerhasilCheckout2([Kirim Event Sukses Check-out])
    CekMinGap -- Tidak --> CekEnforceGap{Wajib Min Gap (Enforce) = ON?}

    CekEnforceGap -- Ya --> TolakPulangDurasi([Kirim Peringatan:<br>Sudah Absen Masuk.<br>Belum Waktunya Pulang Tunggu X menit])
    CekEnforceGap -- Tidak --> CekLimitPulang{Time_Now >= Presence Limit?}

    CekLimitPulang -- Ya --> SimpanCheckout
    CekLimitPulang -- Tidak --> TolakPulangDurasi
```"""

new_mermaid = """```mermaid
flowchart TD
    Start(["Kamera Kiosk Menangkap Wajah"]) --> CekWajah{"Apakah Wajah Dikenali?"}
    CekWajah -- Tidak --> Drop(["Abaikan Frame"])
    CekWajah -- Ya --> DapatkanData["Ambil Face ID & Waktu Saat Ini Time_Now"]

    DapatkanData --> CekCooldown{"Apakah Face ID<br>dalam Cooldown 1 Menit?"}
    CekCooldown -- Ya --> DropCooldown(["Kirim Event: on_cooldown"])
    CekCooldown -- Tidak --> CekStatusDB{"Sudah ada data absen hari ini?"}

    %% --- CABANG BELUM ADA DATA HARI INI (CHECK-IN) ---
    CekStatusDB -- Belum --> CekWaktuMasuk{"Time_Now < Check-in Start?"}
    CekWaktuMasuk -- Ya --> TolakMasuk(["Kirim Peringatan:<br>Belum Waktunya Presensi Masuk"])
    CekWaktuMasuk -- Tidak --> CekWajibGap{"Wajib Min Gap (Enforce) = OFF<br>DAN<br>Time_Now >= Check-out Start?"}

    CekWajibGap -- Ya --> SkipMasuk["Tandai Status Alfa<br>Hanya Catat Check-out"] --> BerhasilCheckout(["Kirim Event Sukses Check-out"])
    CekWajibGap -- Tidak --> CekLimitMasuk{"Time_Now > Presence Limit?"}

    CekLimitMasuk -- Ya --> SetAlfa["Set Status = Alfa"]
    CekLimitMasuk -- Tidak --> SetHadir["Set Status = Hadir"]

    SetAlfa --> SimpanCheckin["Catat Jam Check-in"]
    SetHadir --> SimpanCheckin
    SimpanCheckin --> BerhasilCheckin(["Kirim Event Sukses Check-in"])

    %% --- CABANG SUDAH ADA DATA HARI INI (CHECK-OUT) ---
    CekStatusDB -- Sudah --> CekSudahPulang{"Kolom Check-out<br>Sudah Terisi?"}
    CekSudahPulang -- Ya --> SudahSelesai(["Kirim Peringatan:<br>Anda Sudah Presensi Pulang"])
    CekSudahPulang -- Tidak --> CekWaktuPulang{"Time_Now < Check-out Start?"}

    CekWaktuPulang -- Ya --> TolakPulangWaktu(["Kirim Peringatan:<br>Sudah Absen Masuk.<br>Belum Waktunya Pulang"])
    CekWaktuPulang -- Tidak --> CekMinGap{"Apakah Waktu Kerja<br>>= Min Gap?"}

    CekMinGap -- Ya --> SimpanCheckout["Catat Jam Check-out"] --> BerhasilCheckout2(["Kirim Event Sukses Check-out"])
    CekMinGap -- Tidak --> CekEnforceGap{"Wajib Min Gap (Enforce) = ON?"}

    CekEnforceGap -- Ya --> TolakPulangDurasi(["Kirim Peringatan:<br>Sudah Absen Masuk.<br>Belum Waktunya Pulang Tunggu X menit"])
    CekEnforceGap -- Tidak --> CekLimitPulang{"Time_Now >= Presence Limit?"}

    CekLimitPulang -- Ya --> SimpanCheckout
    CekLimitPulang -- Tidak --> TolakPulangDurasi
```"""

content = content.replace(old_mermaid, new_mermaid)

with open("README.md", "w") as f:
    f.write(content)

print("Mermaid graph patched in README.md")
