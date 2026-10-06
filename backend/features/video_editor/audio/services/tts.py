"""
backend/app/services/audio/tts/tts_engine.py
─────────────────────────────────────────────────────────────────────────────
Text-to-Speech synthesis engine using Microsoft Edge-TTS with sample rate
normalization, speed/pitch adjustment, and multi-speaker alignment.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import re
import io
import shutil
import base64
import logging
import tempfile
import asyncio
from typing import List, Optional, Tuple, Dict, Any, cast

import edge_tts
from edge_tts.exceptions import NoAudioReceived
from pydub import AudioSegment
from pydub.effects import speedup

logger = logging.getLogger("sonikoma.services.audio.tts.tts_engine")

from features.video_editor.audio.services.voice_catalog import (
    VOICE_MAP,
    get_available_voices,
    get_supported_voice_list,
)
from common.audio import (
    to_natural_sentence_case,
    normalize_comic_text_for_human_speech,
    sanitize_text_for_tts,
)
_TTS_MIN_ALPHA_CHARS = 3


async def generate_segment_with_retry(
    text: str,
    voice: str,
    temp_file_path: str,
    rate: Optional[str] = None,
    pitch: Optional[str] = None,
    max_retries: int = 3,
    base_delay: float = 1.0
) -> bool:
    for attempt in range(1, max_retries + 1):
        try:
            communicate_kwargs = {}
            if rate is not None:
                communicate_kwargs["rate"] = rate
            if pitch is not None:
                communicate_kwargs["pitch"] = pitch
            communicate = edge_tts.Communicate(text, voice, **communicate_kwargs)
            await communicate.save(temp_file_path)
            if os.path.exists(temp_file_path) and os.path.getsize(temp_file_path) > 0:
                return True
            logger.warning(f"[Narration/TTS] Attempt {attempt}: saved file is empty for text: '{text[:40]}'")
        except NoAudioReceived as e:
            logger.warning(f"[Narration/TTS] Attempt {attempt}/{max_retries}: NoAudioReceived for text: '{text[:40]}'. Error: {e}")
        except Exception as e:
            logger.warning(f"[Narration/TTS] Attempt {attempt}/{max_retries}: Error for text: '{text[:40]}'. Error: {e}")

        if attempt < max_retries:
            delay = base_delay * (2 ** (attempt - 1))
            await asyncio.sleep(delay)

    logger.error(f"[Narration/TTS] All {max_retries} attempts failed for text: '{text[:40]}'.")
    return False


async def generate_panel_audio(
    dialogue_list: List[Any],
    target_duration: float,
    output_path: str,
    voice: Optional[str] = "en-US-GuyNeural",
    force_duration: bool = False,
    speech_rate: float = 1.0,
    speech_pitch: float = 1.0,
    context_info: Optional[str] = None,
) -> Tuple[str, float]:
    parsed_dialogues: List[str] = []
    for item in dialogue_list:
        if isinstance(item, dict):
            parsed_dialogues.append(str(item.get("text", "")))
        else:
            parsed_dialogues.append(str(item))

    if not parsed_dialogues or all(not text.strip() for text in parsed_dialogues):
        logger.warning(f"Empty dialogue list encountered for output: {output_path}. Defaulting to silence.")
        silence_segment = AudioSegment.silent(duration=int(target_duration * 1000))
        if os.path.dirname(output_path):
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
        silence_segment.export(output_path, format="mp3")
        return output_path, target_duration

    target_duration_ms = int(target_duration * 1000)
    temp_dir = tempfile.gettempdir()
    temp_files = []

    actual_voice = VOICE_MAP.get(voice, voice) if voice else "en-US-GuyNeural"
    if not actual_voice or "-" not in actual_voice or actual_voice.strip().lower() in ("undefined", "null", "default"):
        actual_voice = "en-US-GuyNeural"

    rate_percent = int((speech_rate - 1.0) * 100)
    rate_str = f"{rate_percent:+}%"
    pitch_hz = int((speech_pitch - 1.0) * 50)
    pitch_str = f"{pitch_hz:+}Hz"

    try:
        for idx, text in enumerate(parsed_dialogues):
            if not text.strip():
                continue

            text = sanitize_text_for_tts(text)
            temp_file_path = os.path.join(temp_dir, f"dialog_segment_{os.urandom(4).hex()}_{idx}.mp3")
            temp_files.append(temp_file_path)

            if not any(c.isalnum() for c in text):
                silence_seg = AudioSegment.silent(duration=1000)
                silence_seg.export(temp_file_path, format="mp3")
                continue

            alpha_count = sum(1 for c in text if c.isalpha())
            if alpha_count < _TTS_MIN_ALPHA_CHARS:
                silence_seg = AudioSegment.silent(duration=1000)
                silence_seg.export(temp_file_path, format="mp3")
                continue

            success = await generate_segment_with_retry(text, actual_voice, temp_file_path, rate=rate_str, pitch=pitch_str)
            if not success:
                silence_seg = AudioSegment.silent(duration=1000)
                silence_seg.export(temp_file_path, format="mp3")

        def process_audio_sync() -> float:
            from pydub.effects import normalize
            # Fast path: single segment without forced duration can bypass re-encoding
            valid_files = [f for f in temp_files if os.path.exists(f) and os.path.getsize(f) > 0]
            if not valid_files:
                final_audio = AudioSegment.silent(duration=target_duration_ms)
                if os.path.dirname(output_path):
                    os.makedirs(os.path.dirname(output_path), exist_ok=True)
                final_audio.export(output_path, format="mp3")
                return target_duration

            if len(valid_files) == 1 and not force_duration:
                if os.path.dirname(output_path):
                    os.makedirs(os.path.dirname(output_path), exist_ok=True)
                shutil.copy2(valid_files[0], output_path)
                try:
                    seg = AudioSegment.from_file(output_path, format="mp3")
                    return len(seg) / 1000.0
                except Exception:
                    return target_duration

            # Multi-segment or force_duration: concatenate cleanly without unvectorized CPU-locking loops
            combined_audio: AudioSegment = AudioSegment.empty()
            for idx, file_path in enumerate(valid_files):
                segment = cast(AudioSegment, AudioSegment.from_file(file_path, format="mp3"))
                # Light fade to prevent clicks
                mastered = segment.fade_in(10).fade_out(15)
                combined_audio += mastered
                if idx < len(valid_files) - 1:
                    combined_audio += AudioSegment.silent(duration=180)

            current_duration_ms: int = len(combined_audio)
            final_audio: AudioSegment
            if current_duration_ms == 0:
                final_audio = AudioSegment.silent(duration=target_duration_ms)
            elif force_duration and target_duration_ms > 0:
                if current_duration_ms > target_duration_ms:
                    playback_speed = float(current_duration_ms) / float(target_duration_ms)
                    try:
                        final_audio = cast(AudioSegment, speedup(combined_audio, playback_speed))
                    except Exception:
                        final_audio = combined_audio
                    final_audio = cast(AudioSegment, final_audio[:target_duration_ms])
                else:
                    silence_needed_ms = target_duration_ms - current_duration_ms
                    final_audio = cast(AudioSegment, combined_audio + AudioSegment.silent(duration=silence_needed_ms))
            else:
                try:
                    final_audio = normalize(combined_audio, headroom=0.3)
                except Exception:
                    final_audio = combined_audio

            final_duration_ms: int = len(final_audio)
            if os.path.dirname(output_path):
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
            final_audio.export(output_path, format="mp3")
            return final_duration_ms / 1000.0

        actual_duration = await asyncio.to_thread(process_audio_sync)
        ctx_prefix = f"[{context_info}] " if context_info else ""
        logger.info(f"[Audio Engine] {ctx_prefix}Voice generated: {actual_voice} ({actual_duration:.1f}s audio for {len(parsed_dialogues)} dialogue segment{'s' if len(parsed_dialogues) != 1 else ''})")
        return output_path, actual_duration

    except Exception as general_err:
        ctx_prefix = f"[{context_info}] " if context_info else ""
        logger.error(f"[Audio Engine] {ctx_prefix}Voice generation failed: {general_err}")
        try:
            if os.path.dirname(output_path):
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
            fallback_silence = AudioSegment.silent(duration=target_duration_ms)
            fallback_silence.export(output_path, format="mp3")
            return output_path, target_duration
        except Exception as write_fallback_err:
            raise general_err
    finally:
        for f in temp_files:
            try:
                if os.path.exists(f):
                    os.remove(f)
            except Exception:
                pass


async def generate_tts_audio(
    dialogue_list: List[Any],
    target_duration: float,
    voice: Optional[str] = "en-US-GuyNeural",
    speech_rate: float = 1.0,
    speech_pitch: float = 1.0,
    return_base64: bool = True,
    context_info: Optional[str] = None,
) -> Dict[str, Any]:
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        output_path = tmp.name

    try:
        saved_path, actual_dur = await generate_panel_audio(
            dialogue_list=dialogue_list,
            target_duration=target_duration,
            output_path=output_path,
            voice=voice,
            speech_rate=speech_rate,
            speech_pitch=speech_pitch,
            context_info=context_info,
        )

        if not os.path.exists(saved_path) or os.path.getsize(saved_path) == 0:
            raise ValueError("Audio generation produced empty file.")

        if return_base64:
            with open(saved_path, "rb") as f:
                audio_bytes = f.read()
            audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
            file_size_kb = round(len(audio_bytes) / 1024, 1)

            return {
                "success": True,
                "audio_base64": audio_b64,
                "mime_type": "audio/mpeg",
                "duration_target_s": target_duration,
                "duration_actual_s": actual_dur,
                "file_size_kb": file_size_kb,
                "voice": voice,
                "segments": len(dialogue_list),
            }
        else:
            return {
                "success": True,
                "audio_path": saved_path,
                "duration_actual_s": actual_dur,
                "voice": voice,
                "segments": len(dialogue_list),
            }
    finally:
        if return_base64 and os.path.exists(output_path):
            try:
                os.remove(output_path)
            except OSError:
                pass


# Human-readable aliases
synthesize_panel_narration_audio = generate_panel_audio
synthesize_dialogue_to_speech = generate_tts_audio
get_supported_voice_list = get_available_voices


# ─── Cache Helper ─────────────────────────────────────────────────────────────

def cache_audio_base64(b64_str: str) -> Optional[str]:
    """
    Stores base64-encoded MP3 audio into stitched_cache and returns a
    playback URL. Falls back to an inline data-URI if caching fails.
    """
    import uuid
    import base64 as _base64
    try:
        from app.core.cache import stitched_cache
        raw_bytes = _base64.b64decode(b64_str)
        cache_id = f"audio_{uuid.uuid4().hex[:12]}"
        stitched_cache.set(cache_id, {"data": raw_bytes, "content_type": "audio/mpeg"})
        return f"/api/v1/images/cached/{cache_id}"
    except Exception as exc:
        logger.warning(f"[cache_audio_base64] Failed to cache audio: {exc}")
        return f"data:audio/mpeg;base64,{b64_str}"


# ─── Single Panel Synthesis Service ───────────────────────────────────────────

async def synthesize_panel_audio_service(
    panel_id: str,
    dialogues: List[str],
    narrative: Optional[str],
    voice: str,
    speech_rate: float,
    speech_pitch: float,
    target_duration: float,
    generate_dialogue_audio: bool,
    generate_narrative_audio: bool,
    panel_tag: str,
    existing_audio_url: Optional[str] = None,
    existing_narrative_url: Optional[str] = None,
    force_regenerate: bool = False,
) -> Dict[str, Any]:
    """
    Synthesizes TTS dialogue and/or narrative audio for a single panel.
    Handles cache lookup, deduplication (when dialogue == narrative),
    and returns audio URLs ready for the storyboard.
    """
    import base64 as _base64
    from app.core.cache import stitched_cache

    panel_res: Dict[str, Any] = {
        "id": panel_id,
        "success": True,
        "audio_url": existing_audio_url,
        "narrative_audio_url": existing_narrative_url,
        "duration": None,
    }

    # Check stitched_cache for previously synthesized audio
    if not panel_res["audio_url"] and not force_regenerate:
        cached = stitched_cache.get(f"audio_panel_{panel_id}")
        if cached and cached.get("data"):
            panel_res["audio_url"] = f"/api/v1/images/cached/audio_panel_{panel_id}"
            logger.info(f"[Audio Engine] {panel_tag}: Reusing cached audio → Skipping synthesis.")

    # 1. Dialogue TTS
    if generate_dialogue_audio and dialogues and not panel_res["audio_url"]:
        logger.info(f"[Audio Engine] Synthesizing Dialogue for {panel_tag} | Voice: '{voice}'")
        try:
            res_diag = await generate_tts_audio(
                dialogue_list=dialogues,
                target_duration=target_duration,
                voice=voice,
                speech_rate=speech_rate,
                speech_pitch=speech_pitch,
                return_base64=True,
                context_info=f"{panel_tag} [Dialogue]",
            )
            if res_diag.get("audio_base64"):
                b64 = res_diag["audio_base64"]
                panel_res["audio_url"] = cache_audio_base64(b64)
                try:
                    raw_bytes = _base64.b64decode(b64)
                    stitched_cache.set(
                        f"audio_panel_{panel_id}",
                        {"data": raw_bytes, "content_type": "audio/mpeg"}
                    )
                except Exception:
                    pass
            if res_diag.get("duration_actual_s"):
                panel_res["duration"] = res_diag["duration_actual_s"]
        except Exception as exc:
            logger.warning(f"[Audio Engine] {panel_tag} Dialogue audio failed: {exc}")

    # 2. Narrative TTS
    if generate_narrative_audio and narrative and narrative.strip() and not panel_res["narrative_audio_url"]:
        narr_text = narrative.strip()
        diag_text = (dialogues[0].strip() if dialogues and len(dialogues) == 1 else "")

        # Optimization: reuse dialogue audio when text is identical
        if narr_text and diag_text and narr_text == diag_text and panel_res.get("audio_url"):
            panel_res["narrative_audio_url"] = panel_res["audio_url"]
        else:
            if len(narr_text) > 500:
                narr_text = narr_text[:500]
            logger.info(f"[Audio Engine] Synthesizing Narrative for {panel_tag} | Voice: '{voice}'")
            try:
                res_narr = await generate_tts_audio(
                    dialogue_list=[narr_text],
                    target_duration=target_duration,
                    voice=voice,
                    speech_rate=speech_rate,
                    speech_pitch=speech_pitch,
                    return_base64=True,
                    context_info=f"{panel_tag} [Narrative]",
                )
                if res_narr.get("audio_base64"):
                    panel_res["narrative_audio_url"] = cache_audio_base64(res_narr["audio_base64"])
                if res_narr.get("duration_actual_s") and not panel_res["duration"]:
                    panel_res["duration"] = res_narr["duration_actual_s"]
            except Exception as exc:
                logger.warning(f"[Audio Engine] {panel_tag} Narrative audio failed: {exc}")

    return panel_res


# ─── Batch Panel Synthesis Service ────────────────────────────────────────────

async def batch_synthesize_panels_service(
    panels: List[Any],
    voice: str = "en-US-GuyNeural",
    speech_rate: float = 1.0,
    speech_pitch: float = 1.0,
    generate_dialogue_audio: bool = True,
    generate_narrative_audio: bool = True,
    force_regenerate: bool = False,
    concurrency: int = 4,
) -> List[Dict[str, Any]]:
    """
    Concurrently synthesizes TTS audio for all panels in a storyboard.
    Respects Edge-TTS WebSocket stability with a configurable semaphore limit (default 4).
    Returns a list of per-panel result dicts with audio_url and narrative_audio_url.
    """
    import os
    total_panels = len(panels)
    semaphore = asyncio.Semaphore(concurrency)

    async def _process(panel: Any, idx: int) -> Dict[str, Any]:
        target_voice = getattr(panel, "voice", None) or voice or "en-US-GuyNeural"
        dur = getattr(panel, "target_duration", None) or 4.0
        p_idx = getattr(panel, "panel_index", None) or (idx + 1)
        image_url = getattr(panel, "image_url", None)
        panel_id = getattr(panel, "id", str(idx))
        img_name = os.path.basename(image_url) if image_url else f"panel_{panel_id}"
        panel_tag = f"Panel {p_idx}/{total_panels} (ID: {panel_id}, Image: {img_name})"

        # Resolve existing audio URLs (skip if not force_regenerate)
        existing_audio_url = None
        existing_narrative_url = None
        if not force_regenerate:
            existing_audio_url = getattr(panel, "audio_url", None)
            existing_narrative_url = getattr(panel, "narrative_audio_url", None)

        # Resolve dialogue list
        dialogues: List[str] = getattr(panel, "dialogue_list", None) or []
        if not dialogues:
            text = getattr(panel, "text", None)
            if text and text.strip():
                dialogues = [text.strip()]

        narrative = getattr(panel, "narrative", None)

        async with semaphore:
            return await synthesize_panel_audio_service(
                panel_id=panel_id,
                dialogues=dialogues,
                narrative=narrative,
                voice=target_voice,
                speech_rate=speech_rate,
                speech_pitch=speech_pitch,
                target_duration=dur,
                generate_dialogue_audio=generate_dialogue_audio,
                generate_narrative_audio=generate_narrative_audio,
                panel_tag=panel_tag,
                existing_audio_url=existing_audio_url,
                existing_narrative_url=existing_narrative_url,
                force_regenerate=force_regenerate,
            )

    results = await asyncio.gather(*(_process(p, i) for i, p in enumerate(panels)))
    return list(results)
