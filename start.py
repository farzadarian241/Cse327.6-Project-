#!/usr/bin/env python3
"""
HaatBodol (হাতবদল) - Full-Stack Development Server Launcher
Starts both the Java Spring Boot backend (port 8080) and the Next.js frontend (port 3000),
waits for both services to be ready, and opens the application in your default browser.
"""

import os
import sys
import time
import signal
import socket
import subprocess
import webbrowser
import threading

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(PROJECT_DIR, "backend")

MYSQL_HOST = "127.0.0.1"
MYSQL_PORT = 3306
BACKEND_PORT = 8080
FRONTEND_PORT = 3000

BACKEND_URL = f"http://127.0.0.1:{BACKEND_PORT}"
APP_URL = f"http://localhost:{FRONTEND_PORT}"


def is_port_open(host, port, timeout=1.0):
    """Check if a TCP port is accepting connections."""
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except (socket.timeout, ConnectionRefusedError, OSError):
        return False


def is_service_ready(port):
    """Check if a local service is listening on IPv4 or localhost."""
    return is_port_open("127.0.0.1", port, timeout=0.5) or is_port_open("localhost", port, timeout=0.5)


def spawn_in_group(cmd, cwd):
    """Spawn a subprocess inside its own process group for clean teardown."""
    if os.name == "posix":
        return subprocess.Popen(cmd, cwd=cwd, start_new_session=True)
    return subprocess.Popen(
        cmd,
        cwd=cwd,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP,
    )


def terminate_process_group(proc, label):
    """Cleanly terminate a subprocess and all of its child processes."""
    if proc is None or proc.poll() is not None:
        return

    print(f"🛑 Stopping {label} (PID {proc.pid})...")
    try:
        if os.name == "posix":
            pgid = os.getpgid(proc.pid)
            os.killpg(pgid, signal.SIGTERM)
        else:
            proc.terminate()
    except ProcessLookupError:
        return
    except OSError:
        pass

    try:
        proc.wait(timeout=5)
        return
    except subprocess.TimeoutExpired:
        pass

    try:
        if os.name == "posix":
            pgid = os.getpgid(proc.pid)
            os.killpg(pgid, signal.SIGKILL)
        else:
            proc.kill()
        proc.wait(timeout=3)
    except (ProcessLookupError, subprocess.TimeoutExpired, OSError):
        pass


def open_browser_when_ready(stop_event):
    """Wait until both Spring Boot (:8080) and Next.js (:3000) are ready, then open browser."""
    backend_announced = False
    frontend_announced = False

    # Wait up to 120 seconds (first Maven run may compile/download dependencies)
    for _ in range(240):
        if stop_event.is_set():
            return

        backend_up = is_service_ready(BACKEND_PORT)
        frontend_up = is_service_ready(FRONTEND_PORT)

        if backend_up and not backend_announced:
            print(f"\n✅ Java Spring Boot backend is ready on {BACKEND_URL}")
            backend_announced = True

        if frontend_up and not frontend_announced:
            print(f"✅ Next.js frontend is ready on {APP_URL}")
            frontend_announced = True

        if backend_up and frontend_up:
            print(f"\n🌐 Both servers are ready! Opening HaatBodol in your browser: {APP_URL}\n")
            webbrowser.open(APP_URL)
            return

        time.sleep(0.5)

    if not stop_event.is_set():
        print(
            f"\n⚠️ Timed out waiting for both ports ({BACKEND_PORT} and {FRONTEND_PORT}). "
            f"Check logs above or visit {APP_URL} manually.\n"
        )


def main():
    os.chdir(PROJECT_DIR)

    print("=" * 64)
    print("   🛒 HaatBodol (হাতবদল) - Full-Stack Development Launcher")
    print("   ☕ Java Spring Boot (:8080) + ⚛️  Next.js Frontend (:3000)")
    print("=" * 64)

    # 1. Check XAMPP MySQL connection
    print(f"🔍 Checking XAMPP MySQL ({MYSQL_HOST}:{MYSQL_PORT})... ", end="", flush=True)
    if is_port_open(MYSQL_HOST, MYSQL_PORT):
        print("✅ Connected!")
    else:
        print("⚠️ Not detected on port 3306.")
        print("   👉 Tip: Please ensure MySQL is started in your XAMPP Control Panel.")

    # 2. Check if node_modules exists
    if not os.path.isdir(os.path.join(PROJECT_DIR, "node_modules")):
        print("📦 node_modules not found. Installing frontend dependencies...")
        subprocess.run(["npm", "install"], cwd=PROJECT_DIR, check=True)

    processes = []
    stop_event = threading.Event()
    shutdown_requested = False

    def handle_signal(signum, frame):
        nonlocal shutdown_requested
        shutdown_requested = True
        raise KeyboardInterrupt()

    signal.signal(signal.SIGTERM, handle_signal)

    try:
        # 3. Start Java Spring Boot backend on port 8080 (or reuse if already running)
        backend_proc = None
        if is_service_ready(BACKEND_PORT):
            print(f"☕ Java Spring Boot backend already running on port {BACKEND_PORT} (skipping launch).")
        else:
            mvnw_name = "mvnw.cmd" if os.name == "nt" else "./mvnw"
            mvnw_path = os.path.join(BACKEND_DIR, "mvnw.cmd" if os.name == "nt" else "mvnw")
            if not os.path.isfile(mvnw_path):
                print(f"❌ Maven wrapper not found at {mvnw_path}. Please verify backend/ setup.")
                sys.exit(1)
            if os.name == "posix" and not os.access(mvnw_path, os.X_OK):
                os.chmod(mvnw_path, os.stat(mvnw_path).st_mode | 0o111)

            print(f"☕ Starting Java Spring Boot backend on {BACKEND_URL}...")
            backend_proc = spawn_in_group([mvnw_name, "spring-boot:run"], cwd=BACKEND_DIR)
            processes.append((backend_proc, "Java Spring Boot backend"))

        # 4. Start Next.js frontend on port 3000
        frontend_proc = None
        if is_service_ready(FRONTEND_PORT):
            print(f"⚛️  Next.js frontend already running on port {FRONTEND_PORT} (skipping launch).")
        else:
            npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
            print(f"🚀 Starting Next.js frontend on {APP_URL}...")
            frontend_proc = spawn_in_group([npm_cmd, "run", "dev"], cwd=PROJECT_DIR)
            processes.append((frontend_proc, "Next.js frontend"))

        # 5. Wait for both :8080 and :3000, then open browser
        threading.Thread(
            target=open_browser_when_ready,
            args=(stop_event,),
            daemon=True,
        ).start()

        if not processes:
            print(f"\n✅ Both servers are already running! Visit {APP_URL}\n")
            time.sleep(1.0)
            return

        print("💡 Press Ctrl+C at any time to stop both servers cleanly.\n")

        # Monitor child processes until interrupted or one exits
        while not shutdown_requested:
            for proc, label in processes:
                ret = proc.poll()
                if ret is not None:
                    print(f"\n⚠️ {label} exited with code {ret}.")
                    return
            time.sleep(0.5)

    except KeyboardInterrupt:
        print("\n🛑 Interrupt received. Shutting down HaatBodol servers...")
    finally:
        stop_event.set()
        for proc, label in reversed(processes):
            terminate_process_group(proc, label)
        print("👋 All HaatBodol servers stopped cleanly. Goodbye!")


if __name__ == "__main__":
    main()
