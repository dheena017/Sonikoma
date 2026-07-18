import os
from pathlib import Path
from typing import List, Dict, Set, Any
from react_frontend_health_checker.checkers.base import BaseChecker, CheckerRegistry
from react_frontend_health_checker.parsers.parser import ASTNode
from react_frontend_health_checker.analyzers.dependency_graph import DependencyGraph

class GlobalState:
    """Singleton to share graph across checkers."""
    graph = DependencyGraph()

@CheckerRegistry.register
class CircularImportChecker(BaseChecker):
    """
    Builds the dependency graph and checks for circular imports.
    """
    def check(self, file_path: str, ast: ASTNode, content: str) -> List[Any]:
        # Build edges
        for node in ast.body:
            if node.type == 'ImportDeclaration':
                source = getattr(node, 'source', None)
                if source and source.startswith('.'):
                    # Simplistic resolution
                    target = (Path(file_path).parent / source).resolve()
                    GlobalState.graph.add_dependency(str(Path(file_path).resolve()), str(target))

        # Check for cycles (can be heavy, best done at the end of the run, but we simulate it here for the current file)
        # Note: True cycle detection is a global operation, typically run by the engine after all files are parsed.
        # This implementation just flags the graph generation part.

        cycles = GlobalState.graph.find_cycles()
        for cycle in cycles:
            if str(Path(file_path).resolve()) in cycle:
                self.add_finding(
                    severity="ERROR",
                    message=f"Circular dependency detected: {' -> '.join(cycle)}",
                    file_path=file_path
                )

        return self.findings
