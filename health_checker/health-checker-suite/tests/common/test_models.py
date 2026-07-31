from common.models import ProjectConfig, Finding, Severity, Issue

def test_project_config():
    config = ProjectConfig(name="test", path="/test")
    assert config.name == "test"
    assert config.path == "/test"
    assert config.exclude_paths == []

def test_finding():
    finding = Finding(rule_id="r1", title="test", description="desc", severity=Severity.HIGH)
    assert finding.rule_id == "r1"
    assert finding.severity == Severity.HIGH

def test_issue():
    issue = Issue(issue_id="i1", title="test issue", description="desc")
    finding = Finding(rule_id="r1", title="t", description="d")
    issue.add_finding(finding)
    assert len(issue.findings) == 1
