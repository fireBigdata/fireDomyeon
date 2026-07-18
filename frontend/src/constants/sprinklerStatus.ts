import { SprinklerComplianceStatus } from "@/types/floorplan";

export const SPRINKLER_STATUS_LABELS: Record<SprinklerComplianceStatus, string> = {
  [SprinklerComplianceStatus.COMPLIANT_CALCULATION]: "계산 완료",
  [SprinklerComplianceStatus.REVIEW_REQUIRED]: "법규 분류 확인 필요",
  [SprinklerComplianceStatus.OBSTRUCTION_REVIEW_REQUIRED]: "장애물 확인 필요",
  [SprinklerComplianceStatus.INVALID_LAYOUT]: "배치 불가",
  [SprinklerComplianceStatus.NOT_APPLICABLE]: "설치 대상 아님",
};

export const SPRINKLER_STATUS_CLASSES: Record<SprinklerComplianceStatus, string> = {
  [SprinklerComplianceStatus.COMPLIANT_CALCULATION]: "bg-green-100 text-green-700",
  [SprinklerComplianceStatus.REVIEW_REQUIRED]: "bg-amber-100 text-amber-700",
  [SprinklerComplianceStatus.OBSTRUCTION_REVIEW_REQUIRED]: "bg-amber-100 text-amber-700",
  [SprinklerComplianceStatus.INVALID_LAYOUT]: "bg-red-100 text-red-700",
  [SprinklerComplianceStatus.NOT_APPLICABLE]: "bg-gray-100 text-gray-600",
};
