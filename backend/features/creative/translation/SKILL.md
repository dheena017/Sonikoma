---
name: translation
description: Autonomous Webtoon Dialogue Translation & Comic Localization Skill with tone adaptation, slang retention, cultural idioms, and sound effects translation.
response_schema: TranslationModel
---

# Webtoon Dialogue Translation & Comic Localization Skill

Located directly in `backend/features/creative/translation/`.

This skill provides autonomous, high-fidelity translation and cultural localization for comic speech bubbles, character dialogue, sound effects (SFX), and narration captions.

## Core Capabilities

1. **Context-Aware Dialogue Translation**: Translates comic speech, character lines, and narrative captions across major languages:
   - Japanese (日本語)
   - Korean (한국어)
   - Spanish (Español)
   - French (Français)
   - German (Deutsch)
   - Tamil (தமிழ்)
   - Chinese (中文)
   - English

2. **Tone & Register Adaptation**:
   - **Natural Conversational**: Everyday authentic dialogue with natural phrasing.
   - **Dynamic / Shonen**: High-energy comic impact, battle exclamations, and punchy cadence.
   - **Dramatic Sakuga**: Poetic, cinematic, and emotionally resonant cadence.
   - **Colloquial / Slang**: Modern street expressions and character-specific colloquialisms.

3. **SFX & Sound Effect Localization**: Adapts onomatopoeia cues and action sound markers (e.g. *[Impact Boom]*, *[Blade Clang]*, *[Dark Resonance]*).

4. **Cultural Idiom Mapping**: Accurately translates regional idioms, puns, and metaphors into native cultural equivalents without clumsy literal word-for-word translation.

## Execution Directives

Translate the dialogue or narrative text into the requested target language. Ensure natural sounding flow, appropriate punctuation, and localization matching the requested tone.

- Source Text: `{text}`
- Target Language: `{target_lang}`

Return STRICT JSON:
```json
{
  "translated_text": "Localized text here",
  "accuracy_rating": 0.98,
  "detected_tone": "natural"
}
```
