"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DEFAULT_TO_FIRST_PRODUCT_EQUIPMENT,
  EQUIPMENT_LIST,
  EQUIPMENT_PRODUCTS,
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
    const firstProduct = EQUIPMENT_PRODUCTS[name][0];
    state[name] =
      DEFAULT_TO_FIRST_PRODUCT_EQUIPMENT.includes(name) && firstProduct
        ? firstProduct.id
        : null;
    return state;
  }, {} as EquipmentSelectionState);
}

function createInitialQuantityState(
  selection: EquipmentSelectionState,
  floorPlanSummary: FloorPlanSummary | null,
  mlPrediction?: Record<string, number> | null
): EquipmentQuantityState {
  return EQUIPMENT_LIST.reduce((state, name) => {
    state[name] = selection[name]
      ? getFloorPlanInstalledCount(name, floorPlanSummary, mlPrediction)
      : 0;
    return state;
  }, {} as EquipmentQuantityState);
}

export function useEquipmentSelection(
  floorPlanSummary: FloorPlanSummary | null = null,
  mlPrediction?: Record<string, number> | null
) {
  const [selection, setSelection] = useState<EquipmentSelectionState>(
    createInitialSelectionState
  );
  const [quantities, setQuantities] = useState<EquipmentQuantityState>(() =>
    createInitialQuantityState(selection, floorPlanSummary, mlPrediction)
  );

  const selectProduct = useCallback(
    (equipment: EquipmentName, value: EquipmentSelectionValue) => {
      setSelection((prev) => ({ ...prev, [equipment]: value }));
      setQuantities((prev) => ({
        ...prev,
        [equipment]:
          value === null || value === NONE_PRODUCT_ID
            ? 0
            : getFloorPlanInstalledCount(equipment, floorPlanSummary, mlPrediction),
      }));
    },
    [floorPlanSummary, mlPrediction]
  );

  const setQuantity = useCallback(
    (equipment: EquipmentName, quantity: number) => {
      setQuantities((prev) => ({ ...prev, [equipment]: quantity }));
    },
    []
  );

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
