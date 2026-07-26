import { EntranceSwingDirection } from "@/types/floorplan";

export type EntranceSwingGeometry = {
  /** Hinge point (Konva Wedge's own x/y), in the entrance rect's own local
   * (unrotated) coordinates — always one of its 4 corners. */
  apexX: number;
  apexY: number;
  /** Degrees clockwise from due east (Konva's 0°) that the sweep starts at. */
  rotation: number;
};

// Each direction hinges at the rect corner diagonally opposite the quadrant
// it names, then sweeps 90° (due) into that quadrant — e.g. DOWN_RIGHT
// hinges at the top-left corner and sweeps from east (0°) to south (90°).
const GEOMETRY: Record<
  EntranceSwingDirection,
  (width: number, height: number) => EntranceSwingGeometry
> = {
  [EntranceSwingDirection.DOWN_RIGHT]: () => ({ apexX: 0, apexY: 0, rotation: 0 }),
  [EntranceSwingDirection.DOWN_LEFT]: (width) => ({ apexX: width, apexY: 0, rotation: 90 }),
  [EntranceSwingDirection.UP_LEFT]: (width, height) => ({
    apexX: width,
    apexY: height,
    rotation: 180,
  }),
  [EntranceSwingDirection.UP_RIGHT]: (_width, height) => ({
    apexX: 0,
    apexY: height,
    rotation: 270,
  }),
};

export function getEntranceSwingGeometry(
  direction: EntranceSwingDirection,
  width: number,
  height: number
): EntranceSwingGeometry {
  return GEOMETRY[direction](width, height);
}

/** Door-leaf length for the swing symbol: the entrance's own wider span
 * (its wall-opening width), regardless of orientation. */
export function getEntranceSwingRadius(width: number, height: number): number {
  return Math.max(width, height);
}

/** Which quadrant `point` falls in relative to `rect`'s center — left/right
 * and up/down of the entrance decide the swing direction, so hovering over
 * (say) the area above-right of the entrance previews UP_RIGHT.
 *
 * One axis is flipped depending on orientation: a 세로(vertical, tall) entrance
 * flips up/down, a 가로(horizontal, wide) entrance flips left/right — matches
 * how the door leaf actually reads once it's rotated into the wall opening. */
export function detectEntranceSwingDirection(
  rect: { x: number; y: number; width: number; height: number },
  point: { x: number; y: number }
): EntranceSwingDirection {
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  let isLeft = point.x < centerX;
  let isUp = point.y < centerY;

  if (rect.height > rect.width) {
    isUp = !isUp;
  } else {
    isLeft = !isLeft;
  }

  if (isUp) {
    return isLeft ? EntranceSwingDirection.UP_LEFT : EntranceSwingDirection.UP_RIGHT;
  }
  return isLeft ? EntranceSwingDirection.DOWN_LEFT : EntranceSwingDirection.DOWN_RIGHT;
}
