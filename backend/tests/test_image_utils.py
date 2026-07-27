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


