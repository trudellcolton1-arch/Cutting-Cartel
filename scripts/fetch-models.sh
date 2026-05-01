#!/usr/bin/env bash
# Download face-api.js model weights into public/models for the Try-On Studio.
set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)/public/models"
mkdir -p "$DIR"

BASE="https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/weights"
FILES=(
  "tiny_face_detector_model-weights_manifest.json"
  "tiny_face_detector_model-shard1"
  "face_landmark_68_model-weights_manifest.json"
  "face_landmark_68_model-shard1"
)

for f in "${FILES[@]}"; do
  echo "→ $f"
  curl -fsSL "$BASE/$f" -o "$DIR/$f"
done

echo "✓ Models downloaded to public/models"
