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

# Sort by last modified time
files.sort(key=lambda x: os.path.getmtime(os.path.join(cache_dir, x)), reverse=True)
latest_file = os.path.join(cache_dir, files[0])
print(f"Testing with latest stitched image: {latest_file}")

img = cv2.imread(latest_file)
if img is None:
    print("Could not read image!")
    sys.exit(1)

h, w, c = img.shape
print(f"Image shape: width={w}, height={h}")

gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
row_vars = np.var(gray, axis=1)
row_means = np.mean(gray, axis=1)

# Let's run current logic
edge_samples = np.concatenate([gray[0, :], gray[-1, :], gray[:, 0], gray[:, -1]])
median_bg = np.median(edge_samples)
is_white_bg = median_bg > 127
sensitivity = 30.0
threshold_val = int(255 - (sensitivity * 2.5)) if is_white_bg else int(sensitivity * 2.5)
threshold_val = max(5, min(250, threshold_val))

print(f"Current parameters: is_white_bg={is_white_bg}, threshold_val={threshold_val}")

# Current detection gutter definition:
if is_white_bg:
    is_gutter_current = (row_vars < 64) & ((row_means > threshold_val) | (row_vars < 4))
else:
    is_gutter_current = (row_vars < 64) & ((row_means < threshold_val) | (row_vars < 4))

# Proposed logic A: Gutter is low variance (less than 49) AND (mean near background OR any extremely low variance < 16)
# Let's check how many gutter rows each strategy detects
print(f"Total rows: {h}")
print(f"Current logic gutter rows: {np.sum(is_gutter_current)}")

# Let's test a list of custom thresholds:
for v_thresh in [16, 25, 36, 49]:
    for bypass_thresh in [4, 9, 16, 25]:
        if is_white_bg:
            is_gutter_test = (row_vars < v_thresh) & ((row_means > threshold_val) | (row_vars < bypass_thresh))
        else:
            is_gutter_test = (row_vars < v_thresh) & ((row_means < threshold_val) | (row_vars < bypass_thresh))
        print(f"Test (vars < {v_thresh}, bypass < {bypass_thresh}) gutter rows: {np.sum(is_gutter_test)}")

