import json
from pathlib import Path
from typing import List
from backend_health_checker.models.issues import Issue

class SarifExporter:
    @staticmethod
    def export(issues: List[Issue], output_path: Path):
        results = []
        for issue in issues:
            level = "error" if issue.severity.value in ["critical", "high"] else "warning"
            if issue.severity.value == "info":
                level = "note"

            results.append({
                "ruleId": issue.checker_name,
                "message": {"text": issue.message},
                "level": level,
                "locations": [{
                    "physicalLocation": {
                        "artifactLocation": {"uri": issue.file_path},
                        "region": {"startLine": issue.line_number or 1}
                    }
                }]
            })

        sarif = {
            "version": "2.1.0",
            "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
            "runs": [{
                "tool": {
                    "driver": {
                        "name": "Backend Health Checker",
                        "informationUri": "https://github.com/example/backend-health-checker",
                        "rules": []
                    }
                },
                "results": results
            }]
        }

        output_path.write_text(json.dumps(sarif, indent=2))
