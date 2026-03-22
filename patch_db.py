import re

with open("database.py", "r") as f:
    content = f.read()

# Add new columns to system_settings creation
old_settings_table = """            CREATE TABLE IF NOT EXISTS system_settings (
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
            )"""

new_settings_table = """            CREATE TABLE IF NOT EXISTS system_settings (
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
                test_mode TINYINT(1) DEFAULT 0,
                checkin_start_time VARCHAR(10) DEFAULT '06:00',
                checkout_start_time VARCHAR(10) DEFAULT '14:00'
            )"""

content = content.replace(old_settings_table, new_settings_table)

# Add to migration list
old_migration = """            new_columns = [
                ("export_location", "VARCHAR(100) DEFAULT 'Grobogan'"),
                ("export_signature_enabled", "TINYINT(1) DEFAULT 1"),
                ("export_signature_name", "VARCHAR(150) DEFAULT '( ......................................... )'"),
                ("export_signature_role", "VARCHAR(150) DEFAULT 'Mengetahui,'"),
                ("alpha_limit_time", "VARCHAR(10) DEFAULT '07:30'"),
                ("google_api_key", "VARCHAR(255)"),
                ("test_mode", "TINYINT(1) DEFAULT 0"),
                ("presence_limit_time", "VARCHAR(10) DEFAULT '14:00'")
            ]"""

new_migration = """            new_columns = [
                ("export_location", "VARCHAR(100) DEFAULT 'Grobogan'"),
                ("export_signature_enabled", "TINYINT(1) DEFAULT 1"),
                ("export_signature_name", "VARCHAR(150) DEFAULT '( ......................................... )'"),
                ("export_signature_role", "VARCHAR(150) DEFAULT 'Mengetahui,'"),
                ("alpha_limit_time", "VARCHAR(10) DEFAULT '07:30'"),
                ("google_api_key", "VARCHAR(255)"),
                ("test_mode", "TINYINT(1) DEFAULT 0"),
                ("presence_limit_time", "VARCHAR(10) DEFAULT '14:00'"),
                ("checkin_start_time", "VARCHAR(10) DEFAULT '06:00'"),
                ("checkout_start_time", "VARCHAR(10) DEFAULT '14:00'")
            ]"""

content = content.replace(old_migration, new_migration)

# Add to Seed
old_seed_insert = """                    INSERT INTO system_settings
                    (id, cooldown_seconds, min_gap_minutes, checkout_start_hour, program_start_date, success_sound_url, success_sound_enabled,
                     export_location, export_signature_enabled, export_signature_name, export_signature_role, alpha_limit_time, presence_limit_time)
                    VALUES (1, 60, 60, 11, '2026-03-01', '/api/sounds/applepay.mp3', 1, 'Grobogan', 1, '( ......................................... )', 'Mengetahui,', '07:30', '14:00')"""

new_seed_insert = """                    INSERT INTO system_settings
                    (id, cooldown_seconds, min_gap_minutes, checkout_start_hour, program_start_date, success_sound_url, success_sound_enabled,
                     export_location, export_signature_enabled, export_signature_name, export_signature_role, alpha_limit_time, presence_limit_time, checkin_start_time, checkout_start_time)
                    VALUES (1, 60, 60, 11, '2026-03-01', '/api/sounds/applepay.mp3', 1, 'Grobogan', 1, '( ......................................... )', 'Mengetahui,', '07:30', '14:00', '06:00', '14:00')"""

content = content.replace(old_seed_insert, new_seed_insert)

with open("database.py", "w") as f:
    f.write(content)

print("DB Schema Updated.")
