import networkx as nx
from pathlib import Path
from typing import List
from .base import BaseChecker
from backend_health_checker.models.issues import Issue, Severity
from backend_health_checker.scanners.graph import DependencyGraphScanner

class CircularImportChecker(BaseChecker):
    def check_project(self, file_paths: List[Path]) -> List[Issue]:
        issues = []
        scanner = DependencyGraphScanner(self.config.project_root)
        graph = scanner.build_graph(file_paths)

        try:
            cycles = list(nx.simple_cycles(graph))
            for cycle in cycles:
                # To prevent spamming, just report the cycle on the first node in the cycle
                if cycle:
                    path_str = graph.nodes[cycle[0]].get('path', 'Unknown')
                    cycle_str = " -> ".join(cycle + [cycle[0]])
                    issues.append(
                        Issue(
                            checker_name=self.name,
                            file_path=path_str,
                            line_number=0,
                            message=f"Circular import detected: {cycle_str}",
                            severity=Severity.HIGH
                        )
                    )
        except nx.NetworkXNoCycle:
            pass

        return issues
