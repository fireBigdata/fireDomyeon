import type { Floor } from "@/types/floorplan";
import { createId } from "@/lib/id";
import { cloneStructure } from "@/lib/structureFactory";

export function createFloor(name: string): Floor {
  return {
    id: createId("floor"),
    name,
    structures: [],
    extinguisherPlacements: [],
    heatDetectors: [],
    exitLights: [],
    smokeDetectors: [],
    sprinklerHeads: [],
    hydrantPlacements: [],
  };
}

/** Deep copy of a floor: all rooms, room types, positions, sizes and partitions. */
export function cloneFloor(floor: Floor, name: string): Floor {
  return {
    id: createId("floor"),
    name,
    structures: floor.structures.map(cloneStructure),
    // Policy: auto-placed detectors/placements are derived from the room
    // layout, so they're regenerated (via Auto Place) on the new floor
    // rather than copied — a stale placement computed for the old floor's
    // layout isn't guaranteed to still be valid after further edits.
    // Any *manually* placed heat detectors (isAutoPlaced === false) would
    // be real user data, not derived, but there's no manual placement UI
    // yet; once one exists, this should deep-copy those with fresh ids
    // (via createId) rather than dropping them.
    extinguisherPlacements: [],
    heatDetectors: [],
    exitLights: [],
    smokeDetectors: [],
    sprinklerHeads: [],
    hydrantPlacements: [],
  };
}
