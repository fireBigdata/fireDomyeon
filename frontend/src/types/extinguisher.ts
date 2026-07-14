export type ExtinguisherTypeDef = {
  id: string;
  name: string;
  ability: number;
};

export type ExtinguisherPlacement = {
  id: string;
  x: number;
  y: number;
  extinguisherTypeId: string;
  /** Room this placement was auto-placed into; used to cascade-delete on room removal. */
  roomId: string;
};
