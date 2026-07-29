from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.deps import db_session, require_role
from app.models import PredictionAudit, Report, StatusLog, User
from app.schemas import PredictResponse, PredictionOut, ReportCreatedResponse, ReportOut, ReportPublicOut, ReportStatusUpdate, StatusLogOut
from app.services.dengue_risk import calculate_dengue_risk
from app.services.ml import classify_report, prediction_to_dict
from app.services.routing import route_issue
from app.services.storage import save_photo
from app.services.weather import fetch_weather_forecast

router = APIRouter(prefix="/reports", tags=["reports"])

VALID_STATUSES = {"Reported", "Assigned", "In Progress", "Resolved"}


def _serialize_report(report: Report) -> ReportOut:
    status_history = [
        StatusLogOut.model_validate(item, from_attributes=True)
        for item in sorted(report.status_history, key=lambda item: item.changed_at)
    ]
    predictions = [PredictionOut.model_validate(item, from_attributes=True) for item in report.prediction_audits]
    department_name = report.department.name if report.department else None
    return ReportOut(
        id=report.id,
        photo_url=report.photo_url,
        lat=report.lat,
        lng=report.lng,
        description=report.description,
        hazard_type=report.hazard_type,
        severity=report.severity,
        confidence=report.confidence,
        department_id=report.department_id,
        dengue_risk=report.dengue_risk,
        status=report.status,
        is_duplicate_of=report.is_duplicate_of,
        created_at=report.created_at,
        updated_at=report.updated_at,
        department_name=department_name,
        status_history=status_history,
        predictions=predictions,
    )


@router.post("", response_model=ReportCreatedResponse)
async def create_report(
    photo: UploadFile = File(...),
    lat: float = Form(...),
    lng: float = Form(...),
    description: str | None = Form(default=None),
    db: Session = Depends(db_session),
) -> ReportCreatedResponse:
    saved_photo_url = await save_photo(photo)
    report = Report(
        id=str(uuid4()),
        photo_url=saved_photo_url,
        lat=lat,
        lng=lng,
        description=description,
        hazard_type="pending",
        severity="pending",
        confidence=0.0,
        dengue_risk="Low",
        status="Reported",
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    prediction = classify_report(Path(settings.storage_root) / saved_photo_url.replace("/media/", ""), description)
    department_id, _ = route_issue(db, prediction.hazard_type)
    forecast = await fetch_weather_forecast(lat, lng)
    rainfall = [day.precipitation_sum_mm for day in forecast[:5]]
    dengue_risk = calculate_dengue_risk(prediction.severity, rainfall)

    report.hazard_type = prediction.hazard_type
    report.severity = prediction.severity
    report.confidence = prediction.confidence
    report.department_id = department_id
    report.dengue_risk = dengue_risk
    report.status = "Reported"

    if department_id is not None:
        duplicate = (
            db.execute(
                select(Report)
                .where(Report.department_id == department_id)
                .where(Report.lat.between(lat - 0.002, lat + 0.002))
                .where(Report.lng.between(lng - 0.002, lng + 0.002))
                .where(Report.status != "Resolved")
                .order_by(Report.created_at.desc())
            )
            .scalars()
            .first()
        )
        if duplicate is not None and duplicate.id != report.id:
            report.is_duplicate_of = duplicate.id

    audit = PredictionAudit(
        report_id=report.id,
        image_url=report.photo_url,
        hazard_type=prediction.hazard_type,
        severity=prediction.severity,
        confidence=prediction.confidence,
        model_name="demo-heuristic",
        raw_output=str(prediction_to_dict(prediction)),
    )
    db.add(audit)
    db.commit()
    db.refresh(report)
    return ReportCreatedResponse(report=_serialize_report(report), duplicate_of=report.is_duplicate_of)


@router.get("", response_model=list[ReportPublicOut])
def list_reports(
    department_id: str | None = None,
    severity: str | None = None,
    dengue_risk: str | None = None,
    status_value: str | None = None,
    db: Session = Depends(db_session),
) -> list[ReportPublicOut]:
    query = select(Report).order_by(Report.created_at.desc())
    if department_id:
        query = query.where(Report.department_id == department_id)
    if severity:
        query = query.where(Report.severity == severity)
    if dengue_risk:
        query = query.where(Report.dengue_risk == dengue_risk)
    if status_value:
        query = query.where(Report.status == status_value)

    reports = db.scalars(query).all()
    return [
        ReportPublicOut(
            id=report.id,
            photo_url=report.photo_url,
            lat=report.lat,
            lng=report.lng,
            hazard_type=report.hazard_type,
            severity=report.severity,
            dengue_risk=report.dengue_risk,
            status=report.status,
            created_at=report.created_at,
            department_name=report.department.name if report.department else None,
        )
        for report in reports
    ]


@router.get("/{report_id}", response_model=ReportOut)
def get_report(report_id: str, db: Session = Depends(db_session)) -> ReportOut:
    report = db.get(Report, report_id)
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return _serialize_report(report)


@router.patch("/{report_id}/status", response_model=ReportOut)
def update_status(
    report_id: str,
    payload: ReportStatusUpdate,
    db: Session = Depends(db_session),
    user: User = Depends(require_role("officer", "health_official", "admin")),
) -> ReportOut:
    if payload.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status value")

    report = db.get(Report, report_id)
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    previous_status = report.status
    report.status = payload.status
    db.add(
        StatusLog(
            id=str(uuid4()),
            report_id=report.id,
            changed_by=user.id,
            old_status=previous_status,
            new_status=payload.status,
        )
    )
    db.commit()
    db.refresh(report)
    return _serialize_report(report)


@router.post("/predict", response_model=PredictResponse)
async def predict(photo: UploadFile = File(...), description: str | None = Form(default=None)) -> PredictResponse:
    saved_url = await save_photo(photo)
    result = classify_report(Path(settings.storage_root) / saved_url.replace("/media/", ""), description)
    return PredictResponse(**prediction_to_dict(result))
