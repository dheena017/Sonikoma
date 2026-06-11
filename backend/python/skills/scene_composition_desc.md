---
name: scene_composition_desc
description: Generate structured visual scene description for generative video synthesis prompting.
model: gemini-2.5-flash
response_schema: SceneCompositionModel
---
Write a detailed generative visual prompt describing this comic scene:
Illustration description: "{visual_description}"
Audio context: "{speech_text}"

Describe characters, visual atmosphere, drawing style (e.g. watercolor, detailed ink), camera angle, light sources, and particle motion.
