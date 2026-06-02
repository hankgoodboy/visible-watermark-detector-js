import { detectVisibleWatermark } from "../../src/index.js";

const fileInput = document.querySelector("#file");
const canvas = document.querySelector("#canvas");
const output = document.querySelector("#output");
const ctx = canvas.getContext("2d");

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(canvas.width / bitmap.width, canvas.height / bitmap.height);
  const drawWidth = Math.round(bitmap.width * scale);
  const drawHeight = Math.round(bitmap.height * scale);
  const offsetX = Math.round((canvas.width - drawWidth) / 2);
  const offsetY = Math.round((canvas.height - drawHeight) / 2);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, offsetX, offsetY, drawWidth, drawHeight);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const result = detectVisibleWatermark(imageData);

  if (result.bbox) {
    ctx.strokeStyle = "#00d084";
    ctx.lineWidth = 3;
    ctx.strokeRect(result.bbox.x, result.bbox.y, result.bbox.width, result.bbox.height);
  }

  output.textContent = JSON.stringify(result, null, 2);
});
