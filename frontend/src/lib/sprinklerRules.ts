import { RoomType, SprinklerHazardClass } from "@/types/floorplan";
import type { FacilityType, Structure, StructureType } from "@/types/floorplan";
import { SprinklerHeadType } from "@/types/sprinkler";
import { isResidentialUnitFacility } from "@/lib/facilityRules";

// ---------------------------------------------------------------------------
// NFPC 103 / NFTC 103 (스프링클러설비의 화재안전성능기준/화재안전기술기준) —
// rule table for sprinkler head horizontal-distance criteria (2.2.1).
//
// The distances below (2.1m general / 2.3m fire-resistant / 1.7m special
// combustible & stage / 2.6m residential-in-apartment-unit) are the values
// that have been stable across NFTC 103 revisions and are what this app's
// domain (per-unit apartment/house floor plans) actually exercises. This
// file does not attempt to encode every NFPC 103/NFTC 103 provision (e.g.
// rack storage, EV charging bays, hospital/lodging bedrooms) since this
// app's data model has no fields to classify those spaces at all — see
// classifyStructureForSprinkler's REVIEW_REQUIRED fallback.
//
// IMPORTANT: verify these values and clause numbers against the officially
// gazetted NFPC 103/NFTC 103 text in effect on the applicable date before
// using this for a regulatory submission — standards are periodically
// revised and this module cannot fetch the live proclamation.
// ---------------------------------------------------------------------------

export type SprinklerRuleId =
  | "NFTC103-2.2.1-GENERAL-NONFIRERESISTANT"
  | "NFTC103-2.2.1-GENERAL-FIRERESISTANT"
  | "NFTC103-2.2.1-SPECIAL-COMBUSTIBLE"
  | "NFTC103-2.2.1-STAGE"
  | "NFTC103-2.2.1-RESIDENTIAL-APARTMENT";

export interface SprinklerRuleDefinition {
  id: SprinklerRuleId;
  label: string;
  /** R, the maximum horizontal distance (m) from any point to the nearest head. */
  horizontalDistanceM: number;
  headType: SprinklerHeadType;
}

export const SPRINKLER_RULES: Record<SprinklerRuleId, SprinklerRuleDefinition> = {
  "NFTC103-2.2.1-GENERAL-NONFIRERESISTANT": {
    id: "NFTC103-2.2.1-GENERAL-NONFIRERESISTANT",
    label: "일반구조 기준 (수평거리 2.1m 이하)",
    horizontalDistanceM: 2.1,
    headType: SprinklerHeadType.STANDARD_CLOSED,
  },
  "NFTC103-2.2.1-GENERAL-FIRERESISTANT": {
    id: "NFTC103-2.2.1-GENERAL-FIRERESISTANT",
    label: "내화구조 기준 (수평거리 2.3m 이하)",
    horizontalDistanceM: 2.3,
    headType: SprinklerHeadType.STANDARD_CLOSED,
  },
  "NFTC103-2.2.1-SPECIAL-COMBUSTIBLE": {
    id: "NFTC103-2.2.1-SPECIAL-COMBUSTIBLE",
    label: "특수가연물 저장·취급 장소 기준 (수평거리 1.7m 이하)",
    horizontalDistanceM: 1.7,
    headType: SprinklerHeadType.STANDARD_CLOSED,
  },
  "NFTC103-2.2.1-STAGE": {
    id: "NFTC103-2.2.1-STAGE",
    label: "무대부 기준 (개방형 헤드, 수평거리 1.7m 이하)",
    horizontalDistanceM: 1.7,
    headType: SprinklerHeadType.OPEN,
  },
  "NFTC103-2.2.1-RESIDENTIAL-APARTMENT": {
    id: "NFTC103-2.2.1-RESIDENTIAL-APARTMENT",
    label: "공동주택(아파트등) 세대 내 주거용 스프링클러헤드 기준 (유효반경 2.6m 이하)",
    horizontalDistanceM: 2.6,
    headType: SprinklerHeadType.RESIDENTIAL,
  },
};

const SPRINKLER_ELIGIBLE_STRUCTURE_TYPES: ReadonlySet<StructureType> = new Set([
  "room",
  "corridor",
]);

export interface SprinklerClassificationContext {
  facilityType: FacilityType;
  isFireResistantStructure?: boolean;
}

export interface SprinklerClassificationResult {
  applicable: boolean;
  /** Explains why sprinkler placement doesn't apply, when applicable is false. */
  notApplicableReason: string | null;
  ruleId: SprinklerRuleId | null;
  classificationReason: string;
  /** True when the applied rule is a safe-fallback guess, not a confirmed classification. */
  requiresReview: boolean;
  warnings: string[];
}

const HOUSE_NOT_APPLICABLE_REASON =
  "단독/다가구주택 등(house)은 일반적으로 「소방시설 설치 및 관리에 관한 법률 시행령」상 스프링클러설비 설치대상이 아니며, 주택용 소방시설(소화기·단독경보형감지기) 기준이 적용됩니다. 실제 설치의무 대상 여부(규모·용도)는 별도로 확인하세요.";

// 상가/병원/학교/지하철역/공장/창고 등은 실제로는 연면적·층수 등 규모 기준에
// 따라 스프링클러 설치의무 대상 여부가 갈리며, 랙식창고(NFTC 609)·지하역사
// 등 특수 조항이 적용되는 경우도 있다. 이 앱은 건물 전체 규모 데이터를 다루지
// 않으므로 이런 시설은 항상 "적용 가능성 있음 + 검토 필요"로 처리한다 — 절대
// 조용히 COMPLIANT로 단정하지 않는다.
const NON_RESIDENTIAL_SCALE_REVIEW_WARNING =
  "이 시설 유형은 연면적·층수 등 규모 기준에 따라 스프링클러 설치의무 대상 여부가 달라질 수 있고, 랙식창고·지하역사 등 특수 기준이 적용될 수도 있습니다. 이 앱은 건물 전체 규모 데이터를 다루지 않으므로 실제 설치의무 대상 여부와 특수 기준 적용 여부를 반드시 별도로 확인하세요.";

/** Facility-level applicability check (STEP 2.1), independent of any single structure. */
export function getFacilitySprinklerApplicability(facilityType: FacilityType): {
  applicable: boolean;
  reason: string | null;
} {
  if (facilityType === "house") {
    return { applicable: false, reason: HOUSE_NOT_APPLICABLE_REASON };
  }
  return { applicable: true, reason: null };
}

/**
 * Classifies a single structure (STEP 2/3/8) into the applicable NFTC 103
 * rule. Never guesses a rule that would under-cover the space: whenever
 * required classification data is missing, it falls back to the smallest
 * (most conservative) applicable horizontal distance and reports
 * requiresReview = true instead of silently claiming compliance.
 */
export function classifyStructureForSprinkler(
  structure: Structure,
  context: SprinklerClassificationContext
): SprinklerClassificationResult {
  const facilityApplicability = getFacilitySprinklerApplicability(context.facilityType);
  if (!facilityApplicability.applicable) {
    return {
      applicable: false,
      notApplicableReason: facilityApplicability.reason,
      ruleId: null,
      classificationReason: "",
      requiresReview: false,
      warnings: [],
    };
  }

  if (!SPRINKLER_ELIGIBLE_STRUCTURE_TYPES.has(structure.type)) {
    return {
      applicable: false,
      notApplicableReason: "개구부/승강로/계단실 등은 스프링클러 헤드 배치 대상이 아닙니다.",
      ruleId: null,
      classificationReason: "",
      requiresReview: false,
      warnings: [],
    };
  }

  const warnings: string[] = [];

  const nonResidentialFacility = !isResidentialUnitFacility(context.facilityType);

  if (structure.type === "corridor") {
    const fireResistant = context.isFireResistantStructure;
    const ruleId: SprinklerRuleId =
      fireResistant === true
        ? "NFTC103-2.2.1-GENERAL-FIRERESISTANT"
        : "NFTC103-2.2.1-GENERAL-NONFIRERESISTANT";
    const fireResistanceUnknown = fireResistant === undefined;
    if (fireResistanceUnknown) {
      warnings.push(
        "건물 내화구조 여부가 확인되지 않아 안전측인 일반구조 기준(2.1m)으로 계산되었습니다. 내화구조 확인 후 재계산하세요."
      );
    }
    if (nonResidentialFacility) {
      warnings.push(NON_RESIDENTIAL_SCALE_REVIEW_WARNING);
    }
    return {
      applicable: true,
      notApplicableReason: null,
      ruleId,
      classificationReason: `복도 - ${SPRINKLER_RULES[ruleId].label}`,
      requiresReview: fireResistanceUnknown || nonResidentialFacility,
      warnings,
    };
  }

  // structure.type === "room" from here on.

  if (structure.sprinklerHazard === SprinklerHazardClass.STAGE) {
    warnings.push(
      "무대부는 개방형 스프링클러헤드 및 별도 살수구역 설계가 필요합니다. 자동 배치 결과는 참고용 좌표이며 전문 설계 검토가 필요합니다."
    );
    return {
      applicable: true,
      notApplicableReason: null,
      ruleId: "NFTC103-2.2.1-STAGE",
      classificationReason: `무대부 - ${SPRINKLER_RULES["NFTC103-2.2.1-STAGE"].label}`,
      requiresReview: true,
      warnings,
    };
  }

  if (structure.sprinklerHazard === SprinklerHazardClass.SPECIAL_COMBUSTIBLE) {
    return {
      applicable: true,
      notApplicableReason: null,
      ruleId: "NFTC103-2.2.1-SPECIAL-COMBUSTIBLE",
      classificationReason: `특수가연물 저장·취급 장소 - ${SPRINKLER_RULES["NFTC103-2.2.1-SPECIAL-COMBUSTIBLE"].label}`,
      requiresReview: false,
      warnings,
    };
  }

  if (isResidentialUnitFacility(context.facilityType)) {
    // Residential path (apartment/villa): every room inside a 공동주택 세대
    // qualifies for the 주거용 스프링클러헤드 proviso (NFTC 103 2.2.1 단서).
    let requiresReview = false;
    if (structure.roomType === RoomType.BOILER) {
      requiresReview = true;
      warnings.push(
        "보일러실 등 화기·가스설비 취급 공간은 스프링클러 외 별도 소화설비(가스누설경보기, 자동확산소화기 등) 적용 대상 여부를 추가로 확인하세요."
      );
    }

    return {
      applicable: true,
      notApplicableReason: null,
      ruleId: "NFTC103-2.2.1-RESIDENTIAL-APARTMENT",
      classificationReason: `공동주택 세대 내 실 - ${SPRINKLER_RULES["NFTC103-2.2.1-RESIDENTIAL-APARTMENT"].label}`,
      requiresReview,
      warnings,
    };
  }

  // Non-residential facility types (상가/병원/학교/지하철역/공장/창고): this app
  // doesn't sub-classify rooms by usage (no 병실/교실/사무실 taxonomy — see
  // lib/facilityRules.ts), so every non-hazard room gets the same general
  // horizontal-distance rule a corridor would, gated by fire-resistance.
  const fireResistant = context.isFireResistantStructure;
  const ruleId: SprinklerRuleId =
    fireResistant === true
      ? "NFTC103-2.2.1-GENERAL-FIRERESISTANT"
      : "NFTC103-2.2.1-GENERAL-NONFIRERESISTANT";
  if (fireResistant === undefined) {
    warnings.push(
      "건물 내화구조 여부가 확인되지 않아 안전측인 일반구조 기준(2.1m)으로 계산되었습니다. 내화구조 확인 후 재계산하세요."
    );
  }
  warnings.push(NON_RESIDENTIAL_SCALE_REVIEW_WARNING);

  return {
    applicable: true,
    notApplicableReason: null,
    ruleId,
    classificationReason: `일반 실 - ${SPRINKLER_RULES[ruleId].label}`,
    requiresReview: true,
    warnings,
  };
}
