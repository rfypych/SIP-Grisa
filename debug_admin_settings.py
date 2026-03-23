with open("src/pages/admin/SettingsPage.tsx", "r") as f:
    content = f.read()

if "Jeda Waktu Pulang" in content:
    print("Found 'Jeda Waktu Pulang'")
if "cooldown_seconds" in content:
    print("Found cooldown_seconds logic")

print("Content sample around inputs:")
lines = content.split('\n')
for i, line in enumerate(lines):
    if "input type=" in line:
        print(f"Line {i}: {line.strip()[:100]}")
