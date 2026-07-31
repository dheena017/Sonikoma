import libcst as cst
from pathlib import Path
from typing import List
import logging

logger = logging.getLogger(__name__)

class RemoveUnusedImportsTransformer(cst.CSTTransformer):
    """A LibCST transformer that safely removes specific unused imports."""
    def __init__(self, unused_names: List[str]):
        self.unused_names = unused_names

    def leave_Import(self, original_node: cst.Import, updated_node: cst.Import) -> cst.Import:
        new_names = [alias for alias in updated_node.names if alias.name.value not in self.unused_names]
        if not new_names:
            return cst.RemoveFromParent()
        return updated_node.with_changes(names=new_names)

    def leave_ImportFrom(self, original_node: cst.ImportFrom, updated_node: cst.ImportFrom) -> cst.ImportFrom:
        if isinstance(updated_node.names, cst.ImportStar):
            return updated_node

        new_names = []
        for alias in updated_node.names:
            name_str = alias.name.value
            if alias.asname:
                name_str = alias.asname.name.value
            if name_str not in self.unused_names:
                new_names.append(alias)

        if not new_names:
            return cst.RemoveFromParent()

        return updated_node.with_changes(names=new_names)

class AutoFixEngine:
    def __init__(self, issues):
        self.issues = issues

    def fix_all(self):
        # Group issues by file
        files_to_fix = {}
        for issue in self.issues:
            if issue.checker_name == "UnusedImportChecker":
                if issue.file_path not in files_to_fix:
                    files_to_fix[issue.file_path] = []
                # Extract the import name from the message e.g., "Unused import: 'os'"
                try:
                    name = issue.message.split("'")[1]
                    files_to_fix[issue.file_path].append(name)
                except IndexError:
                    pass

        for file_path_str, unused_names in files_to_fix.items():
            path = Path(file_path_str)
            try:
                source_code = path.read_text(encoding="utf-8")
                module = cst.parse_module(source_code)
                transformer = RemoveUnusedImportsTransformer(unused_names)
                modified_module = module.visit(transformer)

                if modified_module.code != source_code:
                    path.write_text(modified_module.code, encoding="utf-8")
                    logger.info(f"Fixed unused imports in {path}")
            except Exception as e:
                logger.error(f"Failed to auto-fix {path}: {e}")
