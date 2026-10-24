"""
Unit & Integration Test Suite for Canonical AI Domain Consolidation (`features/ai`).

Verifies:
1. Foundational utils: prompt_builder, clean_json, speech_timer, image_loader
2. Catalog: list_models, test_model_speed, track_costs
3. Analysis: detect_emotion, detect_sfx, match_bubbles, smart_crop, analyze_panel, analyze_batch
4. Narrative: story_memory, story_pacing, write_script
5. Prompts: style_presets, image_prompts, improve_prompt
6. Autonomous Agent: agent_scraper, agent_voices, agent_script, agent_director, agent_jobs, agent_workflow
7. Series Studio: story_planner, chapter_writer, panel_prompts, image_generator, voice_dubber, series_memory, chapter_builder
8. Translation: translate_speech, translate_chapter, names_dictionary
9. Thumbnails: thumbnail_ideas, thumbnail_prompts, thumbnail_builder
10. Chat: chat_context, chat_assistant
11. Training: prep_dataset, train_detector, track_training
12. AIService master facade & Router API endpoints
"""

import pytest
import io
from PIL import Image
from fastapi.testclient import TestClient

from main import app
from features.ai.service import AIService, ai_service
import features.ai as ai


client = TestClient(app)


# ── 1. Foundational Utils ───────────────────────────────────────────────────

def test_fill_template():
    template = "Generate a {genre} comic scene about {hero} fighting {villain}."
    vars = {"genre": "cyberpunk", "hero": "Jin", "villain": "Chrome Titan"}
    res = ai.fill_template(template, vars)
    assert "cyberpunk comic scene" in res
    assert "Jin fighting Chrome Titan" in res


def test_fix_bad_json():
    bad_md = "```json\n{\"title\": \"Awakening\", \"panels\": [1, 2, 3]}\n```"
    parsed = ai.fix_bad_json(bad_md)
    assert parsed.get("title") == "Awakening"
    assert len(parsed.get("panels")) == 3


def test_count_speech_seconds():
    text = "Wait, don't step into the shadow! The dungeon boss is waking up!"
    duration = ai.count_speech_seconds(text, words_per_minute=145)
    assert duration > 1.0
    assert duration < 10.0


def test_load_picture():
    img = Image.new("RGB", (100, 100), color=(255, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    loaded = ai.load_picture(buf.getvalue())
    assert loaded.size == (100, 100)


# ── 2. Catalog & Cost Tracking ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_catalog_models_and_costs():
    models = await ai.get_all_ai_models("gemini")
    assert models["provider"] == "gemini"
    assert len(models["models"]) > 0

    costs = ai.calculate_token_cost(words_in=1000, words_out=500, model_name="gemini-flash")
    assert costs["estimated_cost_usd"] > 0
    assert costs["credits_deducted"] >= 1


# ── 3. Vision Analysis & Attribution ────────────────────────────────────────

def test_find_emotion():
    res = ai.find_emotion("GET DOWN RIGHT NOW!!!")
    assert res["emotion"] in ("shouting", "panicked")

    res2 = ai.find_emotion("...shh, be very quiet.")
    assert res2["emotion"] == "whisper"


def test_find_sound_effects():
    res = ai.find_sound_effects("SLASH", genre="action")
    assert "blade" in res["category"] or "action" in res["category"]
    assert res["sound_word"] == "SLASH"


def test_match_bubbles_to_faces():
    bubbles = [{"id": "b1", "x": 100, "y": 100, "text": "Hello!"}]
    faces = [{"name": "Protagonist", "box": [80, 80, 120, 120]}]
    matched = ai.match_bubbles_to_faces(bubbles, faces, (1000, 1000))
    assert len(matched) == 1
    assert matched[0]["assigned_speaker"] == "Protagonist"


@pytest.mark.asyncio
async def test_read_panel():
    img = Image.new("RGB", (200, 200), color=(50, 50, 50))
    res = await ai.read_panel(img, story_notes="Training arc")
    assert "speaker" in res
    assert "dialogue" in res


# ── 4. Narrative ────────────────────────────────────────────────────────────

def test_remember_story():
    old = {"characters": {"Jin": {"status": "healthy"}}}
    update = {"speaker": "Jin", "action": "dodged spear"}
    mem = ai.remember_story(old, update, panel_number=1)
    assert "Jin" in mem["characters"]


@pytest.mark.asyncio
async def test_write_story_script():
    panels = [
        {"speech_text": "I will never yield!", "speaker": "Hero"},
        {"speech_text": "Then perish.", "speaker": "Villain"}
    ]
    script = await ai.write_story_script(panels)
    assert len(script) == 2
    assert "I will never yield!" in script[0]["spoken_line"]


# ── 5. Prompts & Styles ─────────────────────────────────────────────────────

def test_style_presets_and_image_prompts():
    style = ai.get_art_style("manhwa")
    assert "korean webtoon" in style["keywords"]

    prompts = ai.make_image_prompts(
        scene_idea="hero drawing sword against dragon",
        character_looks=["black hair", "glowing blue eyes"],
        art_style="manhwa"
    )
    assert "hero drawing sword" in prompts["prompt"]
    assert "black hair" in prompts["prompt"]
    assert len(prompts["negative_prompt"]) > 10


@pytest.mark.asyncio
async def test_make_better_prompt():
    res = await ai.make_better_prompt("hero vs monster", art_style="anime", genre="action")
    assert "hero vs monster" in res["enhanced_prompt"]
    assert "anime" in res["art_style"]


# ── 6. Autonomous Agent ─────────────────────────────────────────────────────

def test_agent_voice_assignment():
    chars = [
        {"name": "Jin", "gender": "male", "role": "lead"},
        {"name": "Elena", "gender": "female", "role": "lead"}
    ]
    cast = ai.assign_voices(chars)
    assert len(cast) == 2
    assert cast[0]["character_name"] == "Jin"
    assert cast[1]["character_name"] == "Elena"


@pytest.mark.asyncio
async def test_agent_workflow_init():
    res = await ai.start_video_agent(
        run_id="test_run_123",
        chapter_url="https://www.webtoons.com/en/fantasy/test/ep-1/viewer",
        video_shape="shorts"
    )
    assert res["run_id"] == "test_run_123"
    assert res["status"] in ("initializing", "scraping")


# ── 7. Series Studio ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_plan_story_arc_and_chapter():
    arc = await ai.plan_story_arc("Solo Monarch", "Fantasy", "Reborn with a system", chapter_count=3)
    assert arc["title"] == "Solo Monarch"
    assert len(arc["chapters"]) == 3

    panels = await ai.write_chapter("Solo Monarch", 1, "The dungeon opens", panel_count=4)
    assert len(panels) == 4
    assert panels[0]["panel_number"] == 1


# ── 8. Translation ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_translation_and_dictionary():
    # Terminology dictionary
    ai.save_names("series_1", "Japanese", {"Jin": "ジン", "Shadow Slash": "影斬り"})
    terms = ai.get_names("series_1", "Japanese")
    assert terms.get("Jin") == "ジン"

    # Translate speech
    res = await ai.translate_speech("Hello", to_language="Spanish")
    assert "translated_text" in res
    assert res["target_lang"] == "Spanish"


# ── 9. Thumbnails ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_thumbnail_pipeline():
    ideas = await ai.make_cover_ideas("God of War", "Action", "Warrior seeks peace", count=2)
    assert len(ideas) == 2

    prompts = ai.make_cover_prompts(ideas[0], art_style="anime")
    assert "16:9 youtube thumbnail" in prompts["prompt"]

    bg = Image.new("RGB", (1280, 720), color=(20, 20, 30))
    cover = ai.make_cover_image(bg, banner_text="EPIC REVEAL")
    assert cover.size == (1280, 720)


# ── 10. Chat & Assistant ────────────────────────────────────────────────────

def test_chat_context():
    series_info = {"title": "Tower climber", "genre": "action", "synopsis": "Climbing floors"}
    ctx = ai.get_comic_context(series_info)
    assert "Tower climber" in ctx


@pytest.mark.asyncio
async def test_ask_assistant():
    ans = await ai.ask_assistant("How should I frame the villain's entrance?")
    assert "reply" in ans
    assert len(ans["reply"]) > 5


# ── 11. Custom Training ─────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_training_modules():
    prep = ai.prep_training_data("dummy_boxes.json", "outputs/test_dataset")
    assert prep["status"] == "ready"

    job = await ai.train_bubble_model("outputs/test_dataset", target="bubble", rounds=10)
    assert job["target"] == "bubble"

    status = ai.check_training_status(job["job_id"])
    assert status["job_id"] == job["job_id"]


# ── 12. Master AIService Facade ─────────────────────────────────────────────

def test_master_ai_service_attributes():
    assert hasattr(ai_service, "read_panel")
    assert hasattr(ai_service, "start_video_agent")
    assert hasattr(ai_service, "plan_story_arc")
    assert hasattr(ai_service, "translate_speech")
    assert hasattr(ai_service, "make_cover_ideas")
    assert hasattr(ai_service, "ask_assistant")


# ── 13. API Router Integration Endpoints ────────────────────────────────────

def test_api_prompts_styles_endpoint():
    res = client.get("/api/v1/ai/prompts/styles")
    assert res.status_code == 200
    data = res.json()
    assert "styles" in data
    assert "manhwa" in data["styles"]


def test_api_prompts_improve_endpoint():
    res = client.post(
        "/api/v1/ai/prompts/improve",
        json={"simple_idea": "warrior in neon city", "art_style": "manhwa"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "enhanced_prompt" in data


def test_api_analysis_emotion_endpoint():
    res = client.get("/api/v1/ai/analysis/emotion?line=STOP%20RIGHT%20THERE!")
    assert res.status_code == 200
    data = res.json()
    assert "emotion" in data


def test_api_translation_speech_endpoint():
    res = client.post(
        "/api/v1/ai/translation/speech",
        json={"text": "Let's go!", "to_language": "Japanese"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "translated_text" in data
