import cv2
import numpy as np
import os

image_path = os.path.expandvars(r'%TEMP%\anivox_disk_cache\stitchedCache\stitched_1781778287335_full.bin')
img = cv2.imread(image_path)
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
h, w = gray.shape

# Print sample values along the left, right, top, bottom edges
print("Top row gray values:", gray[0, :10], "...", gray[0, -10:])
print("Bottom row gray values:", gray[-1, :10], "...", gray[-1, -10:])
print("Left col gray values:", gray[:10, 0], "...", gray[-10:, 0])
print("Right col gray values:", gray[:10, -1], "...", gray[-10:, -1])

# Calculate medians of each edge separately
print("Top edge median:", np.median(gray[0, :]))
print("Bottom edge median:", np.median(gray[-1, :]))
print("Left edge median:", np.median(gray[:, 0]))
print("Right edge median:", np.median(gray[:, -1]))

# Check how many pixels are white vs black in left/right edges
left_whites = np.sum(gray[:, 0] > 200)
left_blacks = np.sum(gray[:, 0] < 50)
right_whites = np.sum(gray[:, -1] > 200)
right_blacks = np.sum(gray[:, -1] < 50)
print(f"Left col: whites={left_whites}, blacks={left_blacks}, total={h}")
print(f"Right col: whites={right_whites}, blacks={right_blacks}, total={h}")
