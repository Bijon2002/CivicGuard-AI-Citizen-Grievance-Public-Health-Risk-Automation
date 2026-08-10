import json
import logging
import os
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image

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
    (("sewage", "overflow", "drain", "drainage", "stagnant"), "severe", "sewage_overflow"),
    (("blocked", "choked", "clogged", "garbage", "dump"), "moderate", "blocked_drain"),
    (("road", "pothole", "damage", "broken"), "moderate", "road_damage"),
    (("tree", "fallen", "branch"), "moderate", "fallen_tree"),
    (("water", "flood", "flooding", "pond"), "severe", "water_logging"),
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
    explanation = f"Categorized as {inferred_hazard} using keyword heuristic."
    return PredictionResult(
        hazard_type=inferred_hazard,
        severity=inferred_severity,
        confidence=confidence,
        explanation=explanation,
    )


def prediction_to_dict(prediction: PredictionResult) -> dict[str, object]:
    return {
        "hazard_type": prediction.hazard_type,
        "severity": prediction.severity,
        "confidence": prediction.confidence,
        "explanation": prediction.explanation,
    }
