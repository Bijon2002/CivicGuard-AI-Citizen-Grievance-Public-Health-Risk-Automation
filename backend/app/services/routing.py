from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Department


def resolve_department(session: Session, hazard_type: str) -> Department | None:
    departments = session.scalars(select(Department)).all()
    for department in departments:
        if hazard_type in (department.issue_types or []):
            return department

    fallback = {
        "blocked_drain": "Municipal Council",
        "sewage_overflow": "Water Board",
        "road_damage": "Road Development Authority",
        "water_logging": "Public Health Office",
        "fallen_tree": "Road Development Authority",
    }
    target_name = fallback.get(hazard_type)
    if target_name is None:
        return departments[0] if departments else None
    return next((department for department in departments if department.name == target_name), departments[0] if departments else None)


def route_issue(session: Session, hazard_type: str) -> tuple[str | None, str | None]:
    department = resolve_department(session, hazard_type)
    return (department.id, department.name) if department else (None, None)
