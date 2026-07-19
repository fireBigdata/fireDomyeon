import type { EquipmentSelectionState } from "@/types/equipmentSelection";

// Lets the floor plan drawing page read which product was picked on the
// equipment-selection page (e.g. for the selected 소화기's abilityUnit) — the
// two routes don't share any React state/Context today.
const STORAGE_KEY = "equipmentSelectionState";

export function saveEquipmentSelectionToStorage(selection: EquipmentSelectionState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
  } catch {
    // Ignore storage errors (quota exceeded, privacy mode, etc.).
  }
}

/** Raw JSON snapshot, for use with useSyncExternalStore. */
export function getEquipmentSelectionSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function subscribeToEquipmentSelection(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}
