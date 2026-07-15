"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { FloorPlanState } from "@/types/floorplan";
import type { ExitLight, ExitLightCategory } from "@/types/exitLight";
import { EXIT_LIGHT_CATEGORY_ORDER } from "@/constants/exitLight";
import {
  getFloorPlanStateSnapshot,
  subscribeToFloorPlanState,
} from "@/lib/floorPlanStorage";
import { computeTotalStructurePixelArea } from "@/lib/structureArea";
import { pixelAreaToSquareMeters } from "@/lib/area";

export type ExitLightCategoryCounts = Record<ExitLightCategory, number>;

export type FloorEquipmentSummary = {
  floorId: string;
  floorName: string;
  extinguisherCount: number;
  heatDetectorCount: number;
  exitLightCountsByCategory: ExitLightCategoryCounts;
};

export type FloorPlanSummary = {
  floorCount: number;
  totalAreaSqm: number;
  totalExtinguisherCount: number;
  totalHeatDetectorCount: number;
  totalExitLightCountsByCategory: ExitLightCategoryCounts;
  byFloor: FloorEquipmentSummary[];
};

function countExitLightsByCategory(
  exitLights: ExitLight[] | undefined
): ExitLightCategoryCounts {
  const counts = EXIT_LIGHT_CATEGORY_ORDER.reduce((acc, category) => {
    acc[category] = 0;
    return acc;
  }, {} as ExitLightCategoryCounts);

  for (const light of exitLights ?? []) {
    counts[light.category] = (counts[light.category] ?? 0) + 1;
  }
  return counts;
}

function summarize(floorPlan: FloorPlanState): FloorPlanSummary {
  const scale = floorPlan.scale ?? 1;

  const byFloor = floorPlan.floors.map((floor) => ({
    floorId: floor.id,
    floorName: floor.name,
    // Counts are already computed by the auto-place hooks on the drawing
    // page and stored as placement arrays — just tally them, don't re-run
    // the placement algorithms here.
    extinguisherCount: floor.extinguisherPlacements?.length ?? 0,
    heatDetectorCount: floor.heatDetectors?.length ?? 0,
    exitLightCountsByCategory: countExitLightsByCategory(floor.exitLights),
  }));

  const totalAreaSqm = floorPlan.floors.reduce(
    (sum, floor) =>
      sum +
      pixelAreaToSquareMeters(
        computeTotalStructurePixelArea(floor.structures ?? []),
        scale
      ),
    0
  );

  const totalExitLightCountsByCategory = EXIT_LIGHT_CATEGORY_ORDER.reduce(
    (acc, category) => {
      acc[category] = byFloor.reduce(
        (sum, f) => sum + f.exitLightCountsByCategory[category],
        0
      );
      return acc;
    },
    {} as ExitLightCategoryCounts
  );

  return {
    floorCount: floorPlan.floors.length,
    totalAreaSqm,
    totalExtinguisherCount: byFloor.reduce((sum, f) => sum + f.extinguisherCount, 0),
    totalHeatDetectorCount: byFloor.reduce((sum, f) => sum + f.heatDetectorCount, 0),
    totalExitLightCountsByCategory,
    byFloor,
  };
}

function getServerSnapshot(): string | null {
  return null;
}

/** Reads the floor plan last saved from the drawing page. Returns null if none exists yet. */
export function useFloorPlanSummary(): FloorPlanSummary | null {
  const raw = useSyncExternalStore(
    subscribeToFloorPlanState,
    getFloorPlanStateSnapshot,
    getServerSnapshot
  );

  return useMemo(() => {
    if (!raw) return null;
    let floorPlan: FloorPlanState;
    try {
      floorPlan = JSON.parse(raw) as FloorPlanState;
    } catch {
      return null;
    }
    if (!Array.isArray(floorPlan?.floors) || floorPlan.floors.length === 0) {
      return null;
    }
    return summarize(floorPlan);
  }, [raw]);
}
