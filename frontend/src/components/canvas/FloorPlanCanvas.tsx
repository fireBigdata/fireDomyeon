"use client";

import { useCallback, useEffect, useRef } from "react";
import { Layer, Rect, Stage, Transformer } from "react-konva";
import type Konva from "konva";
import type { Structure } from "@/types/floorplan";
import StructureShape from "./StructureShape";

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;

type FloorPlanCanvasProps = {
  structures: Structure[];
  selectedStructureId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (id: string, changes: Partial<Structure>) => void;
};

export default function FloorPlanCanvas({
  structures,
  selectedStructureId,
  onSelect,
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
          fill="#f9fafb"
          listening={false}
        />
        {structures.map((structure) => (
          <StructureShape
            key={structure.id}
            structure={structure}
            isSelected={structure.id === selectedStructureId}
            onSelect={onSelect}
            onChange={onChange}
            registerNode={registerNode}
          />
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
