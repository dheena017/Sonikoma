import pytest
from pathlib import Path
from common.models import FullReport, ProjectConfig, ReportMetadata, ProjectMetrics, HealthScore, Statistics, Finding, Severity
from common.dashboard import Dashboard, DashboardBuilder, SummaryWidget, TableWidget

def test_dashboard_generation(tmp_path):
    dash = Dashboard(title="Test", generated_at="2023-01-01T00:00:00Z")
    dash.add_summary_widget(SummaryWidget(title="Score", value="100"))
    dash.add_table(TableWidget(title="Test Table", headers=["A", "B"], rows=[["1", "2"]]))

    out_path = tmp_path / "dash.html"
    dash.generate(out_path)

    assert out_path.exists()
    content = out_path.read_text()
    assert "Test - Health Checker" in content
    assert "Score" in content
    assert "Test Table" in content
    # Offline check - script and style should be embedded, no external links
    assert "<link rel=" not in content
    assert '<script src=' not in content

def test_dashboard_builder():
    config = ProjectConfig(name="proj", path="/")
    metrics = ProjectMetrics(
        health_score=HealthScore(score=90.0),
        statistics=Statistics(total_files=5)
    )
    finding = Finding(rule_id="r1", title="title", description="desc", severity=Severity.HIGH)

    report = FullReport(project=config, metadata=ReportMetadata(), metrics=metrics, findings=[finding])

    builder = DashboardBuilder()
    dash = builder.build_from_report(report)

    assert len(dash.summary_widgets) == 3
    assert dash.summary_widgets[0].title == "Health Score"
    assert "90.0" in dash.summary_widgets[0].value

    assert len(dash.tables) == 1
    assert "HIGH" in dash.tables[0].rows[0][0]
