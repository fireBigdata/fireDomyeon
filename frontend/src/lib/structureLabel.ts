import type { Structure } from "@/types/floorplan";
import { STRUCTURE_DEFAULTS } from "@/constants/structureDefaults";
import { DEFAULT_ROOM_TYPE, ROOM_TYPE_DEFAULTS } from "@/constants/roomTypes";
import { DEFAULT_ENTRANCE_TYPE, ENTRANCE_TYPE_DEFAULTS } from "@/constants/entranceTypes";

/** The usage-aware display label for a structure (room usage, entrance kind, or its structure type). */
export function getStructureLabel(structure: Structure): string {
  if (structure.type === "room") {
    return ROOM_TYPE_DEFAULTS[structure.roomType ?? DEFAULT_ROOM_TYPE].label;
  }
  if (structure.type === "entrance") {
    return ENTRANCE_TYPE_DEFAULTS[structure.entranceType ?? DEFAULT_ENTRANCE_TYPE].label;
  }
  return STRUCTURE_DEFAULTS[structure.type].label;
}
