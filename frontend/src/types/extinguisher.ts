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
};
