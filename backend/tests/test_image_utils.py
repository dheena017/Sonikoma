import io
import pytest
from PIL import Image
import services.image.utils.image_utils as img_utils

def test_image_utils_exports_stitcher():
    assert hasattr(img_utils, "stitch_images_together")
    assert hasattr(img_utils, "stack_vertical")

def test_img_utils_stitch_images_together():
    # Create two simple dummy images
    img1 = Image.new("RGB", (100, 100), color="red")
    img2 = Image.new("RGB", (100, 100), color="blue")
    
    b1 = io.BytesIO()
    img1.save(b1, format="PNG")
    b2 = io.BytesIO()
    img2.save(b2, format="PNG")
    
    res = img_utils.stitch_images_together([b1.getvalue(), b2.getvalue()], layout="vertical")
    assert res is not None
    assert isinstance(res, bytes)
    
    result_img = Image.open(io.BytesIO(res))
    assert result_img.size[0] == 100
    assert result_img.size[1] == 200

def test_stitch_cache_service_imports():
    from services.image.stitch_cache_service import retrieve_cached_stitch_service
    assert callable(retrieve_cached_stitch_service)

def test_package_level_import():
    import services.image.utils as pkg_utils
    assert hasattr(pkg_utils, "resolve_image_to_buffer")
    assert hasattr(pkg_utils, "stitch_images_together")


def test_panel_crop_cache_records_original_url():
    import io
    from PIL import Image
    from core.cache import edit_history, stitched_cache
    from services.ai.facade import _crop_panels_server_side

    edit_history.clear()
    stitched_cache.clear()

    img = Image.new("RGB", (200, 200), color="white")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")

    panels = [{
        "x": 0,
        "y": 0,
        "width": 100,
        "height": 100,
        "cropTop": 0,
        "cropBottom": 50,
        "cropLeft": 0,
        "cropRight": 50,
    }]

    _crop_panels_server_side(buf.getvalue(), panels, source_url="https://example.com/source.jpg")

    assert panels[0].get("croppedUrl")
    assert edit_history.get(panels[0]["croppedUrl"]) == "https://example.com/source.jpg"


def test_edit_history_persists_string_values_on_warm_up(tmp_path):
    from core.cache import edit_history

    # Clear any existing cache and ensure a clean disk cache directory.
    edit_history.clear()
    edit_history.disk_dir = str(tmp_path / "editHistory")

    # Persist a string-only value and simulate a restart.
    cache_key = "/api/image/cached/panel_crop_123_1"
    original_url = "https://example.com/source.jpg"
    edit_history.set(cache_key, original_url)

    # Build a new CacheStore instance to simulate process restart and warm-up.
    from core.cache import CacheStore
    restarted_cache = CacheStore(name="editHistory", default_ttl_sec=None, max_size=200, persistent=True)
    restarted_cache.disk_dir = edit_history.disk_dir
    loaded = restarted_cache.warm_up()

    assert loaded == 1
    assert restarted_cache.get(cache_key) == original_url


def test_merge_hard_blocker_evaluations():
    from services.image.utils.panel_box_utils import MergeFeatures, eval_merge_candidate_pair

    box_a = {"x": 50, "y": 100, "w": 700, "h": 300}
    box_b = {"x": 50, "y": 410, "w": 700, "h": 300}

    # Test Hard Blocker 1: Separator Present -> Immediate Reject
    f1 = MergeFeatures(y_distance=10.0, width_similarity=1.0, background_similarity=1.0, separator_present=True)
    merged1, reason1, score1 = eval_merge_candidate_pair(box_a, box_b, f1)
    assert merged1 is False
    assert "hard_blocker_separator" in reason1

    # Test Hard Blocker 2: Max Height Exceeded -> Immediate Reject
    f2 = MergeFeatures(y_distance=10.0, width_similarity=1.0, background_similarity=1.0, max_height_exceeded=True)
    merged2, reason2, score2 = eval_merge_candidate_pair(box_a, box_b, f2)
    assert merged2 is False
    assert "hard_blocker_max_height" in reason2

    # Test Hard Blocker 3: OCR Boundary Conflict -> Immediate Reject
    f3 = MergeFeatures(y_distance=10.0, width_similarity=1.0, background_similarity=1.0, ocr_boundary_conflict=True)
    merged3, reason3, score3 = eval_merge_candidate_pair(box_a, box_b, f3)
    assert merged3 is False
    assert "hard_blocker_ocr" in reason3

    # Test Soft Vote Pass (Hard Blockers PASS)
    f4 = MergeFeatures(y_distance=10.0, width_similarity=1.0, background_similarity=1.0)
    merged4, reason4, score4 = eval_merge_candidate_pair(box_a, box_b, f4)
    assert merged4 is True
    assert score4 >= 0.65
    assert "soft_vote_passed" in reason4


def test_merge_separator_blocks_distance_merge():
    from services.image.utils.panel_box_utils import merge_overlapping_boxes

    boxes = [
        {"x": 50, "y": 100, "w": 700, "h": 300},
        {"x": 50, "y": 420, "w": 700, "h": 300},
    ]

    merged = merge_overlapping_boxes(
        boxes,
        800,
        5000,
        merge_threshold=50,
        separator_bands=[410],
        gutter_ranges=[(400, 420)],
    )

    assert len(merged) == 2


def test_merge_height_blocker_applies_before_overlap_shortcuts():
    from services.image.utils.panel_box_utils import merge_overlapping_boxes

    boxes = [
        {"x": 50, "y": 1000, "w": 700, "h": 4000},
        {"x": 55, "y": 1100, "w": 690, "h": 3950},
    ]

    merged = merge_overlapping_boxes(boxes, 800, 10000, merge_threshold=50)

    assert len(merged) == 2


def test_bubble_merge_requires_detected_bubble_marker():
    from services.image.utils.panel_box_utils import merge_overlapping_boxes

    boxes_without_marker = [
        {"x": 200, "y": 100, "w": 300, "h": 120},
        {"x": 200, "y": 245, "w": 300, "h": 400},
    ]
    unmerged = merge_overlapping_boxes(boxes_without_marker, 800, 2000, merge_threshold=0)
    assert len(unmerged) == 2

    boxes_with_marker = [
        {"x": 200, "y": 100, "w": 300, "h": 120, "bubble_candidate": True},
        {"x": 200, "y": 245, "w": 300, "h": 400},
    ]
    merged = merge_overlapping_boxes(boxes_with_marker, 800, 2000, merge_threshold=0)
    assert len(merged) == 1



