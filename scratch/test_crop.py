import sys
import os
import numpy as np
import cv2

# Add backend/python to path
sys.path.append(os.path.join(os.getcwd(), 'backend', 'python'))
from services.detect_panels import run_cv_detection

image_path = os.path.expandvars(r'%TEMP%\sonikoma_disk_cache\stitchedCache\stitched_1781778287335_full.bin')

# Read image
img = cv2.imread(image_path)
h, w, c = img.shape
print(f"Loaded image. Width: {w}, Height: {h}")

# Run panel detection manually to see all stages
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
edge_samples = np.concatenate([gray[0, :], gray[-1, :], gray[:, 0], gray[:, -1]])
median_bg = np.median(edge_samples)
is_white_bg = median_bg > 127
print(f"Background: {'white' if is_white_bg else 'black'} (median: {median_bg})")

sensitivity = 30.0
threshold_val = int(255 - (sensitivity * 2.5)) if is_white_bg else int(sensitivity * 2.5)
threshold_val = max(5, min(250, threshold_val))
print(f"Threshold: {threshold_val}")

row_vars = np.var(gray, axis=1)
row_means = np.mean(gray, axis=1)

if is_white_bg:
    is_gutter_row = (row_vars < 64) & (row_means > threshold_val)
else:
    is_gutter_row = (row_vars < 64) & (row_means < threshold_val)

is_content_row = ~is_gutter_row
smoothed_content = np.copy(is_content_row)
gap_count = 0
for i in range(len(smoothed_content)):
    if not smoothed_content[i]:
        gap_count += 1
    else:
        if 0 < gap_count < 30:
            smoothed_content[i - gap_count : i] = True
        gap_count = 0

panels = []
in_panel = False
start_y = 0
min_height_px = 60
for i in range(h):
    if smoothed_content[i] and not in_panel:
        in_panel = True
        start_y = i
    elif not smoothed_content[i] and in_panel:
        in_panel = False
        end_y = i
        if end_y - start_y >= min_height_px:
            panels.append((start_y, end_y))
        else:
            print(f"Skipped raw slice y: {start_y} to {end_y} because height {end_y-start_y} < {min_height_px}")
if in_panel:
    end_y = h
    if end_y - start_y >= min_height_px:
        panels.append((start_y, end_y))
    else:
        print(f"Skipped raw slice y: {start_y} to {end_y} because height {end_y-start_y} < {min_height_px}")

print(f"Total raw slices found: {len(panels)}")

raw_boxes = []
min_width_pct = 0.15
min_w = w * min_width_pct

for idx, (start_y, end_y) in enumerate(panels):
    panel_slice = gray[start_y:end_y, :]
    col_vars = np.var(panel_slice, axis=0)
    col_means = np.mean(panel_slice, axis=0)

    if is_white_bg:
        is_content_col = (col_vars >= 2) | (col_means < (threshold_val + 10))
    else:
        is_content_col = (col_vars >= 2) | (col_means > (threshold_val - 10))

    content_indices = np.where(is_content_col)[0]
    if len(content_indices) > 0:
        start_x = max(0, int(content_indices[0]) - 8)
        end_x = min(w, int(content_indices[-1]) + 8)
    else:
        start_x = 0
        end_x = w

    box_w = end_x - start_x
    box_h = end_y - start_y
    
    if box_w < min_w:
        print(f"Slice {idx} (y: {start_y}-{end_y}): width {box_w} is < min_w {min_w:.1f}. WILL BE FILTERED OUT!")
    else:
        print(f"Slice {idx} (y: {start_y}-{end_y}): width {box_w}, height {box_h} - OK")
