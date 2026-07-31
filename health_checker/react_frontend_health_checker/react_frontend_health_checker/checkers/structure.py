import re
from pathlib import Path
from typing import List, Dict
from react_frontend_health_checker.checkers.base import BaseChecker, CheckerRegistry
from react_frontend_health_checker.parsers.parser import ASTNode
from react_frontend_health_checker.models.finding import Severity

@CheckerRegistry.register
class NamingConventionChecker(BaseChecker):
    """
    Checks that files and variables follow React naming conventions.
    """
    def check(self, file_path: str, ast: ASTNode, content: str) -> List[Severity]:
        path = Path(file_path)

        # Component files should be PascalCase
        if path.suffix in ('.jsx', '.tsx'):
            # Only check if it exports a default component (simplification)
            if not re.match(r'^[A-Z][a-zA-Z0-9]*$', path.stem) and path.stem != 'index':
                self.add_finding(
                    severity="WARNING",
                    message=f"React component file '{path.name}' should use PascalCase naming.",
                    file_path=file_path
                )

        # Hook files should be camelCase and start with 'use'
        if 'hooks' in path.parts:
            if not path.stem.startswith('use'):
                self.add_finding(
                    severity="WARNING",
                    message=f"Hook file '{path.name}' should start with 'use'.",
                    file_path=file_path
                )

        return self.findings

@CheckerRegistry.register
class ImportChecker(BaseChecker):
    """
    Checks for import issues, such as duplicate imports.
    """
    def check(self, file_path: str, ast: ASTNode, content: str) -> List[Severity]:
        imports = {}
        for node in ast.body:
            if node.type == 'ImportDeclaration':
                source = getattr(node, 'source', None)
                if source:
                    if source in imports:
                        self.add_finding(
                            severity="WARNING",
                            message=f"Duplicate import from '{source}'.",
                            file_path=file_path,
                            line_number=getattr(node, 'line', None)
                        )
                    else:
                        imports[source] = True
        return self.findings

@CheckerRegistry.register
class DuplicateCodeChecker(BaseChecker):
    """
    Level 1 duplicate detection: Exact block matches.
    """
    def check(self, file_path: str, ast: ASTNode, content: str) -> List[Severity]:
        # Very simplistic duplicate block check using basic string chunks
        lines = content.split('\n')
        chunk_size = 15
        seen_chunks = {}

        for i in range(len(lines) - chunk_size):
            chunk = "\n".join(lines[i:i+chunk_size]).strip()
            if not chunk or len(chunk) < 50:
                continue

            if chunk in seen_chunks:
                self.add_finding(
                    severity="WARNING",
                    message=f"Exact duplicate block found.",
                    file_path=file_path,
                    line_number=i+1
                )
            else:
                seen_chunks[chunk] = True

        return self.findings
