import { EntranceType } from "@/types/floorplan";
import type { Structure } from "@/types/floorplan";
import { computeEffectivePixelArea } from "@/lib/partitionTree";

/** A plain door opening — not real floor space, and always drawn above everything else on canvas. */
export function isDoorStructure(structure: Structure): boolean {
  return structure.type === "entrance" && structure.entranceType === EntranceType.DOOR;
}

/** Sum of every structure's effective area, in pixels², excluding doors. */
export function computeTotalStructurePixelArea(structures: Structure[]): number {
  return structures.reduce(
    (sum, structure) =>
      sum + (isDoorStructure(structure) ? 0 : computeEffectivePixelArea(structure)),
    0
  );
}
