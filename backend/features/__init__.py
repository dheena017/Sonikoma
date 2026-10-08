"""
backend/features
─────────────────────────────────────────────────────────────────────────────
Sonikoma Domain-Driven Architecture Package
Exposes domain feature routers on-demand via __getattr__ to avoid
eagerly importing heavy machine learning submodules during package load.
─────────────────────────────────────────────────────────────────────────────
"""

_ROUTER_MAP = {
    "auth_router": ("features.auth.router", "router"),
    "profile_router": ("features.profile.router", "router"),
    "admin_router": ("features.admin.router", "router"),
    "platform_router": ("features.platform.router", "router"),
    "workspace_router": ("features.workspace.router", "router"),
    "image_editor_router": ("features.image_editor.router", "router"),
    "video_editor_router": ("features.video_editor.router", "router"),
    "creative_router": ("features.creative.router", "router"),
    "intelligence_router": ("features.intelligence.router", "router"),
    "landing_router": ("features.landing.router", "router"),
}


def __getattr__(name: str):
    if name in _ROUTER_MAP:
        mod_name, attr = _ROUTER_MAP[name]
        import importlib
        mod = importlib.import_module(mod_name)
        val = getattr(mod, attr)
        globals()[name] = val
        return val
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")


__all__ = list(_ROUTER_MAP.keys())
