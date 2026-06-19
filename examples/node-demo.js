import { detectPlatformWatermark, removeWatermark } from "../src/index.js";
import { DOUBAO_CONFIG } from "../src/platforms/doubao.js";
import { rasterizeTemplate } from "../src/template-mask.js";

const width = 512;
const height = 512;
const data = new Uint8ClampedArray(width * height * 4);

for (let index = 0; index < data.length; index += 4) {
  data[index] = 72;
  data[index + 1] = 84;
  data[index + 2] = 98;
  data[index + 3] = 255;
}

const placement = DOUBAO_CONFIG.getPlacement(width, height);
const mask = rasterizeTemplate(DOUBAO_CONFIG.template, width, height, placement);
for (let position = 0; position < mask.length; position += 1) {
  if (!mask[position]) continue;
  const index = position * 4;
  data[index] = 235;
  data[index + 1] = 235;
  data[index + 2] = 235;
}

const imageData = { width, height, data };
console.log("Detection:", detectPlatformWatermark(imageData));
console.log("Removal:", removeWatermark(imageData).meta);
