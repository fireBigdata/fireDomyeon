import type { FloorPlanSummary } from "@/hooks/useFloorPlanSummary";
import { HeatDetectorType } from "@/types/heatDetector";
import type { EquipmentName } from "@/types/equipmentSelection";

/** Fallback used when the floor plan has no placement data for this equipment (not drawn yet, or not modeled on the drawing page at all). */
const DEFAULT_QUANTITY = 1;

/**
 * Total installed count for `name` from the floor plan drawing page, used as
 * the equipment-selection page's default product quantity. Only equipment
 * types that are actually placed on the drawing (extinguishers, heat
 * detectors, exit lights, sprinkler heads) have real counts; everything else
 * falls back to DEFAULT_QUANTITY since the drawing page has no placement
 * data for it yet.
 */
export function getFloorPlanInstalledCount(
  name: EquipmentName,
  summary: FloorPlanSummary | null
): number {
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
    default:
      return DEFAULT_QUANTITY;
  }
}
