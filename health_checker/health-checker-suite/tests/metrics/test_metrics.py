import pytest
from common.metrics import HealthScoreCalculator, ComplexityCalculator, StatisticsCollector, QualityMetricsCalculator
from common.models import Finding, Severity

def test_health_score_calculator():
    calc = HealthScoreCalculator()
    findings = [
        Finding(rule_id="r1", title="1", description="", severity=Severity.CRITICAL),
        Finding(rule_id="r2", title="2", description="", severity=Severity.HIGH)
    ]
    # Default penalties: CRITICAL=10, HIGH=5. Total penalty = 15
    score = calc.calculate(findings)
    assert score.score == 85.0
    assert score.max_score == 100.0

def test_complexity_calculator():
    calc = ComplexityCalculator()
    calc.add_unit_complexity(5, 2)
    calc.add_unit_complexity(3, 1)

    metrics = calc.get_metrics()
    assert metrics.cyclomatic_complexity == 8
    assert metrics.cognitive_complexity == 3
    assert metrics.average_complexity == 4.0

def test_statistics_collector():
    calc = StatisticsCollector()
    calc.add_file_stats("file1.py", 100, 20, 10) # 70 code lines
    calc.add_file_stats("file2.py", 50, 5, 5)    # 40 code lines

    stats = calc.get_statistics()
    assert stats.total_files == 2
    assert stats.total_lines == 150
    assert stats.code_lines == 110

def test_quality_metrics():
    calc = QualityMetricsCalculator()
    findings = [
        Finding(rule_id="1", title="1", description="", severity=Severity.HIGH),
        Finding(rule_id="2", title="2", description="", severity=Severity.HIGH),
        Finding(rule_id="3", title="3", description="", severity=Severity.LOW)
    ]
    dist = calc.calculate_finding_distribution(findings)
    assert dist["high"] == 2
    assert dist["low"] == 1
    assert dist["critical"] == 0

    density = calc.calculate_defect_density(3, 1500)
    assert density == 2.0
