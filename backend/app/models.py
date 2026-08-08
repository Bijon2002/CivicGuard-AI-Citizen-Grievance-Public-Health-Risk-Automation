from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import ARRAY, DateTime, Float, ForeignKey, String, Text, Uuid, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def default_uuid() -> str:
    return str(uuid4())


class Base(DeclarativeBase):
    pass


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=default_uuid)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    issue_types: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)
    contact_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    reports: Mapped[list["Report"]] = relationship(back_populates="department")


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=default_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    department_id: Mapped[str | None] = mapped_column(Uuid(as_uuid=False), ForeignKey("departments.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    department: Mapped[Department | None] = relationship()
    status_changes: Mapped[list["StatusLog"]] = relationship(back_populates="changed_by_user")


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=default_uuid)
    photo_url: Mapped[str] = mapped_column(String(500), nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    hazard_type: Mapped[str] = mapped_column(String(100), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    department_id: Mapped[str | None] = mapped_column(Uuid(as_uuid=False), ForeignKey("departments.id"), nullable=True)
    dengue_risk: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="Reported")
    is_duplicate_of: Mapped[str | None] = mapped_column(Uuid(as_uuid=False), ForeignKey("reports.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    department: Mapped[Department | None] = relationship(back_populates="reports")
    status_history: Mapped[list["StatusLog"]] = relationship(back_populates="report", cascade="all, delete-orphan")
    prediction_audits: Mapped[list["PredictionAudit"]] = relationship(back_populates="report", cascade="all, delete-orphan")
    duplicate_of: Mapped["Report | None"] = relationship(remote_side="Report.id", uselist=False)


class StatusLog(Base):
    __tablename__ = "status_log"

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=default_uuid)
    report_id: Mapped[str] = mapped_column(Uuid(as_uuid=False), ForeignKey("reports.id"), nullable=False)
    changed_by: Mapped[str] = mapped_column(Uuid(as_uuid=False), ForeignKey("users.id"), nullable=False)
    old_status: Mapped[str] = mapped_column(String(30), nullable=False)
    new_status: Mapped[str] = mapped_column(String(30), nullable=False)
    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    report: Mapped[Report] = relationship(back_populates="status_history")
    changed_by_user: Mapped[User] = relationship(back_populates="status_changes")


class PredictionAudit(Base):
    __tablename__ = "predictions"

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=default_uuid)
    report_id: Mapped[str | None] = mapped_column(Uuid(as_uuid=False), ForeignKey("reports.id"), nullable=True)
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    hazard_type: Mapped[str] = mapped_column(String(100), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    model_name: Mapped[str] = mapped_column(String(100), nullable=False, default="mobilenetv2_civicguard")
    raw_output: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    report: Mapped[Report | None] = relationship(back_populates="prediction_audits")
