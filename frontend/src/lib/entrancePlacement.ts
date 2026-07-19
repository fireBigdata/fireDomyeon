import { STRUCTURE_DEFAULTS } from "@/constants/structureDefaults";

export type EntranceOrientation = "horizontal" | "vertical";

type Rect = { x: number; y: number; width: number; height: number };

// How close (content px) the cursor needs to be to another structure's edge
// for that edge to be treated as "the wall" the entrance sits in.
const WALL_PROXIMITY_PX = 24;

/**
 * Detects which orientation an entrance placed at `point` should use, based
 * on the nearest edge of any overlapping/nearby structure: a horizontal wall
 * (a structure's top/bottom edge) calls for a horizontal (wide) opening, a
 * vertical wall (left/right edge) calls for a vertical (tall) one. Falls
 * back to horizontal — STRUCTURE_DEFAULTS.entrance's own orientation — when
 * no wall is nearby.
 */
export function detectEntranceOrientation(
  point: { x: number; y: number },
  structures: Rect[]
): EntranceOrientation {
  let best: EntranceOrientation | null = null;
  let bestDist = WALL_PROXIMITY_PX;

  for (const structure of structures) {
    const left = structure.x;
    const right = structure.x + structure.width;
    const top = structure.y;
    const bottom = structure.y + structure.height;

    // Only counts as "along" a wall when the point also falls within that
    // wall's own span — otherwise a point far past a room's corner would
    // wrongly snap to that room's near edge.
    if (point.y >= top - WALL_PROXIMITY_PX && point.y <= bottom + WALL_PROXIMITY_PX) {
      const dist = Math.min(Math.abs(point.y - top), Math.abs(point.y - bottom));
      if (dist < bestDist) {
        bestDist = dist;
        best = "horizontal";
      }
    }
    if (point.x >= left - WALL_PROXIMITY_PX && point.x <= right + WALL_PROXIMITY_PX) {
      const dist = Math.min(Math.abs(point.x - left), Math.abs(point.x - right));
      if (dist < bestDist) {
        bestDist = dist;
        best = "vertical";
      }
    }
  }

  return best ?? "horizontal";
}

/** STRUCTURE_DEFAULTS.entrance's fixed size, centered on `point` and rotated
 * to match `orientation` (width/height swapped for "vertical"). */
export function getEntrancePreviewRect(
  point: { x: number; y: number },
  orientation: EntranceOrientation
): Rect {
  const defaults = STRUCTURE_DEFAULTS.entrance;
  const width = orientation === "horizontal" ? defaults.width : defaults.height;
  const height = orientation === "horizontal" ? defaults.height : defaults.width;
  return {
    x: point.x - width / 2,
    y: point.y - height / 2,
    width,
    height,
  };
}
