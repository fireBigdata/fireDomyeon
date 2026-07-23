"use client";

import { SMOKE_DETECTOR_CATEGORY_DEFAULTS } from "@/constants/smokeDetector";
import type { SmokeDetectorSummary } from "@/lib/smokeDetectorPlacement";

type SmokeDetectorPanelProps = {
  onAutoPlace: () => void;
  summary: SmokeDetectorSummary | null;
};

export default function SmokeDetectorPanel({ onAutoPlace, summary }: SmokeDetectorPanelProps) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-gray-200 pt-4">
      <label className="mb-1 block text-xs font-medium text-gray-500">
        연기 감지기 자동 배치
      </label>
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
          <p className="font-medium text-gray-700">총 {summary.totalCount}개</p>
        </div>
      )}
    </div>
  );
}
