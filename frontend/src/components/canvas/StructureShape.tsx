"use client";

import { Fragment, useRef, useEffect } from "react";
import { Group, Line, Rect, Text } from "react-konva";
import type Konva from "konva";
import type { Structure } from "@/types/floorplan";
import { STRUCTURE_DEFAULTS } from "@/constants/structureDefaults";

type StructureShapeProps = {
  structure: Structure;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onChange: (id: string, changes: Partial<Structure>) => void;
  registerNode: (id: string, node: Konva.Group | null) => void;
};

function StairsLines({ width, height }: { width: number; height: number }) {
  const stepCount = 5;
  const stepHeight = height / stepCount;

  return (
    <Fragment>
      {Array.from({ length: stepCount - 1 }, (_, index) => {
        const y = stepHeight * (index + 1);
        return (
          <Line
            key={y}
            points={[0, y, width, y]}
            stroke="#dc2626"
            strokeWidth={1}
          />
        );
      })}
    </Fragment>
  );
}

export default function StructureShape({
  structure,
  isSelected,
  onSelect,
  onChange,
  registerNode,
}: StructureShapeProps) {
  const groupRef = useRef<Konva.Group>(null);
  const defaults = STRUCTURE_DEFAULTS[structure.type];

  useEffect(() => {
    registerNode(structure.id, groupRef.current);
    return () => registerNode(structure.id, null);
  }, [structure.id, registerNode]);

  return (
    <Group
      ref={groupRef}
      x={structure.x}
      y={structure.y}
      rotation={structure.rotation ?? 0}
      draggable
      onClick={() => onSelect(structure.id)}
      onTap={() => onSelect(structure.id)}
      onDragEnd={(e) => {
        onChange(structure.id, { x: e.target.x(), y: e.target.y() });
      }}
      onTransformEnd={() => {
        const node = groupRef.current;
        if (!node) return;

        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);

        onChange(structure.id, {
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          width: Math.max(10, structure.width * scaleX),
          height: Math.max(10, structure.height * scaleY),
        });
      }}
    >
      <Rect
        width={structure.width}
        height={structure.height}
        fill={defaults.fill}
        stroke={isSelected ? "#111827" : defaults.stroke}
        strokeWidth={isSelected ? 2 : 1}
      />
      {structure.type === "stairs" && (
        <StairsLines width={structure.width} height={structure.height} />
      )}
      <Text
        text={defaults.label}
        width={structure.width}
        height={structure.height}
        align="center"
        verticalAlign="middle"
        fontSize={13}
        fill="#111827"
        listening={false}
      />
    </Group>
  );
}
