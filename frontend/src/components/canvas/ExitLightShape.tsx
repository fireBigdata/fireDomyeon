"use client";

import { Circle, Group, Rect, Text } from "react-konva";
import type Konva from "konva";
import type { ExitLight } from "@/types/exitLight";
import { EXIT_LIGHT_CATEGORY_DEFAULTS } from "@/constants/exitLight";

type ExitLightShapeProps = {
  light: ExitLight;
  structureLabel: string;
  isSelected: boolean;
  onToggleSelect: (id: string | null) => void;
};

export default function ExitLightShape({
  light,
  structureLabel,
  isSelected,
  onToggleSelect,
}: ExitLightShapeProps) {
  const handleToggle = (e: Konva.KonvaEventObject<Event>) => {
    e.cancelBubble = true;
    onToggleSelect(isSelected ? null : light.id);
  };

  const appearance = EXIT_LIGHT_CATEGORY_DEFAULTS[light.category];

  const infoLines = [
    appearance.label,
    `설치 위치: ${structureLabel}`,
    `설치 사유: ${light.isBendPoint ? "꺾이는 지점" : "간격 기준(20m)"}`,
    `배치 방식: ${light.isAutoPlaced ? "자동" : "수동"}`,
  ];

  return (
    <Group x={light.x} y={light.y}>
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
        // Anchored below-right of the marker (rather than above), mirroring
        // HeatDetectorShape's tooltip so it doesn't get clipped by the
        // stage's top edge.
        <Group x={12} y={12} listening={false}>
          <Rect width={170} height={84} fill="#111827" opacity={0.85} cornerRadius={4} />
          <Text
            text={infoLines.join("\n")}
            width={170}
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
