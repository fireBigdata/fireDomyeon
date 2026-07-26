"use client";

import { Wedge } from "react-konva";
import { EntranceSwingDirection } from "@/types/floorplan";
import { getEntranceSwingGeometry, getEntranceSwingRadius } from "@/lib/entranceSwing";

type EntranceSwingArcProps = {
  width: number;
  height: number;
  direction: EntranceSwingDirection;
};

/** The 부채꼴 (quarter-circle) door-swing symbol: hinged at one corner of the
 * entrance's own rect, sweeping 90° into the quadrant the door opens toward. */
export default function EntranceSwingArc({ width, height, direction }: EntranceSwingArcProps) {
  const { apexX, apexY, rotation } = getEntranceSwingGeometry(direction, width, height);
  const radius = getEntranceSwingRadius(width, height);
  return (
    <Wedge
      x={apexX}
      y={apexY}
      radius={radius}
      angle={90}
      rotation={rotation}
      fill="rgba(107,114,128,0.12)"
      stroke="#6b7280"
      strokeWidth={1}
      dash={[4, 3]}
      listening={false}
    />
  );
}
