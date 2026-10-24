"""
backend/features/image_editor/services/processing/panel_cleaner.py
─────────────────────────────────────────────────────────────────────────────
Backward compatibility facade for speech bubble cleaning.
Canonical implementation located at features.image.detector.speech_bubble_cleaner.
─────────────────────────────────────────────────────────────────────────────
"""

import sys
import argparse
from features.image.detector.speech_bubble_cleaner import (
    clean_speech_bubbles,
    clean_speech_bubbles_async,
    remove_speech_bubbles,
    remove_speech_bubbles_sync,
)

erase_speech_bubbles_from_panel = remove_speech_bubbles_sync

__all__ = [
    "clean_speech_bubbles",
    "clean_speech_bubbles_async",
    "remove_speech_bubbles",
    "remove_speech_bubbles_sync",
    "erase_speech_bubbles_from_panel",
]

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Webtoon Speech Bubbles Cleaner")
    parser.add_argument("--image_path", required=True)
    parser.add_argument("--output_path", required=True)
    parser.add_argument("--method", default="inpaint")
    parser.add_argument("--sensitivity", type=float, default=50.0)
    parser.add_argument("--dilation", type=int, default=-1)
    parser.add_argument("--inpaint_radius", type=int, default=3)
    parser.add_argument("--detection_style", default="all")
    args = parser.parse_args()

    print("OPENCV_SUPPORT=TRUE")
    try:
        detected = remove_speech_bubbles_sync(
            args.image_path,
            args.output_path,
            method=args.method,
            sensitivity=args.sensitivity,
            dilation=args.dilation,
            inpaint_radius=args.inpaint_radius,
            detection_style=args.detection_style,
        )
        if detected:
            print("BUBBLES_DETECTED=TRUE")
        print("SUCCESS")
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)
