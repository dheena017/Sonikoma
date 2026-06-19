import cv2
import numpy as np
import os

files = ["stitched_1781781766636_full.png", "stitched_1781781999134_full.png", "stitched_1781782685025_full.png"]
dir_path = r"c:\Users\dheen\Downloads"

def evaluate_on_file(img_path, v_thresh, bypass_thresh, gap_t):
    img = cv2.imread(img_path)
    if img is None:
        return None
    h, w, c = img.shape
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    row_vars = np.var(gray, axis=1)
    row_means = np.mean(gray, axis=1)

    edge_samples = np.concatenate([gray[0, :], gray[-1, :], gray[:, 0], gray[:, -1]])
    median_bg = np.median(edge_samples)
    is_white_bg = median_bg > 127
    sensitivity = 30.0
    threshold_val = int(255 - (sensitivity * 2.5)) if is_white_bg else int(sensitivity * 2.5)
    threshold_val = max(5, min(250, threshold_val))

    if is_white_bg:
        is_gutter = (row_vars < v_thresh) & ((row_means > threshold_val) | (row_vars < bypass_thresh))
    else:
        is_gutter = (row_vars < v_thresh) & ((row_means < threshold_val) | (row_vars < bypass_thresh))
        
    is_content = ~is_gutter
    smoothed = np.copy(is_content)
    gap_count = 0
    for i in range(len(smoothed)):
        if not smoothed[i]:
            gap_count += 1
        else:
            if 0 < gap_count < gap_t:
                smoothed[i - gap_count : i] = True
            gap_count = 0
            
    panels = []
    in_panel = False
    start_y = 0
    for i in range(h):
        if smoothed[i] and not in_panel:
            in_panel = True
            start_y = i
        elif not smoothed[i] and in_panel:
            in_panel = False
            end_y = i
            if end_y - start_y >= 60:
                panels.append((start_y, end_y))
    if in_panel:
        end_y = h
        if end_y - start_y >= 60:
            panels.append((start_y, end_y))
            
    tall_panels = [p for p in panels if (p[1] - p[0]) > 1000]
    return len(panels), len(tall_panels), [p[1] - p[0] for p in tall_panels]

print("Evaluating configurations across all 3 files:")
print("-" * 100)

configs = [
    # (v_thresh, bypass_thresh, gap_t_formula)
    ("Current", 64, 4, lambda w: max(8, min(30, int(w * 0.04)))),
    ("Gap=2, B=16", 64, 16, lambda w: 2),
    ("Gap=3, B=16", 64, 16, lambda w: 3),
    ("Gap=4, B=16", 64, 16, lambda w: 4),
    ("Gap=2, B=25", 64, 25, lambda w: 2),
    ("Gap=3, B=25", 64, 25, lambda w: 3),
    ("Gap=4, B=25", 64, 25, lambda w: 4),
    ("Gap=w*0.01, B=25", 64, 25, lambda w: max(2, int(w * 0.01))),
    ("Gap=w*0.02, B=25", 64, 25, lambda w: max(2, int(w * 0.02))),
]

for name, vt, bp, gap_func in configs:
    print(f"\nConfiguration: {name} (v_thresh={vt}, bypass={bp})")
    for fname in files:
        fpath = os.path.join(dir_path, fname)
        if not os.path.exists(fpath):
            continue
        
        # Determine width
        img = cv2.imread(fpath)
        w = img.shape[1]
        gap_t = gap_func(w)
        
        res = evaluate_on_file(fpath, vt, bp, gap_t)
        if res:
            p_cnt, t_cnt, tall_heights = res
            print(f"  {fname:35s} (w={w:3d}, gap_t={gap_t:2d}) -> panels={p_cnt:3d}, tall={t_cnt:2d} heights={tall_heights[:5]}")
