"use client";

import { Circle, Group, Rect, Text } from "react-konva";
import type Konva from "konva";
import { SprinklerHeadType, type SprinklerHead } from "@/types/floorplan";

type SprinklerHeadShapeProps = {
  head: SprinklerHead;
  isSelected: boolean;
  onToggleSelect: (id: string | null) => void;
};

// Each head type gets a distinct color/glyph so residential/standard/open
// heads installed side by side stay visually distinguishable, same
// convention as HeatDetectorShape's MARKER_BY_TYPE.
const MARKER_BY_TYPE: Record<SprinklerHeadType, { fill: string; stroke: string; glyph: string }> = {
  [SprinklerHeadType.STANDARD_CLOSED]: { fill: "#2563eb", stroke: "#1e3a8a", glyph: "표" },
  [SprinklerHeadType.RESIDENTIAL]: { fill: "#0891b2", stroke: "#155e75", glyph: "주" },
  [SprinklerHeadType.OPEN]: { fill: "#ea580c", stroke: "#9a3412", glyph: "개" },
};

const HEAD_TYPE_LABELS: Record<SprinklerHeadType, string> = {
  [SprinklerHeadType.STANDARD_CLOSED]: "표준형(폐쇄형)",
  [SprinklerHeadType.RESIDENTIAL]: "주거용",
  [SprinklerHeadType.OPEN]: "개방형",
};

export default function SprinklerHeadShape({
  head,
  isSelected,
  onToggleSelect,
}: SprinklerHeadShapeProps) {
  const handleToggle = (e: Konva.KonvaEventObject<Event>) => {
    e.cancelBubble = true;
    onToggleSelect(isSelected ? null : head.id);
  };

  const marker = MARKER_BY_TYPE[head.headType];

  const infoLines = [
    `스프링클러 헤드 (${HEAD_TYPE_LABELS[head.headType]})`,
    `수평거리 기준: ${head.horizontalDistanceM}m`,
    `배치 방식: ${head.isAutoPlaced ? "자동" : "수동"}`,
  ];

  return (
    <Group x={head.x} y={head.y}>
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
