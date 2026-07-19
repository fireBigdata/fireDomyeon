"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { EquipmentProduct, EquipmentSelectionState } from "@/types/equipmentSelection";
import { NONE_PRODUCT_ID } from "@/types/equipmentSelection";
import { EQUIPMENT_PRODUCTS } from "@/constants/equipmentProducts";
import {
  getEquipmentSelectionSnapshot,
  subscribeToEquipmentSelection,
} from "@/lib/equipmentSelectionStorage";

function getServerSnapshot(): string | null {
  return null;
}

/** Reads the 소화기 product picked on the equipment-selection page, for the
 * floor plan's extinguisher auto-placement to use (e.g. its abilityUnit).
 * Returns null if the equipment-selection page hasn't been visited yet, or
 * no 소화기/"설치 안 함" is currently selected there. */
export function useSelectedExtinguisherProduct(): EquipmentProduct | null {
  const raw = useSyncExternalStore(
    subscribeToEquipmentSelection,
    getEquipmentSelectionSnapshot,
    getServerSnapshot
  );

  return useMemo(() => {
    if (!raw) return null;
    let selection: EquipmentSelectionState;
    try {
      selection = JSON.parse(raw) as EquipmentSelectionState;
    } catch {
      return null;
    }
    const value = selection["소화기"];
    if (!value || value === NONE_PRODUCT_ID) return null;
    return EQUIPMENT_PRODUCTS.소화기.find((product) => product.id === value) ?? null;
  }, [raw]);
}
