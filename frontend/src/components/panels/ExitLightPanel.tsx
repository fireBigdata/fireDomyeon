"use client";

import { EXIT_LIGHT_CATEGORY_DEFAULTS } from "@/constants/exitLight";
import type { ExitLightSummary } from "@/lib/exitLightPlacement";

type ExitLightPanelProps = {
  onAutoPlace: () => void;
  summary: ExitLightSummary | null;
};

export default function ExitLightPanel({ onAutoPlace, summary }: ExitLightPanelProps) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-gray-200 pt-4">
      <label className="mb-1 block text-xs font-medium text-gray-500">
        유도등 자동 배치
      </label>
      <button
        type="button"
        onClick={onAutoPlace}
        className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
      >
        유도등 자동 배치
      </button>
      {summary && (
        <div className="text-xs text-gray-500">
          <p>
            {EXIT_LIGHT_CATEGORY_DEFAULTS.EXIT.label}: {summary.exitCount}개
          </p>
          <p>
            {EXIT_LIGHT_CATEGORY_DEFAULTS.CORRIDOR.label}: {summary.corridorCount}개
          </p>
          <p>
            {EXIT_LIGHT_CATEGORY_DEFAULTS.STAIRS.label}: {summary.stairsCount}개
          </p>
          <p className="font-medium text-gray-700">총 {summary.totalCount}개</p>
        </div>
      )}
    </div>
  );
}
