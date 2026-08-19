"""
backend/app/openapi/theme.py
─────────────────────────────────────────────────────────────────────────────
Cyberpunk Dark Neon Theme CSS & Custom Navigation Bars for Swagger UI.
─────────────────────────────────────────────────────────────────────────────
"""

from app.openapi.config import CATEGORY_METADATA


def get_swagger_dark_theme_css() -> str:
    """Returns custom styling for the developer console Swagger UI."""
    return """
    <style>
        /* ── Modern Obsidian Neon Theme for Sonikoma Swagger UI ── */
        :root {
            --bg-base: #080c15;
            --bg-card: #0f172a;
            --bg-card-alt: #131d35;
            --bg-surface: #1e293b;
            --border-subtle: #1e293b;
            --border-highlight: #334155;
            
            --text-primary: #f8fafc;
            --text-secondary: #cbd5e1;
            --text-muted: #94a3b8;
            
            --neon-primary: #6366f1;
            --neon-purple: #a855f7;
            --neon-pink: #ec4899;
            --neon-cyan: #06b6d4;
            --neon-emerald: #10b981;
            --neon-amber: #f59e0b;
            --neon-rose: #f43f5e;
        }

        body {
            background-color: var(--bg-base) !important;
            color: var(--text-secondary) !important;
            font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }

        .swagger-ui {
            color: var(--text-secondary) !important;
        }
        .swagger-ui .topbar {
            display: none !important;
        }

        /* ── Sticky Top Header ── */
        .sonikoma-top-nav {
            background: rgba(8, 12, 21, 0.88) !important;
            border-bottom: 1px solid rgba(30, 41, 59, 0.8) !important;
            padding: 12px 24px !important;
            position: sticky !important;
            top: 0 !important;
            z-index: 9999 !important;
            backdrop-filter: blur(20px) !important;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5) !important;
        }
        .sonikoma-top-nav .nav-container {
            max-width: 1440px !important;
            margin: 0 auto !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 16px !important;
            flex-wrap: wrap !important;
        }
        .sonikoma-top-nav .brand-link {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            text-decoration: none !important;
        }
        .sonikoma-top-nav .brand-icon {
            font-size: 22px !important;
            filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.6));
        }
        .sonikoma-top-nav .brand-title {
            font-size: 20px !important;
            font-weight: 800 !important;
            color: #f8fafc !important;
            letter-spacing: -0.5px !important;
            background: linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%) !important;
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
        }
        .sonikoma-top-nav .brand-badge {
            background: rgba(99, 102, 241, 0.15) !important;
            color: #a5b4fc !important;
            border: 1px solid rgba(99, 102, 241, 0.35) !important;
            font-size: 11px !important;
            font-weight: 700 !important;
            padding: 2px 8px !important;
            border-radius: 9999px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
        }
        .sonikoma-top-nav .nav-links {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            flex-wrap: wrap !important;
        }
        .sonikoma-top-nav .nav-link-btn {
            display: inline-flex !important;
            align-items: center !important;
            gap: 6px !important;
            padding: 7px 14px !important;
            border-radius: 8px !important;
            font-size: 13px !important;
            font-weight: 600 !important;
            text-decoration: none !important;
            color: #cbd5e1 !important;
            background: #0f172a !important;
            border: 1px solid #1e293b !important;
            transition: all 0.2s ease !important;
        }
        .sonikoma-top-nav .nav-link-btn:hover {
            background: #1e293b !important;
            color: #f8fafc !important;
            border-color: #475569 !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
        }
        .sonikoma-top-nav .nav-link-btn.cta {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
            color: #ffffff !important;
            border-color: #6366f1 !important;
            box-shadow: 0 0 16px rgba(99, 102, 241, 0.45) !important;
        }
        .sonikoma-top-nav .nav-link-btn.cta:hover {
            box-shadow: 0 0 24px rgba(99, 102, 241, 0.7) !important;
            transform: translateY(-1px) !important;
        }
        .sonikoma-top-nav .nav-link-btn.outline {
            background: transparent !important;
            border-color: #334155 !important;
            color: #94a3b8 !important;
        }
        .sonikoma-top-nav .nav-link-btn.outline:hover {
            border-color: #818cf8 !important;
            color: #818cf8 !important;
        }

        /* ── Category Switcher Sub-Bar ── */
        .category-switcher-bar {
            background: rgba(13, 19, 34, 0.95) !important;
            border-bottom: 1px solid #1e293b !important;
            padding: 10px 24px !important;
            overflow-x: auto !important;
            white-space: nowrap !important;
        }
        .category-switcher-container {
            max-width: 1440px !important;
            margin: 0 auto !important;
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
        }
        .category-pill {
            display: inline-flex !important;
            align-items: center !important;
            gap: 6px !important;
            padding: 6px 14px !important;
            border-radius: 9999px !important;
            font-size: 13px !important;
            font-weight: 600 !important;
            text-decoration: none !important;
            color: #94a3b8 !important;
            background: #0f172a !important;
            border: 1px solid #1e293b !important;
            transition: all 0.2s ease !important;
        }
        .category-pill:hover {
            background: #1e293b !important;
            color: #f1f5f9 !important;
            border-color: #475569 !important;
            transform: translateY(-1px) !important;
        }
        .category-pill.active {
            background: rgba(99, 102, 241, 0.22) !important;
            color: #c7d2fe !important;
            border-color: #6366f1 !important;
            box-shadow: 0 0 16px rgba(99, 102, 241, 0.35) !important;
            font-weight: 700 !important;
        }

        /* ── Info & Documentation Block ── */
        .swagger-ui .wrapper {
            max-width: 1440px !important;
            padding: 0 24px !important;
        }
        .swagger-ui .info {
            margin: 32px 0 !important;
        }
        .swagger-ui .info .title {
            color: #f8fafc !important;
            font-size: 32px !important;
            font-weight: 900 !important;
            letter-spacing: -0.5px !important;
            background: linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%) !important;
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
        }
        .swagger-ui .info p, .swagger-ui .info li {
            color: #94a3b8 !important;
            font-size: 14.5px !important;
            line-height: 1.75 !important;
        }
        .swagger-ui .info h2, .swagger-ui .info h3 {
            color: #f1f5f9 !important;
            font-weight: 700 !important;
            margin-top: 24px !important;
        }
        .swagger-ui .info code {
            background: #1e293b !important;
            color: #38bdf8 !important;
            padding: 3px 7px !important;
            border-radius: 6px !important;
            border: 1px solid #334155 !important;
            font-size: 13px !important;
            font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
        }
        .swagger-ui .info pre {
            background: #090d16 !important;
            border: 1px solid #1e293b !important;
            border-radius: 10px !important;
            padding: 16px !important;
            color: #e2e8f0 !important;
        }

        /* ── Scheme Container (Authorize & Filter) ── */
        .swagger-ui .scheme-container {
            background: #0f172a !important;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
            border: 1px solid #1e293b !important;
            border-radius: 14px !important;
            padding: 18px 24px !important;
            margin-bottom: 28px !important;
        }
        .swagger-ui .filter .operation-filter-input {
            background: #1e293b !important;
            border: 1px solid #475569 !important;
            color: #f8fafc !important;
            border-radius: 8px !important;
            padding: 10px 16px !important;
            font-size: 14px !important;
            box-shadow: 0 0 14px rgba(99, 102, 241, 0.15) !important;
            transition: all 0.2s ease !important;
        }
        .swagger-ui .filter .operation-filter-input:focus {
            border-color: #818cf8 !important;
            outline: none !important;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3) !important;
        }

        /* ── Tag Accordion Headers ── */
        .swagger-ui .opblock-tag {
            border-bottom: 1px solid #1e293b !important;
            padding: 16px 6px !important;
            color: #f8fafc !important;
            font-size: 18px !important;
            font-weight: 700 !important;
            letter-spacing: -0.2px !important;
        }
        .swagger-ui .opblock-tag small {
            color: #94a3b8 !important;
            font-weight: normal !important;
            font-size: 13.5px !important;
            margin-left: 10px !important;
        }
        .swagger-ui .opblock-tag:hover {
            color: #818cf8 !important;
        }

        /* ── Operation Cards (Vibrant Neon Color Coded) ── */
        .swagger-ui .opblock {
            background: #0f172a !important;
            border-radius: 12px !important;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3) !important;
            margin-bottom: 14px !important;
            border: 1px solid #1e293b !important;
            transition: all 0.2s ease !important;
        }
        .swagger-ui .opblock:hover {
            border-color: #334155 !important;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4) !important;
        }

        /* GET: Emerald */
        .swagger-ui .opblock.opblock-get {
            border-color: rgba(16, 185, 129, 0.35) !important;
            background: rgba(16, 185, 129, 0.04) !important;
        }
        .swagger-ui .opblock.opblock-get .opblock-summary-method {
            background: #059669 !important;
            color: #ffffff !important;
            border-radius: 7px !important;
            font-weight: 800 !important;
            box-shadow: 0 0 10px rgba(16, 185, 129, 0.35) !important;
        }

        /* POST: Indigo */
        .swagger-ui .opblock.opblock-post {
            border-color: rgba(99, 102, 241, 0.35) !important;
            background: rgba(99, 102, 241, 0.04) !important;
        }
        .swagger-ui .opblock.opblock-post .opblock-summary-method {
            background: #4f46e5 !important;
            color: #ffffff !important;
            border-radius: 7px !important;
            font-weight: 800 !important;
            box-shadow: 0 0 10px rgba(99, 102, 241, 0.35) !important;
        }

        /* PUT: Amber */
        .swagger-ui .opblock.opblock-put {
            border-color: rgba(245, 158, 11, 0.35) !important;
            background: rgba(245, 158, 11, 0.04) !important;
        }
        .swagger-ui .opblock.opblock-put .opblock-summary-method {
            background: #d97706 !important;
            color: #ffffff !important;
            border-radius: 7px !important;
            font-weight: 800 !important;
            box-shadow: 0 0 10px rgba(245, 158, 11, 0.35) !important;
        }

        /* DELETE: Crimson */
        .swagger-ui .opblock.opblock-delete {
            border-color: rgba(239, 68, 68, 0.35) !important;
            background: rgba(239, 68, 68, 0.04) !important;
        }
        .swagger-ui .opblock.opblock-delete .opblock-summary-method {
            background: #dc2626 !important;
            color: #ffffff !important;
            border-radius: 7px !important;
            font-weight: 800 !important;
            box-shadow: 0 0 10px rgba(239, 68, 68, 0.35) !important;
        }

        /* PATCH: Cyan */
        .swagger-ui .opblock.opblock-patch {
            border-color: rgba(6, 182, 212, 0.35) !important;
            background: rgba(6, 182, 212, 0.04) !important;
        }
        .swagger-ui .opblock.opblock-patch .opblock-summary-method {
            background: #0891b2 !important;
            color: #ffffff !important;
            border-radius: 7px !important;
            font-weight: 800 !important;
            box-shadow: 0 0 10px rgba(6, 182, 212, 0.35) !important;
        }

        .swagger-ui .opblock .opblock-summary-path {
            color: #f1f5f9 !important;
            font-weight: 600 !important;
            font-size: 14.5px !important;
        }
        .swagger-ui .opblock .opblock-summary-description {
            color: #94a3b8 !important;
            font-size: 13.5px !important;
        }
        .swagger-ui .opblock-body {
            background: #090d16 !important;
            border-top: 1px solid #1e293b !important;
            padding: 20px !important;
        }
        .swagger-ui .opblock-section-header {
            background: #0f172a !important;
            border-bottom: 1px solid #1e293b !important;
            padding: 8px 16px !important;
        }
        .swagger-ui .opblock-section-header h4 {
            color: #cbd5e1 !important;
            font-weight: 700 !important;
        }

        /* ── Parameters & Tables ── */
        .swagger-ui table thead tr th {
            color: #94a3b8 !important;
            border-bottom: 1px solid #1e293b !important;
            font-size: 13px !important;
        }
        .swagger-ui .parameter__name {
            color: #38bdf8 !important;
            font-weight: 700 !important;
            font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
        }
        .swagger-ui .parameter__name.required:after {
            color: #f43f5e !important;
        }
        .swagger-ui .parameter__type {
            color: #c084fc !important;
            font-weight: 600 !important;
        }
        .swagger-ui .parameter__in {
            color: #64748b !important;
            font-style: italic !important;
        }

        /* ── Form Controls & Inputs ── */
        .swagger-ui input[type=text], .swagger-ui select, .swagger-ui textarea {
            background: #1e293b !important;
            border: 1px solid #334155 !important;
            color: #f8fafc !important;
            border-radius: 8px !important;
            padding: 8px 14px !important;
            font-family: inherit !important;
            transition: all 0.2s ease !important;
        }
        .swagger-ui input[type=text]:focus, .swagger-ui select:focus, .swagger-ui textarea:focus {
            border-color: #818cf8 !important;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25) !important;
            outline: none !important;
        }

        /* ── Buttons ── */
        .swagger-ui .btn {
            border-radius: 8px !important;
            font-weight: 600 !important;
            border: 1px solid #475569 !important;
            color: #f1f5f9 !important;
            background: #1e293b !important;
            transition: all 0.2s ease !important;
        }
        .swagger-ui .btn:hover {
            background: #334155 !important;
            color: #ffffff !important;
        }
        .swagger-ui .btn.execute {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
            border-color: #6366f1 !important;
            color: #fff !important;
            box-shadow: 0 0 16px rgba(99, 102, 241, 0.4) !important;
        }
        .swagger-ui .btn.execute:hover {
            opacity: 0.95 !important;
            box-shadow: 0 0 24px rgba(99, 102, 241, 0.65) !important;
            transform: translateY(-1px) !important;
        }
        .swagger-ui .btn.authorize {
            background: transparent !important;
            border-color: #10b981 !important;
            color: #10b981 !important;
            font-weight: 700 !important;
        }
        .swagger-ui .btn.authorize:hover {
            background: rgba(16, 185, 129, 0.15) !important;
        }
        .swagger-ui .btn.authorize svg {
            fill: #10b981 !important;
        }

        /* ── Response Section ── */
        .swagger-ui .responses-inner {
            background: #0f172a !important;
            border-radius: 10px !important;
            padding: 16px !important;
            border: 1px solid #1e293b !important;
        }
        .swagger-ui .response-col_status {
            color: #34d399 !important;
            font-weight: 800 !important;
            font-size: 15px !important;
        }
        .swagger-ui .response-col_description {
            color: #cbd5e1 !important;
        }
        .swagger-ui .highlight-code {
            background: #050811 !important;
            border: 1px solid #1e293b !important;
            border-radius: 10px !important;
        }
        .swagger-ui .microlight {
            color: #e2e8f0 !important;
        }

        /* ── Models Accordion ── */
        .swagger-ui section.models {
            border: 1px solid #1e293b !important;
            border-radius: 14px !important;
            background: #0f172a !important;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25) !important;
        }
        .swagger-ui section.models h4 {
            color: #f1f5f9 !important;
            font-weight: 700 !important;
        }
        .swagger-ui .model-box {
            background: #090d16 !important;
            border-radius: 8px !important;
            padding: 12px !important;
        }
        .swagger-ui .model-title {
            color: #818cf8 !important;
            font-weight: 700 !important;
        }
        .swagger-ui .prop-type {
            color: #38bdf8 !important;
        }

        /* ── Scrollbars ── */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: #080c15;
        }
        ::-webkit-scrollbar-thumb {
            background: #334155;
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #6366f1;
        }
    </style>
    """


def get_swagger_navbar_html(current_category: str = "all") -> str:
    """Generates the top header and category pill navigation bar."""
    category_clean = (current_category or "all").lower()

    pills_html = "".join([
        f'<a href="{c["path"]}" class="category-pill {"active" if c["id"] == category_clean else ""}">{c["label"]}</a>'
        for c in CATEGORY_METADATA
    ])

    return f"""
    <header class="sonikoma-top-nav">
      <div class="nav-container">
        <div class="nav-brand">
          <a href="/" class="brand-link" title="Open Sonikoma Studio Web App">
            <span class="brand-icon">⚡</span>
            <span class="brand-title">Sonikoma</span>
            <span class="brand-badge">Studio API</span>
          </a>
        </div>
        <div class="nav-links">
          <a href="/" class="nav-link-btn cta">
            <span>🚀 Open Web App</span>
          </a>
          <a href="/admin/dashboard" class="nav-link-btn">
            <span>🛡️ Admin Space</span>
          </a>
          <a href="/admin/jobs" class="nav-link-btn">
            <span>⚡ Background Jobs</span>
          </a>
          <a href="/ai-core/models" class="nav-link-btn">
            <span>🧠 AI Models</span>
          </a>
          <a href="/api/health" target="_blank" class="nav-link-btn">
            <span>💚 Health</span>
          </a>
          <a href="/api/redoc" class="nav-link-btn">
            <span>📖 ReDoc</span>
          </a>
          <a href="/api/openapi.json" target="_blank" class="nav-link-btn outline">
            <span>{{ }} OpenAPI JSON</span>
          </a>
        </div>
      </div>
    </header>
    <nav class="category-switcher-bar">
      <div class="category-switcher-container">
        {pills_html}
      </div>
    </nav>
    """
