import { RoomType } from "@/types/floorplan";
import type { FacilityType, Floor, Structure } from "@/types/floorplan";
import type { HeatDetector } from "@/types/heatDetector";
import { HeatDetectorType } from "@/types/heatDetector";
import { createId } from "@/lib/id";
import { pixelAreaToSquareMeters } from "@/lib/area";
import { computeEffectivePixelArea, computeLeafBoxes, type Box } from "@/lib/partitionTree";
import { getHeatDetectorTypeForRoom } from "@/constants/heatDetectorTypes";
import { getObstaclesNear, moveOffObstacles } from "@/lib/obstacleAvoidance";
import { isResidentialUnitFacility } from "@/lib/facilityRules";

// NFTC 608(공동주택의 화재안전기술기준) 2.7.1.3: 공동주택 세대 내 거실
// (취침용도 방 및 거실)에는 열감지기가 아니라 연기감지기를 설치해야 한다 —
// smokeDetectorPlacement.ts가 이 두 방 유형을 대신 담당하므로 apartment/villa
// 에서는 여기서 건너뛴다.
const APARTMENT_SMOKE_DETECTOR_ROOM_TYPES: ReadonlySet<RoomType> = new Set([
  RoomType.BEDROOM,
  RoomType.LIVING,
]);

export type CoverageAreaByDetectorType = Record<HeatDetectorType, number>;

export type Point = { x: number; y: number };
export type Grid = { rows: number; columns: number };

// How far detectors are kept from the room/region boundary, as a share of
// that region's own width/height (clamped per-region so tiny rooms still work).
const PADDING_RATIO = 0.15;

export function validateCoverageArea(value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("보호면적은 0보다 큰 숫자여야 합니다.");
  }
}

/** Rooms always get at least one detector, more once area exceeds the coverage area. */
export function calculateRequiredDetectorCount(
  roomArea: number,
  coverageArea: number
): number {
  validateCoverageArea(coverageArea);
  return Math.max(1, Math.ceil(roomArea / coverageArea));
}

function computePadding(size: number): number {
  const padding = size * PADDING_RATIO;
  const maxPadding = Math.max(size / 2 - 1, 0);
  return Math.min(padding, maxPadding);
}

/**
 * Picks the row/column layout that fits `count` points with the least
 * wasted grid cells, using the room's aspect ratio as a tiebreaker so a wide
 * room prefers wide grids (and a tall room prefers tall ones).
 */
export function calculateGrid(
  count: number,
  width: number,
  height: number
): Grid {
  if (count <= 1) return { rows: 1, columns: 1 };

  const roomRatio = width > 0 && height > 0 ? width / height : 1;
  let best: Grid = { rows: 1, columns: count };
  let bestScore = Infinity;

  for (let rows = 1; rows <= count; rows += 1) {
    const columns = Math.ceil(count / rows);
    const waste = rows * columns - count;
    const gridRatio = columns / rows;
    const ratioDiff = Math.abs(Math.log(gridRatio) - Math.log(roomRatio));
    // Minimizing unused cells matters most; aspect-ratio match breaks ties.
    const score = waste * 2 + ratioDiff;
    if (score < bestScore) {
      bestScore = score;
      best = { rows, columns };
    }
  }

  return best;
}

/** Places `count` points inside `box` on a grid, padded away from the edges. */
export function calculateHeatDetectorPositions(box: Box, count: number): Point[] {
  if (count <= 0) return [];

  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  if (count === 1) return [{ x: centerX, y: centerY }];

  const { rows, columns } = calculateGrid(count, box.width, box.height);
  const paddingX = computePadding(box.width);
  const paddingY = computePadding(box.height);
  const usableWidth = Math.max(box.width - paddingX * 2, 0);
  const usableHeight = Math.max(box.height - paddingY * 2, 0);

  const points: Point[] = [];
  let remaining = count;

  for (let row = 0; row < rows; row += 1) {
    const rowsLeft = rows - row;
    // Spreads any remainder across rows (not just dumped into the last one)
    // so a short final row still reads as evenly spaced, not lopsided.
    const itemsInRow = Math.min(columns, Math.ceil(remaining / rowsLeft));
    if (itemsInRow <= 0) break;

    const y =
      rows === 1 ? centerY : box.y + paddingY + (usableHeight * row) / (rows - 1);

    for (let col = 0; col < itemsInRow; col += 1) {
      const x =
        itemsInRow === 1
          ? centerX
          : box.x + paddingX + (usableWidth * col) / (itemsInRow - 1);
      points.push({ x, y });
    }

    remaining -= itemsInRow;
  }

  return points;
}

/** Splits `count` detectors across regions proportionally to area (largest-remainder method). */
function distributeAcrossRegions(count: number, regionAreas: number[]): number[] {
  const totalArea = regionAreas.reduce((sum, area) => sum + area, 0);
  if (totalArea <= 0 || regionAreas.length === 0) {
    return regionAreas.map(() => 0);
  }

  const raw = regionAreas.map((area) => (area / totalArea) * count);
  const base = raw.map((value) => Math.floor(value));
  const remainders = raw
    .map((value, index) => ({ index, fraction: value - base[index] }))
    .sort((a, b) => b.fraction - a.fraction);

  let allocated = base.reduce((sum, value) => sum + value, 0);
  let cursor = 0;
  while (allocated < count && cursor < remainders.length) {
    base[remainders[cursor].index] += 1;
    allocated += 1;
    cursor += 1;
  }

  return base;
}

/**
 * Room-local (0,0-origin) regions to place detectors in.
 *
 * Partitions here are plain internal division lines, not independent rooms
 * (see types/floorplan.ts), so detector *count* is always based on the whole
 * room's area. But for *placement*, each non-empty partition leaf is treated
 * as its own region so detectors land inside real floor space and never on
 * top of a partition wall or inside a deleted (empty) region.
 */
function getPlacementRegions(structure: Structure): Box[] {
  const roomBox: Box = { x: 0, y: 0, width: structure.width, height: structure.height };
  if (!structure.partitions) return [roomBox];

  const leaves = computeLeafBoxes(structure.partitions, roomBox).filter(
    (leaf) => leaf.kind !== "empty"
  );
  return leaves.length > 0 ? leaves.map((leaf) => leaf.box) : [roomBox];
}

/** Detector positions in absolute canvas coordinates for a single room. */
export function calculateRoomDetectorPositions(
  structure: Structure,
  count: number
): Point[] {
  if (count <= 0) return [];

  const regions = getPlacementRegions(structure);
  const counts =
    regions.length === 1
      ? [count]
      : distributeAcrossRegions(
          count,
          regions.map((region) => region.width * region.height)
        );

  const points: Point[] = [];
  regions.forEach((region, index) => {
    for (const point of calculateHeatDetectorPositions(region, counts[index])) {
      points.push({ x: structure.x + point.x, y: structure.y + point.y });
    }
  });
  return points;
}

/**
 * Computes and places heat detectors for every Room on the given floor.
 * Pure function: does not touch React state — callers decide how to merge
 * the result with any existing (e.g. manually placed) detectors.
 *
 * `facilityType`가 공동주택(apartment/villa)이면 침실·거실은 건너뛴다 — NFTC
 * 608 2.7.1.3에 따라 그 방들은 열감지기가 아니라 연기감지기 대상이라
 * smokeDetectorPlacement.ts가 대신 배치한다.
 */
export function autoPlaceHeatDetectors(
  floor: Floor,
  coverageAreaByType: CoverageAreaByDetectorType,
  scale: number,
  facilityType: FacilityType
): HeatDetector[] {
  validateCoverageArea(coverageAreaByType[HeatDetectorType.DIFFERENTIAL]);
  validateCoverageArea(coverageAreaByType[HeatDetectorType.FIXED_TEMPERATURE]);

  const skipToSmokeDetector = isResidentialUnitFacility(facilityType);

  const detectors: HeatDetector[] = [];
  for (const room of floor.structures) {
    if (room.type !== "room") continue;
    if (skipToSmokeDetector && APARTMENT_SMOKE_DETECTOR_ROOM_TYPES.has(room.roomType as RoomType)) {
      continue;
    }

    const type = getHeatDetectorTypeForRoom(room.roomType);
    const coverageArea = coverageAreaByType[type];
    const areaM2 = pixelAreaToSquareMeters(computeEffectivePixelArea(room), scale);
    const count = calculateRequiredDetectorCount(areaM2, coverageArea);
    const obstacles = getObstaclesNear(room, floor.structures);

    for (const point of calculateRoomDetectorPositions(room, count)) {
      const placed = moveOffObstacles(point, obstacles, room);
      detectors.push({
        id: createId("heat-detector"),
        floorId: floor.id,
        roomId: room.id,
        x: placed.x,
        y: placed.y,
        coverageArea,
        type,
        isAutoPlaced: true,
      });
    }
  }

  return detectors;
}
