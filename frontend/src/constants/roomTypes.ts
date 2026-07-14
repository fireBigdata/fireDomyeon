import { RoomType } from "@/types/floorplan";

export type RoomTypeDefault = {
  label: string;
  fill: string;
  stroke: string;
};

// To support a new room usage: add a case to the RoomType enum
// (types/floorplan.ts), then add matching entries here and in ROOM_TYPE_ORDER.
export const ROOM_TYPE_DEFAULTS: Record<RoomType, RoomTypeDefault> = {
  [RoomType.LIVING]: { label: "거실", fill: "#dbeafe", stroke: "#2563eb" },
  [RoomType.KITCHEN]: { label: "주방", fill: "#fef9c3", stroke: "#ca8a04" },
  [RoomType.BOILER]: { label: "보일러실", fill: "#ffe4e6", stroke: "#e11d48" },
  [RoomType.HALLWAY]: { label: "복도", fill: "#e5e7eb", stroke: "#6b7280" },
};

export const ROOM_TYPE_ORDER: RoomType[] = [
  RoomType.LIVING,
  RoomType.KITCHEN,
  RoomType.BOILER,
  RoomType.HALLWAY,
];

export const DEFAULT_ROOM_TYPE = RoomType.LIVING;
