import type { FacilityType, StructureType } from "@/types/floorplan";

export type StructureDefault = {
  label: string;
  width: number;
  height: number;
  fill: string;
  stroke: string;
};

export const STRUCTURE_DEFAULTS: Record<StructureType, StructureDefault> = {
  room: {
    label: "방",
    width: 150,
    height: 120,
    fill: "#dbeafe",
    stroke: "#2563eb",
  },
  corridor: {
    label: "복도",
    width: 260,
    height: 60,
    fill: "#fef3c7",
    stroke: "#d97706",
  },
  entrance: {
    label: "출입구",
    // 1.3m x 0.3m — PIXELS_PER_METER (lib/area.ts) is 30px/m, so
    // 1.3 * 30 = 39, 0.3 * 30 = 9.
    width: 39,
    height: 9,
    fill: "#dcfce7",
    stroke: "#16a34a",
  },
  elevator: {
    label: "엘리베이터",
    width: 100,
    height: 100,
    fill: "#ede9fe",
    stroke: "#7c3aed",
  },
  stairs: {
    label: "계단",
    width: 110,
    height: 130,
    fill: "#fee2e2",
    stroke: "#dc2626",
  },
  obstacle: {
    label: "장애물",
    width: 40,
    height: 40,
    fill: "#9ca3af",
    stroke: "#4b5563",
  },
};

export const STRUCTURE_TYPE_ORDER: StructureType[] = [
  "room",
  "corridor",
  "entrance",
  "elevator",
  "stairs",
  "obstacle",
];

export const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  apartment: "아파트",
  villa: "빌라(연립·다세대주택)",
  house: "단독주택",
  commercial: "상가",
  hospital: "병원",
  school: "학교",
  subway: "지하철역",
  factory: "공장",
  warehouse: "창고",
};

export const FACILITY_TYPE_ORDER: FacilityType[] = [
  "apartment",
  "villa",
  "house",
  "commercial",
  "hospital",
  "school",
  "subway",
  "factory",
  "warehouse",
];
