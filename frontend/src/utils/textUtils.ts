export interface CleanDialogue {
  speech: string;
  tone?: string;
  character?: string;
}

/**
 * Parses raw speech text strings (which might be JSON strings like {"narrator_line": "...", "voice_tone": "..."})
 * and returns clean speech text, tone description, and character name for UI display and audio synthesis.
 */
export function cleanDialogueDisplay(rawText?: string): CleanDialogue {
  if (!rawText) return { speech: "" };
  const trimmed = rawText.trim();

  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    trimmed.startsWith("```json") ||
    trimmed.includes('"narrator_line"') ||
    trimmed.includes('"speech"')
  ) {
    try {
      const cleanJsonStr = trimmed
        .replace(/^```json\s*/i, "")
        .replace(/```$/i, "")
        .trim();
      const parsed = JSON.parse(cleanJsonStr);
      const speech =
        parsed.narrator_line ||
        parsed.speech ||
        parsed.dialogue ||
        parsed.speech_text ||
        parsed.text ||
        parsed.line ||
        "";
      const tone = parsed.voice_tone || parsed.tone || parsed.emotion || "";
      const character = parsed.character || parsed.speaker || parsed.character_name || "";
      if (speech) {
        return {
          speech: String(speech).trim(),
          tone: tone ? String(tone).trim() : undefined,
          character: character ? String(character).trim() : undefined,
        };
      }
    } catch (e) {
      const matchLine = trimmed.match(/"(?:narrator_line|speech|dialogue|speech_text|text)":\s*"([^"]+)"/);
      const matchTone = trimmed.match(/"(?:voice_tone|tone|emotion)":\s*"([^"]+)"/);
      if (matchLine) {
        return {
          speech: matchLine[1].trim(),
          tone: matchTone ? matchTone[1].trim() : undefined,
        };
      }
    }
  }

  return { speech: rawText.trim() };
}
