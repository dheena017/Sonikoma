# Dashboard Engine

The dashboard engine produces fully offline HTML reports using Jinja2 templates.

## Features
- No CDNs or external dependencies.
- Embedded CSS & JS.
- Dark mode toggle.
- Responsive CSS Grid layout.
- Auto-generates from `FullReport` via `DashboardBuilder`.

## Widgets
- `SummaryWidget`: A quick top-level metric.
- `TableWidget`: Data table for findings.
