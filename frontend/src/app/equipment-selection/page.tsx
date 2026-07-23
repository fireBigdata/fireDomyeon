"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EQUIPMENT_LIST, EQUIPMENT_PRODUCTS } from "@/constants/equipmentProducts";
import { FACILITY_TYPE_LABELS } from "@/constants/structureDefaults";
import { useEquipmentSelection } from "@/hooks/useEquipmentSelection";
import { useFloorPlanSummary } from "@/hooks/useFloorPlanSummary";
import { getFireResistantConstructionCostPerM2 } from "@/lib/facilityRules";
import { saveEquipmentSelectionToStorage } from "@/lib/equipmentSelectionStorage";
import EquipmentListPanel from "@/components/equipment/EquipmentListPanel";
import ProductPanel from "@/components/equipment/ProductPanel";
import FloorPlanSummaryPanel from "@/components/equipment/FloorPlanSummaryPanel";
import CostSummaryPanel from "@/components/equipment/CostSummaryPanel";

export default function EquipmentSelectionPage() {
  const floorPlanSummary = useFloorPlanSummary();
  const {
    selection,
    quantities,
    selectProduct,
    setQuantity,
    summary,
    fireResistantConstructionCost,
    totalCost,
  } = useEquipmentSelection(floorPlanSummary);

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
  const [activeEquipment, setActiveEquipment] = useState(EQUIPMENT_LIST[0]);

  // Lets the floor plan drawing page (a separate route with no shared
  // state/Context) read which 소화기 was selected here — used by its
  // extinguisher auto-placement for the product's abilityUnit.
  useEffect(() => {
    saveEquipmentSelectionToStorage(selection);
  }, [selection]);

  const completedCount = EQUIPMENT_LIST.filter(
    (name) => selection[name] !== null
  ).length;

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">설비 선택</h1>
          <p className="mt-1 text-gray-500">
            설비별로 사용할 제품을 선택해주세요.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-md border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
        <div className="flex flex-1 overflow-hidden">
          <EquipmentListPanel
            equipmentList={EQUIPMENT_LIST}
            selection={selection}
            activeEquipment={activeEquipment}
            onSelectEquipment={setActiveEquipment}
          />

          <div className="flex-1 overflow-y-auto">
            <ProductPanel
              name={activeEquipment}
              products={EQUIPMENT_PRODUCTS[activeEquipment]}
              selectedValue={selection[activeEquipment]}
              quantity={quantities[activeEquipment]}
              onSelect={(value) => selectProduct(activeEquipment, value)}
              onQuantityChange={(quantity) =>
                setQuantity(activeEquipment, quantity)
              }
            />
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          {submitted ? (
            <>
              <span className="text-sm text-gray-500">선택이 완료되었습니다.</span>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                다시 설비 선택
              </button>
            </>
          ) : (
            <>
              <span className="text-sm text-gray-500">
                {completedCount}/{EQUIPMENT_LIST.length}개 설비 선택 완료
              </span>
              <button
                type="button"
                onClick={() => setSubmitted(true)}
                className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                다음
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
