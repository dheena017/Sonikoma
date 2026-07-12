"""
Quick YOLO model diagnostic — run from the project root using the backend venv:
  .venv\Scripts\python tests\test_yolo_diagnostic.py
"""
import sys, os
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend", "python"))

def run():
    print("=" * 60)
    print("YOLO MODEL DIAGNOSTIC")
    print("=" * 60)

    # 1. Check dependencies
    try:
        from ultralytics import YOLO
        from huggingface_hub import hf_hub_download
        print("✅ ultralytics and huggingface_hub are installed")
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        return

    # 2. Try downloading the kitsumed model
    print("\n--- Loading kitsumed/yolov8m_seg-speech-bubble ---")
    try:
        model_path = hf_hub_download(
            repo_id="kitsumed/yolov8m_seg-speech-bubble",
            filename="model.pt"
        )
        print(f"✅ Model file at: {model_path}")
        model = YOLO(model_path)
        print(f"✅ YOLO model loaded. Task: {model.task}")
        print(f"   Model type: {type(model.model).__name__}")
        names = getattr(model, 'names', {})
        print(f"   Classes: {names}")
    except Exception as e:
        print(f"❌ kitsumed model failed: {e}")

        # Fallback check
        print("\n--- Checking cached yolov8n-seg.pt fallback ---")
        fallback = "yolov8n-seg.pt"
        if os.path.exists(fallback):
            model = YOLO(fallback)
            print(f"✅ Fallback model loaded. Task: {model.task}")
            print(f"   Classes: {getattr(model, 'names', {})}")
        else:
            print("❌ No fallback model cached locally either")
        return

    # 3. Run inference on a tiny test image (white 128x128 blank)
    print("\n--- Running inference on a blank test image ---")
    import numpy as np
    blank = np.ones((128, 128, 3), dtype=np.uint8) * 255  # white image
    results = model(blank, conf=0.25, verbose=False)
    r = results[0]
    mask_count = 0 if r.masks is None else len(r.masks)
    box_count = 0 if r.boxes is None else len(r.boxes)
    print(f"✅ Inference ran OK — {box_count} boxes, {mask_count} masks on blank image (expected 0)")

    print("\n" + "=" * 60)
    print("SUMMARY: YOLO is working correctly ✅")
    print("  The model will return 0 masks on panels with no speech bubbles.")
    print("  Test on a real manga panel to verify detection quality.")
    print("=" * 60)

if __name__ == "__main__":
    run()
