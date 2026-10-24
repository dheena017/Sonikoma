"""
backend/tests/dynamic_test_speech_bubbles.py
─────────────────────────────────────────────────────────────────────────────
Dynamic Test Harness for Speech Bubble Detection & /detect/speech-bubbles API:
1. Dynamic Input Generation (Synthetic manga bubble or custom user image)
2. Input Inspection & Serialization Check
3. Layer A: Direct Service Function Test (detect_speech_bubbles)
4. Layer B: Full HTTP TestClient Endpoint Test (POST /api/v1/panels/detect/speech-bubbles)
5. Visual Output Artifact Debugger (draws bounding boxes & polygons to data/debug/)
─────────────────────────────────────────────────────────────────────────────
"""

import os
import io
import sys
import time
import json
import base64
from typing import Optional
from PIL import Image, ImageDraw

# Ensure backend directory is in sys.path
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi.testclient import TestClient
from main import app
from features.platform.projects.schemas_project import (
    DetectSpeechBubblesRequest,
    DetectSpeechBubblesResponse,
)
from features.image.detector.main_service_detector.speech_bubble_detector import (
    detect_speech_bubbles,
    detect_speech_bubbles_service,
)

client = TestClient(app)
DEBUG_DIR = os.path.join(BACKEND_DIR, "data", "debug")
os.makedirs(DEBUG_DIR, exist_ok=True)


def create_synthetic_manga_image(width: int = 500, height: int = 500) -> Image.Image:
    """Dynamically generates a synthetic manga frame with a speech bubble and dialogue."""
    img = Image.new("RGB", (width, height), color=(220, 220, 220))
    draw = ImageDraw.Draw(img)

    # Outer panel boundary
    draw.rectangle([20, 20, width - 20, height - 20], outline=(0, 0, 0), width=4)

    # Elliptical white speech bubble
    bx1, by1, bx2, by2 = 80, 80, 360, 280
    draw.ellipse([bx1, by1, bx2, by2], fill=(255, 255, 255), outline=(0, 0, 0), width=3)

    # Dialogue text lines (simulating lettering strokes)
    for y in range(by1 + 45, by2 - 45, 16):
        draw.line([bx1 + 40, y, bx2 - 40, y], fill=(0, 0, 0), width=3)

    # Small secondary exclamation bubble
    draw.ellipse([340, 320, 440, 420], fill=(255, 255, 255), outline=(0, 0, 0), width=2)
    draw.line([380, 350, 400, 390], fill=(0, 0, 0), width=3)

    return img


def draw_visual_debug_artifact(
    pil_img: Image.Image,
    bubbles: list,
    filename: str = "dynamic_speech_bubble_result.png",
) -> str:
    """Renders detected bubble bounding boxes and polygons onto an image."""
    debug_img = pil_img.copy()
    draw = ImageDraw.Draw(debug_img)

    for i, b in enumerate(bubbles):
        bx = getattr(b, "x", 0)
        by = getattr(b, "y", 0)
        bw = getattr(b, "width", 0)
        bh = getattr(b, "height", 0)
        label = getattr(b, "bubble_id", f"bubble_{i+1}")
        sub_type = getattr(b, "sub_type", "speech")
        conf = getattr(b, "confidence", 1.0)

        # Draw red bounding rectangle
        draw.rectangle([bx, by, bx + bw, by + bh], outline=(255, 0, 0), width=3)
        tag = f"[{i+1}] {label} ({sub_type}) {conf:.2f}"
        draw.text((bx + 4, max(0, by - 12)), tag, fill=(255, 0, 0))

        # Draw blue polygon vertices if available
        polygon = getattr(b, "polygon", None)
        if polygon and len(polygon) >= 3:
            pts = [(int(p[0]), int(p[1])) for p in polygon]
            draw.polygon(pts, outline=(0, 0, 255), width=2)

    save_path = os.path.join(DEBUG_DIR, filename)
    debug_img.save(save_path)
    return save_path


def run_dynamic_test(custom_image_path: Optional[str] = None):
    print("=" * 80)
    print("  SONIKOMA DYNAMIC TEST HARNESS: SPEECH BUBBLE DETECTION")
    print("=" * 80)

    # ── Phase 1: Input Preparation ───────────────────────────────────────────
    if custom_image_path and os.path.exists(custom_image_path):
        print(f"\n[Phase 1] Loading User Image: {custom_image_path}")
        pil_img = Image.open(custom_image_path).convert("RGB")
    else:
        print("\n[Phase 1] Generating Dynamic Synthetic Manga Canvas...")
        pil_img = create_synthetic_manga_image()

    w, h = pil_img.size
    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")
    raw_bytes = buf.getvalue()
    b64_str = base64.b64encode(raw_bytes).decode("utf-8")

    # ── Phase 2: Input Inspection ────────────────────────────────────────────
    print("\n[Phase 2] Dynamic Input Inspection:")
    print(f"  • Dimensions       : {w} x {h} px")
    print(f"  • Raw Bytes Size   : {len(raw_bytes):,} bytes")
    print(f"  • Base64 Payload   : {len(b64_str):,} chars (head: {b64_str[:40]}...)")
    print(f"  • Confidence Cutoff: 0.25")

    # ── Phase 3: Layer A - Direct Service Function Test ─────────────────────
    print("\n[Phase 3] Layer A: Direct Service Function (detect_speech_bubbles)")
    t0 = time.perf_counter()
    detected_bubbles = detect_speech_bubbles(pil_img, conf_threshold=0.25)
    t_direct_ms = int((time.perf_counter() - t0) * 1000)

    print(f"  • Service Result   : OK ({len(detected_bubbles)} bubbles detected)")
    print(f"  • Execution Latency: {t_direct_ms} ms")
    for idx, b in enumerate(detected_bubbles):
        print(f"    [{idx + 1}] ID: {b.bubble_id} | Label: {b.label} | Bounds: (x={b.x}, y={b.y}, w={b.width}, h={b.height}) | Conf: {b.confidence}")

    # ── Phase 4: Layer B - FastAPI HTTP Endpoint TestClient Test ─────────────
    endpoint_url = "/api/v1/panels/detect/speech-bubbles"
    print(f"\n[Phase 4] Layer B: HTTP Endpoint TestClient (POST {endpoint_url})")

    req_payload = {
        "image_base64": b64_str,
        "conf_threshold": 0.25,
        "detect_chat_ui": True,
    }

    t0 = time.perf_counter()
    http_resp = client.post(endpoint_url, json=req_payload)
    t_api_ms = int((time.perf_counter() - t0) * 1000)

    print(f"  • HTTP Status Code : {http_resp.status_code}")
    print(f"  • Total Round-Trip : {t_api_ms} ms")

    if http_resp.status_code == 200:
        data = http_resp.json()
        print(f"  • Response Success : {data.get('success')}")
        print(f"  • Total Bubbles    : {data.get('total_bubbles')}")
        print(f"  • Server Exec Time : {data.get('execution_time_ms')} ms")
        print("\n[Phase 5] Structured JSON Output:")
        print(json.dumps(data, indent=2))
    else:
        print(f"  [!] HTTP Error: {http_resp.status_code} - {http_resp.text}")

    # ── Phase 6: Visual Artifact Output ──────────────────────────────────────
    if detected_bubbles:
        artifact_file = draw_visual_debug_artifact(pil_img, detected_bubbles)
        print(f"\n[Phase 6] Visual Debug Artifact Saved:")
        print(f"  • File: {artifact_file}")

    print("\n" + "=" * 80)
    print("✔ TEST HARNESS EXECUTION COMPLETE")
    print("=" * 80)


if __name__ == "__main__":
    cli_image = sys.argv[1] if len(sys.argv) > 1 else None
    run_dynamic_test(cli_image)
