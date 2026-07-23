import type { FloorPlanState } from "@/types/floorplan";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export function saveFloorPlan(
  floorPlan: FloorPlanState
): Promise<FloorPlanState> {
  return request<FloorPlanState>("/floorplans", {
    method: "POST",
    body: JSON.stringify(floorPlan),
  });
}

export function loadFloorPlan(id: string): Promise<FloorPlanState> {
  return request<FloorPlanState>(`/floorplans/${id}`);
}

export type EquipmentCountPredictionInput = {
  groundFloorCount: number;
  basementFloorCount: number;
  buildingAreaSqm: number;
  totalFloorAreaSqm: number;
  siteAreaSqm: number;
};

/** Reference-only estimate for equipment types this app has no drawing-based
 * placement logic for (예비펌프/주펌프/충압펌프/급기팬/배기팬/자동폐쇄장치/발신기).
 * See backend/app/ml/predictor.py for the underlying model's accuracy caveats. */
export function predictEquipmentCounts(
  input: EquipmentCountPredictionInput
): Promise<Record<string, number>> {
  return request<Record<string, number>>("/predict/equipment-counts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
