from __future__ import annotations

import argparse
import shutil
from pathlib import Path


def copy_images(source_root: Path, destination_root: Path) -> int:
    copied = 0
    for class_dir in source_root.iterdir():
        if not class_dir.is_dir():
            continue
        destination_class = destination_root / class_dir.name
        destination_class.mkdir(parents=True, exist_ok=True)
        for image_file in class_dir.glob("*.*"):
            if image_file.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
                continue
            shutil.copy2(image_file, destination_class / image_file.name)
            copied += 1
    return copied


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare the curated hazard dataset")
    parser.add_argument("source", type=Path, help="Path to curated raw dataset")
    parser.add_argument("destination", type=Path, help="Path to processed dataset")
    args = parser.parse_args()

    args.destination.mkdir(parents=True, exist_ok=True)
    total = copy_images(args.source, args.destination)
    print(f"Copied {total} images into {args.destination}")


if __name__ == "__main__":
    main()
