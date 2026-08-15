"""
backend/tests/test_adaptive_reconstruction.py
─────────────────────────────────────────────────────────────────────────────
Tests for Tile Reconstitution and Iframe Inspection.
─────────────────────────────────────────────────────────────────────────────
"""

import io
import pytest
from PIL import Image
from services.scraper.reconstruction.tiles import TileReconstructor
from services.scraper.reconstruction.iframe import IframeInspector
from services.scraper.extraction.dom import DomExtractor


def test_tile_reconstructor_detects_tile_names():
    assert TileReconstructor.is_tile_candidate("https://example.com/page_01-tile1.jpg") is True
    assert TileReconstructor.is_tile_candidate("https://example.com/ch1_slice_2.png") is True
    assert TileReconstructor.is_tile_candidate("https://example.com/panel_001.jpg") is False


def test_tile_reconstructor_stitches_slices():
    # Create 2 simple 100x50 in-memory image buffers
    img1 = Image.new("RGB", (100, 50), (255, 0, 0))
    img2 = Image.new("RGB", (100, 50), (0, 255, 0))

    b1 = io.BytesIO()
    img1.save(b1, format="JPEG")
    b2 = io.BytesIO()
    img2.save(b2, format="JPEG")

    stitched = TileReconstructor.group_and_reconstruct_tiles([b1.getvalue(), b2.getvalue()], layout="vertical")
    assert stitched is not None

    result_img = Image.open(io.BytesIO(stitched))
    assert result_img.width == 100
    assert result_img.height == 100


def test_iframe_inspector_filters_ads():
    sample_html = """
    <html>
      <body>
        <iframe src="https://example.com/reader/embed/chapter1"></iframe>
        <iframe src="https://googleads.doubleclick.net/pagead/ads"></iframe>
        <iframe src="https://facebook.com/plugins/like.php"></iframe>
      </body>
    </html>
    """
    soup = DomExtractor.get_soup(sample_html)
    iframes = IframeInspector.find_reader_iframes(soup, "https://example.com")
    assert len(iframes) == 1
    assert "chapter1" in iframes[0]
