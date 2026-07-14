import type { Floor } from "@/types/floorplan";
import { createId } from "@/lib/id";
import { cloneStructure } from "@/lib/structureFactory";

export function createFloor(name: string): Floor {
  return {
    id: createId("floor"),
    name,
    structures: [],
    extinguisherPlacements: [],
  };
}

/** Deep copy of a floor: all rooms, room types, positions, sizes and partitions. */
export function cloneFloor(floor: Floor, name: string): Floor {
  return {
    id: createId("floor"),
    name,
    structures: floor.structures.map(cloneStructure),
    // Placements are derived from the room layout, so they're regenerated
    // (via Auto Place) rather than copied onto the new floor.
    extinguisherPlacements: [],
  };
}

export function nextFloorName(floors: Floor[]): string {
  return `${floors.length + 1}F`;
}
