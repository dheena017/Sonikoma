import pytest
from common.graph import GraphBuilder, CycleDetector, DependencyGraph

def test_graph_builder():
    builder = GraphBuilder()
    graph = (builder
             .add_node("A", node_type="module")
             .add_node("B")
             .add_edge("A", "B", weight=2.0)
             .build())

    assert graph.has_node("A")
    assert graph.has_node("B")
    assert graph.has_edge("A", "B")

    props_a = graph.get_node_properties("A")
    assert props_a["type"] == "module"

    edge_props = graph.get_edge_properties("A", "B")
    assert edge_props["weight"] == 2.0

def test_cycle_detector():
    builder = GraphBuilder()
    graph = (builder
             .add_edge("A", "B")
             .add_edge("B", "C")
             .build())

    assert CycleDetector.is_dag(graph) is True
    assert len(CycleDetector.find_all_cycles(graph)) == 0
    assert CycleDetector.get_topological_sort(graph) in (["A", "B", "C"],)

    # Add a cycle
    graph.add_edge("C", "A")

    assert CycleDetector.is_dag(graph) is False
    cycles = CycleDetector.find_all_cycles(graph)
    assert len(cycles) > 0

    with pytest.raises(RuntimeError, match="Cannot perform topological sort"):
        CycleDetector.get_topological_sort(graph)
