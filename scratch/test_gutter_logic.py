import cv2
import numpy as np
import os

image_path = os.path.expandvars(r'%TEMP%\anivox_disk_cache\stitchedCache\stitched_1781778287335_full.bin')
img = cv2.imread(image_path)
h, w, c = img.shape
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

row_vars = np.var(gray, axis=1)
row_means = np.mean(gray, axis=1)

# Let's test a few strategies:
# Strategy A: Adaptive/Dynamic gutter detection
# A row is a gutter if:
# 1. It is extremely uniform: variance < 16
# 2. And its mean is either very light (> 200) or very dark (< 55) or it is extremely uniform (< 4 variance)
is_gutter_a = (row_vars < 16) & ((row_means > 200) | (row_means < 55) | (row_vars < 4))

is_content_a = ~is_gutter_a
smoothed_content = np.copy(is_content_a)
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
if in_panel:
    end_y = h
    if end_y - start_y >= min_height_px:
        panels.append((start_y, end_y))

print(f"Strategy A found {len(panels)} panels.")
for idx, (start_y, end_y) in enumerate(panels):
    slice_h = end_y - start_y
    # Calculate slice width
    panel_slice = gray[start_y:end_y, :]
    col_vars = np.var(panel_slice, axis=0)
    col_means = np.mean(panel_slice, axis=0)
    # Using adaptive local threshold for columns as well
    # Let's see if the column variance/mean indicates content
    # If the background of this slice is light, content columns are dark or variable
    # If the background is dark, content columns are light or variable
    slice_mean = np.mean(panel_slice)
    is_slice_white = slice_mean > 127
    if is_slice_white:
        is_content_col = (col_vars >= 2) | (col_means < 240)
    else:
        is_content_col = (col_vars >= 2) | (col_means > 15)
        
    content_indices = np.where(is_content_col)[0]
    if len(content_indices) > 0:
        start_x = max(0, int(content_indices[0]) - 8)
        end_x = min(w, int(content_indices[-1]) + 8)
    else:
        start_x = 0
        end_x = w
    
    slice_w = end_x - start_x
    print(f"  Panel {idx}: y: {start_y}-{end_y} (height: {slice_h}), x: {start_x}-{end_x} (width: {slice_w})")
