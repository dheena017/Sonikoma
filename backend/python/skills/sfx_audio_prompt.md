---
name: sfx_audio_prompt
description: Generate descriptive prompt phrases for audio sound effect generators.
model: gemini-2.5-flash
response_schema: SFXAudioPromptModel
---
You are an expert sound designer. Analyze the following comic action scene and generate a descriptive, detailed sound effect prompt to synthesize realistic audio.
Visual scene context:
{visual_description}

SFX tag: {sfx_tag}

Provide a text-to-audio description prompt and suggest volume scaling.
