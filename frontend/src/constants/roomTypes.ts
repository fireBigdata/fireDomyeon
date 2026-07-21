import { RoomType } from "@/types/floorplan";

export type RoomTypeDefault = {
  label: string;
  fill: string;
  stroke: string;
};

// To support a new room usage: add a case to the RoomType enum
// (types/floorplan.ts), then add matching entries here and in ROOM_TYPE_ORDER.
export const ROOM_TYPE_DEFAULTS: Record<RoomType, RoomTypeDefault> = {
  [RoomType.BEDROOM]: { label: "방", fill: "#e0e7ff", stroke: "#4f46e5" },
  [RoomType.LIVING]: { label: "거실", fill: "#dbeafe", stroke: "#2563eb" },
  [RoomType.KITCHEN]: { label: "주방", fill: "#fef9c3", stroke: "#ca8a04" },
  [RoomType.BOILER]: { label: "보일러실", fill: "#ffe4e6", stroke: "#e11d48" },
  // 상가/병원/학교/지하철역/공장/창고 등에서 사용하는 범용 실 — 침실/거실 등
  // 주거용 세부 용도가 적용되지 않는 시설의 기본 선택지.
  [RoomType.GENERIC]: { label: "실", fill: "#f3f4f6", stroke: "#6b7280" },
};

export const ROOM_TYPE_ORDER: RoomType[] = [
  RoomType.BEDROOM,
  RoomType.LIVING,
  RoomType.KITCHEN,
  RoomType.BOILER,
  RoomType.GENERIC,
];

export const DEFAULT_ROOM_TYPE = RoomType.BEDROOM;
