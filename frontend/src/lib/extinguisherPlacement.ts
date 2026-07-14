import type { Structure } from "@/types/floorplan";
import type { ExtinguisherPlacement, ExtinguisherTypeDef } from "@/types/extinguisher";
import { createId } from "@/lib/id";
import { pixelAreaToSquareMeters } from "@/lib/area";

export type AutoPlaceResult = {
  totalArea: number;
  requiredCount: number;
  placements: ExtinguisherPlacement[];
};

/** Sum of the floor area of every Room on the floor (other structure types don't count). */
export function computeTotalRoomArea(
  structures: Structure[],
  scale: number
): number {
  return pixelAreaToSquareMeters(
    structures
      .filter((structure) => structure.type === "room")
      .reduce((sum, room) => sum + room.width * room.height, 0),
    scale
  );
}

// TODO: 실제 소방시설법상 소화기 설치 기준 계산식 적용 (면적/용도별 기준 등 반영 필요)
export function computeRequiredCount(totalArea: number, ability: number): number {
  if (totalArea <= 0 || ability <= 0) return 0;
  return Math.ceil(totalArea / (ability * 100));
}

// TODO: 실제 소방 기준(보행거리, 출입구 인접 등)에 따른 위치 최적화 알고리즘 적용
// 현재는 Room을 면적이 큰 순으로 정렬해 균등 배치하는 Mock 로직.
export function computePlacements(
  structures: Structure[],
  count: number,
  extinguisherTypeId: string
): ExtinguisherPlacement[] {
  const rooms = structures.filter((structure) => structure.type === "room");
  if (rooms.length === 0 || count <= 0) return [];

  const roomsByAreaDesc = [...rooms].sort(
    (a, b) => b.width * b.height - a.width * a.height
  );

  const occurrenceByRoomId = new Map<string, number>();
  const placements: ExtinguisherPlacement[] = [];

  for (let i = 0; i < count; i += 1) {
    const room = roomsByAreaDesc[i % roomsByAreaDesc.length];
    const occurrence = occurrenceByRoomId.get(room.id) ?? 0;
    occurrenceByRoomId.set(room.id, occurrence + 1);
    const offset = occurrence * 14;

    placements.push({
      id: createId("extinguisher"),
      x: room.x + room.width / 2 + offset,
      y: room.y + room.height / 2 + offset,
      extinguisherTypeId,
    });
  }

  return placements;
}

export function autoPlaceExtinguishers(
  structures: Structure[],
  scale: number,
  extinguisherType: ExtinguisherTypeDef
): AutoPlaceResult {
  const totalArea = computeTotalRoomArea(structures, scale);
  const requiredCount = computeRequiredCount(totalArea, extinguisherType.ability);
  const placements = computePlacements(
    structures,
    requiredCount,
    extinguisherType.id
  );

  return { totalArea, requiredCount, placements };
}
