from __future__ import annotations

import json
from pathlib import Path


def main() -> None:
    output_dir = Path("artifacts")
    output_dir.mkdir(parents=True, exist_ok=True)
    class_names = ["fallen_tree", "road_damage", "water_logging"]
    model_manifest = {
        "model": "MobileNetV2 transfer learning",
        "status": "placeholder",
        "note": "Train on Colab using the curated data folders described in data/README.md",
        "expected_classes": class_names,
    }
    (output_dir / "model_manifest.json").write_text(json.dumps(model_manifest, indent=2), encoding="utf-8")
    (output_dir / "class_names.json").write_text(json.dumps(class_names, indent=2), encoding="utf-8")
    print("Wrote artifacts/model_manifest.json")


if __name__ == "__main__":
    main()
