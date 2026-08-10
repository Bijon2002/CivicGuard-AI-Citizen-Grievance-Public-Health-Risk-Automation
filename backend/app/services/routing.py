from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Department


def resolve_department(session: Session, hazard_type: str) -> Department | None:
    departments = session.scalars(select(Department)).all()
    normalized = hazard_type.replace(" ", "_").replace("-", "_").replace("/", "_").lower()
    for department in departments:
        issue_types = {item.replace(" ", "_").replace("-", "_").replace("/", "_").lower() for item in (department.issue_types or [])}
        if normalized in issue_types:
            return department

    fallback = {
        "blocked_drain": "Municipal Council",
        "sewage_overflow": "Water Board",
        "road_damage": "Road Development Authority",
        "water_logging": "Public Health Office",
        "fallen_tree": "Road Development Authority",
        "heavy_rain": "Municipal Council",
        "large_pothole": "Road Development Authority",
        "tree_fallen_on_road": "Road Development Authority",
        "tree_at_risk_of_falling": "Road Development Authority",
        "building_collapse": "Municipal Council",
        "fire": "Municipal Council",
        "burst_water_pipe": "Water Board",
        "blocked_drainage": "Municipal Council",
        "illegal_waste_dumping": "Municipal Council",
        "fallen_power_line": "Municipal Council",
        "damaged_building": "Municipal Council",
        "traffic_signal_failure": "Municipal Council",
        "smoke_air_pollution": "Public Health Office",
        "stray_animals_on_road": "Municipal Council",
        "large_animal_on_road": "Municipal Council",
        "coastal_flooding": "Public Health Office",
        "landslide": "Road Development Authority",
        "rockfall": "Road Development Authority",
        "strong_wind": "Municipal Council",
        "high_waves": "Public Health Office",
        "stagnant_water": "Public Health Office",
        "rodent_infestation": "Public Health Office",
        "chemical_spill": "Public Health Office",
        "road_construction_hazard": "Road Development Authority",
    }
    target_name = fallback.get(hazard_type)
    if target_name is None:
        return departments[0] if departments else None
    return next((department for department in departments if department.name == target_name), departments[0] if departments else None)


def route_issue(session: Session, hazard_type: str) -> tuple[str | None, str | None]:
    department = resolve_department(session, hazard_type)
    return (department.id, department.name) if department else (None, None)
