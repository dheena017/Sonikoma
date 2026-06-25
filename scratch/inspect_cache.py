import os
import glob
from PIL import Image

def main():
    cache_dir = 'backend/database/image_cache/stitchedCache'
    files = glob.glob(os.path.join(cache_dir, '*.bin'))
    print(f"Checking {len(files)} cache files...")
    
    large_count = 0
    for f in files:
        try:
            with Image.open(f) as img:
                w, h = img.size
                if h > 8000:
                    print(f"Tall Image: {os.path.basename(f)} size={w}x{h}")
                    large_count += 1
                elif w == 345 or h == 44892:
                    print(f"Matching search Image: {os.path.basename(f)} size={w}x{h}")
                    large_count += 1
        except Exception:
            pass
            
    print(f"Finished checking. Found {large_count} matching/large images.")

if __name__ == '__main__':
    main()
