---
name: panel_analysis
description: Generate narration script and cinematic metadata for a single panel.
model: gemini-2.5-flash
response_schema: GeminiAnalysisModel
---

Analyze this comic/manhwa illustration panel in detail and generate cinematic metadata.{tone_hint}
Return a JSON object with these exact properties:

- speech_text: A detailed caption, character dialogue, or story narration describing what is happening or what characters think ({narrative_length_hint}).
- sfx: An on-screen bracket-style sound effect (e.g., "[Whoosh]", "[Slash]", "[Crash]", "[Gasp]", "[Boom]").
- duration: Suggested scene duration in seconds (between 2.0 and 45.0) to fit the pacing of the narration text. Action scenes = shorter; narrative/dialogue scenes = longer.
- motion_type: Camera motion. Must be one of: "zoom_in", "zoom_out", "pan_left", "pan_right", "pan_up", "pan_down".
- visual_description: A single sentence describing what is happening in the panel.
