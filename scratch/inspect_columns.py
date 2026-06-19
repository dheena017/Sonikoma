import cv2
import numpy as np

image_path = r"c:\Users\dheen\Downloads\stitched_1781781766636_full.png"
img = cv2.imread(image_path)
h, w, c = img.shape
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

print(f"Image width: {w}")
print("Grayscale values for columns in rows y=38680 to 38730 (sampled every 5 columns):")

# Print header
col_indices = list(range(0, w, 20))
header = " y   | " + " ".join(f"{col:3d}" for col in col_indices)
print(header)
print("-" * len(header))

for y in range(38680, 38730, 2):
    row = gray[y, :]
    vals = [row[col] for col in col_indices]
    row_str = " ".join(f"{v:3d}" for v in vals)
    print(f"{y:5d} | {row_str} | mean={np.mean(row):.1f} var={np.var(row):.1f}")
