"use client";

import { useMutation } from "@tanstack/react-query";
import { saveFloorPlan } from "@/lib/api";
import type { FloorPlanState } from "@/types/floorplan";

export function useSaveFloorPlan() {
  return useMutation({
    mutationFn: (floorPlan: FloorPlanState) => saveFloorPlan(floorPlan),
  });
}
