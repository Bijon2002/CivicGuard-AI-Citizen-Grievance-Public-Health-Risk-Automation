from collections.abc import Generator
from uuid import uuid4

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

if settings.database_url.startswith("sqlite"):
    engine_kwargs: dict[str, object] = {"future": True, "connect_args": {"check_same_thread": False}}
else:
    engine_kwargs: dict[str, object] = {"future": True, "connect_args": {"connect_timeout": 3}}

engine = create_engine(settings.database_url, **engine_kwargs)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)

from app.models import Base, Department, User  # noqa: E402
from app.core.security import hash_password  # noqa: E402


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        seed_defaults(session)


def seed_defaults(session: Session) -> None:
    if session.scalar(select(Department.id).limit(1)) is None:
        departments = [
            Department(id=str(uuid4()), name="Municipal Council", issue_types=["blocked_drain", "garbage_dump", "water_logging"], contact_email="council@civicguard.local"),
            Department(id=str(uuid4()), name="Water Board", issue_types=["sewage_overflow", "water_leak", "pipe_burst"], contact_email="waterboard@civicguard.local"),
            Department(id=str(uuid4()), name="Road Development Authority", issue_types=["road_damage", "pothole", "fallen_tree"], contact_email="roads@civicguard.local"),
            Department(id=str(uuid4()), name="Public Health Office", issue_types=["blocked_drain", "sewage_overflow", "stagnant_water"], contact_email="health@civicguard.local"),
        ]
        session.add_all(departments)
        session.commit()

    if session.scalar(select(User.id).limit(1)) is None:
        mc_id = session.scalar(select(Department.id).where(Department.name == "Municipal Council"))
        wb_id = session.scalar(select(Department.id).where(Department.name == "Water Board"))
        rda_id = session.scalar(select(Department.id).where(Department.name == "Road Development Authority"))
        pho_id = session.scalar(select(Department.id).where(Department.name == "Public Health Office"))
        users = [
            User(id=str(uuid4()), email="admin@civicguard.local", password_hash=hash_password("Admin@1234!"), role="admin", department_id=None),
            User(id=str(uuid4()), email="council@civicguard.local", password_hash=hash_password("Council@1234!"), role="officer", department_id=mc_id),
            User(id=str(uuid4()), email="waterboard@civicguard.local", password_hash=hash_password("Water@1234!"), role="officer", department_id=wb_id),
            User(id=str(uuid4()), email="roads@civicguard.local", password_hash=hash_password("Roads@1234!"), role="officer", department_id=rda_id),
            User(id=str(uuid4()), email="health@civicguard.local", password_hash=hash_password("Health@1234!"), role="health_official", department_id=pho_id),
        ]
        session.add_all(users)
        session.commit()
