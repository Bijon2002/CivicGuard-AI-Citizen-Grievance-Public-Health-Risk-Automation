import logging
from collections.abc import Generator
from uuid import uuid4

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

logger = logging.getLogger(__name__)


def build_engine():
    db_url = settings.database_url
    if db_url.startswith("sqlite"):
        return create_engine(db_url, future=True, connect_args={"check_same_thread": False})

    try:
        eng = create_engine(db_url, future=True, connect_args={"connect_timeout": 5})
        with eng.connect() as conn:
            conn.execute(select(1))
        logger.info("Successfully connected to primary database.")
        return eng
    except Exception as exc:
        logger.warning("Primary database connection failed (%s). Falling back to SQLite database.", exc)
        return create_engine("sqlite:///./civicguard.db", future=True, connect_args={"check_same_thread": False})


engine = build_engine()
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)

from app.models import Base, Department, User  # noqa: E402
from app.core.security import hash_password  # noqa: E402


_initialized = False


def init_db() -> None:
    global _initialized
    try:
        Base.metadata.create_all(bind=engine)
        with SessionLocal() as session:
            seed_defaults(session)
        _initialized = True
        logger.info("Database initialized and default users seeded successfully.")
    except Exception as exc:
        logger.warning("Database initialization error: %s", exc)


def get_db() -> Generator[Session, None, None]:
    if not _initialized:
        init_db()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


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
