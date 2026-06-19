import cv2
import numpy as np
import os

def analyze(image_path):
    print("=" * 60)
    print("Analyzing:", os.path.basename(image_path))
    img = cv2.imread(image_path)
    if img is None:
        print("Failed to read image")
        return
    h, w, c = img.shape
    print(f"Shape: {w}x{h}")
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    row_vars = np.var(gray, axis=1)
    row_means = np.mean(gray, axis=1)

    # Let's inspect the distribution of row_vars
    print("\nVariance percentiles:")
    for p in [10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99]:
        print(f"  {p}th: {np.percentile(row_vars, p):.2f}")

    # Let's check rows with low variance (potential gutters)
    # We want to see if we can identify colored gutters (e.g. blue, purple, dark red) and transitions
    # In a webtoon, gutters are solid color rows. If a row is a solid color, its variance is small.
    # What is the maximum variance of a "solid color gutter row with noise"?
    # Let's look at rows that are known to be gutters.
    # We can detect them by checking if the row is uniform (low variance)
    # and matches the edge pixels (left and right margins).
    # Let's check the difference between row mean and the left/right 5% edge pixels mean.
    edge_w = max(5, int(w * 0.05))
    left_edges = np.mean(gray[:, :edge_w], axis=1)
    right_edges = np.mean(gray[:, -edge_w:], axis=1)
    edge_diff = np.abs(left_edges - right_edges)
    mean_to_edge_diff = np.abs(row_means - (left_edges + right_edges) / 2.0)

    print("\nEdge comparison:")
    print(f"  Max edge-to-edge difference: {np.max(edge_diff):.2f}")
    print(f"  Mean edge-to-edge diff: {np.mean(edge_diff):.2f}")
    print(f"  Max row-mean to edge-mean diff: {np.max(mean_to_edge_diff):.2f}")
    print(f"  Mean row-mean to edge-mean diff: {np.mean(mean_to_edge_diff):.2f}")

    # Let's see how many rows have low variance (< 64) and mean close to edge (diff < 10)
    gutters_by_edge = (row_vars < 64) & (mean_to_edge_diff < 15)
    print(f"  Rows with var < 64 and mean close to edges (< 15): {np.sum(gutters_by_edge)}")
    print(f"  Rows with var < 16: {np.sum(row_vars < 16)}")
    print(f"  Rows with var < 25: {np.sum(row_vars < 25)}")
    print(f"  Rows with var < 36: {np.sum(row_vars < 36)}")
    print(f"  Rows with var < 49: {np.sum(row_vars < 49)}")
    print(f"  Rows with var < 64: {np.sum(row_vars < 64)}")

    # Let's compare current logic vs proposed gutter checks
    edge_samples = np.concatenate([gray[0, :], gray[-1, :], gray[:, 0], gray[:, -1]])
    median_bg = np.median(edge_samples)
    is_white_bg = median_bg > 127
    sensitivity = 30.0
    threshold_val = int(255 - (sensitivity * 2.5)) if is_white_bg else int(sensitivity * 2.5)
    threshold_val = max(5, min(250, threshold_val))

    if is_white_bg:
        is_gutter_current = (row_vars < 64) & ((row_means > threshold_val) | (row_vars < 4))
    else:
        is_gutter_current = (row_vars < 64) & ((row_means < threshold_val) | (row_vars < 4))

    # Let's test a simple increased bypass (row_vars < 16 or 25)
    is_gutter_bypass_16 = (row_vars < 64) & (
        (is_white_bg & (row_means > threshold_val)) |
        ((not is_white_bg) & (row_means < threshold_val)) |
        (row_vars < 16)
    )
    is_gutter_bypass_25 = (row_vars < 64) & (
        (is_white_bg & (row_means > threshold_val)) |
        ((not is_white_bg) & (row_means < threshold_val)) |
        (row_vars < 25)
    )

    # Let's test local margin comparison: a row is a gutter if:
    # 1. Row variance is low (< 64)
    # 2. Row mean is close to its edge margins (meaning it's a solid gutter that extends to the edges)
    #    OR row variance is extremely low (< 25)
    is_gutter_local = (row_vars < 64) & (
        (mean_to_edge_diff < 15) | (row_vars < 16)
    )

    def count_panels(is_gutter):
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

    p_curr = count_panels(is_gutter_current)
    p_bp16 = count_panels(is_gutter_bypass_16)
    p_bp25 = count_panels(is_gutter_bypass_25)
    p_local = count_panels(is_gutter_local)

    print(f"\nResults:")
    for name, p_list in [("Current", p_curr), ("Bypass 16", p_bp16), ("Bypass 25", p_bp25), ("Local Margin", p_local)]:
        tall = [p for p in p_list if (p[1] - p[0]) > 1000]
        print(f"  {name:15}: panels={len(p_list)}, tall={len(tall)} {[(p[1]-p[0]) for p in tall[:5]]}")

for f in ["stitched_1781781766636_full.png", "stitched_1781781999134_full.png", "stitched_1781782685025_full.png"]:
    p = os.path.join(r"c:\Users\dheen\Downloads", f)
    if os.path.exists(p):
        analyze(p)
