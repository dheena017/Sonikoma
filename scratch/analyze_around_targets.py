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

# Let's inspect around y_targets: 38610, 46227, 50914
targets = [38610, 46227, 50914]

def analyze_around(target_y, window=500):
    start = max(0, target_y - window)
    end = min(h, target_y + window)
    print(f"\n--- Around target y = {target_y} (window: {start} - {end}) ---")
    
    # Find rows with low variance in this window
    low_var_indices = np.where(row_vars[start:end] < 64)[0] + start
    print(f"Number of rows with var < 64: {len(low_var_indices)}")
    
    # Print the row segments that have contiguous var < 64
    if len(low_var_indices) > 0:
        groups = []
        curr = [low_var_indices[0]]
        for y in low_var_indices[1:]:
            if y == curr[-1] + 1:
                curr.append(y)
            else:
                groups.append(curr)
                curr = [y]
        groups.append(curr)
        
        print("Uniform row segments (potential gutters):")
        for g in groups:
            g_start = g[0]
            g_end = g[-1]
            segment_vars = row_vars[g_start:g_end+1]
            segment_means = row_means[g_start:g_end+1]
            print(f"  y={g_start}-{g_end} (len={len(g)}): var_range=({np.min(segment_vars):.1f}, {np.max(segment_vars):.1f}), mean_range=({np.min(segment_means):.1f}, {np.max(segment_means):.1f})")

analyze_around(38610)
analyze_around(46227)
analyze_around(50914)
