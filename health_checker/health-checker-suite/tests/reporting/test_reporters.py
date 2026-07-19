import pytest
from pathlib import Path
from common.models import FullReport, ProjectConfig, ReportMetadata, ProjectMetrics, HealthScore, Statistics, Finding, Severity
from common.reporting import ReportExporter, ReportBuilder

@pytest.fixture
def sample_report():
    config = ProjectConfig(name="test_proj", path="/tmp")
    metrics = ProjectMetrics(
        health_score=HealthScore(score=85.0),
        statistics=Statistics(total_files=10, code_lines=500)
    )

    finding = Finding(
        rule_id="test_rule",
        title="Test Finding",
        description="A test finding.",
        severity=Severity.HIGH,
        file_path="test.py",
        line_number=10
    )

    return ReportBuilder(config).set_metrics(metrics).add_finding(finding).build()

def test_json_exporter(sample_report, tmp_path):
    exporter = ReportExporter()
    output_path = tmp_path / "report.json"
    exporter.export(sample_report, "json", output_path)

    assert output_path.exists()
    assert '"name": "test_proj"' in output_path.read_text()

def test_csv_exporter(sample_report, tmp_path):
    exporter = ReportExporter()
    output_path = tmp_path / "report.csv"
    exporter.export(sample_report, "csv", output_path)

    assert output_path.exists()
    content = output_path.read_text()
    assert "test_rule" in content
    assert "high" in content
    assert "Test Finding" in content

def test_markdown_exporter(sample_report, tmp_path):
    exporter = ReportExporter()
    output_path = tmp_path / "report.md"
    exporter.export(sample_report, "markdown", output_path)

    assert output_path.exists()
    content = output_path.read_text()
    assert "# Health Check Report: test_proj" in content
    assert "85.00" in content
    assert "Test Finding" in content
