# Sonikoma Frontend Architecture

This document outlines the client-side architecture of the Sonikoma workspace editor, its rendering loops, timeline structures, and state management conventions.

---

## 🎨 1. Widescreen Inline Editor Layout

The Sonikoma layout is designed around a premium, widescreen single-page workspace in **`EditorPage.tsx`**. The workspace avoids floating draggable modals to maintain a clean, flat aesthetic:

- **Sidebar Menu (`EditorSidebar.tsx`):** A collapsible vertical navigation menu on the left border giving access to scraping, cropping, layers, audio, and settings.
- **Story Director Control Panel (`StoryDirectorPanel.tsx`):** Positioned inline above the timeline. Handles central story inputs (Genre, Tone, Character Profiles) and coordinates full sequence analyses.
- **Cinema Player (`CinemaPlayer.tsx`):** Positioned inline in a widescreen card above the storyboard, serving as the central preview canvas.
- **Storyboard Timeline (`TimelineCard.tsx` / `TimelineHeader.tsx`):** Positioned horizontally at the bottom. Displays panel indices, text areas with custom thin scrollbars, transition triggers, and sync indicators.

---

## 🎬 2. Cinema Player Layered Composition Engine

The Cinema Player (**`CinemaPlayer.tsx`**) acts as a client-side layout player that compiles raw image layers on top of each other using native browser DOM coordinates, entirely eliminating video compiling during the editing phase:

```text
┌────────────────────────────────────────────────────────┐
│ CinemaPlayer Aspect-Locked Viewport Wrapper             │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 1. Background Layer (Pillow-rendered artwork)    │  │
│  │    [CSS Pan / Zoom Transitions]                  │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │ 2. Character Layer (Isolated PNG)          │  │  │
│  │  │    [Framer Motion soft breathing wiggle]   │  │  │
│  │  │  ┌──────────────────────────────────────┐  │  │  │
│  │  │  │ 3. Speech Bubble / Subtitles Layer    │  │  │  │
│  │  │  │    [Framer Motion delayed pop-in]    │  │  │  │
│  │  │  └──────────────────────────────────────┘  │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### Key Technologies & Features:
* **Aspect-Lock Scaling:** Wraps the composite viewport in a container that detects sizing via `ResizeObserver`. It automatically computes a scale factor and applies `transform: scale(scaleFactor)` to ensure layers render at pixel-perfect coordinate models on any mobile, tablet, or widescreen viewport.
* **HTML5 Live Audio Mixer:** Integrates an active pool of HTML5 audio elements synchronized to the timeline scrubber. It plays narration tracks (`audio_url`) and overlays sound effects (`sfx`) dynamically on panel transitions.
* **Framer Motion Wiggles & Pops:** Character layers execute a soft, continuous 2D breathe hover animation using `motion/react` wiggles. Speech bubbles scale in with a spring-based elastic bounce.
* **Widescreen HUD Control Overlay:** Embedded controls provide Picture-in-Picture toggles, skip pills, seek buttons, and keybinding listeners (e.g., Space to Play/Pause, L to Loop, Numeric percentage jumps).

---

## ⚡ 3. Client State Synchronizations

To prevent infinite render loops in React when saving heavy coordinate or metadata edits across the timeline, Sonikoma employs decoupling hooks:

- **Zustand Store (`useProjectStore`):** Centralizes project panel models and scraping outputs.
- **Image Editor Synchronization Hook (`useImageEditor.ts`):** Avoids passing parent state arrays into effect dependencies. Instead, it maintains a reference parameter (`activeImageUrlRef`) to buffer network responses, breaking potential infinite-loop circular updates.
- **Web Speech API Voice Matching Hook (`usePlaybackEngine.ts`):** Automatically scores local TTS speech synthesis voices on the client browser based on preferred non-English locales (e.g., Korean, Japanese, Chinese, Tamil) and falls back dynamically to match character profiles when no native backend TTS audio is compiled.
- **Eager Loading Optimization:** Scraped comic images in panels use native `loading="eager"` attributes to prevent Chromium lazy-loading interventions from wiping off-screen images in horizontally scrollable decks.
