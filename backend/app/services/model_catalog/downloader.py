"""
backend/app/services/model_catalog/downloader.py
Handles downloading or exporting model catalog reports.
"""
import csv
import json
import time
from typing import List, Any

class ModelCatalogDownloader:
    """Handles exporting/downloading catalog reports in various formats."""

    @staticmethod
    def export_report(
        models_list: List[Any],
        active_provider: str,
        format_choice: str,
        filepath: str
    ) -> None:
        """Exports model reports to Markdown, JSON, or CSV files."""
        if format_choice == "1":
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(
                    f"# {active_provider.upper()} Available Model Report\n\n"
                    f"Generated on: {time.strftime('%Y-%m-%d %H:%M:%S')}\n"
                    f"Total Models: {len(models_list)}\n\n"
                )
                if active_provider == "gemini":
                    f.write(
                        "| Index | Model ID | Display Name | Input Token Limit | Output Token Limit | Supported Actions |\n"
                        "|---|---|---|---|---|---|\n"
                    )
                    for idx, m in enumerate(models_list):
                        actions = getattr(m, 'supported_actions', []) or []
                        in_limit = getattr(m, 'input_token_limit', None)
                        out_limit = getattr(m, 'output_token_limit', None)
                        in_str = f"{in_limit:,}" if in_limit else "-"
                        out_str = f"{out_limit:,}" if out_limit else "-"
                        f.write(
                            f"| {idx+1} | `{(getattr(m, 'name', '') or '').replace('models/','')}` | {getattr(m, 'display_name', '') or '-'} | "
                            f"{in_str} | {out_str} | {', '.join(actions)} |\n"
                        )
                elif active_provider == "huggingface":
                    f.write(
                        "| Index | Model ID | Pipeline Tag (Task) | Library | Downloads | Likes |\n"
                        "|---|---|---|---|---|---|\n"
                    )
                    for idx, m in enumerate(models_list):
                        downloads = m.get('downloads', 0)
                        likes = m.get('likes', 0)
                        dl_str = f"{downloads:,}" if downloads else "-"
                        likes_str = f"{likes:,}" if likes else "-"
                        f.write(
                            f"| {idx+1} | `{m.get('id')}` | {m.get('pipeline_tag','-')} | {m.get('library_name','-')} | "
                            f"{dl_str} | {likes_str} |\n"
                        )
                elif active_provider == "openai":
                    f.write(
                        "| Index | Model ID | Owned By | Created Time |\n"
                        "|---|---|---|---|\n"
                    )
                    for idx, m in enumerate(models_list):
                        c_ts = m.get("created")
                        c_str = time.strftime('%Y-%m-%d %H:%M', time.localtime(c_ts)) if c_ts else "-"
                        f.write(f"| {idx+1} | `{m.get('id')}` | {m.get('owned_by','-')} | {c_str} |\n")
                elif active_provider == "anthropic":
                    f.write(
                        "| Index | Model ID | Display Name | Created Time |\n"
                        "|---|---|---|---|\n"
                    )
                    for idx, m in enumerate(models_list):
                        f.write(f"| {idx+1} | `{m.get('id')}` | {m.get('display_name','-')} | {m.get('created_at','-')} |\n")

        elif format_choice == "2":
            serialized = []
            for m in models_list:
                if active_provider == "gemini":
                    serialized.append({
                        "name": getattr(m, 'name', None),
                        "display_name": getattr(m, 'display_name', None),
                        "description": getattr(m, 'description', None),
                        "input_token_limit": getattr(m, 'input_token_limit', None),
                        "output_token_limit": getattr(m, 'output_token_limit', None),
                        "supported_actions": getattr(m, 'supported_actions', []),
                    })
                else:
                    serialized.append(m)
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(serialized, f, indent=2)

        elif format_choice == "3":
            with open(filepath, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                if active_provider == "gemini":
                    writer.writerow(["Index", "Model Name", "Display Name", "Input Token Limit", "Output Token Limit"])
                    for idx, m in enumerate(models_list):
                        writer.writerow([
                            idx+1, getattr(m, 'name', None), getattr(m, 'display_name', None),
                            getattr(m, 'input_token_limit', 0) or 0,
                            getattr(m, 'output_token_limit', 0) or 0
                        ])
                elif active_provider == "huggingface":
                    writer.writerow(["Index", "Model ID", "Pipeline Tag", "Library", "Downloads", "Likes"])
                    for idx, m in enumerate(models_list):
                        writer.writerow([
                            idx+1, m.get("id"), m.get("pipeline_tag"),
                            m.get("library_name"), m.get("downloads", 0), m.get("likes", 0)
                        ])
                elif active_provider == "openai":
                    writer.writerow(["Index", "Model ID", "Owned By", "Created"])
                    for idx, m in enumerate(models_list):
                        writer.writerow([idx+1, m.get("id"), m.get("owned_by"), m.get("created")])
                elif active_provider == "anthropic":
                    writer.writerow(["Index", "Model ID", "Display Name", "Created"])
                    for idx, m in enumerate(models_list):
                        writer.writerow([idx+1, m.get("id"), m.get("display_name"), m.get("created_at")])
