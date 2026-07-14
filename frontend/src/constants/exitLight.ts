import type { ExitLightCategory } from "@/types/exitLight";

export type ExitLightCategoryDefault = {
  label: string;
  /** Single-character marker text drawn on the canvas icon. */
  shortLabel: string;
  color: string;
};

export const EXIT_LIGHT_CATEGORY_DEFAULTS: Record<ExitLightCategory, ExitLightCategoryDefault> = {
  EXIT: { label: "피난구유도등", shortLabel: "피", color: "#16a34a" },
  CORRIDOR: { label: "복도통로유도등", shortLabel: "복", color: "#0891b2" },
  STAIRS: { label: "계단통로유도등", shortLabel: "계", color: "#7c3aed" },
};

export const EXIT_LIGHT_CATEGORY_ORDER: ExitLightCategory[] = [
  "EXIT",
  "CORRIDOR",
  "STAIRS",
];
