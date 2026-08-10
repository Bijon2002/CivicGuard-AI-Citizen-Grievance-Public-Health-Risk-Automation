from __future__ import annotations


def calculate_public_health_risk(severity: str, rainfall_mm_by_day: list[float] | None = None) -> str:
    """Calculate overall public health & safety risk level for all civic hazards."""
    severity_lower = (severity or "low").lower()

    if severity_lower == "severe":
        return "High"

    if rainfall_mm_by_day:
        next_three_days = sum(rainfall_mm_by_day[:3])
        heaviest_day = max(rainfall_mm_by_day)
        if severity_lower in {"moderate", "severe"} and (next_three_days >= 20 or heaviest_day >= 15):
            return "High"
        if next_three_days >= 8:
            return "Medium"

    if severity_lower == "moderate":
        return "Medium"

    return "Low"


# Legacy alias function
def calculate_dengue_risk(severity: str, rainfall_mm_by_day: list[float]) -> str:
    return calculate_public_health_risk(severity, rainfall_mm_by_day)
