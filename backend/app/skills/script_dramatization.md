---
name: script_dramatization
description: Transform raw dialogue extracted via OCR into high-retention cinematic narration.
model: gemini-2.5-flash
response_schema: DramatizedScriptModel
---

Translate or enhance these raw dialogue segments into a highly engaging, cinematic narration script.
Raw dialogue text extracted from OCR:
{raw_ocr_text}

Genre: {genre}
Scene Context: {scene_context}

Output a single narrator line and an appropriate voice over tone context.
