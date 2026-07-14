"use client";

import { formatArea } from "@/lib/area";

type AreaSummaryProps = {
  totalArea: number;
  structureCount: number;
};

export default function AreaSummary({
  totalArea,
  structureCount,
}: AreaSummaryProps) {
  return (
    <div className="flex items-center gap-4 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm">
      <span className="text-gray-500">
        구조물 <span className="font-medium text-gray-800">{structureCount}</span>개
      </span>
      <span className="text-gray-500">
        전체 면적{" "}
        <span className="font-medium text-gray-800">
          {formatArea(totalArea)}
        </span>
      </span>
    </div>
  );
}
