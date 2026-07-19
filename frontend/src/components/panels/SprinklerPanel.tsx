"use client";

import type { SprinklerSummary } from "@/hooks/useSprinklerPlacement";
import { SPRINKLER_STATUS_CLASSES, SPRINKLER_STATUS_LABELS } from "@/constants/sprinklerStatus";

type SprinklerPanelProps = {
  onAutoPlace: () => void;
  summary: SprinklerSummary | null;
};

export default function SprinklerPanel({
  onAutoPlace,
  summary,
}: SprinklerPanelProps) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-gray-200 pt-4">
      <label className="mb-1 block text-xs font-medium text-gray-500">
        스프링클러 자동 배치 (NFPC/NFTC 103)
      </label>
      <button
        type="button"
        onClick={onAutoPlace}
        className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
      >
        스프링클러 자동 배치
      </button>
      {summary && !summary.applicable && (
        <p className="text-xs text-gray-500">{summary.notApplicableReason}</p>
      )}
      {summary && summary.applicable && (
        <div className="text-xs text-gray-500">
          <p>배치된 헤드: {summary.totalCount}개</p>
          <ul className="mt-1 flex flex-col gap-1.5">
            {summary.byRoom.map((room) => (
              <li key={room.structureId} className="rounded-md border border-gray-100 p-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-gray-700">{room.label}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${SPRINKLER_STATUS_CLASSES[room.status]}`}
                  >
                    {SPRINKLER_STATUS_LABELS[room.status]}
                  </span>
                </div>
                <p>
                  {room.headCount}개
                  {room.horizontalDistanceM !== null && ` · 수평거리 ${room.horizontalDistanceM}m`}
                </p>
                {room.ruleLabel && <p className="text-gray-400">{room.ruleLabel}</p>}
                {room.warnings.map((warning, index) => (
                  <p key={index} className="text-amber-600">
                    ⚠ {warning}
                  </p>
                ))}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
