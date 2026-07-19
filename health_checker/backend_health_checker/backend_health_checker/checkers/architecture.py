import networkx as nx
from pathlib import Path
from typing import List
from .base import BaseChecker
from backend_health_checker.models.issues import Issue, Severity
from backend_health_checker.scanners.graph import DependencyGraphScanner

class ArchitectureChecker(BaseChecker):
    def check_project(self, file_paths: List[Path]) -> List[Issue]:
        issues = []
        arch_config = self.config.checkers.architecture.layers
        if not arch_config:
            return issues

        scanner = DependencyGraphScanner(self.config.project_root)
        graph = scanner.build_graph(file_paths)

        def get_layer(module_name: str) -> str:
            # Map module path to a defined layer
            for layer_name in arch_config.keys():
                if layer_name in module_name.split("."):
                    return layer_name
            return None

        for source, target in graph.edges():
            source_layer = get_layer(source)
            target_layer = get_layer(target)

            if source_layer and target_layer and source_layer != target_layer:
                allowed_layers = arch_config[source_layer].allowed
                if target_layer not in allowed_layers:
                     path_str = graph.nodes[source].get('path', 'Unknown')
                     lineno = graph.edges[source, target].get('lineno', 0)
                     issues.append(
                        Issue(
                            checker_name=self.name,
                            file_path=path_str,
                            line_number=lineno,
                            message=f"Architecture Violation: Layer '{source_layer}' is not allowed to import from '{target_layer}' (Module: {source} -> {target})",
                            severity=Severity.HIGH
                        )
                    )

        return issues
