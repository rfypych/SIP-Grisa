import re

with open("api.py", "r") as f:
    content = f.read()

# 1. Allow enforce_min_gap in updates
old_allowlist = """                'alpha_limit_time', 'presence_limit_time', 'checkin_start_time', 'checkout_start_time', 'google_api_key', 'test_mode'
            ]:"""

new_allowlist = """                'alpha_limit_time', 'presence_limit_time', 'checkin_start_time', 'checkout_start_time', 'google_api_key', 'test_mode', 'enforce_min_gap'
            ]:"""

content = content.replace(old_allowlist, new_allowlist)

# 2. Extract enforce_min_gap logic
logic_extraction = """                        checkout_start_val = sys_settings['checkout_start_time'] if sys_settings and 'checkout_start_time' in sys_settings and sys_settings['checkout_start_time'] else '14:00'

                        # print(f"DEBUG: Logic using cooldown="""

logic_insertion = """                        checkout_start_val = sys_settings['checkout_start_time'] if sys_settings and 'checkout_start_time' in sys_settings and sys_settings['checkout_start_time'] else '14:00'
                        enforce_gap_val = sys_settings['enforce_min_gap'] if sys_settings and 'enforce_min_gap' in sys_settings else 0

                        # print(f"DEBUG: Logic using cooldown="""

content = content.replace(logic_extraction, logic_insertion)

old_check_in_block = """                            elif not existing:
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

                                # CHECK IN (JAM MASUK)
                                conn.execute("INSERT INTO attendance (employee_id, date, check_in, status, recorded_by) VALUES (%s, %s, %s, %s, %s)",
                                             (face_id, today, time_now, status, gate_admin_id))
                                conn.commit()"""

new_check_in_block = """                            elif not existing:
                                # JIKA TIDAK WAJIB MIN GAP & SUDAH JAM PULANG -> OTOMATIS CHECK OUT SAJA.
                                if not enforce_gap_val and time_now >= checkout_start_val:
                                    status = "alfa" # Alfa karena skip jam masuk pagi
                                    conn.execute("INSERT INTO attendance (employee_id, date, check_in, check_out, status, recorded_by) VALUES (%s, %s, %s, %s, %s, %s)",
                                                 (face_id, today, None, time_now, status, gate_admin_id))
                                    conn.commit()
                                    await manager.broadcast({"event": "NEW_ATTENDANCE", "name": real_name, "id": face_id, "type": "checkout"})
                                    await websocket.send_json({
                                        "event": "success",
                                        "name": real_name,
                                        "id": face_id,
                                        "type": "checkout",
                                        "debug": debug_info
                                    })
                                    continue

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

                                # CHECK IN (JAM MASUK)
                                conn.execute("INSERT INTO attendance (employee_id, date, check_in, status, recorded_by) VALUES (%s, %s, %s, %s, %s)",
                                             (face_id, today, time_now, status, gate_admin_id))
                                conn.commit()"""

content = content.replace(old_check_in_block, new_check_in_block)

old_min_gap_check = '''                                        if minutes_diff >= min_gap_val:
                                            can_checkout = True
                                        else:
                                            early_checkout_msg = f"Anda sudah presensi masuk. Belum waktunya pulang (tunggu {int(min_gap_val - minutes_diff)} menit lagi)."
                                    except:
                                        if time_now >= presence_limit_val:
                                            can_checkout = True
                                        else:
                                            early_checkout_msg = "Anda sudah presensi masuk. Belum waktunya pulang."'''

new_min_gap_check = '''                                        if not enforce_gap_val or minutes_diff >= min_gap_val:
                                            can_checkout = True
                                        else:
                                            early_checkout_msg = f"Anda sudah presensi masuk. Belum waktunya pulang (tunggu {int(min_gap_val - minutes_diff)} menit lagi)."
                                    except:
                                        if not enforce_gap_val or time_now >= presence_limit_val:
                                            can_checkout = True
                                        else:
                                            early_checkout_msg = "Anda sudah presensi masuk. Belum waktunya pulang."'''

content = content.replace(old_min_gap_check, new_min_gap_check)

with open("api.py", "w") as f:
    f.write(content)

print("Backend API Updated.")
