# Visible Watermark Detector JS

A small JavaScript research library for detecting visible AI image watermark regions.

This project focuses on visible watermark analysis, image provenance research, and evaluation workflows. It does not remove, bypass, or alter watermarks.

## What It Does

`visible-watermark-detector-js` accepts `ImageData`-compatible pixel data and returns a heuristic prediction for visible corner watermark regions.

It is designed for:

- AI image provenance experiments
- visible watermark dataset annotation
- benchmark tooling
- before/after quality evaluation pipelines
- browser and Node.js demos

## Why Visible AI Watermark Detection Matters

Visible marks are still common in generated images, previews, marketplaces, and creative tools. Being able to locate and measure these regions helps researchers compare platform behavior, document image provenance signals, and evaluate how visible marks affect downstream image quality metrics.

## Supported Signals

The current MVP detects compact visible marks near image corners. It looks for local structure, contrast, edge density, and saturation differences inside candidate corner windows.

Supported output:

```js
{
  detected: true,
  confidence: 0.87,
  bbox: { x: 1320, y: 690, width: 72, height: 72 },
  type: "corner-visible-mark"
}
```

## Install

```bash
npm install visible-watermark-detector-js
```

For local development:

```bash
npm test
```

## Browser Usage

```js
import { detectVisibleWatermark } from "visible-watermark-detector-js";

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

const result = detectVisibleWatermark(imageData);
console.log(result);
```

See [examples/browser-demo](./examples/browser-demo/) for a complete browser demo.

## Node Usage

```js
import { detectVisibleWatermark } from "visible-watermark-detector-js";

const imageData = {
  width: 1400,
  height: 800,
  data: new Uint8ClampedArray(1400 * 800 * 4)
};

const result = detectVisibleWatermark(imageData);
console.log(result);
```

See [examples/node-demo.js](./examples/node-demo.js) for a dependency-free synthetic example.

## Detection Output

The detector returns:

- `detected`: whether a visible corner mark was found
- `confidence`: normalized confidence from `0` to `1`
- `bbox`: predicted mark region in image coordinates, or `null`
- `type`: currently `"corner-visible-mark"` or `"none"`
- `candidates`: ranked corner candidates for debugging and benchmark use

## Evaluation Metrics

For benchmark and evaluation ideas, see [docs/metrics.md](./docs/metrics.md).

## Limitations

This is a lightweight heuristic detector. It is not a universal watermark classifier and should not be treated as proof that an image came from a specific model or platform.

Known limitations:

- best suited to compact visible marks near corners
- may miss very low-contrast marks
- may confuse logos, signatures, captions, or UI overlays with watermarks
- does not inspect metadata, SynthID, C2PA, EXIF, IPTC, or XMP signals

## Related Tools

Try a browser-based Gemini watermark cleanup demo:

https://easyremovewatermark.com/

## License

MIT
