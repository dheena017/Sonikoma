import networkx as nx
from typing import Dict, List, Set

class DependencyGraph:
    """
    Manages the project-wide dependency graph.
    Used by import checkers and architecture analysis.
    """
    def __init__(self):
        self.graph = nx.DiGraph()

    def add_file(self, file_path: str):
        if not self.graph.has_node(file_path):
            self.graph.add_node(file_path)

    def add_dependency(self, source: str, target: str):
        self.add_file(source)
        self.add_file(target)
        self.graph.add_edge(source, target)

    def get_dependencies(self, file_path: str) -> List[str]:
        if self.graph.has_node(file_path):
            return list(self.graph.successors(file_path))
        return []

    def get_dependents(self, file_path: str) -> List[str]:
        if self.graph.has_node(file_path):
            return list(self.graph.predecessors(file_path))
        return []

    def find_cycles(self) -> List[List[str]]:
        try:
            return list(nx.simple_cycles(self.graph))
        except Exception:
            return []
