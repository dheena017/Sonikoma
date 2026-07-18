"""
Graph export logic.
"""
import json
import networkx as nx
from pathlib import Path
from typing import Union
from .dependency_graph import DependencyGraph
from ..utils.exceptions import GraphError

class GraphExporter:
    """Exports a graph to various formats."""

    @staticmethod
    def export_json(graph: DependencyGraph, output_path: Union[str, Path]) -> None:
        """Export to a JSON format compatible with web visualization."""
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)

        graph_data = graph.to_graph_data()

        try:
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(graph_data.model_dump(), f, indent=2)
        except Exception as e:
            raise GraphError(f"Failed to export graph to JSON: {e}")

    @staticmethod
    def export_graphml(graph: DependencyGraph, output_path: Union[str, Path]) -> None:
        """Export to GraphML format (supported by Gephi/yEd)."""
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)

        nx_graph = graph.get_underlying_graph()
        try:
            nx.write_graphml(nx_graph, path)
        except Exception as e:
            raise GraphError(f"Failed to export graph to GraphML: {e}")

    @staticmethod
    def export_dot(graph: DependencyGraph, output_path: Union[str, Path]) -> None:
        """Export to Graphviz DOT format."""
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)

        nx_graph = graph.get_underlying_graph()
        try:
            from networkx.drawing.nx_pydot import write_dot
            write_dot(nx_graph, path)
        except ImportError:
            raise GraphError("Exporting to DOT requires pydot or pygraphviz package")
        except Exception as e:
            raise GraphError(f"Failed to export graph to DOT: {e}")
