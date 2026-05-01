# face-api.js model weights

The Try-On Studio loads face detection + 68-landmark models from this directory at runtime.

Drop the following files here (download from
https://github.com/justadudewhohacks/face-api.js-models/tree/master/weights):

- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`
- `face_landmark_68_model-weights_manifest.json`
- `face_landmark_68_model-shard1`

A helper script is provided:

```bash
bash scripts/fetch-models.sh
```

If the models are missing, the studio gracefully falls back to a centered overlay.
