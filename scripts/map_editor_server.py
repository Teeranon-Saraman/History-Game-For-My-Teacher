from __future__ import annotations

import argparse
import json
import mimetypes
import re
import socket
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse


ROOT = Path(__file__).resolve().parents[1]


class LocalThreadingHTTPServer(ThreadingHTTPServer):
    address_family = socket.AF_INET6

    def server_bind(self):
        try:
            self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        except OSError:
            pass
        super().server_bind()


def safe_json_name(name: str) -> str:
    name = re.sub(r'[\\/:*?"<>|]+', "_", (name or "map.json").strip())
    if not name:
        name = "map.json"
    if not name.lower().endswith(".json"):
        name += ".json"
    return Path(name).name


def write_map_data_js(map_data: dict) -> Path:
    output_path = ROOT / "map-data.js"
    json_text = json.dumps(map_data, ensure_ascii=False, indent=2)
    output_path.write_text(
        "'use strict';\n"
        "window.STONE_AGE_MAP_DATA = "
        + json_text
        + ";\n",
        encoding="utf-8",
    )
    return output_path


def find_server(port: int, handler) -> ThreadingHTTPServer:
    last_error: OSError | None = None
    for candidate in range(port, port + 40):
        try:
            return LocalThreadingHTTPServer(("::", candidate), handler)
        except OSError as exc:
            last_error = exc
            continue
    detail = f": {last_error}" if last_error else ""
    raise RuntimeError(f"No free localhost port found from {port} to {port + 39}{detail}")


class MapEditorHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(fmt % args)

    def send_json(self, status: int, payload: dict):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = unquote(urlparse(self.path).path)
        if path == "/":
            path = "/map-editor.html"
        file_path = (ROOT / path.lstrip("/")).resolve()
        if ROOT not in file_path.parents and file_path != ROOT:
            self.send_response(403)
            self.end_headers()
            return
        if not file_path.is_file():
            self.send_response(404)
            self.end_headers()
            return
        content_type = mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"
        data = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        path = urlparse(self.path).path
        if path != "/save-map":
            self.send_json(404, {"ok": False, "error": "Not found"})
            return
        length = int(self.headers.get("Content-Length", "0") or "0")
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            file_name = safe_json_name(str(payload.get("fileName", "map.json")))
            map_data = payload["map"]
            output_path = ROOT / file_name
            output_path.write_text(json.dumps(map_data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            extra_paths = []
            if file_name == "map.json":
                extra_paths.append(str(write_map_data_js(map_data)))
            self.send_json(200, {"ok": True, "path": str(output_path), "extraPaths": extra_paths})
        except Exception as exc:
            self.send_json(400, {"ok": False, "error": str(exc)})


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8787)
    parser.add_argument("--no-open", action="store_true")
    args = parser.parse_args()

    server = find_server(args.port, MapEditorHandler)
    port = server.server_address[1]
    url = f"http://localhost:{port}/map-editor.html"
    print(f"Map editor: {url}")
    print(f"Project folder: {ROOT}")
    print("Press Ctrl+C here when done.")

    if not args.no_open:
        threading.Timer(0.35, lambda: webbrowser.open(url)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped map editor.")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
