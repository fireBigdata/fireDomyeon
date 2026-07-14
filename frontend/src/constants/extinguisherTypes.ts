import type { ExtinguisherTypeDef } from "@/types/extinguisher";

// TODO: 실제 소화기 종류 API 연동 (현재는 Mock Data)
export const EXTINGUISHER_TYPES: ExtinguisherTypeDef[] = [
  { id: "A", name: "ABC 분말소화기" },
  { id: "B", name: "CO2 소화기" },
  { id: "C", name: "포(Foam) 소화기" },
];

export const DEFAULT_EXTINGUISHER_TYPE_ID = EXTINGUISHER_TYPES[0].id;

// 사용자가 능력단위를 아직 입력하지 않았을 때 보여주는 입력창의 기본값.
export const DEFAULT_ABILITY_UNITS_PER_EXTINGUISHER = 1;
