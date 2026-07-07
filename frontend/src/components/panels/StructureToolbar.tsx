"use client";

import type { StructureType } from "@/types/floorplan";
import {
  STRUCTURE_DEFAULTS,
  STRUCTURE_TYPE_ORDER,
} from "@/constants/structureDefaults";

type StructureToolbarProps = {
  onAdd: (type: StructureType) => void;
};

export default function StructureToolbar({ onAdd }: StructureToolbarProps) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-500">
        구조물 추가
      </label>
      <div className="flex flex-col gap-1.5">
        {STRUCTURE_TYPE_ORDER.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onAdd(type)}
            className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-left text-sm hover:bg-gray-50"
          >
            <span
              className="inline-block h-3 w-3 rounded-sm border"
              style={{
                backgroundColor: STRUCTURE_DEFAULTS[type].fill,
                borderColor: STRUCTURE_DEFAULTS[type].stroke,
              }}
            />
            {STRUCTURE_DEFAULTS[type].label}
          </button>
        ))}
      </div>
    </div>
  );
}
