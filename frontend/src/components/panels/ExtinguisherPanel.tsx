"use client";

import { EXTINGUISHER_TYPES } from "@/constants/extinguisherTypes";
import { formatArea } from "@/lib/area";

type ExtinguisherPanelProps = {
  typeId: string;
  onTypeChange: (id: string) => void;
  onAutoPlace: () => void;
  summary: { totalArea: number; requiredCount: number } | null;
};

export default function ExtinguisherPanel({
  typeId,
  onTypeChange,
  onAutoPlace,
  summary,
}: ExtinguisherPanelProps) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-gray-200 pt-4">
      <label className="mb-1 block text-xs font-medium text-gray-500">
        소화기 자동 배치
      </label>
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
      <button
        type="button"
        onClick={onAutoPlace}
        className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
      >
        Auto Place Extinguishers
      </button>
      {summary && (
        <div className="text-xs text-gray-500">
          바닥 면적 {formatArea(summary.totalArea)} · 필요 개수{" "}
          {summary.requiredCount}개
        </div>
      )}
    </div>
  );
}
