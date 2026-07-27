"use client";

type AutoPlacementToggleProps = {
  isEnabled: boolean;
  onToggle: () => void;
};

/** Toggles 소방설비 자동 배치 mode: while ON, adding/moving/editing/deleting a
 * structure or 출입구, or adding/복제-ing a floor, automatically re-runs
 * placement for every equipment type on the current floor. While OFF, no
 * equipment is placed automatically and none of it is shown on the canvas
 * (see FloorPlanCanvas's showEquipment prop) — existing placements aren't
 * discarded, so switching back ON picks up where the drawing left off. */
export default function AutoPlacementToggle({ isEnabled, onToggle }: AutoPlacementToggleProps) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
      <span className="text-gray-600">소방설비 자동 배치</span>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={isEnabled}
        className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
          isEnabled
            ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        }`}
      >
        소방설비 자동 배치 {isEnabled ? "ON" : "OFF"}
      </button>
      <span className="text-xs text-gray-400">
        {isEnabled
          ? "구조물/출입구를 추가·이동·수정·삭제하거나 층을 추가·복제하면 소방설비가 자동으로 배치됩니다."
          : "꺼져 있는 동안에는 소방설비가 도면에 표시되지 않습니다."}
      </span>
    </div>
  );
}
