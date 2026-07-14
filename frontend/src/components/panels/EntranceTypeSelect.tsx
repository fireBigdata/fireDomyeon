"use client";

import { EntranceType } from "@/types/floorplan";
import { ENTRANCE_TYPE_DEFAULTS, ENTRANCE_TYPE_ORDER } from "@/constants/entranceTypes";

type EntranceTypeSelectProps = {
  value: EntranceType;
  onChange: (value: EntranceType) => void;
  className?: string;
};

export default function EntranceTypeSelect({
  value,
  onChange,
  className,
}: EntranceTypeSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as EntranceType)}
      className={
        className ??
        "w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
      }
    >
      {ENTRANCE_TYPE_ORDER.map((type) => (
        <option key={type} value={type}>
          {ENTRANCE_TYPE_DEFAULTS[type].label}
        </option>
      ))}
    </select>
  );
}
