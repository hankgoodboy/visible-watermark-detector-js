export {
  detectVisibleWatermark,
  DEFAULT_OPTIONS,
} from "./detect.js";

export {
  detectPlatformWatermark,
  removeWatermark,
  SUPPORTED_PLATFORMS,
} from "./remove.js";

export {
  detectDoubaoWatermark,
  removeDoubaoWatermark,
} from "./platforms/doubao.js";

export {
  detectGeminiWatermark,
  removeGeminiWatermark,
} from "./platforms/gemini.js";

export {
  detectJimengWatermark,
  removeJimengWatermark,
} from "./platforms/jimeng.js";

export {
  dilateMask,
  getMaskBounds,
  inpaintMask,
} from "./inpaint.js";
