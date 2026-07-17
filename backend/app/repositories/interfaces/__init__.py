"""
backend/app/repositories/interfaces/__init__.py
─────────────────────────────────────────────────────────────────────────────
Public interface exports for all abstract repository contracts.
─────────────────────────────────────────────────────────────────────────────
"""

from repositories.interfaces.project import (
    IProjectRepository,
    IPanelRepository,
    ISeriesRepository,
    ITokenRepository,
)
from repositories.interfaces.user import (
    IUserRepository,
    ISessionRepository,
    ICreditRepository,
)
from repositories.interfaces.system import (
    ISystemRepository,
)
from repositories.interfaces.scraper import (
    IScraperRepository,
)
from repositories.interfaces.youtube import (
    IYouTubeRepository,
)

__all__ = [
    "IProjectRepository",
    "IPanelRepository",
    "ISeriesRepository",
    "ITokenRepository",
    "IUserRepository",
    "ISessionRepository",
    "ICreditRepository",
    "ISystemRepository",
    "IScraperRepository",
    "IYouTubeRepository",
]
