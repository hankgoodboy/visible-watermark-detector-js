import { detectVisibleWatermark } from "../src/index.js";

const width = 320;
const height = 220;
const data = new Uint8ClampedArray(width * height * 4);

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 4;
    const base = 120 + Math.round((x / width) * 35);
    data[idx] = base;
    data[idx + 1] = base + 8;
    data[idx + 2] = base + 16;
    data[idx + 3] = 255;
  }
}

for (let y = height - 54; y < height - 18; y++) {
  for (let x = width - 58; x < width - 18; x++) {
    const idx = (y * width + x) * 4;
    const stripe = (x + y) % 11 < 5;
    data[idx] = stripe ? 238 : 36;
    data[idx + 1] = stripe ? 238 : 42;
    data[idx + 2] = stripe ? 238 : 48;
  }
}

const result = detectVisibleWatermark({ width, height, data });
console.log(JSON.stringify(result, null, 2));
