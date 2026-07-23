import type { Floor, FacilityType, Structure } from "@/types/floorplan";
import type { HydrantPlacement } from "@/types/hydrant";
import type { Point } from "@/lib/heatDetectorPlacement";
import { createId } from "@/lib/id";
import { pixelLengthToMeters } from "@/lib/area";
import { getObstaclesNear } from "@/lib/obstacleAvoidance";
import { placePointsInStructure, resolveOverlaps } from "@/lib/wallHuggingPlacement";
import { STRUCTURE_DEFAULTS } from "@/constants/structureDefaults";
import { getHydrantApplicability } from "@/lib/hydrantRules";

// NFTC 102 2.2.1: 소방대상물의 각 부분으로부터 하나의 호스접결구까지의 수평거리
// 25m 이하가 되도록 설치. 복도(통로) 벽면에 설치함을 원칙으로 한다.
//
// IMPORTANT: 최신 NFPC 102/NFTC 102 고시 원문과 대조해 확인하세요 — 기준은
// 개정될 수 있고 이 모듈은 그 원문을 실시간으로 조회하지 않습니다.
export const HYDRANT_HORIZONTAL_DISTANCE_METERS = 25;
// Two hydrants must be no farther apart than this along a corridor for every
// point between them to stay within the 25m horizontal-distance requirement.
const MAX_HYDRANT_SPACING_METERS = HYDRANT_HORIZONTAL_DISTANCE_METERS * 2;

const NO_CORRIDOR_REASON =
  "옥내소화전은 복도(통로) 벽면을 기준으로 배치됩니다. 이 층에 복도 구조물이 없어 배치 기준을 판단할 수 없으므로 배치하지 않았습니다. 복도를 추가한 뒤 다시 시도하세요.";

export type StructureHydrantSummary = {
  structureId: string;
  label: string;
  count: number;
};

export type HydrantPlacementResult = {
  applicable: boolean;
  notApplicableReason: string | null;
  placements: HydrantPlacement[];
  byStructure: StructureHydrantSummary[];
  warnings: string[];
  totalBuildingFloorAreaM2: number;
  floorCount: number;
};

/**
 * Length of a corridor structure, in pixels.
 * TODO: prefer a corridor centerline/path length once that data exists on
 * Structure; this falls back to the longer side of its bounding box (mirrors
 * extinguisherPlacement.ts's calculateCorridorLength).
 */
function calculateCorridorLength(structure: Structure): number {
  return Math.max(structure.width, structure.height);
}

/** Minimum hydrant count so no point along the corridor is farther than 25m from the nearest one. */
export function calculateCorridorHydrantCount(corridorLengthMeters: number): number {
  if (corridorLengthMeters <= 0) return 0;
  return Math.ceil(corridorLengthMeters / MAX_HYDRANT_SPACING_METERS);
}

/**
 * Auto-places indoor fire hydrants (옥내소화전) along corridor walls on
 * `currentFloor`, gated by a whole-building (every floor in `floors`)
 * installation-applicability check (lib/hydrantRules.ts). A building below
 * the area/floor-count threshold, a house, or a floor with no corridor to
 * place along is left unplaced rather than guessed at — this never forces
 * a placement the app can't actually justify.
 */
export function autoPlaceIndoorHydrants(
  floors: Floor[],
  currentFloor: Floor,
  facilityType: FacilityType,
  hydrantTypeId: string,
  scale: number
): HydrantPlacementResult {
  const applicability = getHydrantApplicability(floors, facilityType, scale);
  const buildingScale = {
    totalBuildingFloorAreaM2: applicability.totalBuildingFloorAreaM2,
    floorCount: applicability.floorCount,
  };

  if (!applicability.applicable) {
    return {
      ...buildingScale,
      applicable: false,
      notApplicableReason: applicability.notApplicableReason,
      placements: [],
      byStructure: [],
      warnings: [],
    };
  }

  const corridors = currentFloor.structures.filter((s) => s.type === "corridor");
  if (corridors.length === 0) {
    return {
      ...buildingScale,
      applicable: false,
      notApplicableReason: NO_CORRIDOR_REASON,
      placements: [],
      byStructure: [],
      warnings: applicability.warnings,
    };
  }

  const entrances = currentFloor.structures.filter((s) => s.type === "entrance");
  const raw: { point: Point; structureId: string }[] = [];
  const byStructure: StructureHydrantSummary[] = [];

  for (const corridor of corridors) {
    const lengthMeters = pixelLengthToMeters(calculateCorridorLength(corridor), scale);
    const count = calculateCorridorHydrantCount(lengthMeters);
    if (count <= 0) continue;

    const obstacles = getObstaclesNear(corridor, currentFloor.structures);
    for (const point of placePointsInStructure(corridor, count, entrances, undefined, obstacles)) {
      raw.push({ point, structureId: corridor.id });
    }
    byStructure.push({
      structureId: corridor.id,
      label: STRUCTURE_DEFAULTS.corridor.label,
      count,
    });
  }

  const placements: HydrantPlacement[] = resolveOverlaps(raw).map(({ point, structureId }) => ({
    id: createId("hydrant"),
    floorId: currentFloor.id,
    x: point.x,
    y: point.y,
    hydrantTypeId,
    structureId,
    isAutoPlaced: true,
  }));

  return {
    ...buildingScale,
    applicable: true,
    notApplicableReason: null,
    placements,
    byStructure,
    warnings: applicability.warnings,
  };
}
