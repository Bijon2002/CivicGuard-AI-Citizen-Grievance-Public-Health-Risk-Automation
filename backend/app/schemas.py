from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class DepartmentOut(BaseModel):
    id: str
    name: str
    issue_types: list[str]
    contact_email: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    email: str
    department_id: str | None = None
    department_name: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: str
    email: EmailStr
    role: str
    department_id: str | None = None


class StatusLogOut(BaseModel):
    id: str
    report_id: str
    changed_by: str
    old_status: str
    new_status: str
    changed_at: datetime


class PredictionOut(BaseModel):
    id: str
    report_id: str | None = None
    image_url: str
    hazard_type: str
    severity: str
    confidence: float
    model_name: str
    raw_output: str | None = None
    created_at: datetime


class HazardGuidanceOut(BaseModel):
    hazard_type: str
    display_name: str
    description: str = ""
    incident_report: str = ""
    issues: list[str] = Field(default_factory=list)
    potential_problems: list[str] = Field(default_factory=list)
    precautions: list[str] = Field(default_factory=list)
    how_to_overcome: list[str] = Field(default_factory=list)
    byproduct_issues: list[str] = Field(default_factory=list)
    prevention_tips: list[str] = Field(default_factory=list)
    emergency_note: str = ""


class ReportPublicOut(BaseModel):
    id: str
    photo_url: str
    lat: float
    lng: float
    hazard_type: str
    severity: str
    dengue_risk: str
    status: str
    created_at: datetime
    department_name: str | None = None


class ReportOut(ReportPublicOut):
    description: str | None = None
    confidence: float
    department_id: str | None = None
    is_duplicate_of: str | None = None
    updated_at: datetime
    status_history: list[StatusLogOut] = Field(default_factory=list)
    predictions: list[PredictionOut] = Field(default_factory=list)
    hazard_guidance: HazardGuidanceOut | None = None


class ReportStatusUpdate(BaseModel):
    status: str


class ReportCreatedResponse(BaseModel):
    report: ReportOut
    duplicate_of: str | None = None


class WeatherDayOut(BaseModel):
    date: str
    precipitation_sum_mm: float = 0.0
    precipitation_probability_max: float = 0.0


class WeatherSummaryOut(BaseModel):
    latitude: float
    longitude: float
    risk_window_days: int
    days: list[WeatherDayOut]


class PredictResponse(BaseModel):
    hazard_type: str
    severity: str
    confidence: float
    explanation: str
    hazard_guidance: HazardGuidanceOut | None = None
