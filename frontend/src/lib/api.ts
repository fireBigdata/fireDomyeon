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
