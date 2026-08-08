import asyncio
import os
from pathlib import Path
from PIL import Image

# Ensure TF logs are suppressed
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

from app.services.ml import classify_report, get_model

def main():
    print("Loading model...")
    model = get_model()
    print("Model loaded successfully.")
    
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
