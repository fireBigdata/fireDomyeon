"use client";

import { useCallback, useMemo, useState } from "react";
import {
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

function createInitialSelectionState(): EquipmentSelectionState {
  return EQUIPMENT_LIST.reduce((state, name) => {
    state[name] = null;
    return state;
  }, {} as EquipmentSelectionState);
}

function createInitialQuantityState(): EquipmentQuantityState {
  return EQUIPMENT_LIST.reduce((state, name) => {
    state[name] = 0;
    return state;
  }, {} as EquipmentQuantityState);
}

export function useEquipmentSelection() {
  const [selection, setSelection] = useState<EquipmentSelectionState>(
    createInitialSelectionState
  );
  const [quantities, setQuantities] = useState<EquipmentQuantityState>(
    createInitialQuantityState
  );

  const selectProduct = useCallback(
    (equipment: EquipmentName, value: EquipmentSelectionValue) => {
      setSelection((prev) => ({ ...prev, [equipment]: value }));
      setQuantities((prev) => ({
        ...prev,
        [equipment]: value === null || value === NONE_PRODUCT_ID ? 0 : 1,
      }));
    },
    []
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

  const totalCost = useMemo(
    () =>
      EQUIPMENT_LIST.reduce(
        (sum, name) => sum + (summary[name].lineTotal ?? 0),
        0
      ),
    [summary]
  );

  return {
    selection,
    quantities,
    selectProduct,
    setQuantity,
    summary,
    totalCost,
  };
}
