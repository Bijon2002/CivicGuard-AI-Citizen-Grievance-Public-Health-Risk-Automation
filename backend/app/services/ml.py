from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageStat


@dataclass(slots=True)
class PredictionResult:
    hazard_type: str
    severity: str
    confidence: float
    explanation: str


KEYWORD_RULES: list[tuple[tuple[str, ...], str, str]] = [
    (("sewage", "overflow", "drain", "drainage", "stagnant"), "severe", "sewage_overflow"),
    (("blocked", "choked", "clogged", "garbage", "dump"), "moderate", "blocked_drain"),
    (("road", "pothole", "damage", "broken"), "moderate", "road_damage"),
    (("tree", "fallen", "branch"), "moderate", "fallen_tree"),
    (("water", "flood", "flooding", "pond"), "severe", "water_logging"),
]


def _score_image(image_path: Path) -> tuple[float, float]:
    try:
        with Image.open(image_path) as image:
            grayscale = image.convert("L")
            stats = ImageStat.Stat(grayscale)
            mean = stats.mean[0] / 255.0
            stddev = stats.stddev[0] / 255.0
            return mean, stddev
    except Exception:
        return 0.5, 0.25


def classify_report(image_path: Path, description: str | None = None) -> PredictionResult:
    text = (description or "").lower()
    for keywords, severity, hazard_type in KEYWORD_RULES:
        if any(keyword in text for keyword in keywords):
            return PredictionResult(
                hazard_type=hazard_type,
                severity=severity,
                confidence=0.91,
                explanation=f"Matched description keywords for {hazard_type}",
            )

    mean, stddev = _score_image(image_path)
    if mean < 0.28 and stddev > 0.18:
        return PredictionResult("blocked_drain", "severe", 0.74, "Dark high-contrast scene likely indicates waterlogging or blockage")
    if mean < 0.42:
        return PredictionResult("water_logging", "moderate", 0.66, "Low-light image suggests standing water or low-visibility hazard")
    if stddev < 0.12:
        return PredictionResult("road_damage", "mild", 0.58, "Low texture variation suggests a simple surface defect or minor issue")
    return PredictionResult("blocked_drain", "moderate", 0.61, "Fallback heuristic used because no clear textual signal was available")


def prediction_to_dict(prediction: PredictionResult) -> dict[str, object]:
    return {
        "hazard_type": prediction.hazard_type,
        "severity": prediction.severity,
        "confidence": prediction.confidence,
        "explanation": prediction.explanation,
    }
