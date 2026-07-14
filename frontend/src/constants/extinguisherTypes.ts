import type { ExtinguisherTypeDef } from "@/types/extinguisher";

// TODO: 실제 소화기 종류 API 연동 (현재는 Mock Data)
export const EXTINGUISHER_TYPES: ExtinguisherTypeDef[] = [
  { id: "A", name: "ABC 분말소화기", ability: 1 },
  { id: "B", name: "CO2 소화기", ability: 2 },
  { id: "C", name: "포(Foam) 소화기", ability: 3 },
];

export const DEFAULT_EXTINGUISHER_TYPE_ID = EXTINGUISHER_TYPES[0].id;
