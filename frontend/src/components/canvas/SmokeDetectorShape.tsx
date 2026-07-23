"use client";

import { Circle, Group, Rect, Text } from "react-konva";
import type Konva from "konva";
import type { SmokeDetector } from "@/types/smokeDetector";
import { SMOKE_DETECTOR_CATEGORY_DEFAULTS } from "@/constants/smokeDetector";

type SmokeDetectorShapeProps = {
  detector: SmokeDetector;
  structureLabel: string;
  isSelected: boolean;
  onToggleSelect: (id: string | null) => void;
};

export default function SmokeDetectorShape({
  detector,
  structureLabel,
  isSelected,
  onToggleSelect,
}: SmokeDetectorShapeProps) {
  const handleToggle = (e: Konva.KonvaEventObject<Event>) => {
    e.cancelBubble = true;
    onToggleSelect(isSelected ? null : detector.id);
  };

  const appearance = SMOKE_DETECTOR_CATEGORY_DEFAULTS[detector.category];

  const infoLines = [
    appearance.label,
    `설치 위치: ${structureLabel}`,
    `배치 방식: ${detector.isAutoPlaced ? "자동" : "수동"}`,
  ];

  return (
    <Group x={detector.x} y={detector.y}>
      <Circle
        radius={8}
        fill={appearance.color}
        stroke={isSelected ? "#111827" : "#ffffff"}
        strokeWidth={isSelected ? 2 : 1}
        onClick={handleToggle}
        onTap={handleToggle}
      />
      <Text
        text={appearance.shortLabel}
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
        // Anchored below-right of the marker, mirroring ExitLightShape's
        // tooltip so it doesn't get clipped by the stage's top edge.
        <Group x={12} y={12} listening={false}>
          <Rect width={170} height={68} fill="#111827" opacity={0.85} cornerRadius={4} />
          <Text
            text={infoLines.join("\n")}
            width={170}
            height={68}
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
