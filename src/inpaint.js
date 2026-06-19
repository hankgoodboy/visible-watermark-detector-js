import { cloneImageData, validateImageData } from "./image-data.js";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function getMaskBounds(mask, width, height) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let pixels = 0;

  for (let position = 0; position < mask.length; position += 1) {
    if (!mask[position]) continue;
    const y = Math.floor(position / width);
    const x = position - y * width;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    pixels += 1;
  }

  return pixels ? {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    pixels,
  } : null;
}

export function dilateMask(mask, width, height, radius = 1) {
  if (!mask || mask.length < width * height) {
    throw new TypeError("Mask must contain width * height values.");
  }

  const output = mask.slice();
  const bounds = getMaskBounds(mask, width, height);
  if (!bounds) return output;
  const boundedRadius = clamp(Math.round(radius), 1, 12);
  const endX = bounds.x + bounds.width;
  const endY = bounds.y + bounds.height;

  for (let y = bounds.y; y < endY; y += 1) {
    for (let x = bounds.x; x < endX; x += 1) {
      if (!mask[y * width + x]) continue;
      for (let offsetY = -boundedRadius; offsetY <= boundedRadius; offsetY += 1) {
        const targetY = y + offsetY;
        if (targetY < 0 || targetY >= height) continue;
        const horizontalRadius = Math.floor(
          Math.sqrt(boundedRadius * boundedRadius - offsetY * offsetY),
        );
        const fromX = Math.max(0, x - horizontalRadius);
        const toX = Math.min(width - 1, x + horizontalRadius);
        output.fill(1, targetY * width + fromX, targetY * width + toX + 1);
      }
    }
  }

  return output;
}

const averageBoundary = (pixels, positions) => {
  if (!positions.length) return null;
  const color = [0, 0, 0];
  for (const position of positions) {
    const index = position * 4;
    color[0] += pixels[index];
    color[1] += pixels[index + 1];
    color[2] += pixels[index + 2];
  }
  return color.map((value) => value / positions.length);
};

const localIndex = (x, y, bounds) =>
  ((y - bounds.y) * bounds.width + (x - bounds.x));

const horizontalFill = (pixels, mask, width, height, bounds) => {
  const fill = new Uint8ClampedArray(bounds.width * bounds.height * 3);
  const available = new Uint8Array(bounds.width * bounds.height);
  const sampleRadius = Math.max(3, Math.round(width / 900));
  const endX = bounds.x + bounds.width;
  const endY = bounds.y + bounds.height;

  for (let y = bounds.y; y < endY; y += 1) {
    let x = bounds.x;
    while (x < endX) {
      if (!mask[y * width + x]) {
        x += 1;
        continue;
      }
      const runStart = x;
      while (x < endX && mask[y * width + x]) x += 1;
      const runEnd = x - 1;
      const leftPositions = [];
      const rightPositions = [];

      for (let sample = 1; sample <= sampleRadius; sample += 1) {
        const leftX = runStart - sample;
        const rightX = runEnd + sample;
        if (leftX >= 0 && !mask[y * width + leftX]) leftPositions.push(y * width + leftX);
        if (rightX < width && !mask[y * width + rightX]) rightPositions.push(y * width + rightX);
      }

      const left = averageBoundary(pixels, leftPositions);
      const right = averageBoundary(pixels, rightPositions);
      if (!left && !right) continue;
      const runLength = Math.max(1, runEnd - runStart + 1);

      for (let fillX = runStart; fillX <= runEnd; fillX += 1) {
        const ratio = (fillX - runStart + 1) / (runLength + 1);
        const color = left && right
          ? left.map((value, channel) => value * (1 - ratio) + right[channel] * ratio)
          : (left || right);
        const position = localIndex(fillX, y, bounds);
        const outputIndex = position * 3;
        fill[outputIndex] = color[0];
        fill[outputIndex + 1] = color[1];
        fill[outputIndex + 2] = color[2];
        available[position] = 1;
      }
    }
  }

  return { fill, available };
};

const verticalFill = (pixels, mask, width, height, bounds) => {
  const fill = new Uint8ClampedArray(bounds.width * bounds.height * 3);
  const available = new Uint8Array(bounds.width * bounds.height);
  const sampleRadius = Math.max(3, Math.round(height / 700));
  const endX = bounds.x + bounds.width;
  const endY = bounds.y + bounds.height;

  for (let x = bounds.x; x < endX; x += 1) {
    let y = bounds.y;
    while (y < endY) {
      if (!mask[y * width + x]) {
        y += 1;
        continue;
      }
      const runStart = y;
      while (y < endY && mask[y * width + x]) y += 1;
      const runEnd = y - 1;
      const topPositions = [];
      const bottomPositions = [];

      for (let sample = 1; sample <= sampleRadius; sample += 1) {
        const topY = runStart - sample;
        const bottomY = runEnd + sample;
        if (topY >= 0 && !mask[topY * width + x]) topPositions.push(topY * width + x);
        if (bottomY < height && !mask[bottomY * width + x]) bottomPositions.push(bottomY * width + x);
      }

      const top = averageBoundary(pixels, topPositions);
      const bottom = averageBoundary(pixels, bottomPositions);
      if (!top && !bottom) continue;
      const runLength = Math.max(1, runEnd - runStart + 1);

      for (let fillY = runStart; fillY <= runEnd; fillY += 1) {
        const ratio = (fillY - runStart + 1) / (runLength + 1);
        const color = top && bottom
          ? top.map((value, channel) => value * (1 - ratio) + bottom[channel] * ratio)
          : (top || bottom);
        const position = localIndex(x, fillY, bounds);
        const outputIndex = position * 3;
        fill[outputIndex] = color[0];
        fill[outputIndex + 1] = color[1];
        fill[outputIndex + 2] = color[2];
        available[position] = 1;
      }
    }
  }

  return { fill, available };
};

export function inpaintMask(imageData, mask, options = {}) {
  validateImageData(imageData);
  const { width, height, data } = imageData;
  if (!mask || mask.length < width * height) {
    throw new TypeError("Mask must contain width * height values.");
  }

  const radius = options.dilateRadius ?? Math.max(1, Math.round(width / 1800));
  const expandedMask = options.dilate === false ? mask.slice() : dilateMask(mask, width, height, radius);
  const bounds = getMaskBounds(expandedMask, width, height);
  if (!bounds) return cloneImageData(imageData);
  const output = cloneImageData(imageData);
  const horizontal = horizontalFill(data, expandedMask, width, height, bounds);
  const vertical = verticalFill(data, expandedMask, width, height, bounds);
  const horizontalWeight = clamp(options.horizontalWeight ?? 0.5, 0, 1);
  const endX = bounds.x + bounds.width;
  const endY = bounds.y + bounds.height;

  for (let y = bounds.y; y < endY; y += 1) {
    for (let x = bounds.x; x < endX; x += 1) {
      const globalPosition = y * width + x;
      if (!expandedMask[globalPosition]) continue;
      const position = localIndex(x, y, bounds);
      const hasHorizontal = horizontal.available[position];
      const hasVertical = vertical.available[position];
      if (!hasHorizontal && !hasVertical) continue;
      const sourceIndex = globalPosition * 4;
      const fillIndex = position * 3;

      for (let channel = 0; channel < 3; channel += 1) {
        if (hasHorizontal && hasVertical) {
          output.data[sourceIndex + channel] = Math.round(
            horizontal.fill[fillIndex + channel] * horizontalWeight +
            vertical.fill[fillIndex + channel] * (1 - horizontalWeight),
          );
        } else {
          output.data[sourceIndex + channel] = Math.round(
            (hasHorizontal ? horizontal.fill : vertical.fill)[fillIndex + channel],
          );
        }
      }
    }
  }

  return output;
}
