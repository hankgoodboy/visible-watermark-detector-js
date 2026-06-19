# AI Watermark Tools JS

Zero-dependency JavaScript tools for detecting and locally restoring supported
visible AI image watermarks from Gemini, Doubao, and Jimeng images.

The library accepts `ImageData`-compatible RGBA pixels and runs entirely in the
browser or a JavaScript runtime. It does not upload images to a server.

> Use this project only with images you own or are authorized to edit. Keep an
> original copy and preserve provenance information when disclosure matters.

## Supported platforms

| Platform | Visible mark | Method | Status |
| --- | --- | --- | --- |
| Gemini | supported corner star/logo layouts | alpha-template inversion | Supported |
| Doubao | bottom-right `豆包AI生成` layout | template-guided local inpaint | Supported layout |
| Jimeng | bottom-right `即梦AI` logo/text layout | template-guided local inpaint | Supported layout |

These adapters handle specific visible layouts, not arbitrary watermarks. See
[platform support](./docs/platform-support.md) before integrating.

## Features

- one `ImageData` API for browser and Node.js workflows
- explicit `gemini`, `doubao`, and `jimeng` adapters
- `auto` mode for supported platform selection
- no network requests or runtime dependencies
- backward-compatible generic corner detector
- TypeScript declarations
- synthetic tests and a browser demo

## Install

```bash
npm install ai-watermark-tools-js
```

For local development:

```bash
node --test
node examples/node-demo.js
```

## Quick start

```js
import { removeWatermark } from "ai-watermark-tools-js";

const result = removeWatermark(imageData, { platform: "auto" });

console.log(result.meta);
// {
//   applied: true,
//   detected: true,
//   platform: "doubao",
//   confidence: 0.98,
//   method: "template-guided-local-inpaint",
//   bbox: { x, y, width, height, pixels }
// }

context.putImageData(
  new ImageData(result.imageData.data, result.imageData.width, result.imageData.height),
  0,
  0,
);
```

### Choose a platform explicitly

```js
const result = removeWatermark(imageData, { platform: "gemini" });
```

Explicit mode is recommended when your application already knows the image
source. It avoids unnecessary platform checks and gives more predictable
results.

### Detect without applying template-guided restoration

```js
import { detectPlatformWatermark } from "ai-watermark-tools-js";

const detection = detectPlatformWatermark(imageData, { platform: "doubao" });
console.log(detection.detected, detection.confidence, detection.bbox);
```

The Gemini detector internally evaluates the supported alpha template and can
be more computationally expensive than the Doubao and Jimeng detectors.

## Platform-specific API

```js
import {
  removeGeminiWatermark,
  removeDoubaoWatermark,
  removeJimengWatermark,
} from "ai-watermark-tools-js";
```

The template-guided adapters do not modify pixels when their expected visible
layout is not detected. Advanced callers can pass `{ force: true }` to Doubao
or Jimeng removal when the source is already known.

## Existing detector API

The original research-oriented API remains available:

```js
import { detectVisibleWatermark } from "ai-watermark-tools-js";

const result = detectVisibleWatermark(imageData);
```

It returns a heuristic corner-region prediction and is useful for dataset
annotation and evaluation. It does not identify a platform with certainty.

## Browser demo

Serve the repository over HTTP:

```bash
python3 -m http.server 8000
```

Open:

```text
http://localhost:8000/examples/browser-demo/
```

The demo lets you upload an image, choose a platform, compare the result, and
download the restored PNG locally.

## API contract

All removal functions return:

```js
{
  imageData: { width, height, data: Uint8ClampedArray },
  meta: {
    applied,
    detected,
    platform,
    confidence,
    method,
    bbox,
    diagnostics
  }
}
```

Input pixels are never mutated.

## Limitations

- not a universal watermark remover
- template adapters depend on known position, scale, and visible layout
- complex edges and detailed textures may require manual editing afterward
- does not remove SynthID, C2PA, EXIF, XMP, IPTC, or other hidden provenance
- does not prove which model or service generated an image
- animation and video are not supported

## Research and evaluation

The generic detector and evaluation notes remain useful for visible watermark
research. See [metrics](./docs/metrics.md) for IoU, residual, and reconstruction
quality ideas.

## Related web tools

Try the same local-first workflow in the browser:

- [Easy Remove Watermark](https://easyremovewatermark.com/)
- [Doubao watermark remover](https://easyremovewatermark.com/doubao-watermark-remover/)
- [Jimeng watermark remover](https://easyremovewatermark.com/jimeng-watermark-remover/)

## Third-party code

The Gemini adapter contains MIT-licensed work derived from
`GargantuaX/gemini-watermark-remover`. See [NOTICE.md](./NOTICE.md) and the
preserved [third-party license](./third_party/gemini-watermark-remover/LICENSE).

## License

MIT
