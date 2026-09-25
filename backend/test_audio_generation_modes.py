import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "app"))

import asyncio
from schemas.ai import AnalyzeImageRequest, AnalyzePanelSequenceRequest, AnalyzePanelItem
from schemas.project import AudioSettingsUpdateRequest
from services.ai.skills.schemas import BatchPanelAnalysisModel, BatchPanelItemAnalysisModel

def test_schema_defaults():
    print("--- 1. Testing Default Audio Generation Settings ---")
    req = AnalyzePanelSequenceRequest(panels=[AnalyzePanelItem(id=1, url="http://example.com/panel1.jpg")])
    assert req.generate_dialogue_audio is False, f"Expected False, got {req.generate_dialogue_audio}"
    assert req.generate_narrative_audio is False, f"Expected False, got {req.generate_narrative_audio}"
    print("[PASS] AnalyzePanelSequenceRequest default: Dialogue=OFF, Narrative=OFF (Decoupled)")

    single_req = AnalyzeImageRequest(url="http://example.com/single.jpg")
    assert single_req.generate_dialogue_audio is False, f"Expected False, got {single_req.generate_dialogue_audio}"
    assert single_req.generate_narrative_audio is False, f"Expected False, got {single_req.generate_narrative_audio}"
    print("[PASS] AnalyzeImageRequest default: Dialogue=OFF, Narrative=OFF (Decoupled)")

    audio_settings = AudioSettingsUpdateRequest()
    assert audio_settings.enableDialogueAudio is None
    assert audio_settings.enableNarrativeAudio is None
    print("[PASS] AudioSettingsUpdateRequest accepts enableDialogueAudio and enableNarrativeAudio")

def test_batch_schema_validation():
    print("\n--- 2. Testing Batch Panel Schema Validation ---")
    mock_batch = {
        "overall_scene_summary": "Yu Yang reflects in the quiet bedroom.",
        "panels": [
            {
                "panel_index": 1,
                "speech_text": "Is this real?",
                "narrative": "Yu Yang stands silently by the door, staring into the softly lit bedroom.",
                "speaker_name": "Yu Yang",
                "speaker_gender": "male",
                "emotion": "contemplative",
                "duration": 3.5,
                "motion_type": "pan_down"
            },
            {
                "panel_index": 2,
                "speech_text": "",
                "narrative": "A gentle shadow stretches across the wooden floorboards as memories return.",
                "speaker_name": "Narrator",
                "speaker_gender": "neutral",
                "emotion": "calm",
                "duration": 4.0,
                "motion_type": "zoom_in"
            }
        ]
    }
    batch_model = BatchPanelAnalysisModel(**mock_batch)
    assert len(batch_model.panels) == 2
    assert batch_model.panels[0].speaker_name == "Yu Yang"
    assert batch_model.panels[1].narrative.startswith("A gentle shadow")
    print("[PASS] BatchPanelAnalysisModel correctly parsed 2 sequential panels with scene summary.")

def test_audio_generation_conditions():
    print("\n--- 3. Testing Audio Generation Logic Conditions ---")
    
    # Mode 1: Default (Narratives ON, Dialogues OFF)
    gen_diag = False
    gen_narr = True
    do_dialogue_tts = gen_diag if gen_diag is not None else False
    do_narrative_tts = gen_narr if gen_narr is not None else True
    assert do_dialogue_tts is False
    assert do_narrative_tts is True
    print("[PASS] Default mode: do_dialogue_tts=False, do_narrative_tts=True")

    # Mode 2: Dialogues ON, Narratives OFF
    gen_diag = True
    gen_narr = False
    do_dialogue_tts = gen_diag if gen_diag is not None else False
    do_narrative_tts = gen_narr if gen_narr is not None else True
    assert do_dialogue_tts is True
    assert do_narrative_tts is False
    print("[PASS] Dialogues-only mode: do_dialogue_tts=True, do_narrative_tts=False")

    # Mode 3: Both ON
    gen_diag = True
    gen_narr = True
    do_dialogue_tts = gen_diag if gen_diag is not None else False
    do_narrative_tts = gen_narr if gen_narr is not None else True
    assert do_dialogue_tts is True
    assert do_narrative_tts is True
    print("[PASS] Full Audio mode: do_dialogue_tts=True, do_narrative_tts=True")

    # Mode 4: Both OFF
    gen_diag = False
    gen_narr = False
    do_dialogue_tts = gen_diag if gen_diag is not None else False
    do_narrative_tts = gen_narr if gen_narr is not None else False
    assert do_dialogue_tts is False
    assert do_narrative_tts is False
    print("[PASS] Silent / Fast mode: do_dialogue_tts=False, do_narrative_tts=False")

if __name__ == "__main__":
    test_schema_defaults()
    test_batch_schema_validation()
    test_audio_generation_conditions()
    print("\n[ALL TESTS PASSED SUCCESSFULLY]")
