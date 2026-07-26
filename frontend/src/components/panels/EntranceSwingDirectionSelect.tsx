"use client";

import { EntranceSwingDirection } from "@/types/floorplan";
import {
  ENTRANCE_SWING_DIRECTION_DEFAULTS,
  ENTRANCE_SWING_DIRECTION_ORDER,
} from "@/constants/entranceSwing";

type EntranceSwingDirectionSelectProps = {
  value: EntranceSwingDirection;
  onChange: (value: EntranceSwingDirection) => void;
  className?: string;
};

export default function EntranceSwingDirectionSelect({
  value,
  onChange,
  className,
}: EntranceSwingDirectionSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as EntranceSwingDirection)}
      className={
        className ??
        "w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
      }
    >
      {ENTRANCE_SWING_DIRECTION_ORDER.map((direction) => (
        <option key={direction} value={direction}>
          {ENTRANCE_SWING_DIRECTION_DEFAULTS[direction].label}
        </option>
      ))}
    </select>
  );
}
