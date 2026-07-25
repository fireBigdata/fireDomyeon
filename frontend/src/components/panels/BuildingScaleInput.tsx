"use client";

import type { FloorPlanState } from "@/types/floorplan";

export type BuildingScaleFields = Pick<
  FloorPlanState,
  | "buildingGroundFloorCount"
  | "buildingBasementFloorCount"
  | "buildingAreaSqm"
  | "buildingTotalFloorAreaSqm"
  | "buildingSiteAreaSqm"
>;

type BuildingScaleInputProps = {
  value: BuildingScaleFields;
  onChange: (patch: Partial<BuildingScaleFields>) => void;
};

const FIELDS: { key: keyof BuildingScaleFields; label: string; unit: string }[] = [
  { key: "buildingAreaSqm", label: "건축면적", unit: "㎡" },
  { key: "buildingTotalFloorAreaSqm", label: "연면적", unit: "㎡" },
  { key: "buildingSiteAreaSqm", label: "대지면적", unit: "㎡" },
];

/** Building-scale inputs used only to estimate 예비펌프/주펌프/충압펌프/
 * 급기팬/배기팬/자동폐쇄장치/발신기 counts via lib/api.ts predictEquipmentCounts
 * — this app has no drawing-based placement logic for those 7 types.
 * 지상층수/지하층수 are auto-derived from FloorBar's 지상 marker (see
 * lib/floorOrder.ts) rather than typed here — shown read-only for context. */
export default function BuildingScaleInput({ value, onChange }: BuildingScaleInputProps) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
      <span className="text-gray-600">건물 규모 (AI 설비 개수 추정용)</span>
      <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
        <span>지상/지하 층수 (FloorBar에서 자동 계산)</span>
        <span className="text-gray-700">
          지상 {value.buildingGroundFloorCount ?? 0}층 · 지하{" "}
          {value.buildingBasementFloorCount ?? 0}층
        </span>
      </div>
      {FIELDS.map(({ key, label, unit }) => (
        <label key={key} className="flex items-center justify-between gap-2 text-xs text-gray-500">
          {label}
          <span className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              value={value[key] ?? ""}
              onChange={(e) => {
                const raw = e.target.value;
                onChange({ [key]: raw === "" ? undefined : Math.max(0, Number(raw)) });
              }}
              className="w-20 rounded-md border border-gray-300 px-2 py-1 text-xs"
            />
            {unit}
          </span>
        </label>
      ))}
      <span className="text-xs text-gray-400">
        예비펌프·급배기팬·자동폐쇄장치·발신기 개수를 AI로 추정하는 데만 쓰입니다(참고용).
      </span>
    </div>
  );
}
