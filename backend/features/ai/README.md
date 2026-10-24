# AI Domain Subsystem (`features/ai`)

Consolidates all cognitive, vision, generative, translation, narrative, and autonomous AI agents across Sonikoma into a canonical, cleanly-separated domain.

---

## 1. Design Principles

1. **Deep, Clean Separation**: Monoliths are decomposed into single-responsibility, modular files.
2. **Simplest English Naming**: Every file, helper, parameter, and function name uses everyday, plain English.
3. **Uniform Standard**: Internal `_` helpers are located at the top of each file, followed by a single public API function at the bottom with `__all__ = ["function_name"]`.
4. **100% Backward Compatibility**: All legacy endpoints (`/api/v1/ai/*`, `/api/v1/ai-series/*`, `/api/v1/creative/*`) remain completely supported.

---

## 2. Directory Structure & Plain English Functions

```
backend/features/ai/
├── utils/                     # Pure foundational helpers
│   ├── prompt_builder.py      -> fill_template(template_text, variables)
│   ├── clean_json.py          -> fix_bad_json(raw_text)
│   ├── speech_timer.py        -> count_speech_seconds(text, words_per_minute)
│   └── image_loader.py        -> load_picture(picture_input)
├── catalog/                   # Multi-provider models & costs
│   ├── list_models.py         -> get_all_ai_models(ai_provider, api_key)
│   ├── test_model_speed.py    -> test_model_speed(ai_provider, model_name, api_key)
│   └── track_costs.py         -> calculate_token_cost(words_in, words_out, model_name)
├── analysis/                  # Vision parsing & attribution
│   ├── analyze_panel.py       -> read_panel(picture, story_notes, past_events)
│   ├── analyze_batch.py       -> read_many_panels(panels, parallel_limit)
│   ├── smart_crop.py          -> cut_out_panels(strip_picture, smallest_height)
│   ├── match_bubbles.py       -> match_bubbles_to_faces(bubbles, faces, picture_size)
│   ├── detect_emotion.py      -> find_emotion(speech_line, face_look)
│   └── detect_sfx.py          -> find_sound_effects(sound_word, genre)
├── narrative/                 # Story continuity & scripts
│   ├── story_memory.py        -> remember_story(old_memory, panel_results, panel_number)
│   ├── story_pacing.py        -> check_pacing(panels, genre)
│   └── write_script.py        -> write_story_script(panels, voice_tone)
├── prompts/                   # Prompt enhancement & styles
│   ├── improve_prompt.py      -> make_better_prompt(simple_idea, output_type, art_style, genre)
│   ├── image_prompts.py       -> make_image_prompts(scene_idea, character_looks, art_style)
│   └── style_presets.py       -> get_art_style(style_name)
├── agent/                     # Autonomous 1-click video director
│   ├── agent_workflow.py      -> start_video_agent(run_id, chapter_url, video_shape)
│   ├── agent_scraper.py       -> download_chapter(web_link, save_folder)
│   ├── agent_script.py        -> write_agent_script(panel_pictures, series_title, language)
│   ├── agent_voices.py        -> assign_voices(characters, default_voice)
│   ├── agent_director.py      -> make_agent_video(panels, voice_cast, video_shape)
│   └── agent_jobs.py          -> check_job, approve_job, get_all_jobs
├── series/                    # AI Series Studio
│   ├── story_planner.py       -> plan_story_arc(title, genre, summary, chapter_count)
│   ├── chapter_writer.py      -> write_chapter(series_title, chapter_number, synopsis)
│   ├── panel_prompts.py       -> make_panel_prompts(chapter_script, character_sheets)
│   ├── image_generator.py     -> make_panel_image(prompt, series_id, chapter_id, panel_number)
│   ├── voice_dubber.py        -> dub_chapter_voices(series_id, chapter_id, dialogue_lines)
│   ├── series_memory.py       -> save_series_memory(series_id, chapter_number, new_events)
│   ├── chapter_builder.py     -> build_full_chapter(series_id, chapter_name, chapter_idea)
│   └── repositories.py        -> AISeriesRepository
├── translation/               # Localization & terms dictionary
│   ├── translate_speech.py    -> translate_speech(text, to_language, tone)
│   ├── translate_chapter.py   -> translate_chapter(dialogue_lines, to_language)
│   └── names_dictionary.py    -> get_names, save_names
├── thumbnails/                # High-CTR cover studio
│   ├── thumbnail_ideas.py     -> make_cover_ideas(title, genre, synopsis, count)
│   ├── thumbnail_prompts.py   -> make_cover_prompts(idea, art_style)
│   └── thumbnail_builder.py   -> make_cover_image(background_picture, banner_text)
├── chat/                      # Creative AI chat assistant
│   ├── chat_assistant.py      -> ask_assistant(user_message, chat_history, story_context)
│   └── chat_context.py        -> get_comic_context(series_details, current_panel)
├── training/                  # Custom detector model training
│   ├── train_detector.py      -> train_bubble_model(dataset_folder, target, rounds)
│   ├── prep_dataset.py        -> prep_training_data(box_file, output_folder)
│   └── track_training.py      -> check_training_status(job_id)
├── router/                    # API sub-routers
├── schemas.py                 # Pydantic schemas (re-exports legacy + canonical)
└── service.py                 # Unified AIService master facade (ai_service)
```
