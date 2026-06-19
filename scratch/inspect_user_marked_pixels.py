import cv2
import numpy as np

img_path = r"C:\Users\dheen\.gemini\antigravity-ide\brain\7b49244c-a9f4-4397-934c-9043f4c41da3\media__1781793939626.png"
img = cv2.imread(img_path)
if img is not None:
    # Print the row colors (excluding the green pixels if any) around the lines
    # BGR format
    for y in [659, 789, 869]:
        print(f"\ny = {y}:")
        # Print a window of 5 rows above and below
        for dy in range(-5, 6):
            row_y = y + dy
            if 0 <= row_y < img.shape[0]:
                pixels = img[row_y, :, :]
                # filter out green pixels to see original background
                non_green = [p for p in pixels if not (p[0] < 100 and p[1] > 150 and p[2] < 100)]
                if non_green:
                    mean_color = np.mean(non_green, axis=0)
                    print(f"  dy={dy:2d} (y={row_y:4d}): Mean BGR={mean_color.astype(int)}, Pixels={pixels.tolist()}")
                else:
                    print(f"  dy={dy:2d} (y={row_y:4d}): All pixels are green")
else:
    print("Could not read image")
