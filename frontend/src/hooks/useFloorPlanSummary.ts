"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { FacilityType, FloorPlanState } from "@/types/floorplan";
import type { ExitLight, ExitLightCategory } from "@/types/exitLight";
import type { HeatDetector } from "@/types/heatDetector";
import { HeatDetectorType } from "@/types/heatDetector";
import { EXIT_LIGHT_CATEGORY_ORDER } from "@/constants/exitLight";
import {
  getFloorPlanStateSnapshot,
  subscribeToFloorPlanState,
} from "@/lib/floorPlanStorage";
import { computeTotalStructurePixelArea } from "@/lib/structureArea";
import { pixelAreaToSquareMeters } from "@/lib/area";

export type ExitLightCategoryCounts = Record<ExitLightCategory, number>;
export type HeatDetectorTypeCounts = Record<HeatDetectorType, number>;

export type FloorEquipmentSummary = {
  floorId: string;
  floorName: string;
  extinguisherCount: number;
  heatDetectorCount: number;
  heatDetectorCountsByType: HeatDetectorTypeCounts;
  smokeDetectorCount: number;
  exitLightCountsByCategory: ExitLightCategoryCounts;
  sprinklerHeadCount: number;
  hydrantCount: number;
};

export type FloorPlanSummary = {
  facilityType: FacilityType;
  /** Whether the building is fire-resistant (내화구조) — see FloorPlanState.isFireResistantStructure. */
  isFireResistantStructure: boolean;
  floorCount: number;
  totalAreaSqm: number;
  totalExtinguisherCount: number;
  totalHeatDetectorCount: number;
  totalHeatDetectorCountsByType: HeatDetectorTypeCounts;
  totalSmokeDetectorCount: number;
  totalExitLightCountsByCategory: ExitLightCategoryCounts;
  totalSprinklerHeadCount: number;
  totalHydrantCount: number;
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

function countHeatDetectorsByType(
  heatDetectors: HeatDetector[] | undefined
): HeatDetectorTypeCounts {
  const counts = {
    [HeatDetectorType.DIFFERENTIAL]: 0,
    [HeatDetectorType.FIXED_TEMPERATURE]: 0,
  } as HeatDetectorTypeCounts;

  for (const detector of heatDetectors ?? []) {
    counts[detector.type] = (counts[detector.type] ?? 0) + 1;
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
    heatDetectorCountsByType: countHeatDetectorsByType(floor.heatDetectors),
    smokeDetectorCount: floor.smokeDetectors?.length ?? 0,
    exitLightCountsByCategory: countExitLightsByCategory(floor.exitLights),
    sprinklerHeadCount: floor.sprinklerHeads?.length ?? 0,
    hydrantCount: floor.hydrantPlacements?.length ?? 0,
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

  const totalHeatDetectorCountsByType = {
    [HeatDetectorType.DIFFERENTIAL]: byFloor.reduce(
      (sum, f) => sum + f.heatDetectorCountsByType[HeatDetectorType.DIFFERENTIAL],
      0
    ),
    [HeatDetectorType.FIXED_TEMPERATURE]: byFloor.reduce(
      (sum, f) => sum + f.heatDetectorCountsByType[HeatDetectorType.FIXED_TEMPERATURE],
      0
    ),
  } as HeatDetectorTypeCounts;

  return {
    facilityType: floorPlan.facilityType,
    isFireResistantStructure: floorPlan.isFireResistantStructure ?? false,
    floorCount: floorPlan.floors.length,
    totalAreaSqm,
    totalExtinguisherCount: byFloor.reduce((sum, f) => sum + f.extinguisherCount, 0),
    totalHeatDetectorCount: byFloor.reduce((sum, f) => sum + f.heatDetectorCount, 0),
    totalHeatDetectorCountsByType,
    totalSmokeDetectorCount: byFloor.reduce((sum, f) => sum + f.smokeDetectorCount, 0),
    totalExitLightCountsByCategory,
    totalSprinklerHeadCount: byFloor.reduce((sum, f) => sum + f.sprinklerHeadCount, 0),
    totalHydrantCount: byFloor.reduce((sum, f) => sum + f.hydrantCount, 0),
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
