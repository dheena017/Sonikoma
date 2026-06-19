import cv2
import numpy as np
import os
import sys

# Find the latest bin file in stitchedCache
cache_dir = os.path.expandvars(r'%TEMP%\anivox_disk_cache\stitchedCache')
files = [f for f in os.listdir(cache_dir) if f.startswith('stitched_') and f.endswith('_full.bin')]
if not files:
    print("No stitched full images found in temp cache directory!")
    sys.exit(1)

files.sort(key=lambda x: os.path.getmtime(os.path.join(cache_dir, x)), reverse=True)
latest_file = os.path.join(cache_dir, files[0])

img = cv2.imread(latest_file)
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
min_height_px = 60

def run_split_with_settings(v_thresh, bypass_thresh):
    if is_white_bg:
        is_gutter_row = (row_vars < v_thresh) & ((row_means > threshold_val) | (row_vars < bypass_thresh))
    else:
        is_gutter_row = (row_vars < v_thresh) & ((row_means < threshold_val) | (row_vars < bypass_thresh))
        
    is_content_row = ~is_gutter_row
    smoothed_content = np.copy(is_content_row)
    gap_count = 0
    gap_thresh = max(8, min(30, int(w * 0.04)))
    for i in range(len(smoothed_content)):
        if not smoothed_content[i]:
            gap_count += 1
        else:
            if 0 < gap_count < gap_thresh:
                smoothed_content[i - gap_count : i] = True
            gap_count = 0

    panels = []
    in_panel = False
    start_y = 0
    for i in range(h):
        if smoothed_content[i] and not in_panel:
            in_panel = True
            start_y = i
        elif not smoothed_content[i] and in_panel:
            in_panel = False
            end_y = i
            if end_y - start_y >= min_height_px:
                panels.append((start_y, end_y))
    if in_panel:
        end_y = h
        if end_y - start_y >= min_height_px:
            panels.append((start_y, end_y))
            
    return panels

# Current logic (v_thresh=64, bypass=4)
current_panels = run_split_with_settings(64, 4)
print(f"Current logic (v_thresh=64, bypass=4): detected {len(current_panels)} panels.")
# Proposed logic (v_thresh=64, bypass=16) or adaptive
test_panels = run_split_with_settings(64, 16)
print(f"Proposed logic (v_thresh=64, bypass=16): detected {len(test_panels)} panels.")

# Let's see some heights of current panels
print("\nCurrent panel slices:")
for idx, (sy, ey) in enumerate(current_panels[:15]):
    print(f"  #{idx}: y={sy}-{ey} (height={ey-sy})")

print("\nProposed panel slices:")
for idx, (sy, ey) in enumerate(test_panels[:15]):
    print(f"  #{idx}: y={sy}-{ey} (height={ey-sy})")

