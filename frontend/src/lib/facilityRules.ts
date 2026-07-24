import type { FacilityType } from "@/types/floorplan";

// ---------------------------------------------------------------------------
// Facility-type classification shared by the equipment placement engines
// (extinguisherPlacement.ts, sprinklerRules.ts). Room-level usage inside a
// non-residential facility (병원/학교/상가/지하철역/공장/창고) is intentionally
// NOT sub-classified (no per-facility RoomType taxonomy) — every such room
// uses RoomType.GENERIC and equipment counts are computed from floor area /
// corridor length / structure count instead, mirroring how NFTC 101/103
// actually apply to most 특정소방대상물 (면적 기준), not room-by-room usage.
//
// IMPORTANT: verify these categorizations and area values against the
// officially gazetted NFPC 101/103/608 text in effect on the applicable
// date — this module cannot fetch the live proclamation and does not model
// specialized provisions (e.g. 랙식창고 NFTC 609, 지하역사 특례).
// ---------------------------------------------------------------------------

/** apartment/villa: 공동주택(아파트/연립·다세대주택) — 세대별 room/corridor 개수 기준이 적용된다. */
export function isResidentialUnitFacility(
  facilityType: FacilityType
): facilityType is "apartment" | "villa" {
  return facilityType === "apartment" || facilityType === "villa";
}

export type ExtinguisherAreaPerUnit = {
  /** ㎡ per required ability unit for a non-fire-resistant structure. */
  normal: number;
  /** ㎡ per required ability unit when the structure is fire-resistant (내화구조). */
  fireResistant: number;
};

/**
 * 소화기구 능력단위 기준면적. 용도에 따라 두 기준을 함께 쓴다:
 * - NFTC 101 별표2 (특정소방대상물별 소화기구의 능력단위): apartment/villa를
 *   제외한 용도. 두 그룹으로 나뉜다 — 100㎡(내화구조 200㎡)당 1단위: 근린생활
 *   시설(상가), 운수시설(지하철역), 공장, 창고시설, 단독주택(house);
 *   200㎡(내화구조 400㎡)당 1단위: "그 밖의 것"에 해당하는 의료시설(병원),
 *   교육연구시설(학교).
 * - NFTC 608 2.1.1 (공동주택의 화재안전기술기준): apartment/villa —
 *   "바닥면적 100㎡마다 1단위". 세대별 거실/복도 개수 기준이 아니라 면적
 *   기준이며, 조문에 내화구조 가산 규정이 없어 fireResistant도 동일하게
 *   100㎡로 둔다(불명확하면 완화가 아니라 동일 기준을 유지해 과소 배치를
 *   피한다).
 */
export const EXTINGUISHER_AREA_PER_UNIT_M2: Record<FacilityType, ExtinguisherAreaPerUnit> = {
  apartment: { normal: 100, fireResistant: 100 },
  villa: { normal: 100, fireResistant: 100 },
  house: { normal: 100, fireResistant: 200 },
  commercial: { normal: 100, fireResistant: 200 },
  subway: { normal: 100, fireResistant: 200 },
  factory: { normal: 100, fireResistant: 200 },
  warehouse: { normal: 100, fireResistant: 200 },
  hospital: { normal: 200, fireResistant: 400 },
  school: { normal: 200, fireResistant: 400 },
};

export function getExtinguisherAreaPerUnit(facilityType: FacilityType): ExtinguisherAreaPerUnit {
  return EXTINGUISHER_AREA_PER_UNIT_M2[facilityType];
}

// ---------------------------------------------------------------------------
// 내화구조(耐火構造) 건축비용 — 시설물 용도별 ㎡당 단가(사용자 제공 기준).
// 이 앱의 FacilityType 9종 중 사용자가 제시한 용도 목록(공동주택/단독주택/
// 사무소/상가/공장/창고/학교/병원/기타)에 정확히 대응하지 않는 두 항목은 다음
// 기준으로 대응했다:
// - villa(빌라, 연립·다세대주택)는 공동주택 그룹이므로 apartment와 동일 단가.
// - subway(지하철역)는 제시된 목록에 없어 "기타" 단가를 적용했다 — 마침
//   "사무소"도 "기타"와 같은 단가(200,000원/㎡)라 실질적으로 어느 쪽으로
//   취급해도 결과는 같다.
// ---------------------------------------------------------------------------
export const FIRE_RESISTANT_CONSTRUCTION_COST_PER_M2: Record<FacilityType, number> = {
  apartment: 100_000, // 공동주택
  villa: 100_000, // 공동주택
  house: 250_000, // 단독주택
  commercial: 200_000, // 상가
  hospital: 250_000, // 병원
  school: 150_000, // 학교
  subway: 200_000, // 목록에 없어 "기타" 단가 적용
  factory: 250_000, // 공장
  warehouse: 180_000, // 창고
};

export function getFireResistantConstructionCostPerM2(facilityType: FacilityType): number {
  return FIRE_RESISTANT_CONSTRUCTION_COST_PER_M2[facilityType];
}
