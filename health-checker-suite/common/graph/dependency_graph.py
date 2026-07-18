"""
Dependency Graph abstraction hiding NetworkX.
"""
import networkx as nx
from typing import List, Dict, Any, Optional, Iterator, Tuple
from ..models import Node, Edge, GraphData
from ..utils.exceptions import GraphError

class DependencyGraph:
    """Wrapper around NetworkX to manage a directed dependency graph."""

    def __init__(self):
        self._nx_graph = nx.DiGraph()

    def add_node(self, node_id: str, **properties) -> None:
        """Add a node to the graph."""
        self._nx_graph.add_node(node_id, **properties)

    def add_edge(self, source: str, target: str, **properties) -> None:
        """Add a directed edge to the graph."""
        self._nx_graph.add_edge(source, target, **properties)

    def remove_node(self, node_id: str) -> None:
        """Remove a node and its edges."""
        if node_id in self._nx_graph:
            self._nx_graph.remove_node(node_id)

    def remove_edge(self, source: str, target: str) -> None:
        """Remove an edge."""
        if self._nx_graph.has_edge(source, target):
            self._nx_graph.remove_edge(source, target)

    def has_node(self, node_id: str) -> bool:
        return node_id in self._nx_graph

    def has_edge(self, source: str, target: str) -> bool:
        return self._nx_graph.has_edge(source, target)

    def get_node_properties(self, node_id: str) -> Dict[str, Any]:
        """Get properties of a node."""
        if not self.has_node(node_id):
            raise GraphError(f"Node {node_id} not found in graph")
        return dict(self._nx_graph.nodes[node_id])

    def get_edge_properties(self, source: str, target: str) -> Dict[str, Any]:
        """Get properties of an edge."""
        if not self.has_edge(source, target):
            raise GraphError(f"Edge {source}->{target} not found in graph")
        return dict(self._nx_graph[source][target])

    def get_nodes(self) -> Iterator[str]:
        """Iterate over all node IDs."""
        return iter(self._nx_graph.nodes)

    def get_edges(self) -> Iterator[Tuple[str, str]]:
        """Iterate over all edges as (source, target) tuples."""
        return iter(self._nx_graph.edges)

    def get_successors(self, node_id: str) -> List[str]:
        """Get nodes this node points to (depends on)."""
        if not self.has_node(node_id):
            return []
        return list(self._nx_graph.successors(node_id))

    def get_predecessors(self, node_id: str) -> List[str]:
        """Get nodes that point to this node (dependents)."""
        if not self.has_node(node_id):
            return []
        return list(self._nx_graph.predecessors(node_id))

    def get_underlying_graph(self) -> nx.DiGraph:
        """Get the raw NetworkX graph for advanced operations within the module."""
        return self._nx_graph

    def to_graph_data(self) -> GraphData:
        """Convert to standard GraphData model."""
        nodes = []
        for n, data in self._nx_graph.nodes(data=True):
            node_type = data.pop('type', 'generic')
            nodes.append(Node(id=str(n), type=node_type, properties=data))

        edges = []
        for u, v, data in self._nx_graph.edges(data=True):
            edge_type = data.pop('type', 'depends_on')
            weight = data.pop('weight', 1.0)
            edges.append(Edge(source=str(u), target=str(v), type=edge_type, weight=weight, properties=data))

        return GraphData(nodes=nodes, edges=edges)
