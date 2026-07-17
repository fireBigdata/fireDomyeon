"use client";

import { Circle, Group, Rect, Text } from "react-konva";
import type Konva from "konva";
import { HeatDetectorType, type HeatDetector } from "@/types/floorplan";
import { HEAT_DETECTOR_TYPE_LABELS } from "@/constants/heatDetectorTypes";

type HeatDetectorShapeProps = {
  detector: HeatDetector;
  roomLabel: string;
  isSelected: boolean;
  onToggleSelect: (id: string | null) => void;
};

// Fixed-temperature (정온식) detectors get a distinct color/glyph so the
// two detector types installed side by side stay visually distinguishable.
const MARKER_BY_TYPE: Record<HeatDetectorType, { fill: string; stroke: string; glyph: string }> = {
  [HeatDetectorType.DIFFERENTIAL]: { fill: "#f59e0b", stroke: "#b45309", glyph: "차" },
  [HeatDetectorType.FIXED_TEMPERATURE]: { fill: "#dc2626", stroke: "#991b1b", glyph: "정" },
};

export default function HeatDetectorShape({
  detector,
  roomLabel,
  isSelected,
  onToggleSelect,
}: HeatDetectorShapeProps) {
  const handleToggle = (e: Konva.KonvaEventObject<Event>) => {
    e.cancelBubble = true;
    onToggleSelect(isSelected ? null : detector.id);
  };

  const marker = MARKER_BY_TYPE[detector.type];
  const typeLabel = HEAT_DETECTOR_TYPE_LABELS[detector.type];

  const infoLines = [
    `열 감지기 (${typeLabel})`,
    `설치 방: ${roomLabel}`,
    `보호면적: ${detector.coverageArea}m²`,
    `배치 방식: ${detector.isAutoPlaced ? "자동" : "수동"}`,
  ];

  return (
    <Group x={detector.x} y={detector.y}>
      <Circle
        radius={8}
        fill={marker.fill}
        stroke={isSelected ? "#111827" : marker.stroke}
        strokeWidth={isSelected ? 2 : 1}
        onClick={handleToggle}
        onTap={handleToggle}
      />
      <Text
        text={marker.glyph}
        width={16}
        height={16}
        offsetX={8}
        offsetY={8}
        align="center"
        verticalAlign="middle"
        fontSize={9}
        fill="#ffffff"
        listening={false}
      />
      {isSelected && (
        // Anchored below-right of the marker (rather than above) since
        // markers commonly sit near the top of the canvas, where an
        // upward tooltip would be clipped by the stage's top edge.
        <Group x={12} y={12} listening={false}>
          <Rect width={150} height={84} fill="#111827" opacity={0.85} cornerRadius={4} />
          <Text
            text={infoLines.join("\n")}
            width={150}
            height={84}
            padding={8}
            fontSize={11}
            lineHeight={1.5}
            fill="#ffffff"
          />
        </Group>
      )}
    </Group>
  );
}
