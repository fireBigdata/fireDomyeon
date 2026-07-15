"use client";

import { useCallback, useMemo, useState } from "react";
import {
  EQUIPMENT_LIST,
  EQUIPMENT_PRODUCTS,
} from "@/constants/equipmentProducts";
import type {
  EquipmentName,
  EquipmentSelectionState,
  EquipmentSelectionSummary,
  EquipmentSelectionValue,
} from "@/types/equipmentSelection";
import { NONE_PRODUCT_ID } from "@/types/equipmentSelection";

function createInitialSelectionState(): EquipmentSelectionState {
  return EQUIPMENT_LIST.reduce((state, name) => {
    state[name] = null;
    return state;
  }, {} as EquipmentSelectionState);
}

export function useEquipmentSelection() {
  const [selection, setSelection] = useState<EquipmentSelectionState>(
    createInitialSelectionState
  );

  const selectProduct = useCallback(
    (equipment: EquipmentName, value: EquipmentSelectionValue) => {
      setSelection((prev) => ({ ...prev, [equipment]: value }));
    },
    []
  );

  const isComplete = useMemo(
    () => EQUIPMENT_LIST.every((name) => selection[name] !== null),
    [selection]
  );

  const summary = useMemo<EquipmentSelectionSummary>(() => {
    return EQUIPMENT_LIST.reduce((acc, name) => {
      const value = selection[name];
      if (value === null) {
        acc[name] = { productId: null, productName: "선택 필요" };
      } else if (value === NONE_PRODUCT_ID) {
        acc[name] = { productId: null, productName: "설치 안 함" };
      } else {
        const product = EQUIPMENT_PRODUCTS[name].find((p) => p.id === value);
        acc[name] = { productId: value, productName: product?.name ?? "" };
      }
      return acc;
    }, {} as EquipmentSelectionSummary);
  }, [selection]);

  return { selection, selectProduct, isComplete, summary };
}
