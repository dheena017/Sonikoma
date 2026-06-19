import cv2
import numpy as np

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

# Current logic
if is_white_bg:
    is_gutter_current = (row_vars < 64) & ((row_means > threshold_val) | (row_vars < 4))
else:
    is_gutter_current = (row_vars < 64) & ((row_means < threshold_val) | (row_vars < 4))

def find_panels(is_gutter):
    is_content = ~is_gutter
    smoothed = np.copy(is_content)
    gap_count = 0
    gap_thresh = max(8, min(30, int(w * 0.04)))
    for i in range(len(smoothed)):
        if not smoothed[i]:
            gap_count += 1
        else:
            if 0 < gap_count < gap_thresh:
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
    return panels

current_panels = find_panels(is_gutter_current)

print("Current panels covering the targets:")
for target in [38710, 46260, 51000]:
    found = False
    for idx, (sy, ey) in enumerate(current_panels):
        if sy <= target <= ey:
            print(f"  Target y={target} is inside panel #{idx}: y={sy}-{ey} (height={ey-sy})")
            found = True
            break
    if not found:
        print(f"  Target y={target} is NOT in any panel (it is recognized as gutter!)")
