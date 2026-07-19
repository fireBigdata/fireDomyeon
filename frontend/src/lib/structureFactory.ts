import type { EntranceType, RoomType, Structure, StructureType } from "@/types/floorplan";
import { DEFAULT_ROOM_TYPE } from "@/constants/roomTypes";
import { DEFAULT_ENTRANCE_TYPE } from "@/constants/entranceTypes";
import { createId } from "@/lib/id";
import { clonePartitionTree } from "@/lib/partitionTree";

export type StructureRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function createStructure(
  type: StructureType,
  rect: StructureRect,
  roomType?: RoomType,
  entranceType?: EntranceType
): Structure {
  return {
    id: createId("structure"),
    type,
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
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
