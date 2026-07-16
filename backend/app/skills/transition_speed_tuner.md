---
name: transition_speed_tuner
description: Configure rendering transition times in frames based on dialogue pace and actions.
model: gemini-2.5-flash
response_schema: TransitionSpeedModel
---

Analyze scene dynamics:
Pacing description: "{visual_description}"
Dialogue pace: "{speech_text}"

Determine transition style (crossfade, cut, flash) and exact transition duration in frames at 30fps.
