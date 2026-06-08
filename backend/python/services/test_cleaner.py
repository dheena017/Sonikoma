import os
import sys
import numpy as np
import cv2

# Add parent directory to sys.path so we can import backend.python.services.cleaner
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

try:
    from backend.python.services.cleaner import clean_speech_bubbles
except ImportError:
    from services.cleaner import clean_speech_bubbles

def create_mock_comic_panel(path: str):
    """
    Generates a mock comic panel with three distinct text elements:
    1. A solid white speech bubble (oval) containing dark text.
    2. A colored narration box (dark blue rectangle) containing white text.
    3. A stylized red SFX word ("BOOM").
    """
    # 1. Create a background representing comic artwork (light gray canvas with some illustration stripes)
    img = np.ones((600, 600, 3), dtype=np.uint8) * 200
    
    # Draw simple illustration background elements
    cv2.circle(img, (300, 300), 120, (150, 100, 100), -1) # A character-like circle
    cv2.line(img, (0, 0), (600, 600), (80, 80, 80), 8)
    cv2.line(img, (600, 0), (0, 600), (80, 80, 80), 8)
    
    # 2. Draw standard speech bubble (Solid white oval with dark outline)
    # Coordinates: center=(150, 150), axes=(100, 50)
    cv2.ellipse(img, (150, 150), (110, 60), 0, 0, 360, (255, 255, 255), -1)
    cv2.ellipse(img, (150, 150), (110, 60), 0, 0, 360, (0, 0, 0), 2)
    # Add dark text inside speech bubble
    cv2.putText(img, "HELLO WORLD!", (75, 155), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (20, 20, 20), 2, cv2.LINE_AA)
    
    # 3. Draw colored narration box (Dark blue rectangle with thin black border)
    # Coordinates: top-left=(350, 50), bottom-right=(550, 130)
    cv2.rectangle(img, (350, 50), (550, 130), (120, 50, 30), -1) # BGR: dark blue-ish/crimson
    cv2.rectangle(img, (350, 50), (550, 130), (0, 0, 0), 2)
    # Add white text inside narration box
    cv2.putText(img, "MEANWHILE...", (375, 95), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2, cv2.LINE_AA)
    
    # 4. Draw stylized SFX text (Bright red, outline text)
    # Coordinates: bottom-center=(300, 500)
    # To simulate SFX, we write "BOOM" in red with a black outline
    cv2.putText(img, "BOOM!!", (190, 480), cv2.FONT_HERSHEY_TRIPLEX, 2.5, (0, 0, 0), 10, cv2.LINE_AA)
    cv2.putText(img, "BOOM!!", (190, 480), cv2.FONT_HERSHEY_TRIPLEX, 2.5, (50, 50, 240), 4, cv2.LINE_AA) # BGR red/pink
    
    # Save the generated mock image
    cv2.imwrite(path, img)
    print(f"[Test Preparation] Saved mock comic panel to: {path}")

def run_cleaner_test():
    input_path = "test_panel_input.png"
    output_path = "test_panel_output.png"
    debug_path = "test_debug_mask.png"
    
    # Create the test image
    create_mock_comic_panel(input_path)
    
    # Run the bubble cleaner with 'auto' method
    print("[Test Run] Running clean_speech_bubbles with method='auto'...")
    try:
        clean_speech_bubbles(
            image_path=input_path,
            output_path=output_path,
            method="auto",
            sensitivity=50.0,
            dilation=-1,
            inpaint_radius=3,
            detection_style="all",
            debug_path=debug_path
        )
        print("[Test Run] Execution completed successfully!")
        print(f"[Test Run] Cleaned output saved to: {output_path}")
        print(f"[Test Run] Debug mask visualization saved to: {debug_path}")
        
        # Verify outputs exist
        if os.path.exists(output_path) and os.path.exists(debug_path):
            print("[Test Result] PASS: All output files generated successfully.")
            
            in_img = cv2.imread(input_path)
            out_img = cv2.imread(output_path)
            
            # Crop bubble center in both and verify they changed
            bubble_diff = np.mean(np.abs(in_img[120:180, 120:180] - out_img[120:180, 120:180]))
            print(f"[Verification Details] Mean difference in speech bubble region: {bubble_diff:.2f}")
            if bubble_diff > 10.0:
                print("[Verification Details] Speech bubble was modified (inpainted) successfully.")
            else:
                print("[Verification Details] WARNING: Speech bubble region was not modified.")
                
            # Crop SFX center in both and verify they are nearly identical
            sfx_diff = np.mean(np.abs(in_img[430:470, 250:350] - out_img[430:470, 250:350]))
            print(f"[Verification Details] Mean difference in SFX region: {sfx_diff:.2f}")
            if sfx_diff < 5.0:
                print("[Verification Details] SFX region was kept/ignored successfully.")
            else:
                print("[Verification Details] WARNING: SFX region was modified.")
                
            # Let's perform a direct heuristic check on the narration box crop to verify it classifies as colored_box
            from backend.python.services.cleaner import heuristic_classify
            narration_crop = in_img[50:130, 350:550]
            narration_class = heuristic_classify(narration_crop)
            print(f"[Verification Details] Direct heuristic classification of narration box crop: {narration_class}")
            if narration_class == "colored_box":
                print("[Verification Details] PASS: Narration box correctly classified as colored_box.")
            else:
                print(f"[Verification Details] WARNING: Narration box classified as {narration_class}")
                
        else:
            print("[Test Result] FAIL: Output files are missing.")
            
    except Exception as e:
        print(f"[Test Result] FAIL: Exception raised: {e}")
        import traceback
        traceback.print_exc()

def run_enhanced_cleaner_tests():
    print("\n" + "="*50)
    print("[Enhanced Test Run] Running enhanced cleaner feature tests...")
    print("="*50)
    
    from backend.python.services.cleaner import (
        clean_standard_bubble,
        clean_shout_bubble,
        clean_narration_box,
        clean_borderless_text,
        clean_sfx
    )
    
    # ----------------------------------------------------
    # TEST 1: Gradient Background Reconstruction
    # ----------------------------------------------------
    # Create a perfect gradient background image
    h, w = 400, 400
    base_grad = np.zeros((h, w, 3), dtype=np.uint8)
    for y in range(h):
        for x in range(w):
            # Create a diagonal blue-sky-like gradient
            base_grad[y, x] = [int(100 + y * 0.3), int(150 + x * 0.2), 240]
            
    test_img = base_grad.copy()
    
    # Draw a white speech bubble with text on it
    cv2.ellipse(test_img, (200, 200), (80, 50), 0, 0, 360, (255, 255, 255), -1)
    cv2.ellipse(test_img, (200, 200), (80, 50), 0, 0, 360, (0, 0, 0), 2)
    cv2.putText(test_img, "GRADIENT FIT", (140, 205), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2, cv2.LINE_AA)
    
    # Create a mask for this bubble
    mask = np.zeros((h, w), dtype=np.uint8)
    cv2.ellipse(mask, (200, 200), (80, 50), 0, 0, 360, 255, -1)
    
    # Clean standard bubble (should reconstruct gradient)
    cleaned_grad = clean_standard_bubble(test_img, mask, inpaint_radius=3)
    
    # Calculate difference between reconstructed area and the original pre-bubble gradient
    grad_diff = np.mean(np.abs(cleaned_grad[mask == 255].astype(float) - base_grad[mask == 255].astype(float)))
    print(f"[Enhanced Test Details] Gradient reconstruction Mean Absolute Error: {grad_diff:.2f}")
    if grad_diff < 5.0:
        print("[Enhanced Test Result] TEST 1 (Gradient Reconstruction): PASS")
    else:
        print("[Enhanced Test Result] TEST 1 (Gradient Reconstruction): FAIL (Error too high)")
        
    # ----------------------------------------------------
    # TEST 2: Narration Box Stroke-only Removal
    # ----------------------------------------------------
    test_img2 = np.ones((300, 300, 3), dtype=np.uint8) * 180
    # Draw dark red narration box with crisp black border
    box_color = (30, 40, 180) # BGR
    cv2.rectangle(test_img2, (50, 50), (250, 250), box_color, -1)
    cv2.rectangle(test_img2, (50, 50), (250, 250), (0, 0, 0), 3) # Crisp black border
    # Add high-contrast white text inside
    cv2.putText(test_img2, "NARRATION BOX", (70, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2, cv2.LINE_AA)
    
    mask2 = np.zeros((300, 300), dtype=np.uint8)
    cv2.rectangle(mask2, (50, 50), (250, 250), 255, -1)
    
    cleaned_box = clean_narration_box(test_img2, mask2)
    
    # Verify:
    # 1. Text is filled with box background color
    text_check = cleaned_box[140:160, 100:200]
    box_color_diff = np.mean(np.abs(text_check.astype(float) - box_color))
    print(f"[Enhanced Test Details] Text region color difference to box background: {box_color_diff:.2f}")
    
    # 2. Box border remains sharp black (0, 0, 0)
    border_check = cleaned_box[50, 100:200]
    border_diff = np.mean(np.abs(border_check.astype(float) - (0, 0, 0)))
    print(f"[Enhanced Test Details] Border region difference to black: {border_diff:.2f}")
    
    if box_color_diff < 15.0 and border_diff < 5.0:
        print("[Enhanced Test Result] TEST 2 (Narration Box Stroke-only): PASS")
    else:
        print("[Enhanced Test Result] TEST 2 (Narration Box Stroke-only): FAIL")
        
    # Save enhanced test outputs for visual inspection
    cv2.imwrite("test_enhanced_grad_output.png", cleaned_grad)
    cv2.imwrite("test_enhanced_box_output.png", cleaned_box)
    print("[Enhanced Test Run] Saved enhanced test output visual panels.")
    
    # ----------------------------------------------------
    # TEST 3: SFX Smart Cleaning
    # ----------------------------------------------------
    # SFX should be cleaned when clean_enabled is True
    test_img3 = np.ones((200, 200, 3), dtype=np.uint8) * 150
    # SFX red text
    cv2.putText(test_img3, "BAM!", (30, 120), cv2.FONT_HERSHEY_TRIPLEX, 1.5, (0, 0, 255), 3, cv2.LINE_AA)
    mask3 = np.zeros((200, 200), dtype=np.uint8)
    cv2.rectangle(mask3, (10, 10), (190, 190), 255, -1)
    
    cleaned_sfx_on = clean_sfx(test_img3, mask3, clean_enabled=True)
    cleaned_sfx_off = clean_sfx(test_img3, mask3, clean_enabled=False)
    
    sfx_on_diff = np.mean(np.abs(cleaned_sfx_on.astype(float) - 150.0))
    sfx_off_diff = np.mean(np.abs(cleaned_sfx_off.astype(float) - test_img3.astype(float)))
    
    print(f"[Enhanced Test Details] SFX Cleaned diff: {sfx_on_diff:.2f}, SFX Preserved diff: {sfx_off_diff:.2f}")
    if sfx_on_diff < 10.0 and sfx_off_diff < 0.1:
        print("[Enhanced Test Result] TEST 3 (SFX Toggle Clean): PASS")
    else:
        print("[Enhanced Test Result] TEST 3 (SFX Toggle Clean): FAIL")


if __name__ == "__main__":
    run_cleaner_test()
    run_enhanced_cleaner_tests()
