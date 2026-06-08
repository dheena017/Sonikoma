import cv2
import numpy as np

def clean_standard_bubble(image: np.ndarray, mask: np.ndarray, inpaint_radius: int = 3) -> np.ndarray:
    """
    Removes standard speech/thought bubbles by reconstructing the background.
    Fits a 2D linear gradient or solid color to boundary pixels for a smooth result,
    falling back to cv2.inpaint if the boundary is textured.
    """
    h, w = image.shape[:2]
    
    # 1. Create a detached outer boundary ring to sample background art,
    # bypassing any speech bubble black borders/outlines
    inner_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    outer_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13))
    dilated_inner = cv2.dilate(mask, inner_kernel, iterations=1)
    dilated_outer = cv2.dilate(mask, outer_kernel, iterations=1)
    outer_ring = cv2.subtract(dilated_outer, dilated_inner)
    
    # Check if we have enough boundary pixels
    ring_pixels = np.where(outer_ring == 255)
    if len(ring_pixels[0]) < 10:
        return cv2.inpaint(image, mask, inpaint_radius, cv2.INPAINT_TELEA)
        
    # Get coordinates and color values of the boundary ring
    coords_y, coords_x = ring_pixels[0], ring_pixels[1]
    colors = image[coords_y, coords_x].astype(np.float32)
    
    # Downsample if we have too many boundary pixels to keep least-squares super fast
    if len(coords_y) > 1000:
        indices = np.random.choice(len(coords_y), 1000, replace=False)
        coords_y = coords_y[indices]
        coords_x = coords_x[indices]
        colors = colors[indices]
        
    # Fit a 2D linear regression model for each channel: Value = a*y + b*x + c
    # Formulate A matrix: [Y, X, 1]
    A = np.column_stack([coords_y, coords_x, np.ones_like(coords_y)])
    
    try:
        # Solve least squares: A * W = colors
        W, residuals, rank, s = np.linalg.lstsq(A, colors, rcond=None)
        
        # Calculate mean squared error of the fit
        fitted = A @ W
        mse = np.mean((colors - fitted) ** 2)
        
        # If the fit is good (MSE is low), we reconstruct the background using the fit
        if mse < 65.0:  # Threshold for clean gradient or solid color
            # Get all coordinates inside the mask
            mask_y, mask_x = np.where(mask == 255)
            if len(mask_y) > 0:
                A_mask = np.column_stack([mask_y, mask_x, np.ones_like(mask_y)])
                predicted = A_mask @ W
                predicted = np.clip(predicted, 0, 255).astype(np.uint8)
                
                cleaned_image = image.copy()
                cleaned_image[mask_y, mask_x] = predicted
                
                # Perform a thin boundary blend to remove any hard transition seam
                # Create a 3px boundary blend mask
                blend_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
                blend_mask = cv2.subtract(cv2.dilate(mask, blend_kernel), cv2.erode(mask, blend_kernel))
                return cv2.inpaint(cleaned_image, blend_mask, 2, cv2.INPAINT_TELEA)
    except Exception as e:
        print(f"[Cleaner standard_bubble warning] Gradient fit failed: {e}")
        
    # Fallback to standard inpainting
    return cv2.inpaint(image, mask, inpaint_radius, cv2.INPAINT_TELEA)
