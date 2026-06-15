---
name: character_emotion_class
description: Evaluate character visual expressions to classify active emotional state.
model: gemini-2.5-flash
response_schema: CharacterEmotionModel
---

Evaluate the face and gesture of the character in this illustration:
Illustration description: "{visual_description}"
Character dialog: "{speech_text}"

Categorize their emotional state (e.g. terrified, smug, enraged, affectionate, analytical) and estimate target voice stability score (0.0 to 1.0).
