"use client";

import { useCallback, useState } from "react";
import type { SmokeDetector } from "@/types/smokeDetector";
import type { FacilityType, Floor } from "@/types/floorplan";
import type { EquipmentProduct } from "@/types/equipmentSelection";
import {
  autoPlaceSmokeDetectors,
  summarizeSmokeDetectors,
  type SmokeDetectorSummary,
} from "@/lib/smokeDetectorPlacement";
import { isResidentialUnitFacility } from "@/lib/facilityRules";

const NO_PRODUCT_MESSAGE = "설비 선택 페이지에서 연기감지기를 먼저 선택해주세요.";
const NO_ABILITY_UNIT_MESSAGE = "선택한 연기감지기의 보호면적이 아직 등록되지 않았습니다.";

export function useSmokeDetectorPlacement(
  floor: Floor,
  facilityType: FacilityType,
  scale: number,
  smokeDetectorProduct: EquipmentProduct | null,
  onPlaced: (detectors: SmokeDetector[]) => void
) {
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SmokeDetectorSummary | null>(null);

  const autoPlace = useCallback(() => {
    // 세대 내 침실·거실(NFTC 608 2.7.1.3)만 보호면적 기반 개수 산정이 필요하다 —
    // 그 외 facilityType은 복도/계단/승강로만 배치하므로 제품 선택 없이도 동작한다.
    const needsCoverageArea = isResidentialUnitFacility(facilityType);

    if (needsCoverageArea) {
      if (!smokeDetectorProduct) {
        setError(NO_PRODUCT_MESSAGE);
        return;
      }
      if (smokeDetectorProduct.abilityUnit == null || smokeDetectorProduct.abilityUnit <= 0) {
        setError(NO_ABILITY_UNIT_MESSAGE);
        return;
      }
    }

    const detectors = autoPlaceSmokeDetectors(
      floor,
      scale,
      facilityType,
      smokeDetectorProduct?.abilityUnit ?? 0
    );
    setError(null);
    setSummary(summarizeSmokeDetectors(detectors));
    onPlaced(detectors);
  }, [floor, facilityType, scale, smokeDetectorProduct, onPlaced]);

  return { error, summary, autoPlace };
}
