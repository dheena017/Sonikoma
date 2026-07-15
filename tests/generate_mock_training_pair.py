"""
generate_mock_training_pair.py
------------------------------
Generates a mock training pair (original panel and a mask) inside the training_data/
folder so that the training UI unlocks and can be tested.
"""
import os
import numpy as np
import cv2

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    training_dir = os.path.join(base_dir, "data", "training_data")
    os.makedirs(training_dir, exist_ok=True)

    samples = [
        {"id": "sample001", "text": "BOOM!", "color": (150, 100, 250), "shape": "circle"},
        {"id": "sample002", "text": "WHAT?", "color": (100, 200, 150), "shape": "rect"},
        {"id": "sample003", "text": "AHA!", "color": (250, 150, 100), "shape": "ellipse"}
    ]

    for s in samples:
        pair_id = s["id"]
        # Create a mock original image (colored background with text bubble)
        original = np.zeros((256, 256, 3), dtype=np.uint8)
        original[:, :] = s["color"] # set background color
        
        # Create matching binary mask (white box on black background)
        mask = np.zeros((256, 256), dtype=np.uint8)

        if s["shape"] == "rect":
            # Draw rectangle speech bubble
            cv2.rectangle(original, (40, 60), (210, 190), (255, 255, 255), -1)
            cv2.putText(original, s["text"], (75, 135), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 0), 2)
            cv2.rectangle(mask, (40, 60), (210, 190), 255, -1)
        elif s["shape"] == "circle":
            # Draw circular speech bubble
            cv2.circle(original, (128, 128), 80, (255, 255, 255), -1)
            cv2.putText(original, s["text"], (70, 140), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 0), 2)
            cv2.circle(mask, (128, 128), 80, 255, -1)
        else:
            # Draw elliptical bubble
            cv2.ellipse(original, (128, 128), (95, 65), 0, 0, 360, (255, 255, 255), -1)
            cv2.putText(original, s["text"], (80, 135), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 0), 2)
            cv2.ellipse(mask, (128, 128), (95, 65), 0, 0, 360, 255, -1)

        # Write paths
        orig_path = os.path.join(training_dir, f"original_{pair_id}.png")
        mask_path = os.path.join(training_dir, f"mask_{pair_id}.png")

        cv2.imwrite(orig_path, original)
        cv2.imwrite(mask_path, mask)

        print(f"Generated mock training pair inside {training_dir}:")
        print(f"  - Original: original_{pair_id}.png")
        print(f"  - Mask: mask_{pair_id}.png")


if __name__ == "__main__":
    main()
