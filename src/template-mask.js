import { getMaskBounds, inpaintMask } from "./inpaint.js";
import { unchangedResult, validateImageData } from "./image-data.js";

export function rasterizeTemplate(template, width, height, placement) {
  const mask = new Uint8Array(width * height);
  const rowMap = new Map(template.rows);

  for (let targetY = 0; targetY < placement.height; targetY += 1) {
    const sourceY = Math.min(
      template.height - 1,
      Math.floor(targetY * template.height / placement.height),
    );
    const runs = rowMap.get(sourceY);
    if (!runs) continue;
    const y = placement.y + targetY;
    if (y < 0 || y >= height) continue;

    for (let targetX = 0; targetX < placement.width; targetX += 1) {
      const sourceX = Math.min(
        template.width - 1,
        Math.floor(targetX * template.width / placement.width),
      );
      if (!runs.some(([start, end]) => sourceX >= start && sourceX <= end)) continue;
      const x = placement.x + targetX;
      if (x >= 0 && x < width) mask[y * width + x] = 1;
    }
  }

  return mask;
}

const pixelMatches = (data, position, signal) => {
  const index = position * 4;
  const r = data[index];
  const g = data[index + 1];
  const b = data[index + 2];
  const luma = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const channelRange = Math.max(r, g, b) - Math.min(r, g, b);
  return luma >= signal.minLuma && channelRange <= signal.maxChannelRange;
};

export function detectTemplateWatermark(imageData, config) {
  validateImageData(imageData);
  const { width, height, data } = imageData;
  const placement = config.getPlacement(width, height);
  const mask = rasterizeTemplate(config.template, width, height, placement);
  const bounds = getMaskBounds(mask, width, height);
  if (!bounds) {
    return { detected: false, confidence: 0, bbox: null, mask };
  }

  let templatePixels = 0;
  let templateMatches = 0;
  let backgroundPixels = 0;
  let backgroundMatches = 0;
  const endX = bounds.x + bounds.width;
  const endY = bounds.y + bounds.height;

  for (let y = bounds.y; y < endY; y += 1) {
    for (let x = bounds.x; x < endX; x += 1) {
      const position = y * width + x;
      const match = pixelMatches(data, position, config.signal);
      if (mask[position]) {
        templatePixels += 1;
        templateMatches += Number(match);
      } else {
        backgroundPixels += 1;
        backgroundMatches += Number(match);
      }
    }
  }

  const templateRatio = templateMatches / Math.max(1, templatePixels);
  const backgroundRatio = backgroundMatches / Math.max(1, backgroundPixels);
  const contrast = templateRatio - backgroundRatio;
  const confidence = Math.max(0, Math.min(1, contrast / config.minimumContrast));
  const detected = templateRatio >= config.minimumTemplateRatio &&
    contrast >= config.minimumContrast;

  return {
    detected,
    confidence: Number(confidence.toFixed(3)),
    bbox: bounds,
    mask,
    diagnostics: {
      templateRatio: Number(templateRatio.toFixed(3)),
      backgroundRatio: Number(backgroundRatio.toFixed(3)),
      contrast: Number(contrast.toFixed(3)),
      templatePixels,
    },
  };
}

export function removeTemplateWatermark(imageData, config, options = {}) {
  const detection = detectTemplateWatermark(imageData, config);
  const shouldApply = detection.detected || options.force === true;
  if (!shouldApply) {
    return unchangedResult(imageData, {
      platform: config.platform,
      confidence: detection.confidence,
      bbox: detection.bbox,
      diagnostics: detection.diagnostics,
    });
  }

  const restored = inpaintMask(imageData, detection.mask, {
    horizontalWeight: config.horizontalWeight,
    dilateRadius: options.dilateRadius,
  });
  return {
    imageData: restored,
    meta: {
      applied: true,
      detected: detection.detected,
      platform: config.platform,
      confidence: detection.confidence,
      method: "template-guided-local-inpaint",
      bbox: detection.bbox,
      diagnostics: detection.diagnostics,
    },
  };
}
