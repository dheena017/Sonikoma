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

def run_with_gap(gap_t, v_thresh, bypass_thresh):
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
    return panels

# Print panels with gap_t = 2, v_thresh = 64, bypass = 16
panels = run_with_gap(2, 64, 16)
print(f"Total panels: {len(panels)}")
tall_panels = [p for p in panels if (p[1] - p[0]) > 1000]
print(f"Tall panels (height > 1000px): {len(tall_panels)}")
for idx, (sy, ey) in enumerate(tall_panels):
    print(f"  Tall #{idx}: y={sy}-{ey} (height={ey-sy})")
