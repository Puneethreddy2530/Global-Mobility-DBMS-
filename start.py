import subprocess
import sys
import os
import time

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "backend")

    print("[*] Starting FastAPI Backend on http://localhost:8000 ...")
    backend_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--reload", "--port", "8000"],
        cwd=backend_dir
    )

    print("[*] Starting Frontend HTTP Server on http://localhost:3000 ...")
    frontend_process = subprocess.Popen(
        [sys.executable, "-m", "http.server", "3000"],
        cwd=root_dir
    )

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[*] Shutting down...")
        backend_process.terminate()
        frontend_process.terminate()
        backend_process.wait()
        frontend_process.wait()
        print("[*] All processes stopped.")

if __name__ == "__main__":
    main()
