"""
Hazard Detection & Impact Analysis API
---------------------------------------
This API supports the "Image-Based Hazard Detection" project.

It exposes:
  1. GET  /hazards            -> list all known hazard types
  2. GET  /hazards/{name}     -> get issues, precautions, and byproduct issues for one hazard
  3. POST /predict            -> upload an image, get back the predicted hazard + full report

NOTE ON /predict:
  The actual trained CNN model (MobileNetV2/ResNet18) is NOT wired in yet.
  The predict_hazard_from_image() function below is a PLACEHOLDER so the rest
  of the team/agent can build the front end and test the API immediately.
  Replace the body of predict_hazard_from_image() with real model inference
  once the model is trained (see the comment inside that function).
"""

import json
import random
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Hazard Detection & Impact Analysis API",
    description="Detects a hazard from an uploaded image and returns issues, "
                "precautions, and byproduct (secondary) issues.",
    version="1.0.0",
)

# Allow the API to be called from a browser-based front end (Streamlit/React/etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # In production, replace "*" with your actual front-end URL
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Load hazard data (issues / precautions / byproduct issues) from JSON config
# ---------------------------------------------------------------------------
DATA_PATH = Path(__file__).parent / "hazard_data.json"

with open(DATA_PATH, "r", encoding="utf-8") as f:
    HAZARD_DATA: dict = json.load(f)


# ---------------------------------------------------------------------------
# Response models (defines the exact shape of the JSON the API returns)
# ---------------------------------------------------------------------------
class HazardReport(BaseModel):
    hazard: str
    description: str
    issues: list[str]
    precautions: list[str]
    byproduct_issues: list[str]


class PredictionResponse(BaseModel):
    predicted_hazard: str
    confidence: float
    report: HazardReport


# ---------------------------------------------------------------------------
# Helper: build a HazardReport object from the JSON config for a given hazard
# ---------------------------------------------------------------------------
def get_hazard_report(hazard_name: str) -> HazardReport:
    if hazard_name not in HAZARD_DATA:
        raise HTTPException(
            status_code=404,
            detail=f"Hazard '{hazard_name}' not found. "
                   f"Available hazards: {list(HAZARD_DATA.keys())}",
        )
    data = HAZARD_DATA[hazard_name]
    return HazardReport(
        hazard=hazard_name,
        description=data["description"],
        issues=data["issues"],
        precautions=data["precautions"],
        byproduct_issues=data["byproduct_issues"],
    )


# ---------------------------------------------------------------------------
# PLACEHOLDER model inference function
# ---------------------------------------------------------------------------
def predict_hazard_from_image(image_bytes: bytes) -> tuple[str, float]:
    """
    Placeholder for the real trained model.

    TODO (replace this function body once the CNN model is trained):
        1. Load the trained model once at startup (not on every request):
               model = load_model("hazard_model.h5")  # or torch.load(...)
        2. Preprocess image_bytes -> resize, normalize, convert to tensor/array
               matching the input shape the model was trained on.
        3. Run inference:
               prediction = model.predict(preprocessed_image)
        4. Map the output index to a class name using the same label order
           used during training, e.g.:
               classes = ["Flood", "FallenTree", "RoadDamage", "Accident", "NoHazard"]
               predicted_class = classes[prediction.argmax()]
               confidence = float(prediction.max())
        5. Return (predicted_class, confidence)

    Current behavior (TEMPORARY):
        Randomly picks a hazard so the API/front-end integration can be tested
        end-to-end before the real model is ready.
    """
    classes = list(HAZARD_DATA.keys())
    predicted_class = random.choice(classes)
    confidence = round(random.uniform(0.70, 0.99), 2)
    return predicted_class, confidence


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/", tags=["Health"])
def root():
    """Simple health check so you can confirm the API is running."""
    return {"status": "ok", "message": "Hazard Detection API is running."}


@app.get("/hazards", response_model=list[str], tags=["Hazards"])
def list_hazards():
    """Return the list of all hazard types the system knows about."""
    return list(HAZARD_DATA.keys())


@app.get("/hazards/{hazard_name}", response_model=HazardReport, tags=["Hazards"])
def get_hazard(hazard_name: str):
    """
    Get the full report (issues, precautions, byproduct issues) for one hazard.
    Example: GET /hazards/Flood
    """
    return get_hazard_report(hazard_name)


@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
async def predict(file: UploadFile = File(...)):
    """
    Upload an image. The API predicts the hazard shown in the image and
    returns the matching issues/precautions/byproduct-issues report.

    Example (curl):
        curl -X POST "http://127.0.0.1:8000/predict" \\
             -F "file=@my_road_photo.jpg"
    """
    # Basic validation: only accept image files
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    image_bytes = await file.read()

    # --- Model inference (placeholder for now, see function docstring above) ---
    predicted_hazard, confidence = predict_hazard_from_image(image_bytes)

    report = get_hazard_report(predicted_hazard)

    return PredictionResponse(
        predicted_hazard=predicted_hazard,
        confidence=confidence,
        report=report,
    )


# ---------------------------------------------------------------------------
# Run directly with: python app.py
# (or, more commonly for development: uvicorn app:app --reload)
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
