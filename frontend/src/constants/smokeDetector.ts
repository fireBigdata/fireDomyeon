import type { SmokeDetectorCategory } from "@/types/smokeDetector";

export type SmokeDetectorCategoryDefault = {
  label: string;
  /** Single-character marker text drawn on the canvas icon. */
  shortLabel: string;
  color: string;
};

export const SMOKE_DETECTOR_CATEGORY_DEFAULTS: Record<SmokeDetectorCategory, SmokeDetectorCategoryDefault> = {
  CORRIDOR: { label: "복도·통로 연기감지기", shortLabel: "복", color: "#0d9488" },
  STAIRS: { label: "계단·경사로 연기감지기", shortLabel: "계", color: "#9333ea" },
  ELEVATOR: { label: "승강로 연기감지기", shortLabel: "승", color: "#2563eb" },
};

export const SMOKE_DETECTOR_CATEGORY_ORDER: SmokeDetectorCategory[] = [
  "CORRIDOR",
  "STAIRS",
  "ELEVATOR",
];
