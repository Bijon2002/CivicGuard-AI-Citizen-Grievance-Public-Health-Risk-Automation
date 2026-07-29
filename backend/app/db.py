from collections.abc import Generator
from uuid import uuid4

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

engine_kwargs: dict[str, object] = {"future": True}
if settings.database_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

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
        users = [
            User(id=str(uuid4()), email="admin@civicguard.local", password_hash=hash_password("Admin@1234!"), role="admin", department_id=None),
            User(id=str(uuid4()), email="officer@civicguard.local", password_hash=hash_password("Officer@1234!"), role="officer", department_id=session.scalar(select(Department.id).where(Department.name == "Municipal Council"))),
            User(id=str(uuid4()), email="health@civicguard.local", password_hash=hash_password("Health@1234!"), role="health_official", department_id=session.scalar(select(Department.id).where(Department.name == "Public Health Office"))),
        ]
        session.add_all(users)
        session.commit()
