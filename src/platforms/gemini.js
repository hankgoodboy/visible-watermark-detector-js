import { removeWatermarkFromImageDataSync } from "../vendor/gemini/sdk/image-data.js";

export function removeGeminiWatermark(imageData, options = {}) {
  const result = removeWatermarkFromImageDataSync(imageData, options);
  const applied = result.meta?.applied === true;

  return {
    imageData: result.imageData,
    meta: {
      ...result.meta,
      applied,
      detected: applied,
      platform: "gemini",
      confidence: result.meta?.detection?.adaptiveConfidence ?? (applied ? 1 : 0),
      method: "alpha-template-inversion",
      bbox: result.meta?.position ?? null,
    },
  };
}

export function detectGeminiWatermark(imageData, options = {}) {
  const result = removeGeminiWatermark(imageData, options);
  return {
    detected: result.meta.detected,
    confidence: result.meta.confidence,
    platform: "gemini",
    bbox: result.meta.bbox,
    diagnostics: result.meta.detection ?? null,
  };
}
