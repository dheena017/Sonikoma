import os
import sys
import numpy as np
import cv2

# Add parent directory to sys.path so we can import backend.services.cleaner
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

try:
    from backend.services.cleaner import clean_speech_bubbles
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
            from backend.services.cleaner import heuristic_classify
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

if __name__ == "__main__":
    run_cleaner_test()
