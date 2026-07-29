from __future__ import annotations


def calculate_dengue_risk(severity: str, rainfall_mm_by_day: list[float]) -> str:
    if not rainfall_mm_by_day:
        return "Low"

    next_three_days = sum(rainfall_mm_by_day[:3])
    heaviest_day = max(rainfall_mm_by_day)

    if severity == "severe" and (next_three_days >= 25 or heaviest_day >= 15):
        return "High"
    if severity in {"moderate", "severe"} and next_three_days >= 10:
        return "Medium"
    if next_three_days >= 5:
        return "Medium"
    return "Low"
