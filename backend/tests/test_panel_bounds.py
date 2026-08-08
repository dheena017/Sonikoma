import pytest
from services.image.utils.panel_box_utils import PanelBounds


def test_panel_bounds_basic_properties():
    bounds = PanelBounds(x=10, y=20, width=100, height=200, coordinate_space="merged_canvas")
    assert bounds.x2 == 110
    assert bounds.y2 == 220
    assert bounds.area == 20000
    assert bounds.coordinate_space == "merged_canvas"


def test_panel_bounds_is_valid_and_assert_valid():
    img_w, img_h = 1000, 2000
    valid_bounds = PanelBounds(x=100, y=200, width=500, height=800)
    assert valid_bounds.is_valid(img_w, img_h) is True
    valid_bounds.assert_valid(img_w, img_h, "valid test")

    invalid_bounds = PanelBounds(x=900, y=200, width=300, height=800)
    assert invalid_bounds.is_valid(img_w, img_h) is False
    with pytest.raises(ValueError, match="exceeds image bounds"):
        invalid_bounds.assert_valid(img_w, img_h, "invalid test")


def test_panel_bounds_clamping():
    img_w, img_h = 1000, 2000
    out_of_bounds = PanelBounds(x=-50, y=1950, width=1200, height=500)
    clamped = out_of_bounds.clamp(img_w, img_h)
    assert clamped.x == 0
    assert clamped.y == 1950
    assert clamped.width <= img_w
    assert clamped.y2 <= img_h
    assert clamped.is_valid(img_w, img_h) is True


def test_panel_bounds_inset_percentages_roundtrip():
    img_w, img_h = 1000, 2000
    original = PanelBounds(x=100, y=200, width=800, height=1600, coordinate_space="merged_canvas")
    
    insets = original.to_inset_percentages(img_w, img_h)
    assert insets["cropTop"] == 10.0      # 200 / 2000 = 10%
    assert insets["cropBottom"] == 10.0   # (2000 - 1800) / 2000 = 10%
    assert insets["cropLeft"] == 10.0     # 100 / 1000 = 10%
    assert insets["cropRight"] == 10.0    # (1000 - 900) / 1000 = 10%

    reconstructed = PanelBounds.from_inset_percent(
        insets["cropTop"], insets["cropBottom"], insets["cropLeft"], insets["cropRight"], img_w, img_h
    )
    assert reconstructed.x == original.x
    assert reconstructed.y == original.y
    assert reconstructed.width == original.width
    assert reconstructed.height == original.height


def test_panel_bounds_absolute_percentages():
    img_w, img_h = 1000, 2000
    # Gemini AI format: top=10%, bottom=90%, left=10%, right=90%
    bounds = PanelBounds.from_absolute_percent(
        top=10.0, bottom=90.0, left=10.0, right=90.0, img_w=img_w, img_h=img_h
    )
    assert bounds.x == 100
    assert bounds.y == 200
    assert bounds.width == 800
    assert bounds.height == 1600


def test_export_multi_stage_debug_images(tmp_path):
    from PIL import Image
    from services.image.panel_detection.debug_visualizer import export_multi_stage_debug_images

    # Create dummy image
    img = Image.new("RGB", (400, 800), color=(255, 255, 255))
    dummy_path = str(tmp_path / "test_merged.png")
    img.save(dummy_path)

    bounds_list = [
        PanelBounds(x=20, y=30, width=360, height=200, coordinate_space="merged_canvas"),
        PanelBounds(x=20, y=250, width=360, height=300, coordinate_space="merged_canvas"),
    ]

    output_dir = str(tmp_path / "debug_output")
    saved = export_multi_stage_debug_images(dummy_path, bounds_list, output_dir=output_dir)

    assert "debug_01_merged" in saved
    assert "debug_02_detected_boxes" in saved
    assert "debug_02b_box_numbers" in saved
    assert "debug_03_final_crops" in saved

