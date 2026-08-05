import os
import json
import glob
import csv
from typing import List, Dict, Any


def aggregate_pipeline_summaries(logs_dir: str = None, output_csv: str = None) -> List[Dict[str, Any]]:
    """
    Scans the logs directory for pipeline_summary_*.json artifacts and aggregates them
    into a structured benchmark summary report (CSV and JSON).
    """
    if logs_dir is None:
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        logs_dir = os.path.join(project_root, "data", "logs")
        if not os.path.exists(logs_dir):
            fallback_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "logs"))
            if os.path.exists(fallback_dir):
                logs_dir = fallback_dir

    os.makedirs(logs_dir, exist_ok=True)
    
    if output_csv is None:
        output_csv = os.path.join(logs_dir, "benchmark_report.csv")

    summary_files = glob.glob(os.path.join(logs_dir, "pipeline_summary_*.json"))
    records = []

    for filepath in summary_files:
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                records.append(data)
        except Exception as e:
            print(f"[Benchmark Report] Error reading {filepath}: {e}")

    # Sort records by job_id
    records.sort(key=lambda r: r.get("job_id", ""))

    if records:
        fieldnames = [
            "job_id", "detector_version", "image_size", "detector_mode", 
            "panel_count", "coverage", "gap_area", "avg_trim_px", 
            "largest_trim_px", "raw_candidates", "filtered_boxes", 
            "yolo_bubbles", "commit_sha", "runtime_ms"
        ]
        with open(output_csv, "w", newline="", encoding="utf-8") as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            for r in records:
                row = {k: r.get(k, "") for k in fieldnames}
                writer.writerow(row)

        print(f"[Benchmark Report] Successfully aggregated {len(records)} benchmark summaries to: {output_csv}")
    else:
        print("[Benchmark Report] No pipeline_summary_*.json files found in logs directory.")

    return records


if __name__ == "__main__":
    aggregate_pipeline_summaries()
