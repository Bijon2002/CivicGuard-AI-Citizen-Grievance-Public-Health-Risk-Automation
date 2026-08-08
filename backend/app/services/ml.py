import os
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

# Configure your class map here (mapping the 3 model outputs to their corresponding classes)
MODEL_CLASSES = ["blocked_drain", "sewage_overflow", "road_damage"]

_model = None

def get_model():
    global _model
    if _model is None:
        import tensorflow as tf
        model_path = Path(__file__).parent.parent.parent / "models" / "mobilenetv2_civicguard.keras"
        _model = tf.keras.models.load_model(model_path)
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
    try:
        model = get_model()
        with Image.open(image_path) as img:
            img = img.convert("RGB").resize((224, 224))
            # Model has Rescaling baked in (TrueDivide & Subtract), so pass raw 0-255 values
            img_array = np.array(img, dtype=np.float32)
            img_array = np.expand_dims(img_array, axis=0)

        preds = model.predict(img_array, verbose=0)
        class_idx = np.argmax(preds[0])
        confidence = float(preds[0][class_idx])

        if class_idx < len(MODEL_CLASSES):
            hazard_type = MODEL_CLASSES[class_idx]
        else:
            hazard_type = "unknown"

        explanation = f"Predicted {hazard_type} via MobileNetV2 with {confidence:.2f} confidence."

    except Exception as e:
        hazard_type = "blocked_drain"
        confidence = 0.5
        explanation = f"Fallback heuristic used due to ML error: {e}"

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
