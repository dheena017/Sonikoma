import cv2
import numpy as np

image_path = r"c:\Users\dheen\Downloads\stitched_1781781766636_full.png"
img = cv2.imread(image_path)
h, w, c = img.shape
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
row_vars = np.var(gray, axis=1)
row_means = np.mean(gray, axis=1)

print("Rows in range 38550 to 38750 with mean > 200:")
count = 0
for y in range(38550, 38750):
    if row_means[y] > 200:
        print(f"  y={y}: mean={row_means[y]:.1f}, var={row_vars[y]:.1f}")
        count += 1
print(f"Total rows with mean > 200: {count}")
