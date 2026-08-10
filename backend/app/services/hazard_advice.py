from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from pathlib import Path

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class HazardAdvice:
    hazard_type: str
    display_name: str
    description: str
    incident_report: str
    issues: list[str] = field(default_factory=list)
    potential_problems: list[str] = field(default_factory=list)
    precautions: list[str] = field(default_factory=list)
    how_to_overcome: list[str] = field(default_factory=list)
    byproduct_issues: list[str] = field(default_factory=list)
    prevention_tips: list[str] = field(default_factory=list)
    emergency_note: str = ""


# Path to hazard_data.json in root directory
HAZARD_DATA_FILE = Path(__file__).resolve().parent.parent.parent.parent / "hazard_data.json"

_RAW_HAZARD_DATA: dict[str, dict[str, Any]] = {}


def load_hazard_data() -> dict[str, dict[str, Any]]:
    global _RAW_HAZARD_DATA
    if not _RAW_HAZARD_DATA:
        if HAZARD_DATA_FILE.exists():
            try:
                content = HAZARD_DATA_FILE.read_text(encoding="utf-8")
                _RAW_HAZARD_DATA = json.loads(content)
                logger.info("Successfully loaded hazard_data.json with %d categories", len(_RAW_HAZARD_DATA))
            except Exception as exc:
                logger.warning("Failed to parse hazard_data.json (%s)", exc)
    return _RAW_HAZARD_DATA


DEFAULT_ADVICE = HazardAdvice(
    hazard_type="general_hazard",
    display_name="General Hazard",
    description="A safety risk has been detected and should be reviewed by the responsible team.",
    incident_report="A safety risk has been detected and should be reviewed by the responsible team.",
    issues=["Possible injuries", "Property damage", "Blocked emergency access"],
    potential_problems=["Possible injuries", "Property damage", "Blocked emergency access"],
    precautions=["Avoid standing near the hazard", "Inform local municipal/road authorities", "Follow official safety instructions"],
    how_to_overcome=["Avoid standing near the hazard", "Inform local municipal/road authorities", "Follow official safety instructions"],
    byproduct_issues=["Traffic delays", "Increased emergency response burden"],
    prevention_tips=["Inspect the area regularly", "Report warning signs early"],
    emergency_note="If people are in danger, call emergency services (117 / 1990) immediately.",
)


_ALIASES = {
    # Flood / Waterlogging aliases
    "flood": "Flood",
    "water_logging": "Flood",
    "waterlogging": "Flood",
    "flooding": "Flood",
    "heavy_rain": "Flood",
    "stagnant_water": "Flood",
    "coastal_flooding": "Flood",
    "storm_surge": "Flood",

    # Fallen Tree aliases
    "fallentree": "FallenTree",
    "fallen_tree": "FallenTree",
    "tree_fallen_on_road": "FallenTree",
    "tree_at_risk_of_falling": "FallenTree",
    "leaning_tree": "FallenTree",

    # Road Damage / Potholes aliases
    "roaddamage": "RoadDamage",
    "road_damage": "RoadDamage",
    "large_pothole": "RoadDamage",
    "pothole": "RoadDamage",
    "damaged_road": "RoadDamage",
    "road_construction_hazard": "RoadDamage",
    "landslide": "RoadDamage",
    "rockfall": "RoadDamage",

    # Accident / Emergency
    "accident": "Accident",
    "vehicle_collision": "Accident",
    "building_collapse": "Accident",
    "damaged_building": "Accident",
    "fire": "Accident",
    "chemical_spill": "Accident",
    "fallen_power_line": "Accident",
    "burst_water_pipe": "Accident",
    "sewage_overflow": "Accident",
    "blocked_drain": "Flood",
    "blocked_drainage": "Flood",
    "illegal_waste_dumping": "Flood",

    # No hazard
    "nohazard": "NoHazard",
    "no_hazard": "NoHazard",
    "normal": "NoHazard",
}

_DISPLAY_NAMES = {
    "Flood": "Flood / Waterlogging",
    "FallenTree": "Fallen Tree on Road",
    "RoadDamage": "Road Damage / Potholes",
    "Accident": "Road Accident Scene",
    "NoHazard": "No Visible Hazard",
}


def normalise_hazard_type(hazard_type: str) -> str:
    return hazard_type.strip().lower().replace(" ", "_").replace("-", "_").replace("/", "_")


def get_hazard_advice(hazard_type: str) -> HazardAdvice:
    norm = normalise_hazard_type(hazard_type)
    target_key = _ALIASES.get(norm, None)

    data_map = load_hazard_data()
    if target_key and target_key in data_map:
        data = data_map[target_key]
        desc = data.get("description", "")
        issues = list(data.get("issues", []))
        precautions = list(data.get("precautions", []))
        byproduct = list(data.get("byproduct_issues", []))

        return HazardAdvice(
            hazard_type=norm,
            display_name=_DISPLAY_NAMES.get(target_key, target_key),
            description=desc,
            incident_report=desc,
            issues=issues,
            potential_problems=issues,
            precautions=precautions,
            how_to_overcome=precautions,
            byproduct_issues=byproduct,
            prevention_tips=byproduct[:3] if byproduct else ["Report warning signs early"],
            emergency_note="In case of emergency, call 117 (DMC) or 1990 (Suwa Seriya Ambulance).",
        )

    # Fallback to matching key directly in hazard_data.json if exists
    for key, data in data_map.items():
        if key.lower() in norm or norm in key.lower():
            desc = data.get("description", "")
            issues = list(data.get("issues", []))
            precautions = list(data.get("precautions", []))
            byproduct = list(data.get("byproduct_issues", []))

            return HazardAdvice(
                hazard_type=norm,
                display_name=_DISPLAY_NAMES.get(key, key),
                description=desc,
                incident_report=desc,
                issues=issues,
                potential_problems=issues,
                precautions=precautions,
                how_to_overcome=precautions,
                byproduct_issues=byproduct,
                prevention_tips=byproduct[:3] if byproduct else ["Report warning signs early"],
                emergency_note="In case of emergency, call 117 (DMC) or 1990 (Suwa Seriya Ambulance).",
            )

    return DEFAULT_ADVICE
