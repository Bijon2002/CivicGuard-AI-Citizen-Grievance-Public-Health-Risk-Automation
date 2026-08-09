import asyncio
import json
import os
from pathlib import Path
from PIL import Image

# Ensure TF logs are suppressed
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

from app.services.ml import classify_report, get_class_names, get_model

def main():
    print("Loading model...")
    try:
        model = get_model()
        print("Model loaded successfully.")
        print("Model output shape:", model.output_shape)
        print("Class names:", get_class_names())
        if model.output_shape[-1] != len(get_class_names()):
            raise RuntimeError(
                f"Model output units ({model.output_shape[-1]}) do not match class metadata ({len(get_class_names())})."
            )
    except Exception as e:
        print(f"Model load skipped/fallback active: {e}")
    
    # Create a dummy image for testing
    img_path = Path("dummy.jpg")
    img = Image.new("RGB", (224, 224), color="blue")
    img.save(img_path)
    
    print("Running classification...")
    result = classify_report(img_path, description="There is a lot of stagnant sewage water.")
    print(f"Classification Result: {result}")
    
    # Cleanup
    img_path.unlink()

if __name__ == "__main__":
    main()
