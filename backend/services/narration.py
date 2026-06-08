import cv2
import numpy as np

def clean_narration_box(image: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """
    Removes text inside narration boxes by segmenting high-contrast text strokes
    and inpainting only the strokes, leaving borders and box background intact.
    """
    h_img, w_img = image.shape[:2]
    
    # 1. Get bounding box to crop the ROI
    x, y, w, h = cv2.boundingRect(mask)
    y1, y2 = max(0, y), min(h_img, y + h)
    x1, x2 = max(0, x), min(w_img, x + w)
    
    if (y2 - y1) <= 0 or (x2 - x1) <= 0:
        return image
        
    roi_img = image[y1:y2, x1:x2]
    roi_mask = mask[y1:y2, x1:x2]
    
    # Erode the mask dynamically to exclude the outer borders of the narration box
    # This prevents the boundary/borders from being classified as text strokes
    erode_size = max(9, int(min(w, h) * 0.06) | 1)
    border_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (erode_size, erode_size))
    interior_mask = cv2.erode(roi_mask, border_kernel, borderType=cv2.BORDER_CONSTANT, borderValue=0)
    
    if np.count_nonzero(interior_mask) == 0:
        # If the box is too thin to erode, use the original mask
        interior_mask = roi_mask
        
    # 2. Get median color of the box interior
    box_pixels = roi_img[interior_mask == 255]
    if len(box_pixels) == 0:
        return image
        
    median_color = np.median(box_pixels, axis=0)
    
    # 3. Compute L2 color distance from median color
    diff = np.linalg.norm(roi_img.astype(np.float32) - median_color, axis=2)
    
    # Convert to uint8 for thresholding
    diff_uint8 = np.clip(diff, 0, 255).astype(np.uint8)
    
    # Verify if there is actually high contrast text inside the interior
    max_diff = np.max(diff_uint8[interior_mask == 255])
    if max_diff < 20:
        # No high contrast text strokes found, keep narration box as is
        return image
        
    # 4. Use Otsu's thresholding to find text stroke candidates
    # We apply Otsu's on the entire ROI and mask it with the interior_mask
    _, stroke_mask = cv2.threshold(diff_uint8, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    stroke_mask = cv2.bitwise_and(stroke_mask, interior_mask)
    
    # 5. Dilate stroke mask slightly to fully cover stroke antialiasing edges
    dilate_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    stroke_mask_dilated = cv2.dilate(stroke_mask, dilate_kernel, iterations=1)
    
    # 6. Apply inpainting ONLY to the text strokes globally
    global_stroke_mask = np.zeros((h_img, w_img), dtype=np.uint8)
    global_stroke_mask[y1:y2, x1:x2] = stroke_mask_dilated
    
    # Return inpainted image (inpainting strokes inside the box blends them with box background)
    return cv2.inpaint(image, global_stroke_mask, 3, cv2.INPAINT_TELEA)
