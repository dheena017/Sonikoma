---
name: smart_crop
description: Detect bounding box boundaries of panels within a comic strip.
model: gemini-2.5-flash
response_schema: CropList
---

Analyze this comic/webtoon image. Identify the main scene/illustration panels.
For each panel, detect its bounding box boundaries as coordinates (0 to 100) relative to the image edges:

- cropTop: top boundary of the panel (0 is top edge, 100 is bottom)
- cropBottom: bottom boundary of the panel (0 is top edge, 100 is bottom)
- cropLeft: left boundary of the panel (0 is left edge, 100 is right)
- cropRight: right boundary of the panel (0 is left edge, 100 is right)
  Make sure these are absolute coordinates from the top/left of the image, NOT margins.
  Return a JSON object containing a 'panels' array.
