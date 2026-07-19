"""
Graph builder fluent API.
"""
from typing import Dict, Any, Optional
from .dependency_graph import DependencyGraph

class GraphBuilder:
    """Fluent API for building graphs."""

    def __init__(self):
        self._graph = DependencyGraph()

    def add_node(self, node_id: str, node_type: str = "generic", **properties) -> "GraphBuilder":
        """Add a node to the graph."""
        props = properties.copy()
        props['type'] = node_type
        self._graph.add_node(node_id, **props)
        return self

    def add_edge(self, source: str, target: str, edge_type: str = "depends_on", weight: float = 1.0, **properties) -> "GraphBuilder":
        """Add a directed edge. Will implicitly create nodes if they don't exist."""
        props = properties.copy()
        props['type'] = edge_type
        props['weight'] = weight
        self._graph.add_edge(source, target, **props)
        return self

    def build(self) -> DependencyGraph:
        """Return the constructed graph."""
        return self._graph
