import ast
import threading
from pathlib import Path
from typing import Optional, Dict

class ASTCache:
    """Thread-safe cache for parsed AST modules."""
    def __init__(self):
        self._cache: Dict[str, ast.Module] = {}
        self._lines_cache: Dict[str, list[str]] = {}
        self._lock = threading.Lock()

    def get_ast(self, file_path: Path) -> Optional[ast.Module]:
        path_str = str(file_path.resolve())

        with self._lock:
            if path_str in self._cache:
                return self._cache[path_str]

        try:
            content = file_path.read_text(encoding="utf-8")
            tree = ast.parse(content, filename=path_str)
            with self._lock:
                self._cache[path_str] = tree
                self._lines_cache[path_str] = content.splitlines()
            return tree
        except (SyntaxError, UnicodeDecodeError, FileNotFoundError):
            return None

    def get_lines(self, file_path: Path) -> Optional[list[str]]:
        path_str = str(file_path.resolve())
        with self._lock:
            if path_str in self._lines_cache:
                return self._lines_cache[path_str]

        # If not in cache, trigger a read via get_ast
        self.get_ast(file_path)

        with self._lock:
            return self._lines_cache.get(path_str)

ast_cache = ASTCache()
