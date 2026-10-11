"""
backend/features/creative/agent/cast_manager.py
─────────────────────────────────────────────────────────────────────────────
Character Voice Continuity Engine (CVCE) for Serious Manhwa/Webtoon Recaps:
- Enforces strict character voice persistence across all panels in an episode.
- Zero comical, goofy, or cartoonish voices — strictly mature, cinematic tones.
- Automatically casts distinct, proper voices by character archetype and gender.
- Preserves full character continuity: once a character speaks, their voice is locked.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Dict, List, Optional, Any

logger = logging.getLogger("sonikoma.creative.agent.cast_manager")

# Curated, mature, cinematic voices for Manhwa / Webtoon recaps
# Calibrated for dark fantasy, action, and martial arts storylines
SERIOUS_VOICE_PROFILES: Dict[str, Dict[str, str]] = {
    "en": {
        "narrator": "en-US-ChristopherNeural",   # Deep, authoritative, cinematic documentary tone
        "protagonist": "en-US-GuyNeural",         # Confident, cold, determined young adult male
        "female_lead": "en-US-AriaNeural",        # Mature, serious, expressive female lead (no squeaky pitch)
        "antagonist": "en-US-DavisNeural",        # Heavy low-bass, menacing, cold authority
        "mentor": "en-US-EricNeural",             # Experienced, authoritative, gravelly baritone
        "supporting_male": "en-US-RyanNeural",    # Alert, composed male ally
        "supporting_female": "en-US-JennyNeural", # Articulate, composed female ally
    },
    "es": {
        "narrator": "es-ES-AlvaroNeural",
        "protagonist": "es-MX-JorgeNeural",
        "female_lead": "es-MX-DaliaNeural",
        "antagonist": "es-ES-AlvaroNeural",
        "mentor": "es-MX-JorgeNeural",
        "supporting_male": "es-ES-AlvaroNeural",
        "supporting_female": "es-ES-ElviraNeural",
    },
    "ja": {
        "narrator": "ja-JP-KeitaNeural",
        "protagonist": "ja-JP-DaichiNeural",
        "female_lead": "ja-JP-NanamiNeural",
        "antagonist": "ja-JP-KeitaNeural",
        "mentor": "ja-JP-DaichiNeural",
        "supporting_male": "ja-JP-DaichiNeural",
        "supporting_female": "ja-JP-AoiNeural",
    },
    "ko": {
        "narrator": "ko-KR-BongJinNeural",
        "protagonist": "ko-KR-InJoonNeural",
        "female_lead": "ko-KR-SunHiNeural",
        "antagonist": "ko-KR-BongJinNeural",
        "mentor": "ko-KR-InJoonNeural",
        "supporting_male": "ko-KR-InJoonNeural",
        "supporting_female": "ko-KR-YuJinNeural",
    },
    "fr": {
        "narrator": "fr-FR-HenriNeural",
        "protagonist": "fr-FR-HenriNeural",
        "female_lead": "fr-FR-DeniseNeural",
        "antagonist": "fr-FR-HenriNeural",
        "mentor": "fr-FR-HenriNeural",
        "supporting_male": "fr-FR-HenriNeural",
        "supporting_female": "fr-FR-DeniseNeural",
    },
}


class CharacterCastManager:
    """
    Guarantees 100% character voice continuity across all panels in an episode.
    Prevents random voice switching and ensures serious, dramatic manhwa audio.
    """

    def __init__(
        self,
        language: str = "en",
        main_voice: Optional[str] = None,
        narrator_voice: Optional[str] = None,
    ):
        self.language = language[:2].lower() if language else "en"
        profiles = SERIOUS_VOICE_PROFILES.get(self.language, SERIOUS_VOICE_PROFILES["en"])

        self.default_narrator = narrator_voice or profiles["narrator"]
        self.default_protagonist = main_voice or profiles["protagonist"]
        self.default_female_lead = profiles["female_lead"]
        self.default_antagonist = profiles["antagonist"]
        self.default_mentor = profiles["mentor"]
        self.default_supporting_male = profiles["supporting_male"]
        self.default_supporting_female = profiles["supporting_female"]

        # Persistent character roster: Maps clean speaker name -> locked voice
        self.roster: Dict[str, str] = {
            "NARRATOR": self.default_narrator,
        }
        self.roles: Dict[str, str] = {
            "NARRATOR": "Master Cinematic Narrator",
        }
        self.line_counts: Dict[str, int] = {
            "NARRATOR": 0,
        }

    def get_voice_for_speaker(
        self,
        speaker_name: Optional[str] = None,
        gender: Optional[str] = None,
        archetype: Optional[str] = None,
    ) -> str:
        """
        Retrieves the permanently locked voice for a character.
        If the character has not spoken yet, casts a proper serious voice and locks it.
        """
        clean_name = (speaker_name or "").strip().upper()
        clean_gender = (gender or "neutral").strip().lower()
        clean_arch = (archetype or "neutral").strip().lower()

        # 1. Non-dialogue exposition / narrator lines
        if not clean_name or clean_name in (
            "NARRATOR", "EXPOSITION", "NONE", "UNKNOWN", "SYSTEM", "STATUS", "WORLD"
        ):
            self.line_counts["NARRATOR"] = self.line_counts.get("NARRATOR", 0) + 1
            return self.roster["NARRATOR"]

        # 2. Return locked voice if character already spoke earlier in the chapter
        if clean_name in self.roster:
            self.line_counts[clean_name] = self.line_counts.get(clean_name, 0) + 1
            return self.roster[clean_name]

        # 3. New character: Cast proper serious voice based on role/gender and permanently lock
        assigned_voice = self._cast_voice(clean_name, clean_gender, clean_arch)
        role_label = self._format_role_label(clean_name, clean_gender, clean_arch)

        self.roster[clean_name] = assigned_voice
        self.roles[clean_name] = role_label
        self.line_counts[clean_name] = 1

        logger.info(
            f"[Cast Manager] Locked voice '{assigned_voice}' for character '{clean_name}' ({role_label})"
        )
        return assigned_voice

    def _cast_voice(self, name: str, gender: str, archetype: str) -> str:
        # Protagonist check
        if (
            archetype in ("protagonist", "main", "mc", "hero")
            or "PROTAGONIST" in name
            or "MC" in name
            or "HERO" in name
        ):
            return self.default_protagonist

        # Female characters
        if gender == "female" or archetype in ("female_lead", "heroine", "female"):
            return self.default_female_lead

        # Antagonist / Boss / Shadow Monarch
        if (
            archetype in ("antagonist", "villain", "boss", "monarch", "enemy")
            or any(k in name for k in ("BOSS", "MONARCH", "KING", "VILLAIN", "DEMON", "ENEMY"))
        ):
            return self.default_antagonist

        # Mentor / Guild Leader / Elder
        if (
            archetype in ("mentor", "elder", "master", "guildmaster", "chairman")
            or any(k in name for k in ("MASTER", "LEADER", "CHAIRMAN", "ELDER", "GUILD"))
        ):
            return self.default_mentor

        # General supporting male
        if gender == "male":
            return self.default_supporting_male

        # Default fallback to protagonist voice if male/neutral
        return self.default_protagonist

    def _format_role_label(self, name: str, gender: str, archetype: str) -> str:
        if archetype in ("protagonist", "main", "mc"):
            return "Protagonist (Lead)"
        if gender == "female" or archetype == "female_lead":
            return "Female Lead / Hunter"
        if archetype in ("antagonist", "villain", "boss"):
            return "Antagonist / Villain"
        if archetype in ("mentor", "elder", "guildmaster"):
            return "Guildmaster / Mentor"
        return "Supporting Character"

    def override_voice(self, speaker_name: str, voice_code: str) -> None:
        """Allows creator to manually adjust or lock a character's voice in review mode."""
        clean_name = speaker_name.strip().upper()
        self.roster[clean_name] = voice_code
        logger.info(f"[Cast Manager] Overrode character '{clean_name}' voice to '{voice_code}'")

    def get_cast_summary(self) -> List[Dict[str, Any]]:
        """Returns clean list of all characters detected and their assigned voices."""
        summary = []
        for name, voice in self.roster.items():
            summary.append({
                "name": name.title() if name != "NARRATOR" else "Master Cinematic Narrator",
                "role": self.roles.get(name, "Character"),
                "voice": voice,
                "lines_count": self.line_counts.get(name, 0),
            })
        # Sort by line count descending
        summary.sort(key=lambda x: x["lines_count"], reverse=True)
        return summary
