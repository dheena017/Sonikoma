# Export Sub-Domain (`backend/features/creative/export/`)

## 1. Overview
The **Export Sub-Domain** handles video distribution, YouTube OAuth2 authorization, automated uploads, and channel metadata templates.

Following the standard sub-domain pattern:
- **`router.py`**: API endpoints mounting credentials, profiles, and YouTube publishing.
- **`schemas.py`**: Pydantic models for export parameters and credentials.
- **`service.py`**: `ExportService` facade class and `export_service` singleton.
- **`services/`**: Underlying YouTube OAuth, metadata, uploader, and workflow pipelines.
- **`README.md`**: Architecture and endpoint documentation.

---

## 2. Directory Layout

```
backend/features/creative/export/
├── __init__.py                  # Sub-domain exports
├── README.md                    # Sub-domain documentation
├── router.py                    # Master export router
├── credentials.py               # Custom Google/YouTube client keys
├── profiles.py                  # Channel video defaults templates
├── youtube.py                   # YouTube OAuth, channels, upload, playlists
├── schemas.py                   # Export Pydantic schemas
├── service.py                   # ExportService facade & export_service singleton
└── services/                    # Underlying distribution services
    ├── __init__.py              # Service exports
    └── youtube/                 # YouTube API integration
        ├── __init__.py
        ├── metadata.py          # Video metadata builder
        ├── oauth.py             # OAuth2 token exchange & channel resolution
        ├── service.py           # YouTubeService API client
        ├── upload.py            # Resumable video uploader
        └── workflow.py          # Complete upload & publishing workflow
```

---

## 3. Endpoints

| Method | Endpoint | Summary | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/export/youtube` | Publish Video | Runs the end-to-end automated YouTube publishing workflow. |
| `GET` | `/api/v1/export/youtube/channels` | Linked Channels | Lists authenticated YouTube channels for user. |
| `POST` | `/api/v1/export/youtube/select-channel` | Select Active Channel | Switches the active channel context. |
| `GET` | `/api/v1/export/youtube/profiles` | Publishing Profiles | Lists saved metadata templates for quick publishing. |
| `POST` | `/api/v1/export/youtube/credentials` | Custom Credentials | Saves user custom Google Cloud OAuth client keys. |
| `GET` | `/api/v1/export/youtube/history` | Publishing History | Lists past publication records and YouTube video links. |
