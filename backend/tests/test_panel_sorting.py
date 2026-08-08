import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app")))

from services.image.panel_detection.panel_detector import _sort_panels_reading_order


def test_sort_panels_reading_order_ltr_staggered():
    """
    Tests that side-by-side staggered panels (e.g. y=1005 left, y=1000 right)
    are grouped into the same visual row and ordered left-to-right (LTR).
    """
    panels = [
        {"id": "p2", "x": 450, "y": 1000, "width": 300, "height": 400},
        {"id": "p1", "x": 50,  "y": 1005, "width": 300, "height": 400},
        {"id": "p3", "x": 50,  "y": 1500, "width": 700, "height": 400},
    ]

    sorted_panels = _sort_panels_reading_order(panels, reading_order="ltr")
    sorted_ids = [p["id"] for p in sorted_panels]

    assert sorted_ids == ["p1", "p2", "p3"], f"Expected ['p1', 'p2', 'p3'], got {sorted_ids}"


def test_sort_panels_reading_order_rtl_staggered():
    """
    Tests that side-by-side staggered panels in Manga mode (RTL)
    are ordered right-to-left (RTL) within each visual row.
    """
    panels = [
        {"id": "p1", "x": 50,  "y": 1005, "width": 300, "height": 400},
        {"id": "p2", "x": 450, "y": 1000, "width": 300, "height": 400},
        {"id": "p3", "x": 50,  "y": 1500, "width": 700, "height": 400},
    ]

    sorted_panels = _sort_panels_reading_order(panels, reading_order="rtl")
    sorted_ids = [p["id"] for p in sorted_panels]

    assert sorted_ids == ["p2", "p1", "p3"], f"Expected ['p2', 'p1', 'p3'], got {sorted_ids}"
