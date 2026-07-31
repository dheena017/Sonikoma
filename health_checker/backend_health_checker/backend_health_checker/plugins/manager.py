import sys
import importlib.metadata
import logging
from typing import List, Type
from backend_health_checker.checkers.base import BaseChecker

logger = logging.getLogger(__name__)

class PluginManager:
    """Discovers and loads third-party checkers using Python entry_points."""

    ENTRY_POINT_GROUP = "backend_health_checker.plugins"

    @classmethod
    def load_plugins(cls) -> List[Type[BaseChecker]]:
        plugins = []
        if sys.version_info >= (3, 10):
            eps = importlib.metadata.entry_points(group=cls.ENTRY_POINT_GROUP)
        else:
            # Fallback for 3.9 and older if needed, though project requires 3.11+
            eps = importlib.metadata.entry_points().get(cls.ENTRY_POINT_GROUP, [])

        for ep in eps:
            try:
                plugin_class = ep.load()
                if issubclass(plugin_class, BaseChecker):
                    plugins.append(plugin_class)
                    logger.info(f"Loaded plugin: {ep.name} ({plugin_class.__name__})")
                else:
                    logger.warning(f"Plugin {ep.name} is not a subclass of BaseChecker.")
            except Exception as e:
                logger.error(f"Failed to load plugin {ep.name}: {e}")

        return plugins
