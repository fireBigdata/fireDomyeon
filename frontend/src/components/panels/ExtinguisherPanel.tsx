"use client";

import type { FacilityType } from "@/types/floorplan";
import type { EquipmentProduct } from "@/types/equipmentSelection";
import type { ExtinguisherSummary } from "@/hooks/useExtinguisherPlacement";
import { FACILITY_TYPE_LABELS } from "@/constants/structureDefaults";

type ExtinguisherPanelProps = {
  facilityType: FacilityType;
  selectedProduct: EquipmentProduct | null;
  error: string | null;
  onAutoPlace: () => void;
  summary: ExtinguisherSummary | null;
};

export default function ExtinguisherPanel({
  facilityType,
  selectedProduct,
  error,
  onAutoPlace,
  summary,
}: ExtinguisherPanelProps) {
  const hasAbilityUnit = (selectedProduct?.abilityUnit ?? 0) > 0;
  const canPlace = !!selectedProduct && hasAbilityUnit;

  return (
    <div className="flex flex-col gap-1.5 border-t border-gray-200 pt-4">
      <label className="mb-1 block text-xs font-medium text-gray-500">
        소화기 자동 배치
      </label>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">시설물 유형</span>
        <span className="font-medium text-gray-800">
          {FACILITY_TYPE_LABELS[facilityType]}
        </span>
      </div>

      {selectedProduct ? (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">선택된 소화기</span>
            <span className="font-medium text-gray-800">{selectedProduct.name}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">소화기 1개당 능력단위</span>
            <span className="font-medium text-gray-800">
              {selectedProduct.abilityUnit != null
                ? `${selectedProduct.abilityUnit}단위`
                : "미등록"}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400">
          설비 선택 페이지에서 소화기를 먼저 선택해주세요.
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="button"
        onClick={onAutoPlace}
        disabled={!canPlace}
        className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        소화기 자동 배치
      </button>

      {summary && (
        <div className="text-xs text-gray-500">
          <p>전체 바닥면적: {summary.totalFloorArea.toFixed(1)}㎡</p>
          <p>소화기 1개당 능력단위: {summary.abilityUnitsPerExtinguisher}단위</p>
          <p>필요 능력단위: {summary.requiredAbilityUnits}단위</p>
          <p>면적 기준 최소 개수: {summary.minimumCountByArea}개</p>
          <p>20m 조건으로 추가된 개수: {summary.addedByDistanceRule}개</p>
          <p className="font-medium text-gray-700">
            20m 조건 반영 최종 개수: {summary.finalCount}개
          </p>
          {summary.byStructure.length > 0 && (
            <ul className="mt-1 flex flex-col gap-0.5">
              {summary.byStructure.map((s) => (
                <li key={s.structureId}>
                  {s.label}: {s.count}개
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
