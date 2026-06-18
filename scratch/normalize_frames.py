import os
import cv2
import numpy as np

def detect_border_color(img):
    """
    Analyzes the outermost pixels of the image to detect the dominant border color.
    """
    h, w, c = img.shape
    # Sample edge pixels: top, bottom, left, right rows/columns
    top_edge = img[0, :, :]
    bottom_edge = img[-1, :, :]
    left_edge = img[:, 0, :]
    right_edge = img[:, -1, :]
    
    edges = np.concatenate([top_edge, bottom_edge, left_edge, right_edge], axis=0)
    
    # Calculate median color of edges
    median_color = np.median(edges, axis=0)
    return [int(c) for c in median_color]

def resize_and_pad(img, target_w, target_h):
    """
    Resizes the image to fit within target_w x target_h preserving aspect ratio,
    and pads the border with the detected background color to make it exactly target_w x target_h.
    """
    h, w, c = img.shape
    
    # Calculate scaling factor
    scale_w = target_w / w
    scale_h = target_h / h
    scale = min(scale_w, scale_h)
    
    new_w = int(w * scale)
    new_h = int(h * scale)
    
    # Resize the image
    resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
    
    # Detect border color for padding
    pad_color = detect_border_color(img)
    
    # Create target canvas filled with pad_color
    canvas = np.full((target_h, target_w, c), pad_color, dtype=np.uint8)
    
    # Calculate positioning to center the resized image
    x_offset = (target_w - new_w) // 2
    y_offset = (target_h - new_h) // 2
    
    # Paste resized image onto canvas
    canvas[y_offset:y_offset+new_h, x_offset:x_offset+new_w, :] = resized
    return canvas

def main():
    src_dir = r"C:\Users\dheen\Downloads\webtoon_frames (7)\webtoon_frames"
    out_dir = r"C:\Users\dheen\Downloads\webtoon_frames (7)\normalized_frames"
    
    # Options: Change target size as desired (e.g. 1080, 1920 for Portrait; 1920, 1080 for Landscape)
    target_width = 1080
    target_height = 1920
    
    if not os.path.exists(src_dir):
        print(f"Error: Source directory {src_dir} does not exist.")
        return
        
    os.makedirs(out_dir, exist_ok=True)
    
    files = sorted([f for f in os.listdir(src_dir) if f.endswith('.png')])
    print(f"Normalizing {len(files)} files to {target_width}x{target_height}...")
    
    kept_count = 0
    filtered_count = 0
    
    for filename in files:
        filepath = os.path.join(src_dir, filename)
        img = cv2.imread(filepath)
        if img is None:
            continue
            
        h, w, c = img.shape
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        std_dev = np.std(gray)
        
        # Noise filter checks
        if h < 60 or std_dev < 5.0:
            filtered_count += 1
            # Skip noise
            continue
            
        # Process and normalize
        normalized_img = resize_and_pad(img, target_width, target_height)
        
        out_path = os.path.join(out_dir, filename)
        cv2.imwrite(out_path, normalized_img)
        kept_count += 1
        
    print(f"\nProcessing Complete!")
    print(f"  Total valid panels normalized and saved: {kept_count}")
    print(f"  Total noise/garbage panels filtered out: {filtered_count}")
    print(f"  Normalized files are stored in: {out_dir}")

if __name__ == '__main__':
    main()
