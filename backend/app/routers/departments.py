from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.deps import db_session
from app.models import Department
from app.schemas import DepartmentOut

router = APIRouter(prefix="/departments", tags=["departments"])


@router.get("", response_model=list[DepartmentOut])
def list_departments(db: Session = Depends(db_session)) -> list[DepartmentOut]:
    departments = db.query(Department).order_by(Department.name.asc()).all()
    return [DepartmentOut.model_validate(department, from_attributes=True) for department in departments]
