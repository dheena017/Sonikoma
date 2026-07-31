"""
backend/app/repositories/interfaces/project.py
─────────────────────────────────────────────────────────────────────────────
Abstract interface contracts for Project, Panel, Series, and Token repositories.
─────────────────────────────────────────────────────────────────────────────
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class IProjectRepository(ABC):
    """Abstract interface contract for Project repository CRUD operations."""

    @abstractmethod
    def insert_project(self, data: Dict[str, Any]) -> None:
        """Inserts or updates a project by mapping to Series/Chapters schema."""
        pass

    @abstractmethod
    def get_all_projects(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieves all projects, optionally filtered by user_id."""
        pass

    @abstractmethod
    def get_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single project by project_id."""
        pass

    @abstractmethod
    def get_project_by_slug(self, chapter_slug: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single project by chapter_slug."""
        pass

    @abstractmethod
    def update_project(self, project_id: str, updates: Dict[str, Any]) -> None:
        """Updates basic project metadata fields."""
        pass

    @abstractmethod
    def increment_project_tokens(self, project_id: str, tokens: int) -> None:
        """Accumulates total_tokens_used for a project."""
        pass

    @abstractmethod
    def update_project_full(self, project_id: str, updates: Dict[str, Any], panels: Optional[List[Dict[str, Any]]] = None) -> None:
        """Atomically updates project metadata and syncs panel lists."""
        pass

    @abstractmethod
    def delete_project(self, project_id: str) -> None:
        """Deletes a project, its panels, and cleans up compiled video and cache."""
        pass

    @abstractmethod
    def get_all_projects_admin(self) -> List[Dict[str, Any]]:
        """Admin helper to retrieve all series configurations with owner emails."""
        pass


class IPanelRepository(ABC):
    """Abstract interface contract for Panel storyboarding operations."""

    @abstractmethod
    def insert_panels(self, project_id: str, panels: List[Dict[str, Any]]) -> None:
        """Inserts multiple panels in a single transaction."""
        pass

    @abstractmethod
    def get_panels(self, project_id: str) -> List[Dict[str, Any]]:
        """Retrieves all storyboard panels for a project ordered by panel index."""
        pass

    @abstractmethod
    def delete_panels(self, project_id: str) -> None:
        """Deletes all panels and clears cached files for a project."""
        pass

    @abstractmethod
    def get_panel_original_url(self, image_url: str) -> Optional[str]:
        """Looks up the original source URL for a given cached/merged panel URL."""
        pass


class ISeriesRepository(ABC):
    """Abstract interface contract for parent Series management."""

    @abstractmethod
    def get_series_by_slug(self, series_slug: str) -> Optional[Dict[str, Any]]:
        """Gets a series configuration by its slug."""
        pass

    @abstractmethod
    def delete_series(self, series_id: str) -> None:
        """Deletes a series, all nested chapters & panels, and disk files."""
        pass

    @abstractmethod
    def create_series(self, series_id: str, user_id: str, title: str, author: str, cover_image: Optional[str] = None, genre: str = "general") -> None:
        """Creates a parent Series entry for a user."""
        pass

    @abstractmethod
    def get_series_for_user(self, user_id: str) -> List[Dict[str, Any]]:
        """Gets all publishing Series entities owned by a user."""
        pass

    @abstractmethod
    def add_chapter_to_series(self, chapter_id: str, series_id: str, episode_number: str, original_url: Optional[str] = None, panels_count: int = 0, video_url: Optional[str] = None) -> None:
        """Associates and inserts a new Chapter nested directly under a parent Series."""
        pass

    @abstractmethod
    def get_chapters_for_series(self, series_id: str) -> List[Dict[str, Any]]:
        """Gets all Chapter metadata rows nested under a parent Series."""
        pass

    @abstractmethod
    def delete_series_admin(self, series_id: str) -> None:
        """Deletes a series from administrative context (raw delete)."""
        pass

    @abstractmethod
    def update_series_admin(self, series_id: str, updates: dict) -> None:
        """Updates a series properties directly from admin context."""
        pass


class ITokenRepository(ABC):
    """Abstract interface contract for tracking LLM token consumption and costs."""

    @abstractmethod
    def insert_token_log(self, log_id: str, project_id: str, input_tokens: int, output_tokens: int, total_tokens: int, estimated_cost_usd: float) -> None:
        """Logs a single token usage transaction."""
        pass

    @abstractmethod
    def get_token_logs(self, user_id: str) -> List[Dict[str, Any]]:
        """Gets all token usage metrics for projects owned by a user."""
        pass
