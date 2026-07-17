"""
backend/app/services/image/image_service.py
─────────────────────────────────────────────────────────────────────────────
Service layer for coordinating image edits, transformations, merging, splitting,
ZIP downloads, layer segmentation, YOLO visualization, and speech bubble removal.
─────────────────────────────────────────────────────────────────────────────
"""

import io
import os
import time
import uuid
import glob
import zipfile
import tempfile
import asyncio
import base64
import logging
import mimetypes
from typing import List, Optional, Dict, Any, Literal
from PIL import Image

import services.image.image_utils as img_utils
from utils.cache import stitched_cache, edit_history, zip_cache
from media.image.cleaner import remove_speech_bubbles
from media.image.layer_segmentation import process_layers
from services.image.detect_panels import run_cv_detection
from utils.supabase_storage import upload_to_supabase_bucket
from media.image.imagemagick_engine import get_imagemagick_engine, ResizeMode, FilterType

logger = logging.getLogger("sonikoma.services.image.image_service")

try:
    imagemagick = get_imagemagick_engine()
except ImportError as exc:
    logger.warning(f"ImageMagick engine not available in service layer: {exc}")
    imagemagick = None


def _ensure_imagemagick() -> Any:
    if imagemagick is None:
        raise ValueError("ImageMagick is not installed or not available. Install ImageMagick and wand.")
    return imagemagick


async def apply_image_edits_service(
    url: str,
    rotate: Optional[float] = None,
    flipHorizontal: bool = False,
    cropTop: float = 0.0,
    cropBottom: float = 0.0,
    cropLeft: float = 0.0,
    cropRight: float = 0.0,
    autoTrim: bool = False,
    padding: Optional[int] = None,
    sensitivity: Optional[float] = None,
    backgroundColorMode: str = 'auto',
    aspectRatio: str = 'free',
    outputFormat: str = 'jpeg',
    cropQuality: int = 90
) -> Dict[str, Any]:
    resolved = await img_utils.resolve_image_to_buffer(url)
    img_buffer = resolved["data"]
    content_type = resolved["contentType"]

    def edit_sync():
        nonlocal img_buffer, content_type
        if rotate and rotate != 0:
            img = Image.open(io.BytesIO(img_buffer))
            img = img.rotate(rotate, expand=True)
            out = io.BytesIO()
            img.save(out, format=img.format or 'JPEG')
            img_buffer = out.getvalue()

        if flipHorizontal:
            img = Image.open(io.BytesIO(img_buffer))
            img = img.transpose(Image.FLIP_LEFT_RIGHT)
            out = io.BytesIO()
            img.save(out, format=img.format or 'JPEG')
            img_buffer = out.getvalue()

        if cropTop > 0 or cropBottom > 0 or cropLeft > 0 or cropRight > 0:
            img = Image.open(io.BytesIO(img_buffer))
            w, h = img.size

            top_px = int(round((cropTop / 100) * h))
            bot_px = int(round((cropBottom / 100) * h))
            left_px = int(round((cropLeft / 100) * w))
            right_px = int(round((cropRight / 100) * w))

            crop_w = w - left_px - right_px
            crop_h = h - top_px - bot_px
            if crop_w > 10 and crop_h > 10:
                img_cropped = img.crop((left_px, top_px, left_px + crop_w, top_px + crop_h))
                out = io.BytesIO()
                img_cropped.save(out, format=img.format or 'JPEG')
                img_buffer = out.getvalue()

        if autoTrim:
            trimmed = img_utils.crop_auto_borders(
                img_buffer,
                tighter=True,
                crop_padding=padding,
                sensitivity=sensitivity,
                background_color_mode=backgroundColorMode,
                aspect_ratio=aspectRatio,
                output_format=outputFormat,
                crop_quality=cropQuality
            )
            img_buffer = trimmed["data"]
            content_type = trimmed["content_type"]
        return img_buffer, content_type

    img_buffer, content_type = await asyncio.to_thread(edit_sync)

    filename = f"edited_{uuid.uuid4().hex[:8]}.jpeg" if "jpeg" in content_type or "jpg" in content_type else f"edited_{uuid.uuid4().hex[:8]}.png"
    supabase_url = await asyncio.to_thread(
        upload_to_supabase_bucket,
        img_buffer,
        "panels",
        filename,
        content_type
    )

    unique_id = f"merged_{int(time.time() * 1000)}_edited"
    new_url = supabase_url if supabase_url else f"/api/image/cached/{unique_id}"

    stitched_cache.set(unique_id, {"data": img_buffer, "content_type": content_type})
    edit_history.set(new_url, url)
    try:
        from database import db
        db.save_edit_history(new_url, url)
    except Exception:
        pass

    return {"success": True, "url": new_url}


async def transform_image_service(url: str, trans_type: str, value: str) -> Dict[str, Any]:
    resolved = await img_utils.resolve_image_to_buffer(url)
    img = Image.open(io.BytesIO(resolved["data"]))

    if trans_type == "rotate":
        degrees = int(value)
        if degrees not in (90, -90, 180):
            raise ValueError("Invalid rotation angle. Use 90, -90, or 180.")
        img = img.rotate(degrees, expand=True)
    elif trans_type == "flip":
        if value == "h":
            img = img.transpose(Image.FLIP_LEFT_RIGHT)
        elif value == "v":
            img = img.transpose(Image.FLIP_TOP_BOTTOM)
        else:
            raise ValueError("Invalid flip axis. Use 'h' or 'v'.")

    out = io.BytesIO()
    img.save(out, format="JPEG", quality=92)
    out_bytes = out.getvalue()

    filename = f"transform_{uuid.uuid4().hex[:8]}.jpeg"
    supabase_url = await asyncio.to_thread(
        upload_to_supabase_bucket,
        out_bytes,
        "panels",
        filename,
        "image/jpeg"
    )

    unique_id = f"transform_{int(time.time() * 1000)}"
    proxy_url = supabase_url if supabase_url else f"/api/image/cached/{unique_id}"

    stitched_cache.set(unique_id, {"data": out_bytes, "content_type": "image/jpeg"})
    edit_history.set(proxy_url, url)
    try:
        from database import db
        db.save_edit_history(proxy_url, url)
    except Exception:
        pass

    return {"success": True, "url": proxy_url}


async def merge_images_service(
    urls: List[str],
    layout: Literal["vertical", "horizontal"] = "vertical",
    spacing: int = 0,
    spacingColor: str = "white",
    scaleToFit: bool = True,
    alignMode: Literal["center", "start", "end"] = "center",
    padding: int = 0
) -> Dict[str, Any]:
    resolved = [await img_utils.resolve_image_to_buffer(u) for u in urls]

    merged_bytes = await asyncio.to_thread(
        img_utils.stitch_images_together,
        image_buffers=[r["data"] for r in resolved],
        layout=layout,
        spacing=spacing,
        spacing_color=spacingColor,
        scale_to_fit=scaleToFit,
        align_mode=alignMode,
        padding=padding
    )

    filename = f"merged_{uuid.uuid4().hex[:8]}.png"
    supabase_url = await asyncio.to_thread(
        upload_to_supabase_bucket,
        merged_bytes,
        "panels",
        filename,
        "image/png"
    )

    unique_id = f"merged_{int(time.time() * 1000)}_merged"
    new_url = supabase_url if supabase_url else f"/api/image/cached/{unique_id}"

    stitched_cache.set(unique_id, {"data": merged_bytes, "content_type": "image/png"})
    edit_history.set(new_url, urls[0])
    try:
        from database import db
        db.save_edit_history(new_url, urls[0])
    except Exception:
        pass

    return {"success": True, "url": new_url}


async def execute_splits_service(url: str, splitLines: List[float]) -> Dict[str, Any]:
    resolved = await img_utils.resolve_image_to_buffer(url)
    image_buffer = resolved["data"]

    def split_sync():
        img = Image.open(io.BytesIO(image_buffer))
        w, h = img.size

        y_coords = sorted([int(round((pct / 100.0) * h)) for pct in splitLines])
        if 0 not in y_coords:
            y_coords.insert(0, 0)
        if h not in y_coords:
            y_coords.append(h)

        res_urls = []
        for i in range(len(y_coords) - 1):
            y_top = y_coords[i]
            y_bottom = y_coords[i+1]
            if (y_bottom - y_top) <= 5:
                continue

            seg = img.crop((0, y_top, w, y_bottom))
            out = io.BytesIO()
            seg.save(out, format="JPEG", quality=92)
            seg_bytes = out.getvalue()

            try:
                trimmed = img_utils.crop_auto_borders(
                    seg_bytes,
                    tighter=True,
                    crop_padding=0,
                    sensitivity=30.0,
                    background_color_mode='auto',
                    aspect_ratio='free',
                    output_format='jpeg',
                    crop_quality=90
                )
                seg_bytes = trimmed["data"]
            except Exception:
                pass

            filename = f"split_{uuid.uuid4().hex[:8]}_{i}.jpeg"
            supabase_url = upload_to_supabase_bucket(
                seg_bytes,
                "panels",
                filename,
                "image/jpeg"
            )

            cache_id = f"split_{int(time.time() * 1000)}_{i}"
            new_url = supabase_url if supabase_url else f"/api/image/cached/{cache_id}"

            stitched_cache.set(cache_id, {"data": seg_bytes, "content_type": "image/jpeg"})
            edit_history.set(new_url, url)
            try:
                from database import db
                db.save_edit_history(new_url, url)
            except Exception:
                pass
            res_urls.append(new_url)
        return res_urls

    urls = await asyncio.to_thread(split_sync)
    return {"success": True, "urls": urls}


async def download_zip_service(urls: List[str], referer_url: Optional[str] = None) -> Dict[str, Any]:
    resolved_buffers = []
    for u in urls:
        try:
            resolved = await img_utils.resolve_image_to_buffer(u)
            resolved_buffers.append(resolved)
        except Exception as ex:
            logger.warning(f"[ZIP Service] Failed to resolve URL: {u} | {ex}")

    def generate_zip_sync():
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for idx, resolved in enumerate(resolved_buffers):
                ext = "jpg"
                ct = resolved.get("content_type") or resolved.get("contentType") or ""
                if "png" in ct:
                    ext = "png"
                elif "webp" in ct:
                    ext = "webp"
                elif "gif" in ct:
                    ext = "gif"

                filename = f"panel_{idx + 1:03d}.{ext}"
                zip_file.writestr(filename, resolved["data"])
        return zip_buffer.getvalue()

    zip_bytes = await asyncio.to_thread(generate_zip_sync)

    zip_filename = "comic_panels_archive.zip"
    if referer_url:
        try:
            import re
            from utils.url_utils import parse_webtoon_url
            parsed = parse_webtoon_url(referer_url)

            def make_safe_filename(name: str) -> str:
                cleaned = re.sub(r'[^\w\s-]', '', name)
                cleaned = re.sub(r'[-\s]+', '_', cleaned)
                return cleaned.strip('_')

            source = make_safe_filename(parsed.get("source_name", "Source"))
            title = make_safe_filename(parsed.get("title", "Manhwa"))
            episode = make_safe_filename(parsed.get("episode", "Chapter"))

            if source or title or episode:
                parts = []
                if source and source.lower() != "custom_source" and source.lower() != "custom":
                    parts.append(source)
                if title and title.lower() != "custom_storyboard" and title.lower() != "comic":
                    parts.append(title)
                if episode and episode.lower() != "dynamic_chapter":
                    parts.append(episode)

                if parts:
                    zip_filename = "_".join(parts) + ".zip"
        except Exception as e:
            logger.warning(f"[ZIP Service] Failed to construct safe filename from URL: {e}")

    zip_id = f"zip_{int(time.time() * 1000)}"
    zip_cache.set(zip_id, {"data": zip_bytes, "filename": zip_filename})

    return {"success": True, "downloadUrl": f"/api/image/download-zip/get/{zip_id}", "filename": zip_filename}


async def extract_panel_layers_service(panel_id: str, url: str) -> Dict[str, Any]:
    resolved = await img_utils.resolve_image_to_buffer(url)
    tmp_in_path = None

    try:
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_in:
            tmp_in.write(resolved["data"])
            tmp_in_path = tmp_in.name

        detected_panels = run_cv_detection(
            image_path=tmp_in_path,
            sensitivity=30.0,
            bg_mode="auto",
            min_width_pct=0.15,
            min_height_px=60,
            merge_threshold=20,
            aspect_ratio_str="free",
            auto_split=True
        )

        img = Image.open(tmp_in_path)
        w, h = img.size

        if not detected_panels:
            try:
                layers = await process_layers(tmp_in_path, panel_id)
                warnings = []
            except Exception as ex:
                logger.error(f"[Layers Service] Sliceless processing failed: {ex}", exc_info=True)
                from media.image.layer_segmentation import create_blank_webp
                layers = {
                    "background_url": url,
                    "character_url": f"data:image/webp;base64,{base64.b64encode(create_blank_webp(100, 100)).decode('utf-8')}",
                    "text_url": f"data:image/webp;base64,{base64.b64encode(create_blank_webp(100, 100)).decode('utf-8')}",
                }
                warnings = [f"Full-page fallback: AI Separation failed: {str(ex)}"]

            return {
                "success": True,
                "panel_id": panel_id,
                "layers": layers,
                "panels": [{
                    "panel_index": 0,
                    "box": {
                        "cropTop": 0.0,
                        "cropBottom": 0.0,
                        "cropLeft": 0.0,
                        "cropRight": 0.0,
                        "width": w,
                        "height": h,
                        "area": w * h
                    },
                    "layers": layers
                }],
                "warnings": warnings
            }

        panel_semaphore = asyncio.Semaphore(3)

        async def process_one_panel(idx: int, box: dict):
            async with panel_semaphore:
                top_px = int(round((box["cropTop"] / 100) * h))
                bot_px = int(round((box["cropBottom"] / 100) * h))
                left_px = int(round((box["cropLeft"] / 100) * w))
                right_px = int(round((box["cropRight"] / 100) * w))

                crop_w = w - left_px - right_px
                crop_h = h - top_px - bot_px

                if left_px < 0 or top_px < 0 or crop_w <= 0 or crop_h <= 0 or (left_px + crop_w) > w or (top_px + crop_h) > h:
                    return None

                if crop_w <= 10 or crop_h <= 10:
                    return None

                img_cropped = img.crop((left_px, top_px, left_px + crop_w, top_px + crop_h))
                tmp_panel_path = None
                try:
                    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_panel:
                        img_cropped.save(tmp_panel, format="PNG")
                        tmp_panel_path = tmp_panel.name

                    panel_layers = await process_layers(tmp_panel_path, f"{panel_id}_{idx}")
                    return {
                        "panel_index": idx,
                        "box": box,
                        "layers": panel_layers
                    }
                except Exception as panel_err:
                    logger.error(f"[Layers Service] Panel {idx} failed: {panel_err}", exc_info=True)
                    from media.image.layer_segmentation import create_blank_webp
                    fallback_bg_url = box.get("url") or url
                    fallback_layers = {
                        "background_url": fallback_bg_url,
                        "character_url": f"data:image/webp;base64,{base64.b64encode(create_blank_webp(100, 100)).decode('utf-8')}",
                        "text_url": f"data:image/webp;base64,{base64.b64encode(create_blank_webp(100, 100)).decode('utf-8')}",
                    }
                    return {
                        "panel_index": idx,
                        "box": box,
                        "layers": fallback_layers,
                        "warning": f"Panel #{idx + 1} fallback: AI Separation failed: {str(panel_err)}"
                    }
                finally:
                    if tmp_panel_path and os.path.exists(tmp_panel_path):
                        try:
                            os.remove(tmp_panel_path)
                        except OSError:
                            pass

        panel_tasks = [process_one_panel(idx, box) for idx, box in enumerate(detected_panels)]
        panel_results = await asyncio.gather(*panel_tasks)

        results = sorted([r for r in panel_results if r is not None], key=lambda r: r["panel_index"])
        first_layers = results[0]["layers"] if results else None
        warnings = [r.get("warning") for r in results if r and r.get("warning")]

        import gc
        gc.collect()
        try:
            import torch
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
        except ImportError:
            pass

        try:
            from services.training_monitor import check_and_trigger_training
            await asyncio.to_thread(check_and_trigger_training)
        except Exception:
            pass

        return {
            "success": True,
            "panel_id": panel_id,
            "layers": first_layers,
            "panels": results,
            "warnings": warnings
        }
    finally:
        if tmp_in_path and os.path.exists(tmp_in_path):
            try:
                os.remove(tmp_in_path)
            except OSError:
                pass


async def debug_yolo_detections_service(url: str, conf: float = 0.25) -> bytes:
    resolved = await img_utils.resolve_image_to_buffer(url)
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_f:
            tmp_f.write(resolved["data"])
            tmp_path = tmp_f.name

        from media.image.debug_visualizer import draw_yolo_detections
        annotated_bytes = await asyncio.to_thread(draw_yolo_detections, tmp_path, conf)
        if annotated_bytes is None:
            raise ValueError("YOLO model is not available.")
        return annotated_bytes
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass


async def bubble_cleaning_service(
    url: str,
    method: str,
    sensitivity: float,
    dilation: int,
    inpaint_radius: int,
    detection_style: str
) -> Dict[str, Any]:
    resolved = await img_utils.resolve_image_to_buffer(url)
    content_type = resolved["contentType"]

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_in:
        tmp_in.write(resolved["data"])
        tmp_in_path = tmp_in.name

    tmp_out_path = tmp_in_path.replace(".png", "_out.png")

    try:
        await asyncio.to_thread(
            remove_speech_bubbles,
            image_path=tmp_in_path,
            output_path=tmp_out_path,
            method=method,
            sensitivity=sensitivity,
            dilation=dilation,
            inpaint_radius=inpaint_radius,
            detection_style=detection_style
        )

        with open(tmp_out_path, "rb") as f:
            cleaned_bytes = f.read()

        filename = f"cleaned_{uuid.uuid4().hex[:8]}.png"
        supabase_url = await asyncio.to_thread(
            upload_to_supabase_bucket,
            cleaned_bytes,
            "panels",
            filename,
            content_type
        )

        cache_id = f"merged_{int(time.time() * 1000)}_cleaned"
        new_url = supabase_url if supabase_url else f"/api/image/cached/{cache_id}"

        stitched_cache.set(cache_id, {"data": cleaned_bytes, "content_type": content_type})
        edit_history.set(new_url, url)
        try:
            from database import db
            db.save_edit_history(new_url, url)
        except Exception:
            pass

        return {"success": True, "url": new_url}
    finally:
        for p in (tmp_in_path, tmp_out_path):
            try:
                if os.path.exists(p):
                    os.remove(p)
            except OSError:
                pass


async def bubble_cleaning_batch_service(
    urls: List[str],
    method: str,
    sensitivity: float,
    dilation: int,
    inpaint_radius: int,
    detection_style: str
) -> Dict[str, Any]:
    results = []
    semaphore = asyncio.Semaphore(4)

    async def process_one(u: str):
        async with semaphore:
            try:
                resolved = await img_utils.resolve_image_to_buffer(u)
                content_type = resolved["contentType"]

                with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_in:
                    tmp_in.write(resolved["data"])
                    tmp_in_path = tmp_in.name

                tmp_out_path = tmp_in_path.replace(".png", "_out.png")

                try:
                    await asyncio.to_thread(
                        remove_speech_bubbles,
                        image_path=tmp_in_path,
                        output_path=tmp_out_path,
                        method=method,
                        sensitivity=sensitivity,
                        dilation=dilation,
                        inpaint_radius=inpaint_radius,
                        detection_style=detection_style
                    )

                    with open(tmp_out_path, "rb") as f:
                        cleaned_bytes = f.read()

                    filename = f"cleaned_{uuid.uuid4().hex[:8]}.png"
                    supabase_url = await asyncio.to_thread(
                        upload_to_supabase_bucket,
                        cleaned_bytes,
                        "panels",
                        filename,
                        content_type
                    )

                    cache_id = f"merged_{int(time.time() * 1000)}_cleaned_{hash(u) % 10000}"
                    new_url = supabase_url if supabase_url else f"/api/image/cached/{cache_id}"

                    stitched_cache.set(cache_id, {"data": cleaned_bytes, "content_type": content_type})
                    edit_history.set(new_url, u)
                    try:
                        from database import db
                        db.save_edit_history(new_url, u)
                    except Exception:
                        pass

                    results.append({"url": u, "new_url": new_url, "success": True})
                finally:
                    for p in (tmp_in_path, tmp_out_path):
                        try:
                            if os.path.exists(p):
                                os.remove(p)
                        except OSError:
                            pass
            except Exception as e:
                results.append({"url": u, "success": False, "error": str(e)})

    tasks = [process_one(url) for url in urls]
    await asyncio.gather(*tasks)
    return {"success": True, "results": results}


async def upload_image_service(file_bytes: bytes, filename: Optional[str], content_type: str) -> Dict[str, Any]:
    if content_type == "application/octet-stream" and filename:
        guessed_type, _ = mimetypes.guess_type(filename)
        if guessed_type:
            content_type = guessed_type

    ext = "png"
    if "jpeg" in content_type or "jpg" in content_type:
        ext = "jpeg"
    elif "webp" in content_type:
        ext = "webp"
    elif "gif" in content_type:
        ext = "gif"

    uploaded_filename = f"upload_{uuid.uuid4().hex[:8]}.{ext}"

    supabase_url = await asyncio.to_thread(
        upload_to_supabase_bucket,
        file_bytes,
        "panels",
        uploaded_filename,
        content_type
    )

    if supabase_url:
        new_url = supabase_url
    else:
        cache_id = f"upload_{int(time.time() * 1000)}"
        stitched_cache.set(cache_id, {"data": file_bytes, "content_type": content_type})
        new_url = f"/api/image/cached/{cache_id}"

    return {"success": True, "url": new_url}


async def resize_image_service(
    image_path: str,
    output_path: Optional[str],
    width: Optional[int],
    height: Optional[int],
    mode: ResizeMode,
    filter_type: FilterType,
    quality: int
) -> str:
    engine = _ensure_imagemagick()
    out = output_path or os.path.join(tempfile.gettempdir(), f"imagemagick_{os.urandom(4).hex()}.png")
    result = await engine.resize(image_path, out, width=width, height=height, mode=mode, filter_type=filter_type, quality=quality)
    return result


async def rotate_image_service(image_path: str, output_path: Optional[str], angle: float, background_color: str) -> str:
    engine = _ensure_imagemagick()
    out = output_path or os.path.join(tempfile.gettempdir(), f"imagemagick_{os.urandom(4).hex()}.png")
    result = await engine.rotate(image_path, out, angle=angle, background_color=background_color)
    return result


async def apply_image_enhancements_service(
    image_path: str,
    output_path: Optional[str],
    brightness: float,
    contrast: float,
    saturation: float
) -> str:
    engine = _ensure_imagemagick()
    out = output_path or os.path.join(tempfile.gettempdir(), f"imagemagick_{os.urandom(4).hex()}.png")
    result = await engine.auto_enhance(image_path, out, brightness=brightness, contrast=contrast, saturation=saturation)
    return result


async def remove_background_service(image_path: str, output_path: Optional[str], fuzz_threshold: int) -> str:
    engine = _ensure_imagemagick()
    out = output_path or os.path.join(tempfile.gettempdir(), f"imagemagick_{os.urandom(4).hex()}.png")
    result = await engine.remove_background(image_path, out, fuzz_threshold=fuzz_threshold)
    return result


async def add_text_service(
    image_path: str,
    output_path: Optional[str],
    text: str,
    font_size: int,
    text_color: str,
    position: str,
    opacity: float
) -> str:
    engine = _ensure_imagemagick()
    out = output_path or os.path.join(tempfile.gettempdir(), f"imagemagick_{os.urandom(4).hex()}.png")
    result = await engine.add_text_overlay(
        image_path,
        out,
        text=text,
        font_size=font_size,
        text_color=text_color,
        position=position,
        opacity=opacity
    )
    return result


async def batch_resize_service(
    image_paths: List[str],
    output_dir: Optional[str],
    width: Optional[int],
    height: Optional[int],
    mode: ResizeMode,
    quality: int
) -> List[str]:
    engine = _ensure_imagemagick()
    out = output_dir or os.path.join(tempfile.gettempdir(), "imagemagick_batch")
    results = await engine.batch_resize(image_paths, out, width=width, height=height, mode=mode, quality=quality)
    return results


async def composite_images_service(
    base_image_path: str,
    overlay_image_path: str,
    output_path: Optional[str],
    x: int,
    y: int,
    opacity: float
) -> str:
    engine = _ensure_imagemagick()
    out = output_path or os.path.join(tempfile.gettempdir(), f"imagemagick_{os.urandom(4).hex()}.png")
    result = await engine.composite_images(
        base_image_path,
        overlay_image_path,
        out,
        x=x,
        y=y,
        opacity=opacity
    )
    return result
