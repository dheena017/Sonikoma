# Comic Vision & Panel Detection Rules (12 AI Guardrails)

Any AI assistant working on comic vision, panel detection, cropping, OCR, or scene graph building in Sonikoma MUST strictly adhere to these 12 rules:

1. **NO Hardcoded Absolute Pixels & Thresholds**:
   - Never use static constants (`min_height = 50`, `w > 210`, fixed Canny values).
   - All thresholds must scale proportionally with image resolution ($W \times H$) and statistical metrics (Otsu binarization, local median, standard deviation).

2. **NO Naive $gap \le 0$ Chain Merging**:
   - Never merge vertically stacked panels simply because their boundaries touch.
   - Only deduplicate if boxes share a true $2D\ \text{IoU} \ge 0.75$ area overlap.

3. **NO Dropping Top-of-Image Gutters ($y=0$)**:
   - Guard against $y=0$ gutter drops so top panels ($y=14$px, $y=150$px) are never skipped.

4. **NO Treating Multi-Column Manga Tiers as Single Blocks**:
   - Always decompose horizontal tiers into side-by-side vertical columns.

5. **NO Discarding Polygon Vertices for Slanted Panels**:
   - Action/slash panels must preserve their multi-vertex `polygon` arrays so character weapons and energy blasts are never cropped.

6. **NO Cross-Tier Speech Bubble Expansion**:
   - Bubble expansion into gutters must be capped at $15\%$ of panel height so it never swallows neighboring panels.

7. **NO Generic Object False Positives as Speech Bubbles**:
   - Validate whiteness ratio ($\ge 50\%$), proportional dimensions, and internal text strokes to prevent faces or shirts from being misidentified.

8. **NO Assuming Gutters Are Always Pure White (`#FFFFFF`)**:
   - Detect median background color per tier/region and use standard deviation ($\sigma \le 6.0$) to support dark/textured gutters.

9. **NO Crashes on Ultra-Long Strips (60,000+ px)**:
   - Always unpack shapes with `h, w = img_array.shape[:2]` and use sliding-window tiling for strips $> 15,000$px.

10. **NO Deleting Inset Panels**:
    - Preserve picture-in-picture frames with `depth = 1` and `parent_panel_id`.

11. **NO Breaking REST API Contracts**:
    - Keep all `/api/v1/images/crop/*` and `/api/crop/*` endpoints active and matching expected response schemas.

12. **NO Full-Width Horizontal Overlay Lines**:
    - Draw visual annotations cleanly bounded to discrete panel rectangles and polygons.

---
*For full architectural blueprints, see `need to impove/DUAL_CORE_SPATIAL_VISION_PLAN.md`.*
