from __future__ import annotations

import json
from pathlib import Path


def main() -> None:
    output_dir = Path("artifacts")
    output_dir.mkdir(parents=True, exist_ok=True)
    model_manifest = {
        "model": "MobileNetV2 transfer learning",
        "status": "placeholder",
        "note": "Train on Colab using the curated data folders described in data/README.md",
        "expected_classes": ["blocked_drain", "sewage_overflow", "road_damage", "fallen_tree", "water_logging"],
    }
    (output_dir / "model_manifest.json").write_text(json.dumps(model_manifest, indent=2), encoding="utf-8")
    print("Wrote artifacts/model_manifest.json")


if __name__ == "__main__":
    main()
