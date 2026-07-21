"use client";

import type { EquipmentProduct } from "@/types/equipmentSelection";
import type { HydrantSummary } from "@/hooks/useHydrantPlacement";

type HydrantPanelProps = {
  selectedProduct: EquipmentProduct | null;
  error: string | null;
  onAutoPlace: () => void;
  summary: HydrantSummary | null;
};

export default function HydrantPanel({
  selectedProduct,
  error,
  onAutoPlace,
  summary,
}: HydrantPanelProps) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-gray-200 pt-4">
      <label className="mb-1 block text-xs font-medium text-gray-500">
        옥내소화전 자동 배치 (NFPC/NFTC 102)
      </label>

      {selectedProduct ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">선택된 소화전함</span>
          <span className="font-medium text-gray-800">{selectedProduct.name}</span>
        </div>
      ) : (
        <p className="text-xs text-gray-400">
          설비 선택 페이지에서 옥내소화전을 먼저 선택해주세요.
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="button"
        onClick={onAutoPlace}
        disabled={!selectedProduct}
        className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        옥내소화전 자동 배치
      </button>

      {summary && (
        <div className="text-xs text-gray-500">
          <p>
            건물 전체 연면적: {summary.totalBuildingFloorAreaM2.toFixed(1)}㎡ · 총 {summary.floorCount}개 층
          </p>
          {!summary.applicable && <p>{summary.notApplicableReason}</p>}
          {summary.applicable && (
            <>
              <p className="font-medium text-gray-700">배치된 소화전: {summary.totalCount}개</p>
              {summary.byStructure.length > 0 && (
                <ul className="mt-1 flex flex-col gap-0.5">
                  {summary.byStructure.map((s) => (
                    <li key={s.structureId}>
                      {s.label}: {s.count}개
                    </li>
                  ))}
                </ul>
              )}
              {summary.warnings.map((warning, index) => (
                <p key={index} className="mt-1 text-amber-600">
                  ⚠ {warning}
                </p>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
