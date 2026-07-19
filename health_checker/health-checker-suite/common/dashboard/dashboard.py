"""
Dashboard logic.
"""
from pathlib import Path
from typing import List
from .widgets import SummaryWidget, TableWidget, ChartWidget
from .charts import render_chart_html
from .templates import render_template
from .assets import DASHBOARD_CSS, DASHBOARD_JS
from ..utils.exceptions import DashboardError

class Dashboard:
    """Represents a full HTML dashboard."""

    def __init__(self, title: str, generated_at: str):
        self.title = title
        self.generated_at = generated_at
        self.summary_widgets: List[SummaryWidget] = []
        self.tables: List[TableWidget] = []
        self.charts: List[ChartWidget] = []

    def add_summary_widget(self, widget: SummaryWidget) -> None:
        """Add a summary widget to the top of the dashboard."""
        self.summary_widgets.append(widget)

    def add_table(self, table: TableWidget) -> None:
        """Add a table to the dashboard."""
        self.tables.append(table)

    def add_chart(self, chart: ChartWidget) -> None:
        """Add a chart to the dashboard."""
        self.charts.append(chart)

    def generate(self, output_path: str | Path) -> None:
        """Render the dashboard and write it to disk."""
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)

        context = {
            "title": self.title,
            "generated_at": self.generated_at,
            "summary_widgets": [w.model_dump() for w in self.summary_widgets],
            "tables": [t.model_dump() for t in self.tables],
            "charts": [{"title": c.title, "html": render_chart_html(c)} for c in self.charts],
            "css_content": DASHBOARD_CSS,
            "js_content": DASHBOARD_JS
        }

        try:
            html_output = render_template(context)
            with open(path, 'w', encoding='utf-8') as f:
                f.write(html_output)
        except Exception as e:
            raise DashboardError(f"Failed to generate dashboard: {e}")
