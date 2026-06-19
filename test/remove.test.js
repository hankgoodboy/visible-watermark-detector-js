import test from "node:test";
import assert from "node:assert/strict";
import {
  SUPPORTED_PLATFORMS,
  detectPlatformWatermark,
  removeDoubaoWatermark,
  removeGeminiWatermark,
  removeJimengWatermark,
  removeWatermark,
} from "../src/index.js";
import { DOUBAO_CONFIG } from "../src/platforms/doubao.js";
import { JIMENG_CONFIG } from "../src/platforms/jimeng.js";
import { rasterizeTemplate } from "../src/template-mask.js";

test("lists the three supported platform adapters", () => {
  assert.deepEqual(SUPPORTED_PLATFORMS, ["gemini", "doubao", "jimeng"]);
});

test("detects and restores a synthetic Doubao mark", () => {
  const fixture = syntheticTemplateFixture(DOUBAO_CONFIG, 512, 512);
  const detection = detectPlatformWatermark(fixture.imageData, { platform: "doubao" });
  const result = removeDoubaoWatermark(fixture.imageData);

  assert.equal(detection.detected, true);
  assert.equal(detection.platform, "doubao");
  assert.equal(result.meta.applied, true);
  assert.equal(result.meta.platform, "doubao");
  assert.ok(maskError(result.imageData, fixture.mask, fixture.background) < 2);
  assert.equal(changedOutsideMask(fixture.imageData, result.imageData, fixture.mask), 0);
});

test("auto mode selects a synthetic Jimeng mark", () => {
  const fixture = syntheticTemplateFixture(JIMENG_CONFIG, 640, 360);
  const detection = detectPlatformWatermark(fixture.imageData);
  const result = removeWatermark(fixture.imageData);

  assert.equal(detection.detected, true);
  assert.equal(detection.platform, "jimeng");
  assert.equal(result.meta.applied, true);
  assert.equal(result.meta.platform, "jimeng");
  assert.ok(maskError(result.imageData, fixture.mask, fixture.background) < 2);
});

test("does not alter an image when an explicit template mark is absent", () => {
  const imageData = solidImage(512, 512, [74, 86, 101, 255]);
  const result = removeJimengWatermark(imageData);

  assert.equal(result.meta.applied, false);
  assert.deepEqual(result.imageData.data, imageData.data);
});

test("Gemini adapter preserves a flat image when no supported mark is present", () => {
  const imageData = solidImage(512, 512, [74, 86, 101, 255]);
  const result = removeGeminiWatermark(imageData);

  assert.equal(result.imageData.width, 512);
  assert.equal(result.imageData.height, 512);
  assert.equal(result.imageData.data.length, imageData.data.length);
  if (!result.meta.applied) assert.deepEqual(result.imageData.data, imageData.data);
});

test("rejects unknown platform names", () => {
  const imageData = solidImage(128, 128, [0, 0, 0, 255]);
  assert.throws(
    () => removeWatermark(imageData, { platform: "unknown" }),
    /Unsupported platform/,
  );
});

function syntheticTemplateFixture(config, width, height) {
  const background = [74, 86, 101, 255];
  const imageData = solidImage(width, height, background);
  const placement = config.getPlacement(width, height);
  const mask = rasterizeTemplate(config.template, width, height, placement);

  for (let position = 0; position < mask.length; position += 1) {
    if (!mask[position]) continue;
    const index = position * 4;
    imageData.data[index] = 235;
    imageData.data[index + 1] = 235;
    imageData.data[index + 2] = 235;
  }

  return { imageData, mask, background };
}

function solidImage(width, height, rgba) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < data.length; index += 4) {
    data[index] = rgba[0];
    data[index + 1] = rgba[1];
    data[index + 2] = rgba[2];
    data[index + 3] = rgba[3];
  }
  return { width, height, data };
}

function maskError(imageData, mask, expected) {
  let error = 0;
  let samples = 0;
  for (let position = 0; position < mask.length; position += 1) {
    if (!mask[position]) continue;
    const index = position * 4;
    error += Math.abs(imageData.data[index] - expected[0]);
    error += Math.abs(imageData.data[index + 1] - expected[1]);
    error += Math.abs(imageData.data[index + 2] - expected[2]);
    samples += 3;
  }
  return samples ? error / samples : 0;
}

function changedOutsideMask(before, after, mask) {
  let changed = 0;
  for (let position = 0; position < mask.length; position += 1) {
    if (mask[position]) continue;
    const index = position * 4;
    if (
      before.data[index] !== after.data[index] ||
      before.data[index + 1] !== after.data[index + 1] ||
      before.data[index + 2] !== after.data[index + 2]
    ) changed += 1;
  }
  return changed;
}
