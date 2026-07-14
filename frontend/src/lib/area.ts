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

export function toPyeong(squareMeters: number): number {
  return squareMeters / SQUARE_METERS_PER_PYEONG;
}

/** Formats an area (already in m²) with a pyeong conversion alongside it. */
export function formatArea(squareMeters: number): string {
  return `${squareMeters.toFixed(1)}㎡ (${toPyeong(squareMeters).toFixed(1)}평)`;
}
