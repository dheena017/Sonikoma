"""
backend/scripts/run_detect_batch.py
─────────────────────────────────────────────────────────────────────────────
Standalone Runner for Batch Comic & Webtoon Panel Detection:
Processes multiple image URLs or a directory of local comic files concurrently:
1. Enforces concurrency throttling via asyncio.Semaphore
2. Auto-classifies each image format via detect_type_service
3. Routes long strips to detect_long_panels and standard pages to detect_small_panels
4. Aggregates results, panel counts, dialogue balloon counts, and timings
5. Produces comprehensive batch summary metrics and individual artifact files

Outputs:
1. batch_panels.json            -> Single consolidated JSON file containing batch summary metrics and all item panels
─────────────────────────────────────────────────────────────────────────────
Usage:
  python backend/scripts/run_detect_batch.py
  python backend/scripts/run_detect_batch.py --dir path/to/images_dir/
  python backend/scripts/run_detect_batch.py --urls "https://ex.com/1.jpg,https://ex.com/2.jpg"
"""

import os
import sys
import io
import time
import json
import argparse
import asyncio
from pathlib import Path
from typing import Optional, Dict, Any, List
import cv2
import numpy as np
from PIL import Image, ImageDraw

# Ensure backend root directory is in sys.path
SCRIPT_DIR = os.path.abspath(os.path.dirname(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from features.platform.projects.schemas_project import (
    DetectPanelsBatchRequest,
    DetectPanelsBatchResponse,
)
from features.image.detector.detect_batch_service import (
    detect_batch_panels,
    process_single_url,
)

DEFAULT_OUTPUT_DIR = os.path.join(BACKEND_DIR, "data", "output", "batch_detection")


def to_file_uri(p: str) -> str:
    """Converts a local path to a clickable file:// URI."""
    return Path(os.path.abspath(p)).as_uri()


def create_demo_batch_files(target_dir: str) -> List[str]:
    """Creates 3 synthetic demo comic images for batch testing."""
    os.makedirs(target_dir, exist_ok=True)
    paths = []

    # 1. Single Frame
    f1 = os.path.join(target_dir, "batch_demo_01_frame.png")
    img1 = Image.new("RGB", (500, 500), (255, 255, 255))
    draw1 = ImageDraw.Draw(img1)
    draw1.rectangle([30, 30, 470, 470], outline=(0, 0, 0), width=4, fill=(240, 240, 245))
    draw1.ellipse([100, 100, 260, 200], outline=(0, 0, 0), width=2, fill=(255, 255, 255))
    img1.save(f1)
    paths.append(f1)

    # 2. Tall Strip
    f2 = os.path.join(target_dir, "batch_demo_02_strip.png")
    img2 = Image.new("RGB", (500, 1500), (255, 255, 255))
    draw2 = ImageDraw.Draw(img2)
    draw2.rectangle([30, 50, 470, 450], outline=(0, 0, 0), width=4, fill=(235, 240, 250))
    draw2.rectangle([30, 520, 470, 950], outline=(0, 0, 0), width=4, fill=(235, 240, 250))
    draw2.rectangle([30, 1020, 470, 1450], outline=(0, 0, 0), width=4, fill=(235, 240, 250))
    img2.save(f2)
    paths.append(f2)

    # 3. 2-Panel Manga Page
    f3 = os.path.join(target_dir, "batch_demo_03_manga.png")
    img3 = Image.new("RGB", (600, 800), (255, 255, 255))
    draw3 = ImageDraw.Draw(img3)
    draw3.rectangle([40, 40, 560, 380], outline=(0, 0, 0), width=4, fill=(245, 245, 245))
    draw3.rectangle([40, 420, 560, 760], outline=(0, 0, 0), width=4, fill=(245, 245, 245))
    img3.save(f3)
    paths.append(f3)

    return paths


def run_pipeline(
    urls: Optional[List[str]] = None,
    directory: Optional[str] = None,
    concurrency: int = 4,
    output_dir: Optional[str] = None,
) -> None:
    """Executes batch detection pipeline on the provided targets."""
    out_dir = output_dir or DEFAULT_OUTPUT_DIR
    os.makedirs(out_dir, exist_ok=True)

    input_targets: List[str] = []

    if directory and os.path.exists(directory) and os.path.isdir(directory):
        print(f"[*] Scanning directory for images: '{directory}'...")
        valid_exts = (".png", ".jpg", ".jpeg", ".webp")
        for root, _, files in os.walk(directory):
            for f in sorted(files):
                if f.lower().endswith(valid_exts):
                    input_targets.append(os.path.join(root, f))
    elif urls:
        if not any(u.strip().lower() == "demo" for u in urls):
            input_targets = urls
    else:
        print("\n" + "=" * 70)
        print("  SONIKOMA - BATCH PANEL & BUBBLE DETECTION RUNNER")
        print("=" * 70)
        prompt_val = input("Enter comma-separated URLs/Paths, or press [Enter] for Demo batch: ").strip()
        if prompt_val and prompt_val.lower() != "demo":
            input_targets = [u.strip() for u in prompt_val.split(",") if u.strip()]

    if not input_targets:
        print("[*] Generating dynamic synthetic comic image batch for demonstration...")
        demo_dir = os.path.join(out_dir, "_demo_inputs")
        input_targets = create_demo_batch_files(demo_dir)

    print(f"\n[*] Starting Batch Detection for {len(input_targets)} item(s) (concurrency={concurrency})...")
    start_t = time.perf_counter()

    batch_req = DetectPanelsBatchRequest(
        urls=input_targets,
        max_concurrency=concurrency,
        sensitivity=30.0,
        aspect_ratio="free",
        auto_split=True,
    )
    batch_res: DetectPanelsBatchResponse = asyncio.run(detect_batch_panels(batch_req))
    elapsed_ms = int((time.perf_counter() - start_t) * 1000)

    results = batch_res.results or []
    succeeded = sum(1 for r in results if r.get("success"))
    failed = len(results) - succeeded
    total_panels = sum(r.get("panels_count", 0) for r in results)
    total_bubbles = sum(r.get("speech_bubbles_count", 0) for r in results)

    print(f"\n[+] Batch Run Completed in {elapsed_ms}ms:")
    print(f"    • Total Images    : {batch_res.total_images}")
    print(f"    • Succeeded Items : {succeeded}")
    print(f"    • Failed Items    : {failed}")
    print(f"    • Total Panels    : {total_panels}")
    print(f"    • Total Bubbles   : {total_bubbles}")

    # Save all batch results and metrics into one single consolidated file
    batch_dict = batch_res.model_dump() if hasattr(batch_res, "model_dump") else batch_res.dict()
    batch_dict["total_execution_time_ms"] = elapsed_ms
    batch_dict["succeeded_count"] = succeeded
    batch_dict["failed_count"] = failed
    batch_dict["total_panels"] = total_panels
    batch_dict["total_bubbles"] = total_bubbles

    batch_output_path = os.path.join(out_dir, "batch_panels.json")
    with open(batch_output_path, "w", encoding="utf-8") as f:
        json.dump(batch_dict, f, indent=2)
    print(f"\n    • Consolidated Results Saved (Single File) : {to_file_uri(batch_output_path)}")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Standalone Runner for Batch Comic Panel Detection")
    parser.add_argument("--urls", type=str, default=None, help="Comma-separated image URLs or file paths")
    parser.add_argument("--dir", type=str, default=None, help="Directory containing images to process")
    parser.add_argument("-c", "--concurrency", type=int, default=4, help="Maximum concurrent worker tasks")
    parser.add_argument("-o", "--output", type=str, default=None, help="Custom output directory")
    args = parser.parse_args()

    url_list = [u.strip() for u in args.urls.split(",") if u.strip()] if args.urls else None
    run_pipeline(urls=url_list, directory=args.dir, concurrency=args.concurrency, output_dir=args.output)
