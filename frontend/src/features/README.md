# Features (`frontend/src/features/`)

## 1. Overview
The `features/` directory contains Sonikoma's **10 Core Application Domains**, enforcing strict modular isolation and 1:1 structural parity with the backend.

---

## 2. Main Domain Folders & Sub-Domains

| # | Domain Folder | Sub-Domains | What Lives Here |
| :-: | :--- | :--- | :--- |
| **1** | **`admin/`** | `dashboard`, `users`, `content`, `usage`, `finance`, `scrapers`, `jobs`, `settings` | Admin dashboard, admin pages, superuser controls, system metrics, users management, moderation logs, telemetry |
| **2** | **`landing/`** | `hero`, `demo`, `features`, `pricing`, `faq` | Public landing page, interactive demo reels, feature showcase, pricing tiers, creator marketing |
| **3** | **`auth/`** | `login`, `register`, `forgot-password`, `oauth`, `session` | Login, Register, Reset Password, OAuth2 (Google/GitHub), JWT sessions, security audit logs |
| **4** | **`workspace/`** | `shell`, `imported-assets`, `storyboard`, `viewer`, `preview-video` | Studio shell, imported-assets tray, storyboard scene breakdown, continuous vertical webtoon viewer, preview-video |
| **5** | **`image-editor/`** | `canvas`, `drawing`, `layers`, `auto-crop`, `splitter`, `enhancements`, `merge` | Canvas, drawing annotations, layers stack, auto-crop panel detection, splitter, AI enhancements, merge stitching |
| **6** | **`video-editor/`** | `timeline`, `audio`, `cuts`, `render`, `playback` | Video timeline, multi-track audio/TTS mixer, scene cuts & transitions, FFmpeg render, real-time playback |
| **7** | **`creative/`** | `suite`, `agent`, `optimizer`, `panel-gen`, `voice`, `thumbnails`, `translation`, `youtube` | Suite hub, AI director agent, optimizer, panel-gen, voice synthesis, YouTube thumbnail generator, translation, YouTube publishing |
| **8** | **`platform/`** | `dashboard`, `projects`, `notifications`, `terminal`, `shortcuts`, `scraper`, `jobs`, `shell` | Dashboard overview, Projects & chapters management, Notifications center, Web developer terminal, Keyboard shortcuts, Webtoon scraper, Background jobs |
| **9** | **`profile/`** | `profile`, `account`, `settings`, `api-keys`, `billing` | User profile, creator bio & avatar, account security, app settings, developer API keys, billing invoices, credit wallet |
| **10** | **`intelligence/`** | `core`, `series-studio`, `routing`, `models`, `playground`, `keys`, `wallet` | AI core hub, series studio, character lore & continuity memory, multi-provider model routing, playground, BYO API keys, credit wallet |
