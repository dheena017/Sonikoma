from pathlib import Path
from typing import Dict, List, Set, Tuple
import threading

class SymbolTable:
    """Global symbol table to resolve class, function, and variable references across files."""
    def __init__(self):
        self.definitions: Dict[str, List[Tuple[Path, int, str]]] = {} # name -> [(file, line, type)]
        self.usages: Dict[str, Set[Path]] = {} # name -> set of files using it
        self.imports: Dict[Path, Dict[str, str]] = {} # file -> {alias: original_name}
        self._lock = threading.Lock()

    def add_definition(self, name: str, file_path: Path, lineno: int, type_: str):
        with self._lock:
            if name not in self.definitions:
                self.definitions[name] = []
            self.definitions[name].append((file_path, lineno, type_))

    def add_usage(self, name: str, file_path: Path):
        with self._lock:
            if name not in self.usages:
                self.usages[name] = set()
            self.usages[name].add(file_path)

    def add_import(self, file_path: Path, alias: str, original_name: str):
        with self._lock:
            if file_path not in self.imports:
                self.imports[file_path] = {}
            self.imports[file_path][alias] = original_name

    def resolve_usage(self, name: str, file_path: Path) -> str:
        """Resolve a local name to its global name if imported."""
        with self._lock:
            if file_path in self.imports and name in self.imports[file_path]:
                return self.imports[file_path][name]
        return name
