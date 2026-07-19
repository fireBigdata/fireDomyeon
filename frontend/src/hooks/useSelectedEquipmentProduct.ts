"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { EquipmentName, EquipmentProduct, EquipmentSelectionState } from "@/types/equipmentSelection";
import { NONE_PRODUCT_ID } from "@/types/equipmentSelection";
import { EQUIPMENT_PRODUCTS } from "@/constants/equipmentProducts";
import {
  getEquipmentSelectionSnapshot,
  subscribeToEquipmentSelection,
} from "@/lib/equipmentSelectionStorage";

function getServerSnapshot(): string | null {
  return null;
}

/** Reads the product selected for `name` on the equipment-selection page, for
 * the floor plan's auto-placement features to use (e.g. its abilityUnit).
 * Returns null if the equipment-selection page hasn't been visited yet, or
 * no product/"설치 안 함" is currently selected for that equipment there. */
export function useSelectedEquipmentProduct(name: EquipmentName): EquipmentProduct | null {
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
    const value = selection[name];
    if (!value || value === NONE_PRODUCT_ID) return null;
    return EQUIPMENT_PRODUCTS[name].find((product) => product.id === value) ?? null;
  }, [raw, name]);
}
