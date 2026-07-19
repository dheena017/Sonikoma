"""
Graph models specific to the graph module.
(The core Node, Edge, and GraphData models are in common.models.graph)
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from ..models import Node, Edge, GraphData

class Cycle(BaseModel):
    """Represents a cycle in a graph."""
    nodes: List[str] = Field(..., description="List of node IDs in the cycle")
    length: int = Field(..., description="Length of the cycle")

class GraphAnalysisResult(BaseModel):
    """Result of analyzing a graph."""
    node_count: int = 0
    edge_count: int = 0
    is_dag: bool = True
    cycles: List[Cycle] = Field(default_factory=list)
    components: int = 1
