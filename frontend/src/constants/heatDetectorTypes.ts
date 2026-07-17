import { RoomType } from "@/types/floorplan";
import { HeatDetectorType } from "@/types/heatDetector";

export const HEAT_DETECTOR_TYPE_LABELS: Record<HeatDetectorType, string> = {
  [HeatDetectorType.DIFFERENTIAL]: "차동식",
  [HeatDetectorType.FIXED_TEMPERATURE]: "정온식",
};

// Kitchens and boiler rooms see routine heat, steam, and cooking smoke that
// would false-trigger a differential (rate-of-rise) detector, so fixed-
// temperature detectors are used there instead.
const FIXED_TEMPERATURE_ROOM_TYPES: ReadonlySet<RoomType> = new Set([
  RoomType.KITCHEN,
  RoomType.BOILER,
]);

export function getHeatDetectorTypeForRoom(
  roomType: RoomType | undefined
): HeatDetectorType {
  if (roomType && FIXED_TEMPERATURE_ROOM_TYPES.has(roomType)) {
    return HeatDetectorType.FIXED_TEMPERATURE;
  }
  return HeatDetectorType.DIFFERENTIAL;
}
