import { RoomType } from "@/types/floorplan";
import type { FacilityType, Floor, Structure } from "@/types/floorplan";
import type { ExtinguisherPlacement } from "@/types/extinguisher";
import type { Point } from "@/lib/heatDetectorPlacement";
import { createId } from "@/lib/id";
import { metersToPixelLength, pixelAreaToSquareMeters, pixelLengthToMeters } from "@/lib/area";
import { computeLeafBoxes, type Box } from "@/lib/partitionTree";
import { computeTotalStructurePixelArea } from "@/lib/structureArea";
import { getObstaclesNear } from "@/lib/obstacleAvoidance";
import { distance, placePointsInStructure, resolveOverlaps } from "@/lib/wallHuggingPlacement";
import { getExtinguisherAreaPerUnit, type ExtinguisherAreaPerUnit } from "@/lib/facilityRules";
import { STRUCTURE_DEFAULTS } from "@/constants/structureDefaults";
import { DEFAULT_ROOM_TYPE, ROOM_TYPE_DEFAULTS } from "@/constants/roomTypes";

const DEFAULT_AREA_PER_UNIT: ExtinguisherAreaPerUnit = { normal: 100, fireResistant: 200 };
const CORRIDOR_LENGTH_PER_EXTINGUISHER_METERS = 20;
export const DEFAULT_MAX_TRAVEL_DISTANCE_METERS = 20;

// Grid resolution used when sampling the floor plan for 20m coverage gaps.
const SAMPLE_INTERVAL_METERS = 2;

const MAX_DISTANCE_REINFORCEMENT_ITERATIONS = 12;

const PLACEABLE_STRUCTURE_TYPES = new Set(["room", "corridor"]);

export type StructureExtinguisherSummary = {
  structureId: string;
  label: string;
  count: number;
};

// ---------------------------------------------------------------------------
// Area / ability-unit calculations
// ---------------------------------------------------------------------------

/** Sum of the effective floor area of every structure on the floor, in m² (doors excluded). */
export function calculateTotalFloorArea(structures: Structure[], scale: number): number {
  return pixelAreaToSquareMeters(computeTotalStructurePixelArea(structures), scale);
}

/**
 * NFTC 101 별표2: 용도별 능력단위 기준면적(기본값은 근린생활시설 등 100㎡ 그룹).
 * 내화구조이고 벽/반자가 불연재료·준불연재료·난연재료인 경우 기준면적을 2배로
 * 적용한다, 감지기 1개당 담당 면적이 넓어지는 것과 같은 이유. 용도별 실제 값은
 * lib/facilityRules.ts의 EXTINGUISHER_AREA_PER_UNIT_M2 참고.
 */
export function calculateRequiredAbilityUnits(
  totalFloorArea: number,
  isFireResistantStructure?: boolean,
  areaPerUnitM2: ExtinguisherAreaPerUnit = DEFAULT_AREA_PER_UNIT
): number {
  if (totalFloorArea <= 0) return 0;
  const areaPerUnit = isFireResistantStructure ? areaPerUnitM2.fireResistant : areaPerUnitM2.normal;
  return Math.ceil(totalFloorArea / areaPerUnit);
}

export function validateAbilityUnitsPerExtinguisher(value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("소화기 1개당 능력단위는 0보다 큰 숫자여야 합니다.");
  }
}

export function calculateExtinguisherCountByAbility(
  requiredAbilityUnits: number,
  abilityUnitsPerExtinguisher: number
): number {
  validateAbilityUnitsPerExtinguisher(abilityUnitsPerExtinguisher);
  if (requiredAbilityUnits <= 0) return 0;
  return Math.ceil(requiredAbilityUnits / abilityUnitsPerExtinguisher);
}

// ---------------------------------------------------------------------------
// Apartment (room/corridor count based) calculation
// ---------------------------------------------------------------------------

/**
 * Length of a corridor structure, in pixels.
 * TODO: prefer a corridor centerline/path length once that data exists on
 * Structure; this falls back to the longer side of its bounding box.
 */
export function calculateCorridorLength(structure: Structure): number {
  return Math.max(structure.width, structure.height);
}

export function calculateCorridorExtinguisherCount(corridorLengthMeters: number): number {
  if (corridorLengthMeters <= 0) return 0;
  return Math.ceil(corridorLengthMeters / CORRIDOR_LENGTH_PER_EXTINGUISHER_METERS);
}

export type ApartmentExtinguisherBreakdown = {
  livingRoomCount: number;
  corridorCount: number;
  total: number;
  byStructure: StructureExtinguisherSummary[];
};

/** 거실 1개당 1개 + 복도는 길이 20m당 1개(올림). 다른 용도의 방은 집계하지 않는다. */
export function calculateApartmentExtinguisherBreakdown(
  structures: Structure[],
  scale: number
): ApartmentExtinguisherBreakdown {
  const byStructure: StructureExtinguisherSummary[] = [];
  let livingRoomCount = 0;
  let corridorCount = 0;

  for (const structure of structures) {
    if (structure.type === "room" && structure.roomType === RoomType.LIVING) {
      livingRoomCount += 1;
      byStructure.push({
        structureId: structure.id,
        label: ROOM_TYPE_DEFAULTS[RoomType.LIVING].label,
        count: 1,
      });
      continue;
    }

    if (structure.type === "corridor") {
      const lengthMeters = pixelLengthToMeters(calculateCorridorLength(structure), scale);
      const count = calculateCorridorExtinguisherCount(lengthMeters);
      if (count > 0) {
        corridorCount += count;
        byStructure.push({
          structureId: structure.id,
          label: STRUCTURE_DEFAULTS.corridor.label,
          count,
        });
      }
    }
  }

  return {
    livingRoomCount,
    corridorCount,
    total: livingRoomCount + corridorCount,
    byStructure,
  };
}

export function calculateApartmentExtinguisherCount(
  structures: Structure[],
  scale: number
): number {
  return calculateApartmentExtinguisherBreakdown(structures, scale).total;
}

// ---------------------------------------------------------------------------
// Wall-hugging placement geometry (shared by both building types)
// ---------------------------------------------------------------------------

function getPlaceableStructures(structures: Structure[]): Structure[] {
  return structures.filter((structure) => PLACEABLE_STRUCTURE_TYPES.has(structure.type));
}

function toPlacements(
  items: { point: Point; structureId: string }[],
  extinguisherTypeId: string
): ExtinguisherPlacement[] {
  return items.map(({ point, structureId }) => ({
    id: createId("extinguisher"),
    x: point.x,
    y: point.y,
    extinguisherTypeId,
    structureId,
    isAutoPlaced: true,
  }));
}

// ---------------------------------------------------------------------------
// Distribution across spaces (아파트 외: spread `count` across every room/corridor)
// ---------------------------------------------------------------------------

/** Splits `count` extinguishers across `spaces`, spreading them by area instead of clustering into one room. */
function distributeCountAcrossStructures(count: number, spaces: Structure[]): Map<string, number> {
  const result = new Map<string, number>();
  if (spaces.length === 0 || count <= 0) return result;

  if (count <= spaces.length) {
    const byAreaDesc = [...spaces].sort((a, b) => b.width * b.height - a.width * a.height);
    for (let i = 0; i < count; i += 1) {
      result.set(byAreaDesc[i].id, 1);
    }
    return result;
  }

  spaces.forEach((s) => result.set(s.id, 1));
  const remaining = count - spaces.length;
  const areas = spaces.map((s) => s.width * s.height);
  const totalArea = areas.reduce((a, b) => a + b, 0) || 1;
  const raw = areas.map((area) => (area / totalArea) * remaining);
  const base = raw.map((v) => Math.floor(v));
  let allocated = base.reduce((a, b) => a + b, 0);
  const remainders = raw
    .map((v, i) => ({ i, fraction: v - base[i] }))
    .sort((a, b) => b.fraction - a.fraction);
  let cursor = 0;
  while (allocated < remaining && cursor < remainders.length) {
    base[remainders[cursor].i] += 1;
    allocated += 1;
    cursor += 1;
  }
  spaces.forEach((s, i) => {
    result.set(s.id, (result.get(s.id) ?? 0) + base[i]);
  });
  return result;
}

export function placeExtinguishersNearWalls(
  floor: Floor,
  count: number,
  extinguisherTypeId: string
): ExtinguisherPlacement[] {
  const spaces = getPlaceableStructures(floor.structures);
  if (spaces.length === 0 || count <= 0) return [];

  const entrances = floor.structures.filter((s) => s.type === "entrance");
  const countByStructure = distributeCountAcrossStructures(count, spaces);

  const raw: { point: Point; structureId: string }[] = [];
  for (const space of spaces) {
    const n = countByStructure.get(space.id) ?? 0;
    const obstacles = getObstaclesNear(space, floor.structures);
    for (const point of placePointsInStructure(space, n, entrances, undefined, obstacles)) {
      raw.push({ point, structureId: space.id });
    }
  }

  return toPlacements(resolveOverlaps(raw), extinguisherTypeId);
}

export function placeApartmentExtinguishers(
  floor: Floor,
  breakdown: ApartmentExtinguisherBreakdown,
  extinguisherTypeId: string
): ExtinguisherPlacement[] {
  const byId = new Map(floor.structures.map((s) => [s.id, s]));
  const entrances = floor.structures.filter((s) => s.type === "entrance");

  const raw: { point: Point; structureId: string }[] = [];
  for (const item of breakdown.byStructure) {
    const structure = byId.get(item.structureId);
    if (!structure || item.count <= 0) continue;
    const obstacles = getObstaclesNear(structure, floor.structures);
    for (const point of placePointsInStructure(structure, item.count, entrances, undefined, obstacles)) {
      raw.push({ point, structureId: structure.id });
    }
  }

  return toPlacements(resolveOverlaps(raw), extinguisherTypeId);
}

// ---------------------------------------------------------------------------
// 20m maximum-travel-distance coverage check (아파트 외 only)
// ---------------------------------------------------------------------------

/**
 * Distance a person at `start` would have to travel to reach `extinguisher`.
 *
 * TODO: 현재는 직선거리(유클리드 거리) 기준입니다. 벽/통로 등 실제 이동 경로
 * 데이터가 준비되면 `floor`를 이용해 실제 이동 경로 기준 거리로 교체해야 합니다.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for future real travel-path routing; see TODO above.
export function calculateTravelDistance(start: Point, extinguisher: Point, floor: Floor): number {
  return Math.sqrt(Math.pow(start.x - extinguisher.x, 2) + Math.pow(start.y - extinguisher.y, 2));
}

function sampleGrid(box: Box, intervalPx: number): Point[] {
  if (box.width <= 0 || box.height <= 0) return [];
  if (intervalPx <= 0) {
    return [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }];
  }

  const cols = Math.max(1, Math.round(box.width / intervalPx));
  const rows = Math.max(1, Math.round(box.height / intervalPx));
  const points: Point[] = [];
  for (let r = 0; r <= rows; r += 1) {
    const y = box.y + (box.height * r) / rows;
    for (let c = 0; c <= cols; c += 1) {
      const x = box.x + (box.width * c) / cols;
      points.push({ x, y });
    }
  }
  return points;
}

function samplePointsInStructure(structure: Structure, intervalPx: number): Point[] {
  const roomBox: Box = { x: 0, y: 0, width: structure.width, height: structure.height };
  const regions = structure.partitions
    ? computeLeafBoxes(structure.partitions, roomBox)
        .filter((leaf) => leaf.kind !== "empty")
        .map((leaf) => leaf.box)
    : [roomBox];

  const points: Point[] = [];
  for (const region of regions) {
    for (const local of sampleGrid(region, intervalPx)) {
      points.push({ x: structure.x + local.x, y: structure.y + local.y });
    }
  }
  return points;
}

/** Every sampled point across the floor whose nearest extinguisher is farther than `maximumDistanceMeters`. */
export function findAreasBeyondMaximumDistance(
  floor: Floor,
  extinguishers: ExtinguisherPlacement[],
  maximumDistanceMeters: number,
  scale: number
): Point[] {
  const spaces = getPlaceableStructures(floor.structures);
  if (spaces.length === 0) return [];

  const maxDistancePx = metersToPixelLength(maximumDistanceMeters, scale);
  const sampleIntervalPx = metersToPixelLength(SAMPLE_INTERVAL_METERS, scale);

  const gaps: Point[] = [];
  for (const space of spaces) {
    for (const point of samplePointsInStructure(space, sampleIntervalPx)) {
      const nearestDistance =
        extinguishers.length === 0
          ? Infinity
          : Math.min(...extinguishers.map((e) => calculateTravelDistance(point, e, floor)));
      if (nearestDistance > maxDistancePx) {
        gaps.push(point);
      }
    }
  }
  return gaps;
}

function findContainingOrNearestSpace(point: Point, spaces: Structure[]): Structure | null {
  const containing = spaces.find(
    (s) => point.x >= s.x && point.x <= s.x + s.width && point.y >= s.y && point.y <= s.y + s.height
  );
  if (containing) return containing;

  let nearest: Structure | null = null;
  let nearestDist = Infinity;
  for (const s of spaces) {
    const d = distance(point, { x: s.x + s.width / 2, y: s.y + s.height / 2 });
    if (d < nearestDist) {
      nearestDist = d;
      nearest = s;
    }
  }
  return nearest;
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

function summarizeByStructure(
  placements: ExtinguisherPlacement[],
  structures: Structure[]
): StructureExtinguisherSummary[] {
  const labelById = new Map(
    structures.map((s) => [
      s.id,
      s.type === "room" ? ROOM_TYPE_DEFAULTS[s.roomType ?? DEFAULT_ROOM_TYPE].label : STRUCTURE_DEFAULTS[s.type].label,
    ])
  );
  const counts = new Map<string, number>();
  for (const p of placements) {
    counts.set(p.structureId, (counts.get(p.structureId) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([structureId, count]) => ({
      structureId,
      label: labelById.get(structureId) ?? structureId,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

export type NonApartmentPlacementResult = {
  totalFloorArea: number;
  abilityUnitsPerExtinguisher: number;
  requiredAbilityUnits: number;
  minimumCountByArea: number;
  addedByDistanceRule: number;
  finalCount: number;
  placements: ExtinguisherPlacement[];
  byStructure: StructureExtinguisherSummary[];
};

/**
 * 1) 면적/능력단위 기준 최소 개수 계산 → 2) 벽 쪽에 균등 배치 →
 * 3) 도면을 일정 간격으로 샘플링 → 4) 20m 초과 지점 확인 →
 * 5) 초과 지점 인근 벽에 소화기 추가 → 6) 모두 만족할 때까지 반복.
 *
 * `facilityType`은 apartment/villa를 제외한 용도(단독주택/상가/병원/학교/
 * 지하철역/공장/창고)만 받는다 — 공동주택은 planApartmentExtinguisherPlacement
 * (세대별 거실/복도 개수 기준)를 대신 쓴다. 기본값 "house"는 기존 호출부와의
 * 하위 호환을 위한 것으로, 100㎡(내화 200㎡) 기준과 동일하다.
 */
export function planNonApartmentExtinguisherPlacement(
  floor: Floor,
  scale: number,
  abilityUnitsPerExtinguisher: number,
  extinguisherTypeId: string,
  isFireResistantStructure?: boolean,
  facilityType: Exclude<FacilityType, "apartment" | "villa"> = "house",
  maximumDistanceMeters: number = DEFAULT_MAX_TRAVEL_DISTANCE_METERS
): NonApartmentPlacementResult {
  validateAbilityUnitsPerExtinguisher(abilityUnitsPerExtinguisher);

  const totalFloorArea = calculateTotalFloorArea(floor.structures, scale);
  const requiredAbilityUnits = calculateRequiredAbilityUnits(
    totalFloorArea,
    isFireResistantStructure,
    getExtinguisherAreaPerUnit(facilityType)
  );
  const minimumCountByArea = calculateExtinguisherCountByAbility(
    requiredAbilityUnits,
    abilityUnitsPerExtinguisher
  );

  let placements = placeExtinguishersNearWalls(floor, minimumCountByArea, extinguisherTypeId);

  const spaces = getPlaceableStructures(floor.structures);
  const entrances = floor.structures.filter((s) => s.type === "entrance");

  for (let iteration = 0; spaces.length > 0 && iteration < MAX_DISTANCE_REINFORCEMENT_ITERATIONS; iteration += 1) {
    const gaps = findAreasBeyondMaximumDistance(floor, placements, maximumDistanceMeters, scale);
    if (gaps.length === 0) break;

    const gapPoint = gaps[0];
    const targetSpace = findContainingOrNearestSpace(gapPoint, spaces);
    if (!targetSpace) break;

    const obstaclesNearTarget = getObstaclesNear(targetSpace, floor.structures);
    const [extraPointRaw] = placePointsInStructure(targetSpace, 1, entrances, gapPoint, obstaclesNearTarget);
    const existingPoints = placements.map((p) => ({ point: { x: p.x, y: p.y } }));
    const resolved = resolveOverlaps([...existingPoints, { point: extraPointRaw }]);
    const resolvedExtra = resolved[resolved.length - 1].point;

    placements = [
      ...placements,
      {
        id: createId("extinguisher"),
        x: resolvedExtra.x,
        y: resolvedExtra.y,
        extinguisherTypeId,
        structureId: targetSpace.id,
        isAutoPlaced: true,
      },
    ];
  }

  return {
    totalFloorArea,
    abilityUnitsPerExtinguisher,
    requiredAbilityUnits,
    minimumCountByArea,
    addedByDistanceRule: Math.max(0, placements.length - minimumCountByArea),
    finalCount: placements.length,
    placements,
    byStructure: summarizeByStructure(placements, floor.structures),
  };
}

export type ApartmentPlacementResult = {
  livingRoomCount: number;
  corridorCount: number;
  finalCount: number;
  placements: ExtinguisherPlacement[];
  byStructure: StructureExtinguisherSummary[];
};

export function planApartmentExtinguisherPlacement(
  floor: Floor,
  scale: number,
  extinguisherTypeId: string
): ApartmentPlacementResult {
  const breakdown = calculateApartmentExtinguisherBreakdown(floor.structures, scale);
  const placements = placeApartmentExtinguishers(floor, breakdown, extinguisherTypeId);

  return {
    livingRoomCount: breakdown.livingRoomCount,
    corridorCount: breakdown.corridorCount,
    finalCount: placements.length,
    placements,
    byStructure: breakdown.byStructure,
  };
}
