import { SprinklerHazardClass } from "@/types/floorplan";

export const SPRINKLER_HAZARD_LABELS: Record<SprinklerHazardClass, string> = {
  [SprinklerHazardClass.NONE]: "일반",
  [SprinklerHazardClass.SPECIAL_COMBUSTIBLE]: "특수가연물 저장·취급 장소",
  [SprinklerHazardClass.STAGE]: "무대부",
};

export const SPRINKLER_HAZARD_ORDER: SprinklerHazardClass[] = [
  SprinklerHazardClass.NONE,
  SprinklerHazardClass.SPECIAL_COMBUSTIBLE,
  SprinklerHazardClass.STAGE,
];

export const DEFAULT_SPRINKLER_HAZARD = SprinklerHazardClass.NONE;
