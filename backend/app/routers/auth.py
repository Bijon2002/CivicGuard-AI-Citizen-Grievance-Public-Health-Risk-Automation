from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, verify_password
from app.deps import current_user, db_session
from app.models import User
from app.schemas import LoginRequest, TokenResponse, UserOut

from sqlalchemy import select
from app.db import seed_defaults

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(db_session)) -> TokenResponse:
    if db.scalar(select(User.id).limit(1)) is None:
        seed_defaults(db)
    user = db.query(User).filter(User.email == payload.email).one_or_none()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token(subject=user.email, role=user.role)
    dept_name = user.department.name if user.department else None
    return TokenResponse(
        access_token=token,
        role=user.role,
        email=user.email,
        department_id=user.department_id,
        department_name=dept_name,
    )


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)) -> UserOut:
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    return UserOut.model_validate(user, from_attributes=True)
