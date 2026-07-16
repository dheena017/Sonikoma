---
name: series_intro_hook
description: Generate high-engagement introductory video hook summarizing the manhwa premise.
model: gemini-2.5-flash
response_schema: SeriesIntroHookModel
---

You are a YouTube video retention specialist. Write an absolute banger of an intro hook (first 5 seconds of the video) to capture readers immediately for this manhwa:
Title: "{title}"
Premise Summary: "{premise_summary}"
Genre: "{genre}"

Provide hook speech text and dynamic background video description hints.
