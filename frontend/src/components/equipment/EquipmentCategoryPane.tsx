"use client";

import { useState } from "react";
import EquipmentListPanel from "./EquipmentListPanel";
import ProductPanel from "./ProductPanel";
import { EQUIPMENT_PRODUCTS } from "@/constants/equipmentProducts";
import { ML_ESTIMATED_EQUIPMENT_NAMES } from "@/lib/equipmentFloorPlanCounts";
import type {
  EquipmentName,
  EquipmentQuantityState,
  EquipmentSelectionState,
  EquipmentSelectionValue,
} from "@/types/equipmentSelection";

type EquipmentCategoryPaneProps = {
  title: string;
  equipmentList: EquipmentName[];
  selection: EquipmentSelectionState;
  quantities: EquipmentQuantityState;
  onSelectProduct: (equipment: EquipmentName, value: EquipmentSelectionValue) => void;
  onQuantityChange: (equipment: EquipmentName, quantity: number) => void;
  mlPrediction?: Record<string, number> | null;
};

/**
 * One half of the equipment-selection screen: its own equipment-type list
 * paired with its own product grid, scoped to `equipmentList` — e.g. "설치
 * 필요" vs "개수 0 · 선택장비" (see equipment-selection/page.tsx). Keeps its
 * own "which equipment is being viewed" state so the two panes can show
 * different equipment types at the same time.
 */
export default function EquipmentCategoryPane({
  title,
  equipmentList,
  selection,
  quantities,
  onSelectProduct,
  onQuantityChange,
  mlPrediction,
}: EquipmentCategoryPaneProps) {
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentName | null>(
    equipmentList[0] ?? null
  );

  // Recommended counts load asynchronously (localStorage snapshot / ML
  // fetch), so an equipment can move into or out of this pane's list after
  // `selectedEquipment` was set — recompute the effective active item every
  // render instead of syncing it via an effect, falling back to this pane's
  // first item once the previous selection no longer belongs here.
  const activeEquipment =
    selectedEquipment !== null && equipmentList.includes(selectedEquipment)
      ? selectedEquipment
      : (equipmentList[0] ?? null);

  const mlEstimateNote =
    activeEquipment &&
    ML_ESTIMATED_EQUIPMENT_NAMES.has(activeEquipment) &&
    mlPrediction?.[activeEquipment] != null
      ? "AI 추정치가 기본값으로 채워졌습니다 (참고용 — 학습 데이터가 적어 정확도가 낮으니 반드시 직접 확인 후 수정하세요)."
      : undefined;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <h2 className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-500">
        {title} ({equipmentList.length})
      </h2>
      <div className="flex flex-1 overflow-hidden">
        <EquipmentListPanel
          equipmentList={equipmentList}
          selection={selection}
          activeEquipment={activeEquipment}
          onSelectEquipment={setSelectedEquipment}
        />
        <div className="flex-1 overflow-y-auto">
          {activeEquipment ? (
            <ProductPanel
              name={activeEquipment}
              products={EQUIPMENT_PRODUCTS[activeEquipment]}
              selectedValue={selection[activeEquipment]}
              quantity={quantities[activeEquipment]}
              onSelect={(value) => onSelectProduct(activeEquipment, value)}
              onQuantityChange={(quantity) => onQuantityChange(activeEquipment, quantity)}
              mlEstimateNote={mlEstimateNote}
            />
          ) : (
            <p className="p-6 text-sm text-gray-400">해당하는 설비가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
