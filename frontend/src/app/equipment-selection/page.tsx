"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EQUIPMENT_LIST, EQUIPMENT_PRODUCTS } from "@/constants/equipmentProducts";
import type { EquipmentName } from "@/types/equipmentSelection";
import {
  getFloorPlanInstalledCount,
  ML_ESTIMATED_EQUIPMENT_NAMES,
} from "@/lib/equipmentFloorPlanCounts";
import { FACILITY_TYPE_LABELS } from "@/constants/structureDefaults";
import { useEquipmentSelection } from "@/hooks/useEquipmentSelection";
import { useFloorPlanSummary } from "@/hooks/useFloorPlanSummary";
import { useEquipmentCountPrediction } from "@/hooks/useEquipmentCountPrediction";
import { getFireResistantConstructionCostPerM2 } from "@/lib/facilityRules";
import { saveEquipmentSelectionToStorage } from "@/lib/equipmentSelectionStorage";
import EquipmentProgressSummary from "@/components/equipment/EquipmentProgressSummary";
import EquipmentSidebar from "@/components/equipment/EquipmentSidebar";
import EquipmentFocusPanel from "@/components/equipment/EquipmentFocusPanel";
import EquipmentStepFooter from "@/components/equipment/EquipmentStepFooter";
import FloorPlanSummaryPanel from "@/components/equipment/FloorPlanSummaryPanel";
import CostSummaryPanel from "@/components/equipment/CostSummaryPanel";

export default function EquipmentSelectionPage() {
  const floorPlanSummary = useFloorPlanSummary();
  const equipmentCountPrediction = useEquipmentCountPrediction(floorPlanSummary);
  const {
    selection,
    quantities,
    selectProduct,
    setQuantity,
    summary,
    fireResistantConstructionCost,
    totalCost,
  } = useEquipmentSelection(floorPlanSummary, equipmentCountPrediction.data);

  // Recommended count per equipment from the floor plan/AI estimate alone —
  // used to split equipment into "필수 설비" and "선택 설비", independent of
  // whether the user has picked a product for it yet.
  const recommendedCounts = useMemo(() => {
    return EQUIPMENT_LIST.reduce((acc, name) => {
      acc[name] = getFloorPlanInstalledCount(name, floorPlanSummary, equipmentCountPrediction.data);
      return acc;
    }, {} as Record<EquipmentName, number>);
  }, [floorPlanSummary, equipmentCountPrediction.data]);

  const requiredEquipmentList = useMemo(
    () => EQUIPMENT_LIST.filter((name) => recommendedCounts[name] > 0),
    [recommendedCounts]
  );
  const optionalEquipmentList = useMemo(
    () => EQUIPMENT_LIST.filter((name) => !(recommendedCounts[name] > 0)),
    [recommendedCounts]
  );
  // Step order for the 이전/다음 footer: required equipment first, then
  // optional — the two lists always partition EQUIPMENT_LIST, so every
  // equipment name appears exactly once here.
  const orderedEquipmentList = useMemo(
    () => [...requiredEquipmentList, ...optionalEquipmentList],
    [requiredEquipmentList, optionalEquipmentList]
  );

  const fireResistantConstructionCostInfo =
    floorPlanSummary?.isFireResistantStructure
      ? {
          amount: fireResistantConstructionCost,
          ratePerM2: getFireResistantConstructionCostPerM2(floorPlanSummary.facilityType),
          totalAreaSqm: floorPlanSummary.totalAreaSqm,
          facilityTypeLabel: FACILITY_TYPE_LABELS[floorPlanSummary.facilityType],
        }
      : null;
  const [submitted, setSubmitted] = useState(false);
  const [activeEquipment, setActiveEquipment] = useState<EquipmentName | null>(
    EQUIPMENT_LIST[0] ?? null
  );

  // Lets the floor plan drawing page (a separate route with no shared
  // state/Context) read which 소화기 was selected here — used by its
  // extinguisher auto-placement for the product's abilityUnit.
  useEffect(() => {
    saveEquipmentSelectionToStorage(selection);
  }, [selection]);

  const requiredCompletedCount = requiredEquipmentList.filter(
    (name) => selection[name] !== null
  ).length;
  const remainingRequiredNames = requiredEquipmentList.filter(
    (name) => selection[name] === null
  );

  const currentIndex = activeEquipment
    ? Math.max(orderedEquipmentList.indexOf(activeEquipment), 0)
    : 0;
  const isLastStep = currentIndex >= orderedEquipmentList.length - 1;

  const handlePrev = () => {
    const prevIndex = Math.max(currentIndex - 1, 0);
    setActiveEquipment(orderedEquipmentList[prevIndex] ?? null);
  };

  const handleNext = () => {
    if (isLastStep) {
      setSubmitted(true);
      return;
    }
    setActiveEquipment(orderedEquipmentList[currentIndex + 1] ?? null);
  };

  const mlEstimateNote =
    activeEquipment &&
    ML_ESTIMATED_EQUIPMENT_NAMES.has(activeEquipment) &&
    equipmentCountPrediction.data?.[activeEquipment] != null
      ? "AI 추정치가 기본값으로 채워졌습니다 (참고용 — 학습 데이터가 적어 정확도가 낮으니 반드시 직접 확인 후 수정하세요)."
      : undefined;

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">설비 선택</h1>
          <p className="mt-1 text-gray-500">
            {submitted
              ? "선택이 완료되었습니다."
              : "설비별로 사용할 제품을 선택해주세요."}
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          도면 설계로 이동
        </Link>
      </div>

      {submitted ? (
        <div className="flex-1 overflow-y-auto">
          <FloorPlanSummaryPanel summary={floorPlanSummary} />

          <CostSummaryPanel
            equipmentList={EQUIPMENT_LIST}
            summary={summary}
            totalCost={totalCost}
            fireResistantConstructionCost={fireResistantConstructionCostInfo}
          />
        </div>
      ) : (
        <>
          <EquipmentProgressSummary
            completedCount={requiredCompletedCount}
            totalCount={requiredEquipmentList.length}
            remainingNames={remainingRequiredNames}
          />
          <div className="flex flex-1 overflow-hidden">
            <EquipmentSidebar
              requiredEquipmentList={requiredEquipmentList}
              optionalEquipmentList={optionalEquipmentList}
              selection={selection}
              activeEquipment={activeEquipment}
              onSelectEquipment={setActiveEquipment}
            />
            {activeEquipment ? (
              <EquipmentFocusPanel
                name={activeEquipment}
                products={EQUIPMENT_PRODUCTS[activeEquipment]}
                selectedValue={selection[activeEquipment]}
                quantity={quantities[activeEquipment]}
                onSelect={(value) => selectProduct(activeEquipment, value)}
                onQuantityChange={(quantity) => setQuantity(activeEquipment, quantity)}
                mlEstimateNote={mlEstimateNote}
              />
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
                해당하는 설비가 없습니다.
              </div>
            )}
          </div>
        </>
      )}

      {submitted ? (
        <div className="border-t border-gray-200 bg-white px-4 py-3">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <span className="text-sm text-gray-500">선택이 완료되었습니다.</span>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="rounded-lg border border-gray-200 bg-white px-6 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              다시 설비 선택
            </button>
          </div>
        </div>
      ) : (
        <EquipmentStepFooter
          currentIndex={currentIndex}
          total={orderedEquipmentList.length}
          onPrev={handlePrev}
          onNext={handleNext}
          nextLabel={isLastStep ? "선택 완료" : "다음"}
        />
      )}
    </div>
  );
}
