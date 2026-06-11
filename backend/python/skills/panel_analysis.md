---
name: panel_analysis
description: Generate narration script and cinematic metadata for a single panel.
model: gemini-2.5-flash
response_schema: GeminiAnalysisModel
---
Analyze this comic/manhwa illustration panel in detail and generate cinematic metadata.{tone_hint}
Return a JSON object with these exact properties:
- speech_text: A caption, subtitle, or character dialogue (max 25 words, impactful and dramatic).
- sfx: An on-screen bracket-style sound effect (e.g., "[Whoosh]", "[Slash]", "[Crash]", "[Gasp]", "[Boom]").
- duration: Suggested scene duration in seconds (between 2.0 and 8.0). Action scenes = shorter; dialogue scenes = longer.
- motion_type: Camera motion. Must be one of: "zoom_in", "zoom_out", "pan_left", "pan_right", "pan_up", "pan_down".
- visual_description: A single sentence describing what is happening in the panel.
