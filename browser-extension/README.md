# Sonikoma AI Studio — Browser Extension (Manifest V3)

> AI-powered webtoon & manga motion video engine, real-time voice dubber, high-res chapter downloader, and viral shorts maker.

---

## 🚀 How to Install & Load in Chrome / Edge / Brave

1. Open **Google Chrome** (or Edge / Brave / Opera).
2. Navigate to `chrome://extensions` in your address bar.
3. Toggle on **"Developer mode"** in the top-right corner.
4. Click the **"Load unpacked"** button in the top-left corner.
5. Select the compiled **`browser-extension/dist`** folder:
   ```
   c:\Users\dheen\project\Sonikoma\browser-extension\dist
   ```
6. The **Sonikoma AI Studio** extension icon will now appear in your browser toolbar!

---

## 🌟 Key Features & How to Use

| Feature | How to Use |
| :--- | :--- |
| **🎛️ SidePanel Mini-Studio** | Press `Alt + S` on any manga chapter or click "Open Mini-Studio" in the extension popup. |
| **🔊 Live Speech Bubble Dubber** | Hover over any dialogue balloon on the reading page to play instant AI voice acting. |
| **🍿 Hands-Free Cinema Mode** | Click "Start Cinema Mode" in popup or press `Space` to auto-scroll with dialogue pacing. |
| **✂️ 9:16 Shorts / Panel Snipper** | Press `Alt + P` and drag a crop box over any hype panel on screen. |
| **📥 High-Res Chapter Downloader** | Press `Alt + D` or right-click any page -> *"Download High-Res Chapter (ZIP)"*. |
| **⚡ 1-Click Web Studio Launch** | Click the floating badge on any webtoon to import the whole chapter into Sonikoma Studio. |

---

## ⌨️ Global Keyboard Shortcuts

- `Alt + S` / `Option + S` : Toggle SidePanel Mini-Studio
- `Alt + P` / `Option + P` : Launch Drag-to-Select Panel Snipper
- `Alt + D` / `Option + D` : 1-Click High-Res Chapter Downloader
- `Spacebar` : Play / Pause Voice Dub in Cinema Mode

---

## 🔗 Real Backend API Integration

The extension connects directly to Sonikoma's FastAPI backend:
- Neural Voices: `GET /api/v1/audio/voices`
- TTS Synthesis: `POST /api/v1/audio/tts`
- Vision AI & Panel OCR: `POST /api/analyze-single-image`
- Video Rendering: `POST /api/v1/video/render`
- Web Studio Bridge: `/scraper?url=...`
