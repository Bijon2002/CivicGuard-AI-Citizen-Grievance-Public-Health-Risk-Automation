import os
import json
from dataclasses import dataclass
from pathlib import Path
import numpy as np
from PIL import Image

# Suppress TF logging
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"


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
            raise RuntimeError(f"Missing class metadata file: {CLASS_NAMES_PATH}")
        raw_names = json.loads(CLASS_NAMES_PATH.read_text(encoding="utf-8"))
        if not isinstance(raw_names, list) or not raw_names or not all(isinstance(item, str) and item for item in raw_names):
            raise RuntimeError(f"Invalid class metadata in {CLASS_NAMES_PATH}")
        _class_names = raw_names
    return _class_names

def get_model():
    global _model
    if _model is None:
        try:
            import tensorflow as tf
        except ModuleNotFoundError as exc:
            raise RuntimeError(
                "TensorFlow is not installed in the Python interpreter that started the backend. "
                "Start uvicorn with the project venv: d:/AI_Driven_Srilanka/.venv/Scripts/python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
            ) from exc
        if not MODEL_PATH.exists():
            raise RuntimeError(f"Missing trained model file: {MODEL_PATH}")
        _model = tf.keras.models.load_model(MODEL_PATH)
    return _model


def classify_report(image_path: Path, description: str | None = None) -> PredictionResult:
    # 1. Determine severity from text heuristic if possible
    text = (description or "").lower()
    inferred_severity = "moderate"
    for keywords, severity, _ in KEYWORD_RULES:
        if any(keyword in text for keyword in keywords):
            inferred_severity = severity
            break

    # 2. Use ML model for hazard_type
    model = get_model()
    class_names = get_class_names()

    with Image.open(image_path) as img:
        img = img.convert("RGB").resize((224, 224))
        # Model has preprocessing baked in, so pass raw 0-255 values.
        img_array = np.array(img, dtype=np.float32)
        img_array = np.expand_dims(img_array, axis=0)

    preds = model.predict(img_array, verbose=0)
    class_idx = int(np.argmax(preds[0]))
    confidence = float(preds[0][class_idx])

    if class_idx >= len(class_names):
        raise RuntimeError(
            f"Model predicted class index {class_idx}, but only {len(class_names)} class names are defined in {CLASS_NAMES_PATH}"
        )

    hazard_type = class_names[class_idx]
    explanation = f"Predicted {hazard_type} via MobileNetV2 with {confidence:.2f} confidence."

    return PredictionResult(
        hazard_type=hazard_type,
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
