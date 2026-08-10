import json
import logging
import os
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image

from app.services.hazard_advice import get_hazard_advice

# Suppress TF logging
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class PredictionResult:
    hazard_type: str
    severity: str
    confidence: float
    explanation: str


KEYWORD_RULES: list[tuple[tuple[str, ...], str, str]] = [
    (("flood surge", "storm surge", "coastal flooding", "high waves", "flood", "waterlogging", "water logging", "inundated"), "severe", "water_logging"),
    (("heavy rain", "downpour", "rainstorm", "torrential rain"), "severe", "heavy_rain"),
    (("sewage", "overflow", "sewer"), "severe", "sewage_overflow"),
    (("blocked", "choked", "clogged", "drainage", "drain"), "moderate", "blocked_drain"),
    (("road construction", "trenches", "barrier", "excavation"), "moderate", "road_construction_hazard"),
    (("pothole", "crack", "uneven road", "road collapse", "damaged road"), "moderate", "road_damage"),
    (("tree fallen", "fallen tree", "branch", "leaning tree", "tree at risk"), "moderate", "fallen_tree"),
    (("power line", "live wire", "fallen wire", "electrical wire"), "severe", "fallen_power_line"),
    (("building collapse", "structural damage", "collapsed building", "damaged building"), "severe", "building_collapse"),
    (("fire", "smoke", "burning"), "severe", "fire"),
    (("burst pipe", "pipe burst", "water pipe", "water leak"), "moderate", "burst_water_pipe"),
    (("traffic signal", "signal failure", "traffic light"), "moderate", "traffic_signal_failure"),
    (("animal on road", "stray animal", "large animal", "cow on road", "dog on road"), "moderate", "stray_animals_on_road"),
    (("landslide", "mudslide", "rockfall", "rocks falling"), "severe", "landslide"),
    (("strong wind", "wind damage", "gust"), "moderate", "strong_wind"),
    (("chemical spill", "toxic spill", "hazmat"), "severe", "chemical_spill"),
    (("waste dumping", "garbage dump", "illegal dumping", "trash"), "moderate", "illegal_waste_dumping"),
    (("stagnant water", "standing water"), "moderate", "stagnant_water"),
    (("rodent", "rats", "mice infestation"), "moderate", "rodent_infestation"),
]

MODEL_DIR = Path(__file__).resolve().parent.parent.parent / "models"
MODEL_PATH = MODEL_DIR / "mobilenetv2_civicguard.keras"
CLASS_NAMES_PATH = MODEL_DIR / "class_names.json"

_model = None
_class_names: list[str] | None = None


def get_class_names() -> list[str]:
    global _class_names
    if _class_names is None:
        if not CLASS_NAMES_PATH.exists():
            return ["blocked_drain", "fallen_tree", "road_damage", "sewage_overflow", "water_logging"]
        try:
            raw_names = json.loads(CLASS_NAMES_PATH.read_text(encoding="utf-8"))
            if isinstance(raw_names, list) and raw_names and all(isinstance(item, str) and item for item in raw_names):
                _class_names = raw_names
            else:
                _class_names = ["blocked_drain", "fallen_tree", "road_damage", "sewage_overflow", "water_logging"]
        except Exception:
            _class_names = ["blocked_drain", "fallen_tree", "road_damage", "sewage_overflow", "water_logging"]
    return _class_names


def get_model():
    global _model
    if _model is None:
        try:
            import tensorflow as tf
        except ImportError:
            logger.warning("TensorFlow is not installed in the current environment. Fallback heuristic active.")
            return None
        except Exception as exc:
            logger.warning("Failed to import TensorFlow (%s). Fallback heuristic active.", exc)
            return None

        if not MODEL_PATH.exists():
            logger.warning("Model file not found at %s. Fallback heuristic active.", MODEL_PATH)
            return None

        try:
            _model = tf.keras.models.load_model(MODEL_PATH)
        except Exception as exc:
            logger.warning("Failed to load Keras model (%s). Fallback heuristic active.", exc)
            return None
    return _model


def classify_report(image_path: Path, description: str | None = None) -> PredictionResult:
    # 1. Determine severity and hazard_type from text heuristic if possible
    text = (description or "").lower()
    inferred_severity = "moderate"
    inferred_hazard = "blocked_drain"
    matched_rule = False

    for keywords, severity, hazard_type in KEYWORD_RULES:
        if any(keyword in text for keyword in keywords):
            inferred_severity = severity
            inferred_hazard = hazard_type
            matched_rule = True
            break

    if matched_rule:
        advice = get_hazard_advice(inferred_hazard)
        return PredictionResult(
            hazard_type=inferred_hazard,
            severity=inferred_severity,
            confidence=0.90,
            explanation=f"Categorized as {advice.display_name} using keyword heuristic.",
        )

    # 2. Try ML model inference if TensorFlow and model file are available
    try:
        model = get_model()
        if model is not None and image_path.exists():
            class_names = get_class_names()
            with Image.open(image_path) as img:
                img = img.convert("RGB").resize((224, 224))
                img_array = np.array(img, dtype=np.float32)
                img_array = np.expand_dims(img_array, axis=0)

            preds = model.predict(img_array, verbose=0)
            class_idx = int(np.argmax(preds[0]))
            confidence = float(preds[0][class_idx])

            if class_idx < len(class_names):
                hazard_type = class_names[class_idx]
                explanation = f"Predicted {hazard_type} via MobileNetV2 with {confidence:.2f} confidence."
                return PredictionResult(
                    hazard_type=hazard_type,
                    severity=inferred_severity,
                    confidence=confidence,
                    explanation=explanation,
                )
    except Exception as exc:
        logger.warning("ML model inference failed (%s). Falling back to text analysis heuristic.", exc)

    # 3. Fallback result when TensorFlow is not installed or model is unavailable
    confidence = 0.85 if matched_rule else 0.70
    advice = get_hazard_advice(inferred_hazard)
    explanation = f"Categorized as {advice.display_name} using keyword heuristic."
    return PredictionResult(
        hazard_type=inferred_hazard,
        severity=inferred_severity,
        confidence=confidence,
        explanation=explanation,
    )


def prediction_to_dict(prediction: PredictionResult) -> dict[str, object]:
    advice = get_hazard_advice(prediction.hazard_type)
    return {
        "hazard_type": prediction.hazard_type,
        "severity": prediction.severity,
        "confidence": prediction.confidence,
        "explanation": prediction.explanation,
        "hazard_guidance": {
            "hazard_type": advice.hazard_type,
            "display_name": advice.display_name,
            "incident_report": advice.incident_report,
            "potential_problems": advice.potential_problems,
            "how_to_overcome": advice.how_to_overcome,
            "prevention_tips": advice.prevention_tips,
            "emergency_note": advice.emergency_note,
        },
    }
