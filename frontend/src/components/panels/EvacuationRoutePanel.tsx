"use client";

type EvacuationRoutePanelProps = {
  isActive: boolean;
  onToggle: () => void;
};

/** Toggles 피난동선 표시 mode: while ON, hovering a structure on the canvas
 * draws its shortest route — through doors only — to the nearest 공동현관/
 * 비상구 (see lib/evacuationRoute.ts). */
export default function EvacuationRoutePanel({ isActive, onToggle }: EvacuationRoutePanelProps) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
      <span className="text-gray-600">피난동선 표시</span>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={isActive}
        className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
          isActive
            ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        }`}
      >
        피난동선 표시 {isActive ? "ON" : "OFF"}
      </button>
      {isActive && (
        <span className="text-xs text-gray-400">
          구조물에 마우스를 올리면 공동현관·비상구까지의 최단 대피 동선을 표시합니다.
        </span>
      )}
    </div>
  );
}
