"""
debug_visualizer.py
-------------------
Draws YOLO speech-bubble detections (masks + boxes + labels) onto a panel image,
and exports full-resolution multi-stage diagnostic overlays for the panel detection pipeline.
"""
import os
import json
import logging
import time
from typing import List, Dict, Any, Union, Optional, Tuple, Literal
from dataclasses import dataclass, asdict
from pathlib import Path
import numpy as np
import cv2
from PIL import Image

logger = logging.getLogger("sonikoma.services.image.panel_detection.debug_visualizer")


# ============================================================================
# CONFIGURATION & STYLE DEFINITIONS
# ============================================================================

@dataclass
class ColorScheme:
    """Color scheme for visualizations (BGR format for OpenCV)."""
    mask_fill: Tuple[int, int, int] = (0, 200, 80)      # Green fill
    box_border: Tuple[int, int, int] = (0, 200, 80)     # Green border
    label_bg: Tuple[int, int, int] = (0, 160, 60)       # Label background
    label_fg: Tuple[int, int, int] = (255, 255, 255)    # Label foreground
    separator: Tuple[int, int, int] = (0, 200, 0)       # Green separator
    content: Tuple[int, int, int] = (0, 0, 200)         # Red content
    uncertain: Tuple[int, int, int] = (0, 220, 220)     # Yellow uncertain
    candidate: Tuple[int, int, int] = (255, 120, 0)     # Orange candidates
    merged: Tuple[int, int, int] = (200, 0, 200)        # Magenta merged
    split_recursive: Tuple[int, int, int] = (0, 165, 255)  # Orange for recursive
    split_base: Tuple[int, int, int] = (0, 220, 80)     # Green for base
    final_box: Tuple[int, int, int] = (0, 220, 80)      # Green final boxes
    banner_bg: Tuple[int, int, int] = (20, 20, 20)      # Dark banner
    banner_text: Tuple[int, int, int] = (220, 220, 220) # Light text
    grid_bg: Tuple[int, int, int] = (30, 30, 30)        # Grid background


@dataclass
class VisualizationConfig:
    """Configuration for visualization parameters."""
    mask_alpha: float = 0.40           # Mask transparency (0-1)
    box_thickness: int = 2             # Box line thickness
    final_box_thickness: int = 3       # Final box thickness
    label_font_scale: float = 0.55     # Label font size
    banner_font_scale: float = 0.6     # Banner font size
    font: int = cv2.FONT_HERSHEY_SIMPLEX
    line_type: int = cv2.LINE_AA
    banner_height: int = 32            # Banner height in pixels
    separator_line_thickness: int = 1  # Separator line thickness
    heatmap_line_thickness: int = 1    # Heatmap line thickness
    text_offset_x: int = 3             # Text X offset from box
    text_offset_y: int = 4             # Text Y offset from box
    min_crop_size: int = 5             # Minimum crop dimensions
    crop_preview_width: int = 400      # Preview grid width
    crop_padding: int = 10             # Padding between crops in grid


DEFAULT_COLORS = ColorScheme()
DEFAULT_CONFIG = VisualizationConfig()


# ============================================================================
# HELPER FUNCTIONS FOR PROPERTY EXTRACTION
# ============================================================================

def _extract_box_coords(obj: Union[Dict[str, Any], Any]) -> Tuple[int, int, int, int]:
    try:
        if isinstance(obj, dict):
            raw_x = obj.get("x")
            raw_y = obj.get("y")
            raw_w = obj.get("width") if obj.get("width") is not None else obj.get("w")
            raw_h = obj.get("height") if obj.get("height") is not None else obj.get("h")
        else:
            raw_x = getattr(obj, "x", None)
            raw_y = getattr(obj, "y", None)
            raw_w = getattr(obj, "width", None) if getattr(obj, "width", None) is not None else getattr(obj, "w", None)
            raw_h = getattr(obj, "height", None) if getattr(obj, "height", None) is not None else getattr(obj, "h", None)

        x = int(raw_x) if raw_x is not None else 0
        y = int(raw_y) if raw_y is not None else 0
        w = int(raw_w) if raw_w is not None else 0
        h = int(raw_h) if raw_h is not None else 0
        return x, y, w, h
    except (ValueError, TypeError, AttributeError) as e:
        logger.debug(f"[DebugViz] Failed to extract box coordinates: {e}")
        return 0, 0, 0, 0


def _get_depth(obj: Union[Dict[str, Any], Any], default: int = 0) -> int:
    try:
        if isinstance(obj, dict):
            val = obj.get("depth")
        else:
            val = getattr(obj, "depth", None)
        return int(val) if val is not None else default
    except (ValueError, TypeError):
        return default


def _get_confidence(obj: Union[Dict[str, Any], Any], default: float = 0.90) -> float:
    try:
        if isinstance(obj, dict):
            val = obj.get("confidence")
        else:
            val = getattr(obj, "confidence", None)
        return float(val) if val is not None else default
    except (ValueError, TypeError):
        return default


def _clamp_coords(x: int, y: int, w: int, h: int, 
                  max_w: int, max_h: int) -> Tuple[int, int, int, int]:
    x = max(0, min(max_w - 1, x))
    y = max(0, min(max_h - 1, y))
    w = max(1, min(max_w - x, w))
    h = max(1, min(max_h - y, h))
    return x, y, w, h


def _draw_text_with_bg(frame: np.ndarray, text: str, position: Tuple[int, int],
                       font: int = cv2.FONT_HERSHEY_SIMPLEX, font_scale: float = 0.55,
                       text_color: Tuple[int, int, int] = (255, 255, 255),
                       bg_color: Tuple[int, int, int] = (0, 160, 60),
                       thickness: int = 1) -> None:
    (text_width, text_height), _ = cv2.getTextSize(text, font, font_scale, thickness)
    x, y = position
    cv2.rectangle(frame, (x, y - text_height - 8), 
                 (x + text_width + 6, y), bg_color, -1)
    cv2.putText(frame, text, (x + 3, y - 4), font, font_scale, 
               text_color, thickness, cv2.LINE_AA)


# ============================================================================
# MAIN VISUALIZATION FUNCTIONS
# ============================================================================

def draw_yolo_detections(image_path: str, conf_threshold: float = 0.25,
                         colors: Optional[ColorScheme] = None,
                         config: Optional[VisualizationConfig] = None) -> Optional[bytes]:
    if colors is None:
        colors = DEFAULT_COLORS
    if config is None:
        config = DEFAULT_CONFIG
        
    try:
        if not os.path.isfile(image_path):
            logger.error(f"[DebugViz] Image file not found: {image_path}")
            raise FileNotFoundError(f"Image file not found: {image_path}")
            
        from services.image.panel_detection.speech_bubble_detector import get_yolo_model

        model = get_yolo_model()
        if model is None:
            logger.warning("[DebugViz] YOLO model not available — cannot draw detections.")
            return None

        pil_img = Image.open(image_path).convert("RGB")
        frame = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        h, w = frame.shape[:2]

        results = model(frame, conf=conf_threshold, verbose=False)
        
        if results is None:
            logger.warning("[DebugViz] YOLO returned None.")
            return None
        
        try:
            results_list = list(results) if hasattr(results, '__iter__') and not isinstance(results, list) else results
        except (TypeError, ValueError):
            logger.warning("[DebugViz] YOLO results cannot be converted to list.")
            return None
        
        if not results_list or len(results_list) == 0:  # type: ignore
            logger.warning("[DebugViz] YOLO returned empty results.")
            return None
            
        r = results_list[0]  # type: ignore
        
        if not hasattr(r, 'boxes'):
            logger.warning("[DebugViz] YOLO result missing 'boxes' attribute.")
            annotated = _add_no_detection_banner(frame.copy(), colors, config)
            return _encode_png(annotated)

        if r.boxes is None or len(r.boxes) == 0:  # type: ignore
            logger.info("[DebugViz] YOLO found no detections — returning annotated image with no-detection banner.")
            annotated = _add_no_detection_banner(frame.copy(), colors, config)
            return _encode_png(annotated)

        overlay = frame.copy()

        if hasattr(r, 'masks') and r.masks is not None:  # type: ignore
            try:
                mask_data = r.masks.data if hasattr(r.masks, 'data') else r.masks  # type: ignore
                for mask_tensor in mask_data:
                    try:
                        mask_np = mask_tensor.cpu().numpy() if hasattr(mask_tensor, 'cpu') else np.array(mask_tensor)
                        if not isinstance(mask_np, np.ndarray):
                            mask_np = np.array(mask_np, dtype=np.float32)
                        if mask_np.ndim < 2:
                            continue
                        if mask_np.ndim == 3:
                            mask_np = mask_np.squeeze(0)
                        mask_np = np.asarray(mask_np, dtype=np.float32)
                        if mask_np.shape[0] == 0 or mask_np.shape[1] == 0:
                            continue
                        mask_resized = cv2.resize(mask_np, (w, h), interpolation=cv2.INTER_LINEAR)
                        bool_mask = mask_resized > 0.5
                        overlay[bool_mask] = cv2.addWeighted(
                            overlay[bool_mask], 1 - config.mask_alpha,
                            np.array(colors.mask_fill, dtype=np.uint8), config.mask_alpha, 0
                        )
                    except Exception as e:
                        logger.debug(f"[DebugViz] Error processing individual mask: {e}")
                        continue
            except Exception as e:
                logger.debug(f"[DebugViz] Error drawing masks: {e}")

        frame = cv2.addWeighted(overlay, config.mask_alpha, frame, 1 - config.mask_alpha, 0)

        boxes = r.boxes if hasattr(r, 'boxes') else None  # type: ignore
        if boxes is not None:
            try:
                boxes_list = list(boxes) if hasattr(boxes, '__iter__') else [boxes]  # type: ignore
                for i, box in enumerate(boxes_list):
                    try:
                        xyxy = box.xyxy[0].tolist() if hasattr(box, 'xyxy') else box[0:4].tolist()
                        x1, y1, x2, y2 = map(int, xyxy)
                        conf = float(box.conf[0]) if hasattr(box, 'conf') else 0.0
                        cls_id = int(box.cls[0]) if hasattr(box, 'cls') else 0
                        cls_name = model.names.get(cls_id, f"cls{cls_id}") if hasattr(model, 'names') else f"cls{cls_id}"

                        cv2.rectangle(frame, (x1, y1), (x2, y2), colors.box_border, config.box_thickness)
                        label = f"{cls_name} {conf:.2f}"
                        _draw_text_with_bg(frame, label, (x1, y1),
                                         font=config.font, font_scale=config.label_font_scale,
                                         text_color=colors.label_fg, bg_color=colors.label_bg,
                                         thickness=config.box_thickness)
                    except Exception as e:
                        logger.debug(f"[DebugViz] Error drawing box {i}: {e}")
                        continue
            except TypeError as e:
                logger.warning(f"[DebugViz] Cannot iterate over boxes: {e}")

        box_count = len(boxes) if boxes is not None else 0  # type: ignore
        summary = f"YOLO: {box_count} speech bubble{'s' if box_count != 1 else ''} detected  (conf >= {conf_threshold})"
        _draw_banner(frame, summary, colors, config)

        logger.info(f"[DebugViz] Drew {box_count} detections onto panel image.")
        return _encode_png(frame)
        
    except FileNotFoundError:
        raise
    except Exception as e:
        logger.error(f"[DebugViz] Error in draw_yolo_detections: {e}", exc_info=True)
        return None


def _draw_banner(frame: np.ndarray, text: str, 
                colors: Optional[ColorScheme] = None,
                config: Optional[VisualizationConfig] = None) -> None:
    if colors is None:
        colors = DEFAULT_COLORS
    if config is None:
        config = DEFAULT_CONFIG
        
    bar_h = config.banner_height
    if bar_h >= frame.shape[0]:
        bar_h = frame.shape[0] // 4
    
    bar = frame[:bar_h].copy()
    w = frame.shape[1]
    cv2.rectangle(frame, (0, 0), (w, bar_h), colors.banner_bg, -1)
    frame[:bar_h] = cv2.addWeighted(frame[:bar_h], 0.6, bar, 0.4, 0)
    cv2.putText(frame, text, (8, bar_h - 10),
                config.font, config.banner_font_scale, colors.banner_text, 1, cv2.LINE_AA)


def _add_no_detection_banner(frame: np.ndarray, 
                             colors: Optional[ColorScheme] = None,
                             config: Optional[VisualizationConfig] = None) -> np.ndarray:
    _draw_banner(frame, "YOLO: No speech bubbles detected at this confidence threshold", 
                 colors, config)
    return frame


def _encode_png(frame: np.ndarray) -> bytes:
    try:
        success, buf = cv2.imencode(".png", frame)
        if not success:
            raise RuntimeError("cv2.imencode failed - unable to encode frame as PNG")
        return buf.tobytes()
    except Exception as e:
        logger.error(f"[DebugViz] PNG encoding error: {e}")
        raise RuntimeError(f"Failed to encode PNG: {e}")


# ============================================================================
# ADVANCED VISUALIZATION & STATISTICS
# ============================================================================

def export_multi_stage_debug_images(
    image_src: Any,
    panel_bounds: List[Any],
    output_dir: Optional[str] = None,
    job_id: Optional[str] = None,
    separator_scores: Optional[np.ndarray] = None,
    separator_bands: Optional[List[int]] = None,
    raw_candidates: Optional[List[Dict[str, Any]]] = None,
    merged_candidates: Optional[List[Dict[str, Any]]] = None,
    pipeline_summary: Optional[Dict[str, Any]] = None,
    lineage_tracker: Optional[Dict[str, Any]] = None,
    colors: Optional[ColorScheme] = None,
    config: Optional[VisualizationConfig] = None,
    enable_timing: bool = True
) -> Dict[str, str]:
    start_time = time.time() if enable_timing else None
    
    if colors is None:
        colors = DEFAULT_COLORS
    if config is None:
        config = DEFAULT_CONFIG
        
    if output_dir is None or output_dir == "debug_output":
        curr = os.path.abspath(os.path.dirname(__file__))
        while curr and os.path.basename(curr) != "Sonikoma" and os.path.dirname(curr) != curr:
            curr = os.path.dirname(curr)
        if os.path.basename(curr) == "Sonikoma":
            output_dir = os.path.join(curr, "data", "debug_output")
        else:
            project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", ".."))
            output_dir = os.path.join(project_root, "data", "debug_output")

    try:
        Path(output_dir).mkdir(parents=True, exist_ok=True)
    except Exception as e:
        logger.error(f"[DebugViz][{job_id or 'N/A'}] Failed to create output directory {output_dir}: {e}")
        return {}

    saved_files = {}
    prefix = f"debug_{job_id}_" if job_id else "debug_"
    timing_info = {}

    try:
        img_load_start = time.time() if enable_timing else None
        pil_img = _load_image(image_src, job_id)
        if pil_img is None:
            return saved_files
        
        if enable_timing and img_load_start:
            timing_info["image_load_ms"] = round((time.time() - img_load_start) * 1000, 2)

        w, h = pil_img.size
        frame = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

        # 1. 01_original.png
        p01 = os.path.join(output_dir, f"{prefix}01_original.png")
        pil_img.save(p01)
        saved_files["01_original"] = p01

        # 2. 02_separator_heatmap.png
        p02 = _generate_separator_heatmap(frame, separator_scores, h, w, colors, output_dir, prefix)
        if p02:
            saved_files["02_separator_heatmap"] = p02

        # 3. 03_separator_rows.png
        p03 = _generate_separator_rows(frame, separator_bands, w, colors, output_dir, prefix)
        if p03:
            saved_files["03_separator_rows"] = p03

        # 4. 04_candidate_boxes.png
        p04 = _generate_candidate_boxes(frame, raw_candidates or panel_bounds, colors, output_dir, prefix)
        if p04:
            saved_files["04_candidate_boxes"] = p04

        # 5. 05_after_merge.png
        p05 = _generate_merged_boxes(frame, merged_candidates or panel_bounds, colors, output_dir, prefix)
        if p05:
            saved_files["05_after_merge"] = p05

        # 6. 06_after_recursive_split.png
        p06 = _generate_split_boxes(frame, panel_bounds, colors, output_dir, prefix)
        if p06:
            saved_files["06_after_recursive_split"] = p06

        # 7. 07_final_boxes.png
        p07 = _generate_final_boxes(frame, panel_bounds, colors, config, output_dir, prefix)
        if p07:
            saved_files["07_final_boxes"] = p07

        # 8. 08_crop_preview.png
        p08 = _generate_crop_preview(pil_img, panel_bounds, config, output_dir, prefix)
        if p08:
            saved_files["08_crop_preview"] = p08

        # 9. 09_pipeline_summary.json
        p09 = _generate_pipeline_summary(panel_bounds, w, h, pipeline_summary, job_id, 
                                         timing_info, output_dir, prefix)
        if p09:
            saved_files["09_pipeline_summary"] = p09

        # 10. 10_panel_lineage.json
        p10 = _generate_panel_lineage(panel_bounds, lineage_tracker, output_dir, prefix, job_id)
        if p10:
            saved_files["10_panel_lineage"] = p10

        if p01:
            saved_files["debug_01_merged"] = p01
        if p04:
            saved_files["debug_02_detected_boxes"] = p04
        if p07:
            saved_files["debug_02b_box_numbers"] = p07
        if p08:
            saved_files["debug_03_final_crops"] = p08

        total_time = time.time() - start_time if enable_timing and start_time else None
        if enable_timing and total_time:
            logger.info(f"[DebugViz][{job_id or 'N/A'}] Exported {len(saved_files)} artifacts in {total_time:.2f}s")
        else:
            logger.info(f"[DebugViz][{job_id or 'N/A'}] Successfully exported {len(saved_files)} diagnostic artifacts")

    except Exception as err:
        logger.error(f"[DebugViz][{job_id or 'N/A'}] Multi-stage debug export error: {err}", exc_info=True)

    return saved_files


def _load_image(image_src: Any, job_id: Optional[str] = None) -> Optional[Image.Image]:
    try:
        if isinstance(image_src, str):
            if not os.path.isfile(image_src):
                logger.error(f"[DebugViz][{job_id or 'N/A'}] Image file not found: {image_src}")
                return None
            return Image.open(image_src).convert("RGB")
        elif isinstance(image_src, np.ndarray):
            if len(image_src.shape) == 2:
                return Image.fromarray(image_src).convert("RGB")
            elif image_src.shape[2] == 3:
                return Image.fromarray(cv2.cvtColor(image_src, cv2.COLOR_BGR2RGB))
            else:
                return Image.fromarray(image_src).convert("RGB")
        elif isinstance(image_src, Image.Image):
            return image_src.convert("RGB")
        else:
            logger.error(f"[DebugViz][{job_id or 'N/A'}] Unsupported image source type: {type(image_src)}")
            return None
    except Exception as e:
        logger.error(f"[DebugViz][{job_id or 'N/A'}] Failed to load image: {e}")
        return None


def _generate_separator_heatmap(frame: np.ndarray, separator_scores: Optional[np.ndarray],
                               h: int, w: int, colors: ColorScheme,
                               output_dir: str, prefix: str) -> Optional[str]:
    try:
        heatmap_frame = frame.copy()
        if separator_scores is not None and len(separator_scores) == h:
            for y in range(h):
                score = separator_scores[y]
                if score >= 0.70:
                    color = colors.separator
                elif score <= 0.40:
                    color = colors.content
                else:
                    color = colors.uncertain
                cv2.line(heatmap_frame, (0, y), (w, y), color, 1)
        else:
            _draw_banner(heatmap_frame, "No separator scores available", colors)

        p02 = os.path.join(output_dir, f"{prefix}02_separator_heatmap.png")
        cv2.imwrite(p02, heatmap_frame)
        return p02
    except Exception as e:
        logger.debug(f"[DebugViz] Error generating separator heatmap: {e}")
        return None


def _generate_separator_rows(frame: np.ndarray, separator_bands: Optional[List[int]],
                             w: int, colors: ColorScheme,
                             output_dir: str, prefix: str) -> Optional[str]:
    try:
        sep_frame = frame.copy()
        if separator_bands:
            for cut_y in separator_bands:
                cv2.line(sep_frame, (0, cut_y), (w, cut_y), colors.uncertain, 2)
        else:
            _draw_banner(sep_frame, "No separator rows available", colors)
        
        p03 = os.path.join(output_dir, f"{prefix}03_separator_rows.png")
        cv2.imwrite(p03, sep_frame)
        return p03
    except Exception as e:
        logger.debug(f"[DebugViz] Error generating separator rows: {e}")
        return None


def _generate_candidate_boxes(frame: np.ndarray, candidates: List[Any],
                              colors: ColorScheme, output_dir: str, prefix: str) -> Optional[str]:
    try:
        cand_frame = frame.copy()
        drawn = 0
        for idx, pb in enumerate(candidates):
            x, y, w, h = _extract_box_coords(pb)
            if w > 0 and h > 0:
                cv2.rectangle(cand_frame, (x, y), (x + w, y + h), colors.candidate, 2)
                drawn += 1

        if drawn == 0:
            _draw_banner(cand_frame, "No candidate boxes to draw", colors)

        p04 = os.path.join(output_dir, f"{prefix}04_candidate_boxes.png")
        cv2.imwrite(p04, cand_frame)
        return p04
    except Exception as e:
        logger.debug(f"[DebugViz] Error generating candidate boxes: {e}")
        return None


def _generate_merged_boxes(frame: np.ndarray, merged: List[Any],
                          colors: ColorScheme, output_dir: str, prefix: str) -> Optional[str]:
    try:
        merge_frame = frame.copy()
        drawn = 0
        for idx, pb in enumerate(merged):
            x, y, w, h = _extract_box_coords(pb)
            if w > 0 and h > 0:
                cv2.rectangle(merge_frame, (x, y), (x + w, y + h), colors.merged, 2)
                drawn += 1
        
        if drawn == 0:
            _draw_banner(merge_frame, "No merged candidate boxes to draw", colors)

        p05 = os.path.join(output_dir, f"{prefix}05_after_merge.png")
        cv2.imwrite(p05, merge_frame)
        return p05
    except Exception as e:
        logger.debug(f"[DebugViz] Error generating merged boxes: {e}")
        return None


def _generate_split_boxes(frame: np.ndarray, panel_bounds: List[Any],
                         colors: ColorScheme, output_dir: str, prefix: str) -> Optional[str]:
    try:
        split_frame = frame.copy()
        drawn = 0
        for idx, pb in enumerate(panel_bounds):
            x, y, w, h = _extract_box_coords(pb)
            depth = _get_depth(pb, default=0)
            color = colors.split_recursive if depth > 0 else colors.split_base
            if w > 0 and h > 0:
                cv2.rectangle(split_frame, (x, y), (x + w, y + h), color, 2)
                drawn += 1
        
        if drawn == 0:
            _draw_banner(split_frame, "No recursive split boxes to draw", colors)

        p06 = os.path.join(output_dir, f"{prefix}06_after_recursive_split.png")
        cv2.imwrite(p06, split_frame)
        return p06
    except Exception as e:
        logger.debug(f"[DebugViz] Error generating split boxes: {e}")
        return None


def _generate_final_boxes(frame: np.ndarray, panel_bounds: List[Any],
                         colors: ColorScheme, config: VisualizationConfig,
                         output_dir: str, prefix: str) -> Optional[str]:
    try:
        final_frame = frame.copy()
        drawn = 0
        for idx, pb in enumerate(panel_bounds):
            x, y, w, h = _extract_box_coords(pb)
            if w > 0 and h > 0:
                cv2.rectangle(final_frame, (x, y), (x + w, y + h), colors.final_box, config.final_box_thickness)
                label = f"#{idx+1} ({x},{y},{w}x{h})"
                _draw_text_with_bg(final_frame, label, (x, max(0, y)),
                                 font=config.font, font_scale=0.5,
                                 text_color=(255, 255, 255),
                                 bg_color=(0, 140, 50), thickness=1)
                drawn += 1
        
        if drawn == 0:
            _draw_banner(final_frame, "No final boxes to draw", colors)

        p07 = os.path.join(output_dir, f"{prefix}07_final_boxes.png")
        cv2.imwrite(p07, final_frame)
        return p07
    except Exception as e:
        logger.debug(f"[DebugViz] Error generating final boxes: {e}")
        return None


def _generate_crop_preview(pil_img: Image.Image, panel_bounds: List[Any],
                          config: VisualizationConfig,
                          output_dir: str, prefix: str) -> Optional[str]:
    try:
        w, h = pil_img.size
        cropped_imgs = []
        
        for pb in panel_bounds:
            x, y, bw, bh = _extract_box_coords(pb)
            x, y, bw, bh = _clamp_coords(x, y, bw, bh, w, h)
            
            if bw >= config.min_crop_size and bh >= config.min_crop_size:
                cropped_imgs.append(pil_img.crop((x, y, x + bw, y + bh)))

        if not cropped_imgs:
            return None

        max_c_w = max(c.size[0] for c in cropped_imgs)
        target_w = min(config.crop_preview_width, max_c_w)
        resized_crops = []
        
        for c in cropped_imgs:
            c_w, c_h = c.size
            scale = target_w / float(c_w)
            res_h = max(1, int(c_h * scale))
            resized_crops.append(c.resize((target_w, res_h), Image.Resampling.BICUBIC))

        grid_w = target_w
        grid_h = sum(c.size[1] + config.crop_padding for c in resized_crops)
        grid_img = Image.new("RGB", (grid_w, grid_h), (30, 30, 30))
        curr_y = 0
        
        for c in resized_crops:
            grid_img.paste(c, (0, curr_y))
            curr_y += c.size[1] + config.crop_padding

        p08 = os.path.join(output_dir, f"{prefix}08_crop_preview.png")
        grid_img.save(p08)
        return p08
    except Exception as e:
        logger.debug(f"[DebugViz] Error generating crop preview: {e}")
        return None


def _generate_pipeline_summary(panel_bounds: List[Any], w: int, h: int,
                               pipeline_summary: Optional[Dict[str, Any]],
                               job_id: Optional[str],
                               timing_info: Dict[str, float],
                               output_dir: str, prefix: str) -> Optional[str]:
    try:
        panel_heights = []
        confidences = []
        
        for pb in panel_bounds:
            _, _, _, bh = _extract_box_coords(pb)
            conf = _get_confidence(pb)
            if bh > 0:
                panel_heights.append(int(bh))
            confidences.append(conf)

        med_h = float(np.median(panel_heights)) if panel_heights else 0.0
        max_h = int(np.max(panel_heights)) if panel_heights else 0
        min_h = int(np.min(panel_heights)) if panel_heights else 0
        avg_h = float(np.mean(panel_heights)) if panel_heights else 0.0
        ratio = float(round(max_h / max(1.0, med_h), 2)) if med_h > 0 else 1.0

        density_level = "Optimal" if len(panel_bounds) >= max(5, int(h / 1500)) else (
            "Medium" if len(panel_bounds) >= 3 else "Low"
        )
        rec = "Optimal segmentation achieved." if ratio <= 3.0 else "Recursive split recommended for oversized slices."

        quality_report = {
            "image_height": h,
            "image_width": w,
            "panel_count": len(panel_bounds),
            "panel_height_stats": {
                "min": min_h,
                "max": max_h,
                "median": round(med_h, 1),
                "mean": round(avg_h, 1)
            },
            "largest_vs_median_ratio": ratio,
            "separator_density_level": density_level,
            "overall_confidence": round(float(np.mean(confidences)), 2) if confidences else 0.90,
            "recommendation": rec
        }

        summary_data = pipeline_summary or {
            "job_id": job_id,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "image_dimensions": [w, h],
            "panel_count": len(panel_bounds),
            "quality_report": quality_report
        }
        
        if "quality_report" not in summary_data:
            summary_data["quality_report"] = quality_report
        if timing_info:
            summary_data["timing_info"] = timing_info

        p09 = os.path.join(output_dir, f"{prefix}09_pipeline_summary.json")
        with open(p09, "w") as f:
            json.dump(summary_data, f, indent=2, default=str)
        return p09
    except Exception as e:
        logger.debug(f"[DebugViz] Error generating pipeline summary: {e}")
        return None


def _generate_panel_lineage(panel_bounds: List[Any],
                           lineage_tracker: Optional[Dict[str, Any]],
                           output_dir: str, prefix: str, job_id: Optional[str]) -> Optional[str]:
    try:
        lineage_data = lineage_tracker or {}
        
        if "panels" not in lineage_data:
            lineage_data["panels"] = []
            for idx, pb in enumerate(panel_bounds):
                x, y, w, h = _extract_box_coords(pb)
                depth = _get_depth(pb)
                conf = _get_confidence(pb)
                
                panel_record = {
                    "index": idx + 1,
                    "bounds": {"x": x, "y": y, "width": w, "height": h},
                    "depth": depth,
                    "confidence": round(conf, 2)
                }
                
                if isinstance(pb, dict) and "parent_id" in pb:
                    panel_record["parent_id"] = pb["parent_id"]
                
                lineage_data["panels"].append(panel_record)

        lineage_data["job_id"] = job_id
        lineage_data["timestamp"] = time.strftime("%Y-%m-%d %H:%M:%S")

        p10 = os.path.join(output_dir, f"{prefix}10_panel_lineage.json")
        with open(p10, "w") as f:
            json.dump(lineage_data, f, indent=2, default=str)
        return p10
    except Exception as e:
        logger.debug(f"[DebugViz] Error generating panel lineage: {e}")
        return None


def batch_draw_yolo_detections(image_paths: List[str], 
                               conf_threshold: float = 0.25,
                               colors: Optional[ColorScheme] = None,
                               config: Optional[VisualizationConfig] = None) -> Dict[str, Optional[bytes]]:
    results = {}
    for path in image_paths:
        try:
            result = draw_yolo_detections(path, conf_threshold, colors, config)
            results[path] = result
        except Exception as e:
            logger.error(f"[DebugViz] Batch processing error for {path}: {e}")
            results[path] = None
    return results


def get_quality_metrics(panel_bounds: List[Any]) -> Dict[str, Any]:
    if not panel_bounds:
        return {
            "panel_count": 0,
            "avg_height": 0.0,
            "median_height": 0.0,
            "height_variance": 0.0,
            "aspect_ratio_avg": 0.0
        }

    heights = []
    widths = []
    areas = []
    aspect_ratios = []

    for pb in panel_bounds:
        x, y, w, h = _extract_box_coords(pb)
        if w > 0 and h > 0:
            heights.append(h)
            widths.append(w)
            areas.append(w * h)
            aspect_ratios.append(w / h if h > 0 else 0)

    return {
        "panel_count": len(panel_bounds),
        "height_stats": {
            "min": int(np.min(heights)) if heights else 0,
            "max": int(np.max(heights)) if heights else 0,
            "mean": float(round(np.mean(heights), 2)) if heights else 0.0,
            "median": float(round(np.median(heights), 2)) if heights else 0.0,
            "std": float(round(np.std(heights), 2)) if heights else 0.0
        },
        "width_stats": {
            "min": int(np.min(widths)) if widths else 0,
            "max": int(np.max(widths)) if widths else 0,
            "mean": float(round(np.mean(widths), 2)) if widths else 0.0
        },
        "area_stats": {
            "total": int(np.sum(areas)) if areas else 0,
            "mean": float(round(np.mean(areas), 2)) if areas else 0.0,
            "max": int(np.max(areas)) if areas else 0
        },
        "aspect_ratio_avg": float(round(np.mean(aspect_ratios), 2)) if aspect_ratios else 0.0
    }
