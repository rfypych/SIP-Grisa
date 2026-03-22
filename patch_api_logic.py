import re

with open("api.py", "r") as f:
    content = f.read()

# 1. Update allowlist in update_settings
old_allowlist = """            if key in [
                'cooldown_seconds', 'min_gap_minutes', 'checkout_start_hour', 'program_start_date',
                'success_sound_url', 'success_sound_enabled', 'export_location',
                'export_signature_enabled', 'export_signature_name', 'export_signature_role',
                'alpha_limit_time', 'presence_limit_time', 'google_api_key', 'test_mode'
            ]:"""

new_allowlist = """            if key in [
                'cooldown_seconds', 'min_gap_minutes', 'checkout_start_hour', 'program_start_date',
                'success_sound_url', 'success_sound_enabled', 'export_location',
                'export_signature_enabled', 'export_signature_name', 'export_signature_role',
                'alpha_limit_time', 'presence_limit_time', 'checkin_start_time', 'checkout_start_time', 'google_api_key', 'test_mode'
            ]:"""

content = content.replace(old_allowlist, new_allowlist)

# 2. Add smart logic evaluation for checkin/checkout time boundary
logic_extraction = """                        cooldown_val = sys_settings['cooldown_seconds'] if sys_settings else 60
                        min_gap_val = sys_settings['min_gap_minutes'] if sys_settings else 60
                        presence_limit_val = sys_settings['presence_limit_time'] if sys_settings else '14:00'

                        # print(f"DEBUG: Logic using cooldown={cooldown_val}, min_gap={min_gap_val}, limit={presence_limit_val}")"""

logic_insertion = """                        cooldown_val = sys_settings['cooldown_seconds'] if sys_settings else 60
                        min_gap_val = sys_settings['min_gap_minutes'] if sys_settings else 60
                        presence_limit_val = sys_settings['presence_limit_time'] if sys_settings else '14:00'
                        checkin_start_val = sys_settings['checkin_start_time'] if sys_settings and 'checkin_start_time' in sys_settings and sys_settings['checkin_start_time'] else '06:00'
                        checkout_start_val = sys_settings['checkout_start_time'] if sys_settings and 'checkout_start_time' in sys_settings and sys_settings['checkout_start_time'] else '14:00'

                        # print(f"DEBUG: Logic using cooldown={cooldown_val}, min_gap={min_gap_val}, limit={presence_limit_val}")"""

content = content.replace(logic_extraction, logic_insertion)


# 3. Add boundaries rules
# Find where check in happens: "elif not existing:"
old_check_in_block = """                            elif not existing:
                                # Tentukan status berdasarkan jam alpha
                                status = "hadir"
                                if time_now > presence_limit_val:
                                    status = "alfa"

                                # CHECK IN (JAM MASUK)"""

new_check_in_block = """                            elif not existing:
                                # BLOCK CHECK IN BEFORE START TIME
                                if time_now < checkin_start_val:
                                    await websocket.send_json({
                                        "event": "early_warning",
                                        "message": f"Belum waktunya presensi masuk ({checkin_start_val})",
                                        "debug": debug_info
                                    })
                                    continue # Skip logic further

                                # Tentukan status berdasarkan jam alpha
                                status = "hadir"
                                if time_now > presence_limit_val:
                                    status = "alfa"

                                # CHECK IN (JAM MASUK)"""

content = content.replace(old_check_in_block, new_check_in_block)

# Find where checkout block logic happens inside "else:"
old_check_out_block = """                                if check_in_str:
                                    try:
                                        check_in_time = datetime.strptime(f"{today} {check_in_str}", "%Y-%m-%d %H:%M:%S")
                                        minutes_diff = (now - check_in_time).total_seconds() / 60

                                        # HANYA bisa checkout jika sudah melewati min_gap_val, """

new_check_out_block = """                                # BLOCK CHECK OUT BEFORE START TIME
                                if time_now < checkout_start_val:
                                    await websocket.send_json({
                                        "event": "early_warning",
                                        "message": f"Belum waktunya presensi pulang ({checkout_start_val})",
                                        "debug": debug_info
                                    })
                                    continue # Skip logic further

                                if check_in_str:
                                    try:
                                        check_in_time = datetime.strptime(f"{today} {check_in_str}", "%Y-%m-%d %H:%M:%S")
                                        minutes_diff = (now - check_in_time).total_seconds() / 60

                                        # HANYA bisa checkout jika sudah melewati min_gap_val, """

content = content.replace(old_check_out_block, new_check_out_block)

with open("api.py", "w") as f:
    f.write(content)

print("Backend Logic Patched.")
