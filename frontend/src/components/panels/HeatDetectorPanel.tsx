"use client";

import type { HeatDetectorSummary } from "@/hooks/useHeatDetectorPlacement";

type HeatDetectorPanelProps = {
  coverageAreaInput: string;
  onCoverageAreaChange: (value: string) => void;
  error: string | null;
  onAutoPlace: () => void;
  summary: HeatDetectorSummary | null;
};

export default function HeatDetectorPanel({
  coverageAreaInput,
  onCoverageAreaChange,
  error,
  onAutoPlace,
  summary,
}: HeatDetectorPanelProps) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-gray-200 pt-4">
      <label className="mb-1 block text-xs font-medium text-gray-500">
        열 감지기 자동 배치
      </label>
      <label className="flex items-center gap-2 text-sm">
        <span className="text-gray-500">보호면적</span>
        <input
          type="number"
          step="0.1"
          value={coverageAreaInput}
          onChange={(e) => onCoverageAreaChange(e.target.value)}
          aria-invalid={!!error}
          className="w-20 rounded-md border border-gray-300 px-2 py-1 text-right text-sm aria-[invalid=true]:border-red-400"
        />
        <span className="text-gray-500">m²당 1개</span>
      </label>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="button"
        onClick={onAutoPlace}
        disabled={!!error}
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
