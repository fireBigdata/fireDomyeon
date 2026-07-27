"use client";

import { EQUIPMENT_ICONS } from "@/constants/equipmentProducts";
import type { EquipmentName } from "@/types/equipmentSelection";

type EquipmentProgressSummaryProps = {
  completedCount: number;
  totalCount: number;
  remainingNames: EquipmentName[];
};

// Keeps the remaining-equipment row a single line instead of wrapping into a
// tall block — anything past this count collapses into a "+N개" chip.
const MAX_REMAINING_SHOWN = 6;

/**
 * Sits where the old full equipment/count table used to (see
 * RequiredEquipmentSummaryTable) — shows only how far along the required
 * equipment is, not a listing of every equipment type, so the top of the
 * page reads as a status bar instead of a data table.
 */
export default function EquipmentProgressSummary({
  completedCount,
  totalCount,
  remainingNames,
}: EquipmentProgressSummaryProps) {
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const shown = remainingNames.slice(0, MAX_REMAINING_SHOWN);
  const hiddenCount = remainingNames.length - shown.length;

  if (totalCount === 0) {
    return (
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-5xl text-sm text-gray-400">
          아직 필수로 계산된 설비가 없습니다. 도면을 먼저 작성해주세요.
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">필수 설비 진행률</span>
            <span className="font-semibold text-gray-900 tabular-nums">
              {completedCount} / {totalCount} 완료
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {shown.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5 sm:max-w-sm">
            <span className="text-xs font-medium text-gray-400">남은 설비</span>
            {shown.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
              >
                <span aria-hidden="true">{EQUIPMENT_ICONS[name]}</span>
                {name}
              </span>
            ))}
            {hiddenCount > 0 && <span className="text-xs text-gray-400">+{hiddenCount}개</span>}
          </div>
        ) : (
          totalCount > 0 && (
            <span className="text-xs font-medium text-emerald-600">
              모든 필수 설비를 선택했습니다 🎉
            </span>
          )
        )}
      </div>
    </div>
  );
}
