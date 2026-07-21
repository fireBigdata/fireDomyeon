"use client";

import { Circle, Group, Rect, Text } from "react-konva";
import type Konva from "konva";
import type { HydrantPlacement } from "@/types/hydrant";

type HydrantShapeProps = {
  hydrant: HydrantPlacement;
  structureLabel: string;
  isSelected: boolean;
  onToggleSelect: (id: string | null) => void;
};

// Teal, distinct from extinguisher's red and heat detector's amber/red, so
// hydrants installed near extinguishers along the same corridor wall stay
// visually distinguishable.
const FILL = "#0f766e";
const STROKE = "#115e59";

export default function HydrantShape({
  hydrant,
  structureLabel,
  isSelected,
  onToggleSelect,
}: HydrantShapeProps) {
  const handleToggle = (e: Konva.KonvaEventObject<Event>) => {
    e.cancelBubble = true;
    onToggleSelect(isSelected ? null : hydrant.id);
  };

  const infoLines = [
    "옥내소화전",
    `설치 위치: ${structureLabel}`,
    `배치 방식: ${hydrant.isAutoPlaced ? "자동" : "수동"}`,
  ];

  return (
    <Group x={hydrant.x} y={hydrant.y}>
      <Circle
        radius={10}
        fill={FILL}
        stroke={isSelected ? "#111827" : STROKE}
        strokeWidth={isSelected ? 2 : 1}
        onClick={handleToggle}
        onTap={handleToggle}
      />
      <Text
        text="전"
        width={20}
        height={20}
        offsetX={10}
        offsetY={10}
        align="center"
        verticalAlign="middle"
        fontSize={10}
        fill="#ffffff"
        listening={false}
      />
      {isSelected && (
        // Anchored below-right of the marker, matching HeatDetectorShape/
        // ExitLightShape/SprinklerHeadShape's tooltip placement.
        <Group x={12} y={12} listening={false}>
          <Rect width={150} height={62} fill="#111827" opacity={0.85} cornerRadius={4} />
          <Text
            text={infoLines.join("\n")}
            width={150}
            height={62}
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
