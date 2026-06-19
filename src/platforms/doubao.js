import { DOUBAO_TEMPLATE } from "../templates/doubao.js";
import { detectTemplateWatermark, removeTemplateWatermark } from "../template-mask.js";

export const DOUBAO_CONFIG = Object.freeze({
  platform: "doubao",
  template: DOUBAO_TEMPLATE,
  signal: { minLuma: 135, maxChannelRange: 55 },
  minimumTemplateRatio: 0.24,
  minimumContrast: 0.18,
  horizontalWeight: 0.5,
  getPlacement(width, height) {
    const scale = Math.min(width, height) / 2048;
    return {
      x: Math.max(0, width - Math.round(388 * scale)),
      y: Math.max(0, height - Math.round(138 * scale)),
      width: Math.max(1, Math.round(370 * scale)),
      height: Math.max(1, Math.round(120 * scale)),
    };
  },
});

export const detectDoubaoWatermark = (imageData) =>
  detectTemplateWatermark(imageData, DOUBAO_CONFIG);

export const removeDoubaoWatermark = (imageData, options = {}) =>
  removeTemplateWatermark(imageData, DOUBAO_CONFIG, options);
