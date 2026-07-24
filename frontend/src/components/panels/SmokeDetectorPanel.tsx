"use client";

import type { EquipmentProduct } from "@/types/equipmentSelection";
import { SMOKE_DETECTOR_CATEGORY_DEFAULTS } from "@/constants/smokeDetector";
import type { SmokeDetectorSummary } from "@/lib/smokeDetectorPlacement";

type SmokeDetectorPanelProps = {
  selectedProduct: EquipmentProduct | null;
  error: string | null;
  onAutoPlace: () => void;
  summary: SmokeDetectorSummary | null;
};

export default function SmokeDetectorPanel({
  selectedProduct,
  error,
  onAutoPlace,
  summary,
}: SmokeDetectorPanelProps) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-gray-200 pt-4">
      <label className="mb-1 block text-xs font-medium text-gray-500">
        연기 감지기 자동 배치
      </label>

      <div className="flex flex-col gap-0.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">연기감지기</span>
          <span className="font-medium text-gray-800">
            {selectedProduct ? selectedProduct.name : "미선택"}
          </span>
        </div>
        {selectedProduct && (
          <div className="flex items-center justify-between">
            <span className="text-gray-500">보호면적</span>
            <span className="font-medium text-gray-800">
              {selectedProduct.abilityUnit != null ? `${selectedProduct.abilityUnit}㎡` : "미등록"}
            </span>
          </div>
        )}
      </div>
      {!selectedProduct && (
        <p className="text-xs text-gray-400">
          공동주택 세대 내 침실·거실 배치에는 설비 선택 페이지에서 연기감지기를 먼저 선택해주세요.
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="button"
        onClick={onAutoPlace}
        className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
      >
        연기 감지기 자동 배치
      </button>
      {summary && (
        <div className="text-xs text-gray-500">
          <p>
            {SMOKE_DETECTOR_CATEGORY_DEFAULTS.CORRIDOR.label}: {summary.corridorCount}개
          </p>
          <p>
            {SMOKE_DETECTOR_CATEGORY_DEFAULTS.STAIRS.label}: {summary.stairsCount}개
          </p>
          <p>
            {SMOKE_DETECTOR_CATEGORY_DEFAULTS.ELEVATOR.label}: {summary.elevatorCount}개
          </p>
          <p>
            {SMOKE_DETECTOR_CATEGORY_DEFAULTS.ROOM.label}: {summary.roomCount}개
          </p>
          <p className="font-medium text-gray-700">총 {summary.totalCount}개</p>
        </div>
      )}
    </div>
  );
}
