"use client";

export type StructureTypeChoiceOption = {
  value: string;
  label: string;
  fill: string;
  stroke: string;
};

type StructureTypeChoiceOverlayProps = {
  left: number;
  top: number;
  options: StructureTypeChoiceOption[];
  onChoose: (value: string) => void;
  onCancel: () => void;
};

/** Floating "round checkbox" (radio) picker shown right after a drag creates
 * a structure's rectangle, letting the user pick its 용도 before it's saved. */
export default function StructureTypeChoiceOverlay({
  left,
  top,
  options,
  onChoose,
  onCancel,
}: StructureTypeChoiceOverlayProps) {
  return (
    <div
      className="absolute z-20 w-44 rounded-md border border-gray-300 bg-white p-2 shadow-lg"
      style={{ left, top }}
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">용도 선택</span>
        <button
          type="button"
          onClick={onCancel}
          aria-label="취소"
          className="rounded px-1 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
      <div className="flex flex-col gap-0.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChoose(option.value)}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-gray-50"
          >
            <span
              className="inline-block h-4 w-4 flex-shrink-0 rounded-full border-2"
              style={{ backgroundColor: option.fill, borderColor: option.stroke }}
            />
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
