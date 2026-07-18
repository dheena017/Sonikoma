import ast
import hashlib
from pathlib import Path
from typing import List, Dict, Set
from .base import BaseChecker
from backend_health_checker.models.issues import Issue, Severity
from backend_health_checker.core.ast_cache import ast_cache
import threading

class DuplicateChecker(BaseChecker):
    def __init__(self, config):
        super().__init__(config)
        self.file_hashes: Dict[str, List[str]] = {}
        self.block_hashes: Dict[str, List[str]] = {}
        self.lock = threading.Lock()

    def _hash_ast_node(self, node: ast.AST) -> str:
        """Create a structural hash of an AST node ignoring line numbers and variable names."""
        class HashingVisitor(ast.NodeVisitor):
            def __init__(self):
                self.hash_obj = hashlib.sha256()

            def generic_visit(self, node):
                self.hash_obj.update(type(node).__name__.encode())
                super().generic_visit(node)

            def visit_Name(self, node):
                # Ignore specific variable names to catch structurally identical blocks
                self.hash_obj.update(b"Name")

            def visit_Constant(self, node):
                 # Ignore constants to catch structurally identical blocks
                 self.hash_obj.update(b"Constant")

        visitor = HashingVisitor()
        visitor.visit(node)
        return visitor.hash_obj.hexdigest()

    def check_file(self, file_path: Path) -> List[Issue]:
        issues = []
        lines = ast_cache.get_lines(file_path)
        if lines is None:
            return issues

        # 1. Exact Duplicate File Check
        content = "".join(lines)
        file_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()

        with self.lock:
            if file_hash not in self.file_hashes:
                self.file_hashes[file_hash] = []
            self.file_hashes[file_hash].append(str(file_path))

        # 2. Duplicate Code Block Check (Functions & Classes)
        tree = ast_cache.get_ast(file_path)
        if tree:
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                    # Only check large enough blocks (e.g. > 10 lines)
                    end_line = getattr(node, 'end_lineno', node.lineno)
                    if (end_line - node.lineno) > 10:
                        block_hash = self._hash_ast_node(node)
                        location_str = f"{file_path}:{node.lineno}"

                        with self.lock:
                            if block_hash not in self.block_hashes:
                                self.block_hashes[block_hash] = []
                            self.block_hashes[block_hash].append(location_str)

        return issues

    def check_project(self, file_paths: List[Path]) -> List[Issue]:
        issues = []

        for file_hash, paths in self.file_hashes.items():
            if len(paths) > 1:
                for path in paths[1:]: # Report duplicates, keep the first one
                    issues.append(
                        Issue(
                            checker_name="DuplicateFileChecker",
                            file_path=path,
                            line_number=0,
                            message=f"Exact duplicate of file: {paths[0]}",
                            severity=Severity.HIGH
                        )
                    )

        for block_hash, locations in self.block_hashes.items():
            if len(locations) > 1:
                for loc in locations[1:]:
                    path, lineno = loc.split(":")
                    issues.append(
                        Issue(
                            checker_name="DuplicateCodeChecker",
                            file_path=path,
                            line_number=int(lineno),
                            message=f"Duplicate code block found structurally identical to block at {locations[0]}",
                            severity=Severity.MEDIUM
                        )
                    )

        return issues
