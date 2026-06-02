export const DEFAULT_OPTIONS = {
  minImageSize: 64,
  cornerWindowRatio: 0.18,
  cornerWindowMin: 48,
  cornerWindowMax: 180,
  gridSize: 6,
  confidenceThreshold: 0.52
};

const CORNERS = [
  { name: "top-left", xAnchor: 0, yAnchor: 0 },
  { name: "top-right", xAnchor: 1, yAnchor: 0 },
  { name: "bottom-left", xAnchor: 0, yAnchor: 1 },
  { name: "bottom-right", xAnchor: 1, yAnchor: 1 }
];

export function detectVisibleWatermark(imageData, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  validateImageData(imageData, opts);

  const candidates = CORNERS.map((corner) => {
    const bbox = cornerBox(imageData.width, imageData.height, corner, opts);
    const metrics = measureRegion(imageData, bbox, opts.gridSize);
    const confidence = scoreMetrics(metrics);

    return {
      corner: corner.name,
      confidence,
      bbox,
      metrics
    };
  }).sort((a, b) => b.confidence - a.confidence);

  const best = candidates[0];
  const detected = best.confidence >= opts.confidenceThreshold;

  return {
    detected,
    confidence: round(best.confidence),
    bbox: detected ? best.bbox : null,
    type: detected ? "corner-visible-mark" : "none",
    candidates: candidates.map((candidate) => ({
      ...candidate,
      confidence: round(candidate.confidence),
      metrics: roundMetrics(candidate.metrics)
    }))
  };
}

function validateImageData(imageData, opts) {
  if (!imageData || typeof imageData !== "object") {
    throw new TypeError("Expected an ImageData-like object.");
  }

  const { width, height, data } = imageData;
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    throw new TypeError("ImageData width and height must be integers.");
  }

  if (width < opts.minImageSize || height < opts.minImageSize) {
    throw new RangeError(`Image dimensions must be at least ${opts.minImageSize}px.`);
  }

  if (!data || typeof data.length !== "number" || data.length < width * height * 4) {
    throw new TypeError("ImageData data must contain RGBA pixels.");
  }
}

function cornerBox(width, height, corner, opts) {
  const size = clamp(
    Math.round(Math.min(width, height) * opts.cornerWindowRatio),
    opts.cornerWindowMin,
    Math.min(opts.cornerWindowMax, width, height)
  );

  return {
    x: corner.xAnchor === 0 ? 0 : width - size,
    y: corner.yAnchor === 0 ? 0 : height - size,
    width: size,
    height: size
  };
}

function measureRegion(imageData, bbox, gridSize) {
  const { width, data } = imageData;
  const lumas = [];
  const saturations = [];
  let edgeTotal = 0;
  let edgeCount = 0;

  for (let y = bbox.y; y < bbox.y + bbox.height; y += gridSize) {
    for (let x = bbox.x; x < bbox.x + bbox.width; x += gridSize) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const luma = toLuma(r, g, b);

      lumas.push(luma);
      saturations.push(toSaturation(r, g, b));

      if (x + gridSize < bbox.x + bbox.width && y + gridSize < bbox.y + bbox.height) {
        const rightIdx = (y * width + x + gridSize) * 4;
        const downIdx = ((y + gridSize) * width + x) * 4;
        const rightLuma = toLuma(data[rightIdx], data[rightIdx + 1], data[rightIdx + 2]);
        const downLuma = toLuma(data[downIdx], data[downIdx + 1], data[downIdx + 2]);

        edgeTotal += Math.abs(luma - rightLuma) + Math.abs(luma - downLuma);
        edgeCount += 2;
      }
    }
  }

  return {
    contrast: standardDeviation(lumas) / 128,
    edgeDensity: edgeCount === 0 ? 0 : edgeTotal / edgeCount / 128,
    saturationVariance: standardDeviation(saturations),
    brightPixelRatio: ratio(lumas, (value) => value > 205),
    darkPixelRatio: ratio(lumas, (value) => value < 55)
  };
}

function scoreMetrics(metrics) {
  const structureScore = clamp01(metrics.contrast * 0.42 + metrics.edgeDensity * 0.5);
  const overlayScore = clamp01(metrics.brightPixelRatio * 0.42 + metrics.darkPixelRatio * 0.28);
  const saturationScore = clamp01(metrics.saturationVariance * 0.24);

  return clamp01(structureScore + overlayScore + saturationScore);
}

function toLuma(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function toSaturation(r, g, b) {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;

  return max === 0 ? 0 : (max - min) / max;
}

function standardDeviation(values) {
  if (values.length === 0) return 0;

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;

  return Math.sqrt(variance);
}

function ratio(values, predicate) {
  if (values.length === 0) return 0;

  return values.filter(predicate).length / values.length;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function clamp01(value) {
  return clamp(value, 0, 1);
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

function roundMetrics(metrics) {
  return Object.fromEntries(
    Object.entries(metrics).map(([key, value]) => [key, round(value)])
  );
}
