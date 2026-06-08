import cv2
import numpy as np

def clean_sfx(image: np.ndarray, mask: np.ndarray, clean_enabled: bool = False) -> np.ndarray:
    """
    Keeps sound effects by default to retain comic book feel. If clean_enabled is True,
    it removes the sound effect by performing a content-aware style inpaint.
    """
    if not clean_enabled:
        return image
        
    # SFX characters are typically very large and thick.
    # We extract their stroke outlines using a larger morphological kernel and inpaint them.
    h_img, w_img = image.shape[:2]
    x, y, w, h = cv2.boundingRect(mask)
    y1, y2 = max(0, y), min(h_img, y + h)
    x1, x2 = max(0, x), min(w_img, x + w)
    
    if (y2 - y1) <= 0 or (x2 - x1) <= 0:
        return image
        
    roi_img = image[y1:y2, x1:x2]
    roi_mask = mask[y1:y2, x1:x2]
    roi_gray = cv2.cvtColor(roi_img, cv2.COLOR_BGR2GRAY)
    
    # Large kernel for thick SFX characters (15x15)
    morph_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    top_hat = cv2.morphologyEx(roi_gray, cv2.MORPH_TOPHAT, morph_kernel)
    bottom_hat = cv2.morphologyEx(roi_gray, cv2.MORPH_BLACKHAT, morph_kernel)
    text_features = cv2.max(top_hat, bottom_hat)
    
    mask_pixels = text_features[roi_mask == 255]
    if len(mask_pixels) == 0:
        return image
        
    max_val = np.max(mask_pixels)
    if max_val < 20:
        return image
        
    thresh_val = max(10, int(max_val * 0.25))
    _, stroke_mask = cv2.threshold(text_features, thresh_val, 255, cv2.THRESH_BINARY)
    stroke_mask = cv2.bitwise_and(stroke_mask, roi_mask)
    
    # Dilation to fully cover the thick SFX letters and outlines
    dilate_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    stroke_mask_dilated = cv2.dilate(stroke_mask, dilate_kernel, iterations=1)
    
    global_stroke_mask = np.zeros((h_img, w_img), dtype=np.uint8)
    global_stroke_mask[y1:y2, x1:x2] = stroke_mask_dilated
    
    # Inpaint SFX text strokes
    return cv2.inpaint(image, global_stroke_mask, 5, cv2.INPAINT_TELEA)
