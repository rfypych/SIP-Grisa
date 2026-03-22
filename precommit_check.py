import subprocess

def run_checks():
    print("Running basic syntax check for python...")
    res = subprocess.run(["python", "-m", "py_compile", "api.py"], capture_output=True)
    if res.returncode != 0:
        print("Python syntax error:", res.stderr.decode())
        return False
    print("Python check passed.")

    print("Running typescript build check...")
    res = subprocess.run(["npm", "run", "build"], capture_output=True)
    if res.returncode != 0:
        print("Build error:", res.stderr.decode())
        return False
    print("TypeScript check passed.")

    return True

if run_checks():
    print("All pre-commit checks passed.")
else:
    print("Pre-commit checks failed.")
