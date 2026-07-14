"use client";

import { useCallback, useEffect, useRef } from "react";
import { Circle, Group, Layer, Rect, Stage, Text, Transformer } from "react-konva";
import type Konva from "konva";
import type { ExtinguisherPlacement, Structure } from "@/types/floorplan";
import { CANVAS_BACKGROUND_COLOR } from "@/constants/canvas";
import StructureShape from "./StructureShape";

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;

type FloorPlanCanvasProps = {
  structures: Structure[];
  selectedStructureId: string | null;
  selectedPartitionId: string | null;
  extinguisherPlacements: ExtinguisherPlacement[];
  onSelect: (id: string | null) => void;
  onSelectPartition: (structureId: string, leafId: string) => void;
  onResizePartition: (structureId: string, splitId: string, ratio: number) => void;
  onChange: (id: string, changes: Partial<Structure>) => void;
};

export default function FloorPlanCanvas({
  structures,
  selectedStructureId,
  selectedPartitionId,
  extinguisherPlacements,
  onSelect,
  onSelectPartition,
  onResizePartition,
  onChange,
}: FloorPlanCanvasProps) {
  const transformerRef = useRef<Konva.Transformer>(null);
  const nodesRef = useRef<Map<string, Konva.Group>>(new Map());

  const registerNode = useCallback((id: string, node: Konva.Group | null) => {
    if (node) {
      nodesRef.current.set(id, node);
    } else {
      nodesRef.current.delete(id);
    }
  }, []);

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    const selectedNode = selectedStructureId
      ? nodesRef.current.get(selectedStructureId)
      : null;

    if (selectedNode) {
      transformer.nodes([selectedNode]);
    } else {
      transformer.nodes([]);
    }
    transformer.getLayer()?.batchDraw();
  }, [selectedStructureId, structures]);

  return (
    <Stage
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="rounded-md border border-gray-300 bg-white shadow-sm"
      onMouseDown={(e) => {
        if (e.target === e.target.getStage()) {
          onSelect(null);
        }
      }}
    >
      <Layer>
        <Rect
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          fill={CANVAS_BACKGROUND_COLOR}
          listening={false}
        />
        {structures.map((structure) => (
          <StructureShape
            key={structure.id}
            structure={structure}
            isSelected={structure.id === selectedStructureId}
            selectedPartitionId={
              structure.id === selectedStructureId ? selectedPartitionId : null
            }
            onSelect={onSelect}
            onSelectPartition={onSelectPartition}
            onResizePartition={onResizePartition}
            onChange={onChange}
            registerNode={registerNode}
          />
        ))}
        {extinguisherPlacements.map((placement) => (
          <Group key={placement.id} x={placement.x} y={placement.y} listening={false}>
            <Circle radius={10} fill="#dc2626" stroke="#7f1d1d" strokeWidth={1} />
            <Text
              text="소"
              width={20}
              height={20}
              offsetX={10}
              offsetY={10}
              align="center"
              verticalAlign="middle"
              fontSize={10}
              fill="#ffffff"
            />
          </Group>
        ))}
        <Transformer
          ref={transformerRef}
          rotateEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 10 || newBox.height < 10) {
              return oldBox;
            }
            return newBox;
          }}
        />
      </Layer>
    </Stage>
  );
}
