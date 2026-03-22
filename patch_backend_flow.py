import re

with open("api.py", "r") as f:
    content = f.read()

# Replace the "else" logic inside checkin/checkout flow
old_checkout_block = """                                # BLOCK CHECK OUT BEFORE START TIME
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

                                        # HANYA bisa checkout jika sudah melewati min_gap_val,
                                        # meskipun waktu sekarang sudah > presence_limit_val
                                        if minutes_diff >= min_gap_val:
                                            can_checkout = True
                                    except:
                                        # Jika gagal parse, kita periksa saja apakah sudah di jam limit
                                        # tapi logikanya lebih aman kalau tidak di-checkout sembarangan
                                        if time_now >= presence_limit_val:
                                            can_checkout = True

                                if can_checkout:
                                    conn.execute("UPDATE attendance SET check_out=%s, recorded_by=%s WHERE employee_id=%s AND date=%s", (time_now, gate_admin_id, face_id, today))
                                    conn.commit()
                                    await manager.broadcast({"event": "NEW_ATTENDANCE", "name": real_name, "id": face_id, "type": "checkout"})
                                    await websocket.send_json({
                                        "event": "success",
                                        "name": real_name,
                                        "id": face_id,
                                        "type": "checkout",
                                        "debug": debug_info
                                    })
                                else:
                                    # Checkout prematur: Beri tahu bahwa sudah absen
                                    await websocket.send_json({
                                        "event": "already_done",
                                        "name": real_name,
                                        "id": face_id,
                                        "debug": debug_info
                                    })"""

new_checkout_block = """                                # CEK APAKAH SUDAH CHECK OUT?
                                if existing.get('check_out'):
                                    await websocket.send_json({
                                        "event": "already_done",
                                        "name": real_name,
                                        "id": face_id,
                                        "message": "Anda sudah melakukan presensi pulang.",
                                        "debug": debug_info
                                    })
                                    continue

                                # BLOCK CHECK OUT BEFORE START TIME ATAU MIN GAP
                                early_checkout_msg = None

                                if time_now < checkout_start_val:
                                    early_checkout_msg = f"Belum waktunya presensi pulang ({checkout_start_val})."

                                can_checkout = False
                                check_in_str = existing.get('check_in')

                                if check_in_str and not early_checkout_msg:
                                    try:
                                        check_in_time = datetime.strptime(f"{today} {check_in_str}", "%Y-%m-%d %H:%M:%S")
                                        minutes_diff = (now - check_in_time).total_seconds() / 60

                                        if minutes_diff >= min_gap_val:
                                            can_checkout = True
                                        else:
                                            early_checkout_msg = f"Anda sudah presensi masuk. Belum waktunya pulang (tunggu {int(min_gap_val - minutes_diff)} menit lagi)."
                                    except:
                                        if time_now >= presence_limit_val:
                                            can_checkout = True
                                        else:
                                            early_checkout_msg = "Anda sudah presensi masuk. Belum waktunya pulang."

                                if can_checkout:
                                    conn.execute("UPDATE attendance SET check_out=%s, recorded_by=%s WHERE employee_id=%s AND date=%s", (time_now, gate_admin_id, face_id, today))
                                    conn.commit()
                                    await manager.broadcast({"event": "NEW_ATTENDANCE", "name": real_name, "id": face_id, "type": "checkout"})
                                    await websocket.send_json({
                                        "event": "success",
                                        "name": real_name,
                                        "id": face_id,
                                        "type": "checkout",
                                        "debug": debug_info
                                    })
                                else:
                                    # Checkout prematur atau belum waktunya pulang
                                    await websocket.send_json({
                                        "event": "already_done",
                                        "name": real_name,
                                        "id": face_id,
                                        "message": early_checkout_msg or "Anda sudah presensi masuk.",
                                        "debug": debug_info
                                    })"""

content = content.replace(old_checkout_block, new_checkout_block)

with open("api.py", "w") as f:
    f.write(content)

print("Backend flow Patched.")
