"use client";

import type { FacilityType } from "@/types/floorplan";
import type { ExtinguisherSummary } from "@/hooks/useExtinguisherPlacement";
import { EXTINGUISHER_TYPES } from "@/constants/extinguisherTypes";

const PANEL_FACILITY_LABELS: Record<FacilityType, string> = {
  apartment: "아파트",
  house: "아파트 외",
};

type ExtinguisherPanelProps = {
  facilityType: FacilityType;
  typeId: string;
  onTypeChange: (id: string) => void;
  abilityUnitsInput: string;
  onAbilityUnitsChange: (value: string) => void;
  error: string | null;
  onAutoPlace: () => void;
  summary: ExtinguisherSummary | null;
};

export default function ExtinguisherPanel({
  facilityType,
  typeId,
  onTypeChange,
  abilityUnitsInput,
  onAbilityUnitsChange,
  error,
  onAutoPlace,
  summary,
}: ExtinguisherPanelProps) {
  const isApartment = facilityType === "apartment";

  return (
    <div className="flex flex-col gap-1.5 border-t border-gray-200 pt-4">
      <label className="mb-1 block text-xs font-medium text-gray-500">
        소화기 자동 배치
      </label>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">건물 유형</span>
        <span className="font-medium text-gray-800">
          {PANEL_FACILITY_LABELS[facilityType]}
        </span>
      </div>

      <select
        value={typeId}
        onChange={(e) => onTypeChange(e.target.value)}
        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
      >
        {EXTINGUISHER_TYPES.map((type) => (
          <option key={type.id} value={type.id}>
            {type.name}
          </option>
        ))}
      </select>

      {!isApartment && (
        <label className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">소화기 1개당 능력단위</span>
          <input
            type="number"
            step="0.1"
            value={abilityUnitsInput}
            onChange={(e) => onAbilityUnitsChange(e.target.value)}
            aria-invalid={!!error}
            className="w-16 rounded-md border border-gray-300 px-2 py-1 text-right text-sm aria-[invalid=true]:border-red-400"
          />
          <span className="text-gray-500">단위</span>
        </label>
      )}
      {!isApartment && error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="button"
        onClick={onAutoPlace}
        disabled={!isApartment && !!error}
        className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        소화기 자동 배치
      </button>

      {summary && summary.facilityType === "house" && (
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

      {summary && summary.facilityType === "apartment" && (
        <div className="text-xs text-gray-500">
          <p>거실 설치 개수: {summary.livingRoomCount}개</p>
          <p>복도 설치 개수: {summary.corridorCount}개</p>
          <p className="font-medium text-gray-700">
            최종 설치 개수: {summary.finalCount}개
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
