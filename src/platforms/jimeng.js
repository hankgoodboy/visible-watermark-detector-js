import { JIMENG_TEMPLATE } from "../templates/jimeng.js";
import { detectTemplateWatermark, removeTemplateWatermark } from "../template-mask.js";

export const JIMENG_CONFIG = Object.freeze({
  platform: "jimeng",
  template: JIMENG_TEMPLATE,
  signal: { minLuma: 172, maxChannelRange: 142 },
  minimumTemplateRatio: 0.2,
  minimumContrast: 0.12,
  horizontalWeight: 0.9,
  getPlacement(width, height) {
    return {
      x: Math.round(width * 0.7195),
      y: Math.round(height * 0.7991),
      width: Math.max(1, Math.round(width * 0.2805)),
      height: Math.max(1, Math.round(height * 0.2009)),
    };
  },
});

export const detectJimengWatermark = (imageData) =>
  detectTemplateWatermark(imageData, JIMENG_CONFIG);

export const removeJimengWatermark = (imageData, options = {}) =>
  removeTemplateWatermark(imageData, JIMENG_CONFIG, options);
