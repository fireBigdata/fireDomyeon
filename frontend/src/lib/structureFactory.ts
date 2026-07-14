import type { EntranceType, RoomType, Structure, StructureType } from "@/types/floorplan";
import { STRUCTURE_DEFAULTS } from "@/constants/structureDefaults";
import { DEFAULT_ROOM_TYPE } from "@/constants/roomTypes";
import { DEFAULT_ENTRANCE_TYPE } from "@/constants/entranceTypes";
import { createId } from "@/lib/id";
import { clonePartitionTree } from "@/lib/partitionTree";

const SPAWN_STEP = 24;
const SPAWN_ORIGIN = { x: 40, y: 40 };
const SPAWN_WRAP = 5;

export function createStructure(
  type: StructureType,
  existingCount: number,
  roomType?: RoomType,
  entranceType?: EntranceType
): Structure {
  const defaults = STRUCTURE_DEFAULTS[type];
  const offset = existingCount % SPAWN_WRAP;

  return {
    id: createId("structure"),
    type,
    x: SPAWN_ORIGIN.x + offset * SPAWN_STEP,
    y: SPAWN_ORIGIN.y + offset * SPAWN_STEP,
    width: defaults.width,
    height: defaults.height,
    rotation: 0,
    ...(type === "room" ? { roomType: roomType ?? DEFAULT_ROOM_TYPE } : {}),
    ...(type === "entrance"
      ? { entranceType: entranceType ?? DEFAULT_ENTRANCE_TYPE }
      : {}),
  };
}

/** Deep copy, used when cloning a floor. */
export function cloneStructure(structure: Structure): Structure {
  return {
    ...structure,
    id: createId("structure"),
    partitions: clonePartitionTree(structure.partitions),
  };
}
