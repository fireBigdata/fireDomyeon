import type { FacilityType, Floor } from "@/types/floorplan";
import { pixelAreaToSquareMeters } from "@/lib/area";
import { computeTotalStructurePixelArea } from "@/lib/structureArea";

// ---------------------------------------------------------------------------
// 옥내소화전설비 설치대상 판정 — 「소방시설 설치 및 관리에 관한 법률 시행령」
// 별표4의 핵심 규모 기준(연면적/층수) 두 가지만 반영한 간이 판정이다:
//  1) 연면적 3,000㎡ 이상
//  2) 4층 이상이면서 바닥면적 1,000㎡ 이상인 층이 있는 경우
// 무창층·지하층(600㎡ 기준), 지하가(터널) 길이, 옥상 주차장 등 별표4의 다른
// 조건은 이 앱의 데이터 모델(층별 구조물 도면)로는 판단할 수 없어 반영하지
// 않는다 — 이 기준에 못 미쳐 배치하지 않을 때에도, 배치할 때에도 그 한계를
// 항상 경고로 알린다(절대 조용히 COMPLIANT로 단정하지 않는다).
//
// IMPORTANT: 「소방시설 설치 및 관리에 관한 법률 시행령」 별표4 원문과 대조해
// 확인하세요 — 이 모듈은 그 원문을 실시간으로 조회하지 않고, 기준은 개정될
// 수 있습니다.
// ---------------------------------------------------------------------------

export const HYDRANT_TOTAL_FLOOR_AREA_THRESHOLD_M2 = 3000;
export const HYDRANT_MIN_FLOOR_COUNT_FOR_AREA_RULE = 4;
export const HYDRANT_SINGLE_FLOOR_AREA_THRESHOLD_M2 = 1000;

const HOUSE_NOT_APPLICABLE_REASON =
  "단독/다가구주택 등(house)은 일반적으로 「소방시설 설치 및 관리에 관한 법률 시행령」 별표4상 옥내소화전설비 설치대상이 아닙니다. 실제 설치의무 대상 여부는 별도로 확인하세요.";

const SIMPLIFIED_CRITERIA_WARNING =
  "이 판정은 연면적·층수 등 핵심 규모 기준만 반영한 간이 판정입니다. 무창층·지하층, 지하가(터널), 옥상 주차장 등 시행령 별표4의 다른 조건에 따라 설치의무가 달라질 수 있으니 실제 설치의무 대상 여부는 반드시 전문가 검토를 통해 확인하세요.";

function belowThresholdReason(totalAreaM2: number, floorCount: number): string {
  return (
    `연면적 ${totalAreaM2.toFixed(1)}㎡, 총 ${floorCount}개 층 기준으로는 옥내소화전 설치의무 기준` +
    `(연면적 ${HYDRANT_TOTAL_FLOOR_AREA_THRESHOLD_M2.toLocaleString()}㎡ 이상, 또는 ` +
    `${HYDRANT_MIN_FLOOR_COUNT_FOR_AREA_RULE}층 이상이면서 바닥면적 ` +
    `${HYDRANT_SINGLE_FLOOR_AREA_THRESHOLD_M2.toLocaleString()}㎡ 이상인 층이 있는 경우)에 해당하지 않아 ` +
    `배치하지 않았습니다. ${SIMPLIFIED_CRITERIA_WARNING}`
  );
}

export type HydrantApplicabilityResult = {
  applicable: boolean;
  notApplicableReason: string | null;
  /** Always true when applicable: this is a simplified, area/floor-count-only check. */
  requiresReview: boolean;
  warnings: string[];
  totalBuildingFloorAreaM2: number;
  floorCount: number;
  maxSingleFloorAreaM2: number;
};

/**
 * 건물 전체(모든 층) 기준의 옥내소화전 설치대상 판정. 개별 층 도면이 아니라
 * `floors` 전체를 합산·비교해야 하므로, 다른 설비(소화기/스프링클러 등)와
 * 달리 층 하나만으로는 판단할 수 없다.
 */
export function getHydrantApplicability(
  floors: Floor[],
  facilityType: FacilityType,
  scale: number
): HydrantApplicabilityResult {
  const floorAreasM2 = floors.map((floor) =>
    pixelAreaToSquareMeters(computeTotalStructurePixelArea(floor.structures), scale)
  );
  const totalBuildingFloorAreaM2 = floorAreasM2.reduce((sum, area) => sum + area, 0);
  const floorCount = floors.length;
  const maxSingleFloorAreaM2 = floorAreasM2.length > 0 ? Math.max(...floorAreasM2) : 0;

  if (facilityType === "house") {
    return {
      applicable: false,
      notApplicableReason: HOUSE_NOT_APPLICABLE_REASON,
      requiresReview: false,
      warnings: [],
      totalBuildingFloorAreaM2,
      floorCount,
      maxSingleFloorAreaM2,
    };
  }

  const meetsAreaRule = totalBuildingFloorAreaM2 >= HYDRANT_TOTAL_FLOOR_AREA_THRESHOLD_M2;
  const meetsFloorRule =
    floorCount >= HYDRANT_MIN_FLOOR_COUNT_FOR_AREA_RULE &&
    maxSingleFloorAreaM2 >= HYDRANT_SINGLE_FLOOR_AREA_THRESHOLD_M2;

  if (!meetsAreaRule && !meetsFloorRule) {
    return {
      applicable: false,
      notApplicableReason: belowThresholdReason(totalBuildingFloorAreaM2, floorCount),
      requiresReview: false,
      warnings: [],
      totalBuildingFloorAreaM2,
      floorCount,
      maxSingleFloorAreaM2,
    };
  }

  return {
    applicable: true,
    notApplicableReason: null,
    requiresReview: true,
    warnings: [SIMPLIFIED_CRITERIA_WARNING],
    totalBuildingFloorAreaM2,
    floorCount,
    maxSingleFloorAreaM2,
  };
}
