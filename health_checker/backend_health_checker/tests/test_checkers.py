import pytest
from pathlib import Path
from backend_health_checker.config.models import AppConfig
from backend_health_checker.checkers.syntax import SyntaxChecker
from backend_health_checker.checkers.security import SecurityChecker

def test_syntax_checker_valid(tmp_path):
    test_file = tmp_path / "valid.py"
    test_file.write_text("def hello():\n    return 'world'")
    checker = SyntaxChecker(AppConfig())
    issues = checker.check_file(test_file)
    assert len(issues) == 0

def test_syntax_checker_invalid(tmp_path):
    test_file = tmp_path / "invalid.py"
    test_file.write_text("def hello() return 'world'") # missing colon
    checker = SyntaxChecker(AppConfig())
    issues = checker.check_file(test_file)
    assert len(issues) == 1
    assert "Syntax Error" in issues[0].message

def test_security_checker(tmp_path):
    test_file = tmp_path / "sec.py"
    test_file.write_text("eval('1+1')\nAPI_KEY='1234'")
    checker = SecurityChecker(AppConfig())
    issues = checker.check_file(test_file)
    assert len(issues) == 2
    messages = [i.message for i in issues]
    assert any("eval" in m for m in messages)
    assert any("hardcoded secret" in m for m in messages)
