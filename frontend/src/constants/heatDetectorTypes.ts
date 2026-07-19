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

// NFTC 203 감지기 바닥면적 표(부착높이 4m 미만)의 "기타구조" 값 -> "내화구조" 값 매핑.
// 카탈로그의 abilityUnit은 기타구조 기준 보호면적(㎡)이므로, 건물이 내화구조면 아래 표에
// 따라 더 넓은 보호면적을 적용한다.
// 50(차동식·보상식 1종) -> 90, 40(차동식·보상식 2종/정온식 특종) -> 70,
// 30(정온식 1종) -> 60, 15(정온식 2종) -> 20.
const FIRE_RESISTANT_COVERAGE_AREA: Record<number, number> = {
  50: 90,
  40: 70,
  30: 60,
  15: 20,
};

export function getEffectiveCoverageArea(
  baseCoverageArea: number,
  isFireResistantStructure: boolean | undefined
): number {
  if (!isFireResistantStructure) return baseCoverageArea;
  return FIRE_RESISTANT_COVERAGE_AREA[baseCoverageArea] ?? baseCoverageArea;
}
