import { EntranceSwingDirection } from "@/types/floorplan";

export type EntranceSwingDirectionDefault = {
  label: string;
  fill: string;
  stroke: string;
};

// To support a new swing direction: add a case to the EntranceSwingDirection
// enum (types/floorplan.ts), add matching entries here and in
// ENTRANCE_SWING_DIRECTION_ORDER, then add its hinge geometry in
// components/canvas/EntranceSwingArc.tsx.
export const ENTRANCE_SWING_DIRECTION_DEFAULTS: Record<
  EntranceSwingDirection,
  EntranceSwingDirectionDefault
> = {
  [EntranceSwingDirection.UP_LEFT]: { label: "◴ 왼쪽위", fill: "#f3f4f6", stroke: "#6b7280" },
  [EntranceSwingDirection.UP_RIGHT]: { label: "◷ 오른쪽위", fill: "#f3f4f6", stroke: "#6b7280" },
  [EntranceSwingDirection.DOWN_LEFT]: { label: "◵ 왼쪽아래", fill: "#f3f4f6", stroke: "#6b7280" },
  [EntranceSwingDirection.DOWN_RIGHT]: { label: "◶ 오른쪽아래", fill: "#f3f4f6", stroke: "#6b7280" },
};

export const ENTRANCE_SWING_DIRECTION_ORDER: EntranceSwingDirection[] = [
  EntranceSwingDirection.UP_LEFT,
  EntranceSwingDirection.UP_RIGHT,
  EntranceSwingDirection.DOWN_LEFT,
  EntranceSwingDirection.DOWN_RIGHT,
];

export const DEFAULT_ENTRANCE_SWING_DIRECTION = EntranceSwingDirection.DOWN_RIGHT;
