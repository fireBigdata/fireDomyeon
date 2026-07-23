import type { Floor, Structure } from "@/types/floorplan";
import type { SmokeDetector, SmokeDetectorCategory } from "@/types/smokeDetector";
import type { Point } from "@/lib/heatDetectorPlacement";
import { spanLengthPx, pointsAlongCenterline } from "@/lib/exitLightPlacement";
import { createId } from "@/lib/id";
import { pixelLengthToMeters } from "@/lib/area";
import { getObstaclesNear, moveOffObstacles } from "@/lib/obstacleAvoidance";

// NFTC 203 4조(연기감지기 설치기준): 복도·통로는 보행거리 30m마다, 계단·경사로는
// 수직거리 15m마다 1개 이상. 데이터 모델에 실제 보행경로·층고가 없어
// exitLightPlacement.ts와 같은 방식으로 구조물 자체의 span(가로/세로 중 긴 변)을
// 보행거리·수직거리의 대용으로 사용한다.
export const CORRIDOR_SMOKE_SPACING_METERS = 30;
export const STAIRS_SMOKE_SPACING_METERS = 15;

/** `ceil(spanMeters / spacingMeters)`, 0 if the span is 0 or negative. */
export function calculateRequiredSmokeDetectorCount(
  spanMeters: number,
  spacingMeters: number
): number {
  if (spanMeters <= 0) return 0;
  return Math.ceil(spanMeters / spacingMeters);
}

function buildDetector(
  floorId: string,
  structureId: string,
  category: SmokeDetectorCategory,
  point: Point
): SmokeDetector {
  return {
    id: createId("smoke-detector"),
    floorId,
    structureId,
    category,
    x: point.x,
    y: point.y,
    isAutoPlaced: true,
  };
}

/** Places detectors along each segment's centerline, spaced at most `spacingMeters` apart. */
function placeAlongSpan(
  floor: Floor,
  segments: Structure[],
  category: SmokeDetectorCategory,
  spacingMeters: number,
  scale: number
): SmokeDetector[] {
  const detectors: SmokeDetector[] = [];
  for (const segment of segments) {
    const spanMeters = pixelLengthToMeters(spanLengthPx(segment), scale);
    const count = calculateRequiredSmokeDetectorCount(spanMeters, spacingMeters);
    const obstacles = getObstaclesNear(segment, floor.structures);
    for (const point of pointsAlongCenterline(segment, count)) {
      const placed = moveOffObstacles(point, obstacles, segment);
      detectors.push(buildDetector(floor.id, segment.id, category, placed));
    }
  }
  return detectors;
}

/**
 * 승강로: 층별 대수 산정 기준이 없어(승강로 전체에 설치) 구조물 1개당 1개를
 * 중앙에 배치한다.
 */
function placeInElevatorShafts(floor: Floor): SmokeDetector[] {
  return floor.structures
    .filter((s) => s.type === "elevator")
    .map((elevator) => {
      const point = { x: elevator.x + elevator.width / 2, y: elevator.y + elevator.height / 2 };
      const obstacles = getObstaclesNear(elevator, floor.structures);
      return buildDetector(
        floor.id,
        elevator.id,
        "ELEVATOR",
        moveOffObstacles(point, obstacles, elevator)
      );
    });
}

export type SmokeDetectorSummary = {
  corridorCount: number;
  stairsCount: number;
  elevatorCount: number;
  totalCount: number;
};

export function summarizeSmokeDetectors(detectors: SmokeDetector[]): SmokeDetectorSummary {
  const countOf = (category: SmokeDetectorCategory) =>
    detectors.filter((detector) => detector.category === category).length;

  return {
    corridorCount: countOf("CORRIDOR"),
    stairsCount: countOf("STAIRS"),
    elevatorCount: countOf("ELEVATOR"),
    totalCount: detectors.length,
  };
}

/**
 * Computes and places 연기감지기 for every corridor, stairs, and elevator
 * structure on the given floor. Pure function: does not touch React state —
 * callers decide how to merge the result with any existing (e.g. manually
 * placed) detectors.
 */
export function autoPlaceSmokeDetectors(floor: Floor, scale: number): SmokeDetector[] {
  const corridors = floor.structures.filter((s) => s.type === "corridor");
  const stairs = floor.structures.filter((s) => s.type === "stairs");

  return [
    ...placeAlongSpan(floor, corridors, "CORRIDOR", CORRIDOR_SMOKE_SPACING_METERS, scale),
    ...placeAlongSpan(floor, stairs, "STAIRS", STAIRS_SMOKE_SPACING_METERS, scale),
    ...placeInElevatorShafts(floor),
  ];
}
