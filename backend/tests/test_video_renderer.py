from PIL import Image
import numpy as np

from services.video.video import build_panel_frame_image


def test_build_panel_frame_image_returns_rgb_uint8_frame():
    background = Image.new("RGB", (1920, 1080), (10, 20, 30))
    foreground = Image.new("RGB", (400, 600), (1, 2, 3))

    frame = build_panel_frame_image(background, foreground, target_width=1920, target_height=1080)

    assert frame.size == (1920, 1080)
    assert frame.mode == "RGB"
    assert np.asarray(frame).dtype == np.uint8
