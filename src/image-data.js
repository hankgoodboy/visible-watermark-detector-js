export function validateImageData(imageData, { minSize = 1 } = {}) {
  if (!imageData || typeof imageData !== "object") {
    throw new TypeError("Expected an ImageData-like object.");
  }

  const { width, height, data } = imageData;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < minSize || height < minSize) {
    throw new RangeError(`Image dimensions must be integers of at least ${minSize}px.`);
  }
  if (!data || typeof data.length !== "number" || data.length < width * height * 4) {
    throw new TypeError("ImageData data must contain width * height RGBA pixels.");
  }

  return imageData;
}

export function cloneImageData(imageData) {
  validateImageData(imageData);
  return {
    width: imageData.width,
    height: imageData.height,
    data: new Uint8ClampedArray(imageData.data),
  };
}

export function unchangedResult(imageData, meta = {}) {
  return {
    imageData: cloneImageData(imageData),
    meta: {
      applied: false,
      detected: false,
      platform: null,
      confidence: 0,
      method: "none",
      bbox: null,
      ...meta,
    },
  };
}
