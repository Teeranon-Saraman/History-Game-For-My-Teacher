from __future__ import annotations

import argparse
import html
import json
import mimetypes
import os
import re
import shutil
import subprocess
import sys
import threading
import time
import webbrowser
from dataclasses import asdict, dataclass
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


@dataclass
class CutBox:
    name: str
    x: int
    y: int
    w: int
    h: int


STRUCTURE_BOXES = [
    CutBox("soil_top", 44, 116, 132, 112),
    CutBox("grass_top", 169, 106, 120, 126),
    CutBox("ruin_arch", 294, 22, 194, 216),
    CutBox("ruin_wall", 490, 91, 266, 145),
    CutBox("jungle", 774, 91, 166, 139),
    CutBox("fence", 47, 268, 229, 116),
    CutBox("stone_wall", 294, 276, 235, 112),
    CutBox("stone_wall_grass", 588, 278, 170, 106),
    CutBox("chest", 774, 286, 194, 119),
    CutBox("soil_big", 42, 408, 242, 206),
    CutBox("pit", 311, 407, 402, 222),
    CutBox("bush", 798, 487, 168, 104),
    CutBox("soil_long", 42, 662, 240, 120),
    CutBox("stone_floor", 300, 671, 145, 109),
    CutBox("grass_tile", 492, 681, 145, 104),
    CutBox("buried", 642, 686, 144, 94),
    CutBox("grass_patch", 798, 657, 164, 121),
    CutBox("soil_small", 48, 811, 122, 95),
    CutBox("soil_dark", 260, 815, 100, 92),
    CutBox("rubble", 429, 803, 274, 121),
    CutBox("pots", 774, 803, 191, 134),
]

TOOL_BOXES = [
    CutBox("tool_0", 44, 44, 88, 178),
    CutBox("tool_1", 139, 86, 114, 137),
    CutBox("tool_2", 291, 95, 97, 128),
    CutBox("tool_3", 411, 59, 92, 180),
    CutBox("tool_4", 48, 263, 92, 111),
    CutBox("tool_5", 171, 245, 86, 142),
    CutBox("tool_6", 288, 270, 101, 103),
    CutBox("tool_7", 421, 267, 99, 127),
]


def character_boxes() -> list[CutBox]:
    boxes = []
    frame_w = 256
    frame_h = 341
    for row in range(3):
        for col in range(4):
            boxes.append(CutBox(f"r{row}_{col}", col * frame_w, row * frame_h, frame_w, frame_h))
    return boxes


def oldman_boxes() -> list[CutBox]:
    return [CutBox("0", 0, 0, 512, 512), CutBox("1", 512, 0, 512, 512)]


PRESETS = {
    "structure": STRUCTURE_BOXES,
    "tools": TOOL_BOXES,
    "character": character_boxes(),
    "oldman": oldman_boxes(),
}


def detect_preset(path: Path) -> str:
    stem = path.stem.lower()
    if "tool" in stem:
        return "tools"
    if stem in {"boy", "girl"}:
        return "character"
    if "oldman" in stem:
        return "oldman"
    return "structure"


def safe_file_name(name: str) -> str:
    name = name.strip()
    if not name:
        name = "cut"
    name = name.replace("\\", "/").split("/")[-1]
    name = re.sub(r"[^A-Za-z0-9._-]+", "_", name).strip("._")
    if not name:
        name = "cut"
    if not name.lower().endswith(".png"):
        name += ".png"
    return name


def crop_with_sips(source: Path, output: Path, x: int, y: int, w: int, h: int) -> None:
    if not shutil.which("sips"):
        raise RuntimeError("macOS 'sips' command was not found. This tool needs sips to save crops.")
    output.parent.mkdir(parents=True, exist_ok=True)
    command = [
        "sips",
        str(source),
        "-c",
        str(h),
        str(w),
        "--cropOffset",
        str(y),
        str(x),
        "--out",
        str(output),
    ]
    subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)


def make_handler(image_path: Path, out_dir: Path, preset_name: str):
    image_abs = image_path.resolve()
    out_default = out_dir
    presets = [asdict(box) for box in PRESETS[preset_name]]

    class CropHandler(BaseHTTPRequestHandler):
        def log_message(self, fmt, *args):
            return

        def send_json(self, status: int, payload: dict):
            body = json.dumps(payload).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            path = urlparse(self.path).path
            if path == "/":
                self.send_html()
            elif path == "/image":
                self.send_image()
            elif path == "/favicon.ico":
                self.send_response(404)
                self.end_headers()
            else:
                self.send_response(404)
                self.end_headers()

        def do_POST(self):
            path = urlparse(self.path).path
            if path != "/save":
                self.send_json(404, {"ok": False, "error": "Not found"})
                return
            length = int(self.headers.get("Content-Length", "0") or "0")
            try:
                payload = json.loads(self.rfile.read(length).decode("utf-8"))
                x = max(0, int(round(float(payload["x"]))))
                y = max(0, int(round(float(payload["y"]))))
                w = max(1, int(round(float(payload["w"]))))
                h = max(1, int(round(float(payload["h"]))))
                file_name = safe_file_name(str(payload.get("name", "cut")))
                folder_text = str(payload.get("folder", str(out_default))).strip() or str(out_default)
                folder = Path(folder_text).expanduser()
                if not folder.is_absolute():
                    folder = Path.cwd() / folder
                output = folder / file_name
                crop_with_sips(image_abs, output, x, y, w, h)
                self.send_json(200, {"ok": True, "path": str(output), "file": file_name})
            except Exception as exc:
                self.send_json(400, {"ok": False, "error": str(exc)})

        def send_image(self):
            content_type = mimetypes.guess_type(str(image_abs))[0] or "application/octet-stream"
            data = image_abs.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)

        def send_html(self):
            html_text = build_html(
                image_name=image_abs.name,
                out_default=str(out_default),
                presets=presets,
                preset_name=preset_name,
            )
            body = html_text.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

    return CropHandler


def build_html(image_name: str, out_default: str, presets: list[dict], preset_name: str) -> str:
    presets_json = json.dumps(presets)
    image_label = html.escape(image_name)
    out_label = html.escape(out_default)
    preset_label = html.escape(preset_name)
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Manual Cut Tool - {image_label}</title>
<style>
  * {{ box-sizing: border-box; }}
  body {{
    margin: 0;
    min-height: 100vh;
    color: #f6dfb2;
    background: #120904;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    overflow: hidden;
  }}
  #app {{
    display: grid;
    grid-template-columns: minmax(0, 1fr) 340px;
    height: 100vh;
  }}
  #stage {{
    display: grid;
    place-items: center;
    padding: 14px;
    overflow: hidden;
    background:
      linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px),
      linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
      #160b05;
    background-size: 24px 24px;
  }}
  canvas {{
    max-width: 100%;
    max-height: 100%;
    image-rendering: pixelated;
    background: #050302;
    border: 2px solid #8b5a1a;
    box-shadow: 0 16px 40px rgba(0,0,0,.55);
    cursor: crosshair;
  }}
  aside {{
    border-left: 2px solid #38200d;
    background: #1b0d05;
    padding: 16px;
    overflow: auto;
  }}
  h1 {{
    margin: 0 0 4px;
    font-size: 18px;
    color: #ffd166;
  }}
  .sub {{
    margin-bottom: 16px;
    color: #b8955a;
    font-size: 13px;
  }}
  label {{
    display: block;
    margin: 12px 0 6px;
    color: #e8c98a;
    font-size: 13px;
    font-weight: 700;
  }}
  input, select, button {{
    width: 100%;
    font: inherit;
    border-radius: 6px;
    border: 1px solid #8b5a1a;
    background: #0f0703;
    color: #f6dfb2;
    padding: 9px 10px;
  }}
  button {{
    margin-top: 12px;
    cursor: pointer;
    border-color: #c89638;
    background: #5c2e00;
    color: #ffd166;
    font-weight: 800;
  }}
  button.primary {{
    background: #1e5c14;
    color: #c9f2bd;
    border-color: #4caf50;
  }}
  .grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }}
  #msg {{
    min-height: 38px;
    margin-top: 12px;
    padding: 10px;
    border: 1px solid #38200d;
    border-radius: 6px;
    color: #d6ba7c;
    background: rgba(255,255,255,.035);
    font-size: 13px;
    overflow-wrap: anywhere;
  }}
  .help {{
    margin-top: 14px;
    color: #9f7a43;
    font-size: 12px;
    line-height: 1.45;
  }}
</style>
</head>
<body>
<div id="app">
  <main id="stage"><canvas id="canvas"></canvas></main>
  <aside>
    <h1>Manual Cut</h1>
    <div class="sub">{image_label} · preset: {preset_label}</div>

    <label for="preset">Default block</label>
    <select id="preset"></select>

    <label for="name">Output file name</label>
    <input id="name" placeholder="example: chest">

    <label for="folder">Output folder</label>
    <input id="folder" value="{out_label}">

    <div class="grid">
      <div><label for="x">X</label><input id="x" type="number"></div>
      <div><label for="y">Y</label><input id="y" type="number"></div>
      <div><label for="w">Width</label><input id="w" type="number"></div>
      <div><label for="h">Height</label><input id="h" type="number"></div>
    </div>

    <button class="primary" id="save">Save Crop</button>
    <button id="reset">Reset To Selected Default</button>
    <div id="msg">Loading image...</div>
    <div class="help">
      Drag empty space to make a new block.<br>
      Drag inside the block to move it.<br>
      Drag a corner to resize it.<br>
      Type your name, then Save Crop.
    </div>
  </aside>
</div>
<script>
const presets = {presets_json};
const img = new Image();
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
const fields = {{
  preset: document.getElementById('preset'),
  name: document.getElementById('name'),
  folder: document.getElementById('folder'),
  x: document.getElementById('x'),
  y: document.getElementById('y'),
  w: document.getElementById('w'),
  h: document.getElementById('h'),
  msg: document.getElementById('msg'),
}};
let box = {{ name: 'cut', x: 20, y: 20, w: 96, h: 96 }};
let view = {{ scale: 1, ox: 0, oy: 0, w: 0, h: 0 }};
let drag = null;

function setMsg(text, good=false) {{
  fields.msg.textContent = text;
  fields.msg.style.color = good ? '#c9f2bd' : '#d6ba7c';
}}

function clampBox() {{
  box.x = Math.max(0, Math.min(Math.round(box.x), img.naturalWidth - 1));
  box.y = Math.max(0, Math.min(Math.round(box.y), img.naturalHeight - 1));
  box.w = Math.max(1, Math.min(Math.round(box.w), img.naturalWidth - box.x));
  box.h = Math.max(1, Math.min(Math.round(box.h), img.naturalHeight - box.y));
}}

function syncInputs() {{
  clampBox();
  fields.name.value = box.name || 'cut';
  fields.x.value = box.x;
  fields.y.value = box.y;
  fields.w.value = box.w;
  fields.h.value = box.h;
}}

function readInputs() {{
  box.name = fields.name.value || 'cut';
  box.x = Number(fields.x.value) || 0;
  box.y = Number(fields.y.value) || 0;
  box.w = Number(fields.w.value) || 1;
  box.h = Number(fields.h.value) || 1;
  clampBox();
}}

function resizeCanvas() {{
  const stage = document.getElementById('stage');
  const maxW = Math.max(320, stage.clientWidth - 28);
  const maxH = Math.max(240, stage.clientHeight - 28);
  const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
  view.scale = scale;
  view.w = Math.round(img.naturalWidth * scale);
  view.h = Math.round(img.naturalHeight * scale);
  view.ox = Math.floor((maxW - view.w) / 2);
  view.oy = Math.floor((maxH - view.h) / 2);
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.style.width = maxW + 'px';
  canvas.style.height = maxH + 'px';
  canvas.width = Math.round(maxW * dpr);
  canvas.height = Math.round(maxH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  draw();
}}

function ix(x) {{ return view.ox + x * view.scale; }}
function iy(y) {{ return view.oy + y * view.scale; }}
function imagePoint(event) {{
  const r = canvas.getBoundingClientRect();
  return {{
    x: (event.clientX - r.left - view.ox) / view.scale,
    y: (event.clientY - r.top - view.oy) / view.scale,
  }};
}}

function draw() {{
  if (!img.naturalWidth) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#080403';
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  ctx.drawImage(img, view.ox, view.oy, view.w, view.h);
  const x = ix(box.x), y = iy(box.y), w = box.w * view.scale, h = box.h * view.scale;
  ctx.save();
  ctx.fillStyle = 'rgba(255, 209, 102, .15)';
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = '#120904';
  ctx.strokeStyle = '#ffd166';
  for (const p of [[x,y],[x+w,y],[x,y+h],[x+w,y+h]]) {{
    ctx.fillRect(p[0]-5, p[1]-5, 10, 10);
    ctx.strokeRect(p[0]-5, p[1]-5, 10, 10);
  }}
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 12px Menlo, monospace';
  ctx.fillText(`${{box.name}} ${{box.w}}x${{box.h}}`, x + 6, Math.max(14, y - 7));
  ctx.restore();
}}

function near(a, b) {{ return Math.abs(a - b) <= 10 / view.scale; }}
function hitMode(p) {{
  const x2 = box.x + box.w, y2 = box.y + box.h;
  if (near(p.x, box.x) && near(p.y, box.y)) return 'resize-nw';
  if (near(p.x, x2) && near(p.y, box.y)) return 'resize-ne';
  if (near(p.x, box.x) && near(p.y, y2)) return 'resize-sw';
  if (near(p.x, x2) && near(p.y, y2)) return 'resize-se';
  if (p.x >= box.x && p.x <= x2 && p.y >= box.y && p.y <= y2) return 'move';
  return 'draw';
}}

canvas.addEventListener('pointerdown', event => {{
  const p = imagePoint(event);
  readInputs();
  drag = {{ mode: hitMode(p), start: p, startBox: {{...box}} }};
  canvas.setPointerCapture(event.pointerId);
}});

canvas.addEventListener('pointermove', event => {{
  if (!drag) return;
  const p = imagePoint(event);
  const dx = p.x - drag.start.x, dy = p.y - drag.start.y;
  const b = drag.startBox;
  if (drag.mode === 'move') {{
    box.x = b.x + dx; box.y = b.y + dy;
  }} else if (drag.mode === 'draw') {{
    box.x = Math.min(drag.start.x, p.x);
    box.y = Math.min(drag.start.y, p.y);
    box.w = Math.abs(dx);
    box.h = Math.abs(dy);
  }} else {{
    let left = b.x, top = b.y, right = b.x + b.w, bottom = b.y + b.h;
    if (drag.mode.includes('w')) left += dx;
    if (drag.mode.includes('e')) right += dx;
    if (drag.mode.includes('n')) top += dy;
    if (drag.mode.includes('s')) bottom += dy;
    box.x = Math.min(left, right);
    box.y = Math.min(top, bottom);
    box.w = Math.abs(right - left);
    box.h = Math.abs(bottom - top);
  }}
  syncInputs();
  draw();
}});

canvas.addEventListener('pointerup', () => {{ drag = null; }});

['x','y','w','h','name'].forEach(id => {{
  fields[id].addEventListener('input', () => {{ readInputs(); draw(); }});
}});

function applyPreset(index) {{
  const preset = presets[index] || presets[0] || {{ name:'cut', x:20, y:20, w:96, h:96 }};
  box = {{...preset}};
  syncInputs();
  draw();
}}

presets.forEach((preset, index) => {{
  const option = document.createElement('option');
  option.value = index;
  option.textContent = `${{index}} · ${{preset.name}}`;
  fields.preset.appendChild(option);
}});
fields.preset.addEventListener('change', () => applyPreset(Number(fields.preset.value)));
document.getElementById('reset').addEventListener('click', () => applyPreset(Number(fields.preset.value)));

document.getElementById('save').addEventListener('click', async () => {{
  readInputs();
  syncInputs();
  setMsg('Saving...');
  const response = await fetch('/save', {{
    method: 'POST',
    headers: {{ 'Content-Type': 'application/json' }},
    body: JSON.stringify({{
      name: fields.name.value,
      folder: fields.folder.value,
      x: box.x,
      y: box.y,
      w: box.w,
      h: box.h,
    }}),
  }});
  const result = await response.json();
  if (result.ok) setMsg('Saved: ' + result.path, true);
  else setMsg('Save failed: ' + result.error);
}});

img.onload = () => {{
  applyPreset(0);
  resizeCanvas();
  setMsg('Ready. Drag block, type name, click Save Crop.', true);
}};
img.onerror = () => setMsg('Could not load image.');
img.src = '/image?ts=' + Date.now();
window.addEventListener('resize', resizeCanvas);
</script>
</body>
</html>"""


def find_server(port: int, handler) -> ThreadingHTTPServer:
    for candidate in range(port, port + 40):
        try:
            return ThreadingHTTPServer(("127.0.0.1", candidate), handler)
        except OSError:
            continue
    raise RuntimeError(f"No free localhost port found from {port} to {port + 39}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("image", type=Path)
    parser.add_argument("--preset", choices=sorted(PRESETS), default=None)
    parser.add_argument("--out", type=Path, default=None)
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--no-open", action="store_true")
    args = parser.parse_args()

    image_path = args.image
    if not image_path.exists():
        print(f"Image not found: {image_path}", file=sys.stderr)
        return 1
    if image_path.suffix.lower() != ".png":
        print("This tool is intended for PNG files.", file=sys.stderr)
        return 1

    preset = args.preset or detect_preset(image_path)
    out_dir = args.out or (Path("img/manual_cut") / image_path.stem)
    handler = make_handler(image_path, out_dir, preset)
    server = find_server(args.port, handler)
    host, port = server.server_address
    url = f"http://{host}:{port}/"

    print(f"Manual cut tool: {url}")
    print(f"Image: {image_path}")
    print(f"Output folder: {out_dir}")
    print("Press Ctrl+C here when done.")

    if not args.no_open:
        threading.Timer(0.35, lambda: webbrowser.open(url)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped manual cut tool.")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
