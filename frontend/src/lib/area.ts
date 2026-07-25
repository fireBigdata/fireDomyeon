import { CANVAS_WIDTH_PX, CANVAS_HEIGHT_PX } from "@/constants/canvas";

const SQUARE_METERS_PER_PYEONG = 3.305785;

// Canvas/structure coordinates are edited in pixel-like units; this constant
// is what converts those into real-world meters for area display.
export const PIXELS_PER_METER = 30;

/** Converts a raw width*height pixel area (optionally pre-multiplied by the floor plan's scale) into m². */
export function pixelAreaToSquareMeters(pixelArea: number, scale: number): number {
  return (pixelArea / (PIXELS_PER_METER * PIXELS_PER_METER)) * scale;
}

/** Converts a raw pixel length into meters, consistent with pixelAreaToSquareMeters (width * height). */
export function pixelLengthToMeters(pixelLength: number, scale: number): number {
  return (pixelLength / PIXELS_PER_METER) * Math.sqrt(scale);
}

/** Inverse of pixelLengthToMeters: converts a real-world length in meters into pixels. */
export function metersToPixelLength(meters: number, scale: number): number {
  return (meters * PIXELS_PER_METER) / Math.sqrt(scale || 1);
}

/**
 * Derives a `scale` from a real-world site width/height (meters), for
 * InitialSetupModal. `scale` is a single isotropic factor (pixelLengthToMeters/
 * metersToPixelLength apply sqrt(scale) to both axes equally), so this picks
 * the smallest zoom-out that still fits the whole site — at its real aspect
 * ratio, undistorted — inside the canvas's fixed pixel size: whichever
 * dimension (가로/세로) is more constraining ends up exactly filling the
 * canvas's width or height, the other comes in short of it. FloorPlanCanvas
 * uses this to size the gray site-boundary rect to match 대지면적/가로/세로.
 */
export function computeScaleForSiteDimensions(
  siteWidthM: number,
  siteHeightM: number
): number {
  const canvasWidthMAtScale1 = CANVAS_WIDTH_PX / PIXELS_PER_METER;
  const canvasHeightMAtScale1 = CANVAS_HEIGHT_PX / PIXELS_PER_METER;
  const linearFactor = Math.max(
    siteWidthM / canvasWidthMAtScale1,
    siteHeightM / canvasHeightMAtScale1
  );
  return linearFactor * linearFactor;
}

export function toPyeong(squareMeters: number): number {
  return squareMeters / SQUARE_METERS_PER_PYEONG;
}

/** Formats an area (already in m²) with a pyeong conversion alongside it. */
export function formatArea(squareMeters: number): string {
  return `${squareMeters.toFixed(1)}㎡ (${toPyeong(squareMeters).toFixed(1)}평)`;
}
