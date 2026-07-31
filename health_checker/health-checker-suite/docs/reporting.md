# Reporting

The `common.reporting` module supports multiple formats natively:
- **JSON**
- **CSV**
- **Markdown**
- **HTML** (Simple)
- **TXT**

You construct a report using the fluent `ReportBuilder` API, and export it using the `ReportExporter`.

```python
exporter = ReportExporter()
exporter.export(report, "json", "report.json")
exporter.export_multiple(report, ["json", "csv"], "./output")
```
