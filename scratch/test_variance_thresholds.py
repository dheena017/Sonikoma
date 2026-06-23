import cv2
import numpy as np
import os

image_path = os.path.expandvars(r'%TEMP%\sonikoma_disk_cache\stitchedCache\stitched_1781778287335_full.bin')
img = cv2.imread(image_path)
h, w, c = img.shape
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
row_vars = np.var(gray, axis=1)

for var_thresh in [9, 16, 25, 36, 64]:
    is_gutter = row_vars < var_thresh
    is_content = ~is_gutter
    
    smoothed_content = np.copy(is_content)
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
            
    print(f"Variance threshold < {var_thresh}: found {len(panels)} panels")
    # Print statistics of heights
    heights = [end - start for start, end in panels]
    if len(heights) > 0:
        print(f"  Height stats: min={min(heights)}, max={max(heights)}, mean={np.mean(heights):.1f}")
