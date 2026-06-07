import os
import tempfile
import urllib.request
import urllib.parse
from typing import List, Dict, Any

try:
    import cv2
    import numpy as np
    has_cv = True
except ImportError:
    has_cv = False

try:
    from PIL import Image
    has_pil = True
except ImportError:
    has_pil = False


def download_image(url: str) -> str:
    # Extract public URL from proxy parameter to avoid calling auth-blocked localhost
    if "/api/proxy-image" in url:
        try:
            parsed_url = urllib.parse.urlparse(url)
            query_params = urllib.parse.parse_qs(parsed_url.query)
            if "url" in query_params:
                extracted_url = query_params["url"][0]
                if extracted_url.startswith("http://") or extracted_url.startswith("https://"):
                    url = extracted_url
        except Exception as parse_err:
            pass

    if url.startswith("/"):
        url = "http://127.0.0.1:3000" + url
    elif not url.startswith("http://") and not url.startswith("https://"):
        url = "http://127.0.0.1:3000/" + url

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://www.webtoons.com/"
    }
    
    req = urllib.request.Request(url, headers=headers)
    temp_fd, temp_path = tempfile.mkstemp(suffix=".png")
    os.close(temp_fd)
    
    with urllib.request.urlopen(req) as response:
        with open(temp_path, "wb") as f:
            f.write(response.read())
            
    return temp_path


def run_cv_detection(image_path: str) -> List[Dict[str, Any]]:
    if has_cv:
        img = cv2.imread(image_path)
        if img is None:
            return []
            
        h, w, c = img.shape
        if h == 0 or w == 0:
            return []
            
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # 1. Determine background color
        corner_samples = [gray[0, 0], gray[0, w-1], gray[h-1, 0], gray[h-1, w-1]]
        median_bg = np.median(corner_samples)
        is_white_bg = median_bg > 127
        
        # 2. Extract threshold mask based on solid background
        if is_white_bg:
            _, thresh = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)
        else:
            _, thresh = cv2.threshold(gray, 15, 255, cv2.THRESH_BINARY)
            
        # 3. Add an edge-detection component to enhance lines / borders / panel dividers
        edges = cv2.Canny(gray, 20, 100)
        merged_mask = cv2.bitwise_or(thresh, edges)
        
        # 4. Vertical and horizontal morphological close to close any gaps inside panels
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))
        closed = cv2.morphologyEx(merged_mask, cv2.MORPH_CLOSE, kernel)
        
        # 5. Locate contours
        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        boxes = []
        for contour in contours:
            x, y, w_box, h_box = cv2.boundingRect(contour)
            
            # Filter noise elements
            if w_box < w * 0.15 or h_box < 60:
                continue
                
            start_x = max(0, x)
            end_x = min(w, x + w_box)
            start_y = max(0, y)
            end_y = min(h, y + h_box)
            
            crop_top = (start_y / h) * 100
            crop_bottom = ((h - end_y) / h) * 100
            crop_left = (start_x / w) * 100
            crop_right = ((w - end_x) / w) * 100
            
            boxes.append({
                "cropTop": round(crop_top, 2),
                "cropBottom": round(crop_bottom, 2),
                "cropLeft": round(crop_left, 2),
                "cropRight": round(crop_right, 2),
                "width": int(w_box),
                "height": int(h_box),
                "area": int(w_box * h_box)
            })
            
        if not boxes:
            # Fallback split
            for i in range(3):
                boxes.append({
                    "cropTop": round(i * 33.3, 2),
                    "cropBottom": round(100 - (i + 1) * 33.3, 2),
                    "cropLeft": 0.0,
                    "cropRight": 0.0,
                    "width": w,
                    "height": int(h / 3),
                    "area": int((w * h) / 3)
                })
                
        # Sort boxes from Top to Bottom
        boxes = sorted(boxes, key=lambda b: b["cropTop"])
        return boxes
    elif has_pil:
        # High quality PIL and Numpy fallback (no cv2 required!)
        try:
            pil_img = Image.open(image_path)
        except Exception:
            return []
            
        w, h = pil_img.size
        if w == 0 or h == 0:
            return []
            
        gray_img = pil_img.convert("L")
        gray_arr = np.array(gray_img)
        
        corner_samples = [gray_arr[0, 0], gray_arr[0, w-1], gray_arr[h-1, 0], gray_arr[h-1, w-1]]
        median_bg = np.median(corner_samples)
        is_white_bg = median_bg > 127
        
        # Calculate horizontal projection profile (mean pixel values per row)
        row_means = np.mean(gray_arr, axis=1)
        
        # Determine which rows represent actual active panel artwork contents vs blank space
        if is_white_bg:
            is_content_row = row_means < 246
        else:
            is_content_row = row_means > 12
            
        # Apply 1D binary morphological closing to join small white divider gaps within a single panel
        smoothed_content = np.copy(is_content_row)
        gap_count = 0
        for i in range(len(smoothed_content)):
            if not smoothed_content[i]:
                gap_count += 1
            else:
                if 0 < gap_count < 22:
                    smoothed_content[i - gap_count : i] = True
                gap_count = 0
                
        # Extract starting and ending line indices of contiguous visual panels
        panels = []
        in_panel = False
        start_y = 0
        min_panel_height = 45
        
        for i in range(h):
            if smoothed_content[i] and not in_panel:
                in_panel = True
                start_y = i
            elif not smoothed_content[i] and in_panel:
                in_panel = False
                end_y = i
                if end_y - start_y >= min_panel_height:
                    panels.append((start_y, end_y))
        if in_panel:
            end_y = h
            if end_y - start_y >= min_panel_height:
                panels.append((start_y, end_y))
                
        boxes = []
        for start_y, end_y in panels:
            panel_slice = gray_arr[start_y:end_y, :]
            col_means = np.mean(panel_slice, axis=0)
            
            # Trim horizontal white space columns to focus crop tightly onto the panel
            if is_white_bg:
                is_content_col = col_means < 248
            else:
                is_content_col = col_means > 8
                
            content_indices = np.where(is_content_col)[0]
            if len(content_indices) > 0:
                start_x = max(0, int(content_indices[0]) - 5)
                end_x = min(w, int(content_indices[-1]) + 5)
            else:
                start_x = 0
                end_x = w
                
            if end_x - start_x < w * 0.15:
                continue
                
            crop_top = (start_y / h) * 100
            crop_bottom = ((h - end_y) / h) * 100
            crop_left = (start_x / w) * 100
            crop_right = ((w - end_x) / w) * 100
            
            boxes.append({
                "cropTop": round(crop_top, 2),
                "cropBottom": round(crop_bottom, 2),
                "cropLeft": round(crop_left, 2),
                "cropRight": round(crop_right, 2),
                "width": end_x - start_x,
                "height": end_y - start_y,
                "area": (end_x - start_x) * (end_y - start_y)
            })
            
        if not boxes:
            # Fallback equidistant splitting if no features could be resolved
            for i in range(3):
                boxes.append({
                    "cropTop": round(i * 33.3, 2),
                    "cropBottom": round(100 - (i + 1) * 33.3, 2),
                    "cropLeft": 0.0,
                    "cropRight": 0.0,
                    "width": w,
                    "height": int(h / 3),
                    "area": int((w * h) / 3)
                })
                
        boxes = sorted(boxes, key=lambda b: b["cropTop"])
        return boxes
    else:
        return []
