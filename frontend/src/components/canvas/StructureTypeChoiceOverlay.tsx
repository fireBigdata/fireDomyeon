"use client";

export type StructureTypeChoiceOption = {
  value: string;
  label: string;
  fill: string;
  stroke: string;
};

type StructureTypeChoiceOverlayProps = {
  /** Screen-space point (relative to the canvas wrapper) to center the ring of options on. */
  centerX: number;
  centerY: number;
  /** Distance from the center to each option circle. */
  radius: number;
  /** Diameter of each option circle. */
  optionSize: number;
  options: StructureTypeChoiceOption[];
  onChoose: (value: string) => void;
  onCancel: () => void;
};

/** Floating "round checkbox" (radio) picker shown right after a drag creates
 * a structure's rectangle: options ring around the cursor's drop point so
 * the user can pick a 용도 without moving the mouse far. */
export default function StructureTypeChoiceOverlay({
  centerX,
  centerY,
  radius,
  optionSize,
  options,
  onChoose,
  onCancel,
}: StructureTypeChoiceOverlayProps) {
  return (
    <div
      className="absolute z-20"
      style={{ left: centerX, top: centerY, width: 0, height: 0 }}
    >
      <button
        type="button"
        onClick={onCancel}
        aria-label="취소"
        className="absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-300 bg-white text-xs text-gray-400 shadow-md hover:bg-gray-50 hover:text-gray-600"
      >
        ✕
      </button>
      {options.map((option, index) => {
        const angle = (index / options.length) * 2 * Math.PI - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChoose(option.value)}
            title={option.label}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border-2 p-1 text-center text-[10px] font-medium leading-tight break-keep text-gray-800 shadow-md transition-transform hover:z-10 hover:scale-110"
            style={{
              left: x,
              top: y,
              width: optionSize,
              height: optionSize,
              backgroundColor: option.fill,
              borderColor: option.stroke,
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
