"""
backend/features/image_editor/services/detector/detect_batch_service.py
─────────────────────────────────────────────────────────────────────────────
Orchestrator Service for Batch Image URL Panel Detection:
- Runs concurrent asynchronous processing across an array of URLs with semaphore throttling
- Layout classification and dynamic routing (tall strip vs small page)
- Guard clauses, timing metrics, and defensive error containment
- Comprehensive multi-tier logging: DEBUG, INFO, WARNING, and ERROR
- Aggregates concurrent results into standardized DetectPanelsBatchResponse
─────────────────────────────────────────────────────────────────────────────
"""

import time
import asyncio
import logging
from typing import Dict, Any, List, Optional

from features.platform.projects.schemas_project import (
    DetectPanelsBatchRequest,
    DetectPanelsBatchResponse,
    DetectSmallPanelsRequest,
    DetectLongPanelsRequest,
)

# Relative imports with fallback to absolute imports for cross-module compatibility
try:
    from .detect_type_service import detect_image_layout_type
    from .detect_small_panels_service import detect_small_panels
    from .detect_long_panels_service import detect_long_panels
except ImportError:
    from features.image.detector.detect_type_service import detect_image_layout_type
    from features.image.detector.detect_small_panels_service import detect_small_panels
    from features.image.detector.detect_long_panels_service import detect_long_panels

logger = logging.getLogger("sonikoma.services.image.detector.batch")

__all__ = [
    "detect_batch_panels",
    "process_single_url",
    "DEFAULT_MAX_CONCURRENCY",
    "SLOW_PROCESSING_THRESHOLD_MS",
]

DEFAULT_MAX_CONCURRENCY: int = 5
SLOW_PROCESSING_THRESHOLD_MS: int = 5000


# ─────────────────────────────────────────────────────────────────────────────
# 1. Single URL Unit Worker
# ─────────────────────────────────────────────────────────────────────────────

async def process_single_url(
    url: str,
    options: DetectPanelsBatchRequest,
    semaphore: Optional[asyncio.Semaphore] = None,
    index: Optional[int] = None,
    total: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Processes a single image URL within a batch panel detection run.

    Performs:
    1. Input validation & URL sanity checking
    2. Computer vision layout classification (detect_image_layout_type)
    3. Algorithmic dispatching (detect_long_panels vs detect_small_panels)
    4. Execution timing, panel extraction, and comprehensive log telemetry

    Args:
        url (str): Target image URL.
        options (DetectPanelsBatchRequest): Batch options (sensitivity, auto_split, aspect_ratio, etc.).
        semaphore (Optional[asyncio.Semaphore]): Concurrency throttle.
        index (Optional[int]): 1-based index of this item in the batch (for logging).
        total (Optional[int]): Total items in the batch (for logging).

    Returns:
        Dict[str, Any]: Standardized result dictionary containing:
            - url: Target URL
            - success: True if processing succeeded, False otherwise
            - crop_type: Detected crop type ("long_panels", "small_panels", or "unknown")
            - panels: List of detected panel bounding boxes
            - panels_count: Number of panels found
            - speech_bubbles_count: Number of dialogue balloons found
            - execution_time_ms: Worker duration in milliseconds
            - error: Error description if failed, else None
            - data: Raw response dictionary from the underlying detector
    """
    item_tag = f"[{index}/{total}]" if index is not None and total is not None else f"['{url[:40]}...']"
    start_time = time.perf_counter()

    # ── Stage 1: Guard Clauses & Input Validation ─────────────────────────────
    if not url or not isinstance(url, str) or not url.strip():
        logger.warning(
            f"[Batch Worker {item_tag}] Skipped processing: URL is empty, blank, or invalid type."
        )
        return {
            "url": str(url) if url is not None else "",
            "success": False,
            "crop_type": "unknown",
            "panels": [],
            "panels_count": 0,
            "speech_bubbles_count": 0,
            "execution_time_ms": 0,
            "error": "URL is empty or invalid.",
            "data": None,
        }

    clean_url = url.strip()
    valid_prefixes = ("http://", "https://", "data:image/", "file://", "gs://")
    if not any(clean_url.startswith(prefix) for prefix in valid_prefixes):
        logger.warning(
            f"[Batch Worker {item_tag}] URL '{clean_url[:60]}' does not begin with a standard protocol "
            f"(http://, https://, data:image/, file://, gs://). May fail during image resolution."
        )

    logger.debug(
        f"[Batch Worker {item_tag}] Acquired task for URL: '{clean_url[:80]}' | "
        f"sensitivity={getattr(options, 'sensitivity', 30.0)}, "
        f"background_mode={getattr(options, 'background_mode', 'auto')}, "
        f"aspect_ratio={getattr(options, 'aspect_ratio', 'free')}, "
        f"auto_split={getattr(options, 'auto_split', True)}"
    )

    # ── Stage 2: Concurrency Throttling & Pipeline Execution ──────────────────
    async def _execute() -> Dict[str, Any]:
        try:
            logger.debug(f"[Batch Worker {item_tag}] Invoking layout classification on '{clean_url[:60]}'...")
            type_res = await detect_image_layout_type(url=clean_url)

            crop_type_attr = getattr(type_res, "crop_type", None)
            crop_type_str = str(
                crop_type_attr.value if hasattr(crop_type_attr, "value") else crop_type_attr
            ).lower() if crop_type_attr is not None else "unknown"

            aspect_ratio = float(getattr(type_res, "aspect_ratio", 0.0) or 0.0)
            is_tall = (
                crop_type_str in ("long_panels", "ultra_long_panels", "four_koma")
                or aspect_ratio >= 2.0
            )

            logger.debug(
                f"[Batch Worker {item_tag}] Layout classified for '{clean_url[:60]}': "
                f"crop_type='{crop_type_str}', aspect_ratio={aspect_ratio:.2f}, is_tall={is_tall}"
            )

            # ── Stage 3: Algorithmic Dispatching ──────────────────────────────
            if is_tall:
                logger.debug(
                    f"[Batch Worker {item_tag}] Dispatching to tall strip engine (detect_long_panels)..."
                )
                req_long = DetectLongPanelsRequest(
                    url=clean_url,
                    sensitivity=getattr(options, "sensitivity", 30.0),
                    background_mode=getattr(options, "background_mode", "auto"),
                    auto_split=getattr(options, "auto_split", True),
                )
                res = await detect_long_panels(req_long)
                crop_type = "long_panels"
            else:
                logger.debug(
                    f"[Batch Worker {item_tag}] Dispatching to small page engine (detect_small_panels)..."
                )
                req_small = DetectSmallPanelsRequest(
                    url=clean_url,
                    aspect_ratio=getattr(options, "aspect_ratio", "free"),
                    auto_trim=True,
                    snap_to_frame=True,
                )
                res = await detect_small_panels(req_small)
                crop_type = "small_panels"

            # ── Stage 4: Result Parsing & Metrics ─────────────────────────────
            res_dict = (
                res.model_dump()
                if hasattr(res, "model_dump")
                else (res.dict() if hasattr(res, "dict") else dict(res))
            )
            panels = res_dict.get("panels", [])
            panels_count = len(panels)
            speech_bubbles_count = res_dict.get(
                "total_speech_bubbles_count",
                len(res_dict.get("speech_bubbles", []))
            )
            elapsed_ms = int((time.perf_counter() - start_time) * 1000)

            # Warning log: zero panels detected
            if panels_count == 0:
                logger.warning(
                    f"[Batch Worker {item_tag}] Detection completed for '{clean_url[:60]}' "
                    f"but 0 panels were detected (crop_type='{crop_type}')."
                )

            # Warning log: slow processing
            if elapsed_ms > SLOW_PROCESSING_THRESHOLD_MS:
                logger.warning(
                    f"[Batch Worker {item_tag}] Slow processing detected for '{clean_url[:60]}': "
                    f"took {elapsed_ms}ms (threshold: {SLOW_PROCESSING_THRESHOLD_MS}ms)."
                )

            logger.info(
                f"[Batch Worker {item_tag}] Succeeded for '{clean_url[:60]}': "
                f"found {panels_count} panels, {speech_bubbles_count} bubbles ({crop_type}) in {elapsed_ms}ms"
            )

            logger.debug(
                f"[Batch Worker {item_tag}] Detailed payload: {res_dict.get('message', 'OK')} | "
                f"reading_flow={res_dict.get('reading_flow', 'standard')}"
            )

            return {
                "url": clean_url,
                "success": True,
                "crop_type": crop_type,
                "panels": panels,
                "panels_count": panels_count,
                "speech_bubbles_count": speech_bubbles_count,
                "execution_time_ms": elapsed_ms,
                "error": None,
                "data": res_dict,
            }

        except Exception as e:
            elapsed_ms = int((time.perf_counter() - start_time) * 1000)
            logger.warning(
                f"[Batch Worker {item_tag}] Processing failed for URL '{clean_url[:60]}' "
                f"after {elapsed_ms}ms: {e}. Remaining batch items will continue.",
                exc_info=True,
            )
            return {
                "url": clean_url,
                "success": False,
                "crop_type": "unknown",
                "panels": [],
                "panels_count": 0,
                "speech_bubbles_count": 0,
                "execution_time_ms": elapsed_ms,
                "error": str(e),
                "data": None,
            }

    if semaphore is not None:
        async with semaphore:
            return await _execute()
    else:
        return await _execute()


# ─────────────────────────────────────────────────────────────────────────────
# 2. Concurrent Batch Orchestration Engine
# ─────────────────────────────────────────────────────────────────────────────

async def detect_batch_panels(
    request: DetectPanelsBatchRequest,
    max_concurrency: int = DEFAULT_MAX_CONCURRENCY,
) -> DetectPanelsBatchResponse:
    """
    Processes multiple image URLs concurrently using asyncio gathering with concurrency throttling.

    Features:
    - Bounded worker execution via asyncio.Semaphore to prevent OOM / thread starvation
    - Guard clause against empty URL lists
    - Duplicate URL detection with warning logging
    - Defensive unhandled exception containment via return_exceptions=True
    - Granular DEBUG, INFO, WARNING, and ERROR operational logs
    - Precise performance telemetry per item and overall batch

    Args:
        request (DetectPanelsBatchRequest): Batch request containing image URLs list and options.
        max_concurrency (int, optional): Max parallel worker tasks. Defaults to DEFAULT_MAX_CONCURRENCY (5).

    Returns:
        DetectPanelsBatchResponse: Aggregated results mapped per URL with totals and summary message.

    Raises:
        ValueError: If 'urls' list is empty or request is None.
    """
    start_time = time.perf_counter()

    # ── Stage 1: Timing & Guard Clauses ───────────────────────────────────────
    if not request or not request.urls:
        logger.error("[Batch Detector] Batch request rejected: 'urls' list is empty or None.")
        raise ValueError("Must provide a non-empty list of 'urls' for batch processing.")

    urls = request.urls
    total_images = len(urls)

    # Check for duplicate URLs and issue a warning
    unique_urls = set(urls)
    if len(unique_urls) < total_images:
        duplicate_count = total_images - len(unique_urls)
        logger.warning(
            f"[Batch Detector] Request contains {duplicate_count} duplicate URLs "
            f"({len(unique_urls)} unique out of {total_images} total). "
            f"All entries will be processed."
        )

    logger.info(
        f"[Batch Detector] Initiating batch panel detection for {total_images} images "
        f"(max_concurrency={max_concurrency}, sensitivity={request.sensitivity}, "
        f"background_mode={request.background_mode}, auto_split={request.auto_split})"
    )

    logger.debug(
        f"[Batch Detector] Full batch options: "
        f"sensitivity={request.sensitivity}, "
        f"background_mode='{request.background_mode}', "
        f"aspect_ratio='{request.aspect_ratio}', "
        f"auto_split={request.auto_split}, "
        f"url_sample={[u[:40] for u in urls[:3]]}"
    )

    # ── Stage 2: Concurrent Worker Execution with Semaphore ───────────────────
    semaphore = asyncio.Semaphore(max(1, max_concurrency))
    tasks = [
        process_single_url(
            url=url,
            options=request,
            semaphore=semaphore,
            index=i + 1,
            total=total_images,
        )
        for i, url in enumerate(urls)
    ]

    logger.debug(f"[Batch Detector] Dispatched {len(tasks)} tasks to asyncio event loop.")
    raw_results = await asyncio.gather(*tasks, return_exceptions=True)

    # ── Stage 3: Defensive Containment & Metric Aggregation ───────────────────
    results: List[Dict[str, Any]] = []
    for i, res in enumerate(raw_results):
        if isinstance(res, BaseException):
            target_url = urls[i] if i < len(urls) else "unknown"
            logger.error(
                f"[Batch Detector] Uncaught exception escaped worker for URL '{target_url}': {res}",
                exc_info=res,
            )
            results.append({
                "url": target_url,
                "success": False,
                "crop_type": "unknown",
                "panels": [],
                "panels_count": 0,
                "speech_bubbles_count": 0,
                "execution_time_ms": 0,
                "error": f"Internal worker failure: {str(res)}",
                "data": None,
            })
        else:
            results.append(res)

    elapsed_ms = int((time.perf_counter() - start_time) * 1000)
    success_count = sum(1 for r in results if r.get("success"))
    fail_count = total_images - success_count
    total_panels = sum(r.get("panels_count", 0) for r in results)
    avg_ms = elapsed_ms // max(1, total_images)

    # ── Stage 4: Structured Output & Traceable Logging ────────────────────────
    if fail_count > 0:
        logger.warning(
            f"[Batch Detector] Batch completed with {fail_count}/{total_images} failed images "
            f"in {elapsed_ms}ms ({success_count} succeeded). Inspect individual result errors."
        )

    if success_count == 0:
        logger.warning(
            f"[Batch Detector] All {total_images} images in the batch failed detection."
        )

    logger.info(
        f"[Batch Detector] Concurrently processed {total_images} images "
        f"({success_count}/{total_images} succeeded, {fail_count} failed, "
        f"{total_panels} total panels) in {elapsed_ms}ms (avg {avg_ms}ms/img)"
    )

    logger.debug(
        f"[Batch Detector] Batch summary: success_count={success_count}, fail_count={fail_count}, "
        f"total_panels={total_panels}, duration_ms={elapsed_ms}"
    )

    return DetectPanelsBatchResponse(
        success=(success_count > 0 or total_images == 0),
        total_images=total_images,
        results=results,
        message=(
            f"Batch processed {total_images} images in {elapsed_ms}ms "
            f"({success_count} succeeded, {fail_count} failed, {total_panels} panels detected)."
        ),
    )
