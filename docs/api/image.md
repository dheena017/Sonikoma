# 🎨 Image Processing API

Endpoints for proxying, editing, and manipulating comic panels.

| Endpoint                           | Method | Input Parameters                                | Description                                                        |
| :--------------------------------- | :----- | :---------------------------------------------- | :----------------------------------------------------------------- |
| `/api/proxy-image`                 | `GET`  | `url` (Webtoon source image)                    | Proxies external images to bypass Referer headers and CORS blocks. |
| `/api/image/edit`                  | `POST` | `imageUrl`, `actions` (crop, rotate, flip)      | Edits an image frame and caches the buffer.                        |
| `/api/image/merge`                 | `POST` | `imageUrls`, `direction` (h/v), `gap`           | Combines multiple panels into a stitched image.                    |
| `/api/image/remove-speech-bubbles` | `POST` | `imageUrl`, `method`, `sensitivity`, `dilation` | Cleans dialog bubbles via Python OpenCV inpainting.                |
| `/api/image/download-zip`          | `POST` | `imageUrls`, `projectName`                      | Compresses panel frames into a ZIP buffer.                         |
| `/api/image/download-zip/get/:id`  | `GET`  | `:id` (temporary UUID)                          | Downloads the generated ZIP file.                                  |
