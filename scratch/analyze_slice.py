import cv2
import numpy as np
import os

image_path = os.path.expandvars(r'%TEMP%\sonikoma_disk_cache\stitchedCache\stitched_1781778287335_full.bin')
img = cv2.imread(image_path)
h, w, c = img.shape
print(f"Loaded image. Width: {w}, Height: {h}")

gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
edge_samples = np.concatenate([gray[0, :], gray[-1, :], gray[:, 0], gray[:, -1]])
median_bg = np.median(edge_samples)
is_white_bg = median_bg > 127
print(f"Background: {'white' if is_white_bg else 'black'} (median: {median_bg})")

sensitivity = 30.0
threshold_val = int(255 - (sensitivity * 2.5)) if is_white_bg else int(sensitivity * 2.5)
threshold_val = max(5, min(250, threshold_val))
print(f"Threshold: {threshold_val}")

# Let's inspect the sub-region of the large slice
start_y, end_y = 38115, 50948
sub_gray = gray[start_y:end_y, :]

row_vars = np.var(sub_gray, axis=1)
row_means = np.mean(sub_gray, axis=1)

print(f"Analyzing sub-region y: {start_y} to {end_y}")
print(f"row_vars min: {np.min(row_vars)}, max: {np.max(row_vars)}, mean: {np.mean(row_vars)}")
print(f"row_means min: {np.min(row_means)}, max: {np.max(row_means)}, mean: {np.mean(row_means)}")

# Let's see how many rows have low variance (< 64)
low_var_indices = np.where(row_vars < 64)[0]
print(f"Number of rows with variance < 64: {len(low_var_indices)} out of {end_y - start_y}")

if len(low_var_indices) > 0:
    print("Some low variance row details:")
    for idx in low_var_indices[:15]:
        global_y = start_y + idx
        print(f"  Relative y: {idx} (Global y: {global_y}) - var: {row_vars[idx]:.2f}, mean: {row_means[idx]:.2f}")
    
    # Check if they met the threshold condition
    if is_white_bg:
        met_threshold = row_means[low_var_indices] > threshold_val
    else:
        met_threshold = row_means[low_var_indices] < threshold_val
    print(f"Number of low variance rows meeting mean threshold ({threshold_val}): {np.sum(met_threshold)}")
else:
    print("No rows have variance < 64!")
