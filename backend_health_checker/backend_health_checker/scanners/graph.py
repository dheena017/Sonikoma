import ast
import networkx as nx
from pathlib import Path
from typing import List
from backend_health_checker.core.ast_cache import ast_cache

class DependencyGraphScanner:
    """Extracts a dependency graph from Python files for architectural and circular checks."""
    def __init__(self, project_root: str):
        self.project_root = Path(project_root).resolve()
        self.graph = nx.DiGraph()

    def _get_module_name(self, file_path: Path) -> str:
        try:
            rel_path = file_path.relative_to(self.project_root)
            parts = list(rel_path.parts)
            if parts[-1] == "__init__.py":
                parts.pop()
            else:
                parts[-1] = parts[-1].replace(".py", "")
            return ".".join(parts)
        except ValueError:
            return file_path.stem

    def build_graph(self, file_paths: List[Path]) -> nx.DiGraph:
        module_to_path = {self._get_module_name(fp): fp for fp in file_paths}

        for file_path in file_paths:
            mod_name = self._get_module_name(file_path)
            self.graph.add_node(mod_name, path=str(file_path))

            tree = ast_cache.get_ast(file_path)
            if not tree:
                continue

            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        target_mod = alias.name
                        # Only add edge if it points to an internal module
                        if any(target_mod.startswith(m) for m in module_to_path):
                             self.graph.add_edge(mod_name, target_mod, lineno=node.lineno)
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        target_mod = node.module
                         # Handle relative imports naively by appending
                        if node.level > 0:
                           # This is a simplification; a full resolution is complex without runtime context
                           continue
                        if any(target_mod.startswith(m) for m in module_to_path):
                            self.graph.add_edge(mod_name, target_mod, lineno=node.lineno)

        return self.graph
