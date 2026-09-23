---
name: panel_analysis
description: Generate narration script and cinematic metadata for a single panel.
response_schema: GeminiAnalysisModel
---

Analyze this comic/manhwa illustration panel in detail and generate cinematic metadata.{tone_hint}
Return a JSON object with these exact properties:

- speech_text: Transcribe ONLY the actual dialogue text from speech bubbles clearly visible in the image. If there are NO speech bubbles in the panel, return an empty string "". NEVER invent or hallucinate fictional dialogue.
- narrative: A vivid, cinematic human story narrator script explaining the scene actions, character tensions, and dramatic atmosphere to engage the audience.
- sfx: An on-screen bracket-style sound effect (e.g., "[Whoosh]", "[Slash]", "[Crash]", "[Gasp]", "[Boom]").
- duration: Suggested scene duration in seconds (between 2.0 and 45.0) to fit the pacing of the narration text. Action scenes = shorter; narrative/dialogue scenes = longer.
- motion_type: Camera motion. Must be one of: "zoom_in", "zoom_out", "pan_left", "pan_right", "pan_up", "pan_down".
- visual_description: A concise sentence describing what is happening in the panel.
