export type ExtinguisherTypeDef = {
  id: string;
  name: string;
};

export type ExtinguisherPlacement = {
  id: string;
  x: number;
  y: number;
  extinguisherTypeId: string;
  /** Room or corridor this placement belongs to; used to cascade-delete when that structure is removed. */
  structureId: string;
  isAutoPlaced: boolean;
};
