# Backend Service & API Dynamic Test Template Specification

This document defines the standardized engineering blueprint for dynamically testing any service function or API endpoint across the backend. Every test following this standard provides:
1. **Dynamic Input Flexibility**: Supports synthetic canvas generation, local file paths, web URLs, or base64 payloads.
2. **Dual-Layer Verification**:
   - **Layer 1 (Direct Service)**: Calls the Python service function directly with raw objects.
   - **Layer 2 (API Endpoint)**: Calls the HTTP FastAPI endpoint via `TestClient` to validate full serialization and HTTP status codes.
3. **Structured Input/Output Logging**: Formats inputs, execution latency (`ms`), and output entity schemas clearly.
4. **Visual Artifact Debugging**: Renders detected entities (boxes, polygons, labels) onto an image saved in `backend/data/debug/`.

---

## 1. The 4-Phase Dynamic Test Anatomy

```
┌────────────────────────────────────────────────────────┐
│ Phase 1: Dynamic Input Preparation                      │
│ - Generate synthetic PIL canvas OR load local/URL image│
│ - Package into Request Schema or Raw Parameters        │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Phase 2: Input Inspection & Logging                    │
│ - Pretty-print input image dimensions and parameters   │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Phase 3: Service & API Execution                       │
│ - Measure execution latency (perf_counter)             │
│ - Execute Direct Function call                         │
│ - Execute FastAPI HTTP TestClient call                 │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Phase 4: Output Validation & Visual Debugging          │
│ - Pretty-print JSON response and key entity metrics    │
│ - (Optional) Draw bounding boxes/polygons onto image   │
└────────────────────────────────────────────────────────┘
```

---

## 2. Copy-Pasteable Dynamic Test Script Template

Use this template whenever creating a test script for any service or endpoint in the backend.

```python
"""
backend/tests/dynamic_test_<feature_name>.py
Standardized Dynamic Service & API Endpoint Test Harness
"""

import os
import io
import time
import json
import base64
from typing import Optional
from PIL import Image, ImageDraw
from fastapi.testclient import TestClient

# 1. Import your FastAPI app and Target Services/Schemas
from main import app
from features.platform.projects.schemas_project import (
    DetectSpeechBubblesRequest,
    DetectSpeechBubblesResponse,
)
from features.image_editor.services.panel_detection.speech_bubble_detector import (
    detect_speech_bubbles,
    detect_speech_bubbles_service,
)

client = TestClient(app)
DEBUG_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "debug"))
os.makedirs(DEBUG_DIR, exist_ok=True)


# ==============================================================================
# Helper: Dynamic Input Generators
# ==============================================================================

def create_synthetic_test_image(width: int = 500, height: int = 500) -> Image.Image:
    """Generates a dynamic test image with known shapes and text."""
    img = Image.new("RGB", (width, height), color=(220, 220, 220))
    draw = ImageDraw.Draw(img)

    # Draw a test bubble/panel
    draw.ellipse([80, 80, 320, 260], fill=(255, 255, 255), outline=(0, 0, 0), width=3)
    for y in range(130, 210, 15):
        draw.line([120, y, 280, y], fill=(0, 0, 0), width=2)

    return img


def image_to_base64(pil_img: Image.Image, format: str = "PNG") -> str:
    """Converts a PIL image to a base64 string."""
    buf = io.BytesIO()
    pil_img.save(buf, format=format)
    return base64.b64encode(buf.getvalue()).decode("utf-8")


# ==============================================================================
# Helper: Visual Output Debugger
# ==============================================================================

def draw_and_save_visual_debug(
    pil_img: Image.Image,
    entities: list,
    output_filename: str = "debug_output.png",
) -> str:
    """Draws detected entities on the image and saves it to the debug folder."""
    debug_img = pil_img.copy()
    draw = ImageDraw.Draw(debug_img)

    for idx, e in enumerate(entities):
        x, y, w, h = getattr(e, "x", 0), getattr(e, "y", 0), getattr(e, "width", 0), getattr(e, "height", 0)
        label = getattr(e, "label", getattr(e, "bubble_id", f"item_{idx}"))

        # Draw bounding box
        draw.rectangle([x, y, x + w, y + h], outline=(255, 0, 0), width=3)
        draw.text((x + 4, y + 4), f"{label}", fill=(255, 0, 0))

        # Draw polygon if present
        polygon = getattr(e, "polygon", None)
        if polygon and len(polygon) >= 3:
            flat_poly = [(pt[0], pt[1]) for pt in polygon]
            draw.polygon(flat_poly, outline=(0, 0, 255), width=2)

    output_path = os.path.join(DEBUG_DIR, output_filename)
    debug_img.save(output_path)
    return output_path


# ==============================================================================
# Main Dynamic Test Runner
# ==============================================================================

def run_dynamic_test(image_path: Optional[str] = None):
    print("\n" + "=" * 70)
    print("▶ STARTING DYNAMIC TEST: Speech Bubble Detection")
    print("=" * 70)

    # 1. Prepare Input Image
    if image_path and os.path.exists(image_path):
        print(f"[*] Loading custom test image from: {image_path}")
        pil_img = Image.open(image_path).convert("RGB")
    else:
        print("[*] Generating dynamic synthetic test image...")
        pil_img = create_synthetic_test_image()

    w, h = pil_img.size
    b64_data = image_to_base64(pil_img)

    # 2. Inspect Input
    print("\n--- [1] INPUT PAYLOAD INSPECTION ---")
    print(f"Image Resolution : {w}x{h} px")
    print(f"Base64 Length    : {len(b64_data)} characters")
    print(f"Confidence Thresh: 0.25")

    # 3. Test Layer A: Direct Service Function Execution
    print("\n--- [2] LAYER A: DIRECT SERVICE FUNCTION EXECUTION ---")
    t0 = time.perf_counter()
    direct_entities = detect_speech_bubbles(pil_img, conf_threshold=0.25)
    t_direct_ms = int((time.perf_counter() - t0) * 1000)

    print(f"Status           : OK")
    print(f"Latency          : {t_direct_ms} ms")
    print(f"Entities Count   : {len(direct_entities)}")
    for i, item in enumerate(direct_entities):
        print(f"  [{i + 1}] ID: {item.bubble_id} | Type: {item.sub_type} | Conf: {item.confidence} | Bounds: ({item.x}, {item.y}, {item.width}, {item.height})")

    # 4. Test Layer B: FastAPI HTTP TestClient Endpoint Execution
    print("\n--- [3] LAYER B: FASTAPI HTTP ENDPOINT EXECUTION ---")
    endpoint_url = "/api/v1/panels/detect/speech-bubbles"
    payload = {
        "image_base64": b64_data,
        "conf_threshold": 0.25,
        "detect_chat_ui": True,
    }

    t0 = time.perf_counter()
    response = client.post(endpoint_url, json=payload)
    t_api_ms = int((time.perf_counter() - t0) * 1000)

    print(f"HTTP Endpoint    : POST {endpoint_url}")
    print(f"HTTP Status      : {response.status_code}")
    print(f"API Latency      : {t_api_ms} ms")

    if response.status_code == 200:
        data = response.json()
        print(f"Response Success : {data.get('success')}")
        print(f"Total Bubbles    : {data.get('total_bubbles')}")
        print(f"Server Exec Time : {data.get('execution_time_ms')} ms")
        print("Response JSON Preview:")
        print(json.dumps(data, indent=2)[:400] + "\n  ... [truncated]")
    else:
        print(f"API Error Response: {response.text}")

    # 5. Visual Debug Artifact Output
    if direct_entities:
        debug_file = draw_and_save_visual_debug(pil_img, direct_entities, "speech_bubble_test_result.png")
        print(f"\n[✓] Visual Debug Image Saved to: {debug_file}")

    print("\n" + "=" * 70)
    print("✔ DYNAMIC TEST COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    import sys
    custom_img = sys.argv[1] if len(sys.argv) > 1 else None
    run_dynamic_test(custom_img)
```

---

## 3. How to Run Dynamic Tests

### Command Line:
```powershell
# 1. Run with auto-generated synthetic test image:
python backend/tests/dynamic_test_<feature_name>.py

# 2. Run with any custom comic/manga image file:
python backend/tests/dynamic_test_<feature_name>.py "path/to/my_manga_page.png"
```

### Output Expectations:
1. Complete input parameter inspection.
2. Direct service execution time and parsed Python model objects.
3. Full HTTP JSON serialization test with status code `200`.
4. Visual image with highlighted bounding boxes saved in `backend/data/debug/`.
