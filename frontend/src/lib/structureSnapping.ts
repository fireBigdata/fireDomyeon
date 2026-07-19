export type SnapRect = { x: number; y: number; width: number; height: number };

/** Within this many content px, an edge/corner snaps to a neighbor's. */
export const SNAP_THRESHOLD_PX = 8;

type SnapTargets = { xTargets: number[]; yTargets: number[] };

/** Every edge/center line of `rects`, as candidate snap targets on each axis. */
function collectSnapTargets(rects: SnapRect[]): SnapTargets {
  const xTargets: number[] = [];
  const yTargets: number[] = [];
  for (const rect of rects) {
    xTargets.push(rect.x, rect.x + rect.width, rect.x + rect.width / 2);
    yTargets.push(rect.y, rect.y + rect.height, rect.y + rect.height / 2);
  }
  return { xTargets, yTargets };
}

function closestOffset(
  candidates: number[],
  targets: number[],
  threshold: number
): number {
  let bestOffset = 0;
  let bestDist = threshold;
  for (const candidate of candidates) {
    for (const target of targets) {
      const dist = Math.abs(target - candidate);
      if (dist < bestDist) {
        bestDist = dist;
        bestOffset = target - candidate;
      }
    }
  }
  return bestOffset;
}

/**
 * Snaps a moving rect's position (size unchanged) so its edges/center align
 * with any of `others`' edges/centers within `threshold` — used while
 * dragging an existing structure, or while dragging out a new one.
 */
export function snapRectPosition(
  rect: SnapRect,
  others: SnapRect[],
  threshold: number = SNAP_THRESHOLD_PX
): { x: number; y: number } {
  const { xTargets, yTargets } = collectSnapTargets(others);
  const dx = closestOffset(
    [rect.x, rect.x + rect.width, rect.x + rect.width / 2],
    xTargets,
    threshold
  );
  const dy = closestOffset(
    [rect.y, rect.y + rect.height, rect.y + rect.height / 2],
    yTargets,
    threshold
  );
  return { x: rect.x + dx, y: rect.y + dy };
}

/**
 * Snaps a single point (the corner/edge currently being dragged — while
 * drawing a new structure, or resizing an existing one via a Transformer
 * anchor) so it lands on any of `others`' edge/center lines within
 * `threshold`, independently on each axis.
 */
export function snapPointToTargets(
  point: { x: number; y: number },
  others: SnapRect[],
  threshold: number = SNAP_THRESHOLD_PX
): { x: number; y: number } {
  const { xTargets, yTargets } = collectSnapTargets(others);
  return {
    x: point.x + closestOffset([point.x], xTargets, threshold),
    y: point.y + closestOffset([point.y], yTargets, threshold),
  };
}
