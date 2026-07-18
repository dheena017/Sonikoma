import sys
import os
import io
from PIL import Image

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app')))

# pyrefly: ignore [missing-import]
from app.services.image.image_stitcher import stitch_images_together

def create_test_image(color, size=(100, 100)):
    img = Image.new('RGB', size, color)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return buf.getvalue()

def test_stitching():
    img1 = create_test_image('red')
    img2 = create_test_image('blue')

    stitched = stitch_images_together([img1, img2], layout='vertical', spacing=0)

    res_img = Image.open(io.BytesIO(stitched))
    w, h = res_img.size

    print(f"Stitched image size: {w}x{h}")
    assert w == 100
    assert h == 200
    print("Vertical stitching test passed!")

    stitched_h = stitch_images_together([img1, img2], layout='horizontal', spacing=10)
    res_img_h = Image.open(io.BytesIO(stitched_h))
    w_h, h_h = res_img_h.size
    print(f"Stitched horizontal image size: {w_h}x{h_h}")
    assert w_h == 210
    assert h_h == 100
    print("Horizontal stitching test passed!")

if __name__ == "__main__":
    try:
        test_stitching()
    except Exception as e:
        print(f"Test failed: {e}")
        sys.exit(1)
