import { removeWatermark } from "../../src/index.js";

const fileInput = document.querySelector("#file");
const platformSelect = document.querySelector("#platform");
const beforeCanvas = document.querySelector("#before");
const afterCanvas = document.querySelector("#after");
const status = document.querySelector("#status");
const output = document.querySelector("#output");
const downloadButton = document.querySelector("#download");
let currentFile = null;

fileInput.addEventListener("change", () => {
  currentFile = fileInput.files?.[0] ?? null;
  if (currentFile) processFile(currentFile);
});

platformSelect.addEventListener("change", () => {
  if (currentFile) processFile(currentFile);
});

downloadButton.addEventListener("click", () => {
  afterCanvas.toBlob((blob) => {
    if (!blob) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "watermark-result.png";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }, "image/png");
});

async function processFile(file) {
  status.textContent = "Reading image...";
  downloadButton.disabled = true;

  try {
    const bitmap = await createImageBitmap(file);
    if (bitmap.width * bitmap.height > 12_000_000) {
      bitmap.close();
      throw new Error("Please use an image below 12 megapixels.");
    }

    setCanvasSize(beforeCanvas, bitmap.width, bitmap.height);
    setCanvasSize(afterCanvas, bitmap.width, bitmap.height);
    const beforeContext = beforeCanvas.getContext("2d", { willReadFrequently: true });
    beforeContext.drawImage(bitmap, 0, 0);
    bitmap.close();

    const source = beforeContext.getImageData(0, 0, beforeCanvas.width, beforeCanvas.height);
    const result = removeWatermark(source, { platform: platformSelect.value });
    afterCanvas.getContext("2d").putImageData(
      new ImageData(result.imageData.data, result.imageData.width, result.imageData.height),
      0,
      0,
    );

    output.textContent = JSON.stringify(result.meta, null, 2);
    status.textContent = result.meta.applied
      ? `Applied ${result.meta.platform} restoration locally.`
      : "No supported visible watermark was detected.";
    downloadButton.disabled = false;
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "Unable to process image.";
    output.textContent = "Processing failed.";
  }
}

function setCanvasSize(canvas, width, height) {
  canvas.width = width;
  canvas.height = height;
  canvas.style.aspectRatio = `${width} / ${height}`;
}
