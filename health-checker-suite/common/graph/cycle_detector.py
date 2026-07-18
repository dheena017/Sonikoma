"""
Cycle detection logic.
"""
import networkx as nx
from typing import List
from .dependency_graph import DependencyGraph
from .graph_models import Cycle

class CycleDetector:
    """Detects cycles in a dependency graph."""

    @staticmethod
    def is_dag(graph: DependencyGraph) -> bool:
        """Check if the graph is a Directed Acyclic Graph (no cycles)."""
        return nx.is_directed_acyclic_graph(graph.get_underlying_graph())

    @staticmethod
    def find_all_cycles(graph: DependencyGraph) -> List[Cycle]:
        """Find all simple cycles in the graph."""
        nx_graph = graph.get_underlying_graph()
        cycles = []
        try:
            for cycle_nodes in nx.simple_cycles(nx_graph):
                cycles.append(Cycle(nodes=cycle_nodes, length=len(cycle_nodes)))
        except nx.NetworkXNoCycle:
            pass
        return sorted(cycles, key=lambda c: len(c.nodes))

    @staticmethod
    def get_topological_sort(graph: DependencyGraph) -> List[str]:
        """
        Get a topological sort of the graph.
        Throws NetworkXUnfeasible if the graph has a cycle.
        """
        nx_graph = graph.get_underlying_graph()
        try:
            return list(nx.topological_sort(nx_graph))
        except nx.NetworkXUnfeasible as e:
            # Re-raise as a generic exception to not leak nx
            raise RuntimeError(f"Cannot perform topological sort: Graph contains cycles. {e}") from e
