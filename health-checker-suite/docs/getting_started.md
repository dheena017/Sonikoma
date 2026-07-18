# Getting Started

The Health Checker Suite `common/` package is an infrastructure layer designed to be imported by specialized health checkers (e.g., Python Backend, React Frontend).

## Installation

```bash
pip install -e .
```

## Basic Usage

1. **Define your Config**
   ```python
   from common.models import ProjectConfig
   config = ProjectConfig(name="My Project", path="./src")
   ```

2. **Collect Findings**
   ```python
   from common.models import Finding, Severity
   finding = Finding(rule_id="R01", title="Error", description="...", severity=Severity.HIGH)
   ```

3. **Generate Dashboard**
   ```python
   from common.reporting import ReportBuilder
   from common.dashboard import DashboardBuilder

   report = ReportBuilder(config).add_finding(finding).build()
   dash = DashboardBuilder().build_from_report(report)
   dash.generate("output/dashboard.html")
   ```
