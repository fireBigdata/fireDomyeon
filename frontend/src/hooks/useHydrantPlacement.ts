"use client";

import { useCallback, useState } from "react";
import type { HydrantPlacement } from "@/types/hydrant";
import type { FacilityType, Floor } from "@/types/floorplan";
import type { EquipmentProduct } from "@/types/equipmentSelection";
import type { StructureHydrantSummary } from "@/lib/hydrantPlacement";
import { autoPlaceIndoorHydrants } from "@/lib/hydrantPlacement";

export type HydrantSummary = {
  applicable: boolean;
  notApplicableReason: string | null;
  totalCount: number;
  byStructure: StructureHydrantSummary[];
  warnings: string[];
  totalBuildingFloorAreaM2: number;
  floorCount: number;
};

const NO_PRODUCT_MESSAGE = "설비 선택 페이지에서 옥내소화전을 먼저 선택해주세요.";

/**
 * Unlike the other equipment hooks, hydrant applicability depends on the
 * whole building (every floor's floor area / total floor count — see
 * lib/hydrantRules.ts), not just the current floor, so this hook takes the
 * full `floors` array in addition to `currentFloor`.
 */
export function useHydrantPlacement(
  floors: Floor[],
  currentFloor: Floor,
  facilityType: FacilityType,
  scale: number,
  selectedProduct: EquipmentProduct | null,
  onPlaced: (placements: HydrantPlacement[]) => void
) {
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<HydrantSummary | null>(null);

  const autoPlace = useCallback(() => {
    if (!selectedProduct) {
      setError(NO_PRODUCT_MESSAGE);
      return;
    }

    const result = autoPlaceIndoorHydrants(floors, currentFloor, facilityType, selectedProduct.id, scale);
    setError(null);
    setSummary({
      applicable: result.applicable,
      notApplicableReason: result.notApplicableReason,
      totalCount: result.placements.length,
      byStructure: result.byStructure,
      warnings: result.warnings,
      totalBuildingFloorAreaM2: result.totalBuildingFloorAreaM2,
      floorCount: result.floorCount,
    });
    onPlaced(result.placements);
  }, [floors, currentFloor, facilityType, scale, selectedProduct, onPlaced]);

  return { error, summary, autoPlace };
}
