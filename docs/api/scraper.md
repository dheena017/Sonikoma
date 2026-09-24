# 🕸️ Scraper & Generation API

Endpoints for crawling webtoons and generating storyboards.

| Endpoint             | Method | Input Parameters               | Description                                      |
| :------------------- | :----- | :----------------------------- | :----------------------------------------------- |
| `/api/v1/scraper/scrape-images` | `POST` | `url` (Webtoon series episode) | Webtoon crawler script downloading comic images. |
| `/api/v1/ai/generate`      | `POST` | `panels`                       | Generates AI storyboards from raw images.        |
