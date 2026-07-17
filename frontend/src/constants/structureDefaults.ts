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
    width: 70,
    height: 25,
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
