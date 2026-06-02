# Evaluation Metrics

Visible watermark research often benefits from separating detection quality from image quality.

## Detection Metrics

Use these when a dataset includes ground-truth watermark boxes.

- Intersection over Union: overlap between predicted and labeled boxes
- precision: share of predicted marks that are correct
- recall: share of labeled marks that are found
- confidence calibration: whether confidence values match observed accuracy

## Region Quality Metrics

Use these when comparing a marked image and a processed image over the same region.

- PSNR: pixel-level distortion, best for paired images
- SSIM: local structural similarity
- LPIPS: perceptual similarity with a learned model
- edge residual score: edge strength remaining inside the watermark region
- color deviation: average color shift inside and around the region

## Suggested JSON Report

```json
{
  "image": "sample-001.png",
  "watermark_bbox": { "x": 1320, "y": 690, "width": 72, "height": 72 },
  "detection": {
    "detected": true,
    "confidence": 0.87,
    "iou": 0.74
  },
  "quality": {
    "psnr": 32.1,
    "ssim": 0.94,
    "edge_residual": 0.18,
    "color_deviation": 4.6
  }
}
```

## Notes

Metrics should be reported with image resolution, candidate region size, and dataset source notes. For provenance work, visible watermark results should be documented separately from metadata signals such as C2PA, EXIF, IPTC, XMP, or SynthID-style provenance markers.
