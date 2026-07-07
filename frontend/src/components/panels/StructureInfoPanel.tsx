"use client";

import type { Structure } from "@/types/floorplan";
import { STRUCTURE_DEFAULTS } from "@/constants/structureDefaults";

type StructureInfoPanelProps = {
  structure: Structure | null;
  scale: number;
  onChange: (id: string, changes: Partial<Structure>) => void;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}

export default function StructureInfoPanel({
  structure,
  scale,
  onChange,
}: StructureInfoPanelProps) {
  if (!structure) {
    return (
      <div className="text-sm text-gray-400">
        캔버스에서 구조물을 선택하면 정보가 표시됩니다.
      </div>
    );
  }

  const area = structure.width * structure.height * scale;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-gray-800">
        {STRUCTURE_DEFAULTS[structure.type].label}
      </h3>

      <InfoRow label="x" value={structure.x.toFixed(0)} />
      <InfoRow label="y" value={structure.y.toFixed(0)} />

      <label className="flex items-center justify-between text-sm">
        <span className="text-gray-500">width</span>
        <input
          type="number"
          min={10}
          value={Math.round(structure.width)}
          onChange={(e) =>
            onChange(structure.id, {
              width: Math.max(10, Number(e.target.value) || 10),
            })
          }
          className="w-24 rounded-md border border-gray-300 px-2 py-1 text-right text-sm"
        />
      </label>

      <label className="flex items-center justify-between text-sm">
        <span className="text-gray-500">height</span>
        <input
          type="number"
          min={10}
          value={Math.round(structure.height)}
          onChange={(e) =>
            onChange(structure.id, {
              height: Math.max(10, Number(e.target.value) || 10),
            })
          }
          className="w-24 rounded-md border border-gray-300 px-2 py-1 text-right text-sm"
        />
      </label>

      <InfoRow label="면적" value={area.toFixed(1)} />
    </div>
  );
}
