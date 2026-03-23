import re

with open("database.py", "r") as f:
    content = f.read()

# Add enforce_min_gap column to DB schema
old_table = """                test_mode TINYINT(1) DEFAULT 0,
                checkin_start_time VARCHAR(10) DEFAULT '06:00',
                checkout_start_time VARCHAR(10) DEFAULT '14:00'
            )"""

new_table = """                test_mode TINYINT(1) DEFAULT 0,
                checkin_start_time VARCHAR(10) DEFAULT '06:00',
                checkout_start_time VARCHAR(10) DEFAULT '14:00',
                enforce_min_gap TINYINT(1) DEFAULT 0
            )"""

content = content.replace(old_table, new_table)

old_migration = """                ("checkin_start_time", "VARCHAR(10) DEFAULT '06:00'"),
                ("checkout_start_time", "VARCHAR(10) DEFAULT '14:00'")
            ]"""

new_migration = """                ("checkin_start_time", "VARCHAR(10) DEFAULT '06:00'"),
                ("checkout_start_time", "VARCHAR(10) DEFAULT '14:00'"),
                ("enforce_min_gap", "TINYINT(1) DEFAULT 0")
            ]"""

content = content.replace(old_migration, new_migration)

old_seed = """export_location, export_signature_enabled, export_signature_name, export_signature_role, alpha_limit_time, presence_limit_time, checkin_start_time, checkout_start_time)
                    VALUES (1, 60, 60, 11, '2026-03-01', '/api/sounds/applepay.mp3', 1, 'Grobogan', 1, '( ......................................... )', 'Mengetahui,', '07:30', '14:00', '06:00', '14:00')"""

new_seed = """export_location, export_signature_enabled, export_signature_name, export_signature_role, alpha_limit_time, presence_limit_time, checkin_start_time, checkout_start_time, enforce_min_gap)
                    VALUES (1, 60, 60, 11, '2026-03-01', '/api/sounds/applepay.mp3', 1, 'Grobogan', 1, '( ......................................... )', 'Mengetahui,', '07:30', '14:00', '06:00', '14:00', 0)"""

content = content.replace(old_seed, new_seed)

with open("database.py", "w") as f:
    f.write(content)

print("DB Schema Updated.")
