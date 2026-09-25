# 🎨 Image Processing API

Endpoints for proxying, editing, and manipulating comic panels.

| Endpoint                              | Method | Input Parameters                                | Description                                                        |
| :------------------------------------ | :----- | :---------------------------------------------- | :----------------------------------------------------------------- |
| `/api/v1/proxy/image`                 | `GET`  | `url` (Webtoon source image)                    | Proxies external images to bypass Referer headers and CORS blocks. |
| `/api/v1/image/edit`                  | `POST` | `imageUrl`, `actions` (crop, rotate, flip)      | Edits an image frame and caches the buffer.                        |
| `/api/v1/image/merge`                 | `POST` | `imageUrls`, `direction` (h/v), `gap`           | Combines multiple panels into a stitched image.                    |
| `/api/v1/image/remove-speech-bubbles` | `POST` | `imageUrl`, `method`, `sensitivity`, `dilation` | Cleans dialog bubbles via Python OpenCV inpainting.                |
| `/api/v1/image/download-zip`          | `POST` | `imageUrls`, `projectName`                      | Compresses panel frames into a ZIP buffer.                         |
| `/api/v1/image/download-zip/get/:id`  | `GET`  | `:id` (temporary UUID)                          | Downloads the generated ZIP file.                                  |
