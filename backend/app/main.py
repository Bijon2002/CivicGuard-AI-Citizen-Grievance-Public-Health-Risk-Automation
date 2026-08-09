import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response
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
logger = logging.getLogger(__name__)


# ---------- SINGLE BULLETPROOF CORS MIDDLEWARE ----------
# No CORSMiddleware from Starlette — it silently drops headers on errors.
# This middleware wraps call_next in try/except so CORS headers are ALWAYS
# present on every response, including 500s and unhandled exceptions.
@app.middleware("http")
async def cors_middleware(request: Request, call_next):
    origin = request.headers.get("origin", "*")

    # Preflight
    if request.method == "OPTIONS":
        return Response(
            status_code=200,
            headers={
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Max-Age": "86400",
            },
        )

    # Normal request — guarantee CORS headers even on crash
    try:
        response = await call_next(request)
    except Exception as exc:
        logger.error("Unhandled error in request %s %s: %s", request.method, request.url.path, exc, exc_info=True)
        response = JSONResponse(
            status_code=500,
            content={"detail": f"Internal Server Error: {type(exc).__name__}: {exc}"},
        )

    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response


# ---------- ROUTES ----------
app.include_router(health_router)
app.include_router(auth_router, prefix=settings.api_v1_prefix)
app.include_router(departments_router, prefix=settings.api_v1_prefix)
app.include_router(reports_router, prefix=settings.api_v1_prefix)
app.include_router(weather_router, prefix=settings.api_v1_prefix)

app.mount("/media", StaticFiles(directory=storage_root()), name="media")


@app.on_event("startup")
def on_startup() -> None:
    try:
        init_db()
    except Exception as exc:
        logger.warning("Database initialization skipped: %s", exc)


@app.get("/")
def root() -> dict[str, str]:
    return {"name": settings.app_name, "status": "ready"}
