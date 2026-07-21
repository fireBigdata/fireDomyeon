import type { Structure } from "@/types/floorplan";
import type { Box } from "@/lib/partitionTree";
import type { Point } from "@/lib/heatDetectorPlacement";

/**
 * Minimum clearance (px) kept between auto-placed equipment and an
 * obstacle's footprint — equipment isn't sited immediately flush against
 * furniture/columns either, not just on top of them. Not tied to a specific
 * NFTC clearance clause (this app's data model has no such rule); a
 * practical buffer, in line with this app's other fixed-pixel placement
 * tolerances (e.g. exitLightPlacement's ADJACENCY_TOLERANCE_PX).
 */
const OBSTACLE_CLEARANCE_PX = 20;

function rectsOverlap(a: Box, b: Box): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function pointInBox(point: Point, box: Box): boolean {
  return (
    point.x >= box.x &&
    point.x <= box.x + box.width &&
    point.y >= box.y &&
    point.y <= box.y + box.height
  );
}

/** `box` expanded by `margin` on every side. */
function inflate(box: Box, margin: number): Box {
  return {
    x: box.x - margin,
    y: box.y - margin,
    width: box.width + margin * 2,
    height: box.height + margin * 2,
  };
}

/**
 * Absolute-coordinate bounding boxes — each an obstacle structure's footprint
 * expanded by the required clearance — for every obstacle near `structure`.
 */
export function getObstaclesNear(structure: Structure, allStructures: Structure[]): Box[] {
  return allStructures
    .filter((s) => s.type === "obstacle")
    .map((o) => inflate({ x: o.x, y: o.y, width: o.width, height: o.height }, OBSTACLE_CLEARANCE_PX))
    .filter((box) => rectsOverlap(box, structure));
}

/**
 * If `point` (absolute coordinates) falls inside any obstacle box — already
 * expanded by the required clearance via `getObstaclesNear` — moves it to
 * the nearest edge of that box, clamped within `bounds`, so auto-placed
 * equipment never lands on or right next to furniture/columns. Keeps the
 * same point count/order the caller already computed — this only nudges
 * positions.
 */
export function moveOffObstacles(point: Point, obstacles: Box[], bounds: Box): Point {
  let current = point;
  for (const obstacle of obstacles) {
    if (!pointInBox(current, obstacle)) continue;

    const distLeft = current.x - obstacle.x;
    const distRight = obstacle.x + obstacle.width - current.x;
    const distTop = current.y - obstacle.y;
    const distBottom = obstacle.y + obstacle.height - current.y;
    const minDist = Math.min(distLeft, distRight, distTop, distBottom);

    if (minDist === distLeft) {
      current = { x: Math.max(bounds.x, obstacle.x), y: current.y };
    } else if (minDist === distRight) {
      current = { x: Math.min(bounds.x + bounds.width, obstacle.x + obstacle.width), y: current.y };
    } else if (minDist === distTop) {
      current = { x: current.x, y: Math.max(bounds.y, obstacle.y) };
    } else {
      current = { x: current.x, y: Math.min(bounds.y + bounds.height, obstacle.y + obstacle.height) };
    }
  }
  return current;
}
