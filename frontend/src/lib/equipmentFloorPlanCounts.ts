import type { FloorPlanSummary } from "@/hooks/useFloorPlanSummary";
import { HeatDetectorType } from "@/types/heatDetector";
import type { EquipmentName } from "@/types/equipmentSelection";

/** Fallback used when the floor plan has no placement data for this equipment (not drawn yet, or not modeled on the drawing page at all). */
const DEFAULT_QUANTITY = 0;

/**
 * Equipment with no drawing-based placement logic at all, whose default
 * quantity instead comes from the reference-only ML estimate (see
 * hooks/useEquipmentCountPrediction.ts) when building-scale info has been
 * entered. Never claimed as authoritative — the caller must show it's an
 * estimate the user should review.
 */
export const ML_ESTIMATED_EQUIPMENT_NAMES: ReadonlySet<EquipmentName> = new Set([
  "예비펌프",
  "주펌프",
  "충압펌프",
  "급기팬",
  "배기팬",
  "자동폐쇄장치",
  "발신기",
]);

/**
 * Total installed count for `name` from the floor plan drawing page, used as
 * the equipment-selection page's default product quantity. Only equipment
 * types that are actually placed on the drawing (extinguishers, heat
 * detectors, exit lights, sprinkler heads, indoor hydrants) have real counts.
 * ML_ESTIMATED_EQUIPMENT_NAMES falls back to `mlPrediction` (a reference-only
 * estimate) when available; everything else falls back to DEFAULT_QUANTITY.
 */
export function getFloorPlanInstalledCount(
  name: EquipmentName,
  summary: FloorPlanSummary | null,
  mlPrediction?: Record<string, number> | null
): number {
  if (ML_ESTIMATED_EQUIPMENT_NAMES.has(name)) {
    const estimate = mlPrediction?.[name];
    return estimate != null ? Math.round(estimate) : DEFAULT_QUANTITY;
  }

  if (!summary) return DEFAULT_QUANTITY;

  switch (name) {
    case "소화기":
      return summary.totalExtinguisherCount || DEFAULT_QUANTITY;
    case "스프링클러":
      return summary.totalSprinklerHeadCount || DEFAULT_QUANTITY;
    case "차동식열감지기":
      return (
        summary.totalHeatDetectorCountsByType[HeatDetectorType.DIFFERENTIAL] ||
        DEFAULT_QUANTITY
      );
    case "정온식열감지기":
      return (
        summary.totalHeatDetectorCountsByType[
          HeatDetectorType.FIXED_TEMPERATURE
        ] || DEFAULT_QUANTITY
      );
    case "비상구유도등":
      return summary.totalExitLightCountsByCategory.EXIT || DEFAULT_QUANTITY;
    case "복도통로유도등":
      return (
        summary.totalExitLightCountsByCategory.CORRIDOR || DEFAULT_QUANTITY
      );
    case "계단통로유도등":
      return (
        summary.totalExitLightCountsByCategory.STAIRS || DEFAULT_QUANTITY
      );
    case "옥내소화전":
      return summary.totalHydrantCount || DEFAULT_QUANTITY;
    default:
      return DEFAULT_QUANTITY;
  }
}
