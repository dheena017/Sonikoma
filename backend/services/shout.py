import cv2
import numpy as np

def clean_shout_bubble(image: np.ndarray, mask: np.ndarray, inpaint_radius: int = 3) -> np.ndarray:
    """
    Removes shout and action bubbles by inpainting and preserving edge contrast
    with bilateral filtering.
    """
    # 1. Inpaint using Navier-Stokes (better boundary structure preservation)
    inpainted = cv2.inpaint(image, mask, inpaint_radius, cv2.INPAINT_NS)
    
    # 2. Apply bilateral filter to the inpainted region to smooth out inpainting smudges
    # while preserving strong edge details of the illustration
    smoothed = cv2.bilateralFilter(inpainted, d=9, sigmaColor=75, sigmaSpace=75)
    
    # 3. Blend only the mask region
    return np.where(mask[:, :, np.newaxis] == 255, smoothed, inpainted)
