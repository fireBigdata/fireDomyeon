import type { Structure } from "@/types/floorplan";
import type { Point } from "@/lib/heatDetectorPlacement";
import type { Box } from "@/lib/partitionTree";
import { moveOffObstacles } from "@/lib/obstacleAvoidance";

// Shared "hug the walls, starting near the nearest entrance" placement
// geometry, used by every equipment type placed around a room/corridor's
// own perimeter (extinguishers, indoor hydrants) rather than in a coverage
// grid (heat detectors, sprinklers).

const WALL_MARGIN_RATIO = 0.12;
const MIN_WALL_MARGIN_PX = 8;
const MAX_WALL_MARGIN_PX = 24;

// Two points placed closer than this (in pixels) are treated as overlapping
// icons and nudged apart.
const MIN_SEPARATION_PX = 14;

export function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** A small inset from the structure's own walls, clamped so it never turns the box inside-out. */
function computeWallMargin(size: number): number {
  const margin = Math.min(Math.max(size * WALL_MARGIN_RATIO, MIN_WALL_MARGIN_PX), MAX_WALL_MARGIN_PX);
  return Math.min(margin, Math.max(size / 2 - 1, 0));
}

/** Perimeter-parameter (arc length from the box's top-left corner) of the point on `box`'s boundary closest to `point`. */
function closestBoundaryParam(box: Box, point: Point): number {
  const { x, y, width: w, height: h } = box;
  const cx = Math.min(Math.max(point.x, x), x + w);
  const cy = Math.min(Math.max(point.y, y), y + h);
  const dTop = cy - y;
  const dBottom = y + h - cy;
  const dLeft = cx - x;
  const dRight = x + w - cx;
  const minD = Math.min(dTop, dBottom, dLeft, dRight);
  if (minD === dTop) return cx - x;
  if (minD === dRight) return w + (cy - y);
  if (minD === dBottom) return w + h + (x + w - cx);
  return w + h + w + (y + h - cy);
}

function pointAtPerimeterParam(box: Box, t: number): Point {
  const { x, y, width: w, height: h } = box;
  const perimeter = 2 * (w + h);
  if (perimeter <= 0) return { x, y };
  let tt = ((t % perimeter) + perimeter) % perimeter;
  if (tt <= w) return { x: x + tt, y };
  tt -= w;
  if (tt <= h) return { x: x + w, y: y + tt };
  tt -= h;
  if (tt <= w) return { x: x + w - tt, y: y + h };
  tt -= w;
  return { x, y: y + h - tt };
}

/** Evenly spaces `count` points around `box`'s perimeter, starting at `startParam`. */
function placePointsOnPerimeter(box: Box, count: number, startParam: number): Point[] {
  if (count <= 0) return [];
  if (count === 1) return [pointAtPerimeterParam(box, startParam)];
  const perimeter = 2 * (box.width + box.height);
  const step = perimeter / count;
  return Array.from({ length: count }, (_, i) => pointAtPerimeterParam(box, startParam + i * step));
}

/** The nearest entrance structure to `structure`, but only if it's plausibly this structure's own entrance. */
function findNearestEntrance(structure: Structure, entrances: Structure[]): Structure | null {
  if (entrances.length === 0) return null;
  const center = { x: structure.x + structure.width / 2, y: structure.y + structure.height / 2 };
  let nearest: Structure | null = null;
  let nearestDist = Infinity;
  for (const entrance of entrances) {
    const d = distance(center, {
      x: entrance.x + entrance.width / 2,
      y: entrance.y + entrance.height / 2,
    });
    if (d < nearestDist) {
      nearestDist = d;
      nearest = entrance;
    }
  }
  const proximityThreshold = Math.hypot(structure.width, structure.height) * 1.5;
  return nearest && nearestDist <= proximityThreshold ? nearest : null;
}

/**
 * Places `count` points near the walls of a single structure (absolute canvas
 * coordinates), nudged clear of any given obstacles. If `biasPointAbsolute`
 * is given, placement starts from the wall closest to it; otherwise it
 * starts near the structure's own entrance, if one is close enough to
 * plausibly belong to it.
 */
export function placePointsInStructure(
  structure: Structure,
  count: number,
  entrances: Structure[],
  biasPointAbsolute?: Point,
  obstacles: Box[] = []
): Point[] {
  if (count <= 0) return [];

  const marginX = computeWallMargin(structure.width);
  const marginY = computeWallMargin(structure.height);
  const box: Box = {
    x: marginX,
    y: marginY,
    width: Math.max(structure.width - marginX * 2, 0),
    height: Math.max(structure.height - marginY * 2, 0),
  };

  let startParam = 0;
  if (biasPointAbsolute) {
    startParam = closestBoundaryParam(box, {
      x: biasPointAbsolute.x - structure.x,
      y: biasPointAbsolute.y - structure.y,
    });
  } else {
    const nearestEntrance = findNearestEntrance(structure, entrances);
    if (nearestEntrance) {
      startParam = closestBoundaryParam(box, {
        x: nearestEntrance.x + nearestEntrance.width / 2 - structure.x,
        y: nearestEntrance.y + nearestEntrance.height / 2 - structure.y,
      });
    }
  }

  return placePointsOnPerimeter(box, count, startParam).map((p) =>
    moveOffObstacles({ x: structure.x + p.x, y: structure.y + p.y }, obstacles, structure)
  );
}

/** Nudges any point that lands within MIN_SEPARATION_PX of an earlier one, so icons never overlap. */
export function resolveOverlaps<T extends { point: Point }>(items: T[]): T[] {
  const placed: Point[] = [];
  return items.map((item) => {
    let candidate = { ...item.point };
    let guard = 0;
    while (placed.some((p) => distance(p, candidate) < MIN_SEPARATION_PX) && guard < 8) {
      candidate = { x: candidate.x + MIN_SEPARATION_PX, y: candidate.y + MIN_SEPARATION_PX };
      guard += 1;
    }
    placed.push(candidate);
    return { ...item, point: candidate };
  });
}
