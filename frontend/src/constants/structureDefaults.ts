import type { StructureType } from "@/types/floorplan";

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
    width: 120,
    height: 100,
    fill: "#dbeafe",
    stroke: "#2563eb",
  },
  corridor: {
    label: "복도",
    width: 220,
    height: 50,
    fill: "#fef3c7",
    stroke: "#d97706",
  },
  entrance: {
    label: "출입구",
    width: 60,
    height: 20,
    fill: "#dcfce7",
    stroke: "#16a34a",
  },
  elevator: {
    label: "엘리베이터",
    width: 80,
    height: 80,
    fill: "#ede9fe",
    stroke: "#7c3aed",
  },
  stairs: {
    label: "계단",
    width: 90,
    height: 110,
    fill: "#fee2e2",
    stroke: "#dc2626",
  },
};

export const STRUCTURE_TYPE_ORDER: StructureType[] = [
  "room",
  "corridor",
  "entrance",
  "elevator",
  "stairs",
];

export const FACILITY_TYPE_LABELS: Record<string, string> = {
  apartment: "아파트",
  house: "주택",
};
