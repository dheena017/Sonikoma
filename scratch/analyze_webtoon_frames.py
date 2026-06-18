import os
import cv2
import numpy as np

def main():
    frames_dir = r"C:\Users\dheen\Downloads\webtoon_frames (7)\webtoon_frames"
    if not os.path.exists(frames_dir):
        print(f"Error: Directory {frames_dir} does not exist.")
        return

    files = sorted([f for f in os.listdir(frames_dir) if f.endswith('.png')])
    print(f"Analyzing {len(files)} frames from {frames_dir}:\n")
    print(f"{'Filename':<25} | {'Width':<6} | {'Height':<6} | {'Std Dev':<8} | {'Avg Bright':<10} | {'Action'}")
    print("-" * 80)

    filtered_count = 0
    kept_count = 0

    for filename in files:
        filepath = os.path.join(frames_dir, filename)
        img = cv2.imread(filepath)
        if img is None:
            continue
            
        h, w, c = img.shape
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        avg_brightness = np.mean(gray)
        std_dev = np.std(gray)
        
        # Simulation settings:
        # 1. Height >= 60
        # 2. Width >= 55 (15% of 369)
        # 3. Std Dev >= 5.0 (solid color check)
        
        reason = []
        if h < 60:
            reason.append(f"height={h}<60")
        if w < 55:
            reason.append(f"width={w}<55")
        if std_dev < 5.0:
            reason.append(f"std_dev={std_dev:.1f}<5.0")
            
        if reason:
            action = f"FILTERED ({', '.join(reason)})"
            filtered_count += 1
        else:
            action = "KEEP"
            kept_count += 1
            
        print(f"{filename:<25} | {w:<6} | {h:<6} | {std_dev:<8.2f} | {avg_brightness:<10.2f} | {action}")

    print(f"\nSimulation Result: Kept {kept_count}, Filtered {filtered_count}")

if __name__ == '__main__':
    main()
