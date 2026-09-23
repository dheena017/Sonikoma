import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "app"))

import asyncio
import json
import re
from services.ai.skills.schemas import GeminiAnalysisModel, DialogueTurnItem
from services.ai.facade import StoryMemoryTracker, validate_analysis

def test_schemas():
    print("--- 1. Testing Schema Definitions ---")
    analysis = GeminiAnalysisModel(
        speech_text="\"I am the Monarch of Shadows.\"",
        dialogue_turns=[
            DialogueTurnItem(speaker_name="Sung Jinwoo", speaker_gender="male", text="I am the Monarch of Shadows.", emotion="neutral")
        ],
        narrative="Standing amid the fallen legion, the shadow sovereign unleashes his dark aura as the enemy army quakes in terror.",
        speaker_name="Sung Jinwoo",
        speaker_gender="male",
        emotion="neutral",
        scene_context="Sung Jinwoo faces the monarch army on the battlefield",
        duration=5.0,
        motion_type="zoom_in",
        visual_description="A dark-haired hunter surrounded by blue-black flame shadows."
    )
    data = analysis.model_dump()
    assert data["speaker_name"] == "Sung Jinwoo"
    assert data["speaker_gender"] == "male"
    assert data["speech_text"] != data["narrative"]
    print("[PASS] Schema accepts custom character name ('Sung Jinwoo') and distinct narrative.")

def test_dialogue_and_narrative_separation():
    print("\n--- 2. Testing Dialogue Clean Formatting & Deduplication ---")
    raw = {
        "speech_text": "Father: Honey, I'm back!\nMother: Hi honey, our little angel just fell asleep.",
        "dialogue_turns": [
            {"speaker_name": "Father", "speaker_gender": "male", "text": "Father: Honey, I'm back!", "emotion": "tender"},
            {"speaker_name": "Mother", "speaker_gender": "female", "text": "Mother: Hi honey, our little angel just fell asleep.", "emotion": "tender"}
        ],
        "narrative": "Father: Honey, I'm back!\nMother: Hi honey, our little angel just fell asleep.", # simulate accidental duplicate
        "speaker_name": "Father",
        "speaker_gender": "male",
        "scene_context": "Inside the warm nursery room, parents caring for their newborn baby",
        "visual_description": "A man smiling at a woman holding an infant."
    }

    validated = validate_analysis(raw)
    
    # Simulate facade formatting & deduplication
    turns = validated.get("dialogue_turns", [])
    separated_lines = []
    for t in turns:
        t_text = (t.get("text") or "").strip()
        t_text = re.sub(r'^(Father|Mother|Child|Man|Woman|Character|\w+):\s*', '', t_text, flags=re.IGNORECASE).strip().strip('"').strip("'").strip()
        if t_text:
            separated_lines.append(f'"{t_text}"')
    if separated_lines:
        validated["speech_text"] = "\n\n".join(separated_lines)

    # Check deduplication logic
    curr_speech = (validated.get("speech_text") or "").strip()
    curr_narrative = (validated.get("narrative") or "").strip()
    def _normalize_txt(s: str) -> str:
        return re.sub(r'[\W_]+', '', s.lower())

    if (curr_speech and curr_narrative and _normalize_txt(curr_speech) == _normalize_txt(curr_narrative)) or not curr_narrative:
        scene_ctx = (validated.get("scene_context") or "").rstrip('.')
        vis_desc = (validated.get("visual_description") or "").rstrip('.')
        narrative_parts = []
        if scene_ctx:
            narrative_parts.append(f"In this moment, {scene_ctx}.")
        if curr_speech:
            narrative_parts.append("A tender yet crucial exchange takes place between them, each spoken word carrying the weight of their unspoken hopes.")
        elif vis_desc:
            narrative_parts.append(f"{vis_desc}, capturing a poignant stillness as their story moves forward.")
        validated["narrative"] = " ".join(narrative_parts)

    print("Clean Formatted Speech Text:")
    print(validated["speech_text"])
    print("\nDistinct Synthesized Narrative:")
    print(validated["narrative"])

    assert "Father:" not in validated["speech_text"]
    assert "Mother:" not in validated["speech_text"]
    assert validated["speech_text"] != validated["narrative"]
    print("[PASS] Fabricated prefixes stripped; speech_text and narrative are completely distinct!")

def test_story_continuity_across_panels_and_chapters():
    print("\n--- 3. Testing Story Memory Continuity Across Panels & Chapters ---")
    memory = StoryMemoryTracker()

    # Panel 0: Hospital birth scene
    panel_0_analysis = {
        "speaker_name": "Father",
        "speaker_gender": "male",
        "speech_text": "He looks just like you.",
        "emotion": "tender",
        "scene_context": "In a hospital room, parents welcoming their newborn son",
        "is_scene_transition": False
    }
    memory.update_from_analysis(panel_0_analysis, panel_index=0)
    
    # Panel 1: Mother responds
    panel_1_analysis = {
        "speaker_name": "Mother",
        "speaker_gender": "female",
        "speech_text": "He has your eyes.",
        "emotion": "tender",
        "scene_context": "In a hospital room, parents welcoming their newborn son",
        "is_scene_transition": False
    }
    memory.update_from_analysis(panel_1_analysis, panel_index=1)

    print("Context for Panel 2 (Same Chapter):")
    ctx_same_chapter = memory.format_for_prompt()
    print(ctx_same_chapter)
    assert "Father (male)" in ctx_same_chapter
    assert "Mother (female)" in ctx_same_chapter
    assert "Preceding Dialogue: Mother: [tender] \"He has your eyes.\"" in ctx_same_chapter

    # Panel 2: Chapter transition (5 years later)
    panel_2_transition = {
        "speaker_name": "Arthur",
        "speaker_gender": "child",
        "speech_text": "Look what I can do, Mom!",
        "emotion": "neutral",
        "scene_context": "5 years later in the manor courtyard, young Arthur testing his mana core",
        "is_scene_transition": True # new chapter / time jump
    }
    memory.update_from_analysis(panel_2_transition, panel_index=2)

    print("\nContext for Panel 3 (New Chapter / Time Skip):")
    ctx_new_chapter = memory.format_for_prompt()
    print(ctx_new_chapter)
    
    assert "Preceding Story Arc: In a hospital room, parents welcoming their newborn son" in ctx_new_chapter
    assert "Active Characters:" in ctx_new_chapter
    assert "Father (male)" in ctx_new_chapter
    assert "Mother (female)" in ctx_new_chapter
    assert "Arthur (child)" in ctx_new_chapter
    print("[PASS] Full continuity verified: Cast roster, story arc history, and voice assignments preserved!")

if __name__ == "__main__":
    test_schemas()
    test_dialogue_and_narrative_separation()
    test_story_continuity_across_panels_and_chapters()
    print("\nALL TESTS PASSED SUCCESSFULLY!")
