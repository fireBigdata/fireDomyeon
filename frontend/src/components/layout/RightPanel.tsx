"use client";

import type { Structure } from "@/types/floorplan";
import StructureInfoPanel from "@/components/panels/StructureInfoPanel";

type RightPanelProps = {
  structure: Structure | null;
  scale: number;
  onChange: (id: string, changes: Partial<Structure>) => void;
};

export default function RightPanel({
  structure,
  scale,
  onChange,
}: RightPanelProps) {
  return (
    <aside className="w-64 border-l border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-xs font-medium text-gray-500">구조물 정보</h2>
      <StructureInfoPanel structure={structure} scale={scale} onChange={onChange} />
    </aside>
  );
}
