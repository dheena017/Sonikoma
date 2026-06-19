import subprocess
import json
import os

files = ["stitched_1781781766636_full.png", "stitched_1781781999134_full.png", "stitched_1781782685025_full.png"]
dir_path = r"c:\Users\dheen\Downloads"
detect_script = r"backend\python\services\detect_panels.py"

for fname in files:
    fpath = os.path.join(dir_path, fname)
    if not os.path.exists(fpath):
        print(f"Skipping {fname} (not found)")
        continue
        
    cmd = [
        "python", detect_script,
        "--image_path", fpath,
        "--sensitivity", "30",
        "--min_height_px", "60",
        "--min_width_pct", "0.15",
        "--merge_threshold", "20",
        "--aspect_ratio", "free"
    ]
    
    print(f"Running detection on {fname}...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"  Error running detector: {res.stderr}")
    else:
        try:
            data = json.loads(res.stdout.strip())
            if data.get("success"):
                panels = data.get("panels", [])
                print(f"  Success! Detected {len(panels)} panels.")
                # Print heights of 5 largest panels
                heights = sorted([p["height"] for p in panels], reverse=True)
                print(f"  Largest panel heights: {heights[:5]}")
            else:
                print(f"  Detector returned error: {data.get('error')}")
        except Exception as e:
            print(f"  Failed to parse output: {e}\nOutput was: {res.stdout}")
