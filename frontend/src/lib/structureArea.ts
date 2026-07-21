import { EntranceType } from "@/types/floorplan";
import type { Structure } from "@/types/floorplan";
import { computeEffectivePixelArea } from "@/lib/partitionTree";

/** A plain door opening — not real floor space, and always drawn above everything else on canvas. */
export function isDoorStructure(structure: Structure): boolean {
  return structure.type === "entrance" && structure.entranceType === EntranceType.DOOR;
}

/** Any opening (공동현관/비상구/문) — not real floor space, so it has no area of its own. */
export function isEntranceStructure(structure: Structure): boolean {
  return structure.type === "entrance";
}

/** A furniture/column obstacle placed inside a room — its footprint already counts as part of that room's area. */
export function isObstacleStructure(structure: Structure): boolean {
  return structure.type === "obstacle";
}

/** Sum of every structure's effective area, in pixels², excluding entrances (openings) and obstacles (already inside another structure's area). */
export function computeTotalStructurePixelArea(structures: Structure[]): number {
  return structures.reduce((sum, structure) => {
    if (isEntranceStructure(structure) || isObstacleStructure(structure)) return sum;
    return sum + computeEffectivePixelArea(structure);
  }, 0);
}
