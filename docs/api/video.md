# 🗣️ Audio & Video API

Endpoints for TTS generation and video compilation.

| Endpoint                       | Method | Input Parameters                  | Description                                      |
| :----------------------------- | :----- | :-------------------------------- | :----------------------------------------------- |
| `/api/convert-images-to-video` | `POST` | `panels` (array of frames), `fps` | Runs MoviePy compiler to compile cinematic MP4.  |
| `/api/generate-tts`            | `POST` | `text`, `voice`                   | Generates speech narration audio using Edge-TTS. |
