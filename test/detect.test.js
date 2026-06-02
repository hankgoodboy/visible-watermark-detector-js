import test from "node:test";
import assert from "node:assert/strict";
import { detectVisibleWatermark } from "../src/index.js";

test("detects a synthetic corner mark", () => {
  const width = 256;
  const height = 192;
  const data = solidImage(width, height, [130, 140, 150, 255]);

  drawStripeMark(data, width, height, width - 50, height - 48, 34, 34);

  const result = detectVisibleWatermark({ width, height, data }, {
    confidenceThreshold: 0.4
  });

  assert.equal(result.detected, true);
  assert.equal(result.type, "corner-visible-mark");
  assert.equal(result.candidates[0].corner, "bottom-right");
  assert.ok(result.confidence >= 0.4);
});

test("returns no detection for a flat image", () => {
  const width = 256;
  const height = 192;
  const data = solidImage(width, height, [130, 140, 150, 255]);
  const result = detectVisibleWatermark({ width, height, data });

  assert.equal(result.detected, false);
  assert.equal(result.bbox, null);
  assert.equal(result.type, "none");
});

function solidImage(width, height, rgba) {
  const data = new Uint8ClampedArray(width * height * 4);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = rgba[0];
    data[i + 1] = rgba[1];
    data[i + 2] = rgba[2];
    data[i + 3] = rgba[3];
  }

  return data;
}

function drawStripeMark(data, width, height, x0, y0, markWidth, markHeight) {
  for (let y = y0; y < Math.min(height, y0 + markHeight); y++) {
    for (let x = x0; x < Math.min(width, x0 + markWidth); x++) {
      const idx = (y * width + x) * 4;
      const bright = (x + y) % 10 < 5;

      data[idx] = bright ? 245 : 35;
      data[idx + 1] = bright ? 245 : 35;
      data[idx + 2] = bright ? 245 : 35;
      data[idx + 3] = 255;
    }
  }
}
