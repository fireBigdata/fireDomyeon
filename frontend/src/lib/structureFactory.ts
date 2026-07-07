import type { Structure, StructureType } from "@/types/floorplan";
import { STRUCTURE_DEFAULTS } from "@/constants/structureDefaults";

let counter = 0;

function nextId(): string {
  counter += 1;
  return `structure-${Date.now()}-${counter}`;
}

const SPAWN_STEP = 24;
const SPAWN_ORIGIN = { x: 40, y: 40 };
const SPAWN_WRAP = 5;

export function createStructure(
  type: StructureType,
  existingCount: number
): Structure {
  const defaults = STRUCTURE_DEFAULTS[type];
  const offset = existingCount % SPAWN_WRAP;

  return {
    id: nextId(),
    type,
    x: SPAWN_ORIGIN.x + offset * SPAWN_STEP,
    y: SPAWN_ORIGIN.y + offset * SPAWN_STEP,
    width: defaults.width,
    height: defaults.height,
    rotation: 0,
  };
}
