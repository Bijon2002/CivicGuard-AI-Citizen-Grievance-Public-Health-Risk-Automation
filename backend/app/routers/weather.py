from dataclasses import asdict

from fastapi import APIRouter, HTTPException, Query

from app.schemas import WeatherDayOut, WeatherSummaryOut
from app.services.weather import fetch_weather_forecast

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("", response_model=WeatherSummaryOut)
async def weather(lat: float = Query(..., alias="lat"), lng: float = Query(..., alias="lng")) -> WeatherSummaryOut:
    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        raise HTTPException(status_code=400, detail="Invalid latitude or longitude")

    forecast = await fetch_weather_forecast(lat, lng)
    return WeatherSummaryOut(
        latitude=lat,
        longitude=lng,
        risk_window_days=5,
        days=[WeatherDayOut(**asdict(day)) for day in forecast[:5]],
    )
