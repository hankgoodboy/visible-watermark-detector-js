export type Platform = "gemini" | "doubao" | "jimeng";
export type PlatformOption = Platform | "auto";

export interface ImageDataLike {
  width: number;
  height: number;
  data: Uint8ClampedArray | ArrayLike<number>;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  pixels?: number;
}

export interface DetectionResult {
  detected: boolean;
  confidence: number;
  platform: Platform | null;
  bbox: BoundingBox | null;
  diagnostics?: Record<string, unknown> | null;
}

export interface RemovalMeta extends DetectionResult {
  applied: boolean;
  method: "none" | "alpha-template-inversion" | "template-guided-local-inpaint" | string;
  [key: string]: unknown;
}

export interface RemovalResult {
  imageData: {
    width: number;
    height: number;
    data: Uint8ClampedArray;
  };
  meta: RemovalMeta;
}

export interface RemovalOptions {
  platform?: PlatformOption;
  force?: boolean;
  dilateRadius?: number;
  gemini?: Record<string, unknown>;
}

export const SUPPORTED_PLATFORMS: readonly Platform[];

export function detectPlatformWatermark(
  imageData: ImageDataLike,
  options?: Pick<RemovalOptions, "platform" | "gemini">,
): DetectionResult;

export function removeWatermark(
  imageData: ImageDataLike,
  options?: RemovalOptions,
): RemovalResult;

export function detectDoubaoWatermark(imageData: ImageDataLike): DetectionResult & { mask: Uint8Array };
export function removeDoubaoWatermark(imageData: ImageDataLike, options?: RemovalOptions): RemovalResult;
export function detectJimengWatermark(imageData: ImageDataLike): DetectionResult & { mask: Uint8Array };
export function removeJimengWatermark(imageData: ImageDataLike, options?: RemovalOptions): RemovalResult;
export function detectGeminiWatermark(imageData: ImageDataLike, options?: Record<string, unknown>): DetectionResult;
export function removeGeminiWatermark(imageData: ImageDataLike, options?: Record<string, unknown>): RemovalResult;

export function detectVisibleWatermark(imageData: ImageDataLike, options?: Record<string, number>): Record<string, unknown>;
export const DEFAULT_OPTIONS: Readonly<Record<string, number>>;

export function dilateMask(mask: Uint8Array, width: number, height: number, radius?: number): Uint8Array;
export function getMaskBounds(mask: Uint8Array, width: number, height: number): BoundingBox | null;
export function inpaintMask(
  imageData: ImageDataLike,
  mask: Uint8Array,
  options?: { dilate?: boolean; dilateRadius?: number; horizontalWeight?: number },
): RemovalResult["imageData"];
