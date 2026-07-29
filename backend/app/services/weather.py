from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

import httpx

from app.core.config import settings


@dataclass(slots=True)
class WeatherDay:
    date: str
    precipitation_sum_mm: float
    precipitation_probability_max: float


async def fetch_weather_forecast(latitude: float, longitude: float) -> list[WeatherDay]:
    url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={latitude}&longitude={longitude}&daily=precipitation_sum,precipitation_probability_max"
        "&timezone=auto"
    )
    timeout = httpx.Timeout(settings.open_meteo_timeout_seconds)
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(url)
            response.raise_for_status()
            payload = response.json().get("daily", {})
            dates = payload.get("time", [])
            rain = payload.get("precipitation_sum", [])
            probability = payload.get("precipitation_probability_max", [])
            return [
                WeatherDay(
                    date=str(date),
                    precipitation_sum_mm=float(rain[index]) if index < len(rain) else 0.0,
                    precipitation_probability_max=float(probability[index]) if index < len(probability) else 0.0,
                )
                for index, date in enumerate(dates)
            ]
    except Exception:
        today = datetime.now().date()
        return [WeatherDay(date=str(today), precipitation_sum_mm=0.0, precipitation_probability_max=0.0)]
