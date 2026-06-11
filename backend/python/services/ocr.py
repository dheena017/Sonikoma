import os
from typing import List, Dict, Any, Optional

try:
    import numpy as np
    has_numpy = True
except ImportError:
    np = None
    has_numpy = False

try:
    from PIL import Image, ImageFilter
    has_pil = True
except ImportError:
    Image = None
    ImageFilter = None
    has_pil = False

try:
    import cv2
    has_cv = True
except ImportError:
    cv2 = None
    has_cv = False


class PanelProcessor:
    """
    A unified, modular Computer Vision processor for handling digital webtoon and manhwa 
    panel manipulations, including automatic and manual crops, gutter/seam detections, 
    X-axis border trims (auto-crop margins), coordinate normalization boundaries checks, 
    and session-based Undo/Redo historical state stacks.
    """
    def __init__(self, image_path: Optional[str] = None):
        self.image_path = image_path
        self._image = None
        self._gray = None
        self.height = 0
        self.width = 0

        # Maintain historical states for 'Undo/Redo' operations requested by client
        self.undo_stack: List[Any] = []
        self.redo_stack: List[Any] = []

        if image_path:
            self.load_image(image_path)

    def load_image(self, image_path: str) -> None:
        """Loads and converts the image, initializing dimensions and base state."""
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found at path: {image_path}")
        
        self.image_path = image_path

        if has_cv:
            self._image = cv2.imread(image_path)
            if self._image is not None:
                self._gray = cv2.cvtColor(self._image, cv2.COLOR_BGR2GRAY)
                self.height, self.width = self._gray.shape
        elif has_pil and Image is not None:
            self._image = Image.open(image_path).convert("RGB")
            self.width, self.height = self._image.size
            if has_numpy and np is not None:
                arr = np.array(self._image)
                self._gray = np.dot(arr[..., :3], [0.2989, 0.5870, 0.1140]).astype(np.uint8)

        # Initialize undo/redo stacks
        self.undo_stack = []
        self.redo_stack = []
        if self._image is not None:
            # Seed base state
            state_copy = self._image.copy() if hasattr(self._image, "copy") else self._image
            self.undo_stack.append(state_copy)

    def normalize_coordinates(self, crop_top: float, crop_bottom: float, crop_left: float, crop_right: float) -> Dict[str, float]:
        """
        Ensures coordinate parameters are mathematically valid and normalized within [0, 100] bounds.
        Verifies that total crop margins do not overlap or exceed total boundaries.
        """
        t = max(0.0, min(100.0, float(crop_top)))
        b = max(0.0, min(100.0, float(crop_bottom)))
        l = max(0.0, min(100.0, float(crop_left)))
        r = max(0.0, min(100.0, float(crop_right)))

        # Coordinate overlap adjustments & guards
        if t + b >= 100.0:
            b = max(0.0, 100.0 - t - 1.0)
        if l + r >= 100.0:
            r = max(0.0, 100.0 - l - 1.0)

        return {
            "cropTop": round(t, 2),
            "cropBottom": round(b, 2),
            "cropLeft": round(l, 2),
            "cropRight": round(r, 2)
        }

    def push_state(self, image_state: Any) -> None:
        """Pushes a new image state to the undo tracking history and flushes any stale redos."""
        state_copy = image_state.copy() if hasattr(image_state, "copy") else image_state
        self.undo_stack.append(state_copy)
        self.redo_stack.clear()

    def undo(self) -> bool:
        """
        Rolls back the image state to the preceding historical step.
        Returns True if successful, False if at the base baseline state.
        """
        if len(self.undo_stack) > 1:
            current = self.undo_stack.pop()
            self.redo_stack.append(current)
            
            self._image = self.undo_stack[-1]
            self._update_internal_dimensions()
            return True
        return False

    def redo(self) -> bool:
        """
        Re-applies the next forward state from the redo stack.
        Returns True if successful, False if no states are available for redo.
        """
        if self.redo_stack:
            next_state = self.redo_stack.pop()
            self.undo_stack.append(next_state)
            
            self._image = next_state
            self._update_internal_dimensions()
            return True
        return False

    def _update_internal_dimensions(self) -> None:
        """Re-syncs helper properties and dimensions following state change."""
        if self._image is None:
            return
        if has_cv:
            self._gray = cv2.cvtColor(self._image, cv2.COLOR_BGR2GRAY)
            self.height, self.width = self._gray.shape
        elif has_pil and Image is not None:
            self.width, self.height = self._image.size
            if has_numpy and np is not None:
                arr = np.array(self._image)
                self._gray = np.dot(arr[..., :3], [0.2989, 0.5870, 0.1140]).astype(np.uint8)

    def find_safe_seam(self, y_target: int, search_range: int = 100) -> int:
        """
        Auto-crop vertical seam correction utility:
        Detects low-frequency horizontal visual content lanes (gutters) near the target
        split coordinate to avoid cutting through graphic assets like text or faces.
        """
        if not has_cv or not has_numpy or self._gray is None:
            return y_target

        h, w = self._gray.shape
        if y_target <= 10 or y_target >= h - 10:
            return y_target

        start_range_y = max(0, y_target - search_range)
        end_range_y = min(h, y_target + search_range)

        if start_range_y >= end_range_y:
            return y_target

        grad_y = cv2.Sobel(self._gray, cv2.CV_16S, 0, 1, ksize=3)
        abs_grad_y = cv2.convertScaleAbs(grad_y)
        gradient_row_sums = np.sum(abs_grad_y, axis=1, dtype=np.int64)

        best_seam_y = y_target
        min_gradient_val = float('inf')

        for current_row_y in range(start_range_y, end_range_y):
            win_start = max(0, current_row_y - 1)
            win_end = min(h, current_row_y + 2)
            average_local_gradient = np.mean(gradient_row_sums[win_start:win_end])

            if average_local_gradient < min_gradient_val:
                min_gradient_val = average_local_gradient
                best_seam_y = current_row_y

        return best_seam_y

    def trim_x_margins(self, panel_img: Any) -> Any:
        """
        Auto-crop width logic:
        Discovers non-contrast white and black outer gutter borders along the left/right 
        horizontal columns of a panel and clips them tightly.
        """
        if not has_cv or not has_numpy:
            return panel_img

        try:
            panel_gray = cv2.cvtColor(panel_img, cv2.COLOR_BGR2GRAY)
            p_height, p_width = panel_gray.shape

            _, thresh_white_inv = cv2.threshold(panel_gray, 242, 255, cv2.THRESH_BINARY_INV)
            _, thresh_black = cv2.threshold(panel_gray, 13, 255, cv2.THRESH_BINARY)
            refined_content_mask = cv2.bitwise_and(thresh_white_inv, thresh_black)

            column_density = np.sum(refined_content_mask, axis=0)
            content_indices = np.where(column_density > 0)[0]

            if len(content_indices) > 0:
                left_trim = max(0, int(content_indices[0]))
                right_trim = min(p_width, int(content_indices[-1]) + 1)
                if right_trim - left_trim > 20:
                    return panel_img[:, left_trim:right_trim]
        except Exception:
            pass

        return panel_img

    def crop_manual(self, crop_top: float, crop_bottom: float, crop_left: float, crop_right: float, auto_trim: bool = True) -> Any:
        """
        Clips the current loaded image based on standard coordinates percentages, pushes 
        the state to history tracking, and returns the modified crop buffer.
        """
        norm = self.normalize_coordinates(crop_top, crop_bottom, crop_left, crop_right)

        if self._image is None:
            raise ValueError("No valid image loaded to execute cropping operations.")

        if has_cv:
            h, w = self.height, self.width
            top_px = int(round((norm["cropTop"] / 100.0) * h))
            bottom_px = int(round((norm["cropBottom"] / 100.0) * h))
            left_px = int(round((norm["cropLeft"] / 100.0) * w))
            right_px = int(round((norm["cropRight"] / 100.0) * w))

            cropped = self._image[top_px:(h - bottom_px), left_px:(w - right_px)]
            if auto_trim:
                cropped = self.trim_x_margins(cropped)

            self.push_state(cropped)
            self._image = cropped
            self._update_internal_dimensions()
            return self._image
        else:
            w, h = self.width, self.height
            top_px = int(round((norm["cropTop"] / 100.0) * h))
            bottom_px = int(round((norm["cropBottom"] / 100.0) * h))
            left_px = int(round((norm["cropLeft"] / 100.0) * w))
            right_px = int(round((norm["cropRight"] / 100.0) * w))

            cropped = self._image.crop((left_px, top_px, w - right_px, h - bottom_px))
            self.push_state(cropped)
            self._image = cropped
            self._update_internal_dimensions()
            return self._image

    def cut_all_panels(self, panels_config: List[Dict[str, Any]], output_dir: str) -> None:
        """
        Processes webtoon cut configurations by resolving boundaries, correcting seams,
        cleaning side columns, and outputting to file.
        """
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        if self._image is None:
            return

        if not has_cv or not has_numpy:
            # Fallback direct copy structure
            import shutil
            os.makedirs(output_dir, exist_ok=True)
            if self.image_path:
                shutil.copy(self.image_path, os.path.join(output_dir, "panel_000.png"))
            return

        h = self.height

        for idx, config in enumerate(panels_config):
            custom_start = config.get('custom_start_y')
            custom_end = config.get('custom_end_y')

            if custom_start is not None and custom_end is not None:
                start_y = int(custom_start)
                end_y = int(custom_end)
            else:
                base_start = int(config.get('start_y', (idx / len(panels_config)) * h))
                base_end = int(config.get('end_y', ((idx + 1) / len(panels_config)) * h))

                start_y = self.find_safe_seam(base_start) if base_start > 0 else 0
                end_y = self.find_safe_seam(base_end) if base_end < h else h

            start_y = max(0, min(h, start_y))
            end_y = max(0, min(h, end_y))

            if start_y >= end_y:
                continue

            cut_crop = self._image[start_y:end_y, :]
            clean_panel = self.trim_x_margins(cut_crop)

            out_filename = os.path.join(output_dir, f"panel_{idx:03d}.png")
            cv2.imwrite(out_filename, clean_panel)


def cut_panels(image_path: str, panels_config: List[Dict[str, Any]], output_dir: str) -> None:
    """Wrapper supporting the legacy cut_panels signature by delegating to PanelProcessor."""
    processor = PanelProcessor(image_path)
    processor.cut_all_panels(panels_config, output_dir)


def remove_speech_bubbles(image_path: str, output_path: str, method: str = 'inpaint') -> None:
    """
    Detects and erases dialogue speech bubbles from comic images, using
    either selective Gaussian Blur or high-quality Fast Marching/Telea inpainting.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found at path: {image_path}")

    if not has_cv:
        if not has_numpy or not has_pil or Image is None or np is None:
            import shutil
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            shutil.copy(image_path, output_path)
            return
            
        try:
            img = Image.open(image_path).convert("RGB")
            width, height = img.size
            arr = np.array(img, dtype=np.uint8)
            
            # Convert to gray
            gray = np.dot(arr[...,:3], [0.2989, 0.5870, 0.1140]).astype(np.uint8)
            
            bright_mask = gray > 215
            dark_mask = gray < 90
            
            mask = np.zeros(gray.shape, dtype=bool)
            block_size = 16
            h_blocks = height // block_size
            w_blocks = width // block_size
            
            for r in range(h_blocks):
                y1 = r * block_size
                y2 = (r + 1) * block_size
                for c in range(w_blocks):
                    x1 = c * block_size
                    x2 = (c + 1) * block_size
                    
                    block_bright = bright_mask[y1:y2, x1:x2]
                    block_dark = dark_mask[y1:y2, x1:x2]
                    
                    white_ratio = np.mean(block_bright)
                    dark_ratio = np.mean(block_dark)
                    
                    if white_ratio > 0.32 and 0.005 < dark_ratio < 0.35:
                        mask[y1:y2, x1:x2] = block_dark
                        
            dilated_mask = np.copy(mask)
            for dy in [-2, -1, 0, 1, 2]:
                for dx in [-2, -1, 0, 1, 2]:
                    if dy == 0 and dx == 0:
                        continue
                    dilated_mask |= np.roll(np.roll(mask, dy, axis=0), dx, axis=1)
                    
            bright_pixels = arr[bright_mask & ~dilated_mask]
            if len(bright_pixels) > 0:
                bg_color = np.median(bright_pixels, axis=0).astype(np.uint8)
            else:
                bg_color = np.array([254, 254, 254], dtype=np.uint8)
                
            out_arr = np.copy(arr)
            
            if method == 'blur':
                pil_blur = img.filter(ImageFilter.GaussianBlur(radius=15))
                blur_arr = np.array(pil_blur)
                out_arr[dilated_mask] = blur_arr[dilated_mask]
            else:
                out_arr[dilated_mask] = bg_color
                
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            out_img = Image.fromarray(out_arr)
            out_img.save(output_path)
            return
        except Exception:
            import shutil
            shutil.copy(image_path, output_path)
            return

    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Could not load image file: {image_path}")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    height, width = gray.shape

    _, bright_mask = cv2.threshold(gray, 215, 255, cv2.THRESH_BINARY)
    _, dark_mask = cv2.threshold(gray, 85, 255, cv2.THRESH_BINARY_INV)

    text_dilate_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (12, 12))
    text_blocks = cv2.dilate(dark_mask, text_dilate_kernel, iterations=1)

    contours, _ = cv2.findContours(bright_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    mask = np.zeros_like(gray)
    bubble_detected = False

    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        area = cv2.contourArea(contour)

        if area < (width * height) * 0.001:
            continue

        touches_left = x <= 3
        touches_top = y <= 3
        touches_right = (x + w) >= (width - 3)
        touches_bottom = (y + h) >= (height - 3)
        edge_touch_count = sum([touches_left, touches_top, touches_right, touches_bottom])

        if edge_touch_count >= 3 or (w > width * 0.95 and h > height * 0.95):
            continue

        c_mask = np.zeros_like(gray)
        cv2.drawContours(c_mask, [contour], -1, 255, -1)
        text_intersect = cv2.bitwise_and(c_mask, dark_mask)
        dark_pixel_count = np.count_nonzero(text_intersect)

        if dark_pixel_count > 15:
            cv2.drawContours(mask, [contour], -1, 255, -1)
            bubble_detected = True

    if not bubble_detected:
        text_contours, _ = cv2.findContours(text_blocks, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for tc in text_contours:
            tx, ty, tw, th = cv2.boundingRect(tc)
            ta = cv2.contourArea(tc)
            if ta > (width * height) * 0.0005 and tw < width * 0.80 and th < height * 0.80:
                pad_x = int(max(15, tw * 0.25))
                pad_y = int(max(15, th * 0.25))
                x1 = max(0, tx - pad_x)
                y1 = max(0, ty - pad_y)
                x2 = min(width, tx + tw + pad_x)
                y2 = min(height, ty + th + pad_y)
                cv2.rectangle(mask, (x1, y1), (x2, y2), 255, -1)
                bubble_detected = True

    if bubble_detected:
        dilate_pixels = max(6, int(min(width, height) * 0.015))
        dilation_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (dilate_pixels, dilate_pixels))
        mask = cv2.dilate(mask, dilation_kernel, iterations=1)

    if np.count_nonzero(mask) == 0:
        out_image = image.copy()
    else:
        if method == 'blur':
            blur_size = max(25, int(min(width, height) * 0.12) | 1)
            blurred_image = cv2.GaussianBlur(image, (blur_size, blur_size), 0)
            out_image = np.where(mask[:, :, np.newaxis] == 255, blurred_image, image)
        else:
            out_image = cv2.inpaint(image, mask, 3, cv2.INPAINT_TELEA)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    cv2.imwrite(output_path, out_image)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Webtoon Speech Bubbles / Panels Processor CLI Channel")
    parser.add_argument("--image_path", required=True, help="Path to input comic panel")
    parser.add_argument("--output_path", required=True, help="Path to write the processed output")
    parser.add_argument("--method", default="inpaint", choices=["inpaint", "blur"], help="Erase algorithm")

    args = parser.parse_args()
    try:
        remove_speech_bubbles(args.image_path, args.output_path, args.method)
        print("SUCCESS")
    except Exception as e:
        import sys
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)
