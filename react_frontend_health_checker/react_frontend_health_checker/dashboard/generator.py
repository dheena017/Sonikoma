import os
from jinja2 import Environment, FileSystemLoader
from typing import List
from react_frontend_health_checker.models.finding import Finding, Metric

class DashboardGenerator:
    def __init__(self):
        template_dir = os.path.join(os.path.dirname(__file__), '..', 'templates')
        self.env = Environment(loader=FileSystemLoader(template_dir))

    def calculate_score(self, findings: List[Finding]) -> int:
        score = 100
        for f in findings:
            if f.severity == "CRITICAL": score -= 10
            elif f.severity == "ERROR": score -= 5
            elif f.severity == "WARNING": score -= 2
            elif f.severity == "INFO": score -= 0.5
        return max(0, int(score))

    def generate(self, findings: List[Finding], metrics: List[Metric], output_path: str = "health-dashboard.html"):
        template = self.env.get_template('dashboard.html')
        score = self.calculate_score(findings)

        html_content = template.render(
            health_score=score,
            findings=findings,
            metrics=metrics
        )

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
