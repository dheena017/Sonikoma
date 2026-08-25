/**
 * frontend/src/shared/utils/voiceMatcher.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Speech synthesis voice actor characteristic parser & language matcher.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface VoiceCharacteristics {
  targetLangPrefix: string;
  targetFullLang: string;
  targetGender: "male" | "female" | "neutral";
}

export function parseVoiceCharacteristics(voiceActor: string): VoiceCharacteristics {
  const actorLower = (voiceActor || "").toLowerCase();

  let targetLangPrefix = "en";
  let targetFullLang = "en-US";

  if (actorLower.includes("korean") || actorLower.includes("ko-kr") || actorLower.includes("sunhi") || actorLower.includes("injoon")) {
    targetLangPrefix = "ko";
    targetFullLang = "ko-KR";
  } else if (actorLower.includes("japanese") || actorLower.includes("ja-jp") || actorLower.includes("nanami")) {
    targetLangPrefix = "ja";
    targetFullLang = "ja-JP";
  } else if (actorLower.includes("chinese") || actorLower.includes("mandarin") || actorLower.includes("zh-cn") || actorLower.includes("xiaoxiao")) {
    targetLangPrefix = "zh";
    targetFullLang = "zh-CN";
  } else if (actorLower.includes("tamil") || actorLower.includes("ta-in") || actorLower.includes("pallavi") || actorLower.includes("valluvar")) {
    targetLangPrefix = "ta";
    targetFullLang = "ta-IN";
  } else if (actorLower.includes("en-gb") || actorLower.includes("sonia") || actorLower.includes("ryan") || actorLower.includes("uk")) {
    targetLangPrefix = "en";
    targetFullLang = "en-GB";
  } else if (actorLower.includes("en-au") || actorLower.includes("natasha") || actorLower.includes("australia")) {
    targetLangPrefix = "en";
    targetFullLang = "en-AU";
  } else {
    const match = voiceActor.match(/([a-zA-Z]{2})-([a-zA-Z]{2})/);
    if (match) {
      targetLangPrefix = match[1].toLowerCase();
      targetFullLang = match[0];
    }
  }

  let targetGender: "male" | "female" | "neutral" = "male";
  if (actorLower.includes("female") || actorLower.includes("sultry") || actorLower.includes("jenny") || actorLower.includes("aria") || actorLower.includes("nanami") || actorLower.includes("sunhi") || actorLower.includes("xiaoxiao") || actorLower.includes("pallavi")) {
    targetGender = "female";
  }

  return { targetLangPrefix, targetFullLang, targetGender };
}

export function matchVoice(voices: SpeechSynthesisVoice[], voiceActor: string): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  const { targetLangPrefix, targetFullLang, targetGender } = parseVoiceCharacteristics(voiceActor);

  let bestVoice: SpeechSynthesisVoice | null = null;
  let highestScore = -1;

  for (const v of voices) {
    let score = 0;
    const vLang = (v.lang || "").toLowerCase();
    const vName = (v.name || "").toLowerCase();

    if (vLang === targetFullLang.toLowerCase() || vLang.replace("_", "-") === targetFullLang.toLowerCase()) {
      score += 100;
    } else if (vLang.startsWith(targetLangPrefix)) {
      score += 60;
    }

    const isFemale = vName.includes("female") || vName.includes("girl") || vName.includes("woman") || vName.includes("aria") || vName.includes("jenny") || vName.includes("zira");
    const isMale = vName.includes("male") || vName.includes("boy") || vName.includes("man") || vName.includes("guy") || vName.includes("david") || vName.includes("george");

    if (targetGender === "female") {
      if (isFemale) score += 50;
      else if (!isMale) score += 20;
    } else {
      if (isMale) score += 50;
      else if (!isFemale) score += 20;
    }

    if (score > highestScore) {
      highestScore = score;
      bestVoice = v;
    }
  }

  return bestVoice || voices[0] || null;
}
