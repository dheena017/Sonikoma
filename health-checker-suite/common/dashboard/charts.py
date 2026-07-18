"""
Chart generation logic for the dashboard.
"""
from typing import List, Dict, Any, Union
from pydantic import BaseModel

class ChartDataPoint(BaseModel):
    label: str
    value: Union[int, float]

class ChartWidget(BaseModel):
    """Configuration for a dashboard chart."""
    title: str
    chart_type: str = "bar" # Options: bar, doughnut
    data: List[ChartDataPoint]
    labels: List[str] = []

    def model_post_init(self, __context: Any) -> None:
        """Auto-populate labels if empty."""
        if not self.labels:
            self.labels = [dp.label for dp in self.data]

# We embed a minimal charting library logic directly to ensure no CDN dependencies.
# We will use CSS/SVG based charts rather than a complex JS library to keep it zero-dependency.

def generate_svg_bar_chart(chart: ChartWidget, width: int = 400, height: int = 200) -> str:
    """Generate a simple SVG bar chart to maintain offline zero-dependency rules."""
    if not chart.data:
        return "<svg></svg>"

    max_val = max((dp.value for dp in chart.data), default=1)
    if max_val == 0:
        max_val = 1

    bar_width = width / (len(chart.data) * 1.5)
    spacing = bar_width * 0.5

    svg = f'<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" style="max-width:100%; height:auto;" xmlns="http://www.w3.org/2000/svg">'

    # Axes
    svg += f'<line x1="0" y1="{height-20}" x2="{width}" y2="{height-20}" stroke="var(--border-color, #ccc)" stroke-width="2"/>'

    current_x = spacing
    for dp in chart.data:
        normalized_height = (dp.value / max_val) * (height - 40)
        y_pos = height - 20 - normalized_height

        # Bar
        svg += f'<rect x="{current_x}" y="{y_pos}" width="{bar_width}" height="{normalized_height}" fill="var(--primary, #0d6efd)" rx="2"/>'

        # Value Label
        svg += f'<text x="{current_x + bar_width/2}" y="{y_pos - 5}" text-anchor="middle" font-size="12" fill="var(--text-color, #333)">{dp.value}</text>'

        # Category Label
        svg += f'<text x="{current_x + bar_width/2}" y="{height - 5}" text-anchor="middle" font-size="12" fill="var(--text-color, #333)">{dp.label}</text>'

        current_x += bar_width + spacing

    svg += '</svg>'
    return svg

def render_chart_html(chart: ChartWidget) -> str:
    """Render the chart to an HTML string."""
    svg_content = generate_svg_bar_chart(chart)
    return f"""
    <div class="chart-container" style="text-align: center; margin: 1rem 0;">
        {svg_content}
    </div>
    """
