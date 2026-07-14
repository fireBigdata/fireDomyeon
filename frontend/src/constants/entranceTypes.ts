import { EntranceType } from "@/types/floorplan";

export type EntranceTypeDefault = {
  label: string;
  fill: string;
  stroke: string;
};

// To support a new entrance kind: add a case to the EntranceType enum
// (types/floorplan.ts), then add matching entries here and in ENTRANCE_TYPE_ORDER.
export const ENTRANCE_TYPE_DEFAULTS: Record<EntranceType, EntranceTypeDefault> = {
  [EntranceType.COMMON]: { label: "공동현관", fill: "#dcfce7", stroke: "#16a34a" },
  [EntranceType.EMERGENCY]: { label: "비상구", fill: "#fee2e2", stroke: "#dc2626" },
  [EntranceType.DOOR]: { label: "문", fill: "#f3f4f6", stroke: "#6b7280" },
};

export const ENTRANCE_TYPE_ORDER: EntranceType[] = [
  EntranceType.COMMON,
  EntranceType.EMERGENCY,
  EntranceType.DOOR,
];

export const DEFAULT_ENTRANCE_TYPE = EntranceType.DOOR;
