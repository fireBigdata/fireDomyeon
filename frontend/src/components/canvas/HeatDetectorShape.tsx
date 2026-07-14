"use client";

import { Circle, Group, Rect, Text } from "react-konva";
import type Konva from "konva";
import type { HeatDetector } from "@/types/floorplan";

type HeatDetectorShapeProps = {
  detector: HeatDetector;
  roomLabel: string;
  isSelected: boolean;
  onToggleSelect: (id: string | null) => void;
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

  const infoLines = [
    "열 감지기",
    `설치 방: ${roomLabel}`,
    `보호면적: ${detector.coverageArea}m²`,
    `배치 방식: ${detector.isAutoPlaced ? "자동" : "수동"}`,
  ];

  return (
    <Group x={detector.x} y={detector.y}>
      <Circle
        radius={8}
        fill="#f59e0b"
        stroke={isSelected ? "#111827" : "#b45309"}
        strokeWidth={isSelected ? 2 : 1}
        onClick={handleToggle}
        onTap={handleToggle}
      />
      <Text
        text="열"
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
          <Rect width={150} height={84} fill="#111827" opacity={0.92} cornerRadius={4} />
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
