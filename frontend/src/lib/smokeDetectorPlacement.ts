import { RoomType } from "@/types/floorplan";
import type { FacilityType, Floor, Structure } from "@/types/floorplan";
import type { SmokeDetector, SmokeDetectorCategory } from "@/types/smokeDetector";
import type { Point } from "@/lib/heatDetectorPlacement";
import { calculateRoomDetectorPositions, calculateRequiredDetectorCount } from "@/lib/heatDetectorPlacement";
import { spanLengthPx, pointsAlongCenterline } from "@/lib/exitLightPlacement";
import { createId } from "@/lib/id";
import { pixelLengthToMeters, pixelAreaToSquareMeters } from "@/lib/area";
import { computeEffectivePixelArea } from "@/lib/partitionTree";
import { getObstaclesNear, moveOffObstacles } from "@/lib/obstacleAvoidance";
import { isResidentialUnitFacility } from "@/lib/facilityRules";

// NFTC 608(공동주택의 화재안전기술기준) 2.7.1.3: 공동주택 세대 내 거실(취침
// 용도 방 및 거실)에는 연기감지기를 설치한다 — heatDetectorPlacement.ts는
// apartment/villa에서 이 두 방 유형을 건너뛰므로 여기서 대신 배치한다.
const APARTMENT_SMOKE_DETECTOR_ROOM_TYPES: ReadonlySet<RoomType> = new Set([
  RoomType.BEDROOM,
  RoomType.LIVING,
]);

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

/**
 * 공동주택(apartment/villa) 세대 내 침실·거실: NFTC 203 표 2.4.3.5(연기감지기
 * 바닥면적)에 따라 방 면적을 감지기 보호면적(㎡, 제품 카탈로그의 abilityUnit)
 * 으로 나눈 개수를 배치한다(최소 1개). 개수가 여럿이면 heatDetectorPlacement의
 * 파티션 인식 grid 배치를 그대로 재사용해 실제 실내 공간 안에 고르게 배치한다.
 */
function placeInApartmentRooms(
  floor: Floor,
  facilityType: FacilityType,
  coverageAreaM2: number,
  scale: number
): SmokeDetector[] {
  if (!isResidentialUnitFacility(facilityType)) return [];

  const rooms = floor.structures.filter(
    (s) => s.type === "room" && s.roomType !== undefined && APARTMENT_SMOKE_DETECTOR_ROOM_TYPES.has(s.roomType)
  );

  const detectors: SmokeDetector[] = [];
  for (const room of rooms) {
    const obstacles = getObstaclesNear(room, floor.structures);
    const areaM2 = pixelAreaToSquareMeters(computeEffectivePixelArea(room), scale);
    const count = calculateRequiredDetectorCount(areaM2, coverageAreaM2);
    for (const point of calculateRoomDetectorPositions(room, count)) {
      const placed = moveOffObstacles(point, obstacles, room);
      detectors.push(buildDetector(floor.id, room.id, "ROOM", placed));
    }
  }
  return detectors;
}

export type SmokeDetectorSummary = {
  corridorCount: number;
  stairsCount: number;
  elevatorCount: number;
  roomCount: number;
  totalCount: number;
};

export function summarizeSmokeDetectors(detectors: SmokeDetector[]): SmokeDetectorSummary {
  const countOf = (category: SmokeDetectorCategory) =>
    detectors.filter((detector) => detector.category === category).length;

  return {
    corridorCount: countOf("CORRIDOR"),
    stairsCount: countOf("STAIRS"),
    elevatorCount: countOf("ELEVATOR"),
    roomCount: countOf("ROOM"),
    totalCount: detectors.length,
  };
}

/**
 * Computes and places 연기감지기 for every corridor, stairs, and elevator
 * structure on the given floor, plus (for apartment/villa) every 침실·거실
 * room (NFTC 608 2.7.1.3), sized by `roomCoverageAreaM2` (감지기 1개당 보호
 * 면적, ㎡ — NFTC 203 표 2.4.3.5 연기감지기 항목). Pure function: does not
 * touch React state — callers decide how to merge the result with any
 * existing (e.g. manually placed) detectors.
 */
export function autoPlaceSmokeDetectors(
  floor: Floor,
  scale: number,
  facilityType: FacilityType,
  roomCoverageAreaM2: number
): SmokeDetector[] {
  const corridors = floor.structures.filter((s) => s.type === "corridor");
  const stairs = floor.structures.filter((s) => s.type === "stairs");

  return [
    ...placeAlongSpan(floor, corridors, "CORRIDOR", CORRIDOR_SMOKE_SPACING_METERS, scale),
    ...placeAlongSpan(floor, stairs, "STAIRS", STAIRS_SMOKE_SPACING_METERS, scale),
    ...placeInElevatorShafts(floor),
    ...placeInApartmentRooms(floor, facilityType, roomCoverageAreaM2, scale),
  ];
}
