"use client";

import type { EquipmentProduct } from "@/types/equipmentSelection";
import type { HeatDetectorSummary } from "@/hooks/useHeatDetectorPlacement";

type HeatDetectorPanelProps = {
  differentialProduct: EquipmentProduct | null;
  fixedTemperatureProduct: EquipmentProduct | null;
  error: string | null;
  onAutoPlace: () => void;
  summary: HeatDetectorSummary | null;
};

function ProductRow({
  label,
  product,
}: {
  label: string;
  product: EquipmentProduct | null;
}) {
  return (
    <div className="flex flex-col gap-0.5 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium text-gray-800">
          {product ? product.name : "미선택"}
        </span>
      </div>
      {product && (
        <div className="flex items-center justify-between">
          <span className="text-gray-500">보호면적</span>
          <span className="font-medium text-gray-800">
            {product.abilityUnit != null ? `${product.abilityUnit}㎡` : "미등록"}
          </span>
        </div>
      )}
    </div>
  );
}

export default function HeatDetectorPanel({
  differentialProduct,
  fixedTemperatureProduct,
  error,
  onAutoPlace,
  summary,
}: HeatDetectorPanelProps) {
  const canPlace =
    !!differentialProduct &&
    !!fixedTemperatureProduct &&
    (differentialProduct.abilityUnit ?? 0) > 0 &&
    (fixedTemperatureProduct.abilityUnit ?? 0) > 0;

  return (
    <div className="flex flex-col gap-1.5 border-t border-gray-200 pt-4">
      <label className="mb-1 block text-xs font-medium text-gray-500">
        열 감지기 자동 배치
      </label>

      <ProductRow label="차동식열감지기" product={differentialProduct} />
      <ProductRow label="정온식열감지기" product={fixedTemperatureProduct} />
      {!differentialProduct || !fixedTemperatureProduct ? (
        <p className="text-xs text-gray-400">
          설비 선택 페이지에서 차동식/정온식열감지기를 먼저 선택해주세요.
        </p>
      ) : null}
      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="button"
        onClick={onAutoPlace}
        disabled={!canPlace}
        className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
      >
        열 감지기 자동 배치
      </button>
      {summary && (
        <div className="text-xs text-gray-500">
          <p>
            전체 방 면적: {summary.totalArea.toFixed(1)}㎡ · 필요한 감지기:{" "}
            {summary.totalCount}개
          </p>
          <ul className="mt-1 flex flex-col gap-0.5">
            {summary.byRoom.map((room) => (
              <li key={room.roomId}>
                {room.label} ({room.typeLabel}): {room.count}개
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
