"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DEFAULT_TO_CHEAPEST_PRODUCT_EQUIPMENT,
  EQUIPMENT_LIST,
  EQUIPMENT_PRODUCTS,
  getCheapestProduct,
} from "@/constants/equipmentProducts";
import type {
  EquipmentName,
  EquipmentQuantityState,
  EquipmentSelectionState,
  EquipmentSelectionSummary,
  EquipmentSelectionValue,
} from "@/types/equipmentSelection";
import { NONE_PRODUCT_ID } from "@/types/equipmentSelection";
import type { FloorPlanSummary } from "@/hooks/useFloorPlanSummary";
import { getFloorPlanInstalledCount } from "@/lib/equipmentFloorPlanCounts";
import { getFireResistantConstructionCostPerM2 } from "@/lib/facilityRules";

function createInitialSelectionState(): EquipmentSelectionState {
  return EQUIPMENT_LIST.reduce((state, name) => {
    const cheapestProduct = getCheapestProduct(name);
    state[name] =
      DEFAULT_TO_CHEAPEST_PRODUCT_EQUIPMENT.includes(name) && cheapestProduct
        ? cheapestProduct.id
        : null;
    return state;
  }, {} as EquipmentSelectionState);
}

export function useEquipmentSelection(
  floorPlanSummary: FloorPlanSummary | null = null,
  mlPrediction?: Record<string, number> | null
) {
  const [selection, setSelection] = useState<EquipmentSelectionState>(
    createInitialSelectionState
  );

  // Quantities the user has typed in directly (or that were locked in when
  // they picked a product) — anything NOT in here just follows the current
  // floor-plan/ML-derived recommendation live, so it can't go stale the way
  // a one-time-computed useState would (floorPlanSummary/mlPrediction aren't
  // ready yet on the very first render, since they settle a moment after
  // mount from localStorage/an API call).
  const [manualQuantityOverrides, setManualQuantityOverrides] = useState<
    Partial<Record<EquipmentName, number>>
  >({});

  const quantities = useMemo<EquipmentQuantityState>(() => {
    return EQUIPMENT_LIST.reduce((state, name) => {
      const value = selection[name];
      if (value === null || value === NONE_PRODUCT_ID) {
        state[name] = 0;
      } else if (name in manualQuantityOverrides) {
        state[name] = manualQuantityOverrides[name]!;
      } else {
        state[name] = getFloorPlanInstalledCount(name, floorPlanSummary, mlPrediction);
      }
      return state;
    }, {} as EquipmentQuantityState);
  }, [selection, floorPlanSummary, mlPrediction, manualQuantityOverrides]);

  const selectProduct = useCallback(
    (equipment: EquipmentName, value: EquipmentSelectionValue) => {
      setSelection((prev) => ({ ...prev, [equipment]: value }));
      // Picking a (possibly different) product resets this equipment back to
      // "follow the recommended quantity" — any earlier manual edit no longer applies.
      setManualQuantityOverrides((prev) => {
        if (!(equipment in prev)) return prev;
        const next = { ...prev };
        delete next[equipment];
        return next;
      });
    },
    []
  );

  const setQuantity = useCallback((equipment: EquipmentName, quantity: number) => {
    setManualQuantityOverrides((prev) => ({ ...prev, [equipment]: quantity }));
  }, []);

  const summary = useMemo<EquipmentSelectionSummary>(() => {
    return EQUIPMENT_LIST.reduce((acc, name) => {
      const value = selection[name];
      const quantity = quantities[name];
      if (value === null) {
        acc[name] = {
          productId: null,
          productName: "선택 필요",
          productPrice: null,
          quantity: 0,
          lineTotal: null,
        };
      } else if (value === NONE_PRODUCT_ID) {
        acc[name] = {
          productId: null,
          productName: "설치 안 함",
          productPrice: null,
          quantity: 0,
          lineTotal: null,
        };
      } else {
        const product = EQUIPMENT_PRODUCTS[name].find((p) => p.id === value);
        const price = product?.price ?? null;
        acc[name] = {
          productId: value,
          productName: product?.name ?? "",
          productPrice: price,
          quantity,
          lineTotal: price != null ? price * quantity : null,
        };
      }
      return acc;
    }, {} as EquipmentSelectionSummary);
  }, [selection, quantities]);

  const equipmentCost = useMemo(
    () =>
      EQUIPMENT_LIST.reduce(
        (sum, name) => sum + (summary[name].lineTotal ?? 0),
        0
      ),
    [summary]
  );

  // 내화구조로 시공하는 경우에만 발생하는 건축 비용(용도별 ㎡당 단가 ×
  // 건물 전체 연면적) — see lib/facilityRules.ts. 연면적(㎡)에 소수점이 있어도
  // 금액은 원 단위 미만을 버림하여 정수 원으로 계산한다.
  const fireResistantConstructionCost = useMemo(() => {
    if (!floorPlanSummary?.isFireResistantStructure) return 0;
    const ratePerM2 = getFireResistantConstructionCostPerM2(floorPlanSummary.facilityType);
    return Math.floor(ratePerM2 * floorPlanSummary.totalAreaSqm);
  }, [floorPlanSummary]);

  const totalCost = useMemo(
    () => equipmentCost + fireResistantConstructionCost,
    [equipmentCost, fireResistantConstructionCost]
  );

  return {
    selection,
    quantities,
    selectProduct,
    setQuantity,
    summary,
    equipmentCost,
    fireResistantConstructionCost,
    totalCost,
  };
}
