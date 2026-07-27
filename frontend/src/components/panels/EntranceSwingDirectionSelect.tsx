"use client";

import { EntranceSwingDirection } from "@/types/floorplan";
import {
  ENTRANCE_SWING_DIRECTION_DEFAULTS,
  ENTRANCE_SWING_DIRECTION_ORDER,
} from "@/constants/entranceSwing";

// Sentinel <option> value for "미닫이 (방향 없음)" — a sliding door has no
// hinge, so it's represented as entranceSwingDirection === undefined (see
// StructureShape, which only renders the EntranceSwingArc when a direction
// is set). The native <select> element needs a real string value for that
// option, so this is translated back to/from undefined at the boundary.
const NONE_VALUE = "NONE";

type EntranceSwingDirectionSelectProps = {
  value: EntranceSwingDirection | undefined;
  onChange: (value: EntranceSwingDirection | undefined) => void;
  className?: string;
};

export default function EntranceSwingDirectionSelect({
  value,
  onChange,
  className,
}: EntranceSwingDirectionSelectProps) {
  return (
    <select
      value={value ?? NONE_VALUE}
      onChange={(e) =>
        onChange(
          e.target.value === NONE_VALUE
            ? undefined
            : (e.target.value as EntranceSwingDirection)
        )
      }
      className={
        className ??
        "w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
      }
    >
      <option value={NONE_VALUE}>미닫이 (방향 없음)</option>
      {ENTRANCE_SWING_DIRECTION_ORDER.map((direction) => (
        <option key={direction} value={direction}>
          {ENTRANCE_SWING_DIRECTION_DEFAULTS[direction].label}
        </option>
      ))}
    </select>
  );
}
