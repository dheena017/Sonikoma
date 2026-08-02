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


