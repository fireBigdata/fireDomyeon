"use client";

import { useCallback, useState } from "react";
import type { ExtinguisherPlacement } from "@/types/extinguisher";
import type { FacilityType, Floor } from "@/types/floorplan";
import type { EquipmentProduct } from "@/types/equipmentSelection";
import type { StructureExtinguisherSummary } from "@/lib/extinguisherPlacement";
import { planExtinguisherPlacement } from "@/lib/extinguisherPlacement";

export type ExtinguisherSummary = {
  facilityType: FacilityType;
  totalFloorArea: number;
  abilityUnitsPerExtinguisher: number;
  requiredAbilityUnits: number;
  minimumCountByArea: number;
  addedByDistanceRule: number;
  finalCount: number;
  byStructure: StructureExtinguisherSummary[];
};

const NO_PRODUCT_MESSAGE = "설비 선택 페이지에서 소화기를 먼저 선택해주세요.";
const NO_ABILITY_UNIT_MESSAGE = "선택한 소화기의 능력단위가 아직 등록되지 않았습니다.";

export function useExtinguisherPlacement(
  floor: Floor,
  facilityType: FacilityType,
  scale: number,
  selectedProduct: EquipmentProduct | null,
  isFireResistantStructure: boolean | undefined,
  onPlaced: (placements: ExtinguisherPlacement[]) => void
) {
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ExtinguisherSummary | null>(null);

  const autoPlace = useCallback(() => {
    if (!selectedProduct) {
      setError(NO_PRODUCT_MESSAGE);
      return;
    }

    if (selectedProduct.abilityUnit == null || selectedProduct.abilityUnit <= 0) {
      setError(NO_ABILITY_UNIT_MESSAGE);
      return;
    }

    const result = planExtinguisherPlacement(
      floor,
      scale,
      selectedProduct.abilityUnit,
      selectedProduct.id,
      isFireResistantStructure,
      facilityType
    );
    setError(null);
    setSummary({
      facilityType,
      totalFloorArea: result.totalFloorArea,
      abilityUnitsPerExtinguisher: result.abilityUnitsPerExtinguisher,
      requiredAbilityUnits: result.requiredAbilityUnits,
      minimumCountByArea: result.minimumCountByArea,
      addedByDistanceRule: result.addedByDistanceRule,
      finalCount: result.finalCount,
      byStructure: result.byStructure,
    });
    onPlaced(result.placements);
  }, [facilityType, floor, scale, selectedProduct, isFireResistantStructure, onPlaced]);

  return {
    error,
    summary,
    autoPlace,
  };
}
