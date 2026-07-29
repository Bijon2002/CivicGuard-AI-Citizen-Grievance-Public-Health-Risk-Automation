from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.db import init_db
from app.routers.auth import router as auth_router
from app.routers.departments import router as departments_router
from app.routers.health import router as health_router
from app.routers.reports import router as reports_router
from app.routers.weather import router as weather_router
from app.services.storage import storage_root

app = FastAPI(title=settings.app_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
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


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/")
def root() -> dict[str, str]:
    return {"name": settings.app_name, "status": "ready"}
