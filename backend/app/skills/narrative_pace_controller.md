---
name: narrative_pace_controller
description: Suggest pacing settings, zoom transitions speeds and pause flags for rendering.
model: gemini-2.5-flash
response_schema: NarrativePacingModel
---

Analyze the dialogue tension level and visual speed metadata below:
Visual Description: "{visual_description}"
Dialogue/Narration: "{speech_text}"
SFX context: "{sfx}"

Recommend panel scene duration multiplier (0.5 for fast action, 1.8 for dramatic pauses), video transition speeds, and sound dampening triggers.
