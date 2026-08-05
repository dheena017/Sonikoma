## 1. Detector Golden Rules

1. **Never merge across a detected separator.**
2. **Never return a panel taller than 35% of the image height without attempting recursive splitting.**
3. **OCR can only preserve content; it cannot erase separators by itself.**
4. **Every merge decision must be explainable in the logs with panel lineage.**
5. **Every heuristic change must be benchmarked independently against the frozen `v1.0.0` baseline.**
6. **No Phase 2 change is accepted if it improves one benchmark sample while regressing another.**

---

## 2. Multi-Stage Pipeline Architecture
```text
Merged Webtoon ──► [Feature Extraction (BG, Edges, OCR, Gradients)] ──► [Separator Scoring] ──► [Candidate Generation]
               ──► [Merge Validation (Hard Blockers ──► Soft Vote)] ──► [Recursive Split] ──► [Distribution Analysis]
               ──► [Sanity Validator] ──► [Weighted Confidence Score] ──► Return Panels
```

### Phase 2 Sub-Phases & Execution Rules
1. **Phase 2.0 (Instrumentation & Panel Lineage)**: Log raw candidate counts, feature breakdown, and panel lineage (`Panel 4 -> Merged with 5 -> Final Panel 2`).
2. **Phase 2.1 (Two-Stage Merge Validation Rewrite)**: Hard blockers (zero separators, zero OCR crossing, size limits) must ALL pass before soft weighted voting (distance, width, BG similarity) is evaluated. Enforce `assert merged_box.height <= original_height`.
3. **Phase 2.2 (Feature Extraction & Adaptive Separator Scoring)**: Per-row feature extraction (MAD variance, edge density, stroke density, dark pixel %, gradient) logged per row.
4. **Phase 2.3 (Content Protection)**: Filter oversized OCR boxes (`bh >= 500px`) and restrict OCR mask painting to local text rows.
5. **Phase 2.4 (Recursive Oversized Panel Splitting with Exit Conditions)**: Recursively split panels exceeding 35% image height or 20,000px up to `max_depth = 3`. Exit if no new separators or confidence drops.
6. **Phase 2.5 (Panel Distribution Analysis)**: Analyze structural height distribution (`median_height`, `largest_height`, `panel_density`) to detect abnormal spreads.
7. **Phase 2.6 (Sanity Validator & Weighted Confidence Scoring)**: Compute Weighted Confidence Score ($35\%\text{Sep} + 30\%\text{Merge} + 20\%\text{Dist} + 10\%\text{OCR} + 5\%\text{Coverage}$). Accept if $\ge 90$.

### Single-Phase Benchmark Rule
- **Stop and Benchmark**: Never proceed to the next sub-phase until the current sub-phase's benchmark metrics show measurable improvement over `v1.0.0` without regressions.

### Acceptance Criteria
- **Target Metric Improvement**: Primary metrics (**Panel IoU $\ge 0.90$**, **Separator Recall $\ge 95\%$**) must show measurable improvement over `v1.0.0`.
- **Zero Regression**: No sample in the benchmark dataset may regress beyond agreed tolerances without explicit justification.
- **Runtime Budget**: Total execution time (`runtime_ms`) must remain within target thresholds.

---

## 4. Useful Commands

### Run Panel Detection Regression Tests
```powershell
python -m pytest backend/tests/test_panel_detection_long_image.py backend/tests/test_image_utils.py backend/tests/test_panel_bounds.py
```

### Aggregate Benchmark Summaries
```powershell
python backend/scripts/benchmark_summary.py
```
