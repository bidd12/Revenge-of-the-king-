from __future__ import annotations

import argparse
import os
import threading
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
HOST = "127.0.0.1"
PORTS = range(8000, 8010)


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def create_server() -> tuple[ThreadingHTTPServer, int]:
    os.chdir(ROOT)
    last_error: OSError | None = None
    for port in PORTS:
        try:
            return ThreadingHTTPServer((HOST, port), NoCacheHandler), port
        except OSError as error:
            last_error = error
    raise RuntimeError("Не удалось найти свободный порт 8000-8009") from last_error


def main() -> None:
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument("--check", action="store_true")
    args, _ = parser.parse_known_args()

    server, port = create_server()
    url = f"http://localhost:{port}/"

    if args.check:
        server.server_close()
        print(f"Launcher check: OK ({url})")
        return

    print("Месть королю")
    print(f"Игра запускается: {url}")
    print("Чтобы остановить сервер, нажмите Ctrl+C.")

    # Браузер открывается только после успешного запуска сервера.
    threading.Timer(0.4, lambda: webbrowser.open(url)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nСервер остановлен.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
