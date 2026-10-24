"""
backend/features/audio/speech/batch_speech_service.py
─────────────────────────────────────────────────────────────────────────────
Batch speech synthesis: concurrently creates character speech and narrative
voiceovers for all comic storyboard panels with bounded parallelism.
─────────────────────────────────────────────────────────────────────────────
"""

import asyncio
import logging
from typing import List, Dict, Any

from features.audio.schemas import BatchPanelAudioItem
from features.audio.speech.panel_speech_service import make_panel_speech

logger = logging.getLogger("sonikoma.audio.speech.batch")


# ── Internal Helpers (Top) ──────────────────────────────────────────────────

def _get_panel_text(item: BatchPanelAudioItem) -> List[str]:
    """Collects and standardizes all spoken text lines from a panel item."""
    dialogues: List[str] = []
    if item.dialogue_list:
        dialogues.extend(item.dialogue_list)
    elif item.text:
        dialogues.append(item.text)
    return dialogues


async def _make_one_panel_sound(
    item: BatchPanelAudioItem,
    global_voice: str,
    speed: float,
    pitch: float,
    make_dialogue: bool,
    make_narrative: bool,
    force_redo: bool,
    semaphore: asyncio.Semaphore
) -> Dict[str, Any]:
    """Processes speech generation for a single panel under concurrency throttle."""
    async with semaphore:
        panel_dict = item.model_dump()
        target_voice = item.voice or global_voice
        target_dur = item.target_duration or 4.0

        # 1. Dialogue Speech
        if make_dialogue:
            if not item.audio_url or force_redo:
                lines = _get_panel_text(item)
                if lines:
                    try:
                        res = await make_panel_speech(
                            dialogue_list=lines,
                            target_duration=target_dur,
                            voice=target_voice,
                            speech_rate=speed,
                            speech_pitch=pitch,
                            return_base64=True
                        )
                        panel_dict["audio_url"] = res.get("audio_url")
                        panel_dict["audio_duration"] = res.get("duration")
                    except Exception as exc:
                        logger.warning(f"Failed speech for panel {item.id}: {exc}")

        # 2. Narrative Voiceover
        if make_narrative and item.narrative:
            if not item.narrative_audio_url or force_redo:
                try:
                    res_narrative = await make_panel_speech(
                        dialogue_list=[item.narrative],
                        target_duration=target_dur,
                        voice=target_voice,
                        speech_rate=speed,
                        speech_pitch=pitch,
                        return_base64=True
                    )
                    panel_dict["narrative_audio_url"] = res_narrative.get("audio_url")
                except Exception as exc:
                    logger.warning(f"Failed narrative for panel {item.id}: {exc}")

        return panel_dict


# ── Canonical Public API (Bottom) ───────────────────────────────────────────

async def make_all_panel_speech(
    panels: List[BatchPanelAudioItem],
    voice: str = "en-US-GuyNeural",
    speech_rate: float = 1.0,
    speech_pitch: float = 1.0,
    generate_dialogue: bool = True,
    generate_narrative: bool = True,
    force_regenerate: bool = False
) -> List[Dict[str, Any]]:
    """
    Makes voice audio for all panels in the story at the same time with concurrency control.
    """
    if not panels:
        return []

    # Limit to 5 parallel synthesis streams to respect network and rate limits
    semaphore = asyncio.Semaphore(5)

    tasks = [
        _make_one_panel_sound(
            item=p,
            global_voice=voice,
            speed=speech_rate,
            pitch=speech_pitch,
            make_dialogue=generate_dialogue,
            make_narrative=generate_narrative,
            force_redo=force_regenerate,
            semaphore=semaphore
        )
        for p in panels
    ]

    results = await asyncio.gather(*tasks, return_exceptions=False)
    logger.info(f"✓ Completed batch speech for {len(results)} panels")
    return results


__all__ = ["make_all_panel_speech"]
