import cv2
import numpy as np

def clean_borderless_text(image: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """
    Removes floating/borderless text by extracting high-frequency text strokes
    using morphological Top-Hat/Bottom-Hat transforms, and inpainting only those strokes.
    """
    h_img, w_img = image.shape[:2]
    
    x, y, w, h = cv2.boundingRect(mask)
    y1, y2 = max(0, y), min(h_img, y + h)
    x1, x2 = max(0, x), min(w_img, x + w)
    
    if (y2 - y1) <= 0 or (x2 - x1) <= 0:
        return image
        
    roi_img = image[y1:y2, x1:x2]
    roi_mask = mask[y1:y2, x1:x2]
    
    # Convert ROI to grayscale
    roi_gray = cv2.cvtColor(roi_img, cv2.COLOR_BGR2GRAY)
    
    # Use Top-Hat and Bottom-Hat transforms to highlight local light and dark features (strokes)
    morph_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    top_hat = cv2.morphologyEx(roi_gray, cv2.MORPH_TOPHAT, morph_kernel)
    bottom_hat = cv2.morphologyEx(roi_gray, cv2.MORPH_BLACKHAT, morph_kernel)
    
    # Combine the features to handle both white/light text and black/dark text
    text_features = cv2.max(top_hat, bottom_hat)
    
    # Only run thresholding if we have pixels in the mask
    mask_pixels = text_features[roi_mask == 255]
    if len(mask_pixels) == 0:
        return image
        
    max_val = np.max(mask_pixels)
    if max_val < 30:
        # No significant text features detected
        return image
        
    # Threshold based on max contrast to dynamically segment strokes
    thresh_val = max(15, int(max_val * 0.35))
    _, stroke_mask = cv2.threshold(text_features, thresh_val, 255, cv2.THRESH_BINARY)
    stroke_mask = cv2.bitwise_and(stroke_mask, roi_mask)
    
    # Dilate stroke mask to cover anti-aliased borders and text outlines
    dilate_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    stroke_mask_dilated = cv2.dilate(stroke_mask, dilate_kernel, iterations=1)
    
    # Create global stroke mask
    global_stroke_mask = np.zeros((h_img, w_img), dtype=np.uint8)
    global_stroke_mask[y1:y2, x1:x2] = stroke_mask_dilated
    
    # Inpaint only the text strokes over the original image
    return cv2.inpaint(image, global_stroke_mask, 3, cv2.INPAINT_TELEA)
