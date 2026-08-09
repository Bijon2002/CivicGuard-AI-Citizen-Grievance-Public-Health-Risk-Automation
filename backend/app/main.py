import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import OperationalError

from app.core.config import settings
from app.db import init_db
from app.routers.auth import router as auth_router
from app.routers.departments import router as departments_router
from app.routers.health import router as health_router
from app.routers.reports import router as reports_router
from app.routers.weather import router as weather_router
from app.services.storage import storage_root

app = FastAPI(title=settings.app_name, version="1.0.0")
logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:8501",
        "http://127.0.0.1:5173",
        "https://civicguard-ai-citizen-grievance-public-health-risk-automat.pages.dev",
    ],
    allow_origin_regex=r"https://.*\.pages\.dev",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router, prefix=settings.api_v1_prefix)
app.include_router(departments_router, prefix=settings.api_v1_prefix)
app.include_router(reports_router, prefix=settings.api_v1_prefix)
app.include_router(weather_router, prefix=settings.api_v1_prefix)

app.mount("/media", StaticFiles(directory=storage_root()), name="media")


@app.exception_handler(Exception)
async def global_exception_handler(request, exc: Exception):
    logger.error("Unhandled error: %s", exc, exc_info=True)
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=500,
        content={"detail": f"Backend Error: {str(exc)}"},
    )


@app.on_event("startup")
def on_startup() -> None:
    try:
        init_db()
    except Exception as exc:
        logger.warning("Database initialization skipped because the Supabase connection is unavailable: %s", exc)


@app.get("/")
def root() -> dict[str, str]:
    return {"name": settings.app_name, "status": "ready"}
