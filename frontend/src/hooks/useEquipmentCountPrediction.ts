"use client";

import { useQuery } from "@tanstack/react-query";
import { predictEquipmentCounts } from "@/lib/api";
import type { FloorPlanSummary } from "@/hooks/useFloorPlanSummary";

/** Reference-only estimate for 예비펌프/주펌프/충압펌프/댐퍼/급기팬/배기팬/자동폐쇄장치/
 * 발신기 counts, derived from the building-scale fields on FloorPlanSummary.
 * Returns null until all 5 inputs have been entered on the drawing page. */
export function useEquipmentCountPrediction(
  floorPlanSummary: FloorPlanSummary | null
) {
  const groundFloorCount = floorPlanSummary?.buildingGroundFloorCount;
  const basementFloorCount = floorPlanSummary?.buildingBasementFloorCount;
  const buildingAreaSqm = floorPlanSummary?.buildingAreaSqm;
  const totalFloorAreaSqm = floorPlanSummary?.buildingTotalFloorAreaSqm;
  const siteAreaSqm = floorPlanSummary?.buildingSiteAreaSqm;

  const hasAllInputs =
    groundFloorCount != null &&
    basementFloorCount != null &&
    buildingAreaSqm != null &&
    totalFloorAreaSqm != null &&
    siteAreaSqm != null;

  return useQuery({
    queryKey: [
      "equipmentCountPrediction",
      groundFloorCount,
      basementFloorCount,
      buildingAreaSqm,
      totalFloorAreaSqm,
      siteAreaSqm,
    ],
    queryFn: () =>
      predictEquipmentCounts({
        groundFloorCount: groundFloorCount!,
        basementFloorCount: basementFloorCount!,
        buildingAreaSqm: buildingAreaSqm!,
        totalFloorAreaSqm: totalFloorAreaSqm!,
        siteAreaSqm: siteAreaSqm!,
      }),
    enabled: hasAllInputs,
  });
}
