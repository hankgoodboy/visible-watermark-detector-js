import { validateImageData } from "./image-data.js";
import { detectDoubaoWatermark, removeDoubaoWatermark } from "./platforms/doubao.js";
import { detectGeminiWatermark, removeGeminiWatermark } from "./platforms/gemini.js";
import { detectJimengWatermark, removeJimengWatermark } from "./platforms/jimeng.js";

export const SUPPORTED_PLATFORMS = Object.freeze(["gemini", "doubao", "jimeng"]);

const validatePlatform = (platform, allowAuto = true) => {
  const values = allowAuto ? ["auto", ...SUPPORTED_PLATFORMS] : SUPPORTED_PLATFORMS;
  if (!values.includes(platform)) {
    throw new RangeError(`Unsupported platform: ${platform}. Expected ${values.join(", ")}.`);
  }
};

const publicDetection = (platform, detection) => ({
  detected: detection.detected,
  confidence: detection.confidence,
  platform: detection.detected ? platform : null,
  bbox: detection.bbox,
  diagnostics: detection.diagnostics ?? null,
});

const detectTemplateCandidates = (imageData) => [
  publicDetection("doubao", detectDoubaoWatermark(imageData)),
  publicDetection("jimeng", detectJimengWatermark(imageData)),
].sort((a, b) => b.confidence - a.confidence);

export function detectPlatformWatermark(imageData, options = {}) {
  validateImageData(imageData, { minSize: 16 });
  const platform = options.platform ?? "auto";
  validatePlatform(platform);

  if (platform === "doubao") {
    return publicDetection("doubao", detectDoubaoWatermark(imageData));
  }
  if (platform === "jimeng") {
    return publicDetection("jimeng", detectJimengWatermark(imageData));
  }
  if (platform === "gemini") {
    return detectGeminiWatermark(imageData, options.gemini);
  }

  const [bestTemplate] = detectTemplateCandidates(imageData);
  if (bestTemplate.detected) return bestTemplate;
  return detectGeminiWatermark(imageData, options.gemini);
}

export function removeWatermark(imageData, options = {}) {
  validateImageData(imageData, { minSize: 16 });
  const platform = options.platform ?? "auto";
  validatePlatform(platform);

  if (platform === "doubao") return removeDoubaoWatermark(imageData, options);
  if (platform === "jimeng") return removeJimengWatermark(imageData, options);
  if (platform === "gemini") return removeGeminiWatermark(imageData, options.gemini);

  const [bestTemplate] = detectTemplateCandidates(imageData);
  if (bestTemplate.detected) {
    return bestTemplate.platform === "doubao"
      ? removeDoubaoWatermark(imageData, options)
      : removeJimengWatermark(imageData, options);
  }
  return removeGeminiWatermark(imageData, options.gemini);
}
