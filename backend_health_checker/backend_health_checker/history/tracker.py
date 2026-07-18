import sqlite3
import json
from pathlib import Path
from datetime import datetime
from backend_health_checker.models.issues import ProjectMetrics

class HistoryTracker:
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self._init_db()

    def _get_conn(self):
        return sqlite3.connect(str(self.db_path), isolation_level=None)

    def _init_db(self):
        conn = self._get_conn()
        conn.execute("""
            CREATE TABLE IF NOT EXISTS scan_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                health_score REAL,
                total_files INTEGER,
                total_issues INTEGER,
                metrics_json TEXT
            )
        """)

    def record_scan(self, metrics: ProjectMetrics, total_issues: int):
        conn = self._get_conn()
        metrics_dict = {
            "lines": metrics.total_lines,
            "classes": metrics.total_classes,
            "functions": metrics.total_functions,
            "severities": metrics.issues_by_severity
        }
        conn.execute("""
            INSERT INTO scan_history (timestamp, health_score, total_files, total_issues, metrics_json)
            VALUES (?, ?, ?, ?, ?)
        """, (datetime.utcnow().isoformat(), metrics.health_score, metrics.total_files, total_issues, json.dumps(metrics_dict)))

    def get_trends(self, limit=10):
        conn = self._get_conn()
        cur = conn.execute("SELECT timestamp, health_score, total_issues FROM scan_history ORDER BY id DESC LIMIT ?", (limit,))
        return [{"timestamp": r[0], "health_score": r[1], "issues": r[2]} for r in reversed(cur.fetchall())]
