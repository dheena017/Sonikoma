import cv2
import numpy as np
import os

image_path = os.path.expandvars(r'%TEMP%\anivox_disk_cache\stitchedCache\stitched_1781778287335_full.bin')
img = cv2.imread(image_path)
h, w, c = img.shape
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

row_vars = np.var(gray, axis=1)
row_means = np.mean(gray, axis=1)

# 1. Gutter Row Detection (Strategy A)
is_gutter = (row_vars < 16) & ((row_means > 200) | (row_means < 55) | (row_vars < 4))
is_content = ~is_gutter

# Smooth content gaps
smoothed_content = np.copy(is_content)
gap_count = 0
for i in range(len(smoothed_content)):
    if not smoothed_content[i]:
        gap_count += 1
    else:
        if 0 < gap_count < 30:
            smoothed_content[i - gap_count : i] = True
        gap_count = 0

# Find panels y-ranges
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
        # Keep everything except very tiny noise lines (< 15px)
        if end_y - start_y >= 15:
            panels.append((start_y, end_y))
if in_panel:
    end_y = h
    if end_y - start_y >= 15:
        panels.append((start_y, end_y))

print(f"Total raw slices found in simulation: {len(panels)}")
for idx, (start_y, end_y) in enumerate(panels):
    if 29000 <= start_y <= 31000:
        print(f"Raw slice {idx}: y: {start_y}-{end_y} (height: {end_y-start_y})")

# 2. X-Bound Detection and Width Expansion
raw_boxes = []
min_width_pct = 0.15
min_w = int(w * min_width_pct)

for start_y, end_y in panels:
    panel_slice = gray[start_y:end_y, :]
    col_vars = np.var(panel_slice, axis=0)
    col_means = np.mean(panel_slice, axis=0)

    # Dynamic slice background color
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

    box_w = end_x - start_x
    if box_w < min_w:
        # Symmetrically expand
        shortage = min_w - box_w
        start_x = max(0, start_x - shortage // 2)
        end_x = min(w, start_x + min_w)
        if end_x - start_x < min_w:
            start_x = max(0, end_x - min_w)

    raw_boxes.append({
        "x": start_x,
        "y": start_y,
        "w": end_x - start_x,
        "h": end_y - start_y
    })

# 3. Merge overlapping boxes
def merge_overlapping_boxes(boxes, merge_threshold):
    if not boxes or merge_threshold <= 0:
        return boxes
    boxes = sorted(boxes, key=lambda b: b["y"])
    merged = True
    while merged:
        merged = False
        new_boxes = []
        skip_indices = set()
        for i in range(len(boxes)):
            if i in skip_indices:
                continue
            box_a = boxes[i]
            x1_a, y1_a, x2_a, y2_a = box_a["x"], box_a["y"], box_a["x"] + box_a["w"], box_a["y"] + box_a["h"]
            for j in range(i + 1, len(boxes)):
                if j in skip_indices:
                    continue
                box_b = boxes[j]
                x1_b, y1_b, x2_b, y2_b = box_b["x"], box_b["y"], box_b["x"] + box_b["w"], box_b["y"] + box_b["h"]
                
                x_overlap = not (x2_a < x1_b or x2_b < x1_a)
                y_dist = max(0, y1_b - y2_a) if y1_b >= y2_a else max(0, y1_a - y2_b)
                
                if x_overlap and y_dist <= merge_threshold:
                    x1_a = min(x1_a, x1_b)
                    y1_a = min(y1_a, y1_b)
                    x2_a = max(x2_a, x2_b)
                    y2_a = max(y2_a, y2_b)
                    box_a = {
                        "x": x1_a,
                        "y": y1_a,
                        "w": x2_a - x1_a,
                        "h": y2_a - y1_a
                    }
                    skip_indices.add(j)
                    merged = True
            new_boxes.append(box_a)
        boxes = new_boxes
        if not merged:
            break
    return boxes

merge_threshold = 20
min_height_px = 60
auto_split = True
merged_boxes = merge_overlapping_boxes(raw_boxes, merge_threshold)

# Apply final height filter after merge to get rid of standalone tiny blocks
final_boxes = [b for b in merged_boxes if b["h"] >= (15 if auto_split else min_height_px)]

print(f"Final pipeline produced {len(final_boxes)} panels (after merging and height filter).")
for idx, box in enumerate(final_boxes):
    if 29000 <= box['y'] <= 31000:
        print(f"  Panel {idx}: y: {box['y']}-{box['y']+box['h']} (height: {box['h']}), x: {box['x']}-{box['x']+box['w']} (width: {box['w']})")
