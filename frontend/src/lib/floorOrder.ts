import type { Floor } from "@/types/floorplan";

// Sentinel for the "지상" (ground-level) marker's slot in FloorBar's
// drag-reorder sequence — distinct from any floor id (createId always
// prefixes with "floor-").
export const GROUND_MARKER_KEY = "__GROUND__";

/**
 * Moves the element at `fromIndex` to sit at `gapIndex` — a slot BETWEEN
 * items, counted in the original array (0 = before everything, items.length
 * = after everything). FloorBar renders one of these gaps before/after every
 * tab (and the 지상 marker) as a dashed drop-line, so every position —
 * between any two floors, or off either end — is directly reachable.
 */
export function moveArrayItemToGap<T>(items: T[], fromIndex: number, gapIndex: number): T[] {
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  const adjustedGap = gapIndex > fromIndex ? gapIndex - 1 : gapIndex;
  const clamped = Math.max(0, Math.min(adjustedGap, next.length));
  next.splice(clamped, 0, moved);
  return next;
}

/** Interleaves the floors with the GROUND_MARKER_KEY sentinel at
 * `groundMarkerIndex`, for FloorBar's drag-and-drop: floors and the marker
 * all reorder within this one combined sequence. */
export function buildFloorBarOrder(
  floors: Floor[],
  groundMarkerIndex: number
): string[] {
  const ids = floors.map((f) => f.id);
  return [
    ...ids.slice(0, groundMarkerIndex),
    GROUND_MARKER_KEY,
    ...ids.slice(groundMarkerIndex),
  ];
}

/** Inverse of buildFloorBarOrder: splits a combined order back into floors
 * (in their new order) and where the marker landed. */
export function applyFloorBarOrder(
  order: string[],
  floors: Floor[]
): { floors: Floor[]; groundMarkerIndex: number } {
  const floorsById = new Map(floors.map((f) => [f.id, f] as const));
  const groundMarkerIndex = order.indexOf(GROUND_MARKER_KEY);
  const reordered = order
    .filter((key) => key !== GROUND_MARKER_KEY)
    .map((id) => floorsById.get(id))
    .filter((f): f is Floor => f !== undefined);
  return { floors: reordered, groundMarkerIndex };
}

/**
 * Recomputes every floor's display name from its position relative to
 * `groundMarkerIndex`: floors at or after the marker (지상 오른쪽) are
 * numbered 1F, 2F, 3F... in order; floors before it (지상 왼쪽) are numbered
 * B1, B2, B3..., with the one immediately left of the marker as B1.
 */
export function applyAutoFloorNames(floors: Floor[], groundMarkerIndex: number): Floor[] {
  return floors.map((floor, index) => {
    const name =
      index < groundMarkerIndex ? `B${groundMarkerIndex - index}` : `${index - groundMarkerIndex + 1}F`;
    return floor.name === name ? floor : { ...floor, name };
  });
}

export function countGroundFloors(floors: Floor[], groundMarkerIndex: number): number {
  return floors.length - groundMarkerIndex;
}

export function countBasementFloors(groundMarkerIndex: number): number {
  return groundMarkerIndex;
}
