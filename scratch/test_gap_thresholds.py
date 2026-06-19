import cv2
import numpy as np
import os

image_path = r"c:\Users\dheen\Downloads\stitched_1781781766636_full.png"
img = cv2.imread(image_path)
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

# Targets to check
targets = [38710, 46260, 51000]

def test_settings(v_thresh, bypass_thresh, gap_t):
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
            
    # Check targets
    target_results = []
    for t in targets:
        inside = False
        for sy, ey in panels:
            if sy <= t <= ey:
                inside = True
                break
        target_results.append(inside)
        
    tall_panels = [p for p in panels if (p[1] - p[0]) > 1000]
    return len(panels), len(tall_panels), target_results

print(f"{'gap_t':6s} | {'v_thresh':8s} | {'bypass':6s} | {'panels':6s} | {'tall':4s} | {'38710':5s} | {'46260':5s} | {'51000':5s}")
print("-" * 75)

for gap in [1, 2, 3, 4, 6, 8, 10, 12, 14]:
    for vt in [49, 64]:
        for bp in [4, 16, 25]:
            p_cnt, t_cnt, res = test_settings(vt, bp, gap)
            res_str = " | ".join(f"{'PANEL' if r else 'GUTTER':5s}" for r in res)
            print(f"{gap:6d} | {vt:8d} | {bp:6d} | {p_cnt:6d} | {t_cnt:4d} | {res_str}")
