"""
Graph model definitions.
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Any

class Node(BaseModel):
    """Represents a node in a graph."""
    id: str = Field(..., description="Unique identifier for the node")
    type: str = Field(default="generic", description="Type of the node")
    properties: Dict[str, Any] = Field(default_factory=dict, description="Node properties")

class Edge(BaseModel):
    """Represents a directed edge between nodes."""
    source: str = Field(..., description="Source node ID")
    target: str = Field(..., description="Target node ID")
    type: str = Field(default="depends_on", description="Type of the relationship")
    weight: float = Field(default=1.0, description="Weight of the edge")
    properties: Dict[str, Any] = Field(default_factory=dict, description="Edge properties")

class GraphData(BaseModel):
    """Represents a full graph structure for export."""
    nodes: List[Node] = Field(default_factory=list, description="List of nodes")
    edges: List[Edge] = Field(default_factory=list, description="List of edges")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Graph metadata")
