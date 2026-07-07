"use client";

import dynamic from "next/dynamic";

const DynamicFloorPlanCanvas = dynamic(() => import("./FloorPlanCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] w-[900px] items-center justify-center rounded-md border border-gray-300 bg-white text-sm text-gray-400">
      캔버스 로딩 중...
    </div>
  ),
});

export default DynamicFloorPlanCanvas;
