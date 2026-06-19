import cv2
import numpy as np

img_path = r"C:\Users\dheen\.gemini\antigravity-ide\brain\7b49244c-a9f4-4397-934c-9043f4c41da3\media__1781793939626.png"
img = cv2.imread(img_path)
if img is None:
    print("Failed to read user marked image!")
else:
    h, w, c = img.shape
    print(f"User image shape: {w}x{h}")
    # Let's find where the green lines are. Let's look for pixels where Green is high and Red, Blue are low.
    # OpenCV is BGR, so Green is index 1.
    # Let's filter for B < 100, G > 180, R < 100
    green_mask = (img[:, :, 0] < 100) & (img[:, :, 1] > 150) & (img[:, :, 2] < 100)
    green_y, green_x = np.where(green_mask)
    if len(green_y) > 0:
        unique_y = np.unique(green_y)
        print(f"Found {len(green_y)} green pixels across {len(unique_y)} unique y-coordinates.")
        # Let's group contiguous y-coordinates
        groups = []
        if len(unique_y) > 0:
            current_group = [unique_y[0]]
            for y in unique_y[1:]:
                if y == current_group[-1] + 1:
                    current_group.append(y)
                else:
                    groups.append(current_group)
                    current_group = [y]
            groups.append(current_group)
            
        print("Green line y-ranges:")
        for idx, g in enumerate(groups):
            print(f"  Line {idx}: y={g[0]} to {g[-1]} (height={len(g)})")
    else:
        print("No green pixels found!")
