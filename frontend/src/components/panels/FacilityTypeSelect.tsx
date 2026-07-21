"use client";

import type { FacilityType } from "@/types/floorplan";
import { FACILITY_TYPE_LABELS, FACILITY_TYPE_ORDER } from "@/constants/structureDefaults";

type FacilityTypeSelectProps = {
  value: FacilityType;
  onChange: (value: FacilityType) => void;
};

export default function FacilityTypeSelect({
  value,
  onChange,
}: FacilityTypeSelectProps) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-500">
        시설물 유형
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as FacilityType)}
        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
      >
        {FACILITY_TYPE_ORDER.map((type) => (
          <option key={type} value={type}>
            {FACILITY_TYPE_LABELS[type]}
          </option>
        ))}
      </select>
    </div>
  );
}
