import type { FloorPlanState } from "@/types/floorplan";

// Lets the equipment-selection page read the floor plan drawn on the main
// canvas page — the two routes don't share any React state/Context today.
const STORAGE_KEY = "floorPlanState";

export function saveFloorPlanStateToStorage(state: FloorPlanState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors (quota exceeded, privacy mode, etc.).
  }
}

/** Raw JSON snapshot, for use with useSyncExternalStore. */
export function getFloorPlanStateSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function subscribeToFloorPlanState(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}
