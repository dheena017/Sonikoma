# 🕸️ Scraper & Generation API

Endpoints for crawling webtoons and generating storyboards.

| Endpoint             | Method | Input Parameters               | Description                                       |
| :------------------- | :----- | :----------------------------- | :------------------------------------------------ |
| `/api/scrape-images` | `POST` | `url` (Webtoon series episode) | Webtoon crawler script downloading comic images.  |
| `/api/generate`      | `POST` | `panels`                       | Generates AI storyboards from raw images.         |
