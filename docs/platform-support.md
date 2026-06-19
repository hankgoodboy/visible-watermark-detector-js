# Platform support

## Gemini

The Gemini adapter uses alpha-template inversion for supported visible corner
star/logo layouts. It includes embedded alpha maps and adaptive candidate
selection from the credited upstream implementation.

Use explicit `platform: "gemini"` when the source is known. Gemini processing
is more expensive than the text-template adapters.

## Doubao

The Doubao adapter targets the bottom-right `豆包AI生成` mark represented by the
embedded template. Position and size are scaled from the shortest image edge.
Detection compares expected glyph pixels with nearby background pixels before
restoration is allowed.

## Jimeng

The Jimeng adapter targets the supported bottom-right `即梦AI` logo/text layout.
Its template is placed proportionally to image width and height, then verified
against light, low-to-medium saturation pixels.

## Auto mode

Auto mode checks the lightweight Doubao and Jimeng signatures first. If neither
matches, it evaluates the Gemini adapter. Explicit mode remains preferable when
the caller knows the image source.

## Out of scope

- arbitrary user-added watermarks
- hidden provenance and metadata
- logos in unknown positions or scales
- legal ownership decisions
- animated image and video processing

Always test against representative images from your own authorized dataset.
