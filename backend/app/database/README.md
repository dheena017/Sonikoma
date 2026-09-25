# Database Structure

Sonikoma supports two database engines through one application interface:

- SQLite is used for local development.
- PostgreSQL/Supabase is used when `NODE_ENV=production` and `DATABASE_URL` is configured.

## Source of truth

- `schema.sql` is the canonical SQLite schema.
- `schema_postgres.sql` is the canonical PostgreSQL schema.
- `migrator.py` contains backward-compatible upgrades for databases created by older versions.
- `engine.py` provides the shared connection interface used by repositories.

Do not add a new table only to `migrator.py`. Add it to both schema files first, then add a migration block only when existing installations need an upgrade.

## Table groups

### Project content

- `users`: creator accounts and account settings.
- `series`: top-level comic or webtoon metadata.
- `chapters`: episodes or editor projects belonging to a series.
- `panels`: storyboard images, dialogue, motion, audio, and image-edit settings.
- `jobs`: persistent background processing jobs.

### Scraping and editing

- `scrape_sessions`: scraped image lists and scrape metadata.
- `edit_history`: completed image-edit records.
- `scraper_rules`: per-domain scraper limits and behavior.
- `chapter_cache`: chapter discovery cache.
- `series_chapters_cache`: series chapter discovery cache.
- `scraper_l1_cache`: short-lived HTML cache.
- `scraper_l5_cache`: idempotent scraper result cache.

### Account, billing, and security

- `user_sessions`: active device sessions.
- `user_audit_logs`: account and security events.
- `user_invoices`: billing invoice records.
- `user_api_keys`: developer API credentials.
- `credit_transactions`: credit grants and usage ledger.
- `platform_settings`: application-wide settings.
- `system_announcements`: admin announcements.
- `content_moderation_logs`: moderation actions and state changes.

### AI and system observability

- `token_usage_logs`: model token and cost usage by project.
- `system_logs`: application and pipeline logs.
- `ai_token_usage_ledger`: analytics ledger created by the AI analytics API.
- `ai_usage_ledger`: Supabase-managed AI usage table used by the AI orchestrator.

### YouTube integration

- `youtube_profiles`: reusable publishing profiles.
- `youtube_publications`: published video history.
- `youtube_credentials`: per-user YouTube application credentials.
- `youtube_oauth_tokens`: OAuth access and refresh tokens.
- `user_youtube_channels`: connected channels.
- `user_unlinked_youtube_channels`: channels explicitly unlinked by a user.

## External Supabase table

- `projects` is accessed through the Supabase client by the project service. It is not created by the local SQLite/PostgreSQL schema files and must be managed in the Supabase database separately.

## Change checklist

1. Confirm the table is not already represented by an existing table or cache.
2. Add the table and indexes to both canonical schema files.
3. Add foreign keys for ownership and parent-child relationships.
4. Add an idempotent migration in `migrator.py` only for existing installations.
5. Test SQLite initialization locally.
6. Test PostgreSQL/Supabase migration separately before production rollout.
7. Keep secrets out of logs, backups, and client-side code.
