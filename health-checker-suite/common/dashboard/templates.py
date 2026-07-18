"""
Jinja2 templates for the dashboard.
"""
import jinja2
from typing import Dict, Any

BASE_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ title }} - Health Checker</title>
    <style>
        {{ css_content }}
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <div>
                <h1>{{ title }}</h1>
                <p>Generated at: {{ generated_at }}</p>
            </div>
            <button id="theme-toggle" class="theme-toggle">🌙 Dark Mode</button>
        </header>

        {% if charts %}
        <div class="dashboard-grid" style="margin-bottom: 2rem;">
            {% for chart in charts %}
            <div class="card">
                <h3 class="card-title">{{ chart.title }}</h3>
                {{ chart.html | safe }}
            </div>
            {% endfor %}
        </div>
        {% endif %}

        {% if summary_widgets %}
        <div class="dashboard-grid">
            {% for widget in summary_widgets %}
            <div class="card">
                <h3 class="card-title">{{ widget.title }}</h3>
                <p class="metric-value">{{ widget.value }}</p>
            </div>
            {% endfor %}
        </div>
        {% endif %}

        {% if tables %}
        {% for table in tables %}
        <div class="card" style="margin-bottom: 2rem;">
            <h3 class="card-title">{{ table.title }}</h3>
            <div style="overflow-x: auto;">
                <table>
                    <thead>
                        <tr>
                            {% for header in table.headers %}
                            <th>{{ header }}</th>
                            {% endfor %}
                        </tr>
                    </thead>
                    <tbody>
                        {% for row in table.rows %}
                        <tr>
                            {% for cell in row %}
                            <td>{{ cell | safe }}</td>
                            {% endfor %}
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>
            </div>
        </div>
        {% endfor %}
        {% endif %}
    </div>

    <script>
        {{ js_content }}
    </script>
</body>
</html>
"""

def render_template(context: Dict[str, Any]) -> str:
    """Render the dashboard template with the given context."""
    template = jinja2.Template(BASE_TEMPLATE)
    return template.render(**context)
