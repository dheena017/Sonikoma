import cv2
import numpy as np
import os

image_path = r"c:\Users\dheen\Downloads\stitched_1781781766636_full.png"
if not os.path.exists(image_path):
    print("File not found:", image_path)
    # Check another one
    image_path = r"c:\Users\dheen\Downloads\stitched_1781782685025_full.png"
    if not os.path.exists(image_path):
        print("Alternative file not found!")
        sys.exit(1)

print(f"Reading: {image_path}")
img = cv2.imread(image_path)
h, w, c = img.shape
print(f"Image shape: width={w}, height={h}")

gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
row_vars = np.var(gray, axis=1)
row_means = np.mean(gray, axis=1)

edge_samples = np.concatenate([gray[0, :], gray[-1, :], gray[:, 0], gray[:, -1]])
median_bg = np.median(edge_samples)
is_white_bg = median_bg > 127
print(f"Global background: {'white' if is_white_bg else 'black'} (median: {median_bg})")

# Let's count rows that have very low variance (< 64) but different means
print("\nVariance and mean distribution of rows:")
print(f"Rows with var < 4: {np.sum(row_vars < 4)}")
print(f"Rows with var < 16: {np.sum(row_vars < 16)}")
print(f"Rows with var < 25: {np.sum(row_vars < 25)}")
print(f"Rows with var < 49: {np.sum(row_vars < 49)}")
print(f"Rows with var < 64: {np.sum(row_vars < 64)}")

# Let's see how many of those low variance rows (< 64) have means in different ranges
print("\nMeans of rows with var < 64:")
print(f"  mean < 20: {np.sum((row_vars < 64) & (row_means < 20))}")
print(f"  20 <= mean < 80: {np.sum((row_vars < 64) & (row_means >= 20) & (row_means < 80))}")
print(f"  80 <= mean < 180: {np.sum((row_vars < 64) & (row_means >= 80) & (row_means < 180))}")
print(f"  mean >= 180: {np.sum((row_vars < 64) & (row_means >= 180))}")

# Let's look at the panel slices detected using current logic
sensitivity = 30.0
threshold_val = int(255 - (sensitivity * 2.5)) if is_white_bg else int(sensitivity * 2.5)
threshold_val = max(5, min(250, threshold_val))

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
print(f"\nCurrent logic detected {len(current_panels)} panels.")

# Let's test a more adaptive gutter definition:
# Any row with low variance (< 64) where the color is close to the average of the edges of the row
# (which means it's a gutter that goes all the way to the side)
# OR any row with extremely low variance (< 16)
# OR let's test a higher bypass threshold for any-color gutters (e.g. var < 16 or var < 25)
is_gutter_adaptive = (row_vars < 64) & (
    (row_vars < 16) |  # bypass for colored gutters
    (is_white_bg & (row_means > threshold_val)) |
    ((not is_white_bg) & (row_means < threshold_val))
)

adaptive_panels = find_panels(is_gutter_adaptive)
print(f"Adaptive logic (var < 16 bypass) detected {len(adaptive_panels)} panels.")

# Let's test even higher bypass (var < 25 bypass)
is_gutter_adaptive_25 = (row_vars < 64) & (
    (row_vars < 25) |  # bypass for colored gutters
    (is_white_bg & (row_means > threshold_val)) |
    ((not is_white_bg) & (row_means < threshold_val))
)
adaptive_panels_25 = find_panels(is_gutter_adaptive_25)
print(f"Adaptive logic (var < 25 bypass) detected {len(adaptive_panels_25)} panels.")

# Let's also print some stats of panel heights. If a panel is extremely tall (e.g., > 1000px), it might mean
# multiple panels were merged because a gutter wasn't detected.
for name, panels in [("Current", current_panels), ("Adaptive (16)", adaptive_panels), ("Adaptive (25)", adaptive_panels_25)]:
    tall_panels = [p for p in panels if (p[1] - p[0]) > 1000]
    print(f"{name}: panels={len(panels)}, tall (>1000px)={len(tall_panels)}")
    if tall_panels:
        print(f"  Tall panels: {[(p[1]-p[0]) for p in tall_panels[:5]]}")

